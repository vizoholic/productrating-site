import { getProductBySlug, getReviewsByProductId, getAllProductSlugs } from '@/lib/wix'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

export async function generateStaticParams() {
  const slugs = await getAllProductSlugs()
  return slugs.map(slug => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) return { title: 'Product Not Found' }
  return {
    title: `${product.name} Review & Rating — Is It Worth Buying in India? | ProductRating.in`,
    description: `${product.name} gets a ${product.aggregatedScore}/5 ProductRating Score. Read ${product.totalReviews?.toLocaleString('en-IN')} reviews from Flipkart, Amazon & more. ${product.verdictBadge === 'Buy Now' ? 'Our verdict: Buy Now.' : `Our verdict: ${product.verdictBadge}.`}`,
    openGraph: {
      title: `${product.name} — ProductRating.in`,
      description: `AI-powered rating: ${product.aggregatedScore}/5 from ${product.totalReviews?.toLocaleString('en-IN')} Indian reviews`,
      images: product.image ? [{ url: product.image }] : [],
    },
    alternates: { canonical: `https://productrating.in/products/${product.slug}` },
  }
}

const VERDICT_STYLE: Record<string, { bg: string; border: string; color: string }> = {
  'Buy Now':    { bg: 'rgba(0,230,118,0.1)',  border: 'rgba(0,230,118,0.3)',  color: 'var(--green)' },
  'Consider':   { bg: 'rgba(255,200,0,0.1)',  border: 'rgba(255,200,0,0.3)',  color: '#FFC800' },
  'Wait':       { bg: 'rgba(255,60,0,0.1)',   border: 'rgba(255,60,0,0.3)',   color: '#FF5733' },
  'Must Watch': { bg: 'rgba(0,230,118,0.1)',  border: 'rgba(0,230,118,0.3)',  color: 'var(--green)' },
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) notFound()

  const reviews = await getReviewsByProductId(product._id)
  const verdict = VERDICT_STYLE[product.verdictBadge] || VERDICT_STYLE['Consider']

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    brand: { '@type': 'Brand', name: product.brand },
    description: product.description,
    image: product.image,
    offers: product.priceMin ? {
      '@type': 'AggregateOffer',
      lowPrice: product.priceMin,
      highPrice: product.priceMax,
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
    } : undefined,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: product.aggregatedScore,
      reviewCount: product.totalReviews || 1,
      bestRating: 5,
      worstRating: 1,
    },
    review: reviews.slice(0, 3).map(r => ({
      '@type': 'Review',
      author: { '@type': 'Person', name: r.reviewerName },
      reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5, worstRating: 1 },
      reviewBody: r.body,
      datePublished: new Date().toISOString().split('T')[0],
    })),
  }

  const PLATFORMS = [
    { key: 'flipkartScore', label: 'Flipkart', color: '#FF6B00' },
    { key: 'amazonScore', label: 'Amazon', color: '#FF9900' },
    { key: 'meeshoScore', label: 'Meesho', color: '#8B5CF6' },
    { key: 'nykaaScore', label: 'Nykaa', color: '#FC2779' },
  ]

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <Nav />
      <main style={{ paddingTop: 80, minHeight: '100vh' }}>
        <section style={{ padding: '60px 48px', background: 'var(--bg2)', borderBottom: '1px solid var(--border)' }}>
          <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: 'var(--text-muted)', marginBottom: 24 }}>
              <a href="/" style={{ color: 'var(--text-muted)' }}>Home</a> / <a href={`/categories/${product.category}`} style={{ color: 'var(--text-muted)' }}>{product.category}</a> / {product.name}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'start' }}>
              <div>
                <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--saffron)', marginBottom: 12 }}>{product.brand}</div>
                <h1 style={{ fontFamily: 'Syne,sans-serif', fontSize: 'clamp(28px,3vw,44px)', fontWeight: 800, letterSpacing: '-1px', lineHeight: 1.1, marginBottom: 20 }}>{product.name}</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
                  <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 72, fontWeight: 800, letterSpacing: '-3px', color: 'var(--green)', lineHeight: 1 }}>
                    {product.aggregatedScore?.toFixed(1)}
                  </div>
                  <div>
                    <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>PR Score</div>
                    <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 4 }}>{product.totalReviews?.toLocaleString('en-IN')} reviews analysed</div>
                    <div style={{ display: 'inline-block', marginTop: 8, fontFamily: 'JetBrains Mono,monospace', fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', padding: '5px 12px', borderRadius: 100, background: verdict.bg, border: `1px solid ${verdict.border}`, color: verdict.color }}>{product.verdictBadge}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {PLATFORMS.map(p => {
                    const score = (product as any)[p.key]
                    if (!score) return null
                    return (
                      <div key={p.key} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: 'var(--text-muted)', width: 70 }}>{p.label}</span>
                        <div style={{ flex: 1, background: 'var(--surface2)', borderRadius: 100, height: 6, overflow: 'hidden' }}>
                          <div style={{ width: `${(score / 5) * 100}%`, height: '100%', background: p.color, borderRadius: 100 }} />
                        </div>
                        <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 12, fontWeight: 600, color: 'var(--text)', width: 30, textAlign: 'right' }}>{score.toFixed(1)}</span>
                      </div>
                    )
                  })}
                </div>
                {product.priceMin && (
                  <div style={{ marginTop: 24, padding: '16px 20px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12 }}>
                    <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Price Range</div>
                    <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 24, fontWeight: 800 }}>₹{product.priceMin?.toLocaleString('en-IN')} — ₹{product.priceMax?.toLocaleString('en-IN')}</div>
                  </div>
                )}
              </div>
              <div>
                {product.aiSummary && (
                  <div style={{ background: 'var(--surface)', border: '1px solid var(--border-accent)', borderRadius: 20, padding: 28, marginBottom: 20 }}>
                    <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--saffron)', marginBottom: 12 }}>⚡ AI Summary</div>
                    <p style={{ fontSize: 14, color: 'var(--text-dim)', lineHeight: 1.8 }}>{product.aiSummary}</p>
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {product.pros?.length > 0 && (
                    <div style={{ background: 'rgba(0,230,118,0.05)', border: '1px solid rgba(0,230,118,0.15)', borderRadius: 12, padding: 16 }}>
                      <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 12, fontWeight: 700, color: 'var(--green)', marginBottom: 10 }}>✓ Pros</div>
                      {product.pros.map((p, i) => <div key={i} style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 6 }}>· {p}</div>)}
                    </div>
                  )}
                  {product.cons?.length > 0 && (
                    <div style={{ background: 'rgba(255,60,0,0.05)', border: '1px solid rgba(255,60,0,0.15)', borderRadius: 12, padding: 16 }}>
                      <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 12, fontWeight: 700, color: '#FF5733', marginBottom: 10 }}>✗ Cons</div>
                      {product.cons.map((c, i) => <div key={i} style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 6 }}>· {c}</div>)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
        {reviews.length > 0 && (
          <section style={{ padding: '60px 48px' }}>
            <div style={{ maxWidth: 1000, margin: '0 auto' }}>
              <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: 28, fontWeight: 800, letterSpacing: '-1px', marginBottom: 32 }}>What Indian buyers say</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {reviews.map(r => (
                  <div key={r._id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 14 }}>{r.reviewerName}</div>
                      {r.reviewerCity && <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: 'var(--text-muted)' }}>{r.reviewerCity}</div>}
                      {r.verifiedBuyer && <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: 'var(--green)', background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.2)', borderRadius: 100, padding: '2px 8px' }}>✓ Verified</div>}
                      <div style={{ marginLeft: 'auto', fontFamily: 'JetBrains Mono,monospace', fontSize: 12, fontWeight: 600, color: 'var(--green)' }}>{'★'.repeat(Math.round(r.rating))}</div>
                    </div>
                    {r.title && <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 14, marginBottom: 6 }}>{r.title}</div>}
                    <div style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.7 }}>{r.body}</div>
                    {r.source && <div style={{ marginTop: 10, fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: 'var(--text-muted)' }}>via {r.source}{r.usageDuration ? ` · Used for ${r.usageDuration}` : ''}</div>}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  )
}
