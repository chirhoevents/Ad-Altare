'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check } from 'lucide-react';

interface Question {
  id: string;
  questionText: string;
  questionType: string;
  options: string[] | null;
  isRequired: boolean;
}

interface RsvpEvent {
  id: string;
  name: string;
  date: string;
  location: string;
  rsvpDeadline: string | null;
  questions: Question[];
}

interface Props {
  priestId: string;
  priestFirstName: string;
  priestLastName: string;
}

interface FoundGuest {
  id: string;
  firstName: string;
  lastName: string;
  inviteCount: number;
  address: string | null;
  phone: string | null;
}

interface EventResponse {
  eventId: string;
  attending: boolean;
  partySize: number;
  questionResponses: Record<string, string>;
}

type Step = 'lookup' | 'form' | 'success' | 'closed';

export function RsvpFlow({ priestId, priestFirstName, priestLastName }: Props) {
  const [step, setStep] = useState<Step>('lookup');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [searching, setSearching] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [guest, setGuest] = useState<FoundGuest | null>(null);
  const [events, setEvents] = useState<RsvpEvent[]>([]);
  const [responses, setResponses] = useState<Record<string, EventResponse>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  // Contact info collected during RSVP
  const [guestAddress, setGuestAddress] = useState('');
  const [guestPhone, setGuestPhone] = useState('');

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    setSearching(true);
    setNotFound(false);

    const [lookupRes, eventsRes] = await Promise.all([
      fetch('/api/public/rsvp/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priestId, firstName: firstName.trim(), lastName: lastName.trim() }),
      }),
      fetch(`/api/public/rsvp/events?priestId=${priestId}`),
    ]);

    const lookupData = await lookupRes.json();
    const eventsData = await eventsRes.json();

    setSearching(false);

    if (!lookupData.found) {
      setNotFound(true);
      return;
    }

    if (eventsData.allClosed) {
      setStep('closed');
      return;
    }

    const foundGuest = lookupData.guest as FoundGuest;
    setGuest(foundGuest);
    // Pre-fill contact info if already on file
    setGuestAddress(foundGuest.address ?? '');
    setGuestPhone(foundGuest.phone ?? '');
    setEvents(eventsData.events ?? []);

    const init: Record<string, EventResponse> = {};
    (eventsData.events ?? []).forEach((ev: RsvpEvent) => {
      init[ev.id] = { eventId: ev.id, attending: true, partySize: 1, questionResponses: {} };
    });
    setResponses(init);
    setStep('form');
  }

  function updateResponse(eventId: string, patch: Partial<EventResponse>) {
    setResponses((prev) => ({ ...prev, [eventId]: { ...prev[eventId], ...patch } }));
  }

  function updateQuestion(eventId: string, questionId: string, value: string) {
    setResponses((prev) => ({
      ...prev,
      [eventId]: {
        ...prev[eventId],
        questionResponses: { ...prev[eventId].questionResponses, [questionId]: value },
      },
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!guest) return;
    setSubmitting(true);
    setSubmitError('');

    const payload = Object.values(responses);

    const res = await fetch('/api/public/rsvp/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        guestId: guest.id,
        responses: payload,
        guestAddress: guestAddress.trim() || null,
        guestPhone: guestPhone.trim() || null,
      }),
    });

    if (res.ok) {
      setStep('success');
    } else {
      const data = await res.json();
      setSubmitError(data.error ?? 'Something went wrong. Please try again.');
    }
    setSubmitting(false);
  }

  // ── Step: Closed ────────────────────────────────────────────────────────────
  if (step === 'closed') {
    return (
      <div className="text-center py-10 px-4">
        <p className="font-cormorant text-2xl text-near-black/60 mb-2">RSVP is now closed</p>
        <p className="font-inter text-sm text-near-black/50">
          Please contact Fr. {priestFirstName} {priestLastName} directly.
        </p>
      </div>
    );
  }

  // ── Step: Success ───────────────────────────────────────────────────────────
  if (step === 'success') {
    return (
      <div className="text-center py-12 px-4">
        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <Check className="w-7 h-7 text-green-600" />
        </div>
        <h3 className="font-cormorant text-3xl text-burgundy-800 mb-2">You&apos;re all set!</h3>
        <p className="font-inter text-sm text-near-black/60">
          Fr. {priestFirstName} has been notified of your RSVP.
        </p>
      </div>
    );
  }

  // ── Step: Lookup ────────────────────────────────────────────────────────────
  if (step === 'lookup') {
    return (
      <div className="max-w-sm mx-auto py-8 px-4">
        <h3 className="font-cormorant text-2xl text-burgundy-800 mb-1 text-center">Find Your Invitation</h3>
        <p className="font-inter text-sm text-near-black/50 text-center mb-6">
          Enter your name as it appears on your invitation.
        </p>
        <form onSubmit={handleLookup} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-inter text-xs text-near-black/50 block mb-1">First Name</label>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required autoFocus />
            </div>
            <div>
              <label className="font-inter text-xs text-near-black/50 block mb-1">Last Name</label>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            </div>
          </div>
          {notFound && (
            <div className="bg-amber-50 border border-amber-200 rounded-sm px-4 py-3 text-center">
              <p className="font-inter text-sm text-amber-800">
                We couldn&apos;t find your name on the guest list.
              </p>
              <p className="font-inter text-sm text-amber-700 mt-1">
                Please contact Fr. {priestFirstName} {priestLastName} directly to be added.
              </p>
            </div>
          )}
          <Button type="submit" className="w-full" disabled={searching}>
            {searching ? 'Searching…' : 'Find My Invitation →'}
          </Button>
        </form>
      </div>
    );
  }

  // ── Step: Form ──────────────────────────────────────────────────────────────
  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      <div className="mb-6">
        <p className="font-inter text-sm text-near-black/50 text-center">
          Welcome, <span className="font-medium text-near-black">{guest?.firstName} {guest?.lastName}</span>
          {guest && guest.inviteCount > 1 && <span> · Up to {guest.inviteCount} guests</span>}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {events.map((ev) => {
          const resp = responses[ev.id];
          if (!resp) return null;
          return (
            <div key={ev.id} className="bg-white border border-near-black/10 rounded-sm p-5 space-y-4">
              <div>
                <h4 className="font-cormorant text-xl text-burgundy-800">{ev.name}</h4>
                <p className="font-inter text-sm text-near-black/50 mt-0.5">
                  {new Date(ev.date).toLocaleString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                </p>
                <p className="font-inter text-sm text-near-black/50">{ev.location}</p>
              </div>

              {/* Attending toggle */}
              <div className="flex gap-3">
                {[true, false].map((val) => (
                  <button
                    key={String(val)}
                    type="button"
                    onClick={() => updateResponse(ev.id, { attending: val })}
                    className={`flex-1 py-2 rounded-sm font-inter text-sm border transition-colors ${
                      resp.attending === val
                        ? val ? 'bg-burgundy-800 text-cream border-burgundy-800' : 'bg-near-black/10 text-near-black border-near-black/20'
                        : 'bg-white text-near-black/40 border-near-black/10 hover:border-near-black/30'
                    }`}
                  >
                    {val ? 'Attending' : 'Not Attending'}
                  </button>
                ))}
              </div>

              {/* Party size */}
              {resp.attending && guest && guest.inviteCount > 1 && (
                <div>
                  <label className="font-inter text-sm text-near-black/60 block mb-1.5">
                    How many in your party? (max {guest.inviteCount})
                  </label>
                  <div className="flex gap-2">
                    {Array.from({ length: guest.inviteCount }, (_, i) => i + 1).map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => updateResponse(ev.id, { partySize: n })}
                        className={`w-9 h-9 rounded-sm font-inter text-sm border transition-colors ${
                          resp.partySize === n
                            ? 'bg-burgundy-800 text-cream border-burgundy-800'
                            : 'bg-white text-near-black/60 border-near-black/20 hover:border-burgundy-800'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom questions (only if attending) */}
              {resp.attending && ev.questions.map((q) => (
                <div key={q.id}>
                  <label className="font-inter text-sm text-near-black/70 block mb-1.5">
                    {q.questionText}{q.isRequired && <span className="text-burgundy-800 ml-0.5">*</span>}
                  </label>
                  {q.questionType === 'text' && (
                    <Input
                      value={resp.questionResponses[q.id] ?? ''}
                      onChange={(e) => updateQuestion(ev.id, q.id, e.target.value)}
                      required={q.isRequired}
                    />
                  )}
                  {q.questionType === 'yes_no' && (
                    <div className="flex gap-3">
                      {['Yes', 'No'].map((opt) => (
                        <button key={opt} type="button"
                          onClick={() => updateQuestion(ev.id, q.id, opt)}
                          className={`px-5 py-2 rounded-sm font-inter text-sm border transition-colors ${
                            resp.questionResponses[q.id] === opt
                              ? 'bg-burgundy-800 text-cream border-burgundy-800'
                              : 'bg-white text-near-black/50 border-near-black/20 hover:border-burgundy-800'
                          }`}>{opt}</button>
                      ))}
                    </div>
                  )}
                  {q.questionType === 'select' && q.options && (
                    <div className="flex flex-wrap gap-2">
                      {q.options.map((opt) => (
                        <button key={opt} type="button"
                          onClick={() => updateQuestion(ev.id, q.id, opt)}
                          className={`px-4 py-2 rounded-sm font-inter text-sm border transition-colors ${
                            resp.questionResponses[q.id] === opt
                              ? 'bg-burgundy-800 text-cream border-burgundy-800'
                              : 'bg-white text-near-black/50 border-near-black/20 hover:border-burgundy-800'
                          }`}>{opt}</button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
        })}

        {/* Contact info — shown once, applies to all events */}
        <div className="bg-white border border-near-black/10 rounded-sm p-5 space-y-4">
          <div>
            <h4 className="font-inter text-sm font-medium text-near-black mb-0.5">Contact Information</h4>
            <p className="font-inter text-xs text-near-black/40">
              Optional — helps Fr. {priestFirstName} send you a personal thank-you.
            </p>
          </div>
          <div className="space-y-3">
            <div>
              <label className="font-inter text-xs text-near-black/50 block mb-1">Mailing Address</label>
              <Input
                value={guestAddress}
                onChange={(e) => setGuestAddress(e.target.value)}
                placeholder="123 Main St, City, State 00000"
              />
            </div>
            <div>
              <label className="font-inter text-xs text-near-black/50 block mb-1">Phone Number</label>
              <Input
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                placeholder="(555) 555-5555"
                type="tel"
              />
            </div>
          </div>
        </div>

        {submitError && <p className="font-inter text-sm text-red-600 text-center">{submitError}</p>}

        <Button type="submit" className="w-full" size="lg" disabled={submitting}>
          {submitting ? 'Submitting…' : 'Confirm RSVP →'}
        </Button>
      </form>
    </div>
  );
}
