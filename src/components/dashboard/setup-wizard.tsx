'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { X, CreditCard, Eye } from 'lucide-react';

interface SetupWizardProps {
  stripeConnected: boolean;
  profileVisible: boolean;
  slug: string;
}

export function SetupWizard({ stripeConnected, profileVisible, slug }: SetupWizardProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [togglingVisible, setTogglingVisible] = useState(false);
  const [isVisible, setIsVisible] = useState(profileVisible);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeError, setStripeError] = useState<string | null>(null);

  // Show on every dashboard load until Stripe is connected
  useEffect(() => {
    if (!stripeConnected) setOpen(true);
  }, [stripeConnected]);

  if (!open) return null;

  async function handleMakePublic() {
    if (isVisible) return;
    setTogglingVisible(true);
    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileVisible: true }),
    });
    if (res.ok) {
      setIsVisible(true);
      router.refresh();
    }
    setTogglingVisible(false);
  }

  async function handleStripe() {
    setStripeLoading(true);
    setStripeError(null);
    const res = await fetch('/api/stripe/connect', { method: 'POST' });
    const data = await res.json();
    if (res.ok) {
      window.location.href = data.url;
    } else {
      setStripeError(data.error ?? 'Something went wrong. Please try again.');
      setStripeLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-near-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-sm shadow-2xl w-full max-w-md border border-near-black/10">
        {/* Header */}
        <div className="bg-burgundy-900 px-6 py-5 rounded-t-sm flex items-start justify-between gap-4">
          <div>
            <h2 className="font-cormorant text-2xl text-cream font-light">
              Welcome to Ad Altare
            </h2>
            <p className="font-inter text-xs text-cream/60 mt-1">
              Two quick steps before you start receiving support
            </p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="text-cream/40 hover:text-cream mt-0.5"
            aria-label="Skip for now"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Steps */}
        <div className="px-6 py-5 space-y-4">
          {/* Step 1 — Stripe */}
          <div className="border border-near-black/10 rounded-sm p-4 flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-burgundy-800 text-cream flex items-center justify-center shrink-0 mt-0.5">
              <CreditCard className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <p className="font-inter text-sm font-medium text-near-black">
                Connect Stripe to receive donations
              </p>
              <p className="font-inter text-xs text-near-black/50 mt-0.5">
                Donors can see your registry but cannot give until your bank account is linked.
              </p>
              <Button size="sm" className="mt-3 bg-burgundy-800 hover:bg-burgundy-900 text-cream" onClick={handleStripe} disabled={stripeLoading}>
                {stripeLoading ? 'Redirecting to Stripe…' : 'Connect Bank Account'}
              </Button>
              {stripeError && (
                <p className="mt-2 font-inter text-xs text-red-600">{stripeError}</p>
              )}
            </div>
          </div>

          {/* Step 2 — Make profile public */}
          <div className="border border-near-black/10 rounded-sm p-4 flex items-start gap-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${isVisible ? 'bg-green-600' : 'bg-near-black/20'} text-white`}>
              <Eye className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <p className="font-inter text-sm font-medium text-near-black">
                {isVisible ? 'Your profile is listed in the directory' : 'Show your profile in the public directory'}
              </p>
              <p className="font-inter text-xs text-near-black/50 mt-0.5">
                Your page at{' '}
                <a href={`/p/${slug}`} target="_blank" rel="noopener noreferrer" className="underline">
                  /p/{slug}
                </a>{' '}
                is always shareable via link — this also lists you in the Find a Priest directory.
              </p>
              {!isVisible && (
                <Button size="sm" variant="outline" className="mt-3" onClick={handleMakePublic} disabled={togglingVisible}>
                  {togglingVisible ? 'Saving…' : 'Make Public'}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex justify-end">
          <button
            onClick={() => setOpen(false)}
            className="font-inter text-xs text-near-black/40 hover:text-near-black"
          >
            Skip for now — remind me next time
          </button>
        </div>
      </div>
    </div>
  );
}
