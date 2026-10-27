import { NextResponse } from 'next/server';
import { db } from '@/db';
import { priests, events } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { todayForDeadlines } from '@/lib/utils';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const priestId = url.searchParams.get('priestId');

  if (!priestId || !z.string().uuid().safeParse(priestId).success) {
    return NextResponse.json({ error: 'Valid priestId required' }, { status: 400 });
  }

  // Deadline day stays open until midnight Pacific (see todayForDeadlines)
  const today = todayForDeadlines();

  const allEnabled = await db.query.events.findMany({
    where: and(eq(events.priestId, priestId), eq(events.rsvpEnabled, true)),
    with: { questions: { orderBy: (q, { asc }) => [asc(q.sortOrder)] } },
    orderBy: (e, { asc }) => [asc(e.date)],
  });

  // Separate open events from closed (past deadline) events
  const openEvents = allEnabled.filter(
    (e) => !e.rsvpDeadline || e.rsvpDeadline >= today
  );
  const allClosed = allEnabled.length > 0 && openEvents.length === 0;

  return NextResponse.json({ events: openEvents, allClosed });
}
