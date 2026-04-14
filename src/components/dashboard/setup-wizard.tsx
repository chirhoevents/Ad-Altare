'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { X, CreditCard, Eye, ChevronDown, ChevronUp, Lock } from 'lucide-react';

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
  const [showStripeGuide, setShowStripeGuide] = useState(true);

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
                  {showStripeGuide ? 'Hide setup guide' : 'What to expect — read before connecting'}
                </button>

                {showStripeGuide && (
                  <div className="mt-3 border border-burgundy-100 bg-burgundy-50 rounded-sm overflow-hidden">
                    {/* Guide header */}
                    <div className="px-4 py-3 border-b border-burgundy-100">
                      <p className="font-inter text-xs font-medium text-burgundy-900">
                        Before you connect your bank account, here&apos;s what Stripe will ask you.
                      </p>
                      <p className="font-inter text-xs text-burgundy-800/60 mt-0.5">
                        Don&apos;t worry — this takes about 5 minutes.
                      </p>
                    </div>

                    {/* Steps */}
                    <div className="divide-y divide-burgundy-100">
                      {/* Step 1 */}
                      <div className="px-4 py-3 flex gap-3">
                        <div className="w-5 h-5 rounded-full bg-burgundy-800 text-cream font-inter text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                          1
                        </div>
                        <div>
                          <p className="font-inter text-xs font-semibold text-near-black uppercase tracking-wide">
                            Account Type
                          </p>
                          <ul className="mt-1 space-y-1">
                            <li className="font-inter text-xs text-near-black/70 flex gap-1.5">
                              <span className="text-gold-600 shrink-0">→</span>
                              Select <strong>&ldquo;Individual&rdquo;</strong> (not Business)
                            </li>
                            <li className="font-inter text-xs text-near-black/60 flex gap-1.5">
                              <span className="text-gold-600 shrink-0">→</span>
                              You are receiving personal gifts &amp; donations, not operating a business
                            </li>
                          </ul>
                        </div>
                      </div>

                      {/* Step 2 */}
                      <div className="px-4 py-3 flex gap-3">
                        <div className="w-5 h-5 rounded-full bg-burgundy-800 text-cream font-inter text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                          2
                        </div>
                        <div>
                          <p className="font-inter text-xs font-semibold text-near-black uppercase tracking-wide">
                            Personal Information
                          </p>
                          <ul className="mt-1 space-y-1">
                            <li className="font-inter text-xs text-near-black/70 flex gap-1.5">
                              <span className="text-gold-600 shrink-0">→</span>
                              Legal first and last name (as it appears on your ID)
                            </li>
                            <li className="font-inter text-xs text-near-black/70 flex gap-1.5">
                              <span className="text-gold-600 shrink-0">→</span>
                              Date of birth &amp; home address
                            </li>
                            <li className="font-inter text-xs text-near-black/70 flex gap-1.5">
                              <span className="text-gold-600 shrink-0">→</span>
                              <span>
                                <strong>Last 4 digits of SSN</strong> — required by law to verify your
                                identity. Secure and encrypted.
                              </span>
                            </li>
                          </ul>
                        </div>
                      </div>

                      {/* Step 3 */}
                      <div className="px-4 py-3 flex gap-3">
                        <div className="w-5 h-5 rounded-full bg-burgundy-800 text-cream font-inter text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                          3
                        </div>
                        <div>
                          <p className="font-inter text-xs font-semibold text-near-black uppercase tracking-wide">
                            Bank Account
                          </p>
                          <ul className="mt-1 space-y-1">
                            <li className="font-inter text-xs text-near-black/70 flex gap-1.5">
                              <span className="text-gold-600 shrink-0">→</span>
                              Routing number + account number (personal checking)
                            </li>
                            <li className="font-inter text-xs text-near-black/60 flex gap-1.5">
                              <span className="text-gold-600 shrink-0">→</span>
                              This is where your donations will be deposited
                            </li>
                          </ul>
                        </div>
                      </div>

                      {/* Step 4 */}
                      <div className="px-4 py-3 flex gap-3">
                        <div className="w-5 h-5 rounded-full bg-burgundy-800 text-cream font-inter text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                          4
                        </div>
                        <div>
                          <p className="font-inter text-xs font-semibold text-near-black uppercase tracking-wide">
                            Phone Number
                          </p>
                          <ul className="mt-1 space-y-1">
                            <li className="font-inter text-xs text-near-black/70 flex gap-1.5">
                              <span className="text-gold-600 shrink-0">→</span>
                              Stripe will send a verification code to confirm your identity
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Security note */}
                    <div className="px-4 py-2.5 bg-burgundy-100/50 flex items-start gap-2">
                      <Lock className="w-3 h-3 text-burgundy-700 shrink-0 mt-0.5" />
                      <p className="font-inter text-xs text-burgundy-800">
                        Your information is encrypted and stored securely by Stripe.
                        Ad Altare never sees or stores your banking information.
                      </p>
                    </div>
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
