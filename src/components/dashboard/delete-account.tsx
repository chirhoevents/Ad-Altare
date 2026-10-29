'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function DeleteAccountSection() {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    const res = await fetch('/api/settings', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirm: confirmText }),
    });
    if (res.ok) {
      window.location.href = '/'; // their sign-in no longer exists
      return;
    }
    const data = await res.json().catch(() => ({}));
    setError(data.error ?? 'Something went wrong. Please try again or email support@ad-altare.com.');
    setDeleting(false);
  }

  return (
    <div className="mt-8 bg-white border border-red-200 rounded-sm p-6">
      <h2 className="font-cormorant text-2xl text-red-700 mb-1">Delete My Account</h2>
      <p className="font-inter text-sm text-near-black/60 max-w-xl">
        Permanently removes your page, wishlist, registry, guest list, RSVPs, donation history, and your
        Ad Altare sign-in. This cannot be undone.
      </p>
      <p className="font-inter text-xs text-near-black/40 mt-2 max-w-xl">
        If you connected Stripe, your Stripe account is not deleted — any money on its way still reaches your
        bank, and you can keep signing in to Stripe for payouts and tax documents.
      </p>

      {!open ? (
        <Button variant="outline" size="sm" className="mt-4 text-red-600 border-red-200 hover:bg-red-50" onClick={() => setOpen(true)}>
          Delete my account…
        </Button>
      ) : (
        <div className="mt-4 space-y-3 max-w-sm">
          <label htmlFor="confirm-delete" className="font-inter text-sm text-near-black block">
            Type <strong>DELETE</strong> to confirm
          </label>
          <Input
            id="confirm-delete"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            autoComplete="off"
          />
          {error && <p className="font-inter text-sm text-red-600">{error}</p>}
          <div className="flex gap-3">
            <Button
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={confirmText !== 'DELETE' || deleting}
              onClick={handleDelete}
            >
              {deleting ? 'Deleting…' : 'Permanently delete'}
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setOpen(false); setConfirmText(''); setError(null); }}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
