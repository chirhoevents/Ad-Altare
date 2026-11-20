'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

const PRESET_AMOUNTS = [25, 50, 100, 200];

interface GeneralDonationProps {
  onDonate: (amount: number) => void;
  stripeReady: boolean;
  priestName: string;
}

export function GeneralDonation({ onDonate, stripeReady, priestName }: GeneralDonationProps) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [amountError, setAmountError] = useState<string | null>(null);

  function handleDonate() {
    const amount = selectedAmount ?? (customAmount ? Math.round(parseFloat(customAmount) * 100) : NaN);
    if (!Number.isFinite(amount) || amount < 100) {
      setAmountError('Please enter an amount of at least $1.');
      return;
    }
    setAmountError(null);
    onDonate(amount);
  }

  return (
    <div className="bg-white border border-near-black/10 rounded-sm p-6 space-y-4">
      <h3 className="font-cormorant text-2xl font-semibold text-burgundy-800">
        General Fund
      </h3>
      <p className="font-inter text-sm text-near-black/60">
        Support {priestName}&apos;s ordination with a general contribution.
      </p>

      {!stripeReady ? (
        <div className="space-y-2">
          <Button className="w-full" disabled variant="secondary">
            Registry Coming Soon
          </Button>
          <p className="font-inter text-xs text-near-black/40 text-center">
            This priest is still setting up their registry.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-2">
            {PRESET_AMOUNTS.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => {
                  setSelectedAmount(amt * 100);
                  setCustomAmount('');
                  setAmountError(null);
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
              step="0.01"
              onChange={(e) => {
                setCustomAmount(e.target.value);
                setSelectedAmount(null);
                setAmountError(null);
              }}
              className="w-full pl-7 pr-3 py-2 border border-near-black/20 rounded-sm text-sm font-inter focus:outline-none focus:ring-2 focus:ring-burgundy-800"
            />
          </div>
          {amountError && (
            <p className="text-red-600 text-xs font-inter">{amountError}</p>
          )}
          <Button
            onClick={handleDonate}
            className="w-full"
            disabled={!selectedAmount && !customAmount}
          >
            Donate to General Fund
          </Button>
        </div>
      )}
    </div>
  );
}
