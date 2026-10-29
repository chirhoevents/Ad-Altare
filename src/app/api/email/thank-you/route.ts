import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { priests, donations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { sendThankYouEmail } from '@/lib/resend';
import { textToHtmlParagraphs } from '@/lib/email-layout';
import {
  applyMergeTagsToTemplate,
  formatCurrency,
  formatPriestNameForEmail,
  FALLBACK_THANK_YOU_TEMPLATE,
} from '@/lib/utils';
import { z } from 'zod';

const schema = z.object({
  donationId: z.string().uuid(),
  // Optional edited text from the preview dialog; defaults to the priest's template
  message: z.string().trim().min(1).max(5000).optional(),
  subject: z.string().trim().min(1).max(200).optional(),
});

/** Load the signed-in priest's donation and the note their template produces. */
async function loadDraft(donationId: string) {
  const { userId } = await auth();
  if (!userId) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };

  const priest = await db.query.priests.findFirst({ where: eq(priests.clerkUserId, userId) });
  if (!priest) return { error: NextResponse.json({ error: 'Priest not found' }, { status: 404 }) };

  const donation = await db.query.donations.findFirst({
    where: and(eq(donations.id, donationId), eq(donations.priestId, priest.id)),
    with: { registryItem: { columns: { name: true } } },
  });
  if (!donation) return { error: NextResponse.json({ error: 'Donation not found' }, { status: 404 }) };

  const priestName = formatPriestNameForEmail(priest);
  const message = applyMergeTagsToTemplate(priest.thankYouTemplate?.trim() || FALLBACK_THANK_YOU_TEMPLATE, {
    // The template itself contains "Dear {donor_name}"
    donor_name: donation.isAnonymous ? 'Friend' : (donation.donorName ?? 'Friend'),
    item_name: donation.registryItem?.name || undefined,
    priest_name: priestName,
    amount: formatCurrency(donation.amountGross),
  });

  return {
    donation,
    draft: { subject: `A personal note from ${priestName}`, message },
  };
}

/** Preview: the note that would be sent, so the priest can read and edit it first. */
export async function GET(req: Request) {
  const donationId = new URL(req.url).searchParams.get('donationId') ?? '';
  if (!z.string().uuid().safeParse(donationId).success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }
  const result = await loadDraft(donationId);
  if ('error' in result) return result.error;
  return NextResponse.json(result.draft);
}

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const result = await loadDraft(parsed.data.donationId);
  if ('error' in result) return result.error;
  const { donation, draft } = result;

  if (donation.thankYouSent) {
    return NextResponse.json({ error: 'Thank-you already sent' }, { status: 400 });
  }

  // Convert newlines to HTML paragraphs
  const bodyHtml = textToHtmlParagraphs(parsed.data.message ?? draft.message);

  try {
    await sendThankYouEmail({
      donorEmail: donation.donorEmail,
      subject: parsed.data.subject ?? draft.subject,
      bodyHtml,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to send email';
    console.error('[thank-you] email send failed:', err);
    return NextResponse.json({ error: message }, { status: 502 });
  }

  // Mark as sent only after confirmed delivery to Resend
  await db.update(donations).set({ thankYouSent: true }).where(eq(donations.id, donation.id));

  return NextResponse.json({ success: true });
}
