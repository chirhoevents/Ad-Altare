import { db } from '@/db';
import { priests, donations } from '@/db/schema';
import { eq, sum } from 'drizzle-orm';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default async function AdminPage() {
  const allPriests = await db.query.priests.findMany({
    orderBy: (priests, { desc }) => [desc(priests.createdAt)],
  });

  // Get total raised per priest
  const donationTotals = await db
    .select({
      priestId: donations.priestId,
      total: sum(donations.amountGross),
    })
    .from(donations)
    .groupBy(donations.priestId);

  const totalsByPriest = Object.fromEntries(
    donationTotals.map((d) => [d.priestId, Number(d.total ?? 0)])
  );

  const overallTotal = Object.values(totalsByPriest).reduce((a, b) => a + b, 0);

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-cormorant text-4xl font-light text-burgundy-800">Admin Console</h1>
        <p className="font-inter text-sm text-near-black/50 mt-1">
          {allPriests.length} registered priest{allPriests.length !== 1 ? 's' : ''} ·{' '}
          {formatCurrency(overallTotal)} total raised across all accounts
        </p>
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
                  <th className="px-5 py-3 text-left font-inter text-xs uppercase tracking-widest text-near-black/40">
                    Name
                  </th>
                  <th className="px-5 py-3 text-left font-inter text-xs uppercase tracking-widest text-near-black/40">
                    Diocese / Seminary
                  </th>
                  <th className="px-5 py-3 text-left font-inter text-xs uppercase tracking-widest text-near-black/40">
                    Ordination
                  </th>
                  <th className="px-5 py-3 text-left font-inter text-xs uppercase tracking-widest text-near-black/40">
                    Stripe
                  </th>
                  <th className="px-5 py-3 text-right font-inter text-xs uppercase tracking-widest text-near-black/40">
                    Total Raised
                  </th>
                  <th className="px-5 py-3 text-left font-inter text-xs uppercase tracking-widest text-near-black/40">
                    Joined
                  </th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {allPriests.map((priest) => (
                  <tr key={priest.id} className="border-b border-near-black/5 last:border-0 hover:bg-near-black/1">
                    <td className="px-5 py-4">
                      <div>
                        <p className="font-inter text-sm font-medium text-near-black">
                          Fr. {priest.firstName} {priest.lastName}
                        </p>
                        <p className="font-inter text-xs text-near-black/40">{priest.email}</p>
                      </div>
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
                    <td className="px-5 py-4 text-right">
                      <span className="font-inter text-sm font-medium text-burgundy-800">
                        {formatCurrency(totalsByPriest[priest.id] ?? 0)}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-inter text-sm text-near-black/40">
                      {new Date(priest.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-5 py-4">
                      <a
                        href={`/p/${priest.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-inter text-xs text-burgundy-800/60 hover:text-burgundy-800 transition-colors"
                      >
                        View page →
                      </a>
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
