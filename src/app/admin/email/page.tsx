export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { db } from '@/db';
import { AUDIENCES, matchesAudience, type Audience } from '@/lib/admin-audiences';
import { formatPriestNameForEmail } from '@/lib/utils';
import { EmailComposer, type ComposerPriest } from './email-composer';

interface Props {
  searchParams: { to?: string; audience?: string; template?: string; email?: string };
}

export default async function AdminEmailPage({ searchParams }: Props) {
  const all = await db.query.priests.findMany({
    orderBy: (p, { asc }) => [asc(p.lastName), asc(p.firstName)],
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
  const priestList: ComposerPriest[] = all.map((p) => ({
    id: p.id,
    name: formatPriestNameForEmail(p),
    firstName: p.firstName,
    email: p.email,
    pageLink: `${appUrl}/p/${p.slug}`,
  }));

  const audienceCounts = Object.fromEntries(
    (Object.keys(AUDIENCES) as Audience[]).map((a) => [a, all.filter((p) => matchesAudience(p, a)).length])
  ) as Record<Audience, number>;

  const preselected = searchParams.to && all.some((p) => p.id === searchParams.to) ? [searchParams.to] : [];
  // Default: type-in addresses (the simplest "just send a note" case)
  const initialAudience =
    preselected.length > 0
      ? 'selected'
      : searchParams.audience && searchParams.audience in AUDIENCES
        ? (searchParams.audience as Audience)
        : 'custom';

  return (
    <div className="max-w-3xl space-y-6">
      <Link href="/admin" className="font-inter text-sm text-near-black/50 hover:text-near-black transition-colors">
        ← Back to Admin Console
      </Link>
      <div>
        <h1 className="font-cormorant text-4xl font-light text-burgundy-800">Send an Email</h1>
        <p className="font-inter text-sm text-near-black/50 mt-1">
          Write a note to anyone — a priest, a group of priests, or any email address. Replies come straight to you.
        </p>
      </div>
      <EmailComposer
        priests={priestList}
        audienceCounts={audienceCounts}
        initialAudience={initialAudience}
        initialSelected={preselected}
        initialEmails={searchParams.email ?? ''}
        initialTemplate={searchParams.template ?? null}
      />
    </div>
  );
}
