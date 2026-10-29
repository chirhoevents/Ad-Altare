import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { inArray } from 'drizzle-orm';
import { db } from '@/db';
import { priests } from '@/db/schema';
import { isAdminUser } from '@/lib/admin';
import { AUDIENCES, matchesAudience, type Audience } from '@/lib/admin-audiences';
import { formatPriestNameForEmail } from '@/lib/utils';
import { sendAdminEmails } from '@/lib/resend';
import { personalizeAdminText, textToHtmlParagraphs } from '@/lib/email-layout';

const schema = z.object({
  audience: z.enum([
    ...(Object.keys(AUDIENCES) as [Audience, ...Audience[]]),
    'selected', // specific priests
    'custom', // any typed-in email addresses
    'test', // just the sending admin
  ]),
  priestIds: z.array(z.string().uuid()).max(1000).optional(),
  emails: z.array(z.string().trim().email()).max(100).optional(),
  subject: z.string().min(1).max(200),
  message: z.string().min(1).max(10000),
});

type Recipient = { email: string; firstName?: string; name?: string; pageLink?: string };

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
    const badEmail = parsed.error.issues.some((i) => i.path[0] === 'emails');
    return NextResponse.json(
      { error: badEmail ? 'One of the email addresses looks wrong — please check it.' : 'Please fill in the subject and message.' },
      { status: 400 }
    );
  }
  const { audience, priestIds, emails, subject, message } = parsed.data;

  // The sending admin, for "Send test to myself". Replies go to the team inbox (see resend.ts).
  const client = await clerkClient();
  const admin = await client.users.getUser(userId!);
  const adminEmail = admin.primaryEmailAddress?.emailAddress;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
  const fromPriest = (p: typeof priests.$inferSelect): Recipient => ({
    email: p.email,
    firstName: p.firstName,
    name: formatPriestNameForEmail(p),
    pageLink: `${appUrl}/p/${p.slug}`,
  });

  let recipients: Recipient[];
  if (audience === 'test') {
    if (!adminEmail) return NextResponse.json({ error: 'Your account has no email address.' }, { status: 400 });
    recipients = [{ email: adminEmail, firstName: admin.firstName ?? undefined, name: admin.fullName ?? undefined }];
  } else if (audience === 'custom') {
    const unique = Array.from(new Set((emails ?? []).map((e) => e.toLowerCase())));
    if (unique.length === 0) return NextResponse.json({ error: 'Type at least one email address.' }, { status: 400 });
    // If a typed address belongs to a priest, personalize it for them.
    const known = await db.query.priests.findMany({ where: inArray(priests.email, unique) });
    recipients = unique.map((email) => {
      const p = known.find((k) => k.email.toLowerCase() === email);
      return p ? fromPriest(p) : { email };
    });
  } else if (audience === 'selected') {
    if (!priestIds?.length) return NextResponse.json({ error: 'Pick at least one priest.' }, { status: 400 });
    recipients = (await db.query.priests.findMany({ where: inArray(priests.id, priestIds) })).map(fromPriest);
  } else {
    const all = await db.query.priests.findMany();
    recipients = all.filter((p) => matchesAudience(p, audience)).map(fromPriest);
  }
  recipients = recipients.filter((r) => r.email);
  if (recipients.length === 0) {
    return NextResponse.json({ error: 'No one matches that audience.' }, { status: 400 });
  }

  const { sent, failed } = await sendAdminEmails(
    recipients.map((r) => ({
      to: r.email,
      subject: personalizeAdminText(subject, r),
      bodyHtml: textToHtmlParagraphs(personalizeAdminText(message, r)),
    })),
  );

  if (sent === 0) {
    return NextResponse.json({ error: 'Sending failed. Check the Resend dashboard for details.' }, { status: 502 });
  }
  return NextResponse.json({ sent, failed });
}
