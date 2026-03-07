import { createClient } from '../../lib/supabase/server';
import Link from 'next/link';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: businesses } = await supabase.from('restaurants').select('*').order('created_at', { ascending: false });
  const { count: reviewCount } = await supabase.from('reviews').select('id', { count: 'exact', head: true });
  const { count: testimonialCount } = await supabase.from('testimonials').select('id', { count: 'exact', head: true });
  const { data: sourceCounts } = await supabase.from('reviews').select('source');
  const bySource = (sourceCounts || []).reduce((acc, r) => { acc[r.source] = (acc[r.source] || 0) + 1; return acc; }, {});

  const stats = [
    { label: 'Businesses',   value: businesses?.length ?? 0, icon: '🏢' },
    { label: 'Reviews',      value: reviewCount      ?? 0,   icon: '★'  },
    { label: 'Testimonials', value: testimonialCount ?? 0,   icon: '🖼'  },
  ];

  const sources = [
    { key: 'google',   label: 'Google',   color: '#4285F4', symbol: 'G' },
    { key: 'yelp',     label: 'Yelp',     color: '#d32323', symbol: '★' },
    { key: 'facebook', label: 'Facebook', color: '#1877F2', symbol: 'f' },
  ];

  return (
    <div className="animate-fade-up">
      <div className="mb-10">
        <p className="page-eyebrow">Overview</p>
        <h1 className="page-title">Dashboard</h1>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="card p-6">
            <span className="text-2xl block mb-3">{s.icon}</span>
            <p className="text-3xl font-bold mb-0.5" style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)' }}>{s.value}</p>
            <p className="text-sm" style={{ color: 'var(--ink-muted)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {reviewCount > 0 && (
        <div className="card p-6 mb-8">
          <h2 className="font-semibold mb-4" style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--ink)' }}>Reviews by platform</h2>
          <div className="flex gap-3 flex-wrap">
            {sources.map((s) => (
              <div key={s.key} className="flex items-center gap-2 px-4 py-2 rounded-xl"
                style={{ background: `${s.color}11`, border: `1px solid ${s.color}22` }}>
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                  style={{ background: s.color, fontSize: '9px' }}>{s.symbol}</span>
                <span className="text-sm font-medium" style={{ color: 'var(--ink)' }}>{s.label}</span>
                <span className="text-sm font-bold" style={{ color: s.color }}>{bySource[s.key] || 0}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card p-7 mb-8">
        <h2 className="font-semibold mb-4" style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--ink)' }}>Quick actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/setup" className="btn-primary text-sm">+ Add business</Link>
          <Link href="/reviews" className="btn-secondary text-sm">View reviews</Link>
          <Link href="/testimonials" className="btn-secondary text-sm">My testimonials</Link>
        </div>
      </div>

      {businesses && businesses.length > 0 ? (
        <div>
          <h2 className="font-semibold mb-4" style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--ink)' }}>Your businesses</h2>
          <div className="space-y-3">
            {businesses.map((b) => (
              <div key={b.id} className="card p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0" style={{ background: 'var(--ember-soft)' }}>🏢</div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: 'var(--ink)' }}>{b.name}</p>
                    <div className="flex gap-1.5 mt-0.5">
                      {b.google_maps_url && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(66,133,244,0.1)', color: '#4285F4' }}>G</span>}
                      {b.yelp_url && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(211,34,35,0.1)', color: '#d32323' }}>★</span>}
                      {b.facebook_url && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(24,119,242,0.1)', color: '#1877F2' }}>f</span>}
                    </div>
                  </div>
                </div>
                <Link href="/reviews" className="btn-ghost text-xs flex-shrink-0">Reviews →</Link>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="card p-14 text-center">
          <div className="text-4xl mb-4">🏢</div>
          <h3 className="font-semibold mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)' }}>Set up your first business</h3>
          <p className="text-sm mb-6 max-w-xs mx-auto" style={{ color: 'var(--ink-muted)' }}>Add your business and review profile URLs to start monitoring Google, Yelp, and Facebook reviews.</p>
          <Link href="/setup" className="btn-primary">Get started →</Link>
        </div>
      )}
    </div>
  );
}
