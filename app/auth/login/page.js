'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '../../../lib/supabase/client';

export default function LoginPage() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const supabase = createClient();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      // Use replace to do a full server round-trip so middleware sees the session cookie
      window.location.replace('/dashboard');
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--surface)' }}>
      <div className="hidden lg:flex w-[45%] flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(155deg, #0a0a0a 0%, #141210 100%)' }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 70% 60% at 20% 80%, rgba(201,168,76,0.18) 0%, transparent 70%)' }} />
        <Link href="/" className="flex items-center gap-2.5 relative z-10">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
            style={{ background: 'linear-gradient(135deg, #b8922a, #F0C040)' }}>R</div>
          <span className="text-white font-semibold" style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem' }}>Revora.io</span>
        </Link>
        <div className="relative z-10">
          <blockquote className="text-white/90 text-xl leading-relaxed mb-6 italic" style={{ fontFamily: 'var(--font-display)' }}>
            "Our Instagram engagement tripled once we started posting Revora graphics."
          </blockquote>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm"
              style={{ background: 'rgba(201,168,76,0.25)' }}>S</div>
            <div>
              <p className="text-white text-sm font-medium">Sofia Reyes</p>
              <p className="text-white/40 text-xs">Owner, Casa Verde</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <Link href="/" className="flex lg:hidden items-center gap-2 mb-8">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
              style={{ background: 'linear-gradient(135deg, #b8922a, #F0C040)' }}>R</div>
            <span className="font-semibold text-stone-900" style={{ fontFamily: 'var(--font-display)' }}>Revora.io</span>
          </Link>
          <h1 className="text-2xl font-semibold mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)' }}>Welcome back</h1>
          <p className="text-sm mb-8" style={{ color: 'var(--ink-muted)' }}>Sign in to your account</p>
          {error && <div className="alert-error mb-5">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="field-label">Email</label>
              <input type="email" className="field-input" placeholder="you@business.com"
                value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="field-label">Password</label>
              <input type="password" className="field-input" placeholder="••••••••"
                value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <button type="submit" className="btn-primary w-full py-3 text-base mt-1" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in →'}
            </button>
          </form>
          <p className="text-center text-sm mt-6" style={{ color: 'var(--ink-muted)' }}>
            No account?{' '}
            <Link href="/auth/signup" className="font-semibold" style={{ color: 'var(--amber)' }}>Sign up free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
