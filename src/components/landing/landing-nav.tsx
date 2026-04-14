'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useUser } from '@clerk/nextjs';

export function LandingNav() {
  const { isLoaded, isSignedIn, user } = useUser();

  return (
    <nav className="absolute top-0 left-0 right-0 z-20 px-4 sm:px-8 py-4 sm:py-5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="shrink-0">
          <Image
            src="/images/logo.png"
            alt="Ad Altare"
            width={540}
            height={205}
            className="h-8 sm:h-10 w-auto"
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
          <div className="flex items-center gap-3 sm:gap-6">
            <Link
              href="/directory"
              className="font-inter text-xs sm:text-sm text-cream/70 hover:text-cream transition-colors whitespace-nowrap"
            >
              Find a Priest
            </Link>
            <Link
              href="/#faq"
              className="font-inter text-sm text-cream/70 hover:text-cream transition-colors hidden sm:inline"
            >
              FAQ
            </Link>
            <Link
              href="/sign-in"
              className="font-inter text-sm text-cream/70 hover:text-cream transition-colors hidden sm:inline"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="font-inter text-xs sm:text-sm bg-gold-600 text-white px-3 sm:px-4 py-2 rounded-sm hover:bg-gold-700 transition-colors whitespace-nowrap"
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
