const steps = [
  {
    number: '01',
    title: 'Create your profile',
    description:
      'Sign up and tell your story — your seminary, diocese, ordination date, and the journey that led you to the priesthood. Your page becomes a living testimony.',
  },
  {
    number: '02',
    title: 'Build your registry',
    description:
      'Add the sacred vessels, vestments, books, and items you need to begin your ministry. Set a goal for each, and watch the community respond.',
  },
  {
    number: '03',
    title: 'Share your page',
    description:
      'Send your personal link to family, friends, and parishioners. Donations go directly to your connected bank account via Stripe. You handle the gratitude; we handle the rest.',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="section-padding bg-cream">
      <div className="container-wide">
        {/* Section header */}
        <div className="text-center mb-16">
          <p className="text-xs uppercase tracking-[0.3em] text-gold-600 font-inter mb-3">
            Simple by design
          </p>
          <h2 className="font-cormorant text-4xl sm:text-5xl font-light text-burgundy-800 mb-4">
            How It Works
          </h2>
          <div className="flex items-center justify-center gap-4">
            <div className="h-px w-12 bg-gold-600/40" />
            <div className="w-1.5 h-1.5 rounded-full bg-gold-600/60" />
            <div className="h-px w-12 bg-gold-600/40" />
          </div>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, idx) => (
            <div key={step.number} className="relative">
              {/* Connector line */}
              {idx < steps.length - 1 && (
                <div className="hidden md:block absolute top-8 left-full w-full h-px bg-gold-600/20 -translate-y-1/2 z-0" />
              )}

              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-4">
                  <span className="font-cormorant text-5xl font-light text-gold-600/30 leading-none">
                    {step.number}
                  </span>
                  <div className="h-px flex-1 bg-near-black/10" />
                </div>
                <h3 className="font-cormorant text-2xl font-semibold text-burgundy-800 mb-3">
                  {step.title}
                </h3>
                <p className="font-inter text-near-black/60 text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
