import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { priests } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

async function assertAdmin() {
  const { userId } = await auth();
  if (!userId) return false;
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const role = user.publicMetadata?.role as string | undefined;
  return role === 'admin';
}

const patchSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  currentTitle: z.enum(['Seminarian', 'Transitional Deacon', 'Deacon', 'Father']).optional(), // admin can set Father directly
  phone: z.string().max(30).optional(),
  seminary: z.string().max(200).optional(),
  diocese: z.string().max(200).optional(),
  parish: z.string().max(200).optional(),
  ordinationDate: z.string().optional(),
  firstMassDate: z.string().optional(),
  bio: z.string().max(5000).optional(),
  stripeOnboardingComplete: z.boolean().optional(),
  platformFeeOverride: z.number().int().min(0).max(100).nullable().optional(), // null=1% default, 0=waived, N=N%
  profileVisible: z.boolean().optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  if (!(await assertAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const priest = await db.query.priests.findFirst({
    where: eq(priests.id, params.id),
    with: {
      registryItems: { orderBy: (items, { asc }) => [asc(items.createdAt)] },
      donations: {
        orderBy: (d, { desc }) => [desc(d.createdAt)],
        with: { registryItem: { columns: { name: true } } },
      },
    },
  });

  if (!priest) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(priest);
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  if (!(await assertAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const data = parsed.data;
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (data.firstName !== undefined) updates.firstName = data.firstName;
  if (data.lastName !== undefined) updates.lastName = data.lastName;
  if (data.currentTitle !== undefined) updates.currentTitle = data.currentTitle;
  if (data.phone !== undefined) updates.phone = data.phone || null;
  if (data.seminary !== undefined) updates.seminary = data.seminary || null;
  if (data.diocese !== undefined) updates.diocese = data.diocese || null;
  if (data.parish !== undefined) updates.parish = data.parish || null;
  if (data.ordinationDate !== undefined) updates.ordinationDate = data.ordinationDate || null;
  if (data.firstMassDate !== undefined) updates.firstMassDate = data.firstMassDate || null;
  if (data.bio !== undefined) updates.bio = data.bio || null;
  if (data.stripeOnboardingComplete !== undefined) updates.stripeOnboardingComplete = data.stripeOnboardingComplete;
  if (data.profileVisible !== undefined) updates.profileVisible = data.profileVisible;
  // platformFeeOverride can be null (restore default), 0 (waive), or 1-100 (custom %)
  if (Object.prototype.hasOwnProperty.call(data, 'platformFeeOverride')) {
    updates.platformFeeOverride = data.platformFeeOverride ?? null;
  }

  const [updated] = await db
    .update(priests)
    .set(updates)
    .where(eq(priests.id, params.id))
    .returning();

  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  if (!(await assertAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await db.delete(priests).where(eq(priests.id, params.id));
  return NextResponse.json({ success: true });
}
