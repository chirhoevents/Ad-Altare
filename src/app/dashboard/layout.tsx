import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
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
        {children}
      </main>
    </div>
  );
}
