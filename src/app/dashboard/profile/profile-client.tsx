'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, AlertCircle, Upload, X } from 'lucide-react';

interface PriestProfile {
  firstName: string;
  lastName: string;
  currentTitle: string;
  phone: string | null;
  seminary: string | null;
  diocese: string | null;
  parish: string | null;
  ordinationDate: string | null;
  firstMassDate: string | null;
  bio: string | null;
  profilePhotoUrl: string | null;
  backgroundPhotoUrl: string | null;
}

export function ProfileClient() {
  const router = useRouter();
  const [profile, setProfile] = useState<PriestProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingBackdrop, setUploadingBackdrop] = useState(false);
  const profileInputRef = useRef<HTMLInputElement>(null);
  const backdropInputRef = useRef<HTMLInputElement>(null);

  const fetchProfile = useCallback(async () => {
    const res = await fetch('/api/settings');
    if (res.ok) setProfile(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setProfile((prev) => prev ? { ...prev, [e.target.name]: e.target.value } : prev);
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
      setProfile((prev) => prev ? { ...prev, [field]: url } : prev);
      await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: url }),
      });
      setSaveMessage({ ok: true, text: 'Photo saved.' });
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setSaveMessage({ ok: false, text: data.error ?? 'Upload failed. Please try again.' });
    }
    setUploading(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setSaveMessage(null);

    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });

    if (res.ok) {
      setSaveMessage({ ok: true, text: 'Profile saved.' });
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setSaveMessage({ ok: false, text: data.error ?? 'Failed to save.' });
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-8 text-center">
        <p className="font-inter text-sm text-near-black/40">Loading…</p>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="font-cormorant text-4xl font-light text-burgundy-800">My Profile</h1>
        <p className="font-inter text-sm text-near-black/50 mt-1">
          Your photos, personal information, and biography shown on your public page.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">

        {/* Photos */}
        <section className="bg-white border border-near-black/10 rounded-sm p-6">
          <h2 className="font-cormorant text-2xl text-burgundy-800 mb-1">Photos</h2>
          <p className="font-inter text-xs text-near-black/40 mb-5">
            Max 8 MB each — JPEG, PNG, or WebP.
          </p>
          <div className="space-y-6">

            {/* Profile Photo */}
            <div>
              <Label className="mb-2 block">Profile Photo</Label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full border-2 border-near-black/10 bg-near-black/5 overflow-hidden shrink-0 flex items-center justify-center">
                  {profile.profilePhotoUrl ? (
                    <Image
                      src={profile.profilePhotoUrl}
                      alt="Profile"
                      width={80}
                      height={80}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <span className="font-cormorant text-2xl text-near-black/30">
                      {profile.firstName?.[0]}{profile.lastName?.[0]}
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <input
                    ref={profileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
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
                    {uploadingProfile ? 'Uploading…' : profile.profilePhotoUrl ? 'Change Photo' : 'Upload Photo'}
                  </Button>
                  {profile.profilePhotoUrl && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                      onClick={() => setProfile((prev) => prev ? { ...prev, profilePhotoUrl: null } : prev)}
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
                {profile.backgroundPhotoUrl ? (
                  <Image src={profile.backgroundPhotoUrl} alt="Backdrop" fill className="object-cover" />
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
                  accept="image/jpeg,image/png,image/webp"
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
                  {uploadingBackdrop ? 'Uploading…' : profile.backgroundPhotoUrl ? 'Change Backdrop' : 'Upload Backdrop'}
                </Button>
                {profile.backgroundPhotoUrl && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                    onClick={() => setProfile((prev) => prev ? { ...prev, backgroundPhotoUrl: null } : prev)}
                  >
                    <X className="w-3.5 h-3.5 mr-1.5" />
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Personal Info */}
        <section className="bg-white border border-near-black/10 rounded-sm p-6">
          <h2 className="font-cormorant text-2xl text-burgundy-800 mb-5">Personal Information</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" name="firstName" value={profile.firstName} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" name="lastName" value={profile.lastName} onChange={handleChange} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentTitle">Current Title</Label>
              <select
                id="currentTitle"
                name="currentTitle"
                value={profile.currentTitle}
                onChange={(e) => setProfile((prev) => prev ? { ...prev, currentTitle: e.target.value } : prev)}
                className="w-full border border-near-black/20 rounded-sm px-3 py-2 font-inter text-sm bg-white focus:outline-none focus:ring-2 focus:ring-burgundy-800 text-near-black"
              >
                <option value="Seminarian">Seminarian</option>
                <option value="Transitional Deacon">Transitional Deacon</option>
                <option value="Deacon">Deacon</option>
              </select>
              <p className="font-inter text-xs text-near-black/40">
                Your title advances to &ldquo;Fr.&rdquo; automatically on your ordination date.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" type="tel" value={profile.phone ?? ''} onChange={handleChange} placeholder="(555) 555-5555" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="seminary">Seminary</Label>
                <Input id="seminary" name="seminary" value={profile.seminary ?? ''} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="diocese">Diocese</Label>
                <Input id="diocese" name="diocese" value={profile.diocese ?? ''} onChange={handleChange} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="parish">Parish</Label>
              <Input id="parish" name="parish" value={profile.parish ?? ''} onChange={handleChange} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ordinationDate">Ordination Date</Label>
                <Input id="ordinationDate" name="ordinationDate" type="date" value={profile.ordinationDate ?? ''} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="firstMassDate">First Mass Date</Label>
                <Input id="firstMassDate" name="firstMassDate" type="date" value={profile.firstMassDate ?? ''} onChange={handleChange} />
              </div>
            </div>
          </div>
        </section>

        {/* Biography */}
        <section className="bg-white border border-near-black/10 rounded-sm p-6">
          <h2 className="font-cormorant text-2xl text-burgundy-800 mb-2">Biography</h2>
          <p className="font-inter text-xs text-near-black/40 mb-4">
            Shown on the About tab of your public page. Share your vocation story and what this ordination means to you.
          </p>
          <Textarea
            id="bio"
            name="bio"
            value={profile.bio ?? ''}
            onChange={handleChange}
            rows={8}
            placeholder="Share your vocation story, your journey to the priesthood, and what this ordination means to you…"
          />
        </section>

        {/* Save */}
        <div className="flex items-center gap-4">
          <Button type="submit" size="lg" disabled={saving}>
            {saving ? 'Saving…' : 'Save Profile'}
          </Button>
          {saveMessage && (
            <div className={`flex items-center gap-2 text-sm font-inter ${saveMessage.ok ? 'text-green-600' : 'text-red-600'}`}>
              {saveMessage.ok ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {saveMessage.text}
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
