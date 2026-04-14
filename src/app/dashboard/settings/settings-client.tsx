'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, CheckCircle, AlertCircle, Upload, X, ChevronDown, ChevronUp, Lock } from 'lucide-react';

interface PriestSettings {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  seminary: string | null;
  diocese: string | null;
  parish: string | null;
  ordinationDate: string | null;
  firstMassDate: string | null;
  bio: string | null;
  profilePhotoUrl: string | null;
  backgroundPhotoUrl: string | null;
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
  const [showStripeGuide, setShowStripeGuide] = useState(true);
  const [saveMessage, setSaveMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingBackdrop, setUploadingBackdrop] = useState(false);
  const profileInputRef = useRef<HTMLInputElement>(null);
  const backdropInputRef = useRef<HTMLInputElement>(null);

  const fetchSettings = useCallback(async () => {
    const res = await fetch('/api/settings');
    if (res.ok) {
      const data = await res.json();
      setSettings(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (stripeStatus === 'complete') {
      fetch('/api/stripe/connect', { method: 'PUT' }).then(() => fetchSettings());
    }
  }, [stripeStatus, fetchSettings]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setSettings((prev) => prev ? { ...prev, [e.target.name]: e.target.value } : prev);
  }

  async function handlePhotoUpload(
    file: File,
    field: 'profilePhotoUrl' | 'backgroundPhotoUrl',
    setUploading: (v: boolean) => void,
  ) {
    setUploading(true);
    const body = new FormData();
    body.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body });
    if (res.ok) {
      const { url } = await res.json();
      // Update local state
      setSettings((prev) => prev ? { ...prev, [field]: url } : prev);
      // Auto-save immediately so it shows on the public page right away
      await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: url }),
      });
      setSaveMessage({ ok: true, text: 'Photo saved.' });
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? 'Upload failed. Please try again.');
    }
    setUploading(false);
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
      body: JSON.stringify({ ...settings, profileVisible: settings.profileVisible }),
    });

    if (res.ok) {
      setSaveMessage({ ok: true, text: 'Settings saved successfully.' });
    } else {
      const data = await res.json();
      setSaveMessage({ ok: false, text: data.error ?? 'Failed to save.' });
    }
    setSaving(false);
  }

  async function handleStripeConnect() {
    setConnectingStripe(true);
    const res = await fetch('/api/stripe/connect', { method: 'POST' });
    if (res.ok) {
      const { url } = await res.json();
      window.location.href = url;
    } else {
      setConnectingStripe(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <p className="font-inter text-sm text-near-black/40">Loading…</p>
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="font-cormorant text-4xl font-light text-burgundy-800">Settings</h1>
        <p className="font-inter text-sm text-near-black/50 mt-1">
          Manage your profile, photos, and Stripe connection.
        </p>
      </div>

      {stripeStatus === 'complete' && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-sm px-5 py-4 flex items-start gap-3">
          <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-inter text-sm font-medium text-green-800">
              You&apos;re almost set!
            </p>
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
        {/* Profile */}
        <section className="bg-white border border-near-black/10 rounded-sm p-6">
          <h2 className="font-cormorant text-2xl text-burgundy-800 mb-5">Profile</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" name="firstName" value={settings.firstName} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" name="lastName" value={settings.lastName} onChange={handleChange} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" type="tel" value={settings.phone ?? ''} onChange={handleChange} placeholder="(555) 555-5555" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="seminary">Seminary</Label>
                <Input id="seminary" name="seminary" value={settings.seminary ?? ''} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="diocese">Diocese</Label>
                <Input id="diocese" name="diocese" value={settings.diocese ?? ''} onChange={handleChange} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="parish">Parish</Label>
              <Input id="parish" name="parish" value={settings.parish ?? ''} onChange={handleChange} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ordinationDate">Ordination Date</Label>
                <Input id="ordinationDate" name="ordinationDate" type="date" value={settings.ordinationDate ?? ''} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="firstMassDate">First Mass Date</Label>
                <Input id="firstMassDate" name="firstMassDate" type="date" value={settings.firstMassDate ?? ''} onChange={handleChange} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Biography</Label>
              <Textarea
                id="bio"
                name="bio"
                value={settings.bio ?? ''}
                onChange={handleChange}
                rows={6}
                placeholder="Share your vocation story, your journey to the priesthood, and what this ordination means to you…"
              />
            </div>
          </div>
        </section>

        {/* Photos */}
        <section className="bg-white border border-near-black/10 rounded-sm p-6">
          <h2 className="font-cormorant text-2xl text-burgundy-800 mb-1">Photos</h2>
          <p className="font-inter text-xs text-near-black/40 mb-5">
            Upload a profile photo and a backdrop image for your public page. Max 8 MB each — JPEG, PNG, or WebP.
          </p>
          <div className="space-y-6">
            {/* Profile Photo */}
            <div>
              <Label className="mb-2 block">Profile Photo</Label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full border-2 border-near-black/10 bg-near-black/5 overflow-hidden shrink-0 flex items-center justify-center">
                  {settings.profilePhotoUrl ? (
                    <Image src={settings.profilePhotoUrl} alt="Profile" width={80} height={80} className="object-cover w-full h-full" />
                  ) : (
                    <span className="font-cormorant text-2xl text-near-black/30">
                      {settings.firstName?.[0]}{settings.lastName?.[0]}
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <input
                    ref={profileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handlePhotoUpload(f, 'profilePhotoUrl', setUploadingProfile);
                      e.target.value = '';
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={uploadingProfile}
                    onClick={() => profileInputRef.current?.click()}
                  >
                    <Upload className="w-3.5 h-3.5 mr-1.5" />
                    {uploadingProfile ? 'Uploading…' : 'Upload Photo'}
                  </Button>
                  {settings.profilePhotoUrl && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                      onClick={() => setSettings((prev) => prev ? { ...prev, profilePhotoUrl: null } : prev)}
                    >
                      <X className="w-3.5 h-3.5 mr-1.5" />
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Backdrop Photo */}
            <div>
              <Label className="mb-2 block">Backdrop / Header Photo</Label>
              <div className="rounded-sm border-2 border-near-black/10 bg-near-black/5 overflow-hidden h-28 w-full relative mb-2">
                {settings.backgroundPhotoUrl ? (
                  <Image src={settings.backgroundPhotoUrl} alt="Backdrop" fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="font-inter text-xs text-near-black/30">No backdrop set — default will be used</span>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  ref={backdropInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handlePhotoUpload(f, 'backgroundPhotoUrl', setUploadingBackdrop);
                    e.target.value = '';
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={uploadingBackdrop}
                  onClick={() => backdropInputRef.current?.click()}
                >
                  <Upload className="w-3.5 h-3.5 mr-1.5" />
                  {uploadingBackdrop ? 'Uploading…' : 'Upload Backdrop'}
                </Button>
                {settings.backgroundPhotoUrl && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                    onClick={() => setSettings((prev) => prev ? { ...prev, backgroundPhotoUrl: null } : prev)}
                  >
                    <X className="w-3.5 h-3.5 mr-1.5" />
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>

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
            For anonymous donors, <code>{'{donor_name}'}</code> will be replaced with "Dear Friend".
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
                Appear on the <a href="/directory" target="_blank" className="underline hover:text-near-black/70">/directory</a> page so donors can discover your registry. Your page is always accessible via direct link regardless of this setting.
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
              Connected & Active
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

        {/* Pre-connect guide — only shown until fully connected */}
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
                {/* Guide header */}
                <div className="px-5 py-4 border-b border-burgundy-100">
                  <p className="font-cormorant text-lg text-burgundy-900 font-light">
                    Before you connect your bank account, here&apos;s what Stripe will ask you.
                  </p>
                  <p className="font-inter text-xs text-burgundy-800/60 mt-0.5">
                    Don&apos;t worry — this takes about 5 minutes.
                  </p>
                </div>

                {/* Steps */}
                <div className="divide-y divide-burgundy-100">
                  {/* Step 1 */}
                  <div className="px-5 py-4 flex gap-4">
                    <div className="w-6 h-6 rounded-full bg-burgundy-800 text-cream font-inter text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </div>
                    <div>
                      <p className="font-inter text-sm font-semibold text-near-black uppercase tracking-wide">
                        Account Type
                      </p>
                      <p className="font-inter text-xs text-near-black/60 mt-1 leading-relaxed">
                        When Stripe asks <em>"What type of account is this?"</em>
                      </p>
                      <ul className="mt-1.5 space-y-1">
                        <li className="font-inter text-xs text-near-black/70 flex gap-2">
                          <span className="text-gold-600 shrink-0">→</span>
                          Select <strong>"Individual"</strong> (not Business)
                        </li>
                        <li className="font-inter text-xs text-near-black/60 flex gap-2">
                          <span className="text-gold-600 shrink-0">→</span>
                          You are receiving personal gifts &amp; donations, not operating a business
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="px-5 py-4 flex gap-4">
                    <div className="w-6 h-6 rounded-full bg-burgundy-800 text-cream font-inter text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </div>
                    <div>
                      <p className="font-inter text-sm font-semibold text-near-black uppercase tracking-wide">
                        Personal Information
                      </p>
                      <ul className="mt-1.5 space-y-1">
                        <li className="font-inter text-xs text-near-black/70 flex gap-2">
                          <span className="text-gold-600 shrink-0">→</span>
                          Legal first and last name (as it appears on your ID)
                        </li>
                        <li className="font-inter text-xs text-near-black/70 flex gap-2">
                          <span className="text-gold-600 shrink-0">→</span>
                          Date of birth
                        </li>
                        <li className="font-inter text-xs text-near-black/70 flex gap-2">
                          <span className="text-gold-600 shrink-0">→</span>
                          Home address (your seminary address is fine)
                        </li>
                        <li className="font-inter text-xs text-near-black/70 flex gap-2">
                          <span className="text-gold-600 shrink-0">→</span>
                          <span>
                            <strong>Last 4 digits of SSN</strong> — Stripe requires this by law to
                            verify your identity for any account receiving money. It is secure and
                            encrypted.
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="px-5 py-4 flex gap-4">
                    <div className="w-6 h-6 rounded-full bg-burgundy-800 text-cream font-inter text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </div>
                    <div>
                      <p className="font-inter text-sm font-semibold text-near-black uppercase tracking-wide">
                        Bank Account
                      </p>
                      <ul className="mt-1.5 space-y-1">
                        <li className="font-inter text-xs text-near-black/70 flex gap-2">
                          <span className="text-gold-600 shrink-0">→</span>
                          Your personal checking account routing number
                        </li>
                        <li className="font-inter text-xs text-near-black/70 flex gap-2">
                          <span className="text-gold-600 shrink-0">→</span>
                          Your personal checking account number
                        </li>
                        <li className="font-inter text-xs text-near-black/60 flex gap-2">
                          <span className="text-gold-600 shrink-0">→</span>
                          This is where your registry donations will be deposited
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="px-5 py-4 flex gap-4">
                    <div className="w-6 h-6 rounded-full bg-burgundy-800 text-cream font-inter text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      4
                    </div>
                    <div>
                      <p className="font-inter text-sm font-semibold text-near-black uppercase tracking-wide">
                        Phone Number
                      </p>
                      <ul className="mt-1.5 space-y-1">
                        <li className="font-inter text-xs text-near-black/70 flex gap-2">
                          <span className="text-gold-600 shrink-0">→</span>
                          Stripe will send a verification code to confirm your identity
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Security note */}
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

        <p className="font-inter text-xs text-near-black/30 mt-4">
          Ad Altare retains 1% of each donation as a platform fee; Stripe retains their processing fee (~2.9% + 30¢). You receive the remainder.
        </p>
      </div>
    </div>
  );
}
