import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

const features = [
  'Unlimited registry items',
  'Public ordination page with your story',
  'Stripe Connect for direct deposits',
  'Donor management dashboard',
  'Customizable thank-you email template',
  'Priest and donor email notifications',
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
              Free to Create
            </h3>
            <p className="font-inter text-cream/60 text-sm">
              Your page, your story, no monthly fee.
            </p>
          </div>

          {/* Fee callout */}
          <div className="px-4 sm:px-8 py-6 border-b border-near-black/10">
            <div className="flex items-baseline justify-center gap-2">
              <span className="font-cormorant text-6xl font-light text-burgundy-800">
                2%
              </span>
              <span className="font-inter text-near-black/50 text-sm">
                + Stripe processing fees
              </span>
            </div>
            <p className="text-center font-inter text-near-black/50 text-xs mt-2">
              Only charged when you receive a donation. Nothing otherwise.
            </p>
          </div>

          {/* Features */}
          <div className="px-4 sm:px-8 py-6">
            <ul className="space-y-3">
              {features.map((feature) => (
                <li key={feature} className="flex items-center gap-3">
                  <CheckCircle className="h-4 w-4 text-gold-600 shrink-0" />
                  <span className="font-inter text-sm text-near-black/70">
                    {feature}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* CTA */}
          <div className="px-4 sm:px-8 pb-8">
            <Button asChild size="lg" className="w-full">
              <Link href="/sign-up">Create Your Registry</Link>
            </Button>
            <p className="text-center font-inter text-near-black/40 text-xs mt-3">
              No credit card required. Free to set up.
            </p>
          </div>
        </div>

        <p className="text-center mt-8 font-inter text-near-black/40 text-sm">
          Stripe processing fees are typically 2.9% + 30¢ per transaction and are
          deducted automatically. The priest receives the remainder.
        </p>
      </div>
    </section>
  );
}
