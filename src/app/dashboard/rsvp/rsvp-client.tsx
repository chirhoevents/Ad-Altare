'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, ChevronDown, ChevronUp, X, Check, Download, Upload } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Question {
  id: string;
  questionText: string;
  questionType: string;
  options: string[] | null;
  isRequired: boolean;
  sortOrder: number;
}

interface EventRow {
  id: string;
  name: string;
  date: string;
  location: string;
  rsvpEnabled: boolean;
  rsvpDeadline: string | null;
  questions: Question[];
}

interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  inviteCount: number;
  address: string | null;
  phone: string | null;
}

interface RsvpResponse {
  id: string;
  attending: boolean;
  partySize: number;
  questionResponses: Record<string, string> | null;
  createdAt: string;
  guest: Guest;
}

interface EventSummary {
  id: string;
  name: string;
  date: string;
}

// ─── CSV helpers ──────────────────────────────────────────────────────────────

function escapeCSV(v: string) { return `"${v.replace(/"/g, '""')}"`; }

function parseCSV(text: string): { rows: Partial<Guest>[]; errors: string[] } {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return { rows: [], errors: ['File is empty or has no data rows.'] };
  // skip header
  const rows: Partial<Guest>[] = [];
  const errors: string[] = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',').map((p) => p.trim().replace(/^"|"$/g, ''));
    const [firstName, lastName, inviteCountRaw, address, phone] = parts;
    if (!firstName || !lastName) {
      errors.push(`Row ${i + 1}: missing first_name or last_name`);
      continue;
    }
    const inviteCount = parseInt(inviteCountRaw ?? '1', 10);
    rows.push({
      firstName,
      lastName,
      inviteCount: isNaN(inviteCount) || inviteCount < 1 ? 1 : inviteCount,
      address: address || null,
      phone: phone || null,
    });
  }
  return { rows, errors };
}

// ─── Section: Events ──────────────────────────────────────────────────────────

