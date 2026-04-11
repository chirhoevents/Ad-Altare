'use client';

import { useState } from 'react';
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

const PRESET_AMOUNTS = [25, 50, 100, 200];

export function RegistryItemCard({ item, priestFirstName, onDonate, stripeReady }: RegistryItemCardProps) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');

  const pct = Math.min(100, Math.round((item.amountRaised / item.goalAmount) * 100));
  const isFunded = item.amountRaised >= item.goalAmount;

  function handleDonate() {
    const amount = selectedAmount ?? (customAmount ? Math.round(parseFloat(customAmount) * 100) : null);
    if (!amount || amount < 100) return;
    onDonate(item, amount);
  }

  return (
    <div className="bg-white border border-near-black/10 rounded-sm overflow-hidden">
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
            {isFunded && (
              <p className="font-inter text-xs text-near-black/50 italic">
                This item has been fully funded! Any additional gifts will go directly to Fr. {priestFirstName}.
              </p>
            )}
            <div className="grid grid-cols-4 gap-2">
              {PRESET_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  onClick={() => {
                    setSelectedAmount(amt * 100);
                    setCustomAmount('');
                  }}
                  className={`py-2 text-sm font-inter rounded-sm border transition-colors ${
                    selectedAmount === amt * 100
                      ? 'bg-burgundy-800 text-cream border-burgundy-800'
                      : 'border-near-black/20 text-near-black hover:border-burgundy-800/50'
                  }`}
                >
                  ${amt}
                </button>
              ))}
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-near-black/40 text-sm">$</span>
              <input
                type="number"
                placeholder="Custom amount"
                value={customAmount}
                min="1"
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  setSelectedAmount(null);
                }}
                className="w-full pl-7 pr-3 py-2 border border-near-black/20 rounded-sm text-sm font-inter focus:outline-none focus:ring-2 focus:ring-burgundy-800"
              />
            </div>
            <Button
              onClick={handleDonate}
              className="w-full"
              disabled={!selectedAmount && !customAmount}
            >
              {isFunded ? 'Give an Additional Gift →' : 'Donate to this Item'}
            </Button>
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
