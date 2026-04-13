import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { priests, registryItems } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const createSchema = z.object({
  name: z.string().min(1).max(200),
  category: z.string().max(100).optional().default(''),
  description: z.string().max(1000).optional().default(''),
  imageUrl: z.union([z.string().url(), z.literal(''), z.null()]).optional(),
  goalAmount: z.number().int().min(100),
});

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const priest = await db.query.priests.findFirst({
    where: eq(priests.clerkUserId, userId),
  });
  if (!priest) return NextResponse.json({ error: 'Priest not found' }, { status: 404 });

  const items = await db.query.registryItems.findMany({
    where: eq(registryItems.priestId, priest.id),
    orderBy: (registryItems, { asc }) => [asc(registryItems.createdAt)],
  });

  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const priest = await db.query.priests.findFirst({
    where: eq(priests.clerkUserId, userId),
  });
  if (!priest) return NextResponse.json({ error: 'Priest not found' }, { status: 404 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const [item] = await db
    .insert(registryItems)
    .values({
      priestId: priest.id,
      name: parsed.data.name,
      category: parsed.data.category || null,
      description: parsed.data.description || null,
      imageUrl: parsed.data.imageUrl || null,
      goalAmount: parsed.data.goalAmount,
    })
    .returning();

  return NextResponse.json(item, { status: 201 });
}
