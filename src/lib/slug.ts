import { db } from '@/db';
import { priests } from '@/db/schema';
import { like } from 'drizzle-orm';
import { generateBaseSlug } from './utils';

export async function generateUniqueSlug(
  firstName: string,
  lastName: string
): Promise<string> {
  const baseSlug = generateBaseSlug(firstName, lastName);

  const existing = await db.query.priests.findMany({
    where: like(priests.slug, `${baseSlug}%`),
    columns: { slug: true },
  });

  if (existing.length === 0) return baseSlug;

  const slugs = new Set(existing.map((p) => p.slug));
  if (!slugs.has(baseSlug)) return baseSlug;

  let counter = 2;
  while (slugs.has(`${baseSlug}-${counter}`)) {
    counter++;
  }
  return `${baseSlug}-${counter}`;
}
