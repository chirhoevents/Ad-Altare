import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { priests, guestList } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

async function getPriest() {
  const { userId } = await auth();
  if (!userId) return null;
  return db.query.priests.findFirst({ where: eq(priests.clerkUserId, userId) });
}

const patchSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  inviteCount: z.number().int().min(1).max(50).optional(),
  address: z.string().max(500).nullable().optional(),
  phone: z.string().max(30).nullable().optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const priest = await getPriest();
  if (!priest) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

  const updates: Record<string, unknown> = {};
  const d = parsed.data;
  if (d.firstName !== undefined) updates.firstName = d.firstName;
  if (d.lastName !== undefined) updates.lastName = d.lastName;
  if (d.inviteCount !== undefined) updates.inviteCount = d.inviteCount;
  if (d.address !== undefined) updates.address = d.address || null;
  if (d.phone !== undefined) updates.phone = d.phone || null;

  const [updated] = await db
    .update(guestList)
    .set(updates)
    .where(and(eq(guestList.id, params.id), eq(guestList.priestId, priest.id)))
    .returning();

  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const priest = await getPriest();
  if (!priest) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await db
    .delete(guestList)
    .where(and(eq(guestList.id, params.id), eq(guestList.priestId, priest.id)));

  return NextResponse.json({ success: true });
}
