import { Resend } from 'resend';

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
  const displayName = isAnonymous ? 'Friend' : (donorName ?? 'Friend');
  const itemLine = itemName
    ? `<p>Your donation has been directed toward: <strong>${itemName}</strong></p>`
    : '';
  const anonymousLine = isAnonymous
    ? `<p><em>Your donation has been recorded anonymously. ${priestName} will know only that a generous donor has contributed.</em></p>`
    : '';

  await send({
    from: FROM_ADDRESS,
    to: donorEmail,
    subject: `Thank you for supporting Fr. ${priestName}'s ordination`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #1C1C1E;">
        <div style="background-color: #6B1E2E; padding: 32px; text-align: center;">
          <h1 style="color: #FAF7F2; font-size: 28px; margin: 0;">Ad Altare</h1>
          <p style="color: #B8960C; margin: 8px 0 0; font-style: italic;">To the Altar</p>
        </div>
        <div style="padding: 32px; background-color: #FAF7F2;">
          <p>Dear ${displayName},</p>
          <p>Your generous gift of <strong>${amountFormatted}</strong> in support of Fr. ${priestName}'s ordination has been received.</p>
          ${itemLine}
          ${anonymousLine}
          <p>Your support helps make possible what God has called Fr. ${priestName} to — a life of sacred service at the altar.</p>
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
    ? `<p><strong>Item:</strong> ${itemName}</p>`
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
          <p>Dear Fr. ${priestName},</p>
          <p>You have received a new donation for your ordination registry.</p>
          <div style="background: white; border-left: 4px solid #B8960C; padding: 16px; margin: 24px 0;">
            <p><strong>Amount:</strong> ${amountFormatted}</p>
            <p><strong>From:</strong> ${donorDisplayName}</p>
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
