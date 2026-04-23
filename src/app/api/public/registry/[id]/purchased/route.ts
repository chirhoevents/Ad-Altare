import { NextResponse } from 'next/server';
import { db } from '@/db';
import { registryItems } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const purchasedSchema = z.object({
  purchasedByName: z.string().max(200).optional(),
  purchasedByPhone: z.string().max(30).optional(),
  purchasedAnonymous: z.boolean().default(false),
});

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const body = await req.json().catch(() => ({}));
  const parsed = purchasedSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const item = await db.query.registryItems.findFirst({
    where: and(
      eq(registryItems.id, params.id),
      eq(registryItems.itemType, 'wishlist'),
      eq(registryItems.isActive, true)
    ),
    columns: { id: true, isPurchased: true },
  });

  if (!item) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 });
  }

  if (item.isPurchased) {
    return NextResponse.json({ error: 'Item is already marked as purchased' }, { status: 409 });
  }

  const { purchasedAnonymous, purchasedByName, purchasedByPhone } = parsed.data;

  const [updated] = await db
    .update(registryItems)
    .set({
      isPurchased: true,
      purchasedAnonymous,
      purchasedByName: purchasedAnonymous ? null : (purchasedByName ?? null),
      purchasedByPhone: purchasedAnonymous ? null : (purchasedByPhone ?? null),
    })
    .where(eq(registryItems.id, params.id))
    .returning({ id: registryItems.id });

  return NextResponse.json({ success: true, id: updated.id });
}
