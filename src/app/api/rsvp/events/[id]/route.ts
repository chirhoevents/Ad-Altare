import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { priests, events } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

async function getPriest() {
  const { userId } = await auth();
  if (!userId) return null;
  return db.query.priests.findFirst({ where: eq(priests.clerkUserId, userId) });
}

const patchSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  date: z.string().optional(),
  location: z.string().min(1).max(500).optional(),
  rsvpEnabled: z.boolean().optional(),
  rsvpDeadline: z.string().nullable().optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const priest = await getPriest();
  if (!priest) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

  const updates: Record<string, unknown> = {};
  const d = parsed.data;
  if (d.name !== undefined) updates.name = d.name;
  if (d.date !== undefined) updates.date = new Date(d.date);
  if (d.location !== undefined) updates.location = d.location;
  if (d.rsvpEnabled !== undefined) updates.rsvpEnabled = d.rsvpEnabled;
  if (d.rsvpDeadline !== undefined) updates.rsvpDeadline = d.rsvpDeadline || null;

  const [updated] = await db
    .update(events)
    .set(updates)
    .where(and(eq(events.id, params.id), eq(events.priestId, priest.id)))
    .returning();

  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const priest = await getPriest();
  if (!priest) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await db.delete(events).where(and(eq(events.id, params.id), eq(events.priestId, priest.id)));
  return NextResponse.json({ success: true });
}
