'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FaqItem {
  q: string;
  a: string;
}

const forPriests: FaqItem[] = [
  {
    q: 'Is Ad Altare free?',
    a: 'Yes — there is no cost to sign up and no subscription. When you receive a gift, a small 1% platform fee and Stripe\'s standard card processing fee (about 2.9% + 30¢) are deducted automatically; you receive the rest. Ad Altare is built by seminarians and supported by ChiRho Events. If you\'d like to help cover its costs, there is a "Support Ad Altare" link in your dashboard — never required.',
  },
  {
    q: 'How do I create my page?',
    a: 'Sign up, fill in your profile (title, diocese, seminary, ordination date, and a short bio), and add a profile and backdrop photo in Settings. Your page starts out hidden so you can set it up in peace — when you\'re ready, turn on "Make my page public" in Settings. Then copy your link from the dashboard and share it with family and friends.',
  },
  {
    q: 'What is the difference between a gift item and a wishlist item?',
    a: 'Gift items (like a chalice or vestments) have a goal amount — donors can give any amount toward them or "fully fund" the remainder, and you can watch the progress bar fill. Wishlist items link to a store (Amazon, a church-goods supplier, etc.) so a donor can buy the item directly; you mark it "purchased" once it arrives. You can also add links to registries you keep elsewhere, and donors can always give to your General Fund.',
  },
  {
    q: 'When and how do I receive the money?',
    a: 'You connect your bank account through Stripe, a secure payment processor, from Settings — it takes about five minutes. After Stripe verifies your details, gifts are paid out to your bank automatically every day (your very first payout can take up to about a week while Stripe completes its checks). You never have to request a payout.',
  },
  {
    q: 'How do thank-you notes work?',
    a: 'Every donor receives an automatic receipt by email. From the Donors page you can then send each donor a personal thank-you using your own template (edit it in Settings). Anonymous donors are sent your thank-you note automatically, since you won\'t know who they are. You can export your full donor list as a spreadsheet at any time.',
  },
  {
    q: 'How is my title shown?',
    a: 'Choose Seminarian, Transitional Deacon, or Deacon in Settings. In the three months before your ordination date your page shows "Soon-to-be Fr." and thank-you emails are signed "Fr.", and from your ordination day on you are shown as "Fr." everywhere automatically.',
  },
  {
    q: 'How does RSVP work?',
    a: 'Under RSVP in your dashboard, add your guest list (one by one or by uploading a spreadsheet), then create your events — your Ordination Mass, First Mass, a reception — with optional custom questions such as dietary needs. Guests find their invitation by name on your page. You can set an RSVP deadline (it closes at the end of that day, Pacific time), edit events at any time, and export the responses.',
  },
  {
    q: 'What if a guest is not on my list?',
    a: 'Guests look themselves up by name. If they are not found, they are asked to contact you directly. Add them from the RSVP dashboard and they can try again right away.',
  },
  {
    q: 'I need help or something isn\'t working.',
    a: 'Email support@adaltare.com and a real person will get back to you.',
  },
];

const forGuests: FaqItem[] = [
  {
    q: 'How do I find a priest\'s page?',
    a: 'Use the link the priest shared with you, or search the Find a Priest directory. Each page has his story, his registry, and (if he is using it) an RSVP for his ordination events.',
  },
  {
    q: 'How do I give a gift?',
    a: 'Open the Registry tab on his page. You can give any amount toward a specific item, use "Fully Fund" to cover the rest of an item, or give to his General Fund. Wishlist items are bought directly from the store linked on the item. Payment is by card (and other methods Stripe offers) in a secure checkout.',
  },
  {
    q: 'Where does my gift go?',
    a: 'To the priest\'s own Stripe account and on to his bank — Ad Altare passes each gift straight through to him. A small platform fee and the standard card processing fee are deducted from each gift.',
  },
  {
    q: 'Can I give anonymously?',
    a: 'Yes. Turn on "Donate anonymously" in the gift form. Your name, address, and phone number are not collected or shown to the priest. We keep only your email address to send your receipt and his thank-you note.',
  },
  {
    q: 'Will I get a receipt? Is my gift tax-deductible?',
    a: 'You will receive an email confirmation right away. Gifts to an individual priest or seminarian are personal gifts and generally are not tax-deductible — please check with your tax advisor if you have questions.',
  },
  {
    q: 'How do I RSVP?',
    a: 'Open the RSVP tab on the priest\'s page and enter your first and last name as they appear on your invitation. You will see the events you\'re invited to — choose whether you\'re attending, how many in your party, and answer any questions. Need to change your answer? Just RSVP again before the deadline and your new response replaces the old one.',
  },
  {
    q: 'What if my name isn\'t found when I try to RSVP?',
    a: 'Your name must be on the guest list the priest uploaded. Try the spelling on your invitation; if it still isn\'t found, contact the priest to be added, then come back and RSVP.',
  },
  {
    q: 'Is my payment information secure?',
    a: 'Yes. All payments are processed by Stripe, which handles payments for millions of businesses worldwide. Ad Altare never sees or stores your card number.',
  },
  {
    q: 'How can I support Ad Altare itself?',
    a: 'Ad Altare is free for priests and is kept running by ChiRho Technologies and ChiRho Events. If you\'d like to help with server and development costs, visit the "Support Ad Altare" page linked at the bottom of every page — even $5 helps. Thank you!',
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
