// src/app/r/[slug]/page.tsx — SSR SEO result page

import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { queryToSlug, slugToQuery, generateMeta, detectCategory, generateRelatedSearches } from '@/lib/seo'
import { runSearch, type AiProduct } from '@/lib/search'
import Link from 'next/link'

// Revalidate every 6 hours — cache high-value pages
export const revalidate = 21600

type Props = { params: Promise<{ slug: string }> }

// Generate metadata for Google
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
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: meta.canonical,
      siteName: 'ProductRating.in',
      type: 'website',
    },
  }
}

// Build JSON-LD structured data
function buildSchema(query: string, products: AiProduct[], slug: string) {
  const canonical = `https://www.productrating.in/r/${slug}`
  const productSchemas = products.map((p, i) => ({
    '@type': 'Product',
    'name': p.name,
    'offers': {
      '@type': 'Offer',
      'price': p.price.replace(/[₹,]/g, ''),
      'priceCurrency': 'INR',
      'availability': 'https://schema.org/InStock',
    },
    'aggregateRating': {
      '@type': 'AggregateRating',
      'ratingValue': p.rating.toFixed(1),
      'bestRating': '5',
      'worstRating': '1',
      'ratingCount': p.reviews?.replace(/[^0-9]/g, '') || '100',
      'description': 'AI-adjusted rating — fake reviews removed, aggregated from Amazon, Flipkart, and other Indian platforms',
    },
    'brand': { '@type': 'Brand', 'name': p.seller },
  }))

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    'name': `Best ${query} — AI Rated`,
    'description': `AI-adjusted product ratings for ${query}. Fake reviews removed. Aggregated from multiple Indian platforms.`,
    'url': canonical,
    'numberOfItems': products.length,
    'itemListElement': products.map((p, i) => ({
      '@type': 'ListItem',
      'position': i + 1,
      'name': p.name,
      'url': canonical,
    })),
  }

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': [
      {
        '@type': 'Question',
        'name': `What is the best ${query}?`,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': `Based on AI-adjusted ratings from multiple Indian platforms, the top pick for ${query} is ${products[0]?.name || 'shown above'}. Our AI removes fake reviews to show real product quality.`,
        },
      },
      {
        '@type': 'Question',
        'name': 'How does ProductRating calculate scores?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'ProductRating aggregates reviews from Amazon, Flipkart, Nykaa, and other Indian platforms. Our AI model detects and removes fake, bot-generated, and incentivised reviews. The final score reflects genuine buyer experience.',
        },
      },
    ],
  }

  return [itemListSchema, faqSchema, ...productSchemas]
}

// Seller → direct platform URL
function getDirectUrl(seller: string, name: string): string {
  const q = encodeURIComponent(name), s = (seller || '').toLowerCase().trim()
  const known: [string[], (q: string) => string][] = [
    [['amazon'], q => `https://www.amazon.in/s?k=${q}`],
    [['flipkart'], q => `https://www.flipkart.com/search?q=${q}`],
    [['nykaa'], q => `https://www.nykaa.com/search/result/?q=${q}`],
    [['meesho'], q => `https://www.meesho.com/search?q=${q}`],
    [['croma'], q => `https://www.croma.com/searchB?q=${q}`],
    [['jiomart'], q => `https://www.jiomart.com/search/${q}`],
    [['myntra'], q => `https://www.myntra.com/${q}`],
    [['tata cliq', 'tatacliq'], q => `https://www.tatacliq.com/search/?searchCategory=all&text=${q}`],
    [['reliance digital', 'reliancedigital'], q => `https://www.reliancedigital.in/search?q=${q}`],
    [['bigbasket'], q => `https://www.bigbasket.com/ps/?q=${q}`],
    [['ajio'], q => `https://www.ajio.com/search/?text=${q}`],
    [['1mg', 'tata 1mg'], q => `https://www.1mg.com/search/all?name=${q}`],
    [['decathlon'], q => `https://www.decathlon.in/search?Ntt=${q}`],
  ]
  for (const [keys, fn] of known) if (keys.some(k => s.includes(k))) return fn(q)
  const dm = s.match(/([a-z0-9][a-z0-9-]*\.[a-z]{2,})/)
  if (dm) return `https://www.${dm[1]}/search?q=${q}`
  return `https://www.amazon.in/s?k=${q}`
}

