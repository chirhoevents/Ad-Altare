import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { priests, guestList } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const bulkSchema = z.object({
  guests: z.array(
    z.object({
      firstName: z.string().min(1).max(100),
      lastName: z.string().min(1).max(100),
      inviteCount: z.number().int().min(1).max(50).default(1),
      address: z.string().max(500).optional().nullable(),
      phone: z.string().max(30).optional().nullable(),
    })
  ).min(1).max(500),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const priest = await db.query.priests.findFirst({ where: eq(priests.clerkUserId, userId) });
  if (!priest) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = bulkSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

  const rows = parsed.data.guests.map((g) => ({
    priestId: priest.id,
    firstName: g.firstName,
    lastName: g.lastName,
    inviteCount: g.inviteCount,
    address: g.address || null,
    phone: g.phone || null,
  }));

  const inserted = await db.insert(guestList).values(rows).returning();
  return NextResponse.json({ inserted: inserted.length }, { status: 201 });
}
