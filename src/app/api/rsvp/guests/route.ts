import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { priests, guestList } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';
import { z } from 'zod';

async function getPriest() {
  const { userId } = await auth();
  if (!userId) return null;
  return db.query.priests.findFirst({ where: eq(priests.clerkUserId, userId) });
}

const createSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  inviteCount: z.number().int().min(1).max(50).default(1),
  address: z.string().max(500).optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
});

export async function GET() {
  const priest = await getPriest();
  if (!priest) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const guests = await db.query.guestList.findMany({
    where: eq(guestList.priestId, priest.id),
    orderBy: [asc(guestList.lastName), asc(guestList.firstName)],
  });

  return NextResponse.json(guests);
}

export async function POST(req: Request) {
  const priest = await getPriest();
  if (!priest) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

  const { firstName, lastName, inviteCount, address, phone } = parsed.data;
  const [created] = await db
    .insert(guestList)
    .values({
      priestId: priest.id,
      firstName,
      lastName,
      inviteCount,
      address: address || null,
      phone: phone || null,
    })
    .returning();

  return NextResponse.json(created, { status: 201 });
}
