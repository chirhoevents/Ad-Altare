'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';

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
  const [saveMessage, setSaveMessage] = useState<{ ok: boolean; text: string } | null>(null);

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
    if (stripeStatus === 'success') {
      fetch('/api/stripe/connect', { method: 'PUT' }).then(() => fetchSettings());
    }
  }, [stripeStatus, fetchSettings]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setSettings((prev) => prev ? { ...prev, [e.target.name]: e.target.value } : prev);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setSaveMessage(null);

    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
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

      {stripeStatus === 'success' && settings.stripeOnboardingComplete && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-sm px-5 py-4 flex items-center gap-3">
          <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
          <p className="font-inter text-sm text-green-800">
            Stripe connected successfully! You can now receive donations.
          </p>
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
          <h2 className="font-cormorant text-2xl text-burgundy-800 mb-2">Photos</h2>
          <p className="font-inter text-xs text-near-black/40 mb-5">
            Provide direct image URLs (e.g. from your seminary website, Google Photos, or Imgur).
          </p>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="profilePhotoUrl">Profile Photo URL</Label>
              <Input id="profilePhotoUrl" name="profilePhotoUrl" type="url" value={settings.profilePhotoUrl ?? ''} onChange={handleChange} placeholder="https://example.com/my-photo.jpg" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="backgroundPhotoUrl">Background / Header Photo URL</Label>
              <Input id="backgroundPhotoUrl" name="backgroundPhotoUrl" type="url" value={settings.backgroundPhotoUrl ?? ''} onChange={handleChange} placeholder="https://example.com/background.jpg" />
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
            {['{donor_name}', '{item_name}', '{priest_name}'].map((tag) => (
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
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="font-cormorant text-2xl text-burgundy-800 mb-1">Stripe Connect</h2>
            <p className="font-inter text-sm text-near-black/50 mb-3">
              Connect a bank account to receive donations directly.
            </p>
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
          <Button
            size="sm"
            variant={settings.stripeOnboardingComplete ? 'outline' : 'gold'}
            onClick={handleStripeConnect}
            disabled={connectingStripe}
          >
            {connectingStripe
              ? 'Redirecting…'
              : settings.stripeOnboardingComplete
              ? 'Manage Stripe Account'
              : settings.stripeAccountId
              ? 'Continue Onboarding'
              : 'Connect Stripe'}
          </Button>
        </div>
        <p className="font-inter text-xs text-near-black/30 mt-4">
          Ad Altare retains 2% of each donation as a platform fee; Stripe retains their processing fee (~2.9% + 30¢). You receive the remainder.
        </p>
      </div>
    </div>
  );
}
