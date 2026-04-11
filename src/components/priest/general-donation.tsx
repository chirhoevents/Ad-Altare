'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

const PRESET_AMOUNTS = [25, 50, 100, 200];

interface GeneralDonationProps {
  onDonate: (amount: number) => void;
  stripeReady: boolean;
}

export function GeneralDonation({ onDonate, stripeReady }: GeneralDonationProps) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');

  if (!stripeReady) return null;

  function handleDonate() {
    const amount = selectedAmount ?? (customAmount ? Math.round(parseFloat(customAmount) * 100) : null);
    if (!amount || amount < 100) return;
    onDonate(amount);
  }

  return (
    <div className="bg-white border border-near-black/10 rounded-sm p-6 space-y-4">
      <h3 className="font-cormorant text-2xl font-semibold text-burgundy-800">
        General Fund
      </h3>
      <p className="font-inter text-sm text-near-black/60">
        Support Fr. Smith's ordination with a general contribution.
      </p>
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
        Donate to General Fund
      </Button>
    </div>
  );
}
