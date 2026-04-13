import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { priests } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { Sidebar } from '@/components/dashboard/sidebar';
import { SetupWizard } from '@/components/dashboard/setup-wizard';

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
        {children}
      </main>

      {/* Setup wizard — pops up on every visit until Stripe is connected */}
      <SetupWizard
        stripeConnected={priest.stripeOnboardingComplete}
        profileVisible={priest.profileVisible}
        slug={priest.slug}
      />
    </div>
  );
}
