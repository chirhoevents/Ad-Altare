'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { X, CreditCard, Eye, ChevronDown, ChevronUp } from 'lucide-react';

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
  const [showStripeGuide, setShowStripeGuide] = useState(false);

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
      <div className="bg-white rounded-sm shadow-2xl w-full max-w-lg border border-near-black/10 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-burgundy-900 px-6 py-5 rounded-t-sm flex items-start justify-between gap-4 sticky top-0">
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
          <div className="border border-near-black/10 rounded-sm p-4">
            <div className="flex items-start gap-4">
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

                {/* What to expect guide */}
                <button
                  type="button"
                  onClick={() => setShowStripeGuide((v) => !v)}
                  className="flex items-center gap-1 mt-2 font-inter text-xs text-burgundy-800 hover:underline"
                >
                  {showStripeGuide ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  {showStripeGuide ? 'Hide setup guide' : 'What will Stripe ask me?'}
                </button>

                {showStripeGuide && (
                  <div className="mt-3 bg-burgundy-50 border border-burgundy-100 rounded-sm px-4 py-3 space-y-2">
                    <p className="font-inter text-xs font-semibold text-burgundy-900 uppercase tracking-wider">
                      Have these ready before you click:
                    </p>
                    <ul className="font-inter text-xs text-near-black/70 space-y-1.5">
                      <li className="flex gap-2">
                        <span className="text-gold-600 shrink-0">1.</span>
                        <span><strong>Business type:</strong> Select <em>"Individual"</em> (not a company) unless you have a registered ministry entity.</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-gold-600 shrink-0">2.</span>
                        <span><strong>Legal name &amp; date of birth:</strong> Exactly as on your government ID.</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-gold-600 shrink-0">3.</span>
                        <span><strong>SSN (last 4 digits):</strong> Stripe uses this to verify your identity. Most individuals only need the last 4.</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-gold-600 shrink-0">4.</span>
                        <span><strong>Home address:</strong> Your current mailing address.</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-gold-600 shrink-0">5.</span>
                        <span><strong>Bank account:</strong> Routing number + account number from a check or your online banking app. This is where donations will be deposited.</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-gold-600 shrink-0">6.</span>
                        <span><strong>Phone number:</strong> For two-factor verification with Stripe.</span>
                      </li>
                    </ul>
                    <p className="font-inter text-xs text-near-black/50 pt-1 border-t border-burgundy-200">
                      Stripe is a secure, PCI-compliant payment processor trusted by millions. Your information goes directly to Stripe — Ad Altare never sees your SSN or bank details.
                    </p>
                  </div>
                )}

                <Button
                  size="sm"
                  className="mt-3 bg-burgundy-800 hover:bg-burgundy-900 text-cream"
                  onClick={handleStripe}
                  disabled={stripeLoading}
                >
                  {stripeLoading ? 'Redirecting to Stripe…' : 'Connect Bank Account →'}
                </Button>
                {stripeError && (
                  <p className="mt-2 font-inter text-xs text-red-600">{stripeError}</p>
                )}
              </div>
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
