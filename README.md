# ProductRating.in — Next.js App

India's AI-powered product intelligence platform.

## Quick Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

## Setup

1. Clone this repo
2. Copy `.env.local.example` to `.env.local`
3. Add your environment variables (see below)
4. Run `npm install && npm run dev`

## Environment Variables

| Variable | Description |
|---|---|
| `WIX_SITE_ID` | Your Wix site ID (already set: `a7e8b2ff-2cba-4df7-a6c2-f802f17ddab1`) |
| `WIX_API_KEY` | Your Wix API key (get from Wix Dashboard → Settings → API Keys) |
| `ANTHROPIC_API_KEY` | Claude API key for AI answers (get from console.anthropic.com) |
| `NEXT_PUBLIC_SITE_URL` | Your live domain: `https://productrating.in` |

## Pages

| Page | URL | SEO |
|---|---|---|
| Homepage | `/` | ✅ Full meta + OG |
| Product Detail | `/products/[slug]` | ✅ Schema.org AggregateRating (Google stars) |
| Category | `/categories/[slug]` | ✅ Keyword-optimized title |
| AI Search | `/search` | ✅ |
| Sitemap | `/sitemap.xml` | ✅ Auto-generated |
| Robots | `/robots.txt` | ✅ Auto-generated |

## Architecture

- **Frontend**: Next.js 14 (App Router, Server Components, ISR)
- **Backend CMS**: Wix (Products, Reviews, Categories, Q&A collections)
- **AI**: Claude API (Anthropic) for product Q&A
- **Hosting**: Vercel (free tier works)
- **Domain**: productrating.in → Vercel

## SEO Features

- Server-side rendered pages (Google crawls everything)
- Auto-generated sitemap.xml from Wix CMS data
- Schema.org structured data on product pages (Google shows ⭐ ratings in search)
- Canonical URLs on every page
- Open Graph + Twitter Card meta tags
- Optimized title tags with Indian keywords
