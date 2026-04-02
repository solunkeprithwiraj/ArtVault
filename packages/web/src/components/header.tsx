'use client';

import { usePathname } from 'next/navigation';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ThemeToggle } from './theme-provider';
import { clearToken } from '@/lib/api';
import { useAuth } from '@/lib/hooks';

const moreLinks = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/timeline', label: 'Timeline' },
  { href: '/compare', label: 'Compare' },
  { href: '/moodboard', label: 'Mood Board' },
  { href: '/clipper', label: 'Web Clipper' },
];

export function Header() {
  const pathname = usePathname();
  const { data: user } = useAuth();

  const handleLogout = () => {
    clearToken();
    window.location.href = '/login';
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-themed bg-themed-card" style={{ backdropFilter: 'blur(12px)' }} role="banner">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <a href="/" className="text-2xl font-bold tracking-tight text-themed">
            Art<span className="accent-text">Vault</span>
          </a>
          <div className="flex items-center gap-4">
            <nav className="hidden items-center gap-6 text-sm font-medium text-themed-secondary sm:flex" aria-label="Main navigation">
              <a href="/" className="transition-colors hover:text-themed">Gallery</a>
              <a href="/collections" className="transition-colors hover:text-themed">Collections</a>
              <a href="/add" className="transition-colors hover:text-themed">+ Add</a>

              <DropdownMenu.Root>
                <DropdownMenu.Trigger className="flex items-center gap-1 transition-colors hover:text-themed outline-none">
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
                    {moreLinks.map(({ href, label }) => (
                      <DropdownMenu.Item key={href} asChild>
                        <a
                          href={href}
                          className="block px-4 py-2 text-sm outline-none transition-colors"
                          style={{ color: 'var(--text-secondary)' }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--bg-input)';
                            e.currentTarget.style.color = 'var(--text-primary)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = 'var(--text-secondary)';
                          }}
                        >
                          {label}
                        </a>
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
                      className="block w-full cursor-pointer px-4 py-2 text-left text-sm outline-none transition-colors"
                      style={{ color: 'var(--text-secondary)' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--bg-input)';
                        e.currentTarget.style.color = '#ef4444';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                      }}
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
          { href: '/timeline', label: 'Timeline', icon: <><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></> },
          { href: '/moodboard', label: 'Board', icon: <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 3v18" /></> },
        ].map(({ href, label, icon }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <a
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
            </a>
          );
        })}
      </nav>
    </>
  );
}
