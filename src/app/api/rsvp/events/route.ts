import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { priests, events } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

async function getPriest() {
  const { userId } = await auth();
  if (!userId) return null;
  return db.query.priests.findFirst({ where: eq(priests.clerkUserId, userId) });
}

const createSchema = z.object({
  name: z.string().min(1).max(200),
  date: z.string(), // ISO datetime string
  location: z.string().min(1).max(500),
  rsvpEnabled: z.boolean().default(false),
  rsvpDeadline: z.string().optional().nullable(),
});

export async function GET() {
  const priest = await getPriest();
  if (!priest) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await db.query.events.findMany({
    where: eq(events.priestId, priest.id),
    with: { questions: { orderBy: (q, { asc }) => [asc(q.sortOrder)] } },
    orderBy: (e, { asc }) => [asc(e.date)],
  });

  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const priest = await getPriest();
  if (!priest) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

  const { name, date, location, rsvpEnabled, rsvpDeadline } = parsed.data;
  const [created] = await db
    .insert(events)
    .values({
      priestId: priest.id,
      name,
      date: new Date(date),
      location,
      rsvpEnabled,
      rsvpDeadline: rsvpDeadline || null,
    })
    .returning();

  return NextResponse.json(created, { status: 201 });
}
