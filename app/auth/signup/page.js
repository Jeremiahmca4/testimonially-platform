'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '../../../lib/supabase/client';

export default function SignupPage() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const router   = useRouter();
  const supabase = createClient();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else if (data?.session) {
      window.location.replace('/dashboard');
    } else {
      // Email confirmation is on — show check inbox message
      setLoading(false);
      setError('Please check your email to confirm your account before signing in.');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--surface)' }}>
      <div className="w-full max-w-sm">
        <Link href="/" className="flex items-center gap-2 mb-10">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
            style={{ background: 'linear-gradient(135deg, #b8922a, #F0C040)' }}>R</div>
          <span className="font-semibold text-stone-900" style={{ fontFamily: 'var(--font-display)' }}>Revora.io</span>
        </Link>

        <h1 className="text-2xl font-semibold mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)' }}>Create your account</h1>
        <p className="text-sm mb-8" style={{ color: 'var(--ink-muted)' }}>Start turning reviews into revenue — free.</p>

        {error && <div className="alert-error mb-5">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="field-label">Email</label>
            <input type="email" className="field-input" placeholder="you@business.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="field-label">Password</label>
            <input type="password" className="field-input" placeholder="Min. 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
          </div>
          <button type="submit" className="btn-primary w-full py-3 text-base mt-1" disabled={loading}>
            {loading ? 'Creating account…' : 'Create account →'}
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: 'var(--ink-muted)' }}>
          Already have an account?{' '}
          <Link href="/auth/login" className="font-semibold" style={{ color: 'var(--amber)' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
