import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { db } from '@/db';
import { priests, registryItems, events } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { formatDate } from '@/lib/utils';
import { PriestPageClient } from '@/components/priest/priest-page-client';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const priest = await db.query.priests.findFirst({
    where: eq(priests.slug, params.slug),
  });

  if (!priest) return { title: 'Not Found' };

  return {
    title: `Fr. ${priest.firstName} ${priest.lastName} — Ordination Registry`,
    description: priest.bio?.slice(0, 160) ?? `Support Fr. ${priest.firstName} ${priest.lastName}'s ordination.`,
    openGraph: {
      images: priest.profilePhotoUrl ? [priest.profilePhotoUrl] : [],
    },
  };
}

export default async function PriestPage({ params }: Props) {
  const priest = await db.query.priests.findFirst({
    where: eq(priests.slug, params.slug),
  });

  if (!priest) notFound();

  const [items, rsvpEvents] = await Promise.all([
    db.query.registryItems.findMany({
      where: and(eq(registryItems.priestId, priest.id), eq(registryItems.isActive, true)),
      orderBy: (r, { asc }) => [asc(r.createdAt)],
    }),
    db.query.events.findMany({
      where: and(eq(events.priestId, priest.id), eq(events.rsvpEnabled, true)),
      orderBy: (e, { asc }) => [asc(e.date)],
    }),
  ]);

  const priestName = `Fr. ${priest.firstName} ${priest.lastName}`;

  return (
    <div className="min-h-screen bg-cream">

      {/* ── Branded top nav ── */}
      <nav className="bg-burgundy-900 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <Image
            src="/images/logo.png"
            alt="Ad Altare"
            width={540}
            height={205}
            className="h-9 w-auto"
            quality={100}
          />
        </Link>
        <div className="flex items-center gap-5">
          <Link
            href="/directory"
            className="font-inter text-sm text-cream/70 hover:text-cream transition-colors hidden sm:inline"
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
            className="font-inter text-xs bg-gold-600 text-white px-4 py-2 rounded-sm hover:bg-gold-700 transition-colors"
          >
            Create Account
          </Link>
        </div>
      </nav>

      {/* ── Backdrop photo ── */}
      <div className="relative h-52 sm:h-64 lg:h-72 bg-burgundy-900 overflow-hidden">
        {priest.backgroundPhotoUrl ? (
          <Image
            src={priest.backgroundPhotoUrl}
            alt=""
            fill
            className="object-cover object-center"
            priority
          />
        ) : (
          <Image
            src="/images/backdrop.jpg"
            alt=""
            fill
            className="object-cover object-center"
            priority
          />
        )}
        {/* Gradient — heavier at bottom so the overlap area is dark */}
        <div className="absolute inset-0 bg-gradient-to-b from-burgundy-900/20 via-transparent to-burgundy-900/80" />
      </div>

      {/* ── Profile section ── */}
      <div className="max-w-4xl mx-auto px-4">

        {/* Profile photo — overlaps backdrop by half its height */}
        <div className="relative -mt-16 w-32 h-32 rounded-full border-4 border-cream bg-burgundy-100 overflow-hidden shadow-xl">
          {priest.profilePhotoUrl ? (
            <Image
              src={priest.profilePhotoUrl}
              alt={priestName}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-burgundy-800">
              <span className="font-cormorant text-4xl text-cream font-light">
                {priest.firstName[0]}{priest.lastName[0]}
              </span>
            </div>
          )}
        </div>

        {/* Name & details — fully in the cream area, no overlap */}
        <div className="mt-4 mb-2 text-center sm:text-left">
          <h1 className="font-cormorant text-4xl sm:text-5xl font-light text-burgundy-800">
            {priestName}
          </h1>
          <div className="flex flex-wrap justify-center sm:justify-start gap-x-3 gap-y-1 mt-2">
            {priest.diocese && (
              <span className="font-inter text-sm text-near-black/50">{priest.diocese}</span>
            )}
            {priest.parish && (
              <span className="font-inter text-sm text-near-black/50">· {priest.parish}</span>
            )}
            {priest.seminary && (
              <span className="font-inter text-sm text-near-black/50">· {priest.seminary}</span>
            )}
          </div>
        </div>

        {/* Date badges */}
        {(priest.ordinationDate || priest.firstMassDate) && (
          <div className="flex flex-wrap gap-3 mb-6 justify-center sm:justify-start mt-4">
            {priest.ordinationDate && (
              <div className="bg-burgundy-50 border border-burgundy-100 rounded-sm px-4 py-2">
                <p className="font-inter text-xs uppercase tracking-widest text-burgundy-700 mb-0.5">Ordination</p>
                <p className="font-cormorant text-lg text-burgundy-800">{formatDate(priest.ordinationDate)}</p>
              </div>
            )}
            {priest.firstMassDate && (
              <div className="bg-gold-50 border border-gold-200 rounded-sm px-4 py-2">
                <p className="font-inter text-xs uppercase tracking-widest text-gold-700 mb-0.5">First Mass</p>
                <p className="font-cormorant text-lg text-gold-800">{formatDate(priest.firstMassDate)}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Client content (tabs, registry, donation modal) */}
      <PriestPageClient priest={priest} registryItems={items} hasRsvp={rsvpEvents.length > 0} />

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