function EventsSection() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', date: '', location: '', rsvpEnabled: false, rsvpDeadline: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch('/api/rsvp/events');
    if (res.ok) setEvents(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch('/api/rsvp/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, rsvpDeadline: form.rsvpDeadline || null }),
    });
    if (res.ok) { setShowAdd(false); setForm({ name: '', date: '', location: '', rsvpEnabled: false, rsvpDeadline: '' }); load(); }
    setSaving(false);
  }

  async function toggleRsvp(ev: EventRow) {
    await fetch(`/api/rsvp/events/${ev.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rsvpEnabled: !ev.rsvpEnabled }),
    });
    load();
  }

  async function deleteEvent(id: string) {
    if (!confirm('Delete this event and all its RSVPs?')) return;
    await fetch(`/api/rsvp/events/${id}`, { method: 'DELETE' });
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-cormorant text-2xl text-burgundy-800">Events</h2>
        {!showAdd && (
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus className="w-4 h-4 mr-1" /> Add Event
          </Button>
        )}
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-white border border-near-black/10 rounded-sm p-5 mb-5 space-y-4">
          <h3 className="font-cormorant text-xl text-burgundy-800">New Event</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label>Event Name *</Label>
              <Input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} required /></div>
            <div className="space-y-1.5"><Label>Date & Time *</Label>
              <Input type="datetime-local" value={form.date} onChange={(e) => setForm(p => ({ ...p, date: e.target.value }))} required /></div>
          </div>
          <div className="space-y-1.5"><Label>Location *</Label>
            <Input value={form.location} onChange={(e) => setForm(p => ({ ...p, location: e.target.value }))} required placeholder="Church name, address…" /></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label>RSVP Deadline (optional)</Label>
              <Input type="date" value={form.rsvpDeadline} onChange={(e) => setForm(p => ({ ...p, rsvpDeadline: e.target.value }))} /></div>
            <div className="flex items-center gap-3 pt-6">
              <button type="button" role="switch" aria-checked={form.rsvpEnabled}
                onClick={() => setForm(p => ({ ...p, rsvpEnabled: !p.rsvpEnabled }))}
                className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors ${form.rsvpEnabled ? 'bg-burgundy-800' : 'bg-near-black/20'}`}>
                <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${form.rsvpEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
              <span className="font-inter text-sm text-near-black/70">Enable RSVP</span>
            </div>
          </div>
          <div className="flex gap-3">
            <Button type="submit" disabled={saving}>{saving ? 'Adding…' : 'Add Event'}</Button>
            <Button type="button" variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
          </div>
        </form>
      )}

      {loading ? <p className="font-inter text-sm text-near-black/40">Loading…</p>
        : events.length === 0 ? (
          <div className="text-center py-12 bg-white border border-near-black/10 rounded-sm">
            <p className="font-inter text-sm text-near-black/40">No events yet. Add your first event above.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((ev) => (
              <div key={ev.id} className="bg-white border border-near-black/10 rounded-sm overflow-hidden">
                <div className="px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-cormorant text-lg text-burgundy-800">{ev.name}</h3>
                      {ev.rsvpEnabled ? <Badge variant="success">RSVP On</Badge> : <Badge variant="muted">RSVP Off</Badge>}
                      {ev.rsvpDeadline && <span className="font-inter text-xs text-near-black/40">Deadline: {ev.rsvpDeadline}</span>}
                    </div>
                    <p className="font-inter text-sm text-near-black/50 mt-0.5">
                      {new Date(ev.date).toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })} · {ev.location}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => toggleRsvp(ev)}
                      className={`relative inline-flex h-5 w-9 rounded-full border-2 border-transparent transition-colors ${ev.rsvpEnabled ? 'bg-burgundy-800' : 'bg-near-black/20'}`}>
                      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${ev.rsvpEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                    <Button size="sm" variant="outline" onClick={() => setExpandedId(expandedId === ev.id ? null : ev.id)}>
                      Questions ({ev.questions.length})
                      {expandedId === ev.id ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => deleteEvent(ev.id)}>
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </Button>
                  </div>
                </div>
                {expandedId === ev.id && <QuestionsPanel eventId={ev.id} questions={ev.questions} onRefresh={load} />}
              </div>
            ))}
          </div>
        )}
    </div>
  );
}

// ─── Questions Panel ──────────────────────────────────────────────────────────

