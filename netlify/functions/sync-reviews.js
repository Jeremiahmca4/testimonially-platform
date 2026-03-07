const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PLAN_CONFIG = {
  trial:   { reviews: 10,         platforms: ['google'],                    allStars: false },
  starter: { reviews: 20,         platforms: ['google'],                    allStars: true  },
  growth:  { reviews: 100,        platforms: ['google','yelp','facebook'],  allStars: true  },
  pro:     { reviews: Infinity,   platforms: ['google','yelp','facebook'],  allStars: true  },
};

async function getUserPlan(userId) {
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  let { data: plan } = await supabase
    .from('user_plans')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!plan) {
    const { data: newPlan } = await supabase
      .from('user_plans')
      .insert({ user_id: userId, plan: 'trial', syncs_used: 0, period_start: monthStart })
      .select()
      .single();
    plan = newPlan;
  }

  // Reset if new month
  if (new Date(plan.period_start) < new Date(monthStart)) {
    const { data: reset } = await supabase
      .from('user_plans')
      .update({ syncs_used: 0, period_start: monthStart, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .select()
      .single();
    plan = reset;
  }

  return plan;
}

async function fetchOutscraperReviews(url, limit) {
  const encodedUrl = encodeURIComponent(url);
  const response = await fetch(
    `https://api.app.outscraper.com/maps/reviews-v3?query=${encodedUrl}&limit=${Math.min(limit, 50)}&async=false`,
    { headers: { 'X-API-KEY': process.env.OUTSCRAPER_API_KEY } }
  );
  const data = await response.json();
  if (!data.data || !data.data[0]) return [];
  return data.data[0].reviews_data || [];
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };

  try {
    const { restaurantId, userId } = JSON.parse(event.body || '{}');
    if (!restaurantId || !userId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) };
    }

    const plan = await getUserPlan(userId);
    const config = PLAN_CONFIG[plan.plan] || PLAN_CONFIG.trial;

    // Check quota (pro = unlimited)
    if (config.reviews !== Infinity && plan.syncs_used >= config.reviews) {
      return {
        statusCode: 403,
        body: JSON.stringify({
          error: 'quota_exceeded',
          message: `You've reached your ${config.reviews} review limit for this month.`,
          syncs_used: plan.syncs_used,
          syncs_limit: config.reviews,
          plan: plan.plan,
        }),
      };
    }

    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', restaurantId)
      .single();

    if (!restaurant) return { statusCode: 404, body: JSON.stringify({ error: 'Restaurant not found' }) };

    // How many reviews left this month
    const reviewsLeft = config.reviews === Infinity ? 50 : config.reviews - plan.syncs_used;
    let totalSynced = 0;
    let allInserted = [];

    // Fetch from each allowed platform
    for (const platform of config.platforms) {
      const urlMap = {
        google:   restaurant.google_maps_url,
        yelp:     restaurant.yelp_url,
        facebook: restaurant.facebook_url,
      };
      const platformUrl = urlMap[platform];
      if (!platformUrl) continue;

      const raw = await fetchOutscraperReviews(platformUrl, reviewsLeft);
      const formatted = raw
        .filter(r => r.review_text && r.review_rating)
        .map(r => ({
          restaurant_id: restaurantId,
          reviewer_name: r.author_title || 'Anonymous',
          rating:        Math.round(r.review_rating),
          review_text:   r.review_text,
          review_date:   r.review_datetime_utc || null,
          source:        platform,
        }));

      allInserted.push(...formatted);
    }

    // For trial — guarantee at least 1 five-star is included
    if (plan.plan === 'trial') {
      const fiveStars = allInserted.filter(r => r.rating === 5);
      const others    = allInserted.filter(r => r.rating !== 5);
      // Put 5-stars first, cap at 10 total
      allInserted = [...fiveStars, ...others].slice(0, 10);
      // If no 5-stars found at all, still import what we have
    }

    if (allInserted.length > 0) {
      const { error } = await supabase
        .from('reviews')
        .upsert(allInserted, {
          onConflict: 'restaurant_id,reviewer_name,review_text',
          ignoreDuplicates: true,
        });
      if (!error) totalSynced = allInserted.length;
    }

    // Increment usage
    await supabase
      .from('user_plans')
      .update({ syncs_used: plan.syncs_used + totalSynced, updated_at: new Date().toISOString() })
      .eq('user_id', userId);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        synced: totalSynced,
        syncs_used: plan.syncs_used + totalSynced,
        syncs_limit: config.reviews === Infinity ? null : config.reviews,
        plan: plan.plan,
      }),
    };

  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
