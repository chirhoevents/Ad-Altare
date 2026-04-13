import { NextResponse } from 'next/server';
import { db } from '@/db';
import { guestList, events, rsvps } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { z } from 'zod';

const schema = z.object({
  guestId: z.string().uuid(),
  responses: z.array(
    z.object({
      eventId: z.string().uuid(),
      attending: z.boolean(),
      partySize: z.number().int().min(1),
      questionResponses: z.record(z.string()).optional().default({}),
    })
  ).min(1),
  guestAddress: z.string().max(500).nullish(),
  guestPhone: z.string().max(50).nullish(),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

  const { guestId, responses, guestAddress, guestPhone } = parsed.data;

  // Verify guest exists and get their inviteCount
  const guest = await db.query.guestList.findFirst({
    where: eq(guestList.id, guestId),
  });
  if (!guest) return NextResponse.json({ error: 'Guest not found' }, { status: 404 });

  const today = new Date().toISOString().split('T')[0];

  // Validate each response
  for (const r of responses) {
    if (r.partySize > guest.inviteCount) {
      return NextResponse.json(
        { error: `Party size ${r.partySize} exceeds your invite count of ${guest.inviteCount}` },
        { status: 400 }
      );
    }

    // Verify event belongs to same priest and RSVP is still open
    const event = await db.query.events.findFirst({
      where: and(
        eq(events.id, r.eventId),
        eq(events.priestId, guest.priestId),
        eq(events.rsvpEnabled, true)
      ),
    });
    if (!event) {
      return NextResponse.json({ error: `Event not found or RSVP not enabled` }, { status: 400 });
    }
    if (event.rsvpDeadline && event.rsvpDeadline < today) {
      return NextResponse.json({ error: `RSVP deadline has passed for "${event.name}"` }, { status: 400 });
    }
  }

  // Upsert RSVPs (insert or update on conflict)
  for (const r of responses) {
    await db
      .insert(rsvps)
      .values({
        guestId,
        eventId: r.eventId,
        attending: r.attending,
        partySize: r.partySize,
        questionResponses: r.questionResponses,
      })
      .onConflictDoUpdate({
        target: [rsvps.guestId, rsvps.eventId],
        set: {
          attending: r.attending,
          partySize: r.partySize,
          questionResponses: r.questionResponses,
        },
      });
  }

  // Update guest contact info if provided
  if (guestAddress || guestPhone) {
    await db
      .update(guestList)
      .set({
        ...(guestAddress ? { address: guestAddress } : {}),
        ...(guestPhone ? { phone: guestPhone } : {}),
      })
      .where(eq(guestList.id, guestId));
  }

  return NextResponse.json({ success: true });
}
