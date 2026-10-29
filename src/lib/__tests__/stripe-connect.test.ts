import { beforeEach, describe, expect, it, vi } from 'vitest';

const accountsCreate = vi.hoisted(() => vi.fn(async (params: Record<string, unknown>) => ({ id: 'acct_test', ...params })));

vi.mock('stripe', () => ({
  default: vi.fn(() => ({ accounts: { create: accountsCreate } })),
}));

import { createStripeConnectAccount } from '@/lib/stripe';

describe('createStripeConnectAccount', () => {
  beforeEach(() => accountsCreate.mockClear());

  it('uses controller properties with Stripe as losses collector, not the legacy type field', async () => {
    await createStripeConnectAccount('priest@example.com', 'https://adaltare.com/p/fr-test');

    const params = accountsCreate.mock.calls[0][0];
    // Stripe rejects `type` when the platform would be the losses collector, and
    // rejects an Express dashboard unless the platform owns losses.
    expect(params).not.toHaveProperty('type');
    expect(params.controller).toEqual({
      stripe_dashboard: { type: 'full' },
      fees: { payer: 'account' },
      losses: { payments: 'stripe' },
      requirement_collection: 'stripe',
    });
  });

  it('pre-fills the priest profile URL and email', async () => {
    await createStripeConnectAccount('priest@example.com', 'https://adaltare.com/p/fr-test');

    const params = accountsCreate.mock.calls[0][0];
    expect(params.email).toBe('priest@example.com');
    expect(params.business_profile).toMatchObject({ url: 'https://adaltare.com/p/fr-test' });
  });
});
