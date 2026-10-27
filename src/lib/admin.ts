import { clerkClient } from '@clerk/nextjs/server';

/** True when the signed-in user has the admin role (live Clerk metadata). */
export async function isAdminUser(userId: string | null): Promise<boolean> {
  if (!userId) return false;
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  return (user.publicMetadata?.role as string | undefined) === 'admin';
}
