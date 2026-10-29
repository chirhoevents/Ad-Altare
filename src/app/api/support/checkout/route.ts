import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getStripe } from '@/lib/stripe';
import { rateLimit, clientIp, TOO_MANY } from '@/lib/rate-limit';
import { verifyTurnstile, HUMAN_CHECK_FAILED } from '@/lib/turnstile';

const schema = z.object({
  // $1 – $10,000
  amountCents: z.number().int().min(100).max(1_000_000),
  turnstileToken: z.string().max(4096).optional(),
});

/**
 * One-time gift to support Ad Altare itself (servers, development). Goes to the
 * platform's own Stripe account via hosted Checkout — not to any priest.
 */
export async function POST(req: Request) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Giving is not available yet.' }, { status: 503 });
  }
  if (!(await rateLimit(req, 'support-checkout', { limit: 5, windowSeconds: 600 }))) {
    return NextResponse.json(TOO_MANY, { status: 429 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Please choose an amount between $1 and $10,000.' }, { status: 400 });
  }

  if (!(await verifyTurnstile(parsed.data.turnstileToken, clientIp(req)))) {
    return NextResponse.json(HUMAN_CHECK_FAILED, { status: 403 });
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;
  try {
    const session = await getStripe().checkout.sessions.create({
      mode: 'payment',
      submit_type: 'donate',
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: parsed.data.amountCents,
            product_data: {
              name: 'Support Ad Altare',
              description: 'A gift toward the costs of running Ad Altare.',
            },
          },
        },
      ],
      // Tagged so the donation webhook ignores it (it's not a priest donation).
      payment_intent_data: { metadata: { type: 'platform_support' } },
      metadata: { type: 'platform_support' },
      success_url: `${origin}/support?thanks=1`,
      cancel_url: `${origin}/support`,
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('[support/checkout] Stripe error:', err);
    return NextResponse.json({ error: 'Could not start checkout. Please try again.' }, { status: 502 });
  }
}
