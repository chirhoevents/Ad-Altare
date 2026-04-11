import { SignIn } from '@clerk/nextjs';
import Link from 'next/link';

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Header */}
      <nav className="px-6 py-5 border-b border-near-black/10">
        <Link href="/" className="font-cormorant text-2xl text-burgundy-800 font-light tracking-wide">
          Ad Altare
        </Link>
      </nav>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="font-cormorant text-4xl font-light text-burgundy-800 mb-2">
              Welcome Back
            </h1>
            <p className="font-inter text-near-black/50 text-sm">
              Sign in to manage your ordination registry
            </p>
          </div>

          <div className="flex justify-center">
            <SignIn
              appearance={{
                elements: {
                  rootBox: 'w-full',
                  card: 'shadow-none border border-near-black/10 rounded-sm bg-white',
                  headerTitle: 'hidden',
                  headerSubtitle: 'hidden',
                  socialButtonsBlockButton:
                    'border border-near-black/20 text-near-black font-inter text-sm',
                  formButtonPrimary:
                    'bg-burgundy-800 hover:bg-burgundy-900 font-inter text-sm',
                  footerActionLink: 'text-burgundy-800',
                },
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
