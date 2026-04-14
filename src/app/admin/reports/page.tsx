import Link from 'next/link';
import { db } from '@/db';
import { priests, donations } from '@/db/schema';
import { eq, sum, count, gte, lte, and } from 'drizzle-orm';
import { formatCurrency } from '@/lib/utils';
import { ExportCSVButton } from './reports-client';

interface Props {
  searchParams: { from?: string; to?: string };
}

export default async function AdminReportsPage({ searchParams }: Props) {
  const dateFrom = searchParams.from ?? '';
  const dateTo = searchParams.to ?? '';

  // Build date filter for drizzle
  const dateFilters = [];
  if (dateFrom) {
    dateFilters.push(gte(donations.createdAt, new Date(dateFrom + 'T00:00:00.000Z')));
  }
  if (dateTo) {
    dateFilters.push(lte(donations.createdAt, new Date(dateTo + 'T23:59:59.999Z')));
  }
  const whereClause = dateFilters.length > 0 ? and(...dateFilters) : undefined;

  // Overall aggregates
  const [aggregates] = await db
    .select({
      totalGross: sum(donations.amountGross),
      totalFees: sum(donations.platformFee),
      totalNet: sum(donations.amountNet),
      donationCount: count(),
    })
    .from(donations)
    .where(whereClause);

  // Per-priest breakdown
  const perPriestRaw = await db
    .select({
      priestId: donations.priestId,
      totalGross: sum(donations.amountGross),
      totalFees: sum(donations.platformFee),
      totalNet: sum(donations.amountNet),
      donationCount: count(),
    })
    .from(donations)
    .where(whereClause)
    .groupBy(donations.priestId);

  // Get priest names
  const allPriests = await db.query.priests.findMany({
    columns: { id: true, firstName: true, lastName: true },
  });
  const priestMap = Object.fromEntries(
    allPriests.map((p) => [p.id, `Fr. ${p.firstName} ${p.lastName}`])
  );

  const rows = perPriestRaw
    .map((r) => ({
      priestId: r.priestId,
      priestName: priestMap[r.priestId] ?? 'Unknown',
      donationCount: Number(r.donationCount),
      totalGross: Number(r.totalGross ?? 0),
      totalFees: Number(r.totalFees ?? 0),
      totalNet: Number(r.totalNet ?? 0),
    }))
    .sort((a, b) => b.totalGross - a.totalGross);

  const overallGross = Number(aggregates?.totalGross ?? 0);
  const overallFees = Number(aggregates?.totalFees ?? 0);
  const overallNet = Number(aggregates?.totalNet ?? 0);
  const overallCount = Number(aggregates?.donationCount ?? 0);

  return (
    <div className="max-w-5xl space-y-8">
      {/* Back */}
      <Link href="/admin" className="font-inter text-sm text-near-black/50 hover:text-near-black transition-colors">
        ← Back to Admin Console
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-cormorant text-4xl font-light text-burgundy-800">Reports</h1>
          <p className="font-inter text-sm text-near-black/50 mt-1">
            Platform-wide donation summary
            {dateFrom || dateTo ? ` — filtered` : ''}
          </p>
        </div>
        <ExportCSVButton rows={rows} dateFrom={dateFrom} dateTo={dateTo} />
      </div>

      {/* Date Filter */}
      <form method="GET" className="bg-white border border-near-black/10 rounded-sm p-5">
        <p className="font-inter text-xs uppercase tracking-widest text-near-black/40 mb-4">Filter by Date Range</p>
        <div className="flex items-end gap-4 flex-wrap">
          <div className="space-y-1.5">
            <label htmlFor="from" className="font-inter text-sm text-near-black/60">From</label>
            <input
              id="from"
              name="from"
              type="date"
              defaultValue={dateFrom}
              className="border border-near-black/20 rounded-sm px-3 py-2 text-sm font-inter bg-white focus:outline-none focus:ring-2 focus:ring-burgundy-800"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="to" className="font-inter text-sm text-near-black/60">To</label>
            <input
              id="to"
              name="to"
              type="date"
              defaultValue={dateTo}
              className="border border-near-black/20 rounded-sm px-3 py-2 text-sm font-inter bg-white focus:outline-none focus:ring-2 focus:ring-burgundy-800"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-burgundy-800 text-cream font-inter text-sm rounded-sm hover:bg-burgundy-700 transition-colors"
          >
            Apply
          </button>
          {(dateFrom || dateTo) && (
            <a
              href="/admin/reports"
              className="font-inter text-sm text-near-black/40 hover:text-near-black transition-colors"
            >
              Clear
            </a>
          )}
        </div>
      </form>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Donations', value: overallCount.toString() },
          { label: 'Gross Revenue', value: formatCurrency(overallGross) },
          { label: 'Platform Fees (1%)', value: formatCurrency(overallFees) },
          { label: 'Net to Priests', value: formatCurrency(overallNet) },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-near-black/10 rounded-sm p-5">
            <span className="font-inter text-xs uppercase tracking-widest text-near-black/40 block mb-2">
              {s.label}
            </span>
            <p className="font-cormorant text-3xl text-burgundy-800 font-light">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Per-Priest Table */}
      <div className="bg-white border border-near-black/10 rounded-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-near-black/10">
          <h2 className="font-cormorant text-xl text-burgundy-800">Breakdown by Priest</h2>
        </div>
        {rows.length === 0 ? (
          <p className="px-5 py-10 font-inter text-sm text-near-black/40 text-center">
            No donations found{dateFrom || dateTo ? ' in this date range' : ''}.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-near-black/10">
                  {['Priest', 'Donations', 'Gross', 'Platform Fees', 'Net'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left font-inter text-xs uppercase tracking-widest text-near-black/40">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.priestId} className="border-b border-near-black/5 last:border-0 hover:bg-near-black/2">
                    <td className="px-5 py-4">
                      <Link
                        href={`/admin/priests/${row.priestId}`}
                        className="font-inter text-sm font-medium text-near-black hover:text-burgundy-800 transition-colors"
                      >
                        {row.priestName}
                      </Link>
                    </td>
                    <td className="px-5 py-4 font-inter text-sm text-near-black/60">
                      {row.donationCount}
                    </td>
                    <td className="px-5 py-4 font-inter text-sm font-medium text-burgundy-800">
                      {formatCurrency(row.totalGross)}
                    </td>
                    <td className="px-5 py-4 font-inter text-sm text-near-black/50">
                      {formatCurrency(row.totalFees)}
                    </td>
                    <td className="px-5 py-4 font-inter text-sm text-near-black/70">
                      {formatCurrency(row.totalNet)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-near-black/10 bg-near-black/2">
                  <td className="px-5 py-4 font-inter text-sm font-semibold text-near-black">Total</td>
                  <td className="px-5 py-4 font-inter text-sm font-semibold text-near-black/60">
                    {overallCount}
                  </td>
                  <td className="px-5 py-4 font-inter text-sm font-semibold text-burgundy-800">
                    {formatCurrency(overallGross)}
                  </td>
                  <td className="px-5 py-4 font-inter text-sm font-semibold text-near-black/50">
                    {formatCurrency(overallFees)}
                  </td>
                  <td className="px-5 py-4 font-inter text-sm font-semibold text-near-black/70">
                    {formatCurrency(overallNet)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
