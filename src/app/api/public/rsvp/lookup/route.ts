import { NextResponse } from 'next/server';
import { db } from '@/db';
import { priests, guestList } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { z } from 'zod';

const schema = z.object({
  priestId: z.string().uuid(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

  const { priestId, firstName, lastName } = parsed.data;

  // Case-insensitive name match
  const guest = await db.query.guestList.findFirst({
    where: and(
      eq(guestList.priestId, priestId),
      sql`lower(${guestList.firstName}) = lower(${firstName})`,
      sql`lower(${guestList.lastName}) = lower(${lastName})`
    ),
  });

  if (!guest) return NextResponse.json({ found: false });

  return NextResponse.json({
    found: true,
    guest: {
      id: guest.id,
      firstName: guest.firstName,
      lastName: guest.lastName,
      inviteCount: guest.inviteCount,
      address: guest.address,
      phone: guest.phone,
    },
  });
}
