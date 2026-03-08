'use client'
export const dynamic = 'force-dynamic'
import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import Link from 'next/link'

type AiProduct = {
  name: string
  price: string
  seller: string
  rating: number
  reviews: string
  badge: string
  reason: string
}

type SerpProduct = {
  title: string
  price: string
  rating: number | null
  source: string
  link: string
  thumbnail: string
  delivery: string
  badge: string | null
}

const COLORS = ['#FF6B00','#00C8FF','#00E676','#FFD60A','#FF3CAC','#7B61FF']

function Stars({ rating }: { rating: number }) {
  return (
    <span style={{ color: '#FFD700', fontSize: 13, letterSpacing: 1 }}>
      {'★'.repeat(Math.round(rating))}{'☆'.repeat(5 - Math.round(rating))}
      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginLeft: 4 }}>{rating.toFixed(1)}</span>
    </span>
  )
}

function AiProductCard({ p, idx }: { p: AiProduct; idx: number }) {
  const color = COLORS[idx % COLORS.length]
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: `1px solid ${color}33`,
      borderRadius: 16,
      padding: '20px',
      transition: 'all 0.2s',
      cursor: 'default',
      position: 'relative',
      overflow: 'hidden',
    }}
    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.border = `1px solid ${color}88`; (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.07)' }}
    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.border = `1px solid ${color}33`; (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.04)' }}
    >
      {/* Rank badge */}
      <div style={{ position:'absolute', top:14, right:14, width:28, height:28, borderRadius:'50%', background: color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, color:'#000' }}>
        {idx + 1}
      </div>
      {/* Best pick badge */}
      {p.badge && (
        <div style={{ display:'inline-block', background: `${color}22`, border: `1px solid ${color}66`, borderRadius:20, padding:'2px 10px', fontSize:10, fontWeight:700, color, marginBottom:10, letterSpacing:1, textTransform:'uppercase' }}>
          {p.badge}
        </div>
      )}
      <div style={{ fontWeight:700, fontSize:15, color:'#fff', marginBottom:8, lineHeight:1.4, paddingRight:36 }}>
        {p.name}
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:8, flexWrap:'wrap' }}>
        <span style={{ fontSize:20, fontWeight:800, color, fontFamily:'monospace' }}>{p.price}</span>
        {p.seller && <span style={{ fontSize:12, color:'rgba(255,255,255,0.5)', background:'rgba(255,255,255,0.06)', borderRadius:6, padding:'2px 8px' }}>{p.seller}</span>}
      </div>
      {p.rating > 0 && (
        <div style={{ marginBottom:8 }}>
          <Stars rating={p.rating} />
          {p.reviews && <span style={{ fontSize:11, color:'rgba(255,255,255,0.35)', marginLeft:6 }}>({p.reviews} reviews)</span>}
        </div>
      )}
      {p.reason && (
        <div style={{ fontSize:12, color:'rgba(255,255,255,0.55)', lineHeight:1.5, borderTop:'1px solid rgba(255,255,255,0.06)', paddingTop:10, marginTop:4 }}>
          {p.reason}
        </div>
      )}
    </div>
  )
}

function SerpCard({ p, idx }: { p: SerpProduct; idx: number }) {
  const color = COLORS[idx % COLORS.length]
  return (
    <a href={p.link} target="_blank" rel="noopener noreferrer" style={{
      display:'block', textDecoration:'none',
      background:'rgba(255,255,255,0.03)',
      border:`1px solid rgba(255,255,255,0.08)`,
      borderRadius:12, padding:'14px', transition:'all 0.2s',
    }}
    onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.border = `1px solid ${color}55`; (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.06)' }}
    onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.border = `1px solid rgba(255,255,255,0.08)`; (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.03)' }}
    >
      <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
        {p.thumbnail && <img src={p.thumbnail} alt="" style={{ width:60, height:60, objectFit:'contain', borderRadius:8, background:'rgba(255,255,255,0.08)', flexShrink:0 }} onError={e => { (e.target as HTMLImageElement).style.display='none' }} />}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13, fontWeight:600, color:'#fff', marginBottom:4, lineHeight:1.4 }}>{p.title}</div>
          <div style={{ fontSize:16, fontWeight:700, color, marginBottom:4 }}>{p.price}</div>
          {p.source && <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)' }}>{p.source}</div>}
          {p.rating && <Stars rating={p.rating} />}
        </div>
      </div>
    </a>
  )
}

