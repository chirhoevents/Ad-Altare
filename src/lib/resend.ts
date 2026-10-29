import { Resend } from 'resend';
import { escapeHtml } from './utils';
import {
  BURGUNDY,
  GOLD,
  INK,
  MUTED,
  SERIF,
  ADMIN_FOOTER_NOTE,
  appUrl,
  button,
  detailsCard,
  p,
  render,
  signature,
} from './email-layout';

export { textToHtmlParagraphs } from './email-layout';

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY environment variable is not set');
  }
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

const FROM_ADDRESS = 'Ad Altare <noreply@ad-altare.com>';
/** Every email's replies go to the team inbox. */
const REPLY_TO = 'chirhoevents@gmail.com';

async function send(payload: Parameters<Resend['emails']['send']>[0]): Promise<void> {
  const { data, error } = await getResend().emails.send({ reply_to: REPLY_TO, ...payload });
  if (error) {
    throw new Error(`Resend error: ${error.message} (name: ${error.name})`);
  }
  console.log(`[resend] sent email id=${data?.id} to=${payload.to}`);
}

// ─── Emails ──────────────────────────────────────────────────────────────────

export async function sendDonorConfirmationEmail({
  donorEmail,
  donorName,
  priestName,
  amountFormatted,
  itemName,
  isAnonymous,
}: {
  donorEmail: string;
  donorName: string | null;
  priestName: string;
  amountFormatted: string;
  itemName?: string | null;
  isAnonymous: boolean;
}) {
  const displayName = escapeHtml(isAnonymous ? 'Friend' : (donorName ?? 'Friend'));
  const safePriestName = escapeHtml(priestName);
  const anonymousLine = isAnonymous
    ? p(`<em>Your gift has been recorded anonymously. ${safePriestName} will know only that a generous friend has contributed.</em>`)
    : '';

  await send({
    from: FROM_ADDRESS,
    to: donorEmail,
    subject: `Thank you for supporting ${priestName}'s ordination`,
    ...render(
      `
      ${p(`Dear ${displayName},`)}
      ${p(`Thank you. Your generous gift in support of ${safePriestName}'s ordination has been received.`)}
      ${detailsCard([
        ['Gift', `<strong>${escapeHtml(amountFormatted)}</strong>`],
        ['For', safePriestName],
        ['Toward', itemName ? escapeHtml(itemName) : 'General Fund'],
      ])}
      ${anonymousLine}
      ${p(`Your support helps make possible what God has called ${safePriestName} to — a life of sacred service at the altar.`)}
      ${signature('With gratitude,')}
    `,
        {
          preheader: `Your gift of ${amountFormatted} for ${priestName} has been received.`,
          footerNote: `You're receiving this receipt because you made a gift through Ad Altare.`,
        },
      ),
  });
}

export async function sendPriestNotificationEmail({
  priestEmail,
  priestName,
  amountFormatted,
  donorDisplayName,
  itemName,
}: {
  priestEmail: string;
  priestName: string;
  amountFormatted: string;
  donorDisplayName: string;
  itemName?: string | null;
}) {
  await send({
    from: FROM_ADDRESS,
    to: priestEmail,
    subject: `New donation received for your registry`,
    ...render(
      `
      ${p(`Dear ${escapeHtml(priestName)},`)}
      ${p(`Good news — someone has just given toward your ordination registry.`)}
      ${detailsCard([
        ['Amount', `<strong>${escapeHtml(amountFormatted)}</strong>`],
        ['From', escapeHtml(donorDisplayName)],
        ['Toward', itemName ? escapeHtml(itemName) : 'General Fund'],
      ])}
      ${p(`You can see every gift and send a personal thank-you note from your donor dashboard.`)}
      ${button(`${appUrl()}/dashboard/donors`, 'View your donors')}
      ${signature('In Christ,')}
    `,
        {
          preheader: `${donorDisplayName} gave ${amountFormatted} toward your registry.`,
          footerNote: `You're receiving this because you have a registry on Ad Altare.`,
        },
      ),
  });
}

export async function sendThankYouEmail({
  donorEmail,
  subject,
  bodyHtml,
}: {
  donorEmail: string;
  subject: string;
  bodyHtml: string;
}) {
  await send({
    from: FROM_ADDRESS,
    to: donorEmail,
    subject,
    ...render(bodyHtml, {
      preheader: subject,
      footerNote: `Sent on behalf of a priest you supported through Ad Altare.`,
    }),
  });
}

/**
 * Admin → priest emails. Sent through Resend's batch API (max 100 per call) so a
 * message to every priest doesn't trip the per-second rate limit.
 */
export async function sendAdminEmails(
  messages: { to: string; subject: string; bodyHtml: string }[],
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;
  for (let i = 0; i < messages.length; i += 100) {
    const chunk = messages.slice(i, i + 100);
    const { error } = await getResend().batch.send(
      chunk.map((m) => ({
        from: FROM_ADDRESS,
        to: m.to,
        subject: m.subject,
        ...render(m.bodyHtml, { footerNote: ADMIN_FOOTER_NOTE }),
        reply_to: REPLY_TO,
      })),
    );
    if (error) {
      console.error('[resend] admin batch failed:', error);
      failed += chunk.length;
    } else {
      sent += chunk.length;
    }
  }
  return { sent, failed };
}

/** Sent once after onboarding: what to do next. */
export async function sendWelcomeEmail({ to, firstName }: { to: string; firstName: string }) {
  const step = (n: number, title: string, text: string) => `
    <tr>
      <td valign="top" style="width: 34px; padding: 0 0 18px;">
        <div style="width: 26px; height: 26px; border: 1px solid ${GOLD}; border-radius: 13px; text-align: center; font-family: ${SERIF}; font-size: 13px; line-height: 26px; color: ${BURGUNDY};">${n}</div>
      </td>
      <td valign="top" style="padding: 2px 0 18px 10px; font-family: ${SERIF}; font-size: 16px; line-height: 1.6; color: ${INK};">
        <strong>${title}</strong><br /><span style="color: ${MUTED};">${text}</span>
      </td>
    </tr>`;

  await send({
    from: FROM_ADDRESS,
    to,
    subject: 'Welcome to Ad Altare',
    ...render(
      `
      ${p(`Dear ${escapeHtml(firstName)},`)}
      ${p(`Welcome to Ad Altare! We're honored to walk with you on the road to the altar. Here's how to get your page ready:`)}
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 8px 0 10px;">
        ${step(1, 'Tell your story', 'Add a bio and photos in Settings.')}
        ${step(2, 'Build your wishlist', 'Add the items you need, with a link to where they can be bought. Free.')}
        ${step(3, 'Set up RSVPs', 'Optional — add your guest list and ordination events. Free.')}
        ${step(4, 'Share your link', 'Copy it from your dashboard and send it to family and friends.')}
      </table>
      ${p(`<em>Optional:</em> if you'd also like people to be able to give money directly, connect a free Stripe account in Settings. Gifts go straight to your bank account (a small 1% fee helps keep Ad Altare running). You can do this any time — or never.`)}
      ${button(`${appUrl()}/dashboard`, 'Go to your dashboard')}
      ${p(`<span style="color: ${MUTED};">Questions? Just reply to this email.</span>`)}
      ${signature('In Christ,')}
    `,
        {
          preheader: `Four simple steps to get your ordination page ready.`,
          footerNote: `You're receiving this because you just created an Ad Altare account.`,
        },
      ),
  });
}
