# Testimonially

> Turn your best Google reviews into marketing assets.

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.local.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY

# 3. Run the app
npm run dev
# → http://localhost:3000
```

---

## Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → paste and run `database/schema.sql`
3. Get your keys from **Project Settings → API**

| Key | Used in |
|-----|---------|
| Project URL | App + Scraper |
| `anon` public key | `.env.local` only |
| `service_role` key | `scraper/.env` only — keep secret |

---

## Run the Scraper

```bash
cd scraper
npm install
npx playwright install chromium
cp .env.example .env
# Fill in all 4 values, then:
node src/index.js
```

**How to get `RESTAURANT_ID`:** Add your restaurant in the app at `/setup`. The UUID appears under the restaurant name.

**How to get `GOOGLE_MAPS_URL`:** Google Maps → your business → Share → Copy link.

---

## Deploy to Vercel

```bash
git init && git add . && git commit -m "init"
git remote add origin https://github.com/YOUR_USER/testimonially-io.git
git push -u origin main
```

In Vercel → New Project → import repo → add env vars:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

→ Deploy.

---

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 14 App Router, Tailwind CSS |
| Auth + DB | Supabase (Postgres + RLS) |
| Scraper | Node.js + Playwright |
| Graphics | HTML5 Canvas |
| Hosting | Vercel |
