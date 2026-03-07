'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '../../lib/supabase/client';
import ReviewCard from '../../components/ui/ReviewCard';

export default function ReviewsPage() {
  const [reviews,      setReviews]      = useState([]);
  const [savedIds,     setSavedIds]     = useState(new Set());
  const [restaurants,  setRestaurants]  = useState([]);
  const [filterRest,   setFilterRest]   = useState('all');
  const [filterRating, setFilterRating] = useState(0);
  const [loading,      setLoading]      = useState(true);
  const supabase = createClient();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    const { data: rests } = await supabase.from('restaurants').select('*').order('name');
    setRestaurants(rests || []);

    const { data: revs } = await supabase
      .from('reviews')
      .select('*, restaurants!inner(user_id)')
      .eq('restaurants.user_id', user.id)
      .order('created_at', { ascending: false });
    setReviews(revs || []);

    const { data: saved } = await supabase.from('testimonials').select('review_id');
    setSavedIds(new Set((saved || []).map((s) => s.review_id)));

    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function handleSave(review) {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('testimonials').insert({
      review_id:     review.id,
      restaurant_id: review.restaurant_id,
      user_id:       user.id,
    });
    if (!error) setSavedIds((prev) => new Set([...prev, review.id]));
  }

  const filtered = reviews
    .filter((r) => filterRest   === 'all' || r.restaurant_id === filterRest)
    .filter((r) => filterRating === 0     || r.rating        === filterRating);

  return (
    <div className="animate-fade-up">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="page-eyebrow">Your collection</p>
          <h1 className="page-title">Reviews</h1>
        </div>
        <span className="badge badge-stone mt-2 flex-shrink-0">{filtered.length} reviews</span>
      </div>

      <div className="flex flex-wrap gap-2.5 mb-7">
        <select
          className="field-input py-2 w-auto min-w-44 text-sm"
          value={filterRest}
          onChange={(e) => setFilterRest(e.target.value)}
        >
          <option value="all">All restaurants</option>
          {restaurants.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>

        <div className="flex items-center gap-1.5">
          {[0, 5, 4, 3, 2].map((n) => (
            <button
              key={n}
              onClick={() => setFilterRating(n)}
              className="px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150"
              style={{
                background: filterRating === n ? 'var(--ember-soft)' : 'white',
                color:      filterRating === n ? 'var(--ember)'      : 'var(--ink-muted)',
                border:     '1px solid var(--border-mid)',
              }}
            >
              {n === 0 ? 'All ★' : `${n}★`}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-44 w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-14 text-center">
          <div className="text-4xl mb-4">⭐</div>
          <h3 className="font-semibold mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)' }}>
            No reviews yet
          </h3>
          <p className="text-sm max-w-xs mx-auto" style={{ color: 'var(--ink-muted)' }}>
            Set up your restaurant and run the scraper to import Google reviews.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onSave={handleSave}
              isSaved={savedIds.has(review.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
