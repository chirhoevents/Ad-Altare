import { Resend } from 'resend';
import { escapeHtml } from './utils';

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY environment variable is not set');
  }
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

const FROM_ADDRESS = 'Ad Altare <noreply@ad-altare.com>';

async function send(payload: Parameters<Resend['emails']['send']>[0]): Promise<void> {
  const { data, error } = await getResend().emails.send(payload);
  if (error) {
    throw new Error(`Resend error: ${error.message} (name: ${error.name})`);
  }
  console.log(`[resend] sent email id=${data?.id} to=${payload.to}`);
}

// ─── Layout ──────────────────────────────────────────────────────────────────
// Table-based with inline styles so it renders the same in Gmail, Outlook and
// Apple Mail. No images or tracking pixels: text-only branding keeps emails
// light, readable with images blocked, and out of spam filters.

const BURGUNDY = '#6B1E2E';
const GOLD = '#B8960C';
const CREAM = '#FAF7F2';
const INK = '#2A2522';
const MUTED = '#7A706A';
const SERIF = "Georgia, 'Times New Roman', Times, serif";

const P_STYLE = `margin: 0 0 18px; font-family: ${SERIF}; font-size: 16px; line-height: 1.7; color: ${INK};`;

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? 'https://ad-altare.com';
}

function p(html: string): string {
  return `<p style="${P_STYLE}">${html}</p>`;
}

/** Plain text (as typed by a priest or admin) → escaped, styled HTML paragraphs. */
export function textToHtmlParagraphs(text: string): string {
  return text
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => p(escapeHtml(line)))
    .join('');
}

/** Bulletproof button: a table cell with a background, so it shows in Outlook too. */
function button(href: string, label: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 28px 0 8px;">
      <tr>
        <td bgcolor="${BURGUNDY}" style="border-radius: 4px; background-color: ${BURGUNDY};">
          <a href="${href}" target="_blank" style="display: inline-block; padding: 13px 28px; font-family: ${SERIF}; font-size: 15px; letter-spacing: 0.5px; color: ${CREAM}; text-decoration: none; border-radius: 4px;">${label}</a>
        </td>
      </tr>
    </table>`;
}

/** A framed card of label/value rows, e.g. a donation summary. */
function detailsCard(rows: [label: string, valueHtml: string][]): string {
  const body = rows
    .map(
      ([label, value], i) => `
        <tr>
          <td style="padding: 12px 20px; ${i ? 'border-top: 1px solid #EDE6DA;' : ''} font-family: ${SERIF}; font-size: 12px; letter-spacing: 1.5px; text-transform: uppercase; color: ${MUTED}; white-space: nowrap;">${label}</td>
          <td align="right" style="padding: 12px 20px; ${i ? 'border-top: 1px solid #EDE6DA;' : ''} font-family: ${SERIF}; font-size: 16px; color: ${INK};">${value}</td>
        </tr>`,
    )
    .join('');
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 8px 0 26px; background-color: ${CREAM}; border: 1px solid #E6DFD3; border-top: 3px solid ${GOLD}; border-radius: 4px;">
      ${body}
    </table>`;
}

