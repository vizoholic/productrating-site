'use client'
export const dynamic = 'force-dynamic'
import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

type AiProduct = {
  name: string; price: string; seller: string
  rating: number; reviews: string; badge: string; reason: string
}
type SerpProduct = {
  title: string; price: string; rating: number | null
  source: string; link: string; thumbnail: string; delivery: string
}

const ACCENT = ['#FF6B00','#0055FF','#059669','#7C3AED','#DC2626','#0891B2']

function Stars({ rating }: { rating: number }) {
  const full = Math.round(rating)
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4 }}>
      <span style={{ color:'#F59E0B', fontSize:12 }}>{'★'.repeat(full)}{'☆'.repeat(5-full)}</span>
      <span style={{ fontSize:12, color:'var(--text-dim)', fontWeight:600 }}>{rating.toFixed(1)}</span>
    </span>
  )
}

function AiCard({ p, idx }: { p: AiProduct; idx: number }) {
  const color = ACCENT[idx % ACCENT.length]
  return (
    <div style={{
      background:'#fff', border:'1px solid var(--border)', borderRadius:16, padding:24,
      transition:'all .2s', position:'relative', overflow:'hidden',
    }}
      onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.boxShadow='var(--shadow-md)';(e.currentTarget as HTMLDivElement).style.borderColor=color+'44';(e.currentTarget as HTMLDivElement).style.transform='translateY(-2px)'}}
      onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.boxShadow='none';(e.currentTarget as HTMLDivElement).style.borderColor='var(--border)';(e.currentTarget as HTMLDivElement).style.transform='translateY(0)'}}>
      {/* Rank */}
      <div style={{ position:'absolute', top:16, right:16, width:28, height:28, borderRadius:'50%', background:color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, color:'#fff' }}>
        {idx+1}
      </div>
      {/* Badge */}
      {p.badge && (
        <div style={{ display:'inline-block', background:`${color}12`, border:`1px solid ${color}33`, borderRadius:100, padding:'3px 10px', fontSize:10, fontWeight:700, color, marginBottom:10, letterSpacing:1, textTransform:'uppercase' }}>
          {p.badge}
        </div>
      )}
      <div style={{ fontWeight:700, fontSize:15, color:'var(--text)', marginBottom:8, lineHeight:1.4, paddingRight:36 }}>{p.name}</div>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8, flexWrap:'wrap' }}>
        <span style={{ fontSize:20, fontWeight:800, color, fontFamily:'Syne,sans-serif' }}>{p.price}</span>
        {p.seller && <span style={{ fontSize:12, color:'var(--text-dim)', background:'var(--bg2)', borderRadius:6, padding:'2px 8px', fontWeight:500 }}>{p.seller}</span>}
      </div>
      {p.rating > 0 && (
        <div style={{ marginBottom:8 }}>
          <Stars rating={p.rating} />
          {p.reviews && <span style={{ fontSize:11, color:'var(--text-muted)', marginLeft:6 }}>({p.reviews})</span>}
        </div>
      )}
      {p.reason && (
        <div style={{ fontSize:12, color:'var(--text-dim)', lineHeight:1.6, borderTop:'1px solid var(--border)', paddingTop:10, marginTop:8 }}>
          {p.reason}
        </div>
      )}
    </div>
  )
}

