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
    expect(textToHtmlParagraphs('Hello <b>\n\nBye')).toBe(
      '<p style="margin-bottom:12px;">Hello &lt;b&gt;</p><p style="margin-bottom:12px;">Bye</p>'
    );
  });
});
