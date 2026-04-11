import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { priests } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { generateUniqueSlug } from '@/lib/slug';
import { z } from 'zod';

const schema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  seminary: z.string().max(200).optional().default(''),
  diocese: z.string().max(200).optional().default(''),
  parish: z.string().max(200).optional().default(''),
  ordinationDate: z.string().optional().default(''),
  firstMassDate: z.string().optional().default(''),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Check if priest record already exists
  const existing = await db.query.priests.findFirst({
    where: eq(priests.clerkUserId, userId),
  });
  if (existing) {
    return NextResponse.json({ error: 'Already onboarded' }, { status: 400 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
  }

  const { firstName, lastName, seminary, diocese, parish, ordinationDate, firstMassDate } =
    parsed.data;

  const user = await currentUser();
  const email = user?.emailAddresses[0]?.emailAddress ?? '';

  const slug = await generateUniqueSlug(firstName, lastName);

  await db.insert(priests).values({
    clerkUserId: userId,
    firstName,
    lastName,
    email,
    seminary: seminary || null,
    diocese: diocese || null,
    parish: parish || null,
    ordinationDate: ordinationDate || null,
    firstMassDate: firstMassDate || null,
    slug,
  });

  return NextResponse.json({ success: true, slug });
}
