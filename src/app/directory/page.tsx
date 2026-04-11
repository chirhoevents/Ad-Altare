import type { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/db';
import { priests } from '@/db/schema';
import { or, eq } from 'drizzle-orm';
import { DirectoryClient } from './directory-client';

export const metadata: Metadata = {
  title: 'Find a Priest — Ad Altare',
  description: 'Browse and support Catholic priests preparing for their ordination.',
};

export default async function DirectoryPage() {
  const visiblePriests = await db.query.priests.findMany({
    where: or(
      eq(priests.stripeOnboardingComplete, true),
      eq(priests.profileVisible, true)
    ),
    columns: {
      id: true,
      firstName: true,
      lastName: true,
      diocese: true,
      seminary: true,
      parish: true,
      ordinationDate: true,
      profilePhotoUrl: true,
      slug: true,
    },
    orderBy: (priests, { asc }) => [asc(priests.lastName), asc(priests.firstName)],
  });

  return (
    <div className="min-h-screen bg-cream">
      {/* Nav */}
      <nav className="bg-near-black px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-cormorant text-xl text-cream font-light">
            Ad Altare
          </Link>
          <span className="text-cream/20 hidden sm:inline">|</span>
          <span className="font-inter text-sm text-cream/60 hidden sm:inline">
            Find a Priest
          </span>
        </div>
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
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <h1 className="font-cormorant text-5xl font-light text-burgundy-800 mb-3">
            Find a Priest
          </h1>
          <p className="font-inter text-base text-near-black/50 max-w-xl">
            Browse priests preparing for ordination and support their ministries through
            their ordination registries.
          </p>
        </div>

        {visiblePriests.length === 0 ? (
          <div className="text-center py-24 bg-white border border-near-black/10 rounded-sm">
            <p className="font-cormorant text-3xl text-near-black/30 mb-3">
              No priests listed yet
            </p>
            <p className="font-inter text-sm text-near-black/30">
              Check back soon — priests are joining the platform.
            </p>
          </div>
        ) : (
          <DirectoryClient priests={visiblePriests} />
        )}
      </main>

      {/* Footer */}
      <div className="border-t border-near-black/10 mt-16 py-6 text-center">
        <p className="font-inter text-xs text-near-black/30">
          Powered by{' '}
          <Link href="/" className="text-burgundy-800/50 hover:text-burgundy-800 transition-colors">
            Ad Altare
          </Link>
        </p>
      </div>
    </div>
  );
}
