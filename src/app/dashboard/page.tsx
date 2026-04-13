import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
import { db } from '@/db';
import { priests, registryItems, donations } from '@/db/schema';
import { eq, sum, count, desc } from 'drizzle-orm';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, DollarSign, Gift, Users } from 'lucide-react';

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const priest = await db.query.priests.findFirst({
    where: eq(priests.clerkUserId, userId),
  });
  if (!priest) redirect('/onboarding');

  // Stats
  const [totalRaisedResult] = await db
    .select({ total: sum(donations.amountNet) })
    .from(donations)
    .where(eq(donations.priestId, priest.id));

  const [donationCountResult] = await db
    .select({ count: count() })
    .from(donations)
    .where(eq(donations.priestId, priest.id));

  const [itemCountResult] = await db
    .select({ count: count() })
    .from(registryItems)
    .where(eq(registryItems.priestId, priest.id));

  const recentDonations = await db.query.donations.findMany({
    where: eq(donations.priestId, priest.id),
    with: { registryItem: true },
    orderBy: (donations, { desc }) => [desc(donations.createdAt)],
    limit: 5,
  });

  const totalRaised = Number(totalRaisedResult?.total ?? 0);
  const donationCount = Number(donationCountResult?.count ?? 0);
  const itemCount = Number(itemCountResult?.count ?? 0);

  const stats = [
    {
      label: 'Total Raised',
      value: formatCurrency(totalRaised),
      icon: DollarSign,
      color: 'text-gold-600',
    },
    {
      label: 'Donations Received',
      value: donationCount.toString(),
      icon: Users,
      color: 'text-burgundy-800',
    },
    {
      label: 'Registry Items',
      value: itemCount.toString(),
      icon: Gift,
      color: 'text-burgundy-600',
    },
  ];

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-cormorant text-4xl font-light text-burgundy-800">
              Welcome, Fr. {priest.firstName}
            </h1>
            <p className="font-inter text-sm text-near-black/50 mt-1">
              Here's an overview of your ordination registry.
            </p>
          </div>
          <Button asChild variant="secondary" size="sm">
            <a
              href={`/p/${priest.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View Public Page
            </a>
          </Button>
        </div>

      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white border border-near-black/10 rounded-sm p-5"
          >
            <div className="flex items-center gap-3 mb-2">
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
              <span className="font-inter text-xs uppercase tracking-widest text-near-black/40">
                {stat.label}
              </span>
            </div>
            <p className="font-cormorant text-4xl text-burgundy-800 font-light">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Public Page Info */}
      <div className="bg-white border border-near-black/10 rounded-sm p-5 mb-6">
        <h2 className="font-cormorant text-xl text-burgundy-800 mb-3">Your Public Page</h2>
        <div className="flex items-center gap-3">
          <code className="font-inter text-sm text-near-black/60 bg-near-black/5 px-3 py-1.5 rounded-sm flex-1 truncate">
            {process.env.NEXT_PUBLIC_APP_URL}/p/{priest.slug}
          </code>
          <Button asChild size="sm" variant="outline">
            <a
              href={`/p/${priest.slug}`}
              target="_blank"
              rel="noopener noreferrer"
            >
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

      {/* Recent Donations */}
      <div className="bg-white border border-near-black/10 rounded-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-near-black/10 flex items-center justify-between">
          <h2 className="font-cormorant text-xl text-burgundy-800">Recent Donations</h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard/donors">View all</Link>
          </Button>
        </div>

        {recentDonations.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="font-inter text-sm text-near-black/40">
              No donations yet. Share your page to get started!
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-near-black/10">
                <th className="px-5 py-3 text-left font-inter text-xs uppercase tracking-widest text-near-black/40">
                  Donor
                </th>
                <th className="px-5 py-3 text-left font-inter text-xs uppercase tracking-widest text-near-black/40">
                  Item
                </th>
                <th className="px-5 py-3 text-right font-inter text-xs uppercase tracking-widest text-near-black/40">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {recentDonations.map((d) => (
                <tr key={d.id} className="border-b border-near-black/5 last:border-0">
                  <td className="px-5 py-3 font-inter text-sm text-near-black">
                    {d.isAnonymous ? (
                      <span className="text-near-black/40 italic">Anonymous</span>
                    ) : (
                      d.donorName ?? '—'
                    )}
                  </td>
                  <td className="px-5 py-3 font-inter text-sm text-near-black/60">
                    {d.registryItem?.name ?? 'General Fund'}
                  </td>
                  <td className="px-5 py-3 font-inter text-sm text-right text-burgundy-800 font-medium">
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
