import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function Hero() {
  return (
    <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-burgundy-800">
        {/* Subtle texture overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23FAF7F2' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        {/* Gradient fade at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-burgundy-900/50 to-transparent" />
      </div>

      {/* Cross decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5">
        <svg
          width="600"
          height="600"
          viewBox="0 0 600 600"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="260" y="50" width="80" height="500" fill="#FAF7F2" />
          <rect x="50" y="180" width="500" height="80" fill="#FAF7F2" />
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        {/* Gold ornament */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="h-px w-16 bg-gold-600/60" />
          <span className="text-gold-600 text-xs uppercase tracking-[0.3em] font-inter">
            Ad Altare Dei
          </span>
          <div className="h-px w-16 bg-gold-600/60" />
        </div>

        <h1 className="font-cormorant text-5xl sm:text-6xl lg:text-7xl font-light text-cream leading-tight mb-6">
          Your ordination.
          <br />
          <em className="text-gold-400">A gift to the Church.</em>
        </h1>

        <p className="font-inter text-cream/70 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          Ad Altare helps seminarians and newly ordained priests share their
          story, build an ordination registry, and receive gifts from those
          who want to support their sacred calling.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" variant="gold">
            <Link href="/sign-up">Create Your Page</Link>
          </Button>
          <Button
            asChild
            size="lg"
            className="border-cream/40 text-cream bg-transparent hover:bg-cream/10"
            variant="secondary"
          >
            <Link href="#how-it-works">Learn More</Link>
          </Button>
        </div>

        {/* Social proof hint */}
        <p className="mt-12 text-cream/40 text-sm font-inter">
          Free to create · 2% + processing on donations · Cancel anytime
        </p>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-5 h-8 border-2 border-cream/30 rounded-full flex items-start justify-center pt-1">
          <div className="w-1 h-2 bg-cream/50 rounded-full" />
        </div>
      </div>
    </section>
  );
}
