'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// ─── Stripe / Delete actions ─────────────────────────────────────────────────

interface ActionsProps {
  priestId: string;
  stripeOnboardingComplete: boolean;
}

export function AdminPriestActions({ priestId, stripeOnboardingComplete }: ActionsProps) {
  const router = useRouter();
  const [marking, setMarking] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleMarkStripe() {
    setMarking(true);
    await fetch(`/api/admin/priests/${priestId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stripeOnboardingComplete: true }),
    });
    router.refresh();
    setMarking(false);
  }

  async function handleDelete() {
    if (!confirm('Permanently delete this priest and all their data? This cannot be undone.')) return;
    setDeleting(true);
    const res = await fetch(`/api/admin/priests/${priestId}`, { method: 'DELETE' });
    if (res.ok) {
      router.push('/admin');
    } else {
      alert('Delete failed.');
      setDeleting(false);
    }
  }

  return (
    <div className="flex gap-3 mt-4 flex-wrap">
      {!stripeOnboardingComplete && (
        <Button
          size="sm"
          variant="outline"
          onClick={handleMarkStripe}
          disabled={marking}
        >
          {marking ? 'Saving…' : 'Manually Mark Stripe Connected'}
        </Button>
      )}
      <Button
        size="sm"
        variant="outline"
        className="text-red-600 border-red-200 hover:bg-red-50"
        onClick={handleDelete}
        disabled={deleting}
      >
        {deleting ? 'Deleting…' : 'Delete Priest'}
      </Button>
    </div>
  );
}

// ─── Directory visibility toggle ─────────────────────────────────────────────

interface VisibilityProps {
  priestId: string;
  profileVisible: boolean;
}

export function AdminVisibilityToggle({ priestId, profileVisible }: VisibilityProps) {
  const router = useRouter();
  const [visible, setVisible] = useState(profileVisible);
  const [saving, setSaving] = useState(false);

  async function handleToggle() {
    setSaving(true);
    const res = await fetch(`/api/admin/priests/${priestId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileVisible: !visible }),
    });
    if (res.ok) {
      setVisible((v) => !v);
      router.refresh();
    }
    setSaving(false);
  }

  return (
    <div className="mt-4 flex items-center gap-4 flex-wrap">
      <Button
        size="sm"
        variant={visible ? 'outline' : 'default'}
        onClick={handleToggle}
        disabled={saving}
        className={visible ? 'text-red-600 border-red-200 hover:bg-red-50' : ''}
      >
        {saving ? 'Saving…' : visible ? 'Remove from Directory' : 'Show in Directory'}
      </Button>
      <p className="font-inter text-xs text-near-black/40">
        {visible
          ? 'This priest is currently listed in the public directory.'
          : 'This priest is hidden from the public directory.'}
      </p>
    </div>
  );
}

// ─── Fee management ───────────────────────────────────────────────────────────

interface FeeActionsProps {
  priestId: string;
  platformFeeOverride: number | null;
}

export function AdminFeeActions({ priestId, platformFeeOverride }: FeeActionsProps) {
  const router = useRouter();
  const [currentOverride, setCurrentOverride] = useState<number | null>(platformFeeOverride);
  const [saving, setSaving] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customValue, setCustomValue] = useState(
    platformFeeOverride !== null && platformFeeOverride !== 0
      ? String(platformFeeOverride)
      : ''
  );
  const [error, setError] = useState<string | null>(null);

  const isWaived = currentOverride === 0;
  const isCustom = currentOverride !== null && currentOverride !== 0;

  async function patchFee(value: number | null) {
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/admin/priests/${priestId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platformFeeOverride: value }),
    });
    if (res.ok) {
      setCurrentOverride(value);
      router.refresh();
    } else {
      setError('Save failed. Please try again.');
    }
    setSaving(false);
  }

  async function handleWaive() {
    await patchFee(0);
    setShowCustomInput(false);
  }

  async function handleRemoveWaiver() {
    await patchFee(null);
    setShowCustomInput(false);
  }

  async function handleSaveCustom() {
    const parsed = parseInt(customValue, 10);
    if (isNaN(parsed) || parsed < 0 || parsed > 100) {
      setError('Enter a whole number between 0 and 100.');
      return;
    }
    await patchFee(parsed);
    setShowCustomInput(false);
  }

  return (
    <div className="space-y-3">
      {/* Confirmation shown when fee is waived */}
      {isWaived && (
        <div className="bg-amber-50 border border-amber-200 rounded-sm px-4 py-3">
          <p className="font-inter text-xs text-amber-800">
            This priest will no longer be charged a platform fee. All donations go directly
            to them minus Stripe processing only.
          </p>
        </div>
      )}

      <div className="flex gap-2 flex-wrap items-start">
        {/* Waive / Remove Waiver */}
        {isWaived ? (
          <Button
            size="sm"
            variant="outline"
            className="text-red-600 border-red-200 hover:bg-red-50"
            onClick={handleRemoveWaiver}
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Remove Waiver'}
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={handleWaive}
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Waive Fee Entirely'}
          </Button>
        )}

        {/* Set / Change Custom Fee */}
        {!isWaived && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => { setShowCustomInput((v) => !v); setError(null); }}
            disabled={saving}
          >
            {isCustom ? 'Change Custom Fee' : 'Set Custom Fee'}
          </Button>
        )}

        {/* Restore default if currently custom */}
        {isCustom && (
          <Button
            size="sm"
            variant="outline"
            className="text-near-black/50"
            onClick={() => { patchFee(null); setShowCustomInput(false); }}
            disabled={saving}
          >
            Restore Default (1%)
          </Button>
        )}
      </div>

      {/* Custom fee input */}
      {showCustomInput && (
        <div className="flex items-end gap-2 flex-wrap">
          <div className="space-y-1">
            <Label htmlFor="customFee" className="text-xs">
              Custom fee percentage (0–100)
            </Label>
            <div className="flex items-center gap-1">
              <Input
                id="customFee"
                type="number"
                min={0}
                max={100}
                step={1}
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                className="w-24 text-sm"
                placeholder="e.g. 1"
              />
              <span className="font-inter text-sm text-near-black/60">%</span>
            </div>
          </div>
          <Button size="sm" onClick={handleSaveCustom} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => { setShowCustomInput(false); setError(null); }}
            disabled={saving}
          >
            Cancel
          </Button>
        </div>
      )}

      {error && (
        <p className="font-inter text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
