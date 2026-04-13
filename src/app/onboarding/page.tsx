'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function OnboardingPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    seminary: '',
    diocese: '',
    parish: '',
    ordinationDate: '',
    firstMassDate: '',
  });

  // Pre-populate name fields once Clerk user object loads
  const [namePrefilled, setNamePrefilled] = useState(false);
  if (isLoaded && user && !namePrefilled) {
    setNamePrefilled(true);
    setForm((prev) => ({
      ...prev,
      firstName: user.firstName ?? prev.firstName,
      lastName: user.lastName ?? prev.lastName,
    }));
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Something went wrong');
      }

      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <nav className="px-6 py-5 bg-burgundy-900 border-b border-white/10">
        <Link href="/" className="flex items-center">
          <Image
            src="/images/logo.png"
            alt="Ad Altare"
            width={540}
            height={205}
            className="h-10 w-auto"
            quality={100}
          />
        </Link>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Progress header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1 bg-gold-600/20" />
            <span className="text-xs uppercase tracking-[0.25em] text-gold-600 font-inter">
              Step 1 of 1
            </span>
            <div className="h-px flex-1 bg-gold-600/20" />
          </div>
          <h1 className="font-cormorant text-4xl sm:text-5xl font-light text-burgundy-800 text-center mb-3">
            Tell Us Your Story
          </h1>
          <p className="text-center font-inter text-near-black/50 text-sm">
            This information will appear on your public ordination page.
            You can edit everything later from your dashboard.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-near-black/10 rounded-sm p-8 space-y-6">
          {/* Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                placeholder="John"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                placeholder="Smith"
                required
              />
            </div>
          </div>

          {/* Seminary & Diocese */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="seminary">Seminary</Label>
              <Input
                id="seminary"
                name="seminary"
                value={form.seminary}
                onChange={handleChange}
                placeholder="St. John's Seminary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="diocese">Diocese</Label>
              <Input
                id="diocese"
                name="diocese"
                value={form.diocese}
                onChange={handleChange}
                placeholder="Diocese of Boston"
              />
            </div>
          </div>

          {/* Parish */}
          <div className="space-y-2">
            <Label htmlFor="parish">Parish Assignment</Label>
            <Input
              id="parish"
              name="parish"
              value={form.parish}
              onChange={handleChange}
              placeholder="St. Mary's Parish"
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              placeholder="(555) 555-5555"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ordinationDate">Ordination Date</Label>
              <Input
                id="ordinationDate"
                name="ordinationDate"
                type="date"
                value={form.ordinationDate}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="firstMassDate">First Mass Date</Label>
              <Input
                id="firstMassDate"
                name="firstMassDate"
                type="date"
                value={form.firstMassDate}
                onChange={handleChange}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-sm px-4 py-3">
              <p className="text-red-700 text-sm font-inter">{error}</p>
            </div>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? 'Creating your page…' : 'Continue to Dashboard'}
          </Button>
        </form>
      </div>
    </div>
  );
}
