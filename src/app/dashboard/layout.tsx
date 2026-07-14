import { auth, clerkClient } from '@clerk/nextjs/server';
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

  // Fetch live user record to get current publicMetadata (not cached JWT claims)
  const client = await clerkClient();
  const clerkUser = await client.users.getUser(userId);
  const role = clerkUser?.publicMetadata?.role as string | undefined;

  console.log(`[dashboard layout] userId=${userId} role=${role}`);

  if (role === 'admin') redirect('/admin');

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
      {/* pt-14 offsets the fixed mobile top bar (56px); removed on lg+ where sidebar is static */}
      <main className="flex-1 overflow-auto pt-14 lg:pt-0 min-w-0">
        {children}
      </main>
    </div>
  );
}
