'use client';

import Link from 'next/link';
import { useUser } from '@clerk/nextjs';

export function DirectoryNavAuth() {
  const { isLoaded, isSignedIn, user } = useUser();

  if (!isLoaded) return <div className="w-32" />;

  if (isSignedIn) {
    return (
      <div className="flex items-center gap-3">
        <span className="font-inter text-sm text-cream/70 hidden sm:inline">
          Hi, {user.firstName ?? 'Father'}
        </span>
        <Link
          href="/dashboard"
          className="font-inter text-sm bg-gold-600 text-white px-4 py-2 rounded-sm hover:bg-gold-700 transition-colors whitespace-nowrap"
        >
          Go to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <Link
        href="/sign-in"
        className="font-inter text-sm text-cream/60 hover:text-cream transition-colors"
      >
        Sign In
      </Link>
      <Link
        href="/sign-up"
        className="font-inter text-sm bg-gold-600 text-white px-4 py-2 rounded-sm hover:bg-gold-700 transition-colors"
      >
        Get Started
      </Link>
    </div>
  );
}