function SearchResults() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const query = searchParams.get('q') || ''

  const [loading, setLoading] = useState(false)
  const [called, setCalled] = useState(false)
  const [answer, setAnswer] = useState('')
  const [aiProducts, setAiProducts] = useState<AiProduct[]>([])
  const [serpProducts, setSerpProducts] = useState<SerpProduct[]>([])
  const [related, setRelated] = useState<string[]>([])
  const [input, setInput] = useState('')

  const doSearch = async (q: string) => {
    if (!q.trim()) return
    setLoading(true)
    setCalled(true)
    setAnswer('')
    setAiProducts([])
    setSerpProducts([])
    setRelated([])
    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
      })
      const data = await res.json()
      setAnswer(data.answer || '')
      setAiProducts(data.aiProducts || [])
      setSerpProducts(data.serpProducts || [])
      setRelated(data.relatedSearches || [])
    } catch {
      setAnswer('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Auto-search on load
  if (query && !called && !loading) { doSearch(query); setCalled(true) }

  const handleSubmit = () => {
    if (!input.trim()) return
    router.push(`/search?q=${encodeURIComponent(input.trim())}`)
    doSearch(input.trim())
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px' }}>
      {/* Search bar */}
      <div style={{ display:'flex', gap:10, marginBottom:32 }}>
        <input
          value={input || query}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder="Search for any product..."
          style={{ flex:1, padding:'14px 18px', borderRadius:12, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.15)', color:'#fff', fontSize:15, outline:'none' }}
        />
        <button onClick={handleSubmit} style={{ padding:'14px 24px', borderRadius:12, background:'#FF6B00', color:'#fff', fontWeight:700, border:'none', cursor:'pointer', fontSize:15 }}>
          Search
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign:'center', padding:'60px 0' }}>
          <div style={{ fontSize:18, color:'rgba(255,255,255,0.5)', marginBottom:16 }}>🔍 Analyzing Indian market...</div>
          <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
            {[0,1,2].map(i => (
              <div key={i} style={{ width:10, height:10, borderRadius:'50%', background:'#FF6B00', animation:`pulse 1s ${i*0.2}s infinite` }} />
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {!loading && answer && (
        <>
          {/* Query header */}
          <div style={{ marginBottom:24 }}>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', marginBottom:4, textTransform:'uppercase', letterSpacing:1 }}>Results for</div>
            <h1 style={{ fontSize:22, fontWeight:800, color:'#fff', margin:0 }}>{query || input}</h1>
          </div>

          {/* AI Answer */}
          <div style={{ background:'rgba(255,107,0,0.08)', border:'1px solid rgba(255,107,0,0.25)', borderRadius:16, padding:'20px 24px', marginBottom:32 }}>
            <div style={{ fontSize:12, color:'#FF6B00', fontWeight:700, marginBottom:10, textTransform:'uppercase', letterSpacing:1 }}>🤖 AI Analysis</div>
            <p style={{ color:'rgba(255,255,255,0.85)', lineHeight:1.7, margin:0, fontSize:15 }}>{answer}</p>
          </div>

          {/* AI Product Cards */}
          {aiProducts.length > 0 && (
            <div style={{ marginBottom:40 }}>
              <div style={{ fontSize:13, color:'rgba(255,255,255,0.4)', fontWeight:600, marginBottom:16, textTransform:'uppercase', letterSpacing:1 }}>
                🏆 Top Recommendations
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:16 }}>
                {aiProducts.map((p, i) => <AiProductCard key={i} p={p} idx={i} />)}
              </div>
            </div>
          )}

          {/* SerpApi live prices */}
          {serpProducts.length > 0 && (
            <div style={{ marginBottom:40 }}>
              <div style={{ fontSize:13, color:'rgba(255,255,255,0.4)', fontWeight:600, marginBottom:16, textTransform:'uppercase', letterSpacing:1 }}>
                🛒 Live Prices from Google Shopping
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap:12 }}>
                {serpProducts.slice(0,6).map((p, i) => <SerpCard key={i} p={p} idx={i} />)}
              </div>
            </div>
          )}

          {/* Related searches */}
          {related.length > 0 && (
            <div>
              <div style={{ fontSize:13, color:'rgba(255,255,255,0.4)', fontWeight:600, marginBottom:12, textTransform:'uppercase', letterSpacing:1 }}>Related Searches</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                {related.map((r,i) => (
                  <button key={i} onClick={() => { router.push(`/search?q=${encodeURIComponent(r)}`); doSearch(r) }}
                    style={{ padding:'8px 16px', borderRadius:20, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', color:'rgba(255,255,255,0.7)', fontSize:13, cursor:'pointer' }}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Empty state */}
      {!loading && !answer && !called && (
        <div style={{ textAlign:'center', padding:'80px 0', color:'rgba(255,255,255,0.3)' }}>
          <div style={{ fontSize:48, marginBottom:16 }}>🔍</div>
          <div style={{ fontSize:18 }}>Search for any product to get AI-powered recommendations</div>
        </div>
      )}

      <style>{`@keyframes pulse { 0%,100%{opacity:0.3;transform:scale(0.8)} 50%{opacity:1;transform:scale(1)} }`}</style>
    </div>
  )
}

export default function SearchPage() {
  return (
    <div style={{ minHeight:'100vh', background:'#0a0a0a', color:'#fff', fontFamily:'Inter,system-ui,sans-serif' }}>
      <Nav />
      <Suspense fallback={<div style={{padding:'60px 20px',textAlign:'center',color:'rgba(255,255,255,0.4)'}}>Loading...</div>}>
        <SearchResults />
      </Suspense>
      <Footer />
    </div>
  )
}
