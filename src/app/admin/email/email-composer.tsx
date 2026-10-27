'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AUDIENCES, type Audience } from '@/lib/admin-audiences';
import { CheckCircle, AlertCircle } from 'lucide-react';

export interface ComposerPriest {
  id: string;
  name: string;
  email: string;
}

const TEMPLATES: Record<string, { label: string; subject: string; message: string }> = {
  thanks: {
    label: 'Thank you',
    subject: 'Thank you, {first_name}!',
    message:
      'Dear {name},\n\nThank you for being part of Ad Altare. It is a joy to walk alongside you on the road to the altar, and we are praying for you.\n\nIf there is anything we can do to make your page or registry easier to use, just reply to this email.\n\nIn Christ,\nThe Ad Altare Team',
  },
  stripe: {
    label: 'About direct gifts (Stripe)',
    subject: 'An option for receiving gifts directly',
    message:
      'Dear {name},\n\nThank you for using Ad Altare! Your wishlist and RSVP are completely free, and there is nothing more you need to do.\n\nIf you would also like family and friends to be able to give money directly — toward specific items or a general fund — you can connect a free Stripe account from Settings ("Connect with Stripe"). It takes about five minutes, gifts go straight to your bank account, and a small 1% fee helps keep Ad Altare running.\n\nIt is entirely optional. If you have any questions, just reply to this email.\n\nIn Christ,\nThe Ad Altare Team',
  },
  congrats: {
    label: 'Ordination congratulations',
    subject: 'Congratulations, {name}!',
    message:
      'Dear {name},\n\nCongratulations on your ordination! The whole Ad Altare team rejoices with you and is praying for your priestly ministry.\n\nThank you for letting us be a small part of this journey. Please remember us at the altar.\n\nIn Christ,\nThe Ad Altare Team',
  },
};

interface Props {
  priests: ComposerPriest[];
  audienceCounts: Record<Audience, number>;
  initialAudience: Audience | 'selected';
  initialSelected: string[];
  initialTemplate: string | null;
}

export function EmailComposer({ priests, audienceCounts, initialAudience, initialSelected, initialTemplate }: Props) {
  const start = initialTemplate ? TEMPLATES[initialTemplate] : undefined;
  const [audience, setAudience] = useState<Audience | 'selected'>(initialAudience);
  const [selected, setSelected] = useState<string[]>(initialSelected);
  const [filter, setFilter] = useState('');
  const [subject, setSubject] = useState(start?.subject ?? '');
  const [message, setMessage] = useState(start?.message ?? '');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  const recipientCount = audience === 'selected' ? selected.length : audienceCounts[audience];
  const visiblePriests = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return q ? priests.filter((p) => `${p.name} ${p.email}`.toLowerCase().includes(q)) : priests;
  }, [priests, filter]);

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!confirm(`Send this email to ${recipientCount} priest${recipientCount === 1 ? '' : 's'}?`)) return;
    setSending(true);
    setResult(null);
    const res = await fetch('/api/admin/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audience, priestIds: audience === 'selected' ? selected : undefined, subject, message }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setResult({
        ok: true,
        text: data.failed
          ? `Sent to ${data.sent}; ${data.failed} failed (see server logs).`
          : `Sent to ${data.sent} priest${data.sent === 1 ? '' : 's'}.`,
      });
    } else {
      setResult({ ok: false, text: data.error ?? 'Sending failed.' });
    }
    setSending(false);
  }

  return (
    <form onSubmit={send} className="space-y-6">
      {/* Recipients */}
      <section className="bg-white border border-near-black/10 rounded-sm p-6 space-y-3">
        <h2 className="font-cormorant text-2xl text-burgundy-800">To</h2>
        {(Object.keys(AUDIENCES) as Audience[]).map((a) => (
          <label key={a} className="flex items-center gap-3 font-inter text-sm text-near-black cursor-pointer">
            <input type="radio" name="audience" checked={audience === a} onChange={() => setAudience(a)} />
            {AUDIENCES[a]}
            <span className="text-near-black/40">({audienceCounts[a]})</span>
          </label>
        ))}
        <label className="flex items-center gap-3 font-inter text-sm text-near-black cursor-pointer">
          <input type="radio" name="audience" checked={audience === 'selected'} onChange={() => setAudience('selected')} />
          Specific priests
          <span className="text-near-black/40">({selected.length} selected)</span>
        </label>

        {audience === 'selected' && (
          <div className="border border-near-black/10 rounded-sm">
            <div className="p-2 border-b border-near-black/10">
              <Input placeholder="Search by name or email…" value={filter} onChange={(e) => setFilter(e.target.value)} />
            </div>
            <div className="max-h-64 overflow-y-auto divide-y divide-near-black/5">
              {visiblePriests.map((p) => (
                <label key={p.id} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-near-black/2">
                  <input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggle(p.id)} />
                  <span className="font-inter text-sm text-near-black">{p.name}</span>
                  <span className="font-inter text-xs text-near-black/40 truncate">{p.email}</span>
                </label>
              ))}
              {visiblePriests.length === 0 && (
                <p className="px-3 py-4 font-inter text-sm text-near-black/40">No matches.</p>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Message */}
      <section className="bg-white border border-near-black/10 rounded-sm p-6 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="font-cormorant text-2xl text-burgundy-800">Message</h2>
          <div className="flex gap-2 flex-wrap">
            {Object.entries(TEMPLATES).map(([key, t]) => (
              <Button
                key={key}
                type="button"
                size="sm"
                variant="outline"
                onClick={() => { setSubject(t.subject); setMessage(t.message); }}
              >
                {t.label}
              </Button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="subject">Subject</Label>
          <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} required maxLength={200} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="message">Message</Label>
          <Textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} rows={12} required />
          <p className="font-inter text-xs text-near-black/40">
            Personalize with <code>{'{first_name}'}</code>, <code>{'{name}'}</code> (with title, e.g. &ldquo;Fr. John
            Smith&rdquo;) and <code>{'{page_link}'}</code>.
          </p>
        </div>
      </section>

      <div className="flex items-center gap-4 flex-wrap">
        <Button type="submit" size="lg" disabled={sending || recipientCount === 0}>
          {sending ? 'Sending…' : `Send to ${recipientCount} priest${recipientCount === 1 ? '' : 's'}`}
        </Button>
        {result && (
          <span className={`flex items-center gap-2 font-inter text-sm ${result.ok ? 'text-green-600' : 'text-red-600'}`}>
            {result.ok ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {result.text}
          </span>
        )}
      </div>
    </form>
  );
}
