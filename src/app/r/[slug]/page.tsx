// src/app/r/[slug]/page.tsx
// SSR for metadata only — results fetched client-side to avoid Sarvam 429 bursts

import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { queryToSlug, slugToQuery, generateMeta, detectCategory, generateRelatedSearches } from '@/lib/seo'
import Link from 'next/link'

export const revalidate = 86400 // 24h — only revalidate metadata, not AI results

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const query = slugToQuery(slug)
  const category = detectCategory(query)
  const meta = generateMeta(query, slug, 3, !!category)
  return {
    title: meta.title,
    description: meta.description,
    alternates: { canonical: meta.canonical },
    robots: meta.shouldIndex ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: { title: meta.title, description: meta.description, url: meta.canonical, siteName: 'ProductRating.in', type: 'website' },
  }
}

// JSON-LD schema — static, no Sarvam call needed
function buildStaticSchema(query: string, slug: string) {
  const canonical = `https://www.productrating.in/r/${slug}`
  return [{
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    'name': `Best ${query} — AI Rated | ProductRating.in`,
    'description': `AI-adjusted product ratings for ${query}. Fake reviews removed. Aggregated from Amazon, Flipkart, and other Indian platforms.`,
    'url': canonical,
  }, {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': [{
      '@type': 'Question',
      'name': `What is the best ${query}?`,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': `ProductRating.in uses AI to analyse thousands of reviews from Amazon, Flipkart, Nykaa and other Indian platforms. Our AI removes fake reviews to show the real score. Search above for the current top 3 recommendations for ${query}.`,
      },
    }, {
      '@type': 'Question',
      'name': 'How does ProductRating calculate scores?',
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': 'ProductRating aggregates reviews from 8+ Indian platforms. Our AI model detects and removes fake, bot-generated, and incentivised reviews. The final PR Score reflects genuine buyer experience.',
      },
    }],
  }]
}

export default async function ResultPage({ params }: Props) {
  const { slug } = await params
  const query = slugToQuery(slug)
  if (!query || query.length < 3) notFound()

  const category = detectCategory(query)
  const meta = generateMeta(query, slug, 3, !!category)
  const related = generateRelatedSearches(query, category)
  const schemas = buildStaticSchema(query, slug)
  const qCapital = query.charAt(0).toUpperCase() + query.slice(1)

  return (
    <>
      {schemas.map((schema, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      ))}

      <Nav />

      <main style={{ maxWidth: 960, margin: '0 auto', padding: 'clamp(80px,8vw,96px) clamp(16px,4vw,20px) 80px', fontFamily: 'Sora,sans-serif' }}>

        {/* Breadcrumb */}
        <nav style={{ fontSize: 12, color: '#A8A29E', marginBottom: 20, display: 'flex', gap: 6, flexWrap: 'wrap', fontFamily: 'Geist Mono, monospace' }}>
          <Link href="/" style={{ color: '#78716C' }}>Home</Link>
          <span>›</span>
          {category && <><Link href={`/r/${queryToSlug(category)}`} style={{ color: '#78716C' }}>{category}</Link><span>›</span></>}
          <span style={{ color: '#57534E' }}>{qCapital}</span>
        </nav>

        {/* H1 */}
        <h1 style={{ fontFamily: 'Sora,sans-serif', fontSize: 'clamp(22px,3.5vw,32px)', fontWeight: 800, color: '#111110', lineHeight: 1.15, letterSpacing: '-0.8px', marginBottom: 10 }}>
          {meta.h1}
        </h1>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 32, fontSize: 12, color: '#A8A29E', fontFamily: 'Geist Mono, monospace' }}>
          <span>🤖 AI-adjusted ratings</span>
          <span>· 🕵️ Fake reviews removed</span>
          <span>· 📦 8+ Indian platforms</span>
        </div>

        {/* CTA to search — the actual AI results */}
        <div style={{ background: 'rgba(91,79,207,0.05)', border: '1.5px solid rgba(91,79,207,0.2)', borderRadius: 16, padding: 'clamp(24px,4vw,36px)', marginBottom: 40, textAlign: 'center' }}>
          <p style={{ fontSize: 15, color: '#57534E', lineHeight: 1.7, marginBottom: 20 }}>
            Get AI-powered recommendations for <strong style={{ color: '#111110' }}>{query}</strong> — with fake reviews removed, pros/cons, and direct buy links.
          </p>
          <Link href={`/search?q=${encodeURIComponent(query)}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg, #5B4FCF, #7C6FCD)', color: '#fff', fontWeight: 700, fontSize: 15, padding: '13px 28px', borderRadius: 12, textDecoration: 'none', boxShadow: '0 6px 20px rgba(91,79,207,0.3)' }}>
            🔍 Get AI Recommendations →
          </Link>
          <p style={{ marginTop: 12, fontSize: 12, color: '#A8A29E', fontFamily: 'Geist Mono, monospace' }}>
            Free · No ads · Sarvam AI · 22 Indian languages
          </p>
        </div>

        {/* SEO content block */}
        <section style={{ background: '#FFFFFF', border: '1.5px solid rgba(0,0,0,0.07)', borderRadius: 16, padding: 'clamp(24px,4vw,36px)', marginBottom: 32, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <h2 style={{ fontFamily: 'Sora,sans-serif', fontSize: 20, fontWeight: 800, color: '#111110', marginBottom: 16 }}>
            What is the best {query}?
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p style={{ fontSize: 14, color: '#57534E', lineHeight: 1.8 }}>
              Finding the best {query} in India requires comparing ratings across multiple platforms. ProductRating.in aggregates reviews from Amazon.in, Flipkart, Nykaa, Croma, Reliance Digital, and other Indian platforms into a single, honest AI-adjusted score.
            </p>
            <p style={{ fontSize: 14, color: '#57534E', lineHeight: 1.8 }}>
              Our AI removes fake, bot-generated, and incentivised reviews — which account for up to 38% of reviews on major Indian platforms. The ProductRating (PR) Score reflects real buyer experience, not inflated ratings.
            </p>
            <p style={{ fontSize: 14, color: '#57534E', lineHeight: 1.8 }}>
              When choosing the best {query}, key factors include after-sales service availability in India, energy efficiency, long-term reliability, and value for money for Indian market conditions.
            </p>
          </div>

          <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10 }}>
            {[
              { icon: '🔗', title: 'Aggregated', desc: 'Amazon, Flipkart & 6 more' },
              { icon: '🕵️', title: 'Fake-removed', desc: 'AI detects paid reviews' },
              { icon: '📊', title: 'One honest score', desc: 'Weighted & reliable' },
            ].map(f => (
              <div key={f.title} style={{ background: '#F9F8F7', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ fontSize: 20, marginBottom: 6 }}>{f.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#111110', marginBottom: 3 }}>{f.title}</div>
                <div style={{ fontSize: 12, color: '#78716C' }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Related searches — crawlable links for SEO */}
        {related.length > 0 && (
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontFamily: 'Sora,sans-serif', fontSize: 16, fontWeight: 700, color: '#111110', marginBottom: 14 }}>Related Searches</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {related.slice(0, 8).map((r, i) => (
                <Link key={i} href={`/r/${queryToSlug(r)}`}
                  style={{ padding: '7px 16px', borderRadius: 100, background: '#FFFFFF', border: '1.5px solid rgba(0,0,0,0.08)', color: '#57534E', fontSize: 13, fontWeight: 400, textDecoration: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', transition: 'all .15s' }}>
                  {r}
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </>
  )
}
