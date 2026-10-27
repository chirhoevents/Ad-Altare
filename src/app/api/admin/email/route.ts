import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { inArray } from 'drizzle-orm';
import { db } from '@/db';
import { priests } from '@/db/schema';
import { isAdminUser } from '@/lib/visibility';
import { AUDIENCES, matchesAudience, type Audience } from '@/lib/admin-audiences';
import { formatPriestNameForEmail } from '@/lib/utils';
import { sendAdminEmails, textToHtmlParagraphs } from '@/lib/resend';

const schema = z.object({
  audience: z.enum([...(Object.keys(AUDIENCES) as [Audience, ...Audience[]]), 'selected']),
  priestIds: z.array(z.string().uuid()).max(1000).optional(),
  subject: z.string().min(1).max(200),
  message: z.string().min(1).max(10000),
});

/** {first_name}, {name} (with title) and {page_link} are filled in per priest. */
function personalize(text: string, priest: { firstName: string; slug: string; name: string }) {
  const pageLink = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/p/${priest.slug}`;
  return text
    .replace(/\{first_name\}/g, priest.firstName)
    .replace(/\{name\}/g, priest.name)
    .replace(/\{page_link\}/g, pageLink);
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!(await isAdminUser(userId))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'Email is not configured (RESEND_API_KEY missing).' }, { status: 503 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Please fill in the subject and message.' }, { status: 400 });
  }
  const { audience, priestIds, subject, message } = parsed.data;

  let recipients;
  if (audience === 'selected') {
    if (!priestIds?.length) {
      return NextResponse.json({ error: 'Pick at least one priest.' }, { status: 400 });
    }
    recipients = await db.query.priests.findMany({ where: inArray(priests.id, priestIds) });
  } else {
    const all = await db.query.priests.findMany();
    recipients = all.filter((p) => matchesAudience(p, audience));
  }
  recipients = recipients.filter((p) => p.email);
  if (recipients.length === 0) {
    return NextResponse.json({ error: 'No priests match that audience.' }, { status: 400 });
  }

  // Replies go to the admin who sent the message.
  const client = await clerkClient();
  const admin = await client.users.getUser(userId!);
  const replyTo = admin.primaryEmailAddress?.emailAddress ?? undefined;

  const { sent, failed } = await sendAdminEmails(
    recipients.map((p) => {
      const vars = { firstName: p.firstName, slug: p.slug, name: formatPriestNameForEmail(p) };
      return {
        to: p.email,
        subject: personalize(subject, vars),
        bodyHtml: textToHtmlParagraphs(personalize(message, vars)),
      };
    }),
    replyTo,
  );

  if (sent === 0) {
    return NextResponse.json({ error: 'Sending failed. Check the Resend dashboard for details.' }, { status: 502 });
  }
  return NextResponse.json({ sent, failed });
}
