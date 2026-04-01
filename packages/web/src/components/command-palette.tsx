'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useToast } from './toast';

interface Command {
  id: string;
  label: string;
  category: string;
  action: () => void;
  shortcut?: string;
}

export function CommandPalette() {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: Command[] = useMemo(
    () => [
      // Navigation
      { id: 'nav-gallery', label: 'Go to Gallery', category: 'Navigate', action: () => router.push('/'), shortcut: '' },
      { id: 'nav-collections', label: 'Go to Collections', category: 'Navigate', action: () => router.push('/collections') },
      { id: 'nav-add', label: 'Add New Piece', category: 'Navigate', action: () => router.push('/add'), shortcut: 'n' },
      { id: 'nav-dashboard', label: 'Go to Dashboard', category: 'Navigate', action: () => router.push('/dashboard') },
      { id: 'nav-timeline', label: 'Go to Timeline', category: 'Navigate', action: () => router.push('/timeline') },
      { id: 'nav-compare', label: 'Go to Compare', category: 'Navigate', action: () => router.push('/compare') },
      { id: 'nav-moodboard', label: 'Go to Mood Board', category: 'Navigate', action: () => router.push('/moodboard') },
      { id: 'nav-clipper', label: 'Web Clipper Setup', category: 'Navigate', action: () => router.push('/clipper') },
      // Actions
      {
        id: 'act-random',
        label: 'Surprise Me (Random Piece)',
        category: 'Action',
        action: async () => {
          const piece = await api.artPieces.random();
          if (piece) router.push(`/edit/${piece.id}`);
          else toast('No pieces yet', 'info');
        },
      },
      {
        id: 'act-check-links',
        label: 'Check for Broken Links',
        category: 'Action',
        action: async () => {
          toast('Checking links...', 'info');
          const result = await api.artPieces.checkLinks();
          toast(`${result.broken} broken out of ${result.total}`, result.broken > 0 ? 'error' : 'success');
        },
      },
      // Theme
      {
        id: 'theme-toggle',
        label: 'Toggle Dark/Light Theme',
        category: 'Settings',
        action: () => {
          document.documentElement.classList.toggle('light');
          const theme = document.documentElement.classList.contains('light') ? 'light' : 'dark';
          localStorage.setItem('artvault_theme', theme);
        },
      },
    ],
    [router, toast],
  );

  const filtered = query
    ? commands.filter(
        (c) =>
          c.label.toLowerCase().includes(query.toLowerCase()) ||
          c.category.toLowerCase().includes(query.toLowerCase()),
      )
    : commands;

  // Open/close with Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
        setQuery('');
        setSelectedIndex(0);
      }
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  // Keyboard nav inside palette
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      filtered[selectedIndex].action();
      setOpen(false);
    }
  };

  if (!open) return null;

  let lastCategory = '';

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center pt-[15vh]" onClick={() => setOpen(false)}>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-lg overflow-hidden rounded-xl border border-themed bg-themed-card shadow-2xl animate-lightbox-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-themed px-4 py-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-themed-muted">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command..."
            className="flex-1 bg-transparent text-themed placeholder:text-themed-muted focus:outline-none"
          />
          <kbd className="rounded border border-themed bg-themed-input px-1.5 py-0.5 text-[10px] text-themed-muted">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-[50vh] overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-themed-muted">No commands found</p>
          ) : (
            filtered.map((cmd, i) => {
              const showCategory = cmd.category !== lastCategory;
              lastCategory = cmd.category;
              return (
                <div key={cmd.id}>
                  {showCategory && (
                    <p className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-themed-muted">
                      {cmd.category}
                    </p>
                  )}
                  <button
                    onClick={() => { cmd.action(); setOpen(false); }}
                    onMouseEnter={() => setSelectedIndex(i)}
                    className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors ${
                      i === selectedIndex ? 'bg-themed-input text-themed' : 'text-themed-secondary'
                    }`}
                  >
                    <span>{cmd.label}</span>
                    {cmd.shortcut && (
                      <kbd className="rounded border border-themed bg-themed-input px-1.5 py-0.5 text-[10px] text-themed-muted">
                        {cmd.shortcut}
                      </kbd>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-themed px-4 py-2 text-[10px] text-themed-muted">
          <span className="mr-3"><kbd className="rounded border border-themed px-1 py-0.5">&#8593;&#8595;</kbd> navigate</span>
          <span className="mr-3"><kbd className="rounded border border-themed px-1 py-0.5">&#9166;</kbd> select</span>
          <span><kbd className="rounded border border-themed px-1 py-0.5">esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
