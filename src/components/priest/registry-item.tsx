'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import type { RegistryItem } from '@/db/schema';

interface RegistryItemCardProps {
  item: RegistryItem;
  priestFirstName: string;
  onDonate: (item: RegistryItem, amount: number) => void;
  stripeReady: boolean;
}

export function RegistryItemCard({ item, priestFirstName, onDonate, stripeReady }: RegistryItemCardProps) {
  const [customAmount, setCustomAmount] = useState('');

  // ── Wishlist item rendering ──────────────────────────────────────────────
  if (item.itemType === 'wishlist') {
    return (
      <div className="bg-white border border-near-black/10 rounded-sm overflow-hidden">
        {item.imageUrl && (
          <div className="relative w-full h-48 bg-near-black/5">
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill
              className="object-cover"
            />
          </div>
        )}
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <h3 className="font-cormorant text-2xl font-semibold text-burgundy-800">
                {item.name}
              </h3>
              {item.category && (
                <span className="font-inter text-xs uppercase tracking-widest text-near-black/40 mt-0.5 block">
                  {item.category}
                </span>
              )}
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <Badge variant="muted">Wishlist</Badge>
              {item.isPurchased && <Badge variant="gold">Purchased</Badge>}
            </div>
          </div>

          {item.description && (
            <p className="font-inter text-sm text-near-black/60 mb-4 leading-relaxed">
              {item.description}
            </p>
          )}

          {/* Estimated price */}
          {item.goalAmount > 0 && (
            <div className="mb-4">
              <span className="font-inter text-xs uppercase tracking-widest text-near-black/40">Est. Price</span>
              <p className="font-cormorant text-xl text-burgundy-800 mt-0.5">{formatCurrency(item.goalAmount)}</p>
            </div>
          )}

          {/* Purchase button */}
          {item.isPurchased ? (
            <Button className="w-full" disabled variant="secondary">
              Already Purchased
            </Button>
          ) : item.externalUrl ? (
            <a
              href={item.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full"
            >
              <Button className="w-full">
                View &amp; Purchase →
              </Button>
            </a>
          ) : (
            <p className="font-inter text-sm text-near-black/30 italic text-center py-2">
              Link coming soon
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── Campaign item rendering ──────────────────────────────────────────────
  const pct = Math.min(100, Math.round((item.amountRaised / item.goalAmount) * 100));
  const isFunded = item.amountRaised >= item.goalAmount;
  const remaining = item.goalAmount - item.amountRaised;
  const hasStarted = item.amountRaised > 0;

  function handleFullyFund() {
    if (isFunded) return;
    onDonate(item, remaining);
  }

  function handleCustomDonate() {
    const amount = customAmount ? Math.round(parseFloat(customAmount) * 100) : null;
    if (!amount || amount < 100) return;
    onDonate(item, amount);
  }

  return (
    <div className="bg-white border border-near-black/10 rounded-sm overflow-hidden">
      {item.imageUrl && (
        <div className="relative w-full h-48 bg-near-black/5">
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            className="object-cover"
          />
        </div>
      )}
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <h3 className="font-cormorant text-2xl font-semibold text-burgundy-800">
              {item.name}
            </h3>
            {item.category && (
              <span className="font-inter text-xs uppercase tracking-widest text-near-black/40 mt-0.5 block">
                {item.category}
              </span>
            )}
          </div>
          {isFunded ? (
            <Badge variant="gold" className="shrink-0">Fully Funded</Badge>
          ) : (
            <Badge variant="muted" className="shrink-0">{pct}% funded</Badge>
          )}
        </div>

        {item.description && (
          <p className="font-inter text-sm text-near-black/60 mb-4 leading-relaxed">
            {item.description}
          </p>
        )}

        {/* Progress */}
        <div className="mb-4">
          <Progress
            value={pct}
            className="mb-2"
            indicatorClassName={isFunded ? 'bg-gold-600' : 'bg-burgundy-800'}
          />
          <div className="flex justify-between text-xs font-inter text-near-black/50">
            {isFunded ? (
              <span className="text-gold-600 font-medium">
                Fully Funded · {formatCurrency(item.amountRaised)} raised of {formatCurrency(item.goalAmount)} goal
              </span>
            ) : (
              <>
                <span>{formatCurrency(item.amountRaised)} raised</span>
                <span>Goal: {formatCurrency(item.goalAmount)}</span>
              </>
            )}
          </div>
        </div>

        {/* Donate controls */}
        {stripeReady ? (
          <div className="space-y-3">
            {/* Fully Fund button */}
            {isFunded ? (
              <>
                <Button className="w-full" disabled variant="secondary">
                  Fully Funded ✓
                </Button>
                <p className="font-inter text-xs text-near-black/50 italic text-center">
                  This item is fully funded — consider a gift to the General Fund below.
                </p>
              </>
            ) : (
              <Button onClick={handleFullyFund} className="w-full">
                {hasStarted
                  ? `Fully Fund (${formatCurrency(remaining)} remaining)`
                  : `Fully Fund (${formatCurrency(item.goalAmount)})`}
              </Button>
            )}

            {/* Custom amount */}
            {!isFunded && (
              <>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-near-black/40 text-sm">$</span>
                  <input
                    type="number"
                    placeholder="Or enter a custom amount"
                    value={customAmount}
                    min="1"
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 border border-near-black/20 rounded-sm text-sm font-inter focus:outline-none focus:ring-2 focus:ring-burgundy-800"
                  />
                </div>
                <Button
                  onClick={handleCustomDonate}
                  className="w-full"
                  variant="outline"
                  disabled={!customAmount}
                >
                  Donate Custom Amount
                </Button>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <Button className="w-full" disabled variant="secondary">
              Registry Coming Soon
            </Button>
            <p className="font-inter text-xs text-near-black/40 text-center">
              This priest is still setting up their registry.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
