import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId, sessionClaims } = await auth();
  if (!userId) redirect('/sign-in');

  const role = (sessionClaims?.publicMetadata as { role?: string })?.role;
  if (role !== 'admin') redirect('/dashboard');

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-near-black text-cream px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-cormorant text-xl text-cream font-light">
            Ad Altare
          </Link>
          <span className="text-cream/20">|</span>
          <Link href="/admin" className="font-inter text-sm text-cream/70 hover:text-cream transition-colors">
            Admin Console
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="font-inter text-xs text-cream/40 hover:text-cream transition-colors">
            My Dashboard
          </Link>
          <UserButton />
        </div>
      </header>
      <main className="p-8 max-w-7xl mx-auto">{children}</main>
    </div>
  );
}
