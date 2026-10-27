import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { DirectoryNavAuth } from '@/components/directory/directory-nav-auth';
import { SupportForm } from './support-form';

export const metadata: Metadata = {
  title: 'Support Ad Altare',
  description: 'Ad Altare is free for priests and seminarians. A small gift helps keep it running.',
};

interface Props {
  searchParams: { thanks?: string };
}

export default function SupportPage({ searchParams }: Props) {
  const thanked = searchParams.thanks === '1';

  return (
    <div className="min-h-screen bg-cream">
      <nav className="bg-near-black px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <Image src="/images/logo.png" alt="Ad Altare" width={540} height={205} className="h-9 w-auto" quality={100} />
        </Link>
        <DirectoryNavAuth />
      </nav>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <p className="text-xs uppercase tracking-[0.3em] text-gold-600 font-inter mb-3 text-center">
          Keep the lights on
        </p>
        <h1 className="font-cormorant text-4xl sm:text-5xl font-light text-burgundy-800 mb-6 text-center">
          Support Ad Altare
        </h1>

        {thanked ? (
          <div className="bg-white border border-gold-200 rounded-sm p-8 text-center space-y-3">
            <h2 className="font-cormorant text-3xl text-burgundy-800">Thank you &amp; God bless you!</h2>
            <p className="font-inter text-sm text-near-black/60 leading-relaxed">
              Your gift helps keep Ad Altare free for the men preparing to serve at the altar.
              A receipt from Stripe is on its way to your inbox.
            </p>
            <Link href="/" className="inline-block font-inter text-sm text-burgundy-800 hover:underline pt-2">
              ← Back to Ad Altare
            </Link>
          </div>
        ) : (
          <>
            <div className="font-inter text-base text-near-black/70 leading-relaxed space-y-4 mb-10">
              <p>
                Ad Altare is <strong>free for priests and seminarians</strong> — no sign-up cost and no
                subscription. It was built by seminarians and men preparing for the priesthood who
                wanted to make the road to ordination a little easier for their brothers.
              </p>
              <p>
                Ad Altare is part of <strong>ChiRho Technologies</strong>. Our servers and the people who
                help build and maintain the platform are supported by <strong>ChiRho Events</strong>.
              </p>
              <p>
                If Ad Altare has been a blessing to you — whether you&apos;re a priest, a family member, or a
                friend — would you consider a small gift toward its costs? Even $5 makes a real difference.
              </p>
            </div>

            <SupportForm />

            <p className="font-inter text-xs text-near-black/40 text-center mt-6 leading-relaxed">
              This gift supports Ad Altare itself and does not go to any individual priest. To support a
              priest, visit his page from the{' '}
              <Link href="/directory" className="underline hover:text-near-black/70">directory</Link>.
            </p>
          </>
        )}
      </main>
    </div>
  );
}
