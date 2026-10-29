import { beforeEach, describe, expect, it, vi } from 'vitest';
import type Stripe from 'stripe';

// ─── In-memory stand-ins for the database, email and cache layers ────────────

const state = vi.hoisted(() => ({
  insertReturns: [] as { id: string }[], // [] simulates "already recorded" (ON CONFLICT DO NOTHING)
  insertedValues: [] as Record<string, unknown>[],
  updates: [] as Record<string, unknown>[],
  refundReturns: [] as { registryItemId: string | null; priestId: string }[],
}));

vi.mock('@/db', () => {
  const update = vi.fn(() => ({
    set: (values: Record<string, unknown>) => {
      state.updates.push(values);
      const done = Promise.resolve(undefined);
      return {
        where: () => Object.assign(done, { returning: () => Promise.resolve(state.refundReturns) }),
      };
    },
  }));
  const insert = vi.fn(() => ({
    values: (values: Record<string, unknown>) => {
      state.insertedValues.push(values);
      return { onConflictDoNothing: () => ({ returning: () => Promise.resolve(state.insertReturns) }) };
    },
  }));
  return {
    db: {
      insert,
      update,
      query: {
        priests: {
          findFirst: vi.fn(async () => ({
            id: 'priest-1',
            slug: 'john-smith',
            firstName: 'John',
            lastName: 'Smith',
            email: 'john@example.com',
            currentTitle: 'Father',
            ordinationDate: null,
            thankYouTemplate: 'Dear {donor_name},\nThanks!\nFr. {priest_name}',
          })),
        },
        registryItems: { findFirst: vi.fn(async () => ({ name: 'Chalice' })) },
      },
    },
  };
});

const emails = vi.hoisted(() => ({
  sendDonorConfirmationEmail: vi.fn(async (_args: Record<string, unknown>) => {}),
  sendThankYouEmail: vi.fn(async (_args: { bodyHtml: string }) => {}),
  sendPriestNotificationEmail: vi.fn(async (_args: Record<string, unknown>) => {}),
}));
vi.mock('@/lib/resend', () => emails);
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

import { recordRefund, recordSucceededPayment } from '@/lib/donations';

function paymentIntent(metadata: Record<string, string>): Stripe.PaymentIntent {
  return { id: 'pi_123', amount: 5000, amount_received: 5000, metadata } as unknown as Stripe.PaymentIntent;
}

const donationMeta = {
  priestId: 'priest-1',
  registryItemId: 'item-1',
  itemName: 'Chalice',
  donorName: 'Mary',
  donorEmail: 'mary@example.com',
  isAnonymous: 'false',
  platformFee: '50',
  amountNet: '4950',
  feePercentUsed: '1',
};

beforeEach(() => {
  state.insertReturns = [];
  state.insertedValues = [];
  state.updates = [];
  state.refundReturns = [];
  vi.clearAllMocks();
});

describe('recordSucceededPayment', () => {
  it('records a new donation and sends the donor + priest emails once', async () => {
    state.insertReturns = [{ id: 'donation-1' }];
    await recordSucceededPayment(paymentIntent(donationMeta), 'test');

    expect(state.insertedValues[0]).toMatchObject({
      stripePaymentIntentId: 'pi_123',
      amountGross: 5000,
      platformFee: 50,
      amountNet: 4950,
      feePercentUsed: 1,
      donorName: 'Mary',
    });
    expect(emails.sendDonorConfirmationEmail).toHaveBeenCalledTimes(1);
    expect(emails.sendDonorConfirmationEmail.mock.calls[0][0]).toMatchObject({ priestName: 'Fr. John Smith' });
    expect(emails.sendPriestNotificationEmail).toHaveBeenCalledTimes(1);
    // item total is recomputed from donations (not incremented)
    expect(state.updates.some((u) => 'amountRaised' in u)).toBe(true);
  });

  it('on a duplicate delivery: no new emails, but the item total is still resynced', async () => {
    state.insertReturns = []; // conflict — already recorded
    await recordSucceededPayment(paymentIntent(donationMeta), 'test');

    expect(emails.sendDonorConfirmationEmail).not.toHaveBeenCalled();
    expect(emails.sendPriestNotificationEmail).not.toHaveBeenCalled();
    expect(state.updates.some((u) => 'amountRaised' in u)).toBe(true);
  });

  it('sends anonymous donors the thank-you note and marks it sent, without "Fr. Fr."', async () => {
    state.insertReturns = [{ id: 'donation-2' }];
    await recordSucceededPayment(paymentIntent({ ...donationMeta, isAnonymous: 'true', donorName: '' }), 'test');

    expect(state.insertedValues[0]).toMatchObject({ isAnonymous: true, donorName: null });
    expect(emails.sendDonorConfirmationEmail).not.toHaveBeenCalled();
    const thankYou = emails.sendThankYouEmail.mock.calls[0][0];
    expect(thankYou.bodyHtml).toContain('Dear Friend');
    expect(thankYou.bodyHtml).toContain('Fr. John Smith');
    expect(thankYou.bodyHtml).not.toContain('Fr. Fr.');
    expect(state.updates).toContainEqual({ thankYouSent: true });
  });

  it('ignores Support Ad Altare gifts and payments without donation metadata', async () => {
    await recordSucceededPayment(paymentIntent({ type: 'platform_support' }), 'test');
    await recordSucceededPayment(paymentIntent({}), 'test');
    expect(state.insertedValues).toHaveLength(0);
    expect(emails.sendDonorConfirmationEmail).not.toHaveBeenCalled();
  });
});

describe('recordRefund', () => {
  it('stores the refunded amount and resyncs the item total', async () => {
    state.refundReturns = [{ registryItemId: 'item-1', priestId: 'priest-1' }];
    await recordRefund({ payment_intent: 'pi_123', amount_refunded: 2500 } as unknown as Stripe.Charge, 'test');

    expect(state.updates).toContainEqual({ amountRefunded: 2500 });
    expect(state.updates.some((u) => 'amountRaised' in u)).toBe(true);
  });
});
