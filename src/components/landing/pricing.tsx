import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

const freeFeatures = [
  'Your ordination page with your story and photos',
  'Unlimited wishlist items and links to other registries',
  'RSVP for your ordination, First Mass, and receptions',
  'Guest list upload and response export',
];

const stripeFeatures = [
  'Cash gifts toward items, plus a General Fund',
  'Deposits straight into your own bank account',
  'Donor dashboard and personal thank-you emails',
];

export function Pricing() {
  return (
    <section className="section-padding bg-cream">
      <div className="container-narrow">
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-[0.3em] text-gold-600 font-inter mb-3">
            Transparent pricing
          </p>
          <h2 className="font-cormorant text-4xl sm:text-5xl font-light text-burgundy-800 mb-4">
            Simple & Honest
          </h2>
          <div className="flex items-center justify-center gap-4">
            <div className="h-px w-12 bg-gold-600/40" />
            <div className="w-1.5 h-1.5 rounded-full bg-gold-600/60" />
            <div className="h-px w-12 bg-gold-600/40" />
          </div>
        </div>

        <div className="max-w-lg mx-auto bg-white border border-near-black/10 shadow-sm rounded-sm overflow-hidden">
          {/* Header */}
          <div className="bg-burgundy-800 px-4 sm:px-8 py-6 text-center">
            <h3 className="font-cormorant text-3xl font-light text-cream mb-1">
              Free for Priests &amp; Seminarians
            </h3>
            <p className="font-inter text-cream/60 text-sm">
              No sign-up cost. No subscription. No credit card.
            </p>
          </div>

          {/* Always free */}
          <div className="px-4 sm:px-8 py-6 border-b border-near-black/10">
            <div className="flex items-baseline justify-center gap-2 mb-5">
              <span className="font-cormorant text-6xl font-light text-burgundy-800">$0</span>
              <span className="font-inter text-near-black/50 text-sm">always</span>
            </div>
            <ul className="space-y-3">
              {freeFeatures.map((feature) => (
                <li key={feature} className="flex items-center gap-3">
                  <CheckCircle className="h-4 w-4 text-gold-600 shrink-0" />
                  <span className="font-inter text-sm text-near-black/70">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Optional Stripe */}
          <div className="px-4 sm:px-8 py-6 bg-cream/50">
            <p className="font-inter text-xs uppercase tracking-widest text-near-black/40 mb-1">
              Optional: direct gifts with Stripe
            </p>
            <p className="font-inter text-sm text-near-black/60 mb-4">
              <strong className="text-burgundy-800">1%</strong> of each gift (plus Stripe&apos;s processing fee)
              — only if you choose to connect Stripe.
            </p>
            <ul className="space-y-3">
              {stripeFeatures.map((feature) => (
                <li key={feature} className="flex items-center gap-3">
                  <CheckCircle className="h-4 w-4 text-near-black/30 shrink-0" />
                  <span className="font-inter text-sm text-near-black/70">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* CTA */}
          <div className="px-4 sm:px-8 py-8">
            <Button asChild size="lg" className="w-full">
              <Link href="/sign-up">Create Your Registry</Link>
            </Button>
            <p className="text-center font-inter text-near-black/40 text-xs mt-3">
              No credit card required. Free to set up.
            </p>
          </div>
        </div>

        <p className="text-center mt-8 font-inter text-near-black/40 text-sm">
          The 1% only applies to gifts made through Stripe and helps cover the cost of running
          Ad Altare. Stripe&apos;s processing fee is typically 2.9% + 30¢. The priest receives the rest.
        </p>
        <p className="text-center mt-4 font-inter text-near-black/50 text-sm">
          Ad Altare is built by seminarians and supported by ChiRho Events.{' '}
          <Link href="/support" className="text-burgundy-800 hover:underline">
            Help keep it running →
          </Link>
        </p>
      </div>
    </section>
  );
}
