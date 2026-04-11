import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { priests, events, eventQuestions } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

async function getPriest() {
  const { userId } = await auth();
  if (!userId) return null;
  return db.query.priests.findFirst({ where: eq(priests.clerkUserId, userId) });
}

const createSchema = z.object({
  questionText: z.string().min(1).max(500),
  questionType: z.enum(['text', 'yes_no', 'select']),
  options: z.array(z.string().min(1).max(200)).optional(),
  isRequired: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
});

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const priest = await getPriest();
  if (!priest) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Verify event belongs to this priest
  const event = await db.query.events.findFirst({
    where: and(eq(events.id, params.id), eq(events.priestId, priest.id)),
  });
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const questions = await db.query.eventQuestions.findMany({
    where: eq(eventQuestions.eventId, params.id),
    orderBy: (q, { asc }) => [asc(q.sortOrder)],
  });

  return NextResponse.json(questions);
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const priest = await getPriest();
  if (!priest) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const event = await db.query.events.findFirst({
    where: and(eq(events.id, params.id), eq(events.priestId, priest.id)),
  });
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

  const { questionText, questionType, options, isRequired, sortOrder } = parsed.data;
  const [created] = await db
    .insert(eventQuestions)
    .values({
      eventId: params.id,
      questionText,
      questionType,
      options: questionType === 'select' ? (options ?? []) : null,
      isRequired,
      sortOrder,
    })
    .returning();

  return NextResponse.json(created, { status: 201 });
}
