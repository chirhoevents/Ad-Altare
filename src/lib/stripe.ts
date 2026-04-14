import Stripe from 'stripe';

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2024-04-10',
      typescript: true,
    });
  }
  return _stripe;
}

// Convenience alias for backwards compat with route imports
export const stripe = new Proxy({} as Stripe, {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get(_target, prop) {
    return (getStripe() as any)[prop];
  },
});

export async function createStripeExpressAccount(email: string): Promise<Stripe.Account> {
  return getStripe().accounts.create({
    type: 'express',
    country: 'US',
    email,
    business_type: 'individual',
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    settings: {
      payouts: {
        schedule: {
          interval: 'daily',
        },
      },
    },
  });
}

export async function createAccountLink(
  accountId: string,
  refreshUrl: string,
  returnUrl: string
): Promise<Stripe.AccountLink> {
  return getStripe().accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: 'account_onboarding',
  });
}

export async function getConnectedAccount(accountId: string): Promise<Stripe.Account> {
  return getStripe().accounts.retrieve(accountId);
}

export async function createDonationPaymentIntent({
  amountCents,
  platformFeeCents,
  connectedAccountId,
  metadata,
}: {
  amountCents: number;
  platformFeeCents: number | null; // null = fee waived; Stripe forbids passing 0
  connectedAccountId: string;
  metadata: Record<string, string>;
}): Promise<Stripe.PaymentIntent> {
  return getStripe().paymentIntents.create({
    amount: amountCents,
    currency: 'usd',
    // on_behalf_of makes the connected account the merchant of record so that
    // Stripe's processing fee (2.9% + 30¢) is charged to the priest, not the platform.
    on_behalf_of: connectedAccountId,
    // Omit application_fee_amount entirely when fee is waived (Stripe rejects 0)
    ...(platformFeeCents !== null && { application_fee_amount: platformFeeCents }),
    transfer_data: {
      destination: connectedAccountId,
    },
    metadata,
    automatic_payment_methods: {
      enabled: true,
    },
  });
}
