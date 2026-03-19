'use client'
export const dynamic = 'force-dynamic'
import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

type AiProduct = { name:string; price:string; seller:string; rating:number; reviews:string; badge:string; reason:string }
type SerpProduct = { title:string; price:string; rating:number|null; source:string; link:string; thumbnail:string }

function ScoreBar({ score }: { score: number }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
      <div style={{ flex:1, height:6, background:'var(--border)', borderRadius:3, overflow:'hidden' }}>
        <div style={{ width:`${(score/5)*100}%`, height:'100%', background:'var(--green)', borderRadius:3, transition:'width .4s' }} />
      </div>
      <span style={{ fontSize:13, fontWeight:700, color:'var(--green)', fontFamily:'JetBrains Mono,monospace', minWidth:24 }}>{score.toFixed(1)}</span>
    </div>
  )
}

function AiCard({ p, idx }: { p:AiProduct; idx:number }) {
  return (
    <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:10, padding:20, boxShadow:'var(--shadow-xs)', transition:'all .15s', position:'relative' }}
      onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.boxShadow='var(--shadow-md)';(e.currentTarget as HTMLDivElement).style.borderColor='var(--blue-mid)'}}
      onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.boxShadow='var(--shadow-xs)';(e.currentTarget as HTMLDivElement).style.borderColor='var(--border)'}}>
      {/* Rank */}
      <div style={{ position:'absolute', top:14, right:14, width:24, height:24, borderRadius:'50%', background: idx===0?'var(--blue)':idx===1?'var(--muted)':'var(--border)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color:'#fff', fontFamily:'Plus Jakarta Sans,sans-serif' }}>
        {idx+1}
      </div>
      {p.badge && (
        <span style={{ display:'inline-block', fontSize:11, fontWeight:600, color:'var(--green)', background:'var(--green-light)', border:'1px solid #A7F3D0', borderRadius:100, padding:'2px 10px', marginBottom:10, fontFamily:'JetBrains Mono,monospace' }}>
          ● {p.badge}
        </span>
      )}
      <div style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:15, fontWeight:700, color:'var(--ink)', marginBottom:8, paddingRight:32, lineHeight:1.35 }}>{p.name}</div>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10, flexWrap:'wrap' }}>
        <span style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:20, fontWeight:800, color:'var(--blue)' }}>{p.price}</span>
        {p.seller && <span style={{ fontSize:12, color:'var(--muted)', background:'var(--bg-2)', borderRadius:6, padding:'2px 8px', fontWeight:500 }}>{p.seller}</span>}
      </div>
      {p.rating > 0 && (
        <div style={{ marginBottom:10 }}>
          <div style={{ fontSize:11, color:'var(--subtle)', marginBottom:4, fontWeight:500 }}>AI Score — Based on {p.reviews||'1k+'} reviews</div>
          <ScoreBar score={p.rating} />
        </div>
      )}
      {p.reason && (
        <div style={{ fontSize:13, color:'var(--muted)', lineHeight:1.6, borderTop:'1px solid var(--border)', paddingTop:10, marginTop:6 }}>
          {p.reason}
        </div>
      )}
    </div>
  )
}

