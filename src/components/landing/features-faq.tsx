'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FaqItem {
  q: string;
  a: string;
}

const forPriests: FaqItem[] = [
  {
    q: 'How do I create my page?',
    a: 'Sign up with your email, fill in your profile (diocese, seminary, ordination date, and a short bio), and your personal page is live instantly at adaltare.com/p/your-name. You can share that link with anyone.',
  },
  {
    q: 'How do I build a registry?',
    a: 'From your dashboard, go to Registry and add items — chalice, vestments, books, anything you need for your ministry. Set a goal amount for each item. Donors can contribute toward a specific item or give a general fund donation directly to you.',
  },
  {
    q: 'When and how do I receive the money?',
    a: 'You connect your bank account through Stripe (a secure payment processor) during setup. Donations go directly to your bank account — typically within 1–2 business days. Ad Altare only takes a 1% platform fee; the remainder of Stripe\'s small processing fee (~2.9% + 30¢) comes out of the donation total. You never have to do anything — it\'s automatic.',
  },
  {
    q: 'How does RSVP work for priests?',
    a: 'In your dashboard under RSVP, you upload your guest list (CSV or manually), create your events (Ordination Mass, First Mass Reception, etc.), set an RSVP deadline, and optionally add custom questions (dietary restrictions, shuttle needs, etc.). You can then view who is attending and export the list.',
  },
  {
    q: 'Can I have multiple events under one RSVP?',
    a: 'Yes. You can create as many events as you need — for example, your Ordination Mass and a separate First Mass dinner. Guests respond to each event individually in a single RSVP session.',
  },
  {
    q: 'What if a guest is not on my list?',
    a: 'Guests look themselves up by name. If they are not found, the system tells them to contact you directly. You can then add them manually from the RSVP dashboard and they can try again.',
  },
];

const forGuests: FaqItem[] = [
  {
    q: 'How do I find a priest\'s page?',
    a: 'Visit the Find a Priest directory at adaltare.com/directory, or use the direct link the priest shared with you. Each priest has a unique personal page with their story, registry, and RSVP.',
  },
  {
    q: 'How do I make a donation?',
    a: 'On the priest\'s page, browse his registry and click "Give" on any item — or choose "General Donation" to give freely. Enter your amount, your name and email (for a receipt), and pay securely with any major credit or debit card. Donations go directly to the priest.',
  },
  {
    q: 'Can I donate anonymously?',
    a: 'Yes. Toggle "Donate anonymously" in the donation form. Your name and address will not be shown to the priest — only your email is kept so we can send you a receipt.',
  },
  {
    q: 'How do I RSVP to an ordination?',
    a: 'Go to the priest\'s page and click the RSVP tab. Enter your first and last name exactly as it appears on your invitation. The system will find your invitation and show you the events you\'re invited to. Confirm your attendance, select your party size, and submit — that\'s it.',
  },
  {
    q: 'What if my name isn\'t found when I try to RSVP?',
    a: 'Your name must be on the guest list the priest uploaded. If you receive a "not found" message, contact the priest directly to be added. Once he adds you, you can come back and RSVP normally.',
  },
  {
    q: 'Is my payment information secure?',
    a: 'Yes. All payments are processed by Stripe, which is the same technology used by Amazon, Google, and millions of other businesses. Ad Altare never sees or stores your card number.',
  },
];

function AccordionItem({ item, isOpen, onToggle }: { item: FaqItem; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-near-black/10 last:border-0">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 py-4 text-left group"
      >
        <span className="font-inter text-sm font-medium text-near-black group-hover:text-burgundy-800 transition-colors">
          {item.q}
        </span>
        <ChevronDown
          className={`w-4 h-4 shrink-0 text-near-black/40 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && (
        <p className="font-inter text-sm text-near-black/60 leading-relaxed pb-4">
          {item.a}
        </p>
      )}
    </div>
  );
}

function AccordionGroup({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  return (
    <div>
      {items.map((item, i) => (
        <AccordionItem
          key={i}
          item={item}
          isOpen={openIndex === i}
          onToggle={() => setOpenIndex(openIndex === i ? null : i)}
        />
      ))}
    </div>
  );
}

export function FeaturesFaq() {
  const [tab, setTab] = useState<'priests' | 'guests'>('priests');

  return (
    <section id="faq" className="section-padding bg-white">
      <div className="container-wide">
        {/* Section header */}
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-[0.3em] text-gold-600 font-inter mb-3">
            Everything you need to know
          </p>
          <h2 className="font-cormorant text-4xl sm:text-5xl font-light text-burgundy-800 mb-4">
            Features & FAQ
          </h2>
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="h-px w-12 bg-gold-600/40" />
            <div className="w-1.5 h-1.5 rounded-full bg-gold-600/60" />
            <div className="h-px w-12 bg-gold-600/40" />
          </div>

          {/* Tab switcher */}
          <div className="inline-flex border border-near-black/10 rounded-sm overflow-hidden">
            <button
              type="button"
              onClick={() => setTab('priests')}
              className={`px-6 py-2.5 font-inter text-sm transition-colors ${
                tab === 'priests'
                  ? 'bg-burgundy-800 text-cream'
                  : 'bg-white text-near-black/60 hover:text-near-black'
              }`}
            >
              For Priests
            </button>
            <button
              type="button"
              onClick={() => setTab('guests')}
              className={`px-6 py-2.5 font-inter text-sm transition-colors ${
                tab === 'guests'
                  ? 'bg-burgundy-800 text-cream'
                  : 'bg-white text-near-black/60 hover:text-near-black'
              }`}
            >
              For Guests &amp; Donors
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-2xl mx-auto">
          {tab === 'priests' ? (
            <div>
              {/* Quick feature overview */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
                {[
                  { icon: '🎁', label: 'Gift Registry', desc: 'List the sacred items you need for ministry' },
                  { icon: '✉️', label: 'RSVP System', desc: 'Manage your guest list and ordination events' },
                  { icon: '🏦', label: 'Direct Payouts', desc: 'Donations go straight to your bank account' },
                ].map((f) => (
                  <div key={f.label} className="bg-cream border border-near-black/10 rounded-sm p-4 text-center">
                    <div className="text-2xl mb-2">{f.icon}</div>
                    <p className="font-inter text-sm font-medium text-near-black mb-1">{f.label}</p>
                    <p className="font-inter text-xs text-near-black/50 leading-relaxed">{f.desc}</p>
                  </div>
                ))}
              </div>
              <AccordionGroup items={forPriests} />
            </div>
          ) : (
            <div>
              {/* Quick feature overview */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
                {[
                  { icon: '🔍', label: 'Find a Priest', desc: 'Browse the directory or use a direct link' },
                  { icon: '💝', label: 'Give a Gift', desc: 'Donate to a registry item or the general fund' },
                  { icon: '📋', label: 'RSVP', desc: 'Confirm attendance to ordination events' },
                ].map((f) => (
                  <div key={f.label} className="bg-cream border border-near-black/10 rounded-sm p-4 text-center">
                    <div className="text-2xl mb-2">{f.icon}</div>
                    <p className="font-inter text-sm font-medium text-near-black mb-1">{f.label}</p>
                    <p className="font-inter text-xs text-near-black/50 leading-relaxed">{f.desc}</p>
                  </div>
                ))}
              </div>
              <AccordionGroup items={forGuests} />
            </div>
          )}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12">
          <p className="font-inter text-sm text-near-black/50">
            Still have questions?{' '}
            <a href="mailto:support@adaltare.com" className="text-burgundy-800 hover:underline">
              Email us at support@adaltare.com
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
