import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { recordSucceededPayment, recordRefund } from '@/lib/donations';

// Both Stripe endpoints (platform + connect) share the same idempotent handlers,
// so it is safe for Stripe to deliver an event to either or both, any number of times.
export async function POST(req: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET_CONNECT;
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET_CONNECT is not set');
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
    console.error('[connect webhook] signature verification failed:', message);
    return NextResponse.json({ error: `Webhook error: ${message}` }, { status: 400 });
  }

  try {
    if (event.type === 'payment_intent.succeeded') {
      await recordSucceededPayment(event.data.object as Stripe.PaymentIntent, 'connect webhook');
    } else if (event.type === 'charge.refunded') {
      await recordRefund(event.data.object as Stripe.Charge, 'connect webhook');
    }
  } catch (err) {
    // 500 makes Stripe retry later; the handlers are idempotent so retries are safe.
    console.error(`[connect webhook] failed to process ${event.type} ${event.id}:`, err);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