export default async function ResultPage({ params }: Props) {
  const { slug } = await params
  const query = slugToQuery(slug)
  if (!query || query.length < 3) notFound()

  const apiKey = process.env.SARVAM_API_KEY || ''
  if (!apiKey) return <div style={{ padding: 40 }}>Configuration error.</div>

  const result = await runSearch(query, '', '', apiKey)
  const category = detectCategory(query)
  const meta = generateMeta(query, slug, result.aiProducts.length, !!category)
  const related = generateRelatedSearches(query, category)
  const schemas = buildSchema(query, result.aiProducts, slug)
  const medals = ['🥇', '🥈', '🥉']
  const rankColors = ['#2563EB', '#6B7280', '#B45309']
  const qCapital = query.charAt(0).toUpperCase() + query.slice(1)

  return (
    <>
      {/* JSON-LD schemas */}
      {schemas.map((schema, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      ))}

      <Nav />

      <main style={{ maxWidth: 960, margin: '0 auto', padding: 'clamp(72px,8vw,88px) clamp(16px,4vw,20px) 80px', fontFamily: 'Inter,sans-serif' }}>

        {/* Breadcrumb */}
        <nav style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 16, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <Link href="/" style={{ color: '#6B7280' }}>Home</Link>
          <span>›</span>
          {category && <><Link href={`/r/${queryToSlug(category)}`} style={{ color: '#6B7280' }}>{category}</Link><span>›</span></>}
          <span style={{ color: '#374151' }}>{qCapital}</span>
        </nav>

        {/* H1 */}
        <h1 style={{ fontFamily: 'Plus Jakarta Sans,sans-serif', fontSize: 'clamp(20px,3vw,28px)', fontWeight: 800, color: '#111827', lineHeight: 1.2, letterSpacing: '-0.5px', marginBottom: 8 }}>
          {meta.h1}
        </h1>
        <p style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 28, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <span>🤖 AI-adjusted ratings</span>
          <span>·</span>
          <span>🕵️ Fake reviews removed</span>
          <span>·</span>
          <span>📦 Aggregated from 8+ Indian platforms</span>
        </p>

        {/* AI Answer block */}
        <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 12, padding: '16px 20px', marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 18 }}>🤖</span>
            <span style={{ fontSize: 12, color: '#2563EB', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>AI Analysis · Sarvam AI · India&apos;s LLM</span>
          </div>
          <p style={{ color: '#1E3A5F', lineHeight: 1.75, margin: 0, fontSize: 15 }}>{result.answer}</p>
        </div>

        {/* Top 3 Product Cards */}
        {result.aiProducts.length > 0 && (
          <section style={{ marginBottom: 40 }}>
            <h2 style={{ fontFamily: 'Plus Jakarta Sans,sans-serif', fontSize: 20, fontWeight: 800, color: '#111827', marginBottom: 16 }}>
              Top 3 — {qCapital}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,300px),1fr))', gap: 16 }}>
              {result.aiProducts.map((p, i) => {
                const platRating = Math.min(5, p.platform_rating)
                const aiRating = Math.min(5, Math.max(1, p.rating))
                const buyUrl = getDirectUrl(p.seller, p.name)
                return (
                  <article key={i} style={{ background: '#fff', border: `1px solid ${i === 0 ? '#BFDBFE' : '#E5E7EB'}`, borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: i === 0 ? '0 4px 20px rgba(37,99,235,0.1)' : '0 1px 3px rgba(0,0,0,0.06)' }}>
                    <div style={{ background: rankColors[i], padding: '7px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '.5px' }}>#{i + 1} {i === 0 ? 'Best Pick' : i === 1 ? 'Runner Up' : '3rd Pick'}</span>
                      <span style={{ fontSize: 18 }}>{medals[i]}</span>
                    </div>
                    <div style={{ padding: 20, flex: 1 }}>
                      {p.badge && <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 600, color: '#10B981', background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 100, padding: '2px 10px', marginBottom: 10 }}>● {p.badge}</span>}
                      <h3 style={{ fontFamily: 'Plus Jakarta Sans,sans-serif', fontWeight: 700, fontSize: 16, color: '#111827', lineHeight: 1.35, marginBottom: 10 }}>{p.name}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 24, fontWeight: 800, color: '#2563EB' }}>{p.price}</span>
                        {p.seller && <span style={{ fontSize: 12, color: '#6B7280', background: '#F3F4F6', borderRadius: 6, padding: '2px 8px', fontWeight: 500 }}>{p.seller}</span>}
                      </div>
                      {/* AI Score vs Platform */}
                      <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 10, padding: '14px 16px', marginBottom: 14 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 }}>
                              ProductRating AI Score {p.reviews && <span style={{ textTransform: 'none', letterSpacing: 0, color: '#9CA3AF', fontWeight: 400 }}>({p.reviews} reviews)</span>}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                              <span style={{ fontSize: 32, fontWeight: 900, color: '#10B981', lineHeight: 1 }}>{aiRating.toFixed(1)}</span>
                              <span style={{ fontSize: 14, color: '#9CA3AF' }}>/ 5</span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 2 }}>
                            {[1, 2, 3, 4, 5].map(n => <svg key={n} width="16" height="16" viewBox="0 0 24 24" fill={n <= Math.round(aiRating) ? '#10B981' : '#E5E7EB'}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>)}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#fff', borderRadius: 8, border: '1px solid #F3F4F6' }}>
                          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 13, color: '#6B7280' }}>Platform:</span>
                            <span style={{ fontSize: 15, fontWeight: 700, color: '#EF4444' }}>{platRating.toFixed(1)} ⭐</span>
                            <span style={{ fontSize: 11, color: '#9CA3AF' }}>(with fakes)</span>
                          </div>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 13, color: '#6B7280' }}>Real:</span>
                            <span style={{ fontSize: 15, fontWeight: 700, color: '#10B981' }}>{aiRating.toFixed(1)} ⭐</span>
                            <span style={{ fontSize: 11, color: '#9CA3AF' }}>(AI-adjusted)</span>
                          </div>
                        </div>
                      </div>
                      {p.reason && <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, marginBottom: 12 }}>{p.reason}</p>}
                      {(p.pros.length > 0 || p.cons.length > 0 || p.avoid_if) && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {p.pros.length > 0 && <div style={{ background: '#F0FDF4', borderRadius: 8, padding: '10px 12px' }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>👍 Pros</div>
                            {p.pros.map((pro, j) => <div key={j} style={{ fontSize: 13, color: '#374151', display: 'flex', gap: 6, marginBottom: j < p.pros.length - 1 ? 4 : 0 }}><span style={{ color: '#10B981', flexShrink: 0 }}>✓</span>{pro}</div>)}
                          </div>}
                          {p.cons.length > 0 && <div style={{ background: '#FEF2F2', borderRadius: 8, padding: '10px 12px' }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#DC2626', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>👎 Cons</div>
                            {p.cons.map((con, j) => <div key={j} style={{ fontSize: 13, color: '#374151', display: 'flex', gap: 6 }}><span style={{ color: '#EF4444', flexShrink: 0 }}>✗</span>{con}</div>)}
                          </div>}
                          {p.avoid_if && <div style={{ background: '#FFFBEB', borderRadius: 8, padding: '10px 12px' }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#D97706', textTransform: 'uppercase', letterSpacing: '.5px' }}>⚠️ Avoid if </span>
                            <span style={{ fontSize: 13, color: '#374151' }}>{p.avoid_if}</span>
                          </div>}
                        </div>
                      )}
                    </div>
                    <a href={buyUrl} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px 20px', background: '#2563EB', color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
                      Search on {p.seller || 'Amazon'}
                    </a>
                  </article>
                )
              })}
            </div>
          </section>
        )}

        {/* ── SEO CONTENT BLOCK ── */}
        <section style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 12, padding: 'clamp(20px,4vw,32px)', marginBottom: 36 }}>
          <h2 style={{ fontFamily: 'Plus Jakarta Sans,sans-serif', fontSize: 20, fontWeight: 800, color: '#111827', marginBottom: 16 }}>
            What is the best {query}?
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.75 }}>
              Finding the best {query} in India can be overwhelming when every platform shows different ratings. ProductRating.in solves this by aggregating reviews from Amazon.in, Flipkart, Nykaa, Croma, Reliance Digital, and other Indian platforms into a single, honest AI-adjusted score.
            </p>
            <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.75 }}>
              Our AI model analyses thousands of reviews and filters out fake, bot-generated, and incentivised reviews — which account for up to 38% of reviews on major Indian platforms. The score you see above is the real quality of the product, not inflated by paid or fake reviews.
            </p>
            <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.75 }}>
              When choosing the best {query}, key factors include long-term reliability, after-sales service availability across India, energy efficiency (especially important given India&apos;s power infrastructure), and value for money in the Indian market context.
            </p>
          </div>
          {/* How it works */}
          <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12 }}>
            {[
              { icon: '🔗', title: 'Aggregated from 8+ platforms', desc: 'Amazon, Flipkart, Nykaa, Croma & more' },
              { icon: '🕵️', title: 'Fake reviews removed', desc: 'AI detects bot & incentivised reviews' },
              { icon: '📊', title: 'One honest AI score', desc: 'Weighted, recency-adjusted, reliable' },
            ].map(f => (
              <div key={f.title} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: '14px 16px' }}>
                <div style={{ fontSize: 20, marginBottom: 6 }}>{f.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 4 }}>{f.title}</div>
                <div style={{ fontSize: 12, color: '#6B7280' }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Related Searches */}
        {(related.length > 0 || result.relatedSearches.length > 0) && (
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontFamily: 'Plus Jakarta Sans,sans-serif', fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 12 }}>Related Searches</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {[...related, ...result.relatedSearches].slice(0, 8).map((r, i) => (
                <Link key={i} href={`/r/${queryToSlug(r)}`}
                  style={{ padding: '7px 14px', borderRadius: 100, background: '#F9FAFB', border: '1px solid #E5E7EB', color: '#374151', fontSize: 13, fontWeight: 500, textDecoration: 'none', transition: 'all .15s' }}>
                  {r}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* CTA to search */}
        <div style={{ textAlign: 'center', padding: '24px 0', borderTop: '1px solid #E5E7EB' }}>
          <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 12 }}>Want personalised recommendations? Ask in your language.</p>
          <Link href={`/search?q=${encodeURIComponent(query)}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#2563EB', color: '#fff', fontWeight: 700, fontSize: 14, padding: '12px 24px', borderRadius: 10, textDecoration: 'none' }}>
            🎙️ Ask AI with voice search →
          </Link>
        </div>
      </main>

      <Footer />
    </>
  )
}
