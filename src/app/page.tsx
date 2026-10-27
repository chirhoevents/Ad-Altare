import { Hero } from '@/components/landing/hero';
import { HowItWorks } from '@/components/landing/how-it-works';
import { TwoWays } from '@/components/landing/two-ways';
import { WhyAdAltare } from '@/components/landing/why-ad-altare';
import { Pricing } from '@/components/landing/pricing';
import { FeaturesFaq } from '@/components/landing/features-faq';
import { Footer } from '@/components/landing/footer';
import { LandingNav } from '@/components/landing/landing-nav';

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <LandingNav />
      <Hero />
      <HowItWorks />
      <TwoWays />
      <WhyAdAltare />
      <Pricing />
      <FeaturesFaq />
      <Footer />
    </div>
  );
}
