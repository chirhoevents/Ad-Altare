export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import { SettingsClient } from './settings-client';

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center">
          <p className="font-inter text-sm text-near-black/40">Loading…</p>
        </div>
      }
    >
      <SettingsClient />
    </Suspense>
  );
}
