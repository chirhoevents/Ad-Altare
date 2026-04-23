'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Switch } from '@/components/ui/switch';

interface DirectoryToggleProps {
  priestId: string;
  profileVisible: boolean;
}

export function DirectoryToggle({ priestId, profileVisible }: DirectoryToggleProps) {
  const router = useRouter();
  const [visible, setVisible] = useState(profileVisible);
  const [saving, setSaving] = useState(false);

  async function handleToggle(checked: boolean) {
    setSaving(true);
    const res = await fetch(`/api/admin/priests/${priestId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileVisible: checked }),
    });
    if (res.ok) {
      setVisible(checked);
      router.refresh();
    }
    setSaving(false);
  }

  return (
    <Switch
      checked={visible}
      onCheckedChange={handleToggle}
      disabled={saving}
      aria-label={visible ? 'Remove from directory' : 'Show in directory'}
    />
  );
}
