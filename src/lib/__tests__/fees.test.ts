import { describe, expect, it } from 'vitest';
import { resolvePlatformFee } from '@/lib/fees';

describe('resolvePlatformFee', () => {
  it('defaults to 1%, rounded down to the cent', () => {
    expect(resolvePlatformFee(10_000, null)).toEqual({ platformFee: 100, amountNet: 9_900, feePercentUsed: 1 });
    expect(resolvePlatformFee(199, undefined)).toEqual({ platformFee: 1, amountNet: 198, feePercentUsed: 1 });
  });

  it('can be waived', () => {
    expect(resolvePlatformFee(5_000, 0)).toEqual({ platformFee: 0, amountNet: 5_000, feePercentUsed: 0 });
  });

  it('supports a custom percentage', () => {
    expect(resolvePlatformFee(5_000, 3)).toEqual({ platformFee: 150, amountNet: 4_850, feePercentUsed: 3 });
  });
});
