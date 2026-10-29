'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AUDIENCES, type Audience } from '@/lib/admin-audiences';
import { ADMIN_FOOTER_NOTE, brandedLayout, personalizeAdminText, textToHtmlParagraphs } from '@/lib/email-layout';
import { CheckCircle, AlertCircle, Trash2 } from 'lucide-react';

export interface ComposerPriest {
  id: string;
  name: string; // display name with title
  firstName: string;
  email: string;
  pageLink: string;
}

interface Template {
  label: string;
  subject: string;
  message: string;
}

const BUILT_IN: Record<string, Template> = {
  note: {
    label: 'Quick note',
    subject: 'Thank you for using Ad Altare',
    message:
      'Hi {first_name},\n\nThank you so much for using Ad Altare! Let me know if you have any questions — just reply to this email.\n\nGod bless,\nThe Ad Altare Team',
  },
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

const SAVED_KEY = 'adaltare.admin.emailTemplates';

function loadSaved(): Template[] {
  try {
    return JSON.parse(localStorage.getItem(SAVED_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function storeSaved(list: Template[]) {
  try {
    localStorage.setItem(SAVED_KEY, JSON.stringify(list));
  } catch {
    /* storage unavailable — templates just won't persist */
  }
}

/** "a@x.com, b@y.com\nc@z.com" → ['a@x.com', ...] */
function parseEmails(text: string): string[] {
  return text.split(/[\s,;]+/).map((e) => e.trim()).filter(Boolean);
}
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Mode = Audience | 'selected' | 'custom';

interface Props {
  priests: ComposerPriest[];
  audienceCounts: Record<Audience, number>;
  initialAudience: Mode;
  initialSelected: string[];
  initialEmails: string;
  initialTemplate: string | null;
}

export function EmailComposer({
  priests,
  audienceCounts,
  initialAudience,
  initialSelected,
  initialEmails,
  initialTemplate,
}: Props) {
  const start = BUILT_IN[initialTemplate ?? ''] ?? BUILT_IN.note;
  const [mode, setMode] = useState<Mode>(initialAudience);
  const [selected, setSelected] = useState<string[]>(initialSelected);
  const [emailText, setEmailText] = useState(initialEmails);
  const [filter, setFilter] = useState('');
  const [subject, setSubject] = useState(start.subject);
  const [message, setMessage] = useState(start.message);
  const [saved, setSaved] = useState<Template[]>([]);
  const [sending, setSending] = useState<'send' | 'test' | null>(null);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => setSaved(loadSaved()), []);

  const typedEmails = useMemo(() => parseEmails(emailText), [emailText]);
  const badEmails = typedEmails.filter((e) => !EMAIL_RE.test(e));

  const recipientCount =
    mode === 'selected' ? selected.length : mode === 'custom' ? typedEmails.length : audienceCounts[mode];

  const visiblePriests = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return q ? priests.filter((p) => `${p.name} ${p.email}`.toLowerCase().includes(q)) : priests;
  }, [priests, filter]);

  // Preview personalized for the first recipient we can identify
  const previewRecipient = useMemo(() => {
    if (mode === 'selected') return priests.find((p) => p.id === selected[0]) ?? null;
    if (mode === 'custom') return priests.find((p) => p.email.toLowerCase() === typedEmails[0]?.toLowerCase()) ?? null;
    return priests[0] ?? null;
  }, [mode, selected, typedEmails, priests]);

  const previewHtml = useMemo(
    () =>
      brandedLayout(textToHtmlParagraphs(personalizeAdminText(message, previewRecipient)), {
        footerNote: ADMIN_FOOTER_NOTE,
      }),
    [message, previewRecipient]
  );

  function applyTemplate(t: Template) {
    setSubject(t.subject);
    setMessage(t.message);
  }

  function saveTemplate() {
    const label = window.prompt('Name this template:', subject.slice(0, 40));
    if (!label) return;
    const next = [...saved.filter((t) => t.label !== label), { label, subject, message }];
    setSaved(next);
    storeSaved(next);
  }

  function deleteTemplate(label: string) {
    if (!confirm(`Delete the "${label}" template?`)) return;
    const next = saved.filter((t) => t.label !== label);
    setSaved(next);
    storeSaved(next);
  }

  async function send(kind: 'send' | 'test') {
    if (kind === 'send') {
      if (mode === 'custom' && badEmails.length) {
        setResult({ ok: false, text: `Check these addresses: ${badEmails.join(', ')}` });
        return;
      }
      if (!confirm(`Send this email to ${recipientCount} ${recipientCount === 1 ? 'person' : 'people'}?`)) return;
    }
    setSending(kind);
    setResult(null);
    const res = await fetch('/api/admin/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audience: kind === 'test' ? 'test' : mode,
        priestIds: kind === 'send' && mode === 'selected' ? selected : undefined,
        emails: kind === 'send' && mode === 'custom' ? typedEmails : undefined,
        subject,
        message,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setResult({
        ok: true,
        text:
          kind === 'test'
            ? 'Test sent to your email.'
            : data.failed
              ? `Sent to ${data.sent}; ${data.failed} failed.`
              : `Sent to ${data.sent} ${data.sent === 1 ? 'person' : 'people'}.`,
      });
    } else {
      setResult({ ok: false, text: data.error ?? 'Sending failed.' });
    }
    setSending(null);
  }

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  const radio = (value: Mode, label: React.ReactNode) => (
    <label className="flex items-center gap-3 font-inter text-sm text-near-black cursor-pointer">
      <input type="radio" name="audience" checked={mode === value} onChange={() => setMode(value)} />
      {label}
    </label>
  );

  return (
    <div className="space-y-6">
      {/* Recipients */}
      <section className="bg-white border border-near-black/10 rounded-sm p-6 space-y-3">
        <h2 className="font-cormorant text-2xl text-burgundy-800">To</h2>
        {radio('custom', <>Type email addresses <span className="text-near-black/40">— anyone</span></>)}
        {mode === 'custom' && (
          <div className="pl-7 space-y-1">
            <Textarea
              value={emailText}
              onChange={(e) => setEmailText(e.target.value)}
              rows={2}
              placeholder="name@example.com, another@example.com"
            />
            <p className="font-inter text-xs text-near-black/40">
              Separate with commas or new lines.{' '}
              {typedEmails.length > 0 && `${typedEmails.length} address${typedEmails.length === 1 ? '' : 'es'}.`}
              {badEmails.length > 0 && <span className="text-red-600"> Check: {badEmails.join(', ')}</span>}
            </p>
          </div>
        )}
        {radio('selected', <>Specific priests <span className="text-near-black/40">({selected.length} selected)</span></>)}
        {mode === 'selected' && (
          <div className="ml-7 border border-near-black/10 rounded-sm">
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
              {visiblePriests.length === 0 && <p className="px-3 py-4 font-inter text-sm text-near-black/40">No matches.</p>}
            </div>
          </div>
        )}
        <p className="font-inter text-xs uppercase tracking-widest text-near-black/30 pt-2">Or a group of priests</p>
        {(Object.keys(AUDIENCES) as Audience[]).map((a) => (
          <div key={a}>{radio(a, <>{AUDIENCES[a]} <span className="text-near-black/40">({audienceCounts[a]})</span></>)}</div>
        ))}
      </section>

      {/* Message + preview */}
      <section className="bg-white border border-near-black/10 rounded-sm p-6 space-y-4">
        <h2 className="font-cormorant text-2xl text-burgundy-800">Message</h2>

        <div className="space-y-2">
          <p className="font-inter text-xs uppercase tracking-widest text-near-black/40">Start from</p>
          <div className="flex gap-2 flex-wrap">
            {Object.entries(BUILT_IN).map(([key, t]) => (
              <Button key={key} type="button" size="sm" variant="outline" onClick={() => applyTemplate(t)}>
                {t.label}
              </Button>
            ))}
            <Button type="button" size="sm" variant="outline" onClick={() => applyTemplate({ label: '', subject: '', message: '' })}>
              Blank
            </Button>
          </div>
          {saved.length > 0 && (
            <div className="flex gap-2 flex-wrap pt-1">
              {saved.map((t) => (
                <span key={t.label} className="inline-flex items-center border border-gold-200 bg-gold-50 rounded-sm">
                  <button type="button" onClick={() => applyTemplate(t)} className="px-3 py-1.5 font-inter text-xs text-near-black">
                    {t.label}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteTemplate(t.label)}
                    className="px-2 py-1.5 text-near-black/30 hover:text-red-600"
                    aria-label={`Delete ${t.label}`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={200} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} rows={14} />
              <p className="font-inter text-xs text-near-black/40">
                Just type normally. Optional placeholders: <code>{'{first_name}'}</code>, <code>{'{name}'}</code>{' '}
                (with title, e.g. &ldquo;Fr. John Smith&rdquo;), <code>{'{page_link}'}</code>. For people who
                aren&apos;t priests, names become &ldquo;friend&rdquo;.
              </p>
            </div>
            <Button type="button" size="sm" variant="outline" onClick={saveTemplate} disabled={!message.trim()}>
              Save as my template
            </Button>
          </div>

          <div className="space-y-2">
            <p className="font-inter text-xs uppercase tracking-widest text-near-black/40">
              Preview{previewRecipient ? ` — as ${previewRecipient.name}` : ''}
            </p>
            <p className="font-inter text-sm text-near-black">
              <span className="text-near-black/40">Subject:</span> {personalizeAdminText(subject, previewRecipient)}
            </p>
            <iframe
              title="Email preview"
              srcDoc={previewHtml}
              sandbox=""
              className="w-full h-[460px] border border-near-black/10 rounded-sm bg-white"
            />
          </div>
        </div>
      </section>

      <div className="flex items-center gap-3 flex-wrap">
        <Button
          type="button"
          size="lg"
          onClick={() => send('send')}
          disabled={!!sending || recipientCount === 0 || !subject.trim() || !message.trim()}
        >
          {sending === 'send' ? 'Sending…' : `Send to ${recipientCount} ${recipientCount === 1 ? 'person' : 'people'}`}
        </Button>
        <Button
          type="button"
          size="lg"
          variant="outline"
          onClick={() => send('test')}
          disabled={!!sending || !subject.trim() || !message.trim()}
        >
          {sending === 'test' ? 'Sending…' : 'Send test to myself'}
        </Button>
        {result && (
          <span className={`flex items-center gap-2 font-inter text-sm ${result.ok ? 'text-green-600' : 'text-red-600'}`}>
            {result.ok ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {result.text}
          </span>
        )}
      </div>
    </div>
  );
}
