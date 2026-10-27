/** Default platform fee, in percent, on gifts made through Stripe. */
export const DEFAULT_PLATFORM_FEE_PERCENT = 1;

/**
 * Platform fee for a gift. `override` is the priest's admin-set fee:
 * null/undefined = default 1%, 0 = waived, N = N%. Fees round down to the cent.
 */
export function resolvePlatformFee(amountCents: number, override: number | null | undefined) {
  const feePercentUsed = override ?? DEFAULT_PLATFORM_FEE_PERCENT;
  const platformFee = Math.floor((amountCents * feePercentUsed) / 100);
  return { platformFee, amountNet: amountCents - platformFee, feePercentUsed };
}
