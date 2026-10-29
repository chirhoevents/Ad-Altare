import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  // Parse as UTC to avoid timezone offset shifting the date
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(d);
}

export function generateBaseSlug(firstName: string, lastName: string): string {
  // No title prefix — slugs must stay stable as titles change over time.
  // Existing "fr-*" slugs are grandfathered; new slugs generate as "john-smith".
  return `${firstName} ${lastName}`
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

/**
 * Returns the display title prefix for a priest based on their ordination date
 * and self-reported current title.
 *
 * - On/after ordination date → 'Fr.'
 * - Within 3 months before ordination → 'Soon-to-be Fr.'
 * - Earlier, title=Transitional Deacon or Deacon → 'Deacon'
 * - Earlier, title=Seminarian → 'Mr.'
 */
export function getTitleForDisplay(priest: {
  currentTitle?: string | null;
  ordinationDate?: string | null;
}): string {
  if (priest.ordinationDate) {
    const [year, month, day] = priest.ordinationDate.split('-').map(Number);
    const ordDate = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (today >= ordDate) return 'Fr.';

    const threeMonthsBefore = new Date(ordDate);
    threeMonthsBefore.setMonth(threeMonthsBefore.getMonth() - 3);
    if (today >= threeMonthsBefore) return 'Soon-to-be Fr.';
  }

  switch (priest.currentTitle) {
    case 'Father':
      return 'Fr.'; // admin-set; no ordination date required
    case 'Transitional Deacon':
    case 'Deacon':
      return 'Deacon';
    default:
      return 'Mr.'; // Seminarian (the default title)
  }
}

/**
 * Name used in emails to donors (confirmations, thank-you notes, {priest_name}).
 * Uses "Fr." once ordained AND during the run-up to ordination (the same 3-month
 * window the public page shows as "Soon-to-be Fr."), since ordinands typically
 * collect gifts and send thank-yous in the weeks before their ordination.
 * Earlier than that: "Deacon" for deacons, "Mr." for seminarians.
 */
export function formatPriestNameForEmail(priest: {
  firstName: string;
  lastName: string;
  currentTitle?: string | null;
  ordinationDate?: string | null;
}): string {
  const displayTitle = getTitleForDisplay(priest);
  const title = displayTitle === 'Soon-to-be Fr.' ? 'Fr.' : displayTitle;
  return title
    ? `${title} ${priest.firstName} ${priest.lastName}`
    : `${priest.firstName} ${priest.lastName}`;
}

/**
 * Today's date (YYYY-MM-DD) in US Pacific time. RSVP deadlines are stored as
 * plain dates; comparing against Pacific time keeps the deadline day open until
 * midnight for every guest in the continental US (UTC would close it at
 * ~7–8pm Eastern the evening before).
 */
export function todayForDeadlines(): string {
  // en-CA formats as YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/** Full formatted name: "Fr. John Smith", "Deacon John Smith", "Mr. John Smith". */
export function formatPriestName(priest: {
  firstName: string;
  lastName: string;
  currentTitle?: string | null;
  ordinationDate?: string | null;
}): string {
  const title = getTitleForDisplay(priest);
  return title
    ? `${title} ${priest.firstName} ${priest.lastName}`
    : `${priest.firstName} ${priest.lastName}`;
}

/** Escape user-supplied text before interpolating it into email HTML. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** "amazon.com/x" → "https://amazon.com/x" so people needn't type the scheme. */
export function normalizeUrl(value: string): string {
  const v = value.trim();
  if (!v) return '';
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
}

/** Used when a priest's thank-you template is empty. */
export const FALLBACK_THANK_YOU_TEMPLATE =
  "Dear {donor_name},\n\nThank you for your generous support of {priest_name}'s ordination. Please know you are remembered in my prayers.\n\nIn Christ,\n{priest_name}";

export function applyMergeTagsToTemplate(
  template: string,
  vars: {
    donor_name: string;
    item_name?: string;
    priest_name: string;
    amount?: string;
  }
): string {
  return template
    // {priest_name} already carries the title ("Fr. John Smith"). Older templates
    // were written as "Fr. {priest_name}" — collapse that so it never doubles up.
    .replace(/\b(?:Fr\.|Father)\s+\{priest_name\}/gi, '{priest_name}')
    .replace(/\{donor_name\}/g, vars.donor_name)
    .replace(/\{item_name\}/g, vars.item_name ?? 'General Fund')
    .replace(/\{priest_name\}/g, vars.priest_name)
    .replace(/\{amount\}/g, vars.amount ?? '');
}
