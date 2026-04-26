// src/app/r/[slug]/page.tsx
//
// SEO landing pages — static, allowlisted, edge-cached.
//
// WHY THIS DESIGN:
// 1. `dynamicParams = false` rejects any slug not in generateStaticParams() with a 404
//    → bots fuzzing /r/best-ac-under-XXX get 404 (cached at edge, ~0 cost)
// 2. `revalidate = 604800` makes Vercel CDN cache the rendered HTML for 7 days
//    → repeat hits to legitimate slugs serve from cache without function invocation
// 3. `generateStaticParams()` pre-builds all 35 landing pages at build time
//    → deploy time = pages exist as static HTML, fastest possible serving

import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'

// ─── ALLOWLIST: every slug here MUST also be in app/sitemap.ts ────────────
// Update both files together when adding new SEO landing pages.
// Anything NOT in this list returns 404, blocking the bot fuzzing pattern.
const ALLOWED_SLUGS = [
  // Air conditioners
  'best-ac-under-30000',
  'best-ac-under-40000',
  'best-ac-under-50000',
  'best-inverter-ac-india',
  'best-star-ac-india',
  'best-ac-for-small-room',
  // Phones
  'best-phone-under-15000',
  'best-phone-under-20000',
  'best-phone-under-30000',
  'best-camera-phone-india',
  'best-battery-phone-india',
  'best-5g-phone-under-20000',
  // Laptops
  'best-laptop-under-40000',
  'best-laptop-under-60000',
  'best-laptop-for-students-india',
  'best-gaming-laptop-india',
  'best-lightweight-laptop-india',
  // Appliances
  'best-washing-machine-india',
  'best-front-load-washing-machine',
  'best-refrigerator-under-30000',
  'best-double-door-fridge-india',
  'best-geyser-india',
  'best-mixer-grinder-india',
  // TVs
  'best-tv-under-30000',
  'best-43-inch-tv-india',
  'best-55-inch-tv-india',
  // Audio + wearables
  'best-tws-earbuds-under-2000',
  'best-wireless-earbuds-india',
  'best-smartwatch-under-5000',
  'best-smartwatch-india',
  // Personal care (decide if you want to keep these — they aren't electronics)
  'best-moisturiser-for-oily-skin-india',
  'best-sunscreen-india',
  'best-shampoo-for-hair-fall-india',
] as const

type AllowedSlug = (typeof ALLOWED_SLUGS)[number]

// ─── STATIC GENERATION ─────────────────────────────────────────────────────
// Tells Next.js: pre-render exactly these pages at build time.
export async function generateStaticParams() {
  return ALLOWED_SLUGS.map(slug => ({ slug }))
}

// ─── REJECT UNKNOWN SLUGS ──────────────────────────────────────────────────
// `false` here is the critical line. Without this, Next.js renders ANY slug
// on demand, which is what was costing you $113/mo in function invocations.
export const dynamicParams = false

// ─── CACHE FOR 7 DAYS AT THE EDGE ──────────────────────────────────────────
// Vercel CDN serves cached HTML; even legitimate bot crawls don't invoke functions.
export const revalidate = 604800   // 7 days in seconds

// ─── HUMAN-READABLE TITLE ──────────────────────────────────────────────────
function slugToTitle(slug: string): string {
  return slug
    .replace(/-/g, ' ')
    .replace(/\bac\b/gi, 'AC')
    .replace(/\btv\b/gi, 'TV')
    .replace(/\b5g\b/gi, '5G')
    .replace(/\btws\b/gi, 'TWS')
    .replace(/\b(\d+)\b/g, '₹$1')
    .replace(/\b\w/g, c => c.toUpperCase())
}

// ─── METADATA (SEO) ────────────────────────────────────────────────────────
export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params
  if (!ALLOWED_SLUGS.includes(slug as AllowedSlug)) {
    return { title: 'Not Found', robots: 'noindex,nofollow' }
  }
  const title = slugToTitle(slug)
  return {
    title: `${title} (AI Rated, Fake Reviews Removed) | ProductRating.in`,
    description: `Find the ${title.toLowerCase()} with AI-adjusted ratings aggregated from Amazon, Flipkart, Croma & more. Fake reviews removed. Real scores, honest recommendations.`,
    alternates: { canonical: `https://www.productrating.in/r/${slug}` },
    openGraph: {
      title: `${title} | ProductRating.in`,
      description: `AI-adjusted ratings for ${title.toLowerCase()}. Fake reviews removed.`,
      url: `https://www.productrating.in/r/${slug}`,
      siteName: 'ProductRating.in',
      type: 'website',
    },
    robots: 'index,follow',
    keywords: `${title}, India, AI ratings, fake review removed, ${title.toLowerCase()} India`,
  }
}

