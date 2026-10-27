import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { registryItems, priests } from '@/db/schema';
import { isAdminUser } from '@/lib/visibility';

const patchSchema = z.object({ isActive: z.boolean() });

async function revalidatePriestPage(priestId: string) {
  const priest = await db.query.priests.findFirst({ where: eq(priests.id, priestId), columns: { slug: true } });
  if (priest) revalidatePath(`/p/${priest.slug}`);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { userId } = await auth();
  if (!(await isAdminUser(userId))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

  const [updated] = await db
    .update(registryItems)
    .set({ isActive: parsed.data.isActive })
    .where(eq(registryItems.id, params.id))
    .returning();
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await revalidatePriestPage(updated.priestId);
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const { userId } = await auth();
  if (!(await isAdminUser(userId))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // Donations to this item are kept (their item link becomes "General Fund").
  const [deleted] = await db.delete(registryItems).where(eq(registryItems.id, params.id)).returning();
  if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await revalidatePriestPage(deleted.priestId);
  return NextResponse.json({ success: true });
}
