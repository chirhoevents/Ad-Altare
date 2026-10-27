import { auth, clerkClient } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { priests } from '@/db/schema';

/** True when the signed-in user has the admin role (live Clerk metadata). */
export async function isAdminUser(userId: string | null): Promise<boolean> {
  if (!userId) return false;
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  return (user.publicMetadata?.role as string | undefined) === 'admin';
}

/**
 * Hidden pages (profileVisible = false) are only viewable by the priest who
 * owns them and by admins — everyone else gets a 404.
 */
export async function canViewHiddenPriestPage(priestClerkUserId: string): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) return false;
  if (userId === priestClerkUserId) return true;
  return isAdminUser(userId);
}

/** For public APIs (donations, RSVP): is this priest's page live to the public? */
export async function isPriestPublic(priestId: string): Promise<boolean> {
  const priest = await db.query.priests.findFirst({
    where: eq(priests.id, priestId),
    columns: { profileVisible: true },
  });
  return !!priest?.profileVisible;
}
