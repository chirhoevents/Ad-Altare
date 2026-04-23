'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, CheckCircle, AlertCircle, ChevronDown, ChevronUp, Lock } from 'lucide-react';

interface PriestSettings {
  thankYouTemplate: string | null;
  profileVisible: boolean;
  slug: string;
  stripeAccountId: string | null;
  stripeOnboardingComplete: boolean;
}

export function SettingsClient() {
  const searchParams = useSearchParams();
  const stripeStatus = searchParams.get('stripe');

  const [settings, setSettings] = useState<PriestSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [connectingStripe, setConnectingStripe] = useState(false);
  const [stripeError, setStripeError] = useState<string | null>(null);
  const [showStripeGuide, setShowStripeGuide] = useState(true);
  const [saveMessage, setSaveMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const fetchSettings = useCallback(async () => {
    const res = await fetch('/api/settings');
    if (res.ok) setSettings(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  useEffect(() => {
    if (stripeStatus === 'complete') {
      fetch('/api/stripe/connect', { method: 'PUT' }).then(() => fetchSettings());
    }
  }, [stripeStatus, fetchSettings]);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setSettings((prev) => prev ? { ...prev, [e.target.name]: e.target.value } : prev);
  }

  function handleToggleVisible() {
    setSettings((prev) => prev ? { ...prev, profileVisible: !prev.profileVisible } : prev);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setSaveMessage(null);

    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        thankYouTemplate: settings.thankYouTemplate,
        profileVisible: settings.profileVisible,
      }),
    });

    if (res.ok) {
      setSaveMessage({ ok: true, text: 'Settings saved.' });
    } else {
      const data = await res.json().catch(() => ({}));
      setSaveMessage({ ok: false, text: data.error ?? 'Failed to save.' });
    }
    setSaving(false);
  }

  async function handleStripeConnect() {
    setConnectingStripe(true);
    setStripeError(null);
    const res = await fetch('/api/stripe/connect', { method: 'POST' });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      window.location.href = data.url;
    } else {
      setStripeError(data.error ?? 'Something went wrong. Please try again.');
      setConnectingStripe(false);
    }
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-8 text-center">
        <p className="font-inter text-sm text-near-black/40">Loading…</p>
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="font-cormorant text-4xl font-light text-burgundy-800">Settings</h1>
        <p className="font-inter text-sm text-near-black/50 mt-1">
          Thank-you template, public page, and Stripe connection.
        </p>
      </div>

      {stripeStatus === 'complete' && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-sm px-5 py-4 flex items-start gap-3">
          <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-inter text-sm font-medium text-green-800">You&apos;re almost set!</p>
            <p className="font-inter text-sm text-green-700 mt-0.5">
              Stripe is verifying your information. This usually takes a few minutes.
              Once approved, donations will be deposited to your bank account daily.
            </p>
          </div>
        </div>
      )}

      {stripeStatus === 'refresh' && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-sm px-5 py-4 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="font-inter text-sm text-amber-800">
              Your session expired before finishing. Please try connecting again.
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={handleStripeConnect} disabled={connectingStripe}>
            {connectingStripe ? 'Redirecting…' : 'Try Again'}
          </Button>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">

        {/* Thank You Template */}
        <section className="bg-white border border-near-black/10 rounded-sm p-6">
          <h2 className="font-cormorant text-2xl text-burgundy-800 mb-2">Thank-You Email Template</h2>
          <p className="font-inter text-xs text-near-black/40 mb-1">
            Used when you send a personal thank-you to a donor. Merge tags:
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            {['{donor_name}', '{amount}', '{item_name}', '{priest_name}'].map((tag) => (
              <code key={tag} className="font-mono text-xs bg-near-black/5 px-2 py-0.5 rounded-sm text-near-black/60">
                {tag}
              </code>
            ))}
          </div>
          <Textarea
            name="thankYouTemplate"
            value={settings.thankYouTemplate ?? ''}
            onChange={handleChange}
            rows={8}
            className="font-mono text-sm"
          />
          <p className="font-inter text-xs text-near-black/30 mt-2">
            For anonymous donors, <code>{'{donor_name}'}</code> will be replaced with &ldquo;Dear Friend&rdquo;.
          </p>
        </section>

        {/* Public Page */}
        <section className="bg-white border border-near-black/10 rounded-sm p-6">
          <h2 className="font-cormorant text-2xl text-burgundy-800 mb-3">Public Page</h2>
          <div className="flex items-center gap-3">
            <code className="font-inter text-sm text-near-black/60 bg-near-black/5 px-3 py-1.5 rounded-sm flex-1 truncate">
              /p/{settings.slug}
            </code>
            <Button asChild size="sm" variant="outline">
              <a href={`/p/${settings.slug}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-3.5 h-3.5 mr-1" />
                Open
              </a>
            </Button>
          </div>
          <p className="font-inter text-xs text-near-black/30 mt-2">
            Your URL slug is set automatically and cannot be changed.
          </p>

          {/* Directory visibility */}
          <div className="mt-5 pt-5 border-t border-near-black/10 flex items-start justify-between gap-4">
            <div>
              <p className="font-inter text-sm font-medium text-near-black">Show in public directory</p>
              <p className="font-inter text-xs text-near-black/40 mt-0.5">
                Appear on the{' '}
                <a href="/directory" target="_blank" className="underline hover:text-near-black/70">
                  /directory
                </a>{' '}
                page so donors can discover your registry. Your page is always accessible via direct link regardless of this setting.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.profileVisible}
              onClick={handleToggleVisible}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-burgundy-800 focus:ring-offset-2 ${
                settings.profileVisible ? 'bg-burgundy-800' : 'bg-near-black/20'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                  settings.profileVisible ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </section>

        {/* Save */}
        <div className="flex items-center gap-4">
          <Button type="submit" size="lg" disabled={saving}>
            {saving ? 'Saving…' : 'Save Settings'}
          </Button>
          {saveMessage && (
            <div className={`flex items-center gap-2 text-sm font-inter ${saveMessage.ok ? 'text-green-600' : 'text-red-600'}`}>
              {saveMessage.ok ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {saveMessage.text}
            </div>
          )}
        </div>
      </form>

      {/* Stripe Connect */}
      <div className="mt-8 bg-white border border-near-black/10 rounded-sm p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
          <div>
            <h2 className="font-cormorant text-2xl text-burgundy-800 mb-1">Stripe Connect</h2>
            <p className="font-inter text-sm text-near-black/50">
              Connect a bank account to receive donations directly.
            </p>
          </div>
          {settings.stripeOnboardingComplete ? (
            <Badge variant="success" className="gap-1.5">
              <CheckCircle className="w-3 h-3" />
              Connected &amp; Active
            </Badge>
          ) : settings.stripeAccountId ? (
            <Badge variant="muted" className="gap-1.5">
              <AlertCircle className="w-3 h-3" />
              Onboarding Incomplete
            </Badge>
          ) : (
            <Badge variant="muted">Not Connected</Badge>
          )}
        </div>

        {!settings.stripeOnboardingComplete && (
          <div className="mb-5">
            <button
              type="button"
              onClick={() => setShowStripeGuide((v) => !v)}
              className="flex items-center gap-2 font-inter text-sm font-medium text-burgundy-800 hover:text-burgundy-900 transition-colors"
            >
              {showStripeGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {showStripeGuide ? 'Hide setup guide' : 'What to expect — read before connecting'}
            </button>

            {showStripeGuide && (
              <div className="mt-3 border border-burgundy-100 bg-burgundy-50 rounded-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-burgundy-100">
                  <p className="font-cormorant text-lg text-burgundy-900 font-light">
                    Before you connect your bank account, here&apos;s what Stripe will ask you.
                  </p>
                  <p className="font-inter text-xs text-burgundy-800/60 mt-0.5">
                    Don&apos;t worry — this takes about 5 minutes.
                  </p>
                </div>
                <div className="divide-y divide-burgundy-100">
                  {[
                    {
                      n: 1, title: 'Account Type',
                      items: ['Select "Individual" (not Business)'],
                    },
                    {
                      n: 2, title: 'Business Details',
                      subtitle: "this is normal, don't worry",
                      items: [
                        'Industry: select "Charities or social service organizations"',
                        'Website: your Ad Altare page URL is already pre-filled — just click Continue',
                      ],
                    },
                    {
                      n: 3, title: 'Personal Information',
                      items: [
                        'Legal name (as on your ID), date of birth, home address',
                        'Last 4 digits of SSN — required by federal law to receive payments. Encrypted and stored only by Stripe.',
                      ],
                    },
                    {
                      n: 4, title: 'Bank Account',
                      items: [
                        'Personal checking: routing number + account number',
                        'Donations will be deposited here daily',
                      ],
                    },
                    {
                      n: 5, title: 'Phone Verification',
                      items: ['Stripe texts you a verification code — enter it to finish'],
                    },
                  ].map(({ n, title, subtitle, items }) => (
                    <div key={n} className="px-5 py-4 flex gap-4">
                      <div className="w-6 h-6 rounded-full bg-burgundy-800 text-cream font-inter text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {n}
                      </div>
                      <div>
                        <p className="font-inter text-sm font-semibold text-near-black uppercase tracking-wide">
                          {title}
                          {subtitle && (
                            <span className="normal-case font-normal text-near-black/40 text-xs ml-2">
                              — {subtitle}
                            </span>
                          )}
                        </p>
                        <ul className="mt-1.5 space-y-1.5">
                          {items.map((item, i) => (
                            <li key={i} className="font-inter text-xs text-near-black/70 flex gap-2">
                              <span className="text-gold-600 shrink-0">→</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-5 py-3 bg-burgundy-100/50 flex items-start gap-2.5">
                  <Lock className="w-3.5 h-3.5 text-burgundy-700 shrink-0 mt-0.5" />
                  <p className="font-inter text-xs text-burgundy-800 leading-relaxed">
                    Your information is encrypted and stored securely by Stripe.
                    Ad Altare never sees or stores your banking information.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-4 flex-wrap">
          <Button
            type="button"
            size="sm"
            variant={settings.stripeOnboardingComplete ? 'outline' : 'gold'}
            onClick={handleStripeConnect}
            disabled={connectingStripe}
          >
            {connectingStripe
              ? 'Redirecting to Stripe…'
              : settings.stripeOnboardingComplete
              ? 'Manage Stripe Account'
              : settings.stripeAccountId
              ? 'Continue Onboarding →'
              : 'Connect Bank Account →'}
          </Button>
          {!settings.stripeOnboardingComplete && (
            <p className="font-inter text-xs text-near-black/40">
              You will be taken to Stripe&apos;s secure site. Return here when finished.
            </p>
          )}
        </div>

        {stripeError && (
          <div className="mt-3 bg-red-50 border border-red-200 rounded-sm px-4 py-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p className="font-inter text-sm text-red-700">{stripeError}</p>
          </div>
        )}

        <p className="font-inter text-xs text-near-black/30 mt-4">
          Ad Altare retains 1% of each donation as a platform fee; Stripe retains their processing fee (~2.9% + 30¢). You receive the remainder.
        </p>
      </div>
    </div>
  );
}
