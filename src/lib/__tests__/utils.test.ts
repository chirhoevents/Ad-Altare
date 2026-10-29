import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  applyMergeTagsToTemplate,
  escapeHtml,
  formatPriestNameForEmail,
  getTitleForDisplay,
  normalizeUrl,
  todayForDeadlines,
} from '@/lib/utils';

const base = { firstName: 'John', lastName: 'Smith' };

describe('titles', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 27, 12)); // Oct 27 2026, local noon
  });
  afterEach(() => vi.useRealTimers());

  it('is Fr. on and after the ordination date', () => {
    expect(getTitleForDisplay({ currentTitle: 'Transitional Deacon', ordinationDate: '2026-10-27' })).toBe('Fr.');
    expect(formatPriestNameForEmail({ ...base, ordinationDate: '2025-06-01' })).toBe('Fr. John Smith');
  });

  it('shows "Soon-to-be Fr." on the page but "Fr." in emails within 3 months', () => {
    const p = { ...base, currentTitle: 'Transitional Deacon', ordinationDate: '2026-11-27' };
    expect(getTitleForDisplay(p)).toBe('Soon-to-be Fr.');
    expect(formatPriestNameForEmail(p)).toBe('Fr. John Smith');
  });

  it('uses Dcn. / bare name further out', () => {
    expect(formatPriestNameForEmail({ ...base, currentTitle: 'Deacon', ordinationDate: '2027-10-01' })).toBe('Dcn. John Smith');
    expect(formatPriestNameForEmail({ ...base, currentTitle: 'Seminarian', ordinationDate: '2028-05-01' })).toBe('John Smith');
  });

  it('honours an admin-set Father title without a date', () => {
    expect(formatPriestNameForEmail({ ...base, currentTitle: 'Father', ordinationDate: null })).toBe('Fr. John Smith');
  });
});

describe('applyMergeTagsToTemplate', () => {
  it('fills tags and never produces "Fr. Fr."', () => {
    const out = applyMergeTagsToTemplate('Dear {donor_name}, {amount} for {item_name}.\nIn Christ,\nFr. {priest_name}', {
      donor_name: 'Mary',
      priest_name: 'Fr. John Smith',
      amount: '$50.00',
    });
    expect(out).toBe('Dear Mary, $50.00 for General Fund.\nIn Christ,\nFr. John Smith');
  });

  it('also collapses "Father {priest_name}"', () => {
    expect(applyMergeTagsToTemplate('Father {priest_name}', { donor_name: 'x', priest_name: 'Dcn. John Smith' })).toBe(
      'Dcn. John Smith'
    );
  });
});

describe('escapeHtml', () => {
  it('neutralises markup typed by donors', () => {
    expect(escapeHtml(`<img src=x onerror="alert('1')">&`)).toBe(
      '&lt;img src=x onerror=&quot;alert(&#39;1&#39;)&quot;&gt;&amp;'
    );
  });
});

describe('normalizeUrl', () => {
  it('adds https:// only when missing', () => {
    expect(normalizeUrl(' amazon.com/x ')).toBe('https://amazon.com/x');
    expect(normalizeUrl('http://a.com')).toBe('http://a.com');
    expect(normalizeUrl('')).toBe('');
  });
});

describe('todayForDeadlines', () => {
  afterEach(() => vi.useRealTimers());

  it('uses Pacific time, keeping the deadline day open until midnight PT', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-28T05:00:00Z')); // 10pm Oct 27 in Los Angeles
    expect(todayForDeadlines()).toBe('2026-10-27');
  });
});
