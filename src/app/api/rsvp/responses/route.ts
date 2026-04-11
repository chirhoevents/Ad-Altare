import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { priests, events, guestList, rsvps, eventQuestions } from '@/db/schema';
import { eq, and, count, sum } from 'drizzle-orm';

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const priest = await db.query.priests.findFirst({ where: eq(priests.clerkUserId, userId) });
  if (!priest) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const eventId = url.searchParams.get('eventId');

  if (!eventId) {
    // Return list of events with headcount summaries
    const priestEvents = await db.query.events.findMany({
      where: eq(events.priestId, priest.id),
      orderBy: (e, { asc }) => [asc(e.date)],
    });

    const [totalGuestsResult] = await db
      .select({ count: count() })
      .from(guestList)
      .where(eq(guestList.priestId, priest.id));

    return NextResponse.json({
      events: priestEvents,
      totalGuests: Number(totalGuestsResult?.count ?? 0),
    });
  }

  // Verify event belongs to this priest
  const event = await db.query.events.findFirst({
    where: and(eq(events.id, eventId), eq(events.priestId, priest.id)),
  });
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Get questions for this event
  const questions = await db.query.eventQuestions.findMany({
    where: eq(eventQuestions.eventId, eventId),
    orderBy: (q, { asc }) => [asc(q.sortOrder)],
  });

  // Get RSVPs with guest info
  const responses = await db.query.rsvps.findMany({
    where: eq(rsvps.eventId, eventId),
    with: { guest: true },
    orderBy: (r, { desc }) => [desc(r.createdAt)],
  });

  // Headcount summary
  const [totalGuestsResult] = await db
    .select({ count: count() })
    .from(guestList)
    .where(eq(guestList.priestId, priest.id));

  const totalGuests = Number(totalGuestsResult?.count ?? 0);
  const rsvpdYes = responses.filter((r) => r.attending).length;
  const rsvpdNo = responses.filter((r) => !r.attending).length;
  const awaiting = totalGuests - rsvpdYes - rsvpdNo;

  const partySizeYes = responses
    .filter((r) => r.attending)
    .reduce((s, r) => s + r.partySize, 0);

  return NextResponse.json({
    event,
    questions,
    responses,
    summary: {
      totalGuests,
      rsvpdYes,
      rsvpdNo,
      awaiting: Math.max(0, awaiting),
      totalAttending: partySizeYes,
    },
  });
}
