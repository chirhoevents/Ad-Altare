import { beforeEach, describe, expect, it, vi } from 'vitest';

const accountsCreate = vi.hoisted(() => vi.fn(async (params: Record<string, unknown>) => ({ id: 'acct_test', ...params })));

vi.mock('stripe', () => ({
  default: vi.fn(() => ({ accounts: { create: accountsCreate } })),
}));

import { createStripeExpressAccount } from '@/lib/stripe';

describe('createStripeExpressAccount', () => {
  beforeEach(() => accountsCreate.mockClear());

  it('uses controller properties with Stripe as losses collector, not the legacy type field', async () => {
    await createStripeExpressAccount('priest@example.com', 'https://adaltare.com/p/fr-test');

    const params = accountsCreate.mock.calls[0][0];
    // Stripe rejects `type` when the platform would be the losses collector.
    expect(params).not.toHaveProperty('type');
    expect(params.controller).toEqual({
      stripe_dashboard: { type: 'express' },
      fees: { payer: 'application' },
      losses: { payments: 'stripe' },
      requirement_collection: 'stripe',
    });
  });

  it('pre-fills the priest profile URL and email', async () => {
    await createStripeExpressAccount('priest@example.com', 'https://adaltare.com/p/fr-test');

    const params = accountsCreate.mock.calls[0][0];
    expect(params.email).toBe('priest@example.com');
    expect(params.business_profile).toMatchObject({ url: 'https://adaltare.com/p/fr-test' });
  });
});
