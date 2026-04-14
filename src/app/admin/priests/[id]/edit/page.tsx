'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface PriestData {
  id: string;
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
  currentTitle: string;
}

export default function AdminPriestEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
    bio: '',
    currentTitle: 'Seminarian',
  });

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/admin/priests/${id}`);
      if (!res.ok) {
        setError('Failed to load priest.');
        setLoading(false);
        return;
      }
      const data: PriestData = await res.json();
      setForm({
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone ?? '',
        seminary: data.seminary ?? '',
        diocese: data.diocese ?? '',
        parish: data.parish ?? '',
        ordinationDate: data.ordinationDate ?? '',
        firstMassDate: data.firstMassDate ?? '',
        bio: data.bio ?? '',
        currentTitle: data.currentTitle ?? 'Seminarian',
      });
      setLoading(false);
    }
    load();
  }, [id]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch(`/api/admin/priests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        seminary: form.seminary,
        diocese: form.diocese,
        parish: form.parish,
        ordinationDate: form.ordinationDate || undefined,
        firstMassDate: form.firstMassDate || undefined,
        bio: form.bio,
        currentTitle: form.currentTitle,
      }),
    });

    if (res.ok) {
      router.push(`/admin/priests/${id}`);
    } else {
      const data = await res.json();
      setError(data.error ?? 'Failed to save changes.');
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl">
        <p className="font-inter text-sm text-near-black/40">Loading…</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-8">
      {/* Back */}
      <Link
        href={`/admin/priests/${id}`}
        className="font-inter text-sm text-near-black/50 hover:text-near-black transition-colors"
      >
        ← Back to Priest Detail
      </Link>

      <div>
        <h1 className="font-cormorant text-4xl font-light text-burgundy-800">Edit Profile</h1>
        <p className="font-inter text-sm text-near-black/50 mt-1">
          Changes are saved immediately to the database.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-near-black/10 rounded-sm p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name *</Label>
            <Input
              id="firstName"
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
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
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="currentTitle">Current Title</Label>
          <select
            id="currentTitle"
            name="currentTitle"
            value={form.currentTitle}
            onChange={handleChange}
            className="w-full border border-near-black/20 rounded-sm px-3 py-2 text-sm font-inter bg-white focus:outline-none focus:ring-2 focus:ring-burgundy-800 text-near-black"
          >
            <option value="Seminarian">Seminarian</option>
            <option value="Transitional Deacon">Transitional Deacon</option>
            <option value="Deacon">Deacon</option>
            <option value="Father">Father</option>
          </select>
          <p className="font-inter text-xs text-near-black/40">
            Admins can set any title. Title displays as "Fr." automatically on/after ordination date.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            value={form.phone}
            onChange={handleChange}
            placeholder="+1 (555) 000-0000"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="diocese">Diocese</Label>
          <Input
            id="diocese"
            name="diocese"
            value={form.diocese}
            onChange={handleChange}
            placeholder="Archdiocese of…"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="seminary">Seminary</Label>
          <Input
            id="seminary"
            name="seminary"
            value={form.seminary}
            onChange={handleChange}
            placeholder="Saint John Vianney…"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="parish">Parish</Label>
          <Input
            id="parish"
            name="parish"
            value={form.parish}
            onChange={handleChange}
            placeholder="Parish of assignment"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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

        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            name="bio"
            value={form.bio}
            onChange={handleChange}
            rows={5}
            placeholder="A brief introduction shown on the public page…"
          />
        </div>

        {error && <p className="font-inter text-sm text-red-600">{error}</p>}

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/admin/priests/${id}`)}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
