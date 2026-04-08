'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, setToken } from '@/lib/api';
import { useToast } from '@/components/toast';
import { PasswordInput } from '@/components/password-input';

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast('Passwords do not match', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const { token } = await api.auth.signup(username, password, email || undefined);
      setToken(token);
      router.push('/');
    } catch (err: any) {
      toast(err.message || 'Signup failed', 'error');
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full rounded-lg border border-themed bg-themed-input px-4 py-3 text-themed placeholder:text-themed-muted focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]';

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-sm">
        <h1 className="mb-2 text-center text-3xl font-bold text-themed">
          Art<span className="accent-text">Vault</span>
        </h1>
        <p className="mb-8 text-center text-sm text-themed-secondary">
          Create your account
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            required
            minLength={3}
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={inputClass}
            autoFocus
            autoComplete="username"
          />
          <input
            type="email"
            placeholder="Email (optional)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            autoComplete="email"
          />
          <PasswordInput
            value={password}
            onChange={setPassword}
            placeholder="Password (min 6 characters)"
            required
            minLength={6}
            autoComplete="new-password"
          />
          <PasswordInput
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="Confirm password"
            required
            minLength={6}
            autoComplete="new-password"
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg accent-bg py-3 font-semibold text-white accent-bg-hover disabled:opacity-50"
          >
            {submitting ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-themed-secondary">
          Already have an account?{' '}
          <Link href="/login" className="accent-text font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
