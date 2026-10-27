'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Check, Copy, EyeOff } from 'lucide-react';

/** Shown on the dashboard while the priest's page is hidden from the public. */
export function HiddenPageBanner() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function makePublic() {
    setSaving(true);
    setError(null);
    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileVisible: true }),
    });
    if (res.ok) router.refresh();
    else setError('Could not update. Please try again.');
    setSaving(false);
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-sm p-5 mb-6 flex items-start gap-4 flex-wrap">
      <EyeOff className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-[220px]">
        <p className="font-inter text-sm font-medium text-amber-900">Your page is hidden</p>
        <p className="font-inter text-sm text-amber-800 mt-0.5">
          Only you can see it right now. Donors can&apos;t give or RSVP until you make it public.
        </p>
        {error && <p className="font-inter text-xs text-red-600 mt-1">{error}</p>}
      </div>
      <Button size="sm" onClick={makePublic} disabled={saving}>
        {saving ? 'Publishing…' : 'Make My Page Public'}
      </Button>
    </div>
  );
}

export function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const fullUrl = url.startsWith('/') ? `${window.location.origin}${url}` : url;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copy your page link:', fullUrl);
    }
  }

  return (
    <Button size="sm" variant="outline" onClick={copy} type="button">
      {copied ? <Check className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
      {copied ? 'Copied' : 'Copy Link'}
    </Button>
  );
}
