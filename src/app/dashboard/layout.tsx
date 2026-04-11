import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/db';
import { priests } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { Sidebar } from '@/components/dashboard/sidebar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const priest = await db.query.priests.findFirst({
    where: eq(priests.clerkUserId, userId),
  });

  if (!priest) redirect('/onboarding');

  return (
    <div className="flex min-h-screen bg-cream">
      <Sidebar
        priestName={`${priest.firstName} ${priest.lastName}`}
        slug={priest.slug}
      />
      <main className="flex-1 overflow-auto">
        {!priest.stripeOnboardingComplete && (
          <div className="bg-gold-50 border-b border-gold-200 px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
            <p className="font-inter text-sm text-gold-800">
              Connect Stripe to receive donations — your public page is live but donors can&apos;t give yet.
            </p>
            <Link
              href="/dashboard/settings"
              className="font-inter text-xs font-semibold text-gold-800 underline whitespace-nowrap"
            >
              Connect Stripe →
            </Link>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