function SerpCard({ p, idx }: { p:SerpProduct; idx:number }) {
  return (
    <a href={p.link} target="_blank" rel="noopener noreferrer" style={{ display:'block', textDecoration:'none', background:'#fff', border:'1px solid var(--border)', borderRadius:10, padding:16, transition:'all .15s', boxShadow:'var(--shadow-xs)' }}
      onMouseEnter={e=>{(e.currentTarget as HTMLAnchorElement).style.boxShadow='var(--shadow-md)';(e.currentTarget as HTMLAnchorElement).style.borderColor='var(--blue-mid)'}}
      onMouseLeave={e=>{(e.currentTarget as HTMLAnchorElement).style.boxShadow='var(--shadow-xs)';(e.currentTarget as HTMLAnchorElement).style.borderColor='var(--border)'}}>
      <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
        {p.thumbnail && <img src={p.thumbnail} alt="" style={{ width:52, height:52, objectFit:'contain', borderRadius:8, background:'var(--bg-2)', flexShrink:0, border:'1px solid var(--border)' }} onError={e=>{(e.target as HTMLImageElement).style.display='none'}} />}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13, fontWeight:600, color:'var(--ink)', marginBottom:4, lineHeight:1.4 }}>{p.title}</div>
          <div style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:16, fontWeight:800, color:'var(--blue)', marginBottom:4 }}>{p.price}</div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            {p.source && <span style={{ fontSize:12, color:'var(--subtle)', fontWeight:500 }}>{p.source}</span>}
            <span style={{ fontSize:12, color:'var(--blue)', fontWeight:600 }}>↗ View</span>
          </div>
          {p.rating && <div style={{ marginTop:6 }}><ScoreBar score={p.rating} /></div>}
        </div>
      </div>
    </a>
  )
}

