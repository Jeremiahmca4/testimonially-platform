'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '../../lib/supabase/client';
import Stars from '../../components/ui/Stars';
import TestimonialGenerator from '../../components/ui/TestimonialGenerator';

export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState([]);
  const [restaurants,  setRestaurants]  = useState({});
  const [loading,      setLoading]      = useState(true);
  const [generating,   setGenerating]   = useState(null);
  const supabase = createClient();

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    const { data: rests } = await supabase.from('restaurants').select('*');
    setRestaurants(Object.fromEntries((rests || []).map((r) => [r.id, r])));

    const { data } = await supabase
      .from('testimonials')
      .select('*, reviews(*)')
      .eq('user_id', user.id)
      .order('saved_at', { ascending: false });

    setTestimonials(data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleRemove(id) {
    await supabase.from('testimonials').delete().eq('id', id);
    setTestimonials((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <div className="animate-fade-up">
      {generating && (
        <TestimonialGenerator
          testimonial={generating.reviews}
          restaurant={restaurants[generating.restaurant_id]}
          onClose={() => setGenerating(null)}
        />
      )}

      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="page-eyebrow">Your saved picks</p>
          <h1 className="page-title">Testimonial Library</h1>
        </div>
        <span className="badge badge-stone mt-2 flex-shrink-0">{testimonials.length} saved</span>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton h-52 w-full" />)}
        </div>
      ) : testimonials.length === 0 ? (
        <div className="card p-14 text-center">
          <div className="text-4xl mb-4">🖼</div>
          <h3 className="font-semibold mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)' }}>
            No testimonials yet
          </h3>
          <p className="text-sm max-w-xs mx-auto" style={{ color: 'var(--ink-muted)' }}>
            Go to Reviews and click "Save as testimonial" on your best ones.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {testimonials.map((t) => {
            const review     = t.reviews;
            const restaurant = restaurants[t.restaurant_id];
            if (!review) return null;
            return (
              <div key={t.id} className="card p-6 flex flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0"
                      style={{ background: 'var(--ember-soft)', color: 'var(--ember)' }}
                    >
                      {review.reviewer_name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: 'var(--ink)' }}>
                        {review.reviewer_name}
                      </p>
                      {restaurant && (
                        <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                          {restaurant.name}
                        </p>
                      )}
                    </div>
                  </div>
                  <Stars rating={review.rating} size="sm" />
                </div>

                <p className="text-sm leading-relaxed line-clamp-3" style={{ color: 'var(--ink-muted)' }}>
                  {review.review_text}
                </p>

                <div className="flex items-center gap-2 pt-1">
                  <button onClick={() => setGenerating(t)} className="btn-primary text-xs px-4 py-2">
                    🖼 Generate graphic
                  </button>
                  <button
                    onClick={() => handleRemove(t.id)}
                    className="btn-ghost text-xs text-red-400 hover:text-red-600 hover:bg-red-50"
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
