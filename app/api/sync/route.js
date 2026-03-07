import { createClient } from '../../../lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const PLAN_CONFIG = {
  trial:   { reviews: 10,       platforms: ['google'], allStars: false },
  starter: { reviews: 20,       platforms: ['google'], allStars: true  },
  growth:  { reviews: 100,      platforms: ['google','yelp','facebook'], allStars: true },
  pro:     { reviews: Infinity, platforms: ['google','yelp','facebook'], allStars: true },
};

export async function POST(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { restaurantId } = await request.json();

    // Use service role for writes
    const admin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Verify restaurant belongs to user
    const { data: restaurant } = await supabase
      .from('restaurants').select('*')
      .eq('id', restaurantId).eq('user_id', user.id).single();
    if (!restaurant) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Get or create user plan — fully null-safe
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    let { data: plan } = await admin.from('user_plans').select('*').eq('user_id', user.id).maybeSingle();

    if (!plan) {
      await admin.from('user_plans').upsert(
        { user_id: user.id, plan: 'trial', syncs_used: 0, period_start: monthStart },
        { onConflict: 'user_id' }
      );
      const { data: np } = await admin.from('user_plans').select('*').eq('user_id', user.id).maybeSingle();
      plan = np;
    }

    // Hard fallback if DB still returns nothing
    if (!plan) {
      plan = { plan: 'trial', syncs_used: 0, period_start: monthStart };
    }

    // Reset monthly counter if new month
    if (plan.period_start && new Date(plan.period_start) < new Date(monthStart)) {
      await admin.from('user_plans')
        .update({ syncs_used: 0, period_start: monthStart, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);
      plan.syncs_used = 0;
      plan.period_start = monthStart;
    }

    const config = PLAN_CONFIG[plan.plan] || PLAN_CONFIG.trial;

    // Check quota
    if (config.reviews !== Infinity && plan.syncs_used >= config.reviews) {
      return NextResponse.json({
        error: 'quota_exceeded',
        message: `You've used all ${config.reviews} reviews for this month.`,
        syncs_used: plan.syncs_used,
        syncs_limit: config.reviews,
        plan: plan.plan,
      }, { status: 403 });
    }

    const reviewsLeft = config.reviews === Infinity ? 50 : config.reviews - plan.syncs_used;
    let allReviews = [];

    // Fetch from each allowed platform
    for (const platform of config.platforms) {
      const urlMap = { google: restaurant.google_maps_url, yelp: restaurant.yelp_url, facebook: restaurant.facebook_url };
      const platformUrl = urlMap[platform];
      if (!platformUrl) continue;

      try {
        const encodedUrl = encodeURIComponent(platformUrl);
        const res = await fetch(
          `https://api.app.outscraper.com/maps/reviews-v3?query=${encodedUrl}&limit=${Math.min(reviewsLeft, 50)}&sort=newest&async=false`,
          { headers: { 'X-API-KEY': process.env.OUTSCRAPER_API_KEY } }
        );
        const data = await res.json();
        const reviews = data?.data?.[0]?.reviews_data || [];

        // Sort newest first
        reviews.sort((a, b) => {
          const da = a.review_datetime_utc ? new Date(a.review_datetime_utc) : new Date(0);
          const db = b.review_datetime_utc ? new Date(b.review_datetime_utc) : new Date(0);
          return db - da;
        });

        const formatted = reviews
          .filter(r => {
            // Must have text and rating
            if (!r.review_text || !r.review_rating) return false;
            // Must be at least 2 sentences or 40 chars (meaningful review)
            const text = r.review_text.trim();
            const hasTwoSentences = (text.match(/[.!?]+/g) || []).length >= 2;
            const isLongEnough = text.length >= 40;
            if (!hasTwoSentences && !isLongEnough) return false;
            // Must have a full name (first + last = at least 2 words, not all caps)
            const name = (r.author_title || '').trim();
            const words = name.split(/\s+/).filter(Boolean);
            if (words.length < 2) return false;
            // Skip ALL CAPS names (usually fake/spam)
            if (name === name.toUpperCase() && name.length > 3) return false;
            return true;
          })
          .map(r => ({
            restaurant_id: restaurantId,
            reviewer_name: r.author_title,
            rating: Math.round(r.review_rating),
            review_text: r.review_text,
            review_date: r.review_datetime_utc || null,
            source: platform,
          }));
        allReviews.push(...formatted);
      } catch (e) {
        console.error(`Failed to fetch ${platform}:`, e.message);
      }
    }

    // Trial: guarantee at least 1 five-star first
    if (plan.plan === 'trial') {
      const fiveStars = allReviews.filter(r => r.rating === 5);
      const others    = allReviews.filter(r => r.rating !== 5);
      allReviews = [...fiveStars, ...others].slice(0, 10);
    }

    let totalSynced = 0;
    if (allReviews.length > 0) {
      // Try upsert (requires unique constraint on restaurant_id,reviewer_name,review_text)
      const { error } = await admin.from('reviews').upsert(allReviews, {
        onConflict: 'restaurant_id,reviewer_name,review_text',
        ignoreDuplicates: true,
      });
      if (error) {
        // Unique constraint missing — insert individually, skip duplicates
        let count = 0;
        for (const review of allReviews) {
          const { error: e } = await admin.from('reviews').insert(review);
          if (!e) count++;
        }
        totalSynced = count;
      } else {
        totalSynced = allReviews.length;
      }
    }

    // Update usage count
    await admin.from('user_plans')
      .update({ syncs_used: plan.syncs_used + totalSynced, updated_at: new Date().toISOString() })
      .eq('user_id', user.id);

    return NextResponse.json({
      success: true,
      synced: totalSynced,
      syncs_used: plan.syncs_used + totalSynced,
      syncs_limit: config.reviews === Infinity ? null : config.reviews,
      plan: plan.plan,
    });

  } catch (err) {
    console.error('SYNC ERROR:', err);
    return NextResponse.json({ error: err.message, stack: err.stack?.split('\n').slice(0,3).join(' | ') }, { status: 500 });
  }
}
