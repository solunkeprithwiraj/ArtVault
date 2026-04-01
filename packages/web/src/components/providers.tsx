'use client';

import { ReactNode, useEffect } from 'react';
import { ThemeProvider } from './theme-provider';
import { ToastProvider } from './toast';
import { CommandPalette } from './command-palette';

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  return (
    <ThemeProvider>
      <ToastProvider>
        {children}
        <CommandPalette />
      </ToastProvider>
    </ThemeProvider>
  );
}