// ─── PAGE COMPONENT ────────────────────────────────────────────────────────
export default async function LandingPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  // Defense in depth — dynamicParams=false should already prevent this,
  // but if anyone misconfigures, we still 404 on unknown slugs.
  if (!ALLOWED_SLUGS.includes(slug as AllowedSlug)) {
    notFound()
  }

  const title = slugToTitle(slug)
  const searchQuery = title.replace(/₹/g, '').replace(/\s+/g, ' ').trim()

  // Pick 3-4 related slugs for internal linking (only from the allowlist).
  // No more linking to /r/best-ac-under-25000 if 25000 isn't in the list.
  const relatedSlugs = ALLOWED_SLUGS
    .filter(s => s !== slug)
    .filter(s => {
      // Match category prefix loosely — e.g. "best-ac-..." links to other "best-ac-..."
      const slugCategory = slug.split('-').slice(0, 2).join('-')
      return s.startsWith(slugCategory)
    })
    .slice(0, 4)

  return (
    <main style={{ maxWidth: 960, margin: '0 auto', padding: 'clamp(80px,8vw,96px) clamp(16px,4vw,20px) 80px', fontFamily: 'Sora,sans-serif' }}>
      <h1 style={{ fontSize: 'clamp(22px,3.5vw,32px)', fontWeight: 800, color: '#111110', lineHeight: 1.15, letterSpacing: '-0.8px', marginBottom: 10 }}>
        {title} (AI Rated, Fake Reviews Removed)
      </h1>

      <div style={{ background: 'rgba(91,79,207,0.05)', border: '1.5px solid rgba(91,79,207,0.2)', borderRadius: 16, padding: 'clamp(24px,4vw,36px)', margin: '32px 0', textAlign: 'center' }}>
        <p style={{ fontSize: 15, color: '#57534E', lineHeight: 1.7, marginBottom: 20 }}>
          Get AI-powered recommendations for <strong style={{ color: '#111110' }}>{title.toLowerCase()}</strong> — fake reviews removed, pros/cons, direct buy links.
        </p>
        <Link
          href={`/search?q=${encodeURIComponent(searchQuery)}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg, #5B4FCF, #7C6FCD)', color: '#fff', fontWeight: 700, fontSize: 15, padding: '13px 28px', borderRadius: 12, textDecoration: 'none', boxShadow: '0 6px 20px rgba(91,79,207,0.3)' }}
        >
          🔍 Get AI Recommendations →
        </Link>
      </div>

      <section style={{ background: '#FFFFFF', border: '1.5px solid rgba(0,0,0,0.07)', borderRadius: 16, padding: 'clamp(24px,4vw,36px)', marginBottom: 32 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#111110', marginBottom: 16 }}>What is the {title.toLowerCase()}?</h2>
        <p style={{ fontSize: 14, color: '#57534E', lineHeight: 1.8, marginBottom: 14 }}>
          Finding the {title.toLowerCase()} in India requires comparing ratings across multiple platforms.
          ProductRating.in aggregates reviews from Amazon.in, Flipkart, Croma, Reliance Digital, and other Indian platforms into a single, honest AI-adjusted score.
        </p>
        <p style={{ fontSize: 14, color: '#57534E', lineHeight: 1.8 }}>
          Our AI removes fake, bot-generated, and incentivised reviews — which account for up to 38% of reviews on major Indian platforms.
        </p>
      </section>

      {relatedSlugs.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111110', marginBottom: 14 }}>Related Searches</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {relatedSlugs.map(s => (
              <Link
                key={s}
                href={`/r/${s}`}
                style={{ padding: '7px 16px', borderRadius: 100, background: '#FFFFFF', border: '1.5px solid rgba(0,0,0,0.08)', color: '#57534E', fontSize: 13, textDecoration: 'none' }}
              >
                {slugToTitle(s)}
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
