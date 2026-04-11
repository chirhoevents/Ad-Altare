'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { Mail, CheckCircle, Download } from 'lucide-react';

interface DonationRow {
  id: string;
  donorName: string | null;
  donorEmail: string;
  donorAddress: string | null;
  donorPhone: string | null;
  isAnonymous: boolean;
  amountGross: number;
  thankYouSent: boolean;
  createdAt: string;
  registryItem: { name: string } | null;
}

function escapeCSV(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function exportToCSV(rows: DonationRow[]) {
  const headers = [
    'Date', 'Donor Name', 'Email', 'Address', 'Phone',
    'Item', 'Amount', 'Anonymous', 'Thank You Sent',
  ];
  const lines = rows.map((d) =>
    [
      new Date(d.createdAt).toLocaleDateString('en-US'),
      d.isAnonymous ? 'Anonymous' : (d.donorName ?? ''),
      d.isAnonymous ? '' : d.donorEmail,
      d.isAnonymous ? '' : (d.donorAddress ?? ''),
      d.isAnonymous ? '' : (d.donorPhone ?? ''),
      d.registryItem?.name ?? 'General Fund',
      (d.amountGross / 100).toFixed(2),
      d.isAnonymous ? 'Yes' : 'No',
      d.thankYouSent ? 'Yes' : 'No',
    ].map(escapeCSV).join(',')
  );
  const csv = [headers.map(escapeCSV).join(','), ...lines].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'donations.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export default function DonorsPage() {
  const [donations, setDonations] = useState<DonationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);
  const [message, setMessage] = useState<{ id: string; text: string; ok: boolean } | null>(null);

  const fetchDonations = useCallback(async () => {
    const res = await fetch('/api/donations');
    if (res.ok) {
      const data = await res.json();
      setDonations(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDonations();
  }, [fetchDonations]);

  async function sendThankYou(donationId: string) {
    setSending(donationId);
    setMessage(null);

    const res = await fetch('/api/email/thank-you', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ donationId }),
    });

    const data = await res.json();
    setMessage({
      id: donationId,
      text: res.ok ? 'Thank-you sent!' : (data.error ?? 'Failed to send'),
      ok: res.ok,
    });

    if (res.ok) await fetchDonations();
    setSending(null);
  }

  const total = donations.reduce((sum, d) => sum + d.amountGross, 0);

  return (
    <div className="p-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-cormorant text-4xl font-light text-burgundy-800">Donors</h1>
          <p className="font-inter text-sm text-near-black/50 mt-1">
            {donations.length} donation{donations.length !== 1 ? 's' : ''} ·{' '}
            {formatCurrency(total)} total received
          </p>
        </div>
        {donations.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportToCSV(donations)}
            className="gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </Button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12">
          <p className="font-inter text-sm text-near-black/40">Loading…</p>
        </div>
      ) : donations.length === 0 ? (
        <div className="text-center py-16 bg-white border border-near-black/10 rounded-sm">
          <p className="font-cormorant text-2xl text-near-black/30 mb-2">No donations yet</p>
          <p className="font-inter text-sm text-near-black/30">
            Share your public page and the gifts will come.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-near-black/10 rounded-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-near-black/10 bg-near-black/2">
                  <th className="px-5 py-3 text-left font-inter text-xs uppercase tracking-widest text-near-black/40">
                    Donor
                  </th>
                  <th className="px-5 py-3 text-left font-inter text-xs uppercase tracking-widest text-near-black/40">
                    Item
                  </th>
                  <th className="px-5 py-3 text-left font-inter text-xs uppercase tracking-widest text-near-black/40">
                    Amount
                  </th>
                  <th className="px-5 py-3 text-left font-inter text-xs uppercase tracking-widest text-near-black/40">
                    Date
                  </th>
                  <th className="px-5 py-3 text-left font-inter text-xs uppercase tracking-widest text-near-black/40">
                    Status
                  </th>
                  <th className="px-5 py-3 text-left font-inter text-xs uppercase tracking-widest text-near-black/40">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {donations.map((d) => (
                  <tr key={d.id} className="border-b border-near-black/5 last:border-0 hover:bg-near-black/1">
                    <td className="px-5 py-4">
                      <div>
                        <p className="font-inter text-sm text-near-black">
                          {d.isAnonymous ? (
                            <span className="italic text-near-black/40">Anonymous</span>
                          ) : (
                            d.donorName ?? '—'
                          )}
                        </p>
                        {!d.isAnonymous && (
                          <p className="font-inter text-xs text-near-black/40">{d.donorEmail}</p>
                        )}
                        {d.donorAddress && !d.isAnonymous && (
                          <p className="font-inter text-xs text-near-black/30">{d.donorAddress}</p>
                        )}
                        {d.donorPhone && !d.isAnonymous && (
                          <p className="font-inter text-xs text-near-black/30">{d.donorPhone}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 font-inter text-sm text-near-black/60">
                      {d.registryItem?.name ?? (
                        <span className="italic">General Fund</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-inter text-sm font-medium text-burgundy-800">
                        {formatCurrency(d.amountGross)}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-inter text-sm text-near-black/50">
                      {new Date(d.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-5 py-4">
                      {d.thankYouSent ? (
                        <Badge variant="success" className="gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Sent
                        </Badge>
                      ) : (
                        <Badge variant="muted">Pending</Badge>
                      )}
                      {message?.id === d.id && (
                        <p className={`text-xs font-inter mt-1 ${message.ok ? 'text-green-600' : 'text-red-600'}`}>
                          {message.text}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {!d.thankYouSent && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => sendThankYou(d.id)}
                          disabled={sending === d.id}
                          className="gap-1.5"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          {sending === d.id ? 'Sending…' : 'Send Thank You'}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
