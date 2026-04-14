'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useUser } from '@clerk/nextjs';

/**
 * Solid-header nav for public priest pages (/p/[slug]).
 * Shows "Hi [name] + Go to Dashboard" when signed in,
 * otherwise shows "Find a Priest / Sign In / Create Account".
 */
export function PriestPageNav() {
  const { isLoaded, isSignedIn, user } = useUser();

  return (
    <nav className="bg-burgundy-900 px-4 sm:px-6 py-4 flex items-center justify-between">
      <Link href="/" className="flex items-center shrink-0">
        <Image
          src="/images/logo.png"
          alt="Ad Altare"
          width={540}
          height={205}
          className="h-8 sm:h-9 w-auto"
          quality={100}
        />
      </Link>

      {isLoaded && isSignedIn ? (
        <div className="flex items-center gap-3">
          <span className="font-inter text-sm text-cream/70 hidden sm:inline">
            Hi, {user.firstName ?? 'Father'}
          </span>
          <Link
            href="/dashboard"
            className="font-inter text-xs sm:text-sm bg-gold-600 text-white px-3 sm:px-4 py-2 rounded-sm hover:bg-gold-700 transition-colors whitespace-nowrap"
          >
            Go to Dashboard
          </Link>
        </div>
      ) : (
        <div className="flex items-center gap-3 sm:gap-5">
          <Link
            href="/directory"
            className="font-inter text-xs sm:text-sm text-cream/70 hover:text-cream transition-colors whitespace-nowrap"
          >
            Find a Priest
          </Link>
          <Link
            href="/sign-in"
            className="font-inter text-sm text-cream/70 hover:text-cream transition-colors hidden sm:inline"
          >
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className="font-inter text-xs bg-gold-600 text-white px-3 sm:px-4 py-2 rounded-sm hover:bg-gold-700 transition-colors whitespace-nowrap"
          >
            Create Account
          </Link>
        </div>
      )}
    </nav>
  );
}
