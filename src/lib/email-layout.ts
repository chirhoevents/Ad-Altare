// Pure helpers (no Resend import) so the admin composer can render a live
// preview in the browser that matches the sent email exactly. The send
// functions live in resend.ts.
import { escapeHtml } from './utils';

// ─── Layout ──────────────────────────────────────────────────────────────────
// Table-based with inline styles so it renders the same in Gmail, Outlook and
// Apple Mail. No images or tracking pixels: text-only branding keeps emails
// light, readable with images blocked, and out of spam filters.

export const BURGUNDY = '#6B1E2E';
export const GOLD = '#B8960C';
export const CREAM = '#FAF7F2';
export const INK = '#2A2522';
export const MUTED = '#7A706A';
export const SERIF = "Georgia, 'Times New Roman', Times, serif";

const P_STYLE = `margin: 0 0 18px; font-family: ${SERIF}; font-size: 16px; line-height: 1.7; color: ${INK};`;

export function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? 'https://ad-altare.com';
}

export function p(html: string): string {
  return `<p style="${P_STYLE}">${html}</p>`;
}

/** Plain text (as typed by a priest or admin) → escaped, styled HTML paragraphs. */
export function textToHtmlParagraphs(text: string): string {
  return text
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => p(linkify(escapeHtml(line))))
    .join('');
}

/** Turn bare URLs in already-escaped text into links (trailing punctuation stays outside). */
function linkify(escaped: string): string {
  return escaped.replace(/https?:\/\/[^\s<]+?(?=[.,;:!?)]*(?:\s|$))/g, (url) => `<a href="${url}" style="color: ${BURGUNDY};">${url}</a>`);
}

/** Bulletproof button: a table cell with a background, so it shows in Outlook too. */
export function button(href: string, label: string): string {
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
export function detailsCard(rows: [label: string, valueHtml: string][]): string {
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
export function signature(closing: string, from = 'The Ad Altare Team'): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 34px 0 0;">
      <tr><td style="width: 40px; height: 1px; line-height: 1px; font-size: 1px; background-color: ${GOLD};">&nbsp;</td></tr>
    </table>
    <p style="margin: 18px 0 0; font-family: ${SERIF}; font-size: 16px; line-height: 1.6; font-style: italic; color: ${MUTED};">${closing}</p>
    <p style="margin: 2px 0 0; font-family: ${SERIF}; font-size: 16px; line-height: 1.6; color: ${INK};">${from}</p>`;
}

export function brandedLayout(
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
              <div style="margin-top: 14px; font-size: 11px; color: #9A908A;">Powered by <a href="https://chirhoevents.com" target="_blank" style="color: #9A908A; text-decoration: underline;">ChiRho Technologies</a></div>
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

export function render(bodyHtml: string, opts?: { preheader?: string; footerNote?: string }) {
  const html = brandedLayout(bodyHtml, opts);
  return { html, text: htmlToText(html) };
}

/** Footer line on admin emails (they can go to priests or to any typed-in address). */
export const ADMIN_FOOTER_NOTE = 'Sent by the Ad Altare team. Just reply to reach us.';

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
