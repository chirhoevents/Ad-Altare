import { describe, expect, it } from 'vitest';
import { personalizeAdminText, textToHtmlParagraphs } from '@/lib/email-layout';

describe('admin email helpers', () => {
  it('personalizes for priests and falls back to "friend" for anyone else', () => {
    const t = 'Hi {first_name} ({name}) {page_link}';
    expect(personalizeAdminText(t, { firstName: 'John', name: 'Fr. John Smith', pageLink: 'https://x/p/j' })).toBe(
      'Hi John (Fr. John Smith) https://x/p/j'
    );
    expect(personalizeAdminText(t, null)).toBe('Hi friend (friend) ');
  });

  it('escapes text and drops blank lines', () => {
    const html = textToHtmlParagraphs('Hello <b>\n\nBye');
    expect(html.match(/<p /g)).toHaveLength(2);
    expect(html).toContain('>Hello &lt;b&gt;</p>');
    expect(html).toContain('>Bye</p>');
  });

  it('links bare URLs, leaving trailing punctuation outside the link', () => {
    expect(textToHtmlParagraphs('See https://ad-altare.com/#faq.')).toContain(
      '<a href="https://ad-altare.com/#faq" style="color: #6B1E2E;">https://ad-altare.com/#faq</a>.'
    );
  });
});
