import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { priests, donations } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const priest = await db.query.priests.findFirst({
    where: eq(priests.clerkUserId, userId),
  });
  if (!priest) return NextResponse.json({ error: 'Priest not found' }, { status: 404 });

  const rows = await db.query.donations.findMany({
    where: eq(donations.priestId, priest.id),
    with: { registryItem: { columns: { name: true } } },
    orderBy: (donations, { desc }) => [desc(donations.createdAt)],
  });

  return NextResponse.json(rows);
}
