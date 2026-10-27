import type { Priest } from '@/db/schema';
import { todayForDeadlines } from '@/lib/utils';

export const AUDIENCES = {
  all: 'All priests',
  stripe_pending: 'Not yet connected to Stripe',
  hidden: 'Page hidden (not public yet)',
  upcoming: 'Ordination in the next 60 days',
  recently_ordained: 'Ordained in the last 30 days',
} as const;

export type Audience = keyof typeof AUDIENCES;

function addDays(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

type AudiencePriest = Pick<Priest, 'stripeOnboardingComplete' | 'profileVisible' | 'ordinationDate'>;

export function matchesAudience(priest: AudiencePriest, audience: Audience): boolean {
  const today = todayForDeadlines();
  switch (audience) {
    case 'all':
      return true;
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
