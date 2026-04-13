import { auth, clerkClient } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { UserButton } from '@clerk/nextjs';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const role = user.publicMetadata?.role as string | undefined;

  if (role !== 'admin') redirect('/dashboard');

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-burgundy-900 text-cream px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/">
            <Image
              src="/images/logo.png"
              alt="Ad Altare"
              width={540}
              height={205}
              className="h-9 w-auto"
              quality={100}
            />
          </Link>
          <span className="text-cream/20">|</span>
          <Link href="/admin" className="font-inter text-sm text-cream/70 hover:text-cream transition-colors">
            Admin Console
          </Link>
          <Link href="/admin/reports" className="font-inter text-sm text-cream/70 hover:text-cream transition-colors">
            Reports
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
