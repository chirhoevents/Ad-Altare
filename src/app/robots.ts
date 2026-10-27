import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://ad-altare.com';
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard', '/admin', '/onboarding', '/api/', '/sign-in', '/sign-up'],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
