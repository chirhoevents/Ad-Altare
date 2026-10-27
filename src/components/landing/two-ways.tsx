import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Gift, Landmark, Check } from 'lucide-react';

const options = [
  {
    icon: Gift,
    badge: 'Free · No setup',
    title: 'Wishlist',
    lead: 'Show people exactly what to give you.',
    points: [
      'List the chalice, vestments, books — whatever you need',
      'Link each item to a store; family and friends buy it and send it to you',
      'Add links to Amazon or other registries you already have',
      'Mark items “purchased” so no one doubles up',
    ],
    footer: 'No Stripe account, no bank details, no fees.',
  },
  {
    icon: Landmark,
    badge: 'Optional · About 5 minutes',
    title: 'Direct Gifts (Stripe)',
    lead: 'Let people give money straight to your bank account.',
    points: [
      'Donors give any amount toward an item, or to your General Fund',
      'Funds deposit automatically into your own bank account',
      'Track donors and send personal thank-you notes',
      'Requires setting up a free Stripe account (ID verification, bank details)',
    ],
    footer: 'A small 1% fee — plus Stripe’s card processing — helps keep Ad Altare running.',
  },
];

export function TwoWays() {
  return (
    <section className="section-padding bg-white" id="two-ways">
      <div className="container-wide">
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-[0.3em] text-gold-600 font-inter mb-3">
            Your choice
          </p>
          <h2 className="font-cormorant text-4xl sm:text-5xl font-light text-burgundy-800 mb-4">
            Two Ways to Receive Gifts
          </h2>
          <p className="font-inter text-near-black/60 max-w-2xl mx-auto">
            Creating your page, a wishlist, and RSVPs for your ordination events is always free.
            Use one way, or both.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {options.map((o) => (
            <div key={o.title} className="bg-cream border border-near-black/10 rounded-sm p-6 sm:p-8 flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-full bg-burgundy-800 flex items-center justify-center shrink-0">
                  <o.icon className="w-5 h-5 text-cream" />
                </div>
                <span className="font-inter text-xs uppercase tracking-widest text-gold-700">{o.badge}</span>
              </div>
              <h3 className="font-cormorant text-3xl text-burgundy-800 mb-1">{o.title}</h3>
              <p className="font-inter text-sm text-near-black/70 mb-5">{o.lead}</p>
              <ul className="space-y-2.5 mb-6">
                {o.points.map((pt) => (
                  <li key={pt} className="flex gap-2.5 font-inter text-sm text-near-black/70">
                    <Check className="w-4 h-4 text-gold-600 shrink-0 mt-0.5" />
                    {pt}
                  </li>
                ))}
              </ul>
              <p className="mt-auto font-inter text-xs text-near-black/50 border-t border-near-black/10 pt-4">
                {o.footer}
              </p>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <Button asChild size="lg">
            <Link href="/sign-up">Create Your Free Page</Link>
          </Button>
          <p className="font-inter text-xs text-near-black/40 mt-3">
            Start with a wishlist — you can add Stripe later, or never.
          </p>
        </div>
      </div>
    </section>
  );
}
