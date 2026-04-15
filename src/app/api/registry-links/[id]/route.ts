import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { priests, registryLinks } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const priest = await db.query.priests.findFirst({ where: eq(priests.clerkUserId, userId) });
  if (!priest) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await db.delete(registryLinks).where(
    and(eq(registryLinks.id, params.id), eq(registryLinks.priestId, priest.id))
  );
  return NextResponse.json({ success: true });
}
