import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { priests, registryLinks } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const createSchema = z.object({
  label: z.string().min(1).max(100),
  url: z.string().url(),
});

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const priest = await db.query.priests.findFirst({ where: eq(priests.clerkUserId, userId) });
  if (!priest) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const links = await db.query.registryLinks.findMany({
    where: eq(registryLinks.priestId, priest.id),
    orderBy: (l, { asc }) => [asc(l.sortOrder), asc(l.createdAt)],
  });
  return NextResponse.json(links);
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const priest = await db.query.priests.findFirst({ where: eq(priests.clerkUserId, userId) });
  if (!priest) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  const [link] = await db.insert(registryLinks).values({
    priestId: priest.id,
    label: parsed.data.label,
    url: parsed.data.url,
  }).returning();
  return NextResponse.json(link, { status: 201 });
}
