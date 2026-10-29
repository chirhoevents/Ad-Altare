import { sql } from 'drizzle-orm';
import { db } from '@/db';

/** Best-effort client IP (Vercel sets x-real-ip / x-forwarded-for). */
export function clientIp(req: Request): string {
  return (
    req.headers.get('x-real-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown'
  );
}

/**
 * Fixed-window rate limit backed by Postgres (works across serverless
 * instances). Returns true when the request is allowed.
 *
 * Fails OPEN: if the database errors (e.g. the rate_limits table hasn't been
 * created yet) the request is allowed, so this can never take the site down.
 */
export async function rateLimit(
  req: Request,
  name: string,
  { limit, windowSeconds }: { limit: number; windowSeconds: number },
): Promise<boolean> {
  const key = `${name}:${clientIp(req)}`;
  try {
    const result = await db.execute(sql`
      insert into rate_limits (key, window_start, count)
      values (
        ${key},
        to_timestamp(floor(extract(epoch from now()) / ${windowSeconds}) * ${windowSeconds}),
        1
      )
      on conflict (key, window_start) do update set count = rate_limits.count + 1
      returning count
    `);
    const count = Number((result.rows[0] as { count: number } | undefined)?.count ?? 0);

    // Occasionally prune old windows so the table stays tiny.
    if (Math.random() < 0.01) {
      await db.execute(sql`delete from rate_limits where window_start < now() - interval '1 day'`);
    }
    return count <= limit;
  } catch (err) {
    console.warn(`[rate-limit] check failed for ${name}; allowing request:`, err instanceof Error ? err.message : err);
    return true;
  }
}

export const TOO_MANY = { error: 'Too many attempts. Please wait a few minutes and try again.' };
