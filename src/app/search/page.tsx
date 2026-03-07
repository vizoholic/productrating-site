'use client'
import { useState, useEffect, Suspense, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import Link from 'next/link'

// Clean raw Sarvam output: strip <think>...</think> and **markdown**
function cleanAnswer(raw: string): string {
  return raw
    .replace(/<think>[\s\S]*?<\/think>/gi, '')  // remove think blocks
    .replace(/\*\*(.*?)\*\*/g, '$1')             // strip bold markdown
    .replace(/\*(.*?)\*/g, '$1')                 // strip italic markdown
    .replace(/`(.*?)`/g, '$1')                   // strip inline code
    .trim()
}

type SerpProduct = {
  title: string
  price: string
  rating: number | null
  reviews: number | null
  source: string
  link: string
  thumbnail: string
  delivery: string
  badge: string | null
}

const ACCENT_COLORS = ['#FF6B00', '#00C8FF', '#00E676', '#FFD60A', '#FF3CAC', '#7B61FF']

function StarRow({ rating, reviews }: { rating: number; reviews?: number | null }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <div style={{ display: 'flex', gap: 1 }}>
        {[1,2,3,4,5].map(i => (
          <span key={i} style={{ fontSize: 11, color: i <= Math.round(rating) ? '#FFD700' : 'rgba(255,255,255,0.15)' }}>★</span>
        ))}
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color: '#FFD700', fontFamily: 'JetBrains Mono,monospace' }}>{rating.toFixed(1)}</span>
      {reviews && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'JetBrains Mono,monospace' }}>
        ({reviews >= 1000 ? `${(reviews/1000).toFixed(1)}k` : reviews})
      </span>}
    </div>
  )
}

function SerpProductCard({ p, index }: { p: SerpProduct; index: number }) {
  const [imgErr, setImgErr] = useState(false)
  const accent = ACCENT_COLORS[index % ACCENT_COLORS.length]

  return (
    <a href={p.link} target="_blank" rel="noopener noreferrer"
      style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden', transition: 'all 0.22s', cursor: 'pointer', position: 'relative' }}
      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = `${accent}50`; el.style.transform = 'translateY(-3px)'; el.style.boxShadow = `0 10px 30px ${accent}15` }}
      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(255,255,255,0.07)'; el.style.transform = 'translateY(0)'; el.style.boxShadow = 'none' }}
    >
      {p.badge && (
        <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 2, background: accent, color: '#000', fontSize: 9, fontWeight: 800, fontFamily: 'JetBrains Mono,monospace', padding: '2px 7px', borderRadius: 4, letterSpacing: 0.5 }}>{p.badge}</div>
      )}
      <div style={{ height: 140, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {!imgErr && p.thumbnail ? (
          <img src={p.thumbnail} alt={p.title} onError={() => setImgErr(true)}
            style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 14 }} />
        ) : (
          <div style={{ fontSize: 42, opacity: 0.2 }}>📦</div>
        )}
      </div>
      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 7, flex: 1 }}>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: 600, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.title}</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: accent, fontFamily: 'Syne,sans-serif', letterSpacing: '-0.5px' }}>{p.price}</div>
        {p.rating && <StarRow rating={p.rating} reviews={p.reviews} />}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.05)', borderRadius: 4, padding: '2px 7px', fontFamily: 'JetBrains Mono,monospace' }}>{p.source}</span>
          {p.delivery && <span style={{ fontSize: 9, color: '#00E676', fontFamily: 'JetBrains Mono,monospace', textAlign: 'right' }}>{p.delivery.replace('Free delivery', '✓ Free')}</span>}
        </div>
      </div>
      <div style={{ padding: '8px 14px', borderTop: '1px solid rgba(255,255,255,0.05)', background: `${accent}08`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10, color: accent, fontFamily: 'JetBrains Mono,monospace', fontWeight: 600 }}>View on {p.source} →</span>
      </div>
    </a>
  )
}

