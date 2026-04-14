import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { priests, donations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { sendThankYouEmail } from '@/lib/resend';
import { applyMergeTagsToTemplate, formatCurrency, formatPriestName, getTitleForDisplay } from '@/lib/utils';
import { z } from 'zod';

const schema = z.object({
  donationId: z.string().uuid(),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const priest = await db.query.priests.findFirst({
    where: eq(priests.clerkUserId, userId),
  });
  if (!priest) return NextResponse.json({ error: 'Priest not found' }, { status: 404 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const donation = await db.query.donations.findFirst({
    where: and(
      eq(donations.id, parsed.data.donationId),
      eq(donations.priestId, priest.id)
    ),
    with: { registryItem: { columns: { name: true } } },
  });

  if (!donation) {
    return NextResponse.json({ error: 'Donation not found' }, { status: 404 });
  }

  if (donation.thankYouSent) {
    return NextResponse.json({ error: 'Thank-you already sent' }, { status: 400 });
  }

  const template = priest.thankYouTemplate ?? '';
  const priestName = formatPriestName(priest);
  // Pass just the name (not "Dear Friend") — the template itself contains "Dear {donor_name}"
  const donorName = donation.isAnonymous ? 'Friend' : (donation.donorName ?? 'Friend');
  const itemName = donation.registryItem?.name ?? '';

  const body_text = applyMergeTagsToTemplate(template, {
    donor_name: donorName,
    item_name: itemName || undefined,
    priest_name: priestName,
    amount: formatCurrency(donation.amountGross),
  });

  // Convert newlines to HTML paragraphs
  const bodyHtml = body_text
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => `<p style="margin-bottom:12px;">${line}</p>`)
    .join('');

  try {
    await sendThankYouEmail({
      donorEmail: donation.donorEmail,
      subject: `A personal note from ${priestName}`,
      bodyHtml,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to send email';
    console.error('[thank-you] email send failed:', err);
    return NextResponse.json({ error: message }, { status: 502 });
  }

  // Mark as sent only after confirmed delivery to Resend
  await db
    .update(donations)
    .set({ thankYouSent: true })
    .where(eq(donations.id, donation.id));

  return NextResponse.json({ success: true });
}
