/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable the client-side router cache for dynamic pages so navigating
  // between pages always fetches fresh data from the server instead of
  // serving stale HTML cached in memory for 30 seconds.
  experimental: {
    staleTimes: {
      dynamic: 0,
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
