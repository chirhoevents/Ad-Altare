import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function PriestNotFound() {
  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-4 text-center">
      <nav className="absolute top-0 left-0 right-0 px-6 py-5">
        <Link href="/" className="font-cormorant text-2xl text-burgundy-800 font-light">
          Ad Altare
        </Link>
      </nav>
      <p className="font-inter text-xs uppercase tracking-[0.3em] text-gold-600 mb-4">Not Found</p>
      <h1 className="font-cormorant text-5xl font-light text-burgundy-800 mb-4">
        Registry Not Found
      </h1>
      <p className="font-inter text-near-black/50 max-w-md mx-auto mb-8">
        This ordination registry doesn't exist or the link may be incorrect.
      </p>
      <Button asChild>
        <Link href="/">Go to Ad Altare</Link>
      </Button>
    </div>
  );
}
