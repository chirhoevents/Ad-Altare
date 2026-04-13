'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useUser } from '@clerk/nextjs';

export function LandingNav() {
  const { isLoaded, isSignedIn, user } = useUser();

  return (
    <nav className="absolute top-0 left-0 right-0 z-20 px-4 sm:px-8 py-5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/">
          <Image
            src="/images/logo.png"
            alt="Ad Altare"
            width={540}
            height={205}
            className="h-10 w-auto"
            quality={100}
          />
        </Link>

        {isLoaded && isSignedIn ? (
          // Signed-in state
          <div className="flex items-center gap-4">
            <span className="font-inter text-sm text-cream/70 hidden sm:inline">
              Hi, {user.firstName ?? 'Father'}
            </span>
            <Link
              href="/dashboard"
              className="font-inter text-sm bg-gold-600 text-white px-4 py-2 rounded-sm hover:bg-gold-700 transition-colors"
            >
              Go to Dashboard
            </Link>
          </div>
        ) : (
          // Signed-out state
          <div className="flex items-center gap-6">
            <Link
              href="/directory"
              className="font-inter text-sm text-cream/70 hover:text-cream transition-colors"
            >
              Find a Priest
            </Link>
            <Link
              href="/sign-in"
              className="font-inter text-sm text-cream/70 hover:text-cream transition-colors"
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
        )}
      </div>
    </nav>
  );
}