/** Closing with a short gold rule above it. */
function signature(closing: string, from = 'The Ad Altare Team'): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 34px 0 0;">
      <tr><td style="width: 40px; height: 1px; line-height: 1px; font-size: 1px; background-color: ${GOLD};">&nbsp;</td></tr>
    </table>
    <p style="margin: 18px 0 0; font-family: ${SERIF}; font-size: 16px; line-height: 1.6; font-style: italic; color: ${MUTED};">${closing}</p>
    <p style="margin: 2px 0 0; font-family: ${SERIF}; font-size: 16px; line-height: 1.6; color: ${INK};">${from}</p>`;
}

function brandedLayout(
  bodyHtml: string,
  { preheader = '', footerNote = '' }: { preheader?: string; footerNote?: string } = {},
): string {
  const site = appUrl();
  // Hidden preview text shown next to the subject in the inbox. The trailing
  // zero-width joiners stop clients padding the preview with body text.
  const preheaderHtml = preheader
    ? `<div style="display: none; max-height: 0; overflow: hidden; mso-hide: all; font-size: 1px; line-height: 1px; color: ${CREAM};">${escapeHtml(preheader)}${'&#847;&zwnj;&nbsp;'.repeat(40)}</div>`
    : '';

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>Ad Altare</title>
  <style>
    @media only screen and (max-width: 620px) {
      .aa-body { padding: 32px 24px !important; }
      .aa-header { padding: 36px 24px 30px !important; }
    }
    a { color: ${BURGUNDY}; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #EFE9DF; -webkit-text-size-adjust: 100%;">
  ${preheaderHtml}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#EFE9DF" style="background-color: #EFE9DF;">
    <tr>
      <td align="center" style="padding: 40px 12px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width: 100%; max-width: 600px;">
          <tr>
            <td style="background-color: #FFFDF9; border: 1px solid #E3DACB; border-radius: 6px; overflow: hidden;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td class="aa-header" align="center" bgcolor="${BURGUNDY}" style="background-color: ${BURGUNDY}; border-top: 4px solid ${GOLD}; border-radius: 6px 6px 0 0; padding: 44px 40px 36px;">
                    <div style="font-family: ${SERIF}; font-size: 20px; line-height: 1; color: ${GOLD};">&#10016;</div>
                    <div style="margin-top: 14px; font-family: ${SERIF}; font-size: 30px; line-height: 1.1; letter-spacing: 6px; text-transform: uppercase; color: ${CREAM};">Ad Altare</div>
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 16px auto 0;">
                      <tr>
                        <td valign="middle" style="width: 36px;"><div style="height: 1px; line-height: 1px; font-size: 1px; background-color: ${GOLD};">&nbsp;</div></td>
                        <td style="padding: 0 12px; font-family: ${SERIF}; font-size: 14px; font-style: italic; letter-spacing: 1px; color: #D9BC5A; white-space: nowrap;">To the Altar</td>
                        <td valign="middle" style="width: 36px;"><div style="height: 1px; line-height: 1px; font-size: 1px; background-color: ${GOLD};">&nbsp;</div></td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td class="aa-body" style="padding: 44px 52px 48px; font-family: ${SERIF}; font-size: 16px; line-height: 1.7; color: ${INK};">
                    ${bodyHtml}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 28px 24px 0; font-family: ${SERIF}; font-size: 12px; line-height: 1.7; color: ${MUTED};">
              <div style="letter-spacing: 2px; text-transform: uppercase; color: ${BURGUNDY};">Ad Altare</div>
              <div style="font-style: italic;">Serving the Church with dignity</div>
              <div style="margin-top: 10px;"><a href="${site}" style="color: ${MUTED}; text-decoration: underline;">${escapeHtml(site.replace(/^https?:\/\//, ''))}</a></div>
              ${footerNote ? `<div style="margin-top: 14px; color: #9A908A;">${footerNote}</div>` : ''}
              <div style="margin-top: 14px; font-size: 11px; color: #9A908A;">Powered by <a href="https://chirhoevents.com" target="_blank" style="color: #9A908A; text-decoration: underline;">Chirho technology</a></div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Plain-text alternative sent alongside the HTML. Multipart emails with a
 * matching text part score better with spam filters than HTML-only ones.
 */
function htmlToText(html: string): string {
  return html
    .replace(/<(style|title)[\s\S]*?<\/\1>/gi, '')
    .replace(/<div style="display: none[\s\S]*?<\/div>/i, '')
    .replace(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href, label) => {
      const text = label.replace(/<[^>]+>/g, '').trim();
      return text.includes(href.replace(/^https?:\/\//, '')) ? text : `${text} (${href})`;
    })
    .replace(/<li[^>]*>/gi, '\n• ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|tr|h\d|ol|ul|table)>/gi, '\n')
    .replace(/<\/td>/gi, '  ')
    .replace(/<[^>]+>/g, '')
    .replace(/&#10016;/g, '✠')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#847;|&zwnj;/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&mdash;/g, '—')
    .replace(/&amp;/g, '&')
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function render(bodyHtml: string, opts?: { preheader?: string; footerNote?: string }) {
  const html = brandedLayout(bodyHtml, opts);
  return { html, text: htmlToText(html) };
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
 * message to every priest doesn't trip the per-second rate limit. Replies go to
 * the admin who sent it.
 */
export async function sendAdminEmails(
  messages: { to: string; subject: string; bodyHtml: string }[],
  replyTo?: string,
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
        ...render(m.bodyHtml, {
          footerNote: `You're receiving this because you have an account on Ad Altare. Just reply to reach us.`,
        }),
        ...(replyTo ? { reply_to: replyTo } : {}),
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
    reply_to: 'support@ad-altare.com',
  });
}
