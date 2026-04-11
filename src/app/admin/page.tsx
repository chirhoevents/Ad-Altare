import { db } from '@/db';
import { priests, donations } from '@/db/schema';
import { eq, sum, count } from 'drizzle-orm';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Users, TrendingUp, DollarSign, CheckCircle } from 'lucide-react';

export default async function AdminPage() {
  const [allPriests, donationAggregates, donationTotals] = await Promise.all([
    db.query.priests.findMany({
      orderBy: (priests, { desc }) => [desc(priests.createdAt)],
    }),
    db
      .select({
        totalGross: sum(donations.amountGross),
        totalFees: sum(donations.platformFee),
      })
      .from(donations),
    db
      .select({
        priestId: donations.priestId,
        total: sum(donations.amountGross),
      })
      .from(donations)
      .groupBy(donations.priestId),
  ]);

  const totalsByPriest = Object.fromEntries(
    donationTotals.map((d) => [d.priestId, Number(d.total ?? 0)])
  );
  const overallTotal = Number(donationAggregates[0]?.totalGross ?? 0);
  const overallFees = Number(donationAggregates[0]?.totalFees ?? 0);
  const activeRegistries = allPriests.filter((p) => p.stripeOnboardingComplete).length;

  const stats = [
    { label: 'Total Priests', value: allPriests.length.toString(), icon: Users },
    { label: 'Active Registries', value: activeRegistries.toString(), icon: CheckCircle },
    { label: 'Total Raised', value: formatCurrency(overallTotal), icon: TrendingUp },
    { label: 'Platform Fees', value: formatCurrency(overallFees), icon: DollarSign },
  ];

  return (
    <div>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-cormorant text-4xl font-light text-burgundy-800">Admin Console</h1>
          <p className="font-inter text-sm text-near-black/50 mt-1">
            {allPriests.length} registered priest{allPriests.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/admin/reports"
          className="font-inter text-sm text-burgundy-800 border border-burgundy-800/30 rounded-sm px-4 py-2 hover:bg-burgundy-800 hover:text-cream transition-colors"
        >
          Reports →
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-white border border-near-black/10 rounded-sm p-5">
            <div className="flex items-center gap-2 mb-2">
              <s.icon className="w-4 h-4 text-gold-600" />
              <span className="font-inter text-xs uppercase tracking-widest text-near-black/40">
                {s.label}
              </span>
            </div>
            <p className="font-cormorant text-3xl text-burgundy-800 font-light">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Priests Table */}
      <div className="bg-white border border-near-black/10 rounded-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-near-black/10">
          <h2 className="font-cormorant text-xl text-burgundy-800">All Priests</h2>
        </div>

        {allPriests.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="font-inter text-sm text-near-black/40">No priests registered yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-near-black/10">
                  {['Name', 'Diocese / Seminary', 'Ordination', 'Stripe', 'Total Raised', 'Joined', ''].map((h) => (
                    <th key={h} className="px-5 py-3 text-left font-inter text-xs uppercase tracking-widest text-near-black/40">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allPriests.map((priest) => (
                  <tr key={priest.id} className="border-b border-near-black/5 last:border-0 hover:bg-near-black/2">
                    <td className="px-5 py-4">
                      <Link href={`/admin/priests/${priest.id}`} className="block group">
                        <p className="font-inter text-sm font-medium text-near-black group-hover:text-burgundy-800 transition-colors">
                          Fr. {priest.firstName} {priest.lastName}
                        </p>
                        <p className="font-inter text-xs text-near-black/40">{priest.email}</p>
                      </Link>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-inter text-sm text-near-black/70">{priest.diocese ?? '—'}</p>
                      <p className="font-inter text-xs text-near-black/40">{priest.seminary ?? ''}</p>
                    </td>
                    <td className="px-5 py-4 font-inter text-sm text-near-black/60">
                      {formatDate(priest.ordinationDate)}
                    </td>
                    <td className="px-5 py-4">
                      {priest.stripeOnboardingComplete ? (
                        <Badge variant="success">Connected</Badge>
                      ) : priest.stripeAccountId ? (
                        <Badge variant="muted">Pending</Badge>
                      ) : (
                        <Badge variant="outline">None</Badge>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-inter text-sm font-medium text-burgundy-800">
                        {formatCurrency(totalsByPriest[priest.id] ?? 0)}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-inter text-sm text-near-black/40">
                      {new Date(priest.createdAt).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        href={`/admin/priests/${priest.id}`}
                        className="font-inter text-xs text-burgundy-800/60 hover:text-burgundy-800 transition-colors"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
