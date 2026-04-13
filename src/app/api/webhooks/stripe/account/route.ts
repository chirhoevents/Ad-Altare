import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { db } from '@/db';
import { priests } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET_ACCOUNT;
  if (!secret) {
    console.error('STRIPE_WEBHOOK_SECRET_ACCOUNT is not set');
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
    console.error('Account webhook signature verification failed:', message);
    return new Response(`Webhook error: ${message}`, { status: 400 });
  }

  if (event.type === 'account.updated') {
    const account = event.data.object as Stripe.Account;

    if (account.charges_enabled) {
      await db
        .update(priests)
        .set({ stripeOnboardingComplete: true })
        .where(eq(priests.stripeAccountId, account.id));
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
