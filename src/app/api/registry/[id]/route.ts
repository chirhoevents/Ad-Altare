import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { priests, registryItems } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const patchSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  category: z.string().max(100).optional(),
  description: z.string().max(1000).optional(),
  goalAmount: z.number().int().min(100).optional(),
  isActive: z.boolean().optional(),
});

async function getPriestItem(userId: string, itemId: string) {
  const priest = await db.query.priests.findFirst({
    where: eq(priests.clerkUserId, userId),
  });
  if (!priest) return null;

  const item = await db.query.registryItems.findFirst({
    where: and(
      eq(registryItems.id, itemId),
      eq(registryItems.priestId, priest.id)
    ),
  });
  return item ?? null;
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const item = await getPriestItem(userId, params.id);
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const updates: Partial<typeof item> = {};
  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.category !== undefined) updates.category = parsed.data.category || null;
  if (parsed.data.description !== undefined) updates.description = parsed.data.description || null;
  if (parsed.data.goalAmount !== undefined) updates.goalAmount = parsed.data.goalAmount;
  if (parsed.data.isActive !== undefined) updates.isActive = parsed.data.isActive;

  const [updated] = await db
    .update(registryItems)
    .set(updates)
    .where(eq(registryItems.id, params.id))
    .returning();

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const item = await getPriestItem(userId, params.id);
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await db.delete(registryItems).where(eq(registryItems.id, params.id));

  return NextResponse.json({ success: true });
}
