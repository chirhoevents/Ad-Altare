import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { db } from '@/db';
import { donations, registryItems, priests } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { formatCurrency, applyMergeTagsToTemplate } from '@/lib/utils';
import {
  sendDonorConfirmationEmail,
  sendThankYouEmail,
  sendPriestNotificationEmail,
} from '@/lib/resend';

export async function POST(req: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
  }

  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Stripe webhook signature verification failed:', message);
    return NextResponse.json({ error: `Webhook error: ${message}` }, { status: 400 });
  }

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object as Stripe.PaymentIntent;
    const meta = pi.metadata;

    const priestId = meta.priestId;
    const registryItemId = meta.registryItemId || null;
    const donorName = meta.donorName || null;
    const donorEmail = meta.donorEmail;
    const donorAddress = meta.donorAddress || null;
    const donorPhone = meta.donorPhone || null;
    const isAnonymous = meta.isAnonymous === 'true';
    const platformFee = parseInt(meta.platformFee ?? '0', 10);
    const amountNet = parseInt(meta.amountNet ?? '0', 10);
    const amountGross = pi.amount;

    if (!priestId || !donorEmail) {
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
    }

    // Idempotency: skip if already recorded
    const existing = await db.query.donations.findFirst({
      where: eq(donations.stripePaymentIntentId, pi.id),
    });
    if (existing) {
      return NextResponse.json({ received: true });
    }

    // Insert donation
    await db.insert(donations).values({
      priestId,
      registryItemId: registryItemId || null,
      stripePaymentIntentId: pi.id,
      amountGross,
      platformFee,
      amountNet,
      donorName: isAnonymous ? null : donorName,
      donorEmail,
      donorAddress: isAnonymous ? null : donorAddress,
      donorPhone: isAnonymous ? null : donorPhone,
      isAnonymous,
      thankYouSent: false,
    });

    // Update amount_raised on registry item
    if (registryItemId) {
      await db
        .update(registryItems)
        .set({
          amountRaised: sql`${registryItems.amountRaised} + ${amountGross}`,
        })
        .where(eq(registryItems.id, registryItemId));
    }

    // Fetch priest for email + cache revalidation
    const priest = await db.query.priests.findFirst({
      where: eq(priests.id, priestId),
    });

    // Fetch item name
    let itemName: string | null = null;
    if (registryItemId) {
      const item = await db.query.registryItems.findFirst({
        where: eq(registryItems.id, registryItemId),
      });
      itemName = item?.name ?? null;
    }

    // Revalidate public page so donation totals update immediately
    if (priest) {
      revalidatePath(`/p/${priest.slug}`);
    }

    const priestName = priest ? `${priest.firstName} ${priest.lastName}` : 'the priest';
    const amountFormatted = formatCurrency(amountGross);
    const donorDisplayName = isAnonymous ? 'Anonymous' : (donorName ?? 'A donor');

    // Donor email
    if (!isAnonymous) {
      await sendDonorConfirmationEmail({
        donorEmail,
        donorName,
        priestName,
        amountFormatted,
        itemName,
        isAnonymous: false,
      }).catch((err) => console.error('[webhook] donor confirmation email failed:', err));
    } else if (priest) {
      // Anonymous — send priest's custom thank-you template immediately
      const template =
        priest.thankYouTemplate ??
        `Dear {donor_name},\n\nThank you for your generous support of Fr. {priest_name}'s ordination.\n\nIn Christ,\nFr. {priest_name}`;
      const bodyText = applyMergeTagsToTemplate(template, {
        donor_name: 'Friend',
        item_name: itemName ?? undefined,
        priest_name: priestName,
        amount: amountFormatted,
      });
      const bodyHtml = bodyText
        .split('\n')
        .filter((line) => line.trim())
        .map((line) => `<p style="margin-bottom:12px;">${line}</p>`)
        .join('');
      await sendThankYouEmail({
        donorEmail,
        subject: `Thank you for supporting Fr. ${priestName}'s ordination`,
        bodyHtml,
      }).catch((err) => console.error('[webhook] anonymous thank-you email failed:', err));
    }

    // Priest notification
    if (priest?.email) {
      await sendPriestNotificationEmail({
        priestEmail: priest.email,
        priestName,
        amountFormatted,
        donorDisplayName,
        itemName,
      }).catch((err) => console.error('[webhook] priest notification email failed:', err));
    }
  }

  return NextResponse.json({ received: true });
}
