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

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET_CONNECT;
  if (!secret) {
    console.error('STRIPE_WEBHOOK_SECRET_CONNECT is not set');
    return new Response('Webhook not configured', { status: 503 });
  }

  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig) {
    return new Response('Missing stripe-signature header', { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Connect webhook signature verification failed:', message);
    return new Response(`Webhook error: ${message}`, { status: 400 });
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
    const amountReceived = pi.amount_received ?? pi.amount;

    if (!priestId || !donorEmail) {
      console.error('Connect webhook: missing priestId or donorEmail in metadata', meta);
      return new Response('Missing metadata', { status: 400 });
    }

    // Idempotency: skip if already recorded
    const existing = await db.query.donations.findFirst({
      where: eq(donations.stripePaymentIntentId, pi.id),
    });
    if (existing) {
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 1. Insert donation record
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

    // 2. Update amount_raised on registry item using amount_received
    if (registryItemId) {
      await db
        .update(registryItems)
        .set({
          amountRaised: sql`${registryItems.amountRaised} + ${amountReceived}`,
        })
        .where(eq(registryItems.id, registryItemId));
    }

    // Fetch priest and item name for emails + cache revalidation
    const priest = await db.query.priests.findFirst({
      where: eq(priests.id, priestId),
    });

    let itemName: string | null = meta.itemName || null;
    if (!itemName && registryItemId) {
      const item = await db.query.registryItems.findFirst({
        where: eq(registryItems.id, registryItemId),
      });
      itemName = item?.name ?? null;
    }

    if (priest) {
      revalidatePath(`/p/${priest.slug}`);
    }

    const priestName = priest ? `${priest.firstName} ${priest.lastName}` : 'the priest';
    const amountFormatted = formatCurrency(amountGross);
    const donorDisplayName = isAnonymous ? 'Anonymous' : (donorName ?? 'A donor');

    // 3 & 5. Donor email
    if (!isAnonymous) {
      await sendDonorConfirmationEmail({
        donorEmail,
        donorName,
        priestName,
        amountFormatted,
        itemName,
        isAnonymous: false,
      }).catch((err) => console.error('[connect webhook] donor confirmation email failed:', err));
    } else if (priest) {
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
      }).catch((err) => console.error('[connect webhook] anonymous thank-you email failed:', err));
    }

    // 4. Priest notification
    if (priest?.email) {
      await sendPriestNotificationEmail({
        priestEmail: priest.email,
        priestName,
        amountFormatted,
        donorDisplayName,
        itemName,
      }).catch((err) => console.error('[connect webhook] priest notification email failed:', err));
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
