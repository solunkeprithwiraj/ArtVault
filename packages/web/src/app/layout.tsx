import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';
import { Header } from '@/components/header';

export const metadata: Metadata = {
  title: 'ArtVault',
  description: 'Your personal art gallery',
  manifest: '/manifest.json',
  themeColor: '#ec4899',
  icons: { icon: '/icon-192.svg', apple: '/icon-192.svg' },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <Header />
          <main className="mx-auto max-w-7xl px-4 py-6 pb-24 sm:py-8 sm:pb-8">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
