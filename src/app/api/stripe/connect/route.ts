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

export async function POST() {
  // Guard: env vars must be present
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: 'Stripe is not configured. Add STRIPE_SECRET_KEY to your Vercel environment variables.' },
      { status: 503 }
    );
  }
  if (!process.env.NEXT_PUBLIC_APP_URL) {
    return NextResponse.json(
      { error: 'NEXT_PUBLIC_APP_URL is not set. Add it to your Vercel environment variables (e.g. https://ad-altare.com).' },
      { status: 503 }
    );
  }

  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const priest = await db.query.priests.findFirst({
    where: eq(priests.clerkUserId, userId),
  });
  if (!priest) return NextResponse.json({ error: 'Priest not found' }, { status: 404 });

  let accountId = priest.stripeAccountId;

  try {
    // Create Stripe account if none exists
    if (!accountId) {
      const account = await createStripeExpressAccount(priest.email);
      accountId = account.id;

      await db
        .update(priests)
        .set({ stripeAccountId: accountId, updatedAt: new Date() })
        .where(eq(priests.clerkUserId, userId));
    }

    const APP_URL = process.env.NEXT_PUBLIC_APP_URL;
    const refreshUrl = `${APP_URL}/dashboard/settings?stripe=refresh`;
    const returnUrl = `${APP_URL}/dashboard/settings?stripe=complete`;

    const accountLink = await createAccountLink(accountId, refreshUrl, returnUrl);
    return NextResponse.json({ url: accountLink.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Stripe error';
    console.error('[stripe/connect]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
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

  try {
    const account = await getConnectedAccount(priest.stripeAccountId);
    const isComplete = account.charges_enabled && account.details_submitted;

    await db
      .update(priests)
      .set({ stripeOnboardingComplete: isComplete, updatedAt: new Date() })
      .where(eq(priests.clerkUserId, userId));

    return NextResponse.json({ stripeOnboardingComplete: isComplete });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Stripe error';
    console.error('[stripe/connect PUT]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
