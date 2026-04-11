import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/p/(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks/(.*)',
]);

const isAdminRoute = createRouteMatcher(['/admin(.*)']);
const isProtectedRoute = createRouteMatcher(['/dashboard(.*)', '/admin(.*)', '/onboarding(.*)']);

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();

  // Redirect unauthenticated users away from protected routes
  if (isProtectedRoute(req) && !userId) {
    const signInUrl = new URL('/sign-in', req.url);
    signInUrl.searchParams.set('redirect_url', req.url);
    return NextResponse.redirect(signInUrl);
  }

  // Admin-only routes: redirect non-admins to dashboard
  if (isAdminRoute(req) && userId) {
    const role = (sessionClaims?.publicMetadata as { role?: string } | undefined)?.role;
    if (role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
