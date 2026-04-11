import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-4 text-center">
      <div className="mb-8">
        <div className="h-px w-16 bg-gold-600/40 mx-auto mb-6" />
        <p className="font-inter text-xs uppercase tracking-[0.3em] text-gold-600 mb-4">404</p>
        <h1 className="font-cormorant text-5xl font-light text-burgundy-800 mb-4">
          Page Not Found
        </h1>
        <p className="font-inter text-near-black/50 text-base max-w-md mx-auto mb-8">
          The page you're looking for doesn't exist or may have been moved.
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild>
            <Link href="/">Return Home</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/sign-in">Sign In</Link>
          </Button>
        </div>
      </div>
      <p className="font-cormorant text-xl text-near-black/20 italic mt-8">
        "Trust in the Lord with all your heart." — Proverbs 3:5
      </p>
    </div>
  );
}
