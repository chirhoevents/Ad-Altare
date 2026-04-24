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
 * - Before ordination, title=Transitional Deacon or Deacon → 'Dcn.'
 * - Before ordination, title=Seminarian → '' (no prefix)
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

  }

  switch (priest.currentTitle) {
    case 'Transitional Deacon':
    case 'Deacon':
      return 'Dcn.';
    default:
      return ''; // Seminarian or unknown — no prefix
  }
}

/** Full formatted name: "Fr. John Smith", "Dcn. John Smith", "John Smith", etc. */
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

export function computePlatformFee(grossCents: number): number {
  return Math.floor(grossCents * 0.01);
}

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
    .replace(/\{donor_name\}/g, vars.donor_name)
    .replace(/\{item_name\}/g, vars.item_name ?? 'General Fund')
    .replace(/\{priest_name\}/g, vars.priest_name)
    .replace(/\{amount\}/g, vars.amount ?? '');
}
