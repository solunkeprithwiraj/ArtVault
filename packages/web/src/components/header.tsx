'use client';

import { useState } from 'react';
import { ThemeToggle } from './theme-provider';

export function Header() {
  const [showMore, setShowMore] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-themed bg-themed-card" style={{ backdropFilter: 'blur(12px)' }}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <a href="/" className="text-2xl font-bold tracking-tight text-themed">
            Art<span className="accent-text">Vault</span>
          </a>
          <div className="flex items-center gap-4">
            <nav className="hidden items-center gap-6 text-sm font-medium text-themed-secondary sm:flex">
              <a href="/" className="transition-colors hover:text-themed">Gallery</a>
              <a href="/collections" className="transition-colors hover:text-themed">Collections</a>
              <a href="/add" className="transition-colors hover:text-themed">+ Add</a>

              {/* More dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowMore(!showMore)}
                  className="transition-colors hover:text-themed"
                >
                  More
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ml-1 inline">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
                {showMore && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowMore(false)} />
                    <div className="absolute right-0 top-full z-50 mt-2 w-44 rounded-lg border border-themed bg-themed-card py-1 shadow-xl">
                      {[
                        { href: '/dashboard', label: 'Dashboard' },
                        { href: '/timeline', label: 'Timeline' },
                        { href: '/compare', label: 'Compare' },
                        { href: '/moodboard', label: 'Mood Board' },
                        { href: '/clipper', label: 'Web Clipper' },
                      ].map(({ href, label }) => (
                        <a
                          key={href}
                          href={href}
                          className="block px-4 py-2 text-sm text-themed-secondary hover:bg-themed-input hover:text-themed"
                          onClick={() => setShowMore(false)}
                        >
                          {label}
                        </a>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </nav>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="mobile-nav sm:hidden">
        <a href="/" className="flex flex-col items-center gap-1 text-xs text-themed-secondary">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
          </svg>
          Gallery
        </a>
        <a href="/collections" className="flex flex-col items-center gap-1 text-xs text-themed-secondary">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
          Collections
        </a>
        <a href="/add" className="flex flex-col items-center gap-1 text-xs text-themed-secondary">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><path d="M12 8v8M8 12h8" />
          </svg>
          Add
        </a>
        <a href="/timeline" className="flex flex-col items-center gap-1 text-xs text-themed-secondary">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
          </svg>
          Timeline
        </a>
        <a href="/moodboard" className="flex flex-col items-center gap-1 text-xs text-themed-secondary">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 3v18" />
          </svg>
          Board
        </a>
      </nav>
    </>
  );
}
