import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { priests } from '@/db/schema';
import { eq } from 'drizzle-orm';

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  // If already onboarded, skip straight to dashboard
  const existing = await db.query.priests.findFirst({
    where: eq(priests.clerkUserId, userId),
    columns: { id: true },
  });

  if (existing) redirect('/dashboard');

  return <>{children}</>;
}
