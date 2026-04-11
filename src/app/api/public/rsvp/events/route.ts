import { NextResponse } from 'next/server';
import { db } from '@/db';
import { priests, events } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const priestId = url.searchParams.get('priestId');

  if (!priestId) return NextResponse.json({ error: 'priestId required' }, { status: 400 });

  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

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
