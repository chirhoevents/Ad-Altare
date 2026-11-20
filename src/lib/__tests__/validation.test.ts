import { describe, it, expect } from 'vitest';
import { webUrl, httpsImageUrl, optionalOrEmpty } from '@/lib/validation';
import { safeHref } from '@/lib/utils';

describe('webUrl', () => {
  it('accepts http and https links', () => {
    expect(webUrl.safeParse('https://www.amazon.com/dp/B000').success).toBe(true);
    expect(webUrl.safeParse('http://example.com').success).toBe(true);
  });

  it('rejects script and data links that z.string().url() would allow', () => {
    expect(webUrl.safeParse('javascript:alert(document.cookie)').success).toBe(false);
    expect(webUrl.safeParse('JavaScript:alert(1)').success).toBe(false);
    expect(webUrl.safeParse('data:text/html,<script>alert(1)</script>').success).toBe(false);
    expect(webUrl.safeParse('not a url').success).toBe(false);
  });
});

describe('httpsImageUrl', () => {
  it('only accepts https images', () => {
    expect(httpsImageUrl.safeParse('https://blob.vercel-storage.com/a.jpg').success).toBe(true);
    expect(httpsImageUrl.safeParse('http://example.com/a.jpg').success).toBe(false);
    expect(httpsImageUrl.safeParse('data:image/png;base64,AAAA').success).toBe(false);
  });
});

describe('optionalOrEmpty', () => {
  it('lets a field be cleared', () => {
    const field = optionalOrEmpty(webUrl);
    expect(field.safeParse('').success).toBe(true);
    expect(field.safeParse(null).success).toBe(true);
    expect(field.safeParse(undefined).success).toBe(true);
    expect(field.safeParse('javascript:alert(1)').success).toBe(false);
  });
});

describe('safeHref', () => {
  it('passes web links through and drops everything else', () => {
    expect(safeHref('https://example.com')).toBe('https://example.com');
    expect(safeHref(' http://example.com ')).toBe('http://example.com');
    expect(safeHref('javascript:alert(1)')).toBeNull();
    expect(safeHref('  javascript:alert(1)')).toBeNull();
    expect(safeHref(null)).toBeNull();
    expect(safeHref('')).toBeNull();
  });
});