function QuestionsPanel({ eventId, questions, onRefresh }: { eventId: string; questions: Question[]; onRefresh: () => void }) {
  const [form, setForm] = useState({ questionText: '', questionType: 'text', isRequired: false, options: ['', ''] });
  const [saving, setSaving] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const body: Record<string, unknown> = {
      questionText: form.questionText,
      questionType: form.questionType,
      isRequired: form.isRequired,
      sortOrder: questions.length,
    };
    if (form.questionType === 'select') {
      body.options = form.options.filter(Boolean);
    }
    await fetch(`/api/rsvp/events/${eventId}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setForm({ questionText: '', questionType: 'text', isRequired: false, options: ['', ''] });
    onRefresh();
    setSaving(false);
  }

  async function deleteQuestion(qid: string) {
    await fetch(`/api/rsvp/events/${eventId}/questions/${qid}`, { method: 'DELETE' });
    onRefresh();
  }

  async function move(q: Question, dir: 'up' | 'down') {
    const idx = questions.findIndex((x) => x.id === q.id);
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= questions.length) return;
    const swap = questions[swapIdx];
    await Promise.all([
      fetch(`/api/rsvp/events/${eventId}/questions/${q.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sortOrder: swap.sortOrder }),
      }),
      fetch(`/api/rsvp/events/${eventId}/questions/${swap.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sortOrder: q.sortOrder }),
      }),
    ]);
    onRefresh();
  }

  return (
    <div className="border-t border-near-black/10 bg-near-black/2 p-5 space-y-4">
      {questions.length > 0 && (
        <div className="space-y-2">
          {questions.map((q, i) => (
            <div key={q.id} className="flex items-center gap-3 bg-white border border-near-black/10 rounded-sm px-4 py-2.5">
              <div className="flex flex-col gap-0.5">
                <button onClick={() => move(q, 'up')} disabled={i === 0} className="text-near-black/30 hover:text-near-black disabled:opacity-20">
                  <ChevronUp className="w-3 h-3" />
                </button>
                <button onClick={() => move(q, 'down')} disabled={i === questions.length - 1} className="text-near-black/30 hover:text-near-black disabled:opacity-20">
                  <ChevronDown className="w-3 h-3" />
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-inter text-sm text-near-black">{q.questionText}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-inter text-xs text-near-black/40 capitalize">{q.questionType.replace('_', '/')}</span>
                  {q.isRequired && <span className="font-inter text-xs text-burgundy-800">Required</span>}
                  {q.options && q.options.length > 0 && (
                    <span className="font-inter text-xs text-near-black/40">· {q.options.join(', ')}</span>
                  )}
                </div>
              </div>
              <Button size="icon" variant="ghost" onClick={() => deleteQuestion(q.id)}>
                <X className="w-3.5 h-3.5 text-red-400" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleAdd} className="space-y-3 pt-2">
        <p className="font-inter text-xs font-semibold text-near-black/50 uppercase tracking-widest">Add Question</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 space-y-1.5">
            <Label>Question Text *</Label>
            <Input value={form.questionText} onChange={(e) => setForm(p => ({ ...p, questionText: e.target.value }))} required placeholder="e.g. Meal preference?" />
          </div>
          <div className="space-y-1.5">
            <Label>Type</Label>
            <select value={form.questionType} onChange={(e) => setForm(p => ({ ...p, questionType: e.target.value }))}
              className="w-full border border-near-black/20 rounded-sm px-3 py-2 text-sm font-inter bg-white focus:outline-none focus:ring-2 focus:ring-burgundy-800">
              <option value="text">Text</option>
              <option value="yes_no">Yes / No</option>
              <option value="select">Multiple Choice</option>
            </select>
          </div>
        </div>
        {form.questionType === 'select' && (
          <div className="space-y-2">
            <Label>Options</Label>
            {form.options.map((opt, i) => (
              <div key={i} className="flex gap-2">
                <Input value={opt} placeholder={`Option ${i + 1}`}
                  onChange={(e) => { const o = [...form.options]; o[i] = e.target.value; setForm(p => ({ ...p, options: o })); }} />
                {form.options.length > 2 && (
                  <Button type="button" size="icon" variant="ghost" onClick={() => setForm(p => ({ ...p, options: p.options.filter((_, j) => j !== i) }))}>
                    <X className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            ))}
            <Button type="button" size="sm" variant="outline" onClick={() => setForm(p => ({ ...p, options: [...p.options, ''] }))}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Option
            </Button>
          </div>
        )}
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isRequired} onChange={(e) => setForm(p => ({ ...p, isRequired: e.target.checked }))}
              className="w-4 h-4 rounded border-near-black/30 text-burgundy-800" />
            <span className="font-inter text-sm text-near-black/70">Required</span>
          </label>
          <Button type="submit" size="sm" disabled={saving}>
            {saving ? 'Adding…' : 'Add Question'}
          </Button>
        </div>
      </form>
    </div>
  );
}

// ─── Section: Guests ──────────────────────────────────────────────────────────

function GuestsSection() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', inviteCount: '1', address: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [bulkPreview, setBulkPreview] = useState<Partial<Guest>[] | null>(null);
  const [bulkErrors, setBulkErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const res = await fetch('/api/rsvp/guests');
    if (res.ok) setGuests(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch('/api/rsvp/guests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, inviteCount: parseInt(form.inviteCount) || 1 }),
    });
    setForm({ firstName: '', lastName: '', inviteCount: '1', address: '', phone: '' });
    setShowAdd(false);
    load();
    setSaving(false);
  }

  async function deleteGuest(id: string) {
    if (!confirm('Remove this guest and their RSVPs?')) return;
    await fetch(`/api/rsvp/guests/${id}`, { method: 'DELETE' });
    load();
  }

  function downloadTemplate() {
    const csv = 'first_name,last_name,invite_count,address,phone\nJohn,Doe,2,"123 Main St",555-1234\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'guest-template.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const { rows, errors } = parseCSV(ev.target?.result as string);
      setBulkPreview(rows);
      setBulkErrors(errors);
    };
    reader.readAsText(file);
  }

  async function confirmImport() {
    if (!bulkPreview?.length) return;
    setImporting(true);
    await fetch('/api/rsvp/guests/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guests: bulkPreview }),
    });
    setBulkPreview(null);
    setBulkErrors([]);
    setShowBulk(false);
    if (fileRef.current) fileRef.current.value = '';
    load();
    setImporting(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-cormorant text-2xl text-burgundy-800">Guest List ({guests.length})</h2>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => { setShowBulk(!showBulk); setShowAdd(false); }}>
            <Upload className="w-3.5 h-3.5 mr-1" /> Bulk Upload
          </Button>
          <Button size="sm" onClick={() => { setShowAdd(!showAdd); setShowBulk(false); }}>
            <Plus className="w-4 h-4 mr-1" /> Add Guest
          </Button>
        </div>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-white border border-near-black/10 rounded-sm p-5 mb-5 space-y-4">
          <h3 className="font-cormorant text-xl text-burgundy-800">Add Guest</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5"><Label>First Name *</Label>
              <Input value={form.firstName} onChange={(e) => setForm(p => ({ ...p, firstName: e.target.value }))} required /></div>
            <div className="space-y-1.5"><Label>Last Name *</Label>
              <Input value={form.lastName} onChange={(e) => setForm(p => ({ ...p, lastName: e.target.value }))} required /></div>
            <div className="space-y-1.5"><Label>Invite Count</Label>
              <Input type="number" min="1" max="50" value={form.inviteCount} onChange={(e) => setForm(p => ({ ...p, inviteCount: e.target.value }))} /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label>Address</Label>
              <Input value={form.address} onChange={(e) => setForm(p => ({ ...p, address: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))} /></div>
          </div>
          <div className="flex gap-3">
            <Button type="submit" disabled={saving}>{saving ? 'Adding…' : 'Add Guest'}</Button>
            <Button type="button" variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
          </div>
        </form>
      )}

      {showBulk && (
        <div className="bg-white border border-near-black/10 rounded-sm p-5 mb-5 space-y-4">
          <h3 className="font-cormorant text-xl text-burgundy-800">Bulk Upload</h3>
          <div className="flex items-center gap-3">
            <Button type="button" size="sm" variant="outline" onClick={downloadTemplate}>
              <Download className="w-3.5 h-3.5 mr-1" /> Download CSV Template
            </Button>
            <span className="font-inter text-xs text-near-black/40">Columns: first_name, last_name, invite_count, address, phone</span>
          </div>
          <div>
            <Label>Upload CSV</Label>
            <input ref={fileRef} type="file" accept=".csv" onChange={handleFile}
              className="mt-1.5 block font-inter text-sm text-near-black/60 file:mr-3 file:py-1.5 file:px-3 file:rounded-sm file:border file:border-near-black/20 file:text-sm file:font-inter file:bg-white file:text-near-black hover:file:bg-near-black/5" />
          </div>
          {bulkErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-sm p-3">
              {bulkErrors.map((e, i) => <p key={i} className="font-inter text-sm text-red-600">{e}</p>)}
            </div>
          )}
          {bulkPreview && bulkPreview.length > 0 && (
            <div>
              <p className="font-inter text-sm font-medium text-near-black mb-2">{bulkPreview.length} guests ready to import:</p>
              <div className="border border-near-black/10 rounded-sm overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-sm font-inter">
                  <thead><tr className="border-b border-near-black/10 bg-near-black/2">
                    {['Name', 'Invite Count', 'Address', 'Phone'].map(h => <th key={h} className="px-3 py-2 text-left text-xs text-near-black/40">{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {bulkPreview.map((g, i) => (
                      <tr key={i} className="border-b border-near-black/5 last:border-0">
                        <td className="px-3 py-2">{g.firstName} {g.lastName}</td>
                        <td className="px-3 py-2">{g.inviteCount}</td>
                        <td className="px-3 py-2 text-near-black/50">{g.address ?? '—'}</td>
                        <td className="px-3 py-2 text-near-black/50">{g.phone ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex gap-3 mt-3">
                <Button size="sm" onClick={confirmImport} disabled={importing}>{importing ? 'Importing…' : `Import ${bulkPreview.length} Guests`}</Button>
                <Button size="sm" variant="outline" onClick={() => { setBulkPreview(null); if (fileRef.current) fileRef.current.value = ''; }}>Clear</Button>
              </div>
            </div>
          )}
        </div>
      )}

      {loading ? <p className="font-inter text-sm text-near-black/40">Loading…</p>
        : guests.length === 0 ? (
          <div className="text-center py-12 bg-white border border-near-black/10 rounded-sm">
            <p className="font-inter text-sm text-near-black/40">No guests added yet.</p>
          </div>
        ) : (
          <div className="bg-white border border-near-black/10 rounded-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-near-black/10">
                  {['Name', 'Invite Count', 'Address', 'Phone', ''].map(h => (
                    <th key={h} className="px-5 py-3 text-left font-inter text-xs uppercase tracking-widest text-near-black/40">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {guests.map((g) => (
                    <tr key={g.id} className="border-b border-near-black/5 last:border-0">
                      <td className="px-5 py-3 font-inter text-sm text-near-black">{g.firstName} {g.lastName}</td>
                      <td className="px-5 py-3 font-inter text-sm text-near-black/60">{g.inviteCount}</td>
                      <td className="px-5 py-3 font-inter text-sm text-near-black/50">{g.address ?? '—'}</td>
                      <td className="px-5 py-3 font-inter text-sm text-near-black/50">{g.phone ?? '—'}</td>
                      <td className="px-5 py-3">
                        <Button size="icon" variant="ghost" onClick={() => deleteGuest(g.id)}>
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </Button>
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

// ─── Section: Responses ───────────────────────────────────────────────────────

function ResponsesSection() {
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [data, setData] = useState<{ event: EventSummary; questions: Question[]; responses: RsvpResponse[]; summary: { totalGuests: number; rsvpdYes: number; rsvpdNo: number; awaiting: number; totalAttending: number } } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/rsvp/responses').then(r => r.json()).then(d => {
      setEvents(d.events ?? []);
      if ((d.events ?? []).length > 0) setSelectedEventId(d.events[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedEventId) return;
    setLoading(true);
    fetch(`/api/rsvp/responses?eventId=${selectedEventId}`).then(r => r.json()).then(d => {
      setData(d);
      setLoading(false);
    });
  }, [selectedEventId]);

  function exportCSV() {
    if (!data) return;
    const qHeaders = data.questions.map(q => q.questionText);
    const headers = ['Guest Name', 'Attending', 'Party Size', 'RSVP Date', ...qHeaders];
    const lines = data.responses.map(r => [
      `${r.guest.firstName} ${r.guest.lastName}`,
      r.attending ? 'Yes' : 'No',
      r.partySize.toString(),
      new Date(r.createdAt).toLocaleDateString('en-US'),
      ...data.questions.map(q => r.questionResponses?.[q.id] ?? ''),
    ].map(escapeCSV).join(','));
    const csv = [headers.map(escapeCSV).join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `rsvp-${data.event.name.replace(/\s+/g, '-')}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-cormorant text-2xl text-burgundy-800">RSVP Responses</h2>
        {data && data.responses.length > 0 && (
          <Button size="sm" variant="outline" onClick={exportCSV}>
            <Download className="w-3.5 h-3.5 mr-1" /> Export CSV
          </Button>
        )}
      </div>

      {events.length === 0 ? (
        <div className="text-center py-12 bg-white border border-near-black/10 rounded-sm">
          <p className="font-inter text-sm text-near-black/40">Add events first to see RSVP responses.</p>
        </div>
      ) : (
        <>
          <div className="mb-5">
            <select value={selectedEventId} onChange={(e) => setSelectedEventId(e.target.value)}
              className="border border-near-black/20 rounded-sm px-3 py-2 text-sm font-inter bg-white focus:outline-none focus:ring-2 focus:ring-burgundy-800">
              {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
            </select>
          </div>

          {loading && <p className="font-inter text-sm text-near-black/40">Loading…</p>}

          {!loading && data && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Total Guests', value: data.summary.totalGuests },
                  { label: 'Attending', value: `${data.summary.rsvpdYes} (${data.summary.totalAttending} people)` },
                  { label: 'Not Attending', value: data.summary.rsvpdNo },
                  { label: 'Awaiting', value: data.summary.awaiting },
                ].map(s => (
                  <div key={s.label} className="bg-white border border-near-black/10 rounded-sm p-4">
                    <p className="font-inter text-xs uppercase tracking-widest text-near-black/40 mb-1">{s.label}</p>
                    <p className="font-cormorant text-2xl text-burgundy-800 font-light">{s.value}</p>
                  </div>
                ))}
              </div>

              {data.responses.length === 0 ? (
                <div className="text-center py-10 bg-white border border-near-black/10 rounded-sm">
                  <p className="font-inter text-sm text-near-black/40">No RSVPs yet for this event.</p>
                </div>
              ) : (
                <div className="bg-white border border-near-black/10 rounded-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead><tr className="border-b border-near-black/10">
                        {['Guest', 'Attending', 'Party Size', ...data.questions.map(q => q.questionText), 'Date'].map(h => (
                          <th key={h} className="px-5 py-3 text-left font-inter text-xs uppercase tracking-widest text-near-black/40 whitespace-nowrap">{h}</th>
                        ))}
                      </tr></thead>
                      <tbody>
                        {data.responses.map(r => (
                          <tr key={r.id} className="border-b border-near-black/5 last:border-0">
                            <td className="px-5 py-3 font-inter text-sm text-near-black">{r.guest.firstName} {r.guest.lastName}</td>
                            <td className="px-5 py-3">
                              {r.attending
                                ? <Badge variant="success"><Check className="w-3 h-3 mr-1" />Yes</Badge>
                                : <Badge variant="muted">No</Badge>}
                            </td>
                            <td className="px-5 py-3 font-inter text-sm text-near-black/60">{r.partySize}</td>
                            {data.questions.map(q => (
                              <td key={q.id} className="px-5 py-3 font-inter text-sm text-near-black/60">
                                {r.questionResponses?.[q.id] ?? <span className="italic text-near-black/30">—</span>}
                              </td>
                            ))}
                            <td className="px-5 py-3 font-inter text-sm text-near-black/40 whitespace-nowrap">
                              {new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

// ─── Main Client ──────────────────────────────────────────────────────────────

type Tab = 'events' | 'guests' | 'responses';

export function RsvpClient() {
  const [tab, setTab] = useState<Tab>('events');

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="font-cormorant text-4xl font-light text-burgundy-800">RSVP Management</h1>
        <p className="font-inter text-sm text-near-black/50 mt-1">Manage events, guest lists, and RSVP responses.</p>
      </div>

      <div className="border-b border-near-black/10 mb-8">
        <div className="flex gap-0">
          {(['events', 'guests', 'responses'] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-6 py-3 font-inter text-sm capitalize transition-colors border-b-2 -mb-px ${
                tab === t ? 'border-burgundy-800 text-burgundy-800 font-medium' : 'border-transparent text-near-black/50 hover:text-near-black'
              }`}>
              {t === 'responses' ? 'RSVP Responses' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {tab === 'events' && <EventsSection />}
      {tab === 'guests' && <GuestsSection />}
      {tab === 'responses' && <ResponsesSection />}
    </div>
  );
}
