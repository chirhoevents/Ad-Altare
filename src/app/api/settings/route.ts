import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import { priests } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const patchSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().max(30).nullish(),
  seminary: z.string().max(200).nullish(),
  diocese: z.string().max(200).nullish(),
  parish: z.string().max(200).nullish(),
  ordinationDate: z.string().nullish(),
  firstMassDate: z.string().nullish(),
  bio: z.string().max(5000).nullish(),
  profilePhotoUrl: z.union([z.string().url(), z.literal(''), z.null()]).optional(),
  backgroundPhotoUrl: z.union([z.string().url(), z.literal(''), z.null()]).optional(),
  thankYouTemplate: z.string().max(3000).nullish(),
  profileVisible: z.boolean().optional(),
});

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const priest = await db.query.priests.findFirst({
    where: eq(priests.clerkUserId, userId),
  });
  if (!priest) return NextResponse.json({ error: 'Priest not found' }, { status: 404 });

  return NextResponse.json(priest);
}

export async function PATCH(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const priest = await db.query.priests.findFirst({
    where: eq(priests.clerkUserId, userId),
  });
  if (!priest) return NextResponse.json({ error: 'Priest not found' }, { status: 404 });

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
  }

  const updates: Record<string, string | null> = {};
  const data = parsed.data;

  if (data.firstName !== undefined) updates.firstName = data.firstName;
  if (data.lastName !== undefined) updates.lastName = data.lastName;
  if (data.phone !== undefined) updates.phone = data.phone || null;
  if (data.seminary !== undefined) updates.seminary = data.seminary || null;
  if (data.diocese !== undefined) updates.diocese = data.diocese || null;
  if (data.parish !== undefined) updates.parish = data.parish || null;
  if (data.ordinationDate !== undefined) updates.ordinationDate = data.ordinationDate || null;
  if (data.firstMassDate !== undefined) updates.firstMassDate = data.firstMassDate || null;
  if (data.bio !== undefined) updates.bio = data.bio || null;
  if (data.profilePhotoUrl !== undefined) updates.profilePhotoUrl = data.profilePhotoUrl || null;
  if (data.backgroundPhotoUrl !== undefined) updates.backgroundPhotoUrl = data.backgroundPhotoUrl || null;
  if (data.thankYouTemplate !== undefined) updates.thankYouTemplate = data.thankYouTemplate;
  if (data.profileVisible !== undefined) (updates as Record<string, unknown>).profileVisible = data.profileVisible;

  const [updated] = await db
    .update(priests)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(priests.clerkUserId, userId))
    .returning();

  // Revalidate the public-facing pages so changes appear immediately
  revalidatePath(`/p/${priest.slug}`);
  revalidatePath('/directory');

  return NextResponse.json(updated);
}
