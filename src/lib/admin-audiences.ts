import type { Priest } from '@/db/schema';
import { todayForDeadlines } from '@/lib/utils';

export const AUDIENCES = {
  all: 'All priests',
  not_yet_ordained: 'Not yet ordained',
  stripe_pending: 'Not using Stripe (wishlist only)',
  hidden: 'Unlisted (link only)',
  upcoming: 'Ordination in the next 60 days',
  recently_ordained: 'Ordained in the last 30 days',
} as const;

export type Audience = keyof typeof AUDIENCES;

function addDays(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

type AudiencePriest = Pick<Priest, 'stripeOnboardingComplete' | 'profileVisible' | 'ordinationDate' | 'currentTitle'>;

export function matchesAudience(priest: AudiencePriest, audience: Audience): boolean {
  const today = todayForDeadlines();
  switch (audience) {
    case 'all':
      return true;
    case 'not_yet_ordained':
      // Ordained from their ordination day on (matches getTitleForDisplay); no date counts as not yet.
      return priest.currentTitle !== 'Father' && !(priest.ordinationDate && priest.ordinationDate <= today);
    case 'stripe_pending':
      return !priest.stripeOnboardingComplete;
    case 'hidden':
      return !priest.profileVisible;
    case 'upcoming':
      return !!priest.ordinationDate && priest.ordinationDate >= today && priest.ordinationDate <= addDays(today, 60);
    case 'recently_ordained':
      return !!priest.ordinationDate && priest.ordinationDate < today && priest.ordinationDate >= addDays(today, -30);
  }
}
