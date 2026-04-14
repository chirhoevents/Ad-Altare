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
  const name = `${firstName} ${lastName}`
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
  return `fr-${name}`;
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
