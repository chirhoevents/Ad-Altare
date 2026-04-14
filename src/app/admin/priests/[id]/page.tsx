export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/db';
import { priests, registryItems, donations } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Pencil, Eye } from 'lucide-react';
import { AdminPriestActions, AdminFeeActions } from './actions-client';

interface Props {
  params: { id: string };
}

export default async function AdminPriestDetailPage({ params }: Props) {
  const priest = await db.query.priests.findFirst({
    where: eq(priests.id, params.id),
  });
  if (!priest) notFound();

  const [items, donationRows] = await Promise.all([
    db.query.registryItems.findMany({
      where: eq(registryItems.priestId, priest.id),
      orderBy: (items, { asc }) => [asc(items.createdAt)],
    }),
    db.query.donations.findMany({
      where: eq(donations.priestId, priest.id),
      with: { registryItem: { columns: { name: true } } },
      orderBy: (d, { desc }) => [desc(d.createdAt)],
    }),
  ]);

  const totalRaised = donationRows.reduce((s, d) => s + d.amountGross, 0);

  return (
    <div className="max-w-5xl space-y-8">
      {/* Back */}
      <Link href="/admin" className="font-inter text-sm text-near-black/50 hover:text-near-black transition-colors">
        ← Back to Admin Console
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-cormorant text-4xl font-light text-burgundy-800">
            Fr. {priest.firstName} {priest.lastName}
          </h1>
          <p className="font-inter text-sm text-near-black/50 mt-1">{priest.email}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button asChild variant="outline" size="sm">
            <Link href={`/admin/priests/${priest.id}/edit`}>
              <Pencil className="w-3.5 h-3.5 mr-1" /> Edit Profile
            </Link>
          </Button>
          <Button asChild variant="secondary" size="sm">
            <a href={`/p/${priest.slug}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-3.5 h-3.5 mr-1" /> View Public Page
            </a>
          </Button>
          <Button asChild size="sm">
            <Link href={`/admin/preview/${priest.id}`}>
              <Eye className="w-3.5 h-3.5 mr-1" /> View Dashboard as Priest
            </Link>
          </Button>
        </div>
      </div>

      {/* Profile */}
      <section className="bg-white border border-near-black/10 rounded-sm p-6">
        <h2 className="font-cormorant text-2xl text-burgundy-800 mb-5">Profile</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm font-inter">
          {[
            ['Diocese', priest.diocese],
            ['Seminary', priest.seminary],
            ['Parish', priest.parish],
            ['Phone', priest.phone],
            ['Ordination', formatDate(priest.ordinationDate)],
            ['First Mass', formatDate(priest.firstMassDate)],
            ['Slug', `/p/${priest.slug}`],
            ['Joined', new Date(priest.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })],
          ].map(([label, value]) => (
            <div key={label} className="flex gap-2">
              <span className="text-near-black/40 w-28 shrink-0">{label}</span>
              <span className="text-near-black">{value ?? '—'}</span>
            </div>
          ))}
        </div>
        {priest.bio && (
          <div className="mt-4 pt-4 border-t border-near-black/10">
            <p className="text-xs text-near-black/40 mb-1 font-inter">Bio</p>
            <p className="font-inter text-sm text-near-black/70 leading-relaxed">{priest.bio}</p>
          </div>
        )}
      </section>

      {/* Stripe & Actions */}
      <section className="bg-white border border-near-black/10 rounded-sm p-6">
        <h2 className="font-cormorant text-2xl text-burgundy-800 mb-4">Stripe Status</h2>
        <div className="flex items-center gap-4 flex-wrap">
          {priest.stripeOnboardingComplete ? (
            <Badge variant="success" className="text-sm">Connected & Active</Badge>
          ) : priest.stripeAccountId ? (
            <Badge variant="muted" className="text-sm">Onboarding Incomplete</Badge>
          ) : (
            <Badge variant="muted" className="text-sm">Not Connected</Badge>
          )}
          {priest.stripeAccountId && (
            <span className="font-inter text-xs text-near-black/40">
              Account: {priest.stripeAccountId}
            </span>
          )}
        </div>
        <AdminPriestActions
          priestId={priest.id}
          stripeOnboardingComplete={priest.stripeOnboardingComplete}
        />
      </section>

      {/* Platform Fee */}
      <section className="bg-white border border-near-black/10 rounded-sm p-6">
        <div className="flex items-center gap-3 mb-1">
          <h2 className="font-cormorant text-2xl text-burgundy-800">Platform Fee</h2>
          {priest.platformFeeOverride === null ? (
            <Badge variant="success">1% default</Badge>
          ) : priest.platformFeeOverride === 0 ? (
            <Badge variant="muted">Waived</Badge>
          ) : (
            <Badge variant="gold">{priest.platformFeeOverride}% custom</Badge>
          )}
        </div>
        <p className="font-inter text-xs text-near-black/40 mb-4">
          {priest.platformFeeOverride === null
            ? 'This priest is charged the standard 1% platform fee on each donation.'
            : priest.platformFeeOverride === 0
            ? 'Platform fee is waived. Donations go directly to this priest minus Stripe processing only.'
            : `This priest is charged a custom ${priest.platformFeeOverride}% platform fee instead of the default 1%.`}
        </p>
        <AdminFeeActions
          priestId={priest.id}
          platformFeeOverride={priest.platformFeeOverride}
        />
      </section>

      {/* Registry Items */}
      <section className="bg-white border border-near-black/10 rounded-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-near-black/10">
          <h2 className="font-cormorant text-xl text-burgundy-800">Registry Items ({items.length})</h2>
        </div>
        {items.length === 0 ? (
          <p className="px-5 py-8 font-inter text-sm text-near-black/40">No registry items yet.</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-near-black/10">
                {['Item', 'Category', 'Raised', 'Goal', 'Status'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left font-inter text-xs uppercase tracking-widest text-near-black/40">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-near-black/5 last:border-0">
                  <td className="px-5 py-3 font-inter text-sm text-near-black">{item.name}</td>
                  <td className="px-5 py-3 font-inter text-sm text-near-black/50">{item.category ?? '—'}</td>
                  <td className="px-5 py-3 font-inter text-sm text-burgundy-800">{formatCurrency(item.amountRaised)}</td>
                  <td className="px-5 py-3 font-inter text-sm text-near-black/60">{formatCurrency(item.goalAmount)}</td>
                  <td className="px-5 py-3">
                    {item.amountRaised >= item.goalAmount ? (
                      <Badge variant="gold">Funded</Badge>
                    ) : item.isActive ? (
                      <Badge variant="success">Active</Badge>
                    ) : (
                      <Badge variant="muted">Hidden</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Donation History */}
      <section className="bg-white border border-near-black/10 rounded-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-near-black/10 flex items-center justify-between">
          <h2 className="font-cormorant text-xl text-burgundy-800">
            Donation History ({donationRows.length})
          </h2>
          <span className="font-inter text-sm font-medium text-burgundy-800">
            {formatCurrency(totalRaised)} total
          </span>
        </div>
        {donationRows.length === 0 ? (
          <p className="px-5 py-8 font-inter text-sm text-near-black/40">No donations yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-near-black/10">
                  {['Donor', 'Item', 'Amount', 'Fee', 'Date'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left font-inter text-xs uppercase tracking-widest text-near-black/40">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {donationRows.map((d) => (
                  <tr key={d.id} className="border-b border-near-black/5 last:border-0">
                    <td className="px-5 py-3">
                      <p className="font-inter text-sm text-near-black">
                        {d.isAnonymous ? <span className="italic text-near-black/40">Anonymous</span> : (d.donorName ?? '—')}
                      </p>
                      {!d.isAnonymous && <p className="font-inter text-xs text-near-black/40">{d.donorEmail}</p>}
                    </td>
                    <td className="px-5 py-3 font-inter text-sm text-near-black/60">
                      {d.registryItem?.name ?? <span className="italic">General Fund</span>}
                    </td>
                    <td className="px-5 py-3 font-inter text-sm font-medium text-burgundy-800">
                      {formatCurrency(d.amountGross)}
                    </td>
                    <td className="px-5 py-3 font-inter text-xs text-near-black/40">
                      {formatCurrency(d.platformFee)}
                    </td>
                    <td className="px-5 py-3 font-inter text-sm text-near-black/50">
                      {new Date(d.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
