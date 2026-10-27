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
  const itemLine = itemName
    ? `<p>Your donation has been directed toward: <strong>${escapeHtml(itemName)}</strong></p>`
    : '';
  const anonymousLine = isAnonymous
    ? `<p><em>Your donation has been recorded anonymously. ${safePriestName} will know only that a generous donor has contributed.</em></p>`
    : '';

  await send({
    from: FROM_ADDRESS,
    to: donorEmail,
    subject: `Thank you for supporting ${priestName}'s ordination`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #1C1C1E;">
        <div style="background-color: #6B1E2E; padding: 32px; text-align: center;">
          <h1 style="color: #FAF7F2; font-size: 28px; margin: 0;">Ad Altare</h1>
          <p style="color: #B8960C; margin: 8px 0 0; font-style: italic;">To the Altar</p>
        </div>
        <div style="padding: 32px; background-color: #FAF7F2;">
          <p>Dear ${displayName},</p>
          <p>Your generous gift of <strong>${amountFormatted}</strong> in support of ${safePriestName}'s ordination has been received.</p>
          ${itemLine}
          ${anonymousLine}
          <p>Your support helps make possible what God has called ${safePriestName} to — a life of sacred service at the altar.</p>
          <p style="margin-top: 32px;">With gratitude,<br/>The Ad Altare Team</p>
        </div>
        <div style="background-color: #1C1C1E; padding: 16px; text-align: center;">
          <p style="color: #FAF7F2; font-size: 12px; margin: 0;">Ad Altare · Serving the Church with dignity</p>
        </div>
      </div>
    `,
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
  const itemLine = itemName
    ? `<p><strong>Item:</strong> ${escapeHtml(itemName)}</p>`
    : `<p><strong>Item:</strong> General Fund</p>`;

  await send({
    from: FROM_ADDRESS,
    to: priestEmail,
    subject: `New donation received for your registry`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #1C1C1E;">
        <div style="background-color: #6B1E2E; padding: 32px; text-align: center;">
          <h1 style="color: #FAF7F2; font-size: 28px; margin: 0;">Ad Altare</h1>
          <p style="color: #B8960C; margin: 8px 0 0; font-style: italic;">To the Altar</p>
        </div>
        <div style="padding: 32px; background-color: #FAF7F2;">
          <p>Dear ${escapeHtml(priestName)},</p>
          <p>You have received a new donation for your ordination registry.</p>
          <div style="background: white; border-left: 4px solid #B8960C; padding: 16px; margin: 24px 0;">
            <p><strong>Amount:</strong> ${amountFormatted}</p>
            <p><strong>From:</strong> ${escapeHtml(donorDisplayName)}</p>
            ${itemLine}
          </div>
          <p>You can view all donations and send thank-you notes from your <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/donors" style="color: #6B1E2E;">donor dashboard</a>.</p>
          <p style="margin-top: 32px;">Ad Altare</p>
        </div>
      </div>
    `,
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
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #1C1C1E;">
        <div style="background-color: #6B1E2E; padding: 32px; text-align: center;">
          <h1 style="color: #FAF7F2; font-size: 28px; margin: 0;">Ad Altare</h1>
          <p style="color: #B8960C; margin: 8px 0 0; font-style: italic;">To the Altar</p>
        </div>
        <div style="padding: 32px; background-color: #FAF7F2;">
          ${bodyHtml}
        </div>
        <div style="background-color: #1C1C1E; padding: 16px; text-align: center;">
          <p style="color: #FAF7F2; font-size: 12px; margin: 0;">Ad Altare · Serving the Church with dignity</p>
        </div>
      </div>
    `,
  });
}

/** Plain text (as typed by an admin) → escaped HTML paragraphs. */
export function textToHtmlParagraphs(text: string): string {
  return text
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => `<p style="margin-bottom:12px;">${escapeHtml(line)}</p>`)
    .join('');
}

function brandedLayout(bodyHtml: string): string {
  return `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #1C1C1E;">
        <div style="background-color: #6B1E2E; padding: 32px; text-align: center;">
          <h1 style="color: #FAF7F2; font-size: 28px; margin: 0;">Ad Altare</h1>
          <p style="color: #B8960C; margin: 8px 0 0; font-style: italic;">To the Altar</p>
        </div>
        <div style="padding: 32px; background-color: #FAF7F2;">
          ${bodyHtml}
        </div>
        <div style="background-color: #1C1C1E; padding: 16px; text-align: center;">
          <p style="color: #FAF7F2; font-size: 12px; margin: 0;">Ad Altare · Serving the Church with dignity</p>
        </div>
      </div>
    `;
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
        html: brandedLayout(m.bodyHtml),
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
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
  await send({
    from: FROM_ADDRESS,
    to,
    subject: 'Welcome to Ad Altare',
    html: brandedLayout(`
      <p>Dear ${escapeHtml(firstName)},</p>
      <p>Welcome to Ad Altare! We're honored to walk with you on the road to the altar. Here's how to get your page ready:</p>
      <ol style="padding-left: 20px; line-height: 1.7;">
        <li><strong>Tell your story</strong> — add a bio and photos in Settings.</li>
        <li><strong>Build your registry</strong> — add the items you need for your ministry.</li>
        <li><strong>Connect Stripe</strong> — so gifts go straight to your bank account.</li>
        <li><strong>Make your page public</strong> — then copy your link from the dashboard and share it.</li>
      </ol>
      <p><a href="${appUrl}/dashboard" style="color: #6B1E2E;">Go to your dashboard →</a></p>
      <p>Questions? Just reply to this email.</p>
      <p style="margin-top: 32px;">In Christ,<br/>The Ad Altare Team</p>
    `),
    reply_to: 'support@adaltare.com',
  });
}
