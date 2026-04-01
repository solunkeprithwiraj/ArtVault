'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, setToken } from '@/lib/api';
import { useToast } from '@/components/toast';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { token } = await api.auth.login(password);
      setToken(token);
      router.push('/');
    } catch {
      toast('Invalid password', 'error');
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-sm">
        <h1 className="mb-2 text-center text-3xl font-bold text-themed">
          Art<span className="accent-text">Vault</span>
        </h1>
        <p className="mb-8 text-center text-sm text-themed-secondary">
          Enter your password to continue
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            required
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-themed bg-themed-input px-4 py-3 text-themed placeholder:text-themed-muted focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            autoFocus
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg accent-bg py-3 font-semibold text-white accent-bg-hover disabled:opacity-50"
          >
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
