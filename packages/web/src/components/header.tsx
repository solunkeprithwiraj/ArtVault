'use client';

import { ThemeToggle } from './theme-provider';

export function Header() {
  return (
    <>
      {/* Desktop header */}
      <header className="sticky top-0 z-40 border-b border-themed bg-themed-card" style={{ backdropFilter: 'blur(12px)' }}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <a href="/" className="text-2xl font-bold tracking-tight text-themed">
            Art<span className="accent-text">Vault</span>
          </a>
          <div className="flex items-center gap-4">
            <nav className="hidden gap-6 text-sm font-medium text-themed-secondary sm:flex">
              <a href="/" className="transition-colors hover:text-themed">
                Gallery
              </a>
              <a href="/collections" className="transition-colors hover:text-themed">
                Collections
              </a>
              <a href="/add" className="transition-colors hover:text-themed">
                + Add
              </a>
              <a href="/dashboard" className="transition-colors hover:text-themed">
                Dashboard
              </a>
            </nav>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="mobile-nav sm:hidden">
        <a href="/" className="flex flex-col items-center gap-1 text-xs text-themed-secondary">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
          </svg>
          Gallery
        </a>
        <a href="/collections" className="flex flex-col items-center gap-1 text-xs text-themed-secondary">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
          Collections
        </a>
        <a href="/add" className="flex flex-col items-center gap-1 text-xs text-themed-secondary">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><path d="M12 8v8M8 12h8" />
          </svg>
          Add
        </a>
        <a href="/dashboard" className="flex flex-col items-center gap-1 text-xs text-themed-secondary">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" />
          </svg>
          Stats
        </a>
      </nav>
    </>
  );
}
