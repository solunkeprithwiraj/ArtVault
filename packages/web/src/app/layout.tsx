import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { Header } from '@/components/header';
import { ErrorBoundary } from '@/components/error-boundary';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'ArtVault',
  description: 'Your personal art gallery',
  manifest: '/manifest.json',
  icons: { icon: '/icon-192.svg', apple: '/icon-192.svg' },
};

export const viewport: Viewport = {
  themeColor: '#ec4899',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body>
        <Providers>
          <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:accent-bg focus:px-4 focus:py-2 focus:text-white">
            Skip to content
          </a>
          <Header />
          <main id="main-content" role="main" className="mx-auto max-w-7xl px-4 py-6 pb-24 sm:py-8 sm:pb-8">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </main>
        </Providers>
      </body>
    </html>
  );
}
