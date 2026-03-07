'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '../../lib/supabase/client';

const PLAN_CONFIG = {
  trial:   { reviews: 10,  platforms: ['google'], label: 'Free Trial', color: '#6b7280' },
  starter: { reviews: 20,  platforms: ['google'], label: 'Starter',    color: '#b8922a' },
  growth:  { reviews: 100, platforms: ['google','yelp','facebook'], label: 'Growth', color: '#7c3aed' },
  pro:     { reviews: null, platforms: ['google','yelp','facebook'], label: 'Pro',   color: '#0891b2' },
};

const ALL_PLATFORMS = [
  { key: 'google_maps_url', platform: 'google',   label: 'Google Maps URL',  placeholder: 'https://www.google.com/maps/place/...', hint: 'Google Maps → your business → Share → Copy link', color: '#4285F4' },
  { key: 'yelp_url',        platform: 'yelp',     label: 'Yelp URL',         placeholder: 'https://www.yelp.com/biz/...',           hint: 'From your Yelp business page URL',               color: '#d32323' },
  { key: 'facebook_url',    platform: 'facebook', label: 'Facebook Page URL', placeholder: 'https://www.facebook.com/yourbusiness', hint: 'Your Facebook business page URL',                color: '#1877F2' },
];

export default function SetupPage() {
  const [name,        setName]        = useState('');
  const [googleUrl,   setGoogleUrl]   = useState('');
  const [yelpUrl,     setYelpUrl]     = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [restaurants, setRestaurants] = useState([]);
  const [userPlan,    setUserPlan]    = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');
  const [success,     setSuccess]     = useState(false);
  const [syncState,   setSyncState]   = useState({});
  const [showHowTo,   setShowHowTo]   = useState(false);
  const supabase = createClient();

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const [{ data: restaurants }, { data: plan }] = await Promise.all([
      supabase.from('restaurants').select('*').order('created_at', { ascending: false }),
      supabase.from('user_plans').select('*').eq('user_id', user.id).single(),
    ]);
    setRestaurants(restaurants || []);
    setUserPlan(plan);
  }, [supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const planConfig = userPlan ? PLAN_CONFIG[userPlan.plan] || PLAN_CONFIG.trial : PLAN_CONFIG.trial;
  const allowedPlatforms = planConfig.platforms;
  const visiblePlatforms = ALL_PLATFORMS.filter(p => allowedPlatforms.includes(p.platform));

  const syncsUsed  = userPlan?.syncs_used || 0;
  const syncsTotal = planConfig.reviews;
  const syncsLeft  = syncsTotal ? Math.max(0, syncsTotal - syncsUsed) : null;
  const progressPct = syncsTotal ? Math.min(100, (syncsUsed / syncsTotal) * 100) : 0;
  const isTrial = userPlan?.plan === 'trial' || !userPlan;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!googleUrl && !yelpUrl && !facebookUrl) {
      setError('Add your Google Maps URL to get started.');
      return;
    }
    setLoading(true);
    setError('');
    const { data: { user } } = await supabase.auth.getUser();
    const { data: newBiz, error: insertError } = await supabase
      .from('restaurants')
      .insert({
        user_id: user.id,
        name,
        google_maps_url: googleUrl || null,
        yelp_url: allowedPlatforms.includes('yelp') ? (yelpUrl || null) : null,
        facebook_url: allowedPlatforms.includes('facebook') ? (facebookUrl || null) : null,
      })
      .select().single();

    if (insertError) {
      setError(insertError.message);
    } else {
      setSuccess(true);
      setName(''); setGoogleUrl(''); setYelpUrl(''); setFacebookUrl('');
      fetchData();
      setTimeout(() => setSuccess(false), 5000);
      if (newBiz) triggerSync(newBiz);
    }
    setLoading(false);
  }

  async function triggerSync(restaurant) {
    setSyncState(prev => ({ ...prev, [restaurant.id]: 'syncing' }));
    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantId: restaurant.id }),
      });
      const data = await res.json();
      if (res.status === 403) {
        setSyncState(prev => ({ ...prev, [restaurant.id]: 'quota' }));
      } else if (data.success) {
        setSyncState(prev => ({ ...prev, [restaurant.id]: `done:${data.synced}` }));
        fetchData();
      } else {
        const msg = data.error || 'unknown error';
        setSyncState(prev => ({ ...prev, [restaurant.id]: `error:${msg}` }));
        console.error('Sync error detail:', data);
      }
    } catch {
      setSyncState(prev => ({ ...prev, [restaurant.id]: 'error' }));
    }
    setTimeout(() => setSyncState(prev => ({ ...prev, [restaurant.id]: null })), 6000);
  }

  async function handleDelete(id) {
    if (!confirm('Remove this business and all its review data?')) return;
    await supabase.from('restaurants').delete().eq('id', id);
    fetchData();
  }

  function getSyncLabel(id) {
    const s = syncState[id];
    if (!s) return '↻ Sync reviews';
    if (s === 'syncing') return '⏳ Syncing…';
    if (s === 'quota')   return '✗ Monthly limit reached';
    if (s === 'error')   return '✗ Sync failed — try again';
    if (s?.startsWith('error:')) return `✗ ${s.slice(6).substring(0, 40)}`;
    if (s?.startsWith('done:')) return `✓ Synced ${s.split(':')[1]} reviews`;
    return '↻ Sync reviews';
  }

  function getSyncStyle(id) {
    const s = syncState[id];
    if (s === 'syncing') return { background: 'rgba(0,0,0,0.05)', color: 'var(--ink-muted)', cursor: 'wait' };
    if (s === 'quota' || s === 'error' || s?.startsWith('error:')) return { background: 'rgba(239,68,68,0.08)', color: '#dc2626' };
    if (s?.startsWith('done:')) return { background: 'rgba(16,185,129,0.1)', color: '#065f46' };
    return { background: 'var(--ember-soft)', color: 'var(--ember)' };
  }

  return (
    <div>
      {/* Trial banner */}
      {isTrial && (
        <div className="rounded-xl px-5 py-4 mb-7 flex items-center justify-between gap-4 flex-wrap"
          style={{ background: 'linear-gradient(135deg, rgba(201,168,76,0.12), rgba(184,146,42,0.08))', border: '1px solid rgba(201,168,76,0.25)' }}>
          <div className="flex items-center gap-3">
            <span className="text-lg">🎯</span>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>You're on the Free Trial</p>
              <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                {syncsLeft !== null
                  ? `${syncsLeft} review import${syncsLeft === 1 ? '' : 's'} remaining · Google only · Includes at least 1 five-star review`
                  : 'Google only · Includes at least 1 five-star review'}
              </p>
            </div>
          </div>
          <a href="mailto:hello@revora.io?subject=Upgrade my Revora plan"
            className="btn-primary text-xs px-4 py-2 flex-shrink-0">
            Upgrade →
          </a>
        </div>
      )}

      {/* Plan usage bar (non-trial) */}
      {!isTrial && syncsTotal && (
        <div className="card px-5 py-4 mb-7 flex items-center gap-5">
          <div className="flex-1">
            <div className="flex justify-between mb-1.5">
              <span className="text-xs font-semibold" style={{ color: 'var(--ink)' }}>{planConfig.label} — monthly reviews</span>
              <span className="text-xs" style={{ color: 'var(--ink-muted)' }}>{syncsUsed} / {syncsTotal} used</span>
            </div>
            <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-alt)' }}>
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%`, background: progressPct >= 90 ? '#ef4444' : 'linear-gradient(90deg, #b8922a, #F0C040)' }} />
            </div>
          </div>
          <span className="text-xs flex-shrink-0" style={{ color: syncsLeft === 0 ? '#ef4444' : 'var(--ink-muted)' }}>
            {syncsLeft === 0 ? 'Limit reached' : `${syncsLeft} remaining`}
          </span>
        </div>
      )}

      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="page-eyebrow">Configuration</p>
          <h1 className="page-title">Business Setup</h1>
        </div>
        <button onClick={() => setShowHowTo(true)}
          className="btn-secondary text-sm gap-1.5">
          <span>?</span> How it works
        </button>
      </div>

      {/* How it works panel */}
      {showHowTo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowHowTo(false)}>
          <div className="card p-8 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-lg" style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)' }}>How Revora works</h3>
              <button onClick={() => setShowHowTo(false)} className="btn-ghost text-lg leading-none">×</button>
            </div>
            <div className="space-y-5">
              {[
                { icon: '🏢', title: 'Add your business',  body: 'Enter your business name and paste your Google Maps review URL.' },
                { icon: '🔄', title: 'Automatic sync',     body: 'Revora pulls in your reviews automatically. Click "Sync reviews" anytime to refresh.' },
                { icon: '★',  title: 'Save testimonials',  body: 'Find a great review? Save it to your testimonial library in one click.' },
                { icon: '🖼', title: 'Generate graphics',  body: 'Turn saved testimonials into branded 800×800 social media images ready to post.' },
                { icon: '📊', title: 'Track performance',  body: 'See your average rating, review volume, and platform breakdown in Analytics.' },
              ].map(s => (
                <div key={s.title} className="flex gap-4">
                  <span className="text-xl flex-shrink-0 mt-0.5">{s.icon}</span>
                  <div>
                    <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--ink)' }}>{s.title}</p>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-muted)' }}>{s.body}</p>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setShowHowTo(false)} className="btn-primary w-full mt-6 py-2.5">Got it</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-7">
        {/* Form */}
        <div className="lg:col-span-3 card p-8">
          <h2 className="font-semibold mb-1" style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: 'var(--ink)' }}>
            Add a business
          </h2>
          <p className="text-sm mb-7" style={{ color: 'var(--ink-muted)' }}>
            {isTrial || userPlan?.plan === 'starter'
              ? 'Connect your Google Maps profile to start importing reviews.'
              : 'Connect your review profiles across all platforms.'}
          </p>

          {error   && <div className="alert-error   mb-5">{error}</div>}
          {success && <div className="alert-success mb-5">✓ Business added! Pulling in your reviews now — check the Reviews tab in a moment.</div>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="field-label">Business name</label>
              <input className="field-input" placeholder="e.g. The Golden Bowl"
                value={name} onChange={(e) => setName(e.target.value)} required />
            </div>

            <div className="space-y-5">
              {visiblePlatforms.map((p) => {
                const val = p.platform === 'google' ? googleUrl : p.platform === 'yelp' ? yelpUrl : facebookUrl;
                const setter = p.platform === 'google' ? setGoogleUrl : p.platform === 'yelp' ? setYelpUrl : setFacebookUrl;
                return (
                  <div key={p.key}>
                    <label className="flex items-center gap-2 field-label mb-1.5">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
                      {p.label}
                    </label>
                    <input className="field-input" placeholder={p.placeholder}
                      value={val} onChange={(e) => setter(e.target.value)} />
                    <p className="text-xs mt-1" style={{ color: 'var(--ink-muted)' }}>{p.hint}</p>
                  </div>
                );
              })}
            </div>

            <button type="submit" className="btn-primary w-full py-3 text-base" disabled={loading}>
              {loading ? 'Saving…' : 'Add business →'}
            </button>
          </form>
        </div>

        {/* Business list */}
        <div className="lg:col-span-2">
          {restaurants.length > 0 ? (
            <div className="card p-6">
              <h3 className="font-semibold mb-4" style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--ink)' }}>
                Your businesses
              </h3>
              <div className="space-y-3">
                {restaurants.map((r) => (
                  <div key={r.id} className="rounded-xl p-4" style={{ background: 'var(--surface-alt)', border: '1px solid var(--border)' }}>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                          style={{ background: 'var(--ember-soft)' }}>🏢</div>
                        <p className="font-semibold text-sm truncate" style={{ color: 'var(--ink)' }}>{r.name}</p>
                      </div>
                      <button onClick={() => handleDelete(r.id)}
                        className="text-xs flex-shrink-0 transition-colors"
                        style={{ color: 'var(--ink-muted)' }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--ink-muted)'}>
                        Remove
                      </button>
                    </div>
                    <div className="flex gap-1.5 flex-wrap mb-3">
                      {r.google_maps_url && <span className="text-xs px-2 py-0.5 rounded-md font-medium" style={{ background: 'rgba(66,133,244,0.1)', color: '#4285F4' }}>Google</span>}
                      {r.yelp_url        && <span className="text-xs px-2 py-0.5 rounded-md font-medium" style={{ background: 'rgba(211,34,35,0.1)', color: '#d32323' }}>Yelp</span>}
                      {r.facebook_url    && <span className="text-xs px-2 py-0.5 rounded-md font-medium" style={{ background: 'rgba(24,119,242,0.1)', color: '#1877F2' }}>Facebook</span>}
                    </div>
                    <button
                      onClick={() => triggerSync(r)}
                      disabled={syncState[r.id] === 'syncing' || syncsLeft === 0}
                      className="w-full text-xs font-semibold py-2 rounded-lg transition-all duration-150"
                      style={getSyncStyle(r.id)}>
                      {getSyncLabel(r.id)}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="card p-8 text-center" style={{ border: '2px dashed var(--border)' }}>
              <div className="text-3xl mb-3">🏢</div>
              <p className="text-sm font-semibold mb-1" style={{ color: 'var(--ink)' }}>No businesses yet</p>
              <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>Add your first business to start importing reviews.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
