'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '../../lib/supabase/client';
import Stars from '../../components/ui/Stars';

const SOURCE_CONFIG = {
  google:   { label: 'Google',   color: '#4285F4', bg: 'rgba(66,133,244,0.1)'  },
  yelp:     { label: 'Yelp',     color: '#d32323', bg: 'rgba(211,34,35,0.1)'   },
  facebook: { label: 'Facebook', color: '#1877F2', bg: 'rgba(24,119,242,0.1)'  },
};

export default function AnalyticsPage() {
  const [reviews,    setReviews]    = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [selected,   setSelected]   = useState('all');
  const [loading,    setLoading]    = useState(true);
  const supabase = createClient();

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { data: biz }  = await supabase.from('restaurants').select('*').order('name');
    const { data: revs } = await supabase
      .from('reviews')
      .select('*, restaurants!inner(user_id)')
      .eq('restaurants.user_id', user.id)
      .order('created_at', { ascending: false });
    setBusinesses(biz || []);
    setReviews(revs || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = selected === 'all'
    ? reviews
    : reviews.filter(r => r.restaurant_id === selected);

  // Stats
  const avgRating = filtered.length
    ? (filtered.reduce((s, r) => s + r.rating, 0) / filtered.length).toFixed(1)
    : '—';

  const byPlatform = filtered.reduce((acc, r) => {
    acc[r.source] = (acc[r.source] || 0) + 1;
    return acc;
  }, {});

  const byRating = [5,4,3,2,1].map(star => ({
    star,
    count: filtered.filter(r => r.rating === star).length,
    pct: filtered.length ? Math.round((filtered.filter(r => r.rating === star).length / filtered.length) * 100) : 0,
  }));

  // Volume by month (last 6 months)
  const monthlyData = (() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('default', { month: 'short' });
      const count = filtered.filter(r => {
        const rd = new Date(r.created_at);
        return rd.getFullYear() === d.getFullYear() && rd.getMonth() === d.getMonth();
      }).length;
      months.push({ key, label, count });
    }
    return months;
  })();

  const maxMonthly = Math.max(...monthlyData.map(m => m.count), 1);
  const recent = filtered.slice(0, 5);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-sm" style={{ color: 'var(--ink-muted)' }}>Loading analytics…</div>
    </div>
  );

  return (
    <div>
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="page-eyebrow">Insights</p>
          <h1 className="page-title">Analytics</h1>
        </div>
        {businesses.length > 1 && (
          <select
            className="field-input w-auto text-sm"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            style={{ maxWidth: '220px' }}>
            <option value="all">All businesses</option>
            {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="font-semibold mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)' }}>No reviews yet</h3>
          <p className="text-sm" style={{ color: 'var(--ink-muted)' }}>Sync your first reviews from the Setup page to see analytics.</p>
        </div>
      ) : (
        <div className="space-y-6">

          {/* Top stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total reviews',   value: filtered.length,                   icon: '★' },
              { label: 'Average rating',  value: `${avgRating} / 5`,               icon: '◈' },
              { label: 'Five-star',       value: `${byRating[0].pct}%`,            icon: '🏆' },
              { label: 'Platforms',       value: Object.keys(byPlatform).length,    icon: '🔗' },
            ].map(s => (
              <div key={s.label} className="card p-5">
                <span className="text-xl block mb-2">{s.icon}</span>
                <p className="text-2xl font-bold mb-0.5" style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)' }}>{s.value}</p>
                <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>{s.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Volume by month */}
            <div className="card p-6">
              <h3 className="font-semibold mb-5" style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--ink)' }}>
                Review volume — last 6 months
              </h3>
              <div className="flex items-end gap-2 h-32">
                {monthlyData.map(m => (
                  <div key={m.key} className="flex-1 flex flex-col items-center gap-1.5">
                    <span className="text-xs font-semibold" style={{ color: 'var(--ink-muted)' }}>{m.count || ''}</span>
                    <div className="w-full rounded-t-md transition-all duration-500"
                      style={{
                        height: `${Math.max(4, (m.count / maxMonthly) * 96)}px`,
                        background: m.count > 0 ? 'linear-gradient(180deg, #F0C040, #b8922a)' : 'var(--surface-alt)',
                      }} />
                    <span className="text-xs" style={{ color: 'var(--ink-muted)' }}>{m.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Rating breakdown */}
            <div className="card p-6">
              <h3 className="font-semibold mb-5" style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--ink)' }}>
                Rating breakdown
              </h3>
              <div className="space-y-3">
                {byRating.map(({ star, count, pct }) => (
                  <div key={star} className="flex items-center gap-3">
                    <span className="text-sm font-medium w-4 flex-shrink-0" style={{ color: 'var(--ink)' }}>{star}</span>
                    <span className="text-amber-400 text-sm flex-shrink-0">★</span>
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface-alt)' }}>
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: star >= 4 ? 'linear-gradient(90deg, #b8922a, #F0C040)' : star === 3 ? '#f59e0b' : '#ef4444' }} />
                    </div>
                    <span className="text-xs w-8 text-right flex-shrink-0" style={{ color: 'var(--ink-muted)' }}>{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Platform breakdown */}
            <div className="card p-6">
              <h3 className="font-semibold mb-5" style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--ink)' }}>
                Reviews by platform
              </h3>
              {Object.keys(byPlatform).length === 0 ? (
                <p className="text-sm" style={{ color: 'var(--ink-muted)' }}>No platform data yet.</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(byPlatform).map(([platform, count]) => {
                    const cfg = SOURCE_CONFIG[platform] || { label: platform, color: '#888', bg: '#eee' };
                    const pct = Math.round((count / filtered.length) * 100);
                    return (
                      <div key={platform} className="flex items-center gap-3">
                        <span className="text-xs font-semibold w-16 flex-shrink-0" style={{ color: cfg.color }}>{cfg.label}</span>
                        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface-alt)' }}>
                          <div className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${pct}%`, background: cfg.color }} />
                        </div>
                        <span className="text-xs w-8 text-right flex-shrink-0" style={{ color: 'var(--ink-muted)' }}>{count}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recent reviews feed */}
            <div className="card p-6">
              <h3 className="font-semibold mb-5" style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--ink)' }}>
                Most recent reviews
              </h3>
              <div className="space-y-4">
                {recent.map(r => {
                  const cfg = SOURCE_CONFIG[r.source] || SOURCE_CONFIG.google;
                  return (
                    <div key={r.id} className="pb-4 last:pb-0" style={{ borderBottom: '1px solid var(--border)' }}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                            style={{ background: cfg.color, fontSize: '8px' }}>
                            {cfg.label[0]}
                          </span>
                          <span className="text-sm font-medium" style={{ color: 'var(--ink)' }}>{r.reviewer_name}</span>
                        </div>
                        <Stars rating={r.rating} size="sm" />
                      </div>
                      <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--ink-muted)' }}>{r.review_text}</p>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
