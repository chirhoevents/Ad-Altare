import type { MetadataRoute } from 'next';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { priests } from '@/db/schema';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://ad-altare.com';
  // Only priests who chose to be listed — unlisted pages stay link-only.
  const listed = await db.query.priests
    .findMany({ where: eq(priests.profileVisible, true), columns: { slug: true, updatedAt: true } })
    .catch(() => []);

  return [
    { url: base, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/directory`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${base}/support`, changeFrequency: 'monthly', priority: 0.4 },
    ...listed.map((p) => ({ url: `${base}/p/${p.slug}`, lastModified: p.updatedAt, changeFrequency: 'weekly' as const })),
  ];
}
