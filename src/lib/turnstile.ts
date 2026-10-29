/**
 * Server-side Cloudflare Turnstile check. Disabled (always passes) until
 * TURNSTILE_SECRET_KEY is set, so the site works before the keys are added.
 */
export async function verifyTurnstile(token: string | undefined, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token, remoteip: ip }),
    });
    const data = (await res.json()) as { success?: boolean };
    return !!data.success;
  } catch (err) {
    // Cloudflare unreachable — don't block real donors; the rate limit still applies.
    console.warn('[turnstile] verification request failed; allowing:', err);
    return true;
  }
}

export const HUMAN_CHECK_FAILED = {
  error: 'We could not verify you are human. Please wait a moment and try again.',
};
