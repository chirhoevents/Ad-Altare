export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/db';
import { priests, registryItems, donations } from '@/db/schema';
import { eq, sum, count } from 'drizzle-orm';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, ExternalLink } from 'lucide-react';

interface Props {
  params: { priestId: string };
}

export default async function AdminPreviewPage({ params }: Props) {
  const priest = await db.query.priests.findFirst({
    where: eq(priests.id, params.priestId),
  });
  if (!priest) notFound();

  const [totalRaisedResult, donationCountResult, itemCountResult, recentDonations, items] =
    await Promise.all([
      db
        .select({ total: sum(donations.amountNet) })
        .from(donations)
        .where(eq(donations.priestId, priest.id)),
      db
        .select({ count: count() })
        .from(donations)
        .where(eq(donations.priestId, priest.id)),
      db
        .select({ count: count() })
        .from(registryItems)
        .where(eq(registryItems.priestId, priest.id)),
      db.query.donations.findMany({
        where: eq(donations.priestId, priest.id),
        with: { registryItem: true },
        orderBy: (d, { desc }) => [desc(d.createdAt)],
        limit: 5,
      }),
      db.query.registryItems.findMany({
        where: eq(registryItems.priestId, priest.id),
        orderBy: (i, { asc }) => [asc(i.createdAt)],
      }),
    ]);

  const totalRaised = Number(totalRaisedResult[0]?.total ?? 0);
  const donationCount = Number(donationCountResult[0]?.count ?? 0);
  const itemCount = Number(itemCountResult[0]?.count ?? 0);

  return (
    <div className="max-w-5xl space-y-6">
      {/* Admin banner */}
      <div className="bg-red-50 border border-red-200 rounded-sm p-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
          <div>
            <p className="font-inter text-sm font-semibold text-red-700">
              Admin View — Fr. {priest.firstName} {priest.lastName}&apos;s Dashboard
            </p>
            <p className="font-inter text-xs text-red-500 mt-0.5">
              You are viewing this priest&apos;s dashboard as an admin. All actions are read-only.
            </p>
          </div>
        </div>
        <Button asChild variant="outline" size="sm" className="border-red-200 text-red-700 hover:bg-red-100">
          <Link href={`/admin/priests/${priest.id}`}>Exit Admin View</Link>
        </Button>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-cormorant text-4xl font-light text-burgundy-800">
            Welcome, Fr. {priest.firstName}
          </h1>
          <p className="font-inter text-sm text-near-black/50 mt-1">
            Here&apos;s an overview of your ordination registry.
          </p>
        </div>
        <Button asChild variant="secondary" size="sm">
          <a href={`/p/${priest.slug}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
            <ExternalLink className="w-3.5 h-3.5" />
            View Public Page
          </a>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Raised', value: formatCurrency(totalRaised) },
          { label: 'Donations Received', value: donationCount.toString() },
          { label: 'Registry Items', value: itemCount.toString() },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-near-black/10 rounded-sm p-5">
            <span className="font-inter text-xs uppercase tracking-widest text-near-black/40 block mb-2">
              {s.label}
            </span>
            <p className="font-cormorant text-4xl text-burgundy-800 font-light">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Public Page Info */}
      <div className="bg-white border border-near-black/10 rounded-sm p-5">
        <h2 className="font-cormorant text-xl text-burgundy-800 mb-3">Public Page</h2>
        <div className="flex items-center gap-3">
          <code className="font-inter text-sm text-near-black/60 bg-near-black/5 px-3 py-1.5 rounded-sm flex-1 truncate">
            {process.env.NEXT_PUBLIC_APP_URL}/p/{priest.slug}
          </code>
          <Button asChild size="sm" variant="outline">
            <a href={`/p/${priest.slug}`} target="_blank" rel="noopener noreferrer">
              Open
            </a>
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs font-inter text-near-black/40">
          {priest.diocese && <span>{priest.diocese}</span>}
          {priest.ordinationDate && (
            <span>· Ordination: {formatDate(priest.ordinationDate)}</span>
          )}
          {priest.stripeOnboardingComplete ? (
            <Badge variant="success" className="text-xs">Stripe Connected</Badge>
          ) : (
            <Badge variant="muted" className="text-xs">Stripe Pending</Badge>
          )}
        </div>
      </div>

      {/* Registry Items */}
      <div className="bg-white border border-near-black/10 rounded-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-near-black/10">
          <h2 className="font-cormorant text-xl text-burgundy-800">Registry ({items.length})</h2>
        </div>
        {items.length === 0 ? (
          <p className="px-5 py-8 font-inter text-sm text-near-black/40">No registry items yet.</p>
        ) : (
          <div className="divide-y divide-near-black/5">
            {items.map((item) => {
              const pct = Math.min(100, Math.round((item.amountRaised / item.goalAmount) * 100));
              const isFunded = item.amountRaised >= item.goalAmount;
              return (
                <div key={item.id} className={`p-5 ${!item.isActive ? 'opacity-50' : ''}`}>
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-cormorant text-lg text-burgundy-800">{item.name}</h3>
                        {item.category && <Badge variant="muted">{item.category}</Badge>}
                        {!item.isActive && <Badge variant="muted">Hidden</Badge>}
                        {isFunded && <Badge variant="gold">Funded</Badge>}
                      </div>
                      {item.description && (
                        <p className="font-inter text-sm text-near-black/50">{item.description}</p>
                      )}
                    </div>
                  </div>
                  <Progress value={pct} indicatorClassName={isFunded ? 'bg-gold-600' : 'bg-burgundy-800'} />
                  <div className="flex justify-between text-xs font-inter text-near-black/40 mt-1.5">
                    <span>{formatCurrency(item.amountRaised)} raised</span>
                    <span>Goal: {formatCurrency(item.goalAmount)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Donations */}
      <div className="bg-white border border-near-black/10 rounded-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-near-black/10">
          <h2 className="font-cormorant text-xl text-burgundy-800">Recent Donations</h2>
        </div>
        {recentDonations.length === 0 ? (
          <p className="px-5 py-8 font-inter text-sm text-near-black/40">No donations yet.</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-near-black/10">
                {['Donor', 'Item', 'Amount'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left font-inter text-xs uppercase tracking-widest text-near-black/40">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentDonations.map((d) => (
                <tr key={d.id} className="border-b border-near-black/5 last:border-0">
                  <td className="px-5 py-3 font-inter text-sm text-near-black">
                    {d.isAnonymous ? (
                      <span className="italic text-near-black/40">Anonymous</span>
                    ) : (
                      d.donorName ?? '—'
                    )}
                  </td>
                  <td className="px-5 py-3 font-inter text-sm text-near-black/60">
                    {d.registryItem?.name ?? 'General Fund'}
                  </td>
                  <td className="px-5 py-3 font-inter text-sm font-medium text-burgundy-800">
                    {formatCurrency(d.amountGross)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
