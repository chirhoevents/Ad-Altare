// Pure helpers (no Resend import) so the admin composer can render a live
// preview in the browser that matches the sent email exactly.
import { escapeHtml } from './utils';

/** Plain text (as typed by an admin) → escaped HTML paragraphs. */
export function textToHtmlParagraphs(text: string): string {
  return text
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => `<p style="margin-bottom:12px;">${escapeHtml(line)}</p>`)
    .join('');
}

export function brandedLayout(bodyHtml: string): string {
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
 * Fill {first_name}, {name} and {page_link}. Recipients who aren't priests
 * (typed-in addresses) get "friend" and no page link.
 */
export function personalizeAdminText(
  text: string,
  recipient: { firstName?: string; name?: string; pageLink?: string } | null,
): string {
  return text
    .replace(/\{first_name\}/g, recipient?.firstName || 'friend')
    .replace(/\{name\}/g, recipient?.name || 'friend')
    .replace(/\{page_link\}/g, recipient?.pageLink ?? '');
}
