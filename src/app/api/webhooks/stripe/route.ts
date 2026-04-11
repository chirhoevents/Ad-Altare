import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { db } from '@/db';
import { donations, registryItems, priests } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { formatCurrency } from '@/lib/utils';
import { sendDonorConfirmationEmail, sendPriestNotificationEmail } from '@/lib/resend';

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
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

    // Fetch priest for email
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

    const priestName = priest ? `${priest.firstName} ${priest.lastName}` : 'the priest';
    const amountFormatted = formatCurrency(amountGross);
    const donorDisplayName = isAnonymous ? 'Anonymous' : (donorName ?? 'A donor');

    // Send donor confirmation
    if (donorEmail) {
      await sendDonorConfirmationEmail({
        donorEmail,
        donorName: donorName,
        priestName,
        amountFormatted,
        itemName,
        isAnonymous,
      }).catch(console.error);
    }

    // Send priest notification
    if (priest?.email) {
      await sendPriestNotificationEmail({
        priestEmail: priest.email,
        priestName,
        amountFormatted,
        donorDisplayName,
        itemName,
      }).catch(console.error);
    }
  }

  return NextResponse.json({ received: true });
}
