import { NextResponse } from 'next/server';
import { db } from '@/db';
import { registryItems } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const purchasedSchema = z
  .object({
    purchasedByName: z.string().max(200).optional(),
    purchasedByEmail: z.union([z.string().email(), z.literal(''), z.null()]).optional(),
    purchasedByPhone: z.string().max(30).optional(),
    purchasedByAddress: z.string().max(500).optional(),
    purchasedAnonymous: z.boolean().default(false),
  })
  .refine(
    (d) => d.purchasedAnonymous || (!!d.purchasedByName?.trim() && !!d.purchasedByEmail?.trim()),
    { message: 'Name and email are required unless submitting anonymously.' }
  );

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

  const { purchasedAnonymous, purchasedByName, purchasedByEmail, purchasedByPhone, purchasedByAddress } = parsed.data;

  const [updated] = await db
    .update(registryItems)
    .set({
      isPurchased: true,
      purchasedAnonymous,
      purchasedByName: purchasedAnonymous ? null : (purchasedByName || null),
      purchasedByEmail: purchasedAnonymous ? null : (purchasedByEmail || null),
      purchasedByPhone: purchasedAnonymous ? null : (purchasedByPhone || null),
      purchasedByAddress: purchasedAnonymous ? null : (purchasedByAddress || null),
    })
    .where(eq(registryItems.id, params.id))
    .returning({ id: registryItems.id });

  return NextResponse.json({ success: true, id: updated.id });
}
