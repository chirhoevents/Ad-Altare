import { NextResponse } from 'next/server';
import { db } from '@/db';
import { priests, registryItems } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createDonationPaymentIntent } from '@/lib/stripe';
import { resolvePlatformFee } from '@/lib/fees';
import { z } from 'zod';
import { rateLimit, clientIp, TOO_MANY } from '@/lib/rate-limit';
import { verifyTurnstile, HUMAN_CHECK_FAILED } from '@/lib/turnstile';

const schema = z.object({
  priestId: z.string().uuid(),
  registryItemId: z.string().uuid().nullable().optional(),
  // Stripe's minimum charge is $0.50; we use $1. Max is Stripe's $999,999.99 limit.
  amountCents: z.number().int().min(100).max(99_999_999),
  donorName: z.string().max(200).optional().default(''),
  donorEmail: z.string().email(),
  donorAddress: z.string().max(500).optional().default(''),
  donorPhone: z.string().max(30).optional().default(''),
  isAnonymous: z.boolean().optional().default(false),
  turnstileToken: z.string().max(4096).optional(),
});

export async function POST(req: Request) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Donations are not available yet.' }, { status: 503 });
  }

  // Card-testing protection: a handful of attempts per visitor, then slow down.
  if (
    !(await rateLimit(req, 'payment-intent', { limit: 8, windowSeconds: 600 })) ||
    !(await rateLimit(req, 'payment-intent-day', { limit: 30, windowSeconds: 86400 }))
  ) {
    return NextResponse.json(TOO_MANY, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const amountIssue = parsed.error.issues.find((i) => i.path[0] === 'amountCents');
    const emailIssue = parsed.error.issues.find((i) => i.path[0] === 'donorEmail');
    const error = amountIssue
      ? 'Donation amount must be between $1 and $999,999.99.'
      : emailIssue
        ? 'Please enter a valid email address.'
        : 'Invalid input';
    return NextResponse.json({ error }, { status: 400 });
  }

  if (!(await verifyTurnstile(parsed.data.turnstileToken, clientIp(req)))) {
    return NextResponse.json(HUMAN_CHECK_FAILED, { status: 403 });
  }

  const {
    priestId,
    registryItemId,
    amountCents,
    donorName,
    donorEmail,
    donorAddress,
    donorPhone,
    isAnonymous,
  } = parsed.data;

  // Fetch priest
  const priest = await db.query.priests.findFirst({
    where: eq(priests.id, priestId),
  });

  if (!priest) {
    return NextResponse.json({ error: 'Priest not found' }, { status: 404 });
  }

  if (!priest.stripeAccountId || !priest.stripeOnboardingComplete) {
    return NextResponse.json(
      { error: 'This priest has not connected Stripe yet.' },
      { status: 400 }
    );
  }

  // Validate registry item if provided
  let itemName: string | null = null;
  if (registryItemId) {
    const item = await db.query.registryItems.findFirst({
      where: eq(registryItems.id, registryItemId),
    });
    if (!item || item.priestId !== priestId || !item.isActive) {
      return NextResponse.json({ error: 'Registry item not found' }, { status: 404 });
    }
    if (item.itemType !== 'campaign') {
      return NextResponse.json({ error: 'This item is purchased directly, not funded here.' }, { status: 400 });
    }
    itemName = item.name;
  }

  const { platformFee, amountNet, feePercentUsed } = resolvePlatformFee(amountCents, priest.platformFeeOverride);

  let paymentIntent;
  try {
    paymentIntent = await createDonationPaymentIntent({
      amountCents,
      // Pass null when fee is 0 — Stripe forbids application_fee_amount: 0
      platformFeeCents: platformFee > 0 ? platformFee : null,
      connectedAccountId: priest.stripeAccountId,
      metadata: {
        priestId,
        registryItemId: registryItemId ?? '',
        itemName: itemName ?? '',
        donorName: isAnonymous ? '' : donorName,
        donorEmail,
        donorAddress: isAnonymous ? '' : donorAddress,
        donorPhone: isAnonymous ? '' : donorPhone,
        isAnonymous: isAnonymous.toString(),
        platformFee: platformFee.toString(),
        amountNet: amountNet.toString(),
        feePercentUsed: feePercentUsed.toString(),
      },
    });
  } catch (err) {
    console.error('[payment-intent] Stripe error:', err);
    return NextResponse.json(
      { error: 'We could not start the payment. Please try again in a moment.' },
      { status: 502 }
    );
  }

  return NextResponse.json({ clientSecret: paymentIntent.client_secret });
}
