import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ArtVault',
  description: 'Your personal art gallery',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <header className="sticky top-0 z-40 border-b border-white/10 bg-neutral-950/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
            <a href="/" className="text-2xl font-bold tracking-tight">
              Art<span className="text-pink-500">Vault</span>
            </a>
            <nav className="flex gap-6 text-sm font-medium text-neutral-400">
              <a href="/" className="hover:text-white transition-colors">
                Gallery
              </a>
              <a href="/collections" className="hover:text-white transition-colors">
                Collections
              </a>
              <a href="/add" className="hover:text-white transition-colors">
                + Add
              </a>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
