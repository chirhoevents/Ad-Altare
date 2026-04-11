'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface Props {
  priestId: string;
  stripeOnboardingComplete: boolean;
}

export function AdminPriestActions({ priestId, stripeOnboardingComplete }: Props) {
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
