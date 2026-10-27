'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

const PRESETS = [5, 10, 25, 50];

export function SupportForm() {
  const [selected, setSelected] = useState<number | null>(5);
  const [custom, setCustom] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amountCents = selected !== null ? selected * 100 : Math.round(parseFloat(custom || '0') * 100);

  async function give() {
    if (!amountCents || amountCents < 100) {
      setError('Please choose an amount of at least $1.');
      return;
    }
    setLoading(true);
    setError(null);
    const res = await fetch('/api/support/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amountCents }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.url) {
      window.location.href = data.url;
    } else {
      setError(data.error ?? 'Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="bg-white border border-near-black/10 rounded-sm p-6 space-y-4">
      <div className="grid grid-cols-4 gap-2">
        {PRESETS.map((amt) => (
          <button
            key={amt}
            type="button"
            onClick={() => { setSelected(amt); setCustom(''); }}
            className={`py-3 text-sm font-inter rounded-sm border transition-colors ${
              selected === amt
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
          min="1"
          placeholder="Other amount"
          value={custom}
          onChange={(e) => { setCustom(e.target.value); setSelected(null); }}
          className="w-full pl-7 pr-3 py-2 border border-near-black/20 rounded-sm text-sm font-inter focus:outline-none focus:ring-2 focus:ring-burgundy-800"
        />
      </div>
      {error && <p className="font-inter text-sm text-red-600">{error}</p>}
      <Button onClick={give} disabled={loading} size="lg" className="w-full">
        {loading ? 'Opening secure checkout…' : `Give${amountCents >= 100 ? ` $${(amountCents / 100).toFixed(amountCents % 100 ? 2 : 0)}` : ''}`}
      </Button>
      <p className="font-inter text-xs text-near-black/40 text-center">Secure payment by Stripe.</p>
    </div>
  );
}
