export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { db } from '@/db';
import { AUDIENCES, matchesAudience, type Audience } from '@/lib/admin-audiences';
import { formatPriestName } from '@/lib/utils';
import { EmailComposer, type ComposerPriest } from './email-composer';

interface Props {
  searchParams: { to?: string; audience?: string; template?: string };
}

export default async function AdminEmailPage({ searchParams }: Props) {
  const all = await db.query.priests.findMany({
    orderBy: (p, { asc }) => [asc(p.lastName), asc(p.firstName)],
  });

  const priestList: ComposerPriest[] = all.map((p) => ({
    id: p.id,
    name: formatPriestName(p),
    email: p.email,
  }));

  const audienceCounts = Object.fromEntries(
    (Object.keys(AUDIENCES) as Audience[]).map((a) => [a, all.filter((p) => matchesAudience(p, a)).length])
  ) as Record<Audience, number>;

  const preselected = searchParams.to && all.some((p) => p.id === searchParams.to) ? [searchParams.to] : [];
  const initialAudience =
    preselected.length > 0
      ? 'selected'
      : searchParams.audience && searchParams.audience in AUDIENCES
        ? (searchParams.audience as Audience)
        : 'all';

  return (
    <div className="max-w-3xl space-y-6">
      <Link href="/admin" className="font-inter text-sm text-near-black/50 hover:text-near-black transition-colors">
        ← Back to Admin Console
      </Link>
      <div>
        <h1 className="font-cormorant text-4xl font-light text-burgundy-800">Email Priests</h1>
        <p className="font-inter text-sm text-near-black/50 mt-1">
          Send a note to one priest or a group. Each email is personalized, and replies come straight to you.
        </p>
      </div>
      <EmailComposer
        priests={priestList}
        audienceCounts={audienceCounts}
        initialAudience={initialAudience}
        initialSelected={preselected}
        initialTemplate={searchParams.template ?? null}
      />
    </div>
  );
}
