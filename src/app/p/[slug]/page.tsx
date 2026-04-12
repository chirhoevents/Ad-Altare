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
      {/* Background Photo Header */}
      <div className="relative h-64 sm:h-80 lg:h-96 bg-burgundy-800 overflow-hidden">
        {priest.backgroundPhotoUrl ? (
          <Image
            src={priest.backgroundPhotoUrl}
            alt=""
            fill
            className="object-cover"
            priority
          />
        ) : (
          /* Default pattern background */
          <div className="absolute inset-0 opacity-10">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="cross" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
                  <rect x="36" y="10" width="8" height="60" fill="#FAF7F2"/>
                  <rect x="10" y="28" width="60" height="8" fill="#FAF7F2"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#cross)"/>
            </svg>
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-burgundy-900/20 to-burgundy-900/70" />

        {/* Nav */}
        <div className="absolute top-0 left-0 right-0 px-6 py-4 z-10">
          <Link href="/" className="flex items-center opacity-90 hover:opacity-100 transition-opacity">
            <Image src="/images/logo.png" alt="Ad Altare" width={36} height={36} className="h-9 w-auto" />
          </Link>
        </div>
      </div>

      {/* Profile section */}
      <div className="max-w-4xl mx-auto px-4">
        <div className="relative -mt-16 mb-6 flex flex-col sm:flex-row items-center sm:items-end gap-5">
          {/* Profile Photo */}
          <div className="w-32 h-32 rounded-full border-4 border-cream bg-burgundy-100 overflow-hidden shrink-0 shadow-lg">
            {priest.profilePhotoUrl ? (
              <Image
                src={priest.profilePhotoUrl}
                alt={priestName}
                width={128}
                height={128}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-burgundy-800">
                <span className="font-cormorant text-4xl text-cream font-light">
                  {priest.firstName[0]}{priest.lastName[0]}
                </span>
              </div>
            )}
          </div>

          {/* Name & Details */}
          <div className="text-center sm:text-left pb-2">
            <h1 className="font-cormorant text-4xl sm:text-5xl font-light text-burgundy-800">
              {priestName}
            </h1>
            <div className="flex flex-wrap justify-center sm:justify-start gap-x-4 gap-y-1 mt-2">
              {priest.diocese && (
                <span className="font-inter text-sm text-near-black/50">
                  {priest.diocese}
                </span>
              )}
              {priest.parish && (
                <span className="font-inter text-sm text-near-black/50">
                  · {priest.parish}
                </span>
              )}
              {priest.seminary && (
                <span className="font-inter text-sm text-near-black/50">
                  · {priest.seminary}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Date badges */}
        {(priest.ordinationDate || priest.firstMassDate) && (
          <div className="flex flex-wrap gap-3 mb-6 justify-center sm:justify-start">
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
          <a href="/" className="text-burgundy-800/50 hover:text-burgundy-800 transition-colors">
            Ad Altare
          </a>
        </p>
      </div>
    </div>
  );
}