function SerpCard({ p, idx }: { p: SerpProduct; idx: number }) {
  const color = ACCENT[idx % ACCENT.length]
  return (
    <a href={p.link} target="_blank" rel="noopener noreferrer" style={{
      display:'block', textDecoration:'none', background:'#fff',
      border:'1px solid var(--border)', borderRadius:12, padding:16,
      transition:'all .2s', boxShadow:'var(--shadow-sm)',
    }}
      onMouseEnter={e=>{(e.currentTarget as HTMLAnchorElement).style.boxShadow='var(--shadow-md)';(e.currentTarget as HTMLAnchorElement).style.borderColor=color+'55';(e.currentTarget as HTMLAnchorElement).style.transform='translateY(-2px)'}}
      onMouseLeave={e=>{(e.currentTarget as HTMLAnchorElement).style.boxShadow='var(--shadow-sm)';(e.currentTarget as HTMLAnchorElement).style.borderColor='var(--border)';(e.currentTarget as HTMLAnchorElement).style.transform='translateY(0)'}}>
      <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
        {p.thumbnail && <img src={p.thumbnail} alt="" style={{ width:56, height:56, objectFit:'contain', borderRadius:8, background:'var(--bg2)', flexShrink:0, border:'1px solid var(--border)' }} onError={e=>{(e.target as HTMLImageElement).style.display='none'}} />}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13, fontWeight:600, color:'var(--text)', marginBottom:4, lineHeight:1.4 }}>{p.title}</div>
          <div style={{ fontSize:16, fontWeight:800, color, marginBottom:4, fontFamily:'Syne,sans-serif' }}>{p.price}</div>
          {p.source && <div style={{ fontSize:11, color:'var(--text-muted)', fontWeight:500 }}>{p.source}</div>}
          {p.rating && <Stars rating={p.rating} />}
        </div>
        <span style={{ fontSize:12, color:color, fontWeight:600, flexShrink:0 }}>↗</span>
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
    setLoading(true); setCalled(true); setAnswer(''); setAiProducts([]); setSerpProducts([]); setRelated([])
    try {
      const res = await fetch('/api/ask', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ question:q }) })
      const data = await res.json()
      setAnswer(data.answer || '')
      setAiProducts(data.aiProducts || [])
      setSerpProducts(data.serpProducts || [])
      setRelated(data.relatedSearches || [])
    } catch { setAnswer('Something went wrong. Please try again.') }
    finally { setLoading(false) }
  }

  if (query && !called && !loading) { doSearch(query); setCalled(true) }

  const handleSubmit = () => {
    const q = input.trim() || query
    if (!q) return
    if (input.trim()) router.push(`/search?q=${encodeURIComponent(input.trim())}`)
    doSearch(q)
  }

  return (
    <div style={{ maxWidth:960, margin:'0 auto', padding:'88px 20px 60px' }}>

      {/* Search bar */}
      <div style={{ display:'flex', gap:10, marginBottom:36 }}>
        <div style={{ flex:1, display:'flex', alignItems:'center', gap:10, background:'#fff', border:'1.5px solid var(--border-strong)', borderRadius:12, padding:'6px 6px 6px 16px', boxShadow:'var(--shadow-sm)' }}>
          <span style={{ color:'var(--text-muted)', fontSize:16 }}>🔍</span>
          <input
            defaultValue={query}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder="Search for any product..."
            style={{ flex:1, border:'none', outline:'none', fontFamily:'DM Sans,sans-serif', fontSize:15, color:'var(--text)', background:'none', padding:'10px 0' }}
          />
        </div>
        <button onClick={handleSubmit} style={{ padding:'0 24px', borderRadius:12, background:'var(--saffron)', color:'#fff', fontWeight:700, border:'none', cursor:'pointer', fontSize:14, fontFamily:'Syne,sans-serif', transition:'background .15s' }}
          onMouseEnter={e=>(e.currentTarget.style.background='#E55A00')}
          onMouseLeave={e=>(e.currentTarget.style.background='var(--saffron)')}>
          Search
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign:'center', padding:'80px 0' }}>
          <div style={{ width:40, height:40, border:'3px solid var(--border)', borderTopColor:'var(--saffron)', borderRadius:'50%', margin:'0 auto 20px', animation:'spin 0.8s linear infinite' }} />
          <div style={{ fontSize:15, color:'var(--text-dim)', fontWeight:500 }}>Analysing the Indian market...</div>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {/* Results */}
      {!loading && answer && (
        <div>
          {/* Header */}
          <div style={{ marginBottom:28, paddingBottom:20, borderBottom:'1px solid var(--border)' }}>
            <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:6, textTransform:'uppercase', letterSpacing:1, fontFamily:'JetBrains Mono,monospace', fontWeight:500 }}>Results for</div>
            <h1 style={{ fontSize:24, fontWeight:800, color:'var(--text)', fontFamily:'Syne,sans-serif', letterSpacing:'-0.5px', margin:0 }}>{query || input}</h1>
          </div>

          {/* AI Answer */}
          <div style={{ background:'var(--saffron-light)', border:'1px solid var(--saffron-mid)', borderRadius:14, padding:'20px 24px', marginBottom:36 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
              <span style={{ fontSize:16 }}>🤖</span>
              <span style={{ fontSize:12, color:'var(--saffron)', fontWeight:700, textTransform:'uppercase', letterSpacing:1, fontFamily:'JetBrains Mono,monospace' }}>AI Analysis</span>
            </div>
            <p style={{ color:'var(--text)', lineHeight:1.75, margin:0, fontSize:15, fontWeight:400 }}>{answer}</p>
          </div>

          {/* AI Product Cards */}
          {aiProducts.length > 0 && (
            <div style={{ marginBottom:44 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:18 }}>
                <span style={{ fontSize:16 }}>🏆</span>
                <span style={{ fontSize:13, color:'var(--text)', fontWeight:700, fontFamily:'Syne,sans-serif' }}>Top Recommendations</span>
                <span style={{ fontSize:12, color:'var(--text-muted)', background:'var(--bg2)', borderRadius:100, padding:'2px 10px', fontWeight:500 }}>{aiProducts.length} products</span>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:16 }}>
                {aiProducts.map((p,i) => <AiCard key={i} p={p} idx={i} />)}
              </div>
            </div>
          )}

          {/* Live SerpApi prices */}
          {serpProducts.length > 0 && (
            <div style={{ marginBottom:44 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:18 }}>
                <span style={{ fontSize:16 }}>🛒</span>
                <span style={{ fontSize:13, color:'var(--text)', fontWeight:700, fontFamily:'Syne,sans-serif' }}>Live Prices</span>
                <span style={{ fontSize:12, color:'var(--text-muted)', background:'var(--bg2)', borderRadius:100, padding:'2px 10px', fontWeight:500 }}>Google Shopping India</span>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:12 }}>
                {serpProducts.slice(0,6).map((p,i) => <SerpCard key={i} p={p} idx={i} />)}
              </div>
            </div>
          )}

          {/* Related */}
          {related.length > 0 && (
            <div style={{ paddingTop:28, borderTop:'1px solid var(--border)' }}>
              <div style={{ fontSize:12, color:'var(--text-muted)', fontWeight:600, marginBottom:12, textTransform:'uppercase', letterSpacing:1, fontFamily:'JetBrains Mono,monospace' }}>Related Searches</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                {related.map((r,i) => (
                  <button key={i} onClick={() => { router.push(`/search?q=${encodeURIComponent(r)}`); doSearch(r) }}
                    style={{ padding:'8px 16px', borderRadius:100, background:'#fff', border:'1px solid var(--border)', color:'var(--text-dim)', fontSize:13, cursor:'pointer', fontWeight:500, transition:'all .15s' }}
                    onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor='var(--saffron)';(e.currentTarget as HTMLButtonElement).style.color='var(--saffron)'}}
                    onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor='var(--border)';(e.currentTarget as HTMLButtonElement).style.color='var(--text-dim)'}}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!loading && !answer && !called && (
        <div style={{ textAlign:'center', padding:'80px 0', color:'var(--text-muted)' }}>
          <div style={{ fontSize:48, marginBottom:16 }}>🔍</div>
          <div style={{ fontSize:16, fontWeight:500 }}>Search any product for AI-powered recommendations</div>
          <div style={{ fontSize:14, marginTop:8, color:'var(--text-muted)' }}>Try "Best AC under ₹35,000" or "OnePlus vs Samsung"</div>
        </div>
      )}
    </div>
  )
}

export default function SearchPage() {
  return (
    <div style={{ minHeight:'100vh', background:'var(--bg2)', fontFamily:'DM Sans,sans-serif' }}>
      <Nav />
      <Suspense fallback={<div style={{padding:'100px 20px',textAlign:'center',color:'var(--text-muted)'}}>Loading...</div>}>
        <SearchResults />
      </Suspense>
      <Footer />
    </div>
  )
}
