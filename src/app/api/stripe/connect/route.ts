import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { priests } from '@/db/schema';
import { eq } from 'drizzle-orm';
import {
  createStripeExpressAccount,
  createAccountLink,
  getConnectedAccount,
} from '@/lib/stripe';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;

export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const priest = await db.query.priests.findFirst({
    where: eq(priests.clerkUserId, userId),
  });
  if (!priest) return NextResponse.json({ error: 'Priest not found' }, { status: 404 });

  let accountId = priest.stripeAccountId;

  // Create Stripe account if none exists
  if (!accountId) {
    const account = await createStripeExpressAccount(priest.email);
    accountId = account.id;

    await db
      .update(priests)
      .set({ stripeAccountId: accountId, updatedAt: new Date() })
      .where(eq(priests.clerkUserId, userId));
  }

  const refreshUrl = `${APP_URL}/dashboard/settings?stripe=refresh`;
  const returnUrl = `${APP_URL}/dashboard/settings?stripe=success`;

  const accountLink = await createAccountLink(accountId, refreshUrl, returnUrl);

  return NextResponse.json({ url: accountLink.url });
}

// Called after Stripe onboarding to verify completion
export async function PUT() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const priest = await db.query.priests.findFirst({
    where: eq(priests.clerkUserId, userId),
  });
  if (!priest?.stripeAccountId) {
    return NextResponse.json({ error: 'No Stripe account' }, { status: 400 });
  }

  const account = await getConnectedAccount(priest.stripeAccountId);
  const isComplete = account.charges_enabled && account.details_submitted;

  await db
    .update(priests)
    .set({ stripeOnboardingComplete: isComplete, updatedAt: new Date() })
    .where(eq(priests.clerkUserId, userId));

  return NextResponse.json({ stripeOnboardingComplete: isComplete });
}
