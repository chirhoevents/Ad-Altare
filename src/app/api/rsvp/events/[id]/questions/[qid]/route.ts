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

const patchSchema = z.object({
  questionText: z.string().min(1).max(500).optional(),
  questionType: z.enum(['text', 'yes_no', 'select']).optional(),
  options: z.array(z.string().min(1).max(200)).nullable().optional(),
  isRequired: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: { id: string; qid: string } }
) {
  const priest = await getPriest();
  if (!priest) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Verify event belongs to this priest
  const event = await db.query.events.findFirst({
    where: and(eq(events.id, params.id), eq(events.priestId, priest.id)),
  });
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

  const updates: Record<string, unknown> = {};
  const d = parsed.data;
  if (d.questionText !== undefined) updates.questionText = d.questionText;
  if (d.questionType !== undefined) updates.questionType = d.questionType;
  if (d.options !== undefined) updates.options = d.options;
  if (d.isRequired !== undefined) updates.isRequired = d.isRequired;
  if (d.sortOrder !== undefined) updates.sortOrder = d.sortOrder;

  const [updated] = await db
    .update(eventQuestions)
    .set(updates)
    .where(and(eq(eventQuestions.id, params.qid), eq(eventQuestions.eventId, params.id)))
    .returning();

  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string; qid: string } }
) {
  const priest = await getPriest();
  if (!priest) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const event = await db.query.events.findFirst({
    where: and(eq(events.id, params.id), eq(events.priestId, priest.id)),
  });
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await db
    .delete(eventQuestions)
    .where(and(eq(eventQuestions.id, params.qid), eq(eventQuestions.eventId, params.id)));

  return NextResponse.json({ success: true });
}
