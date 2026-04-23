export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import { ProfileClient } from './profile-client';

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center">
          <p className="font-inter text-sm text-near-black/40">Loading…</p>
        </div>
      }
    >
      <ProfileClient />
    </Suspense>
  );
}
