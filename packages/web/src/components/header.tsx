'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ThemeToggle } from './theme-provider';
import { clearToken } from '@/lib/api';
import { useAuth } from '@/lib/hooks';

const navPages = [
  { href: '/timeline', label: 'Timeline', icon: 'M12 6v6l4 2' },
  { href: '/compare', label: 'Compare', icon: 'M9 3v18M15 3v18M3 9h6M3 15h6M15 9h6M15 15h6' },
  { href: '/moodboard', label: 'Mood Board', icon: 'M3 3h18v18H3zM3 9h18M9 3v18' },
  { href: '/clipper', label: 'Web Clipper', icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101' },
];

export function Header() {
  const pathname = usePathname();
  const { data: user } = useAuth();
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);

  const handleLogout = () => {
    clearToken();
    window.location.href = '/login';
  };

  const isNavActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-themed bg-themed-card" style={{ backdropFilter: 'blur(12px)' }} role="banner">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-2xl font-bold tracking-tight text-themed">
            Art<span className="accent-text">Vault</span>
          </Link>
          <div className="flex items-center gap-4">
            <nav className="hidden items-center gap-6 text-sm font-medium text-themed-secondary sm:flex" aria-label="Main navigation">
              <Link href="/" className={`transition-colors hover:text-themed ${isNavActive('/') ? 'accent-text' : ''}`}>Gallery</Link>
              <Link href="/collections" className={`transition-colors hover:text-themed ${isNavActive('/collections') ? 'accent-text' : ''}`}>Collections</Link>
              <Link href="/add" className={`transition-colors hover:text-themed ${isNavActive('/add') ? 'accent-text' : ''}`}>+ Add</Link>

              <DropdownMenu.Root>
                <DropdownMenu.Trigger className={`flex items-center gap-1 transition-colors hover:text-themed outline-none ${navPages.some((p) => isNavActive(p.href)) ? 'accent-text' : ''}`}>
                  More
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </DropdownMenu.Trigger>

                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    className="z-50 mt-2 w-44 rounded-lg border py-1 shadow-xl animate-fade-in"
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      borderColor: 'var(--border-color)',
                    }}
                    sideOffset={8}
                    align="end"
                  >
                    {navPages.map(({ href, label }) => (
                      <DropdownMenu.Item key={href} asChild>
                        <Link
                          href={href}
                          className="dropdown-item block px-4 py-2 text-sm text-themed-secondary outline-none transition-colors hover:bg-themed-input hover:text-themed"
                        >
                          {label}
                        </Link>
                      </DropdownMenu.Item>
                    ))}
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            </nav>

            <ThemeToggle />

            {user && (
              <DropdownMenu.Root>
                <DropdownMenu.Trigger className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-themed-secondary outline-none transition-colors hover:text-themed">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: 'var(--accent)' }}>
                    {user.username[0].toUpperCase()}
                  </span>
                  <span className="hidden sm:inline">{user.username}</span>
                </DropdownMenu.Trigger>

                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    className="z-50 mt-2 w-44 rounded-lg border py-1 shadow-xl animate-fade-in"
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      borderColor: 'var(--border-color)',
                    }}
                    sideOffset={8}
                    align="end"
                  >
                    <div className="px-4 py-2 text-xs text-themed-muted">
                      {user.role}
                    </div>
                    <DropdownMenu.Separator className="my-1 h-px" style={{ backgroundColor: 'var(--border-color)' }} />
                    <DropdownMenu.Item
                      className="dropdown-item-logout block w-full cursor-pointer px-4 py-2 text-left text-sm text-themed-secondary outline-none transition-colors hover:bg-themed-input hover:text-red-500"
                      onSelect={handleLogout}
                    >
                      Sign out
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            )}
          </div>
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="mobile-nav sm:hidden" aria-label="Mobile navigation">
        {[
          { href: '/', label: 'Gallery', icon: <><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></> },
          { href: '/collections', label: 'Collections', icon: <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /> },
          { href: '/add', label: 'Add', icon: <><circle cx="12" cy="12" r="10" /><path d="M12 8v8M8 12h8" /></> },
          { href: '/dashboard', label: 'Stats', icon: <path d="M3 3v18h18M7 16V9M12 16V5M17 16v-4" /> },
        ].map(({ href, label, icon }) => {
          const isActive = isNavActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={`mobile-nav-item flex flex-col items-center gap-1 text-xs transition-colors ${
                isActive ? 'accent-text font-semibold' : 'text-themed-secondary'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth={isActive ? 2.5 : 2}
                strokeLinecap="round" strokeLinejoin="round">
                {icon}
              </svg>
              {label}
              {isActive && <span className="absolute -top-px left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full" style={{ backgroundColor: 'var(--accent)' }} />}
            </Link>
          );
        })}

        {/* More tab */}
        <button
          onClick={() => setMobileMoreOpen(!mobileMoreOpen)}
          className={`mobile-nav-item flex flex-col items-center gap-1 text-xs transition-colors ${
            mobileMoreOpen || navPages.some((p) => pathname.startsWith(p.href))
              ? 'accent-text font-semibold'
              : 'text-themed-secondary'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" />
          </svg>
          More
        </button>
      </nav>

      {/* Mobile more sheet */}
      {mobileMoreOpen && (
        <>
          <div className="fixed inset-0 z-[45] bg-black/50 sm:hidden" onClick={() => setMobileMoreOpen(false)} />
          <div className="fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom,0px))] left-0 right-0 z-[46] animate-slide-up rounded-t-2xl border-t border-themed bg-themed-card p-4 sm:hidden">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-themed">More</h3>
              <button onClick={() => setMobileMoreOpen(false)} className="p-1 text-themed-muted">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {navPages.map(({ href, label, icon }) => {
                const isActive = pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileMoreOpen(false)}
                    className={`flex flex-col items-center gap-2 rounded-xl p-3 transition-colors ${
                      isActive ? 'accent-soft-bg accent-text' : 'bg-themed-input text-themed-secondary'
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d={icon} />
                    </svg>
                    <span className="text-xs font-medium">{label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}
    </>
  );
}