function PriceBar({ products }: { products: SerpProduct[] }) {
  const prices = products.map(p => parseInt(p.price.replace(/[^0-9]/g,''))).filter(Boolean)
  if (!prices.length) return null
  const min = Math.min(...prices), max = Math.max(...prices)
  const cheapest = products.find(p => parseInt(p.price.replace(/[^0-9]/g,'')) === min)
  return (
    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '16px 20px', marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>Price Comparison · India</div>
        {cheapest && <div style={{ fontSize: 11, color: '#00E676', fontFamily: 'JetBrains Mono,monospace' }}>✓ Best deal: {cheapest.source}</div>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {products.map((p, i) => {
          const price = parseInt(p.price.replace(/[^0-9]/g,''))
          if (!price) return null
          const pct = max > min ? ((price - min) / (max - min)) * 100 : 50
          const accent = ACCENT_COLORS[i % ACCENT_COLORS.length]
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono,monospace', color: 'rgba(255,255,255,0.4)', width: 80, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.source}</span>
              <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${Math.max(10, pct)}%`, height: '100%', background: accent, borderRadius: 3, transition: 'width 0.6s ease' }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: accent, fontFamily: 'Syne,sans-serif', width: 72, textAlign: 'right', flexShrink: 0 }}>{p.price}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SearchResults() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [wixProducts, setWixProducts] = useState<any[]>([])
  const [serpProducts, setSerpProducts] = useState<SerpProduct[]>([])
  const [relatedSearches, setRelatedSearches] = useState<string[]>([])
  const [aiAnswer, setAiAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const q = searchParams.get('q')
    if (q) { setQuery(q); runSearch(q) }
  }, [searchParams])

  const runSearch = async (q: string) => {
    setLoading(true)
    setAiAnswer('')
    setSerpProducts([])
    setWixProducts([])
    setRelatedSearches([])
    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
      })
      const data = await res.json()
      setAiAnswer(cleanAnswer(data.answer || ''))
      setWixProducts(data.products || [])
      setSerpProducts(data.serpProducts || [])
      setRelatedSearches(data.relatedSearches || [])
    } catch {
      setAiAnswer('Unable to connect. Please try again.')
    }
    setLoading(false)
  }

  const handleSearch = () => {
    if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`)
  }

  return (
    <>
      <Nav />
      <main style={{ minHeight: '100vh', padding: '100px 24px 80px', background: 'var(--bg)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>

          {/* Search bar */}
          <div style={{ marginBottom: 40, display: 'flex', gap: 12 }}>
            <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Ask anything about any product..."
              style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--border-accent)', borderRadius: 14, padding: '16px 22px', fontFamily: 'DM Sans,sans-serif', fontSize: 16, color: 'var(--text)', outline: 'none' }} />
            <button onClick={handleSearch}
              style={{ background: 'var(--saffron)', color: '#000', border: 'none', borderRadius: 14, padding: '16px 32px', fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 15, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              Ask AI →
            </button>
          </div>

          {/* Loading state */}
          {loading && (
            <div style={{ background: 'rgba(255,107,0,0.05)', border: '1px solid rgba(255,107,0,0.2)', borderRadius: 16, padding: '20px 24px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FF6B00', animation: 'pulse 1s infinite' }} />
              <div>
                <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: 'var(--saffron)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 }}>⚡ Sarvam AI + Google Shopping India</div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Searching live prices and analysing reviews...</div>
              </div>
            </div>
          )}

          {/* AI Answer */}
          {aiAnswer && !loading && (
            <div style={{ background: 'rgba(255,107,0,0.04)', border: '1px solid rgba(255,107,0,0.2)', borderRadius: 18, padding: '24px 28px', marginBottom: 28 }}>
              <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--saffron)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>⚡ ProductRating AI Answer</span>
                <span style={{ marginLeft: 'auto', fontSize: 8, color: 'rgba(255,255,255,0.25)' }}>Powered by Sarvam · India&apos;s own AI</span>
              </div>
              <p style={{ fontSize: 16, color: 'var(--text)', lineHeight: 1.85, margin: 0 }}>{aiAnswer}</p>
            </div>
          )}

          {/* Live Google Shopping results */}
          {serpProducts.length > 0 && !loading && (
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <span style={{ width: 7, height: 7, background: '#00E676', borderRadius: '50%', animation: 'pulse 1.5s infinite' }} />
                <h2 style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: '#00C8FF', margin: 0 }}>Live Google Shopping India</h2>
                <span style={{ fontSize: 9, fontFamily: 'JetBrains Mono,monospace', color: 'rgba(255,255,255,0.2)', marginLeft: 'auto' }}>Updated just now · gl=in</span>
              </div>
              <PriceBar products={serpProducts.slice(0,4)} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                {serpProducts.slice(0, 6).map((p, i) => <SerpProductCard key={i} p={p} index={i} />)}
              </div>
            </div>
          )}

          {/* Related searches */}
          {relatedSearches.length > 0 && !loading && (
            <div style={{ marginBottom: 32 }}>
              <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 10 }}>Related Searches</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {relatedSearches.map((s, i) => (
                  <button key={i} onClick={() => router.push(`/search?q=${encodeURIComponent(s)}`)}
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 100, padding: '7px 14px', fontSize: 12, color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', transition: 'all 0.2s' }}
                    onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = 'rgba(255,107,0,0.4)'; (e.target as HTMLElement).style.color = '#FF6B00' }}
                    onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)'; (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.6)' }}>
                    {s} →
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Wix CMS products */}
          {wixProducts.length > 0 && !loading && (
            <div>
              <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 12 }}>ProductRating.in Database</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {wixProducts.map((p: any) => (
                  <Link key={p._id} href={`/products/${p.slug}`}
                    style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '16px 20px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, textDecoration: 'none', transition: 'border-color .2s' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-accent)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono,monospace', marginTop: 2 }}>{p.category} · {p.brand}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 28, fontWeight: 800, color: 'var(--green)', lineHeight: 1 }}>{p.aggregatedScore?.toFixed(1)}</div>
                      <div style={{ fontSize: 9, fontFamily: 'JetBrains Mono,monospace', color: 'var(--text-muted)' }}>PR SCORE</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Empty state - no results yet */}
          {!loading && !aiAnswer && !serpProducts.length && (
            <div style={{ textAlign: 'center', padding: '60px 24px', color: 'rgba(255,255,255,0.3)' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
              <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Ask anything about any product</div>
              <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 14 }}>Best mixer grinder? AC for Chennai? iPhone vs Samsung?</div>
            </div>
          )}

        </div>
      </main>
      <Footer />
      <style>{`@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.3)} }`}</style>
    </>
  )
}

export default function SearchPage() {
  return <Suspense fallback={<div style={{ color: 'var(--text)', padding: 80, textAlign: 'center' }}>Loading...</div>}><SearchResults /></Suspense>
}
