/**
 * Testimonially — Google Maps Review Scraper
 * -------------------------------------------
 * Standalone Node.js worker. Completely separate from the Next.js app.
 *
 * Usage:
 *   1. cd scraper
 *   2. npm install
 *   3. npx playwright install chromium
 *   4. cp .env.example .env  (fill in values)
 *   5. node src/index.js
 */

import { chromium }     from 'playwright';
import { createClient } from '@supabase/supabase-js';
import dotenv           from 'dotenv';

dotenv.config();

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  GOOGLE_MAPS_URL,
  RESTAURANT_ID,
} = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !GOOGLE_MAPS_URL || !RESTAURANT_ID) {
  console.error('❌  Missing required environment variables.');
  console.error('    See scraper/.env.example for required keys.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function parseRating(ariaLabel = '') {
  const m = ariaLabel.match(/(\d+(\.\d+)?)/);
  return m ? Math.round(parseFloat(m[1])) : null;
}

async function scrapeReviews(url) {
  console.log('🚀  Launching Chromium...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ' +
      'AppleWebKit/537.36 (KHTML, like Gecko) ' +
      'Chrome/124.0.0.0 Safari/537.36',
    locale: 'en-US',
  });
  const page = await context.newPage();

  try {
    console.log(`📍  Navigating to: ${url}`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await sleep(3500);

    // Click Reviews tab
    try {
      await page.getByRole('tab', { name: /reviews/i }).click({ timeout: 8000 });
      await sleep(2000);
      console.log('✅  Clicked Reviews tab');
    } catch {
      console.log('⚠️   Reviews tab not found — continuing');
    }

    // Sort by Newest
    try {
      await page.locator('[data-value="Sort"]').first().click({ timeout: 6000 });
      await sleep(800);
      await page.getByText('Newest').click({ timeout: 5000 });
      await sleep(2000);
      console.log('✅  Sorted by Newest');
    } catch {
      console.log('⚠️   Could not sort — continuing with default order');
    }

    // Scroll to load reviews
    console.log('📜  Scrolling to load reviews...');
    for (let i = 0; i < 10; i++) {
      try {
        const pane = page.locator('.m6QErb.DxyBCb').first();
        await pane.evaluate((el) => (el.scrollTop += 2000));
      } catch {
        await page.evaluate(() => window.scrollBy(0, 2000));
      }
      await sleep(1100);
    }

    // Expand truncated reviews
    const moreButtons = page.locator('button.w8nwRe');
    const count = await moreButtons.count();
    for (let i = 0; i < count; i++) {
      try { await moreButtons.nth(i).click(); await sleep(150); } catch { /* skip */ }
    }

    // Extract data
    const raw = await page.evaluate(() => {
      const cards = document.querySelectorAll('.jftiEf.fontBodyMedium');
      return Array.from(cards).map((card) => ({
        reviewer_name: card.querySelector('.d4r55.Y5bVob')?.textContent?.trim() || 'Anonymous',
        rating_label:  card.querySelector('.kvMYJc')?.getAttribute('aria-label') || '',
        review_text:   card.querySelector('.wiI7pd')?.textContent?.trim() || '',
        review_date:   card.querySelector('.rsqaWe')?.textContent?.trim() || '',
      }));
    });

    const reviews = raw
      .map((r) => ({
        reviewer_name: r.reviewer_name,
        rating:        parseRating(r.rating_label),
        review_text:   r.review_text,
        review_date:   r.review_date,
        source:        'google',
        restaurant_id: RESTAURANT_ID,
      }))
      .filter((r) => r.rating !== null && r.review_text.length > 5);

    console.log(`📊  Extracted ${reviews.length} valid reviews`);
    return reviews;

  } finally {
    await browser.close();
    console.log('🔒  Browser closed');
  }
}

async function storeReviews(reviews) {
  if (reviews.length === 0) { console.log('⚠️   No reviews to store'); return; }
  console.log(`💾  Upserting ${reviews.length} reviews...`);

  const { error } = await supabase
    .from('reviews')
    .upsert(reviews, { onConflict: 'restaurant_id,reviewer_name,review_text', ignoreDuplicates: true });

  if (error) {
    console.warn('⚠️   Upsert failed, trying insert:', error.message);
    const { error: ie } = await supabase.from('reviews').insert(reviews);
    if (ie) throw new Error(`Supabase insert error: ${ie.message}`);
  }

  console.log('✅  Reviews stored');
}

async function main() {
  console.log('══════════════════════════════════════');
  console.log('  Testimonially Scraper');
  console.log('══════════════════════════════════════');
  try {
    const reviews = await scrapeReviews(GOOGLE_MAPS_URL);
    await storeReviews(reviews);
    console.log('🎉  Done!');
  } catch (err) {
    console.error('❌  Fatal error:', err.message);
    process.exit(1);
  }
  console.log('══════════════════════════════════════');
}

main();
