'use client';

import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface ReportRow {
  priestName: string;
  donationCount: number;
  totalGross: number;
  totalFees: number;
  totalNet: number;
}

function escapeCSV(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

export function ExportCSVButton({ rows, dateFrom, dateTo }: {
  rows: ReportRow[];
  dateFrom: string;
  dateTo: string;
}) {
  function handleExport() {
    const headers = ['Priest', 'Donations', 'Gross ($)', 'Platform Fees ($)', 'Net ($)'];
    const lines = rows.map((r) =>
      [
        r.priestName,
        r.donationCount.toString(),
        (r.totalGross / 100).toFixed(2),
        (r.totalFees / 100).toFixed(2),
        (r.totalNet / 100).toFixed(2),
      ].map(escapeCSV).join(',')
    );
    const csv = [headers.map(escapeCSV).join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const suffix = dateFrom && dateTo ? `_${dateFrom}_to_${dateTo}` : '';
    a.download = `ad-altare-report${suffix}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (rows.length === 0) return null;

  return (
    <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5">
      <Download className="w-3.5 h-3.5" />
      Export CSV
    </Button>
  );
}