function SearchResults() {
  const sp = useSearchParams(), router = useRouter()
  const query = sp.get('q') || ''
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
      setAnswer(data.answer || ''); setAiProducts(data.aiProducts || []); setSerpProducts(data.serpProducts || []); setRelated(data.relatedSearches || [])
    } catch { setAnswer('Something went wrong. Try again.') }
    finally { setLoading(false) }
  }

  if (query && !called && !loading) { doSearch(query); setCalled(true) }

  const submit = () => {
    const q = input.trim() || query
    if (!q) return
    if (input.trim()) router.push(`/search?q=${encodeURIComponent(input.trim())}`)
    doSearch(q)
  }

  return (
    <div style={{ maxWidth:900, margin:'0 auto', padding:'72px 20px 60px' }}>
      {/* Search bar */}
      <div style={{ display:'flex', gap:8, marginBottom:32 }}>
        <div style={{ flex:1, display:'flex', alignItems:'center', gap:10, background:'#fff', border:'1.5px solid var(--border-strong)', borderRadius:10, padding:'6px 6px 6px 16px', boxShadow:'var(--shadow-sm)' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input defaultValue={query} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&submit()} placeholder="Search any product..." style={{ flex:1, border:'none', outline:'none', fontSize:15, color:'var(--ink)', background:'none', fontFamily:'Inter,sans-serif', padding:'10px 0' }} />
        </div>
        <button onClick={submit} style={{ padding:'0 22px', borderRadius:10, background:'var(--blue)', color:'#fff', fontWeight:600, border:'none', cursor:'pointer', fontSize:14, fontFamily:'Plus Jakarta Sans,sans-serif', transition:'background .15s' }}
          onMouseEnter={e=>(e.currentTarget.style.background='#1D4ED8')}
          onMouseLeave={e=>(e.currentTarget.style.background='var(--blue)')}>
          Search
        </button>
      </div>

      {loading && (
        <div style={{ textAlign:'center', padding:'80px 0' }}>
          <div style={{ width:36, height:36, border:'3px solid var(--border)', borderTopColor:'var(--blue)', borderRadius:'50%', margin:'0 auto 16px', animation:'spin .7s linear infinite' }} />
          <div style={{ fontSize:15, color:'var(--muted)', fontWeight:500 }}>Analysing the Indian market...</div>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {!loading && answer && (
        <div>
          <div style={{ marginBottom:24, paddingBottom:18, borderBottom:'1px solid var(--border)' }}>
            <div style={{ fontSize:12, color:'var(--subtle)', marginBottom:6, textTransform:'uppercase', letterSpacing:'.8px', fontFamily:'JetBrains Mono,monospace', fontWeight:500 }}>Results for</div>
            <h1 style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:22, fontWeight:800, color:'var(--ink)', letterSpacing:'-0.5px' }}>{query||input}</h1>
          </div>

          {/* AI Answer */}
          <div style={{ background:'var(--blue-light)', border:'1px solid var(--blue-mid)', borderRadius:10, padding:'18px 22px', marginBottom:28 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
              <div style={{ width:20, height:20, background:'var(--blue)', borderRadius:4, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11 }}>🤖</div>
              <span style={{ fontSize:12, color:'var(--blue)', fontWeight:700, textTransform:'uppercase', letterSpacing:'.8px', fontFamily:'JetBrains Mono,monospace' }}>AI Analysis</span>
            </div>
            <p style={{ color:'var(--ink-2)', lineHeight:1.7, margin:0, fontSize:15 }}>{answer}</p>
          </div>

          {/* AI Product Cards */}
          {aiProducts.length > 0 && (
            <div style={{ marginBottom:36 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
                <span style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:15, fontWeight:700, color:'var(--ink)' }}>Top Recommendations</span>
                <span style={{ fontSize:12, color:'var(--muted)', background:'var(--bg-2)', borderRadius:100, padding:'2px 10px', fontWeight:500, border:'1px solid var(--border)' }}>{aiProducts.length} products</span>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:14 }}>
                {aiProducts.map((p,i)=><AiCard key={i} p={p} idx={i}/>)}
              </div>
            </div>
          )}

          {/* Live prices */}
          {serpProducts.length > 0 && (
            <div style={{ marginBottom:36 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
                <span style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:15, fontWeight:700, color:'var(--ink)' }}>Live Prices</span>
                <span style={{ fontSize:12, color:'var(--muted)', background:'var(--bg-2)', borderRadius:100, padding:'2px 10px', fontWeight:500, border:'1px solid var(--border)' }}>Google Shopping India</span>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:12 }}>
                {serpProducts.slice(0,6).map((p,i)=><SerpCard key={i} p={p} idx={i}/>)}
              </div>
            </div>
          )}

          {/* Related */}
          {related.length > 0 && (
            <div style={{ paddingTop:24, borderTop:'1px solid var(--border)' }}>
              <div style={{ fontSize:12, color:'var(--subtle)', fontWeight:600, marginBottom:10, textTransform:'uppercase', letterSpacing:'.8px', fontFamily:'JetBrains Mono,monospace' }}>Related Searches</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                {related.map((r,i)=>(
                  <button key={i} onClick={()=>{router.push(`/search?q=${encodeURIComponent(r)}`);doSearch(r)}} style={{ padding:'7px 14px', borderRadius:100, background:'var(--bg-2)', border:'1px solid var(--border)', color:'var(--muted)', fontSize:13, cursor:'pointer', fontWeight:500, transition:'all .15s' }}
                    onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor='var(--blue)';(e.currentTarget as HTMLButtonElement).style.color='var(--blue)'}}
                    onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor='var(--border)';(e.currentTarget as HTMLButtonElement).style.color='var(--muted)'}}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!loading && !answer && !called && (
        <div style={{ textAlign:'center', padding:'80px 0', color:'var(--subtle)' }}>
          <div style={{ width:56, height:56, background:'var(--blue-light)', borderRadius:16, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, margin:'0 auto 16px' }}>🔍</div>
          <div style={{ fontSize:16, fontWeight:600, color:'var(--ink-2)', marginBottom:8 }}>Ask anything about any product</div>
          <div style={{ fontSize:14, color:'var(--subtle)' }}>Try "Best AC for Delhi under ₹40,000" or "OnePlus vs Samsung"</div>
        </div>
      )}
    </div>
  )
}

export default function SearchPage() {
  return (
    <div style={{ minHeight:'100vh', background:'var(--bg-2)', fontFamily:'Inter,sans-serif' }}>
      <Nav />
      <Suspense fallback={<div style={{padding:'100px',textAlign:'center',color:'var(--muted)'}}>Loading...</div>}>
        <SearchResults />
      </Suspense>
      <Footer />
    </div>
  )
}
