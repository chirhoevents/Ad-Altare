import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Ad Altare — Ordination Registry for Catholic Priests',
    template: '%s | Ad Altare',
  },
  description:
    'A sacred platform for Catholic priests to manage their ordination registry and receive gifts from family, friends, and the faithful.',
  keywords: ['Catholic', 'ordination', 'registry', 'priest', 'seminary', 'First Mass'],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: 'Ad Altare',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link
            href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&family=Inter:wght@300;400;500;600;700&display=swap"
            rel="stylesheet"
          />
        </head>
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
