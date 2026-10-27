import type Stripe from 'stripe';
import { revalidatePath } from 'next/cache';
import { eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import { donations, registryItems, priests } from '@/db/schema';
import {
  formatCurrency,
  applyMergeTagsToTemplate,
  escapeHtml,
  formatPriestNameForEmail,
  FALLBACK_THANK_YOU_TEMPLATE,
} from '@/lib/utils';
import {
  sendDonorConfirmationEmail,
  sendThankYouEmail,
  sendPriestNotificationEmail,
} from '@/lib/resend';

/**
 * Recompute a registry item's amount_raised from its donations (net of refunds).
 * Derived rather than incremented, so duplicate or retried webhook deliveries can
 * never inflate the total, and any past drift corrects itself.
 */
async function recomputeAmountRaised(registryItemId: string) {
  await db
    .update(registryItems)
    .set({
      amountRaised: sql`(
        select coalesce(sum(${donations.amountGross} - ${donations.amountRefunded}), 0)
        from ${donations}
        where ${donations.registryItemId} = ${registryItemId}
      )`,
    })
    .where(eq(registryItems.id, registryItemId));
}

/**
 * Record a successful donation from a payment_intent.succeeded event.
 * Safe to call any number of times for the same PaymentIntent: the row is
 * inserted once (unique stripe_payment_intent_id) and emails go out only on
 * that first insert.
 */
export async function recordSucceededPayment(pi: Stripe.PaymentIntent, logTag: string) {
  const meta = pi.metadata ?? {};
  // Gifts to Ad Altare itself (/support) — not a priest donation.
  if (meta.type === 'platform_support') return;
  const priestId = meta.priestId;
  const donorEmail = meta.donorEmail;

  // Not a donation created by Ad Altare — acknowledge and ignore so Stripe
  // doesn't keep retrying it.
  if (!priestId || !donorEmail) {
    console.warn(`[${logTag}] payment_intent ${pi.id} has no donation metadata; ignoring`);
    return;
  }

  const registryItemId = meta.registryItemId || null;
  const donorName = meta.donorName || null;
  const donorAddress = meta.donorAddress || null;
  const donorPhone = meta.donorPhone || null;
  const isAnonymous = meta.isAnonymous === 'true';
  const platformFee = parseInt(meta.platformFee ?? '0', 10);
  const amountNet = parseInt(meta.amountNet ?? '0', 10);
  const feePercentUsed = parseFloat(meta.feePercentUsed ?? '1');
  const amountGross = pi.amount_received || pi.amount;

  // No conflict target: works with the unique constraint in place (dedupes) and
  // degrades to a plain insert if the migration hasn't been applied yet.
  const inserted = await db
    .insert(donations)
    .values({
      priestId,
      registryItemId,
      stripePaymentIntentId: pi.id,
      amountGross,
      platformFee,
      amountNet,
      feePercentUsed,
      donorName: isAnonymous ? null : donorName,
      donorEmail,
      donorAddress: isAnonymous ? null : donorAddress,
      donorPhone: isAnonymous ? null : donorPhone,
      isAnonymous,
      thankYouSent: false,
    })
    .onConflictDoNothing()
    .returning({ id: donations.id });

  // Always resync the item total — a retry after a partial failure heals it.
  if (registryItemId) await recomputeAmountRaised(registryItemId);

  const priest = await db.query.priests.findFirst({ where: eq(priests.id, priestId) });
  if (priest) revalidatePath(`/p/${priest.slug}`);

  const donationId = inserted[0]?.id;
  if (!donationId) return; // already recorded — emails were sent the first time

  let itemName: string | null = meta.itemName || null;
  if (!itemName && registryItemId) {
    const item = await db.query.registryItems.findFirst({
      where: eq(registryItems.id, registryItemId),
    });
    itemName = item?.name ?? null;
  }

  const priestName = priest ? formatPriestNameForEmail(priest) : 'the priest';
  const amountFormatted = formatCurrency(amountGross);

  if (!isAnonymous) {
    await sendDonorConfirmationEmail({
      donorEmail,
      donorName,
      priestName,
      amountFormatted,
      itemName,
      isAnonymous: false,
    }).catch((err) => console.error(`[${logTag}] donor confirmation email failed:`, err));
  } else if (priest) {
    // Anonymous donors can't be thanked by name later, so send the priest's
    // thank-you template right away and mark it sent.
    const bodyText = applyMergeTagsToTemplate(priest.thankYouTemplate?.trim() || FALLBACK_THANK_YOU_TEMPLATE, {
      donor_name: 'Friend',
      item_name: itemName ?? undefined,
      priest_name: priestName,
      amount: amountFormatted,
    });
    const bodyHtml = bodyText
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => `<p style="margin-bottom:12px;">${escapeHtml(line)}</p>`)
      .join('');
    try {
      await sendThankYouEmail({
        donorEmail,
        subject: `Thank you for supporting ${priestName}'s ordination`,
        bodyHtml,
      });
      await db.update(donations).set({ thankYouSent: true }).where(eq(donations.id, donationId));
    } catch (err) {
      console.error(`[${logTag}] anonymous thank-you email failed:`, err);
    }
  }

  if (priest?.email) {
    await sendPriestNotificationEmail({
      priestEmail: priest.email,
      priestName,
      amountFormatted,
      donorDisplayName: isAnonymous ? 'Anonymous' : (donorName ?? 'A donor'),
      itemName,
    }).catch((err) => console.error(`[${logTag}] priest notification email failed:`, err));
  }
}

/**
 * Sync a refund (full or partial) from a charge.refunded event onto the
 * donation, then resync the item total so the progress bar drops accordingly.
 */
export async function recordRefund(charge: Stripe.Charge, logTag: string) {
  const piId = typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id;
  if (!piId) return;

  const [updated] = await db
    .update(donations)
    .set({ amountRefunded: charge.amount_refunded })
    .where(eq(donations.stripePaymentIntentId, piId))
    .returning({ registryItemId: donations.registryItemId, priestId: donations.priestId });

  if (!updated) {
    console.warn(`[${logTag}] refund for unknown payment_intent ${piId}; ignoring`);
    return;
  }

  if (updated.registryItemId) await recomputeAmountRaised(updated.registryItemId);

  const priest = await db.query.priests.findFirst({
    where: eq(priests.id, updated.priestId),
    columns: { slug: true },
  });
  if (priest) revalidatePath(`/p/${priest.slug}`);
}
