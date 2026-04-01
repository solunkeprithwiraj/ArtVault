'use client';

import { ReactNode } from 'react';
import { ThemeProvider } from './theme-provider';
import { ToastProvider } from './toast';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>{children}</ToastProvider>
    </ThemeProvider>
  );
}
