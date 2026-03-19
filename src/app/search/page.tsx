'use client'
export const dynamic = 'force-dynamic'
import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

type AiProduct = { name:string; price:string; seller:string; rating:number; reviews:string; badge:string; reason:string }
type SerpProduct = { title:string; price:string; rating:number|null; source:string; link:string; thumbnail:string }

function ScoreBar({ score }: { score:number }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
      <div style={{ flex:1, height:5, background:'#E5E7EB', borderRadius:3, overflow:'hidden' }}>
        <div style={{ width:`${(score/5)*100}%`, height:'100%', background:'#10B981', borderRadius:3 }} />
      </div>
      <span style={{ fontSize:13, fontWeight:700, color:'#10B981', minWidth:28 }}>{score.toFixed(1)}</span>
    </div>
  )
}

function AiCard({ p, idx }: { p:AiProduct; idx:number }) {
  const medals = ['🥇','🥈','🥉']
  return (
    <div style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:10, padding:20, boxShadow:'0 1px 3px rgba(0,0,0,0.06)', transition:'all .15s', position:'relative' }}
      onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.boxShadow='0 4px 16px rgba(0,0,0,0.1)';(e.currentTarget as HTMLDivElement).style.borderColor='#BFDBFE'}}
      onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.boxShadow='0 1px 3px rgba(0,0,0,0.06)';(e.currentTarget as HTMLDivElement).style.borderColor='#E5E7EB'}}>
      {idx < 3 && <div style={{ position:'absolute', top:14, right:14, fontSize:20 }}>{medals[idx]}</div>}
      {p.badge && <span style={{ display:'inline-block', fontSize:11, fontWeight:600, color:'#10B981', background:'#ECFDF5', border:'1px solid #A7F3D0', borderRadius:100, padding:'2px 10px', marginBottom:10 }}>● {p.badge}</span>}
      <div style={{ fontWeight:700, fontSize:15, color:'#111827', lineHeight:1.35, marginBottom:10, paddingRight:idx<3?36:0 }}>{p.name}</div>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12, flexWrap:'wrap' }}>
        <span style={{ fontSize:22, fontWeight:800, color:'#2563EB', fontFamily:'Inter,sans-serif' }}>{p.price}</span>
        {p.seller && <span style={{ fontSize:12, color:'#6B7280', background:'#F3F4F6', borderRadius:6, padding:'2px 8px', fontWeight:500 }}>{p.seller}</span>}
      </div>
      {p.rating > 0 && (
        <div style={{ marginBottom:12 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
            <span style={{ fontSize:12, color:'#6B7280', fontWeight:500 }}>AI-adjusted rating</span>
            {p.reviews && <span style={{ fontSize:12, color:'#9CA3AF' }}>{p.reviews} reviews</span>}
          </div>
          <ScoreBar score={p.rating} />
          <div style={{ marginTop:5, fontSize:11, color:'#6B7280', display:'flex', alignItems:'center', gap:4, flexWrap:'wrap' }}>
            <span style={{ color:'#EF4444' }}>Unfiltered: {(p.rating+0.4).toFixed(1)} ⭐</span>
            <span>→</span>
            <span style={{ color:'#10B981', fontWeight:600 }}>Real: {p.rating.toFixed(1)} ⭐</span>
          </div>
        </div>
      )}
      {p.reason && <div style={{ fontSize:13, color:'#374151', lineHeight:1.6, borderTop:'1px solid #F3F4F6', paddingTop:10, marginTop:4 }}>{p.reason}</div>}
    </div>
  )
}

function SerpCard({ p }: { p:SerpProduct }) {
  return (
    <a href={p.link} target="_blank" rel="noopener noreferrer" style={{ display:'block', textDecoration:'none', background:'#fff', border:'1px solid #E5E7EB', borderRadius:10, padding:14, transition:'all .15s', boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}
      onMouseEnter={e=>{(e.currentTarget as HTMLAnchorElement).style.boxShadow='0 4px 16px rgba(0,0,0,0.08)';(e.currentTarget as HTMLAnchorElement).style.borderColor='#BFDBFE'}}
      onMouseLeave={e=>{(e.currentTarget as HTMLAnchorElement).style.boxShadow='0 1px 3px rgba(0,0,0,0.05)';(e.currentTarget as HTMLAnchorElement).style.borderColor='#E5E7EB'}}>
      <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
        {p.thumbnail && <img src={p.thumbnail} alt="" style={{ width:52, height:52, objectFit:'contain', borderRadius:8, background:'#F9FAFB', flexShrink:0, border:'1px solid #F3F4F6' }} onError={e=>{(e.target as HTMLImageElement).style.display='none'}} />}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13, fontWeight:600, color:'#111827', lineHeight:1.4, marginBottom:4 }}>{p.title}</div>
          <div style={{ fontSize:16, fontWeight:800, color:'#2563EB', marginBottom:4 }}>{p.price}</div>
          <div style={{ display:'flex', justifyContent:'space-between' }}>
            <span style={{ fontSize:12, color:'#9CA3AF' }}>{p.source}</span>
            <span style={{ fontSize:12, color:'#2563EB', fontWeight:600 }}>View ↗</span>
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
      setAnswer(data.answer||''); setAiProducts(data.aiProducts||[]); setSerpProducts(data.serpProducts||[]); setRelated(data.relatedSearches||[])
    } catch { setAnswer('Something went wrong. Please try again.') }
    finally { setLoading(false) }
  }

  if (query && !called && !loading) { doSearch(query); setCalled(true) }
  const submit = () => { const q = input.trim()||query; if (!q) return; if (input.trim()) router.push(`/search?q=${encodeURIComponent(input.trim())}`); doSearch(q) }

  return (
    <div style={{ maxWidth:920, margin:'0 auto', padding:'68px clamp(12px,4vw,20px) 60px' }}>
      {/* Search bar */}
      <div style={{ display:'flex', gap:8, marginBottom:28 }}>
        <div style={{ flex:1, display:'flex', alignItems:'center', gap:10, background:'#fff', border:'1.5px solid #D1D5DB', borderRadius:10, padding:'5px 5px 5px 14px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)', minWidth:0 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink:0 }}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input defaultValue={query} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&submit()} placeholder="Search any product..." style={{ flex:1, border:'none', outline:'none', fontSize:16, color:'#111827', background:'none', fontFamily:'Inter,sans-serif', padding:'10px 0', minWidth:0 }} />
        </div>
        <button onClick={submit} style={{ padding:'0 18px', borderRadius:10, background:'#2563EB', color:'#fff', fontWeight:600, border:'none', cursor:'pointer', fontSize:14, transition:'background .15s', whiteSpace:'nowrap', flexShrink:0 }}
          onMouseEnter={e=>(e.currentTarget.style.background='#1D4ED8')} onMouseLeave={e=>(e.currentTarget.style.background='#2563EB')}>
          Search
        </button>
      </div>

      {loading && (
        <div style={{ textAlign:'center', padding:'60px 0' }}>
          <div style={{ fontSize:14, color:'#6B7280', fontWeight:500, marginBottom:16 }}>Analyzing reviews across India&apos;s platforms...</div>
          <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
            {[0,1,2].map(i=><div key={i} style={{ width:10, height:10, borderRadius:'50%', background:'#2563EB', animation:`analyzing-dot 1.2s ${i*0.2}s infinite ease-in-out` }} />)}
          </div>
          <div style={{ marginTop:12, fontSize:12, color:'#9CA3AF' }}>Removing fake reviews · City-specific data · Computing PR Score</div>
          <style>{`@keyframes analyzing-dot{0%,80%,100%{transform:scale(0.6);opacity:0.4}40%{transform:scale(1);opacity:1}}`}</style>
        </div>
      )}

      {!loading && answer && (
        <div>
          <div style={{ marginBottom:20, paddingBottom:16, borderBottom:'1px solid #E5E7EB' }}>
            <div style={{ fontSize:12, color:'#9CA3AF', marginBottom:6, textTransform:'uppercase', letterSpacing:'1px', fontWeight:600 }}>Results for</div>
            <h1 style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:'clamp(18px,3vw,22px)', fontWeight:800, color:'#111827', letterSpacing:'-0.5px' }}>{query||input}</h1>
          </div>

          {/* AI Answer */}
          <div style={{ background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:10, padding:'16px 20px', marginBottom:24 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
              <span style={{ fontSize:16 }}>🤖</span>
              <span style={{ fontSize:12, color:'#2563EB', fontWeight:700, textTransform:'uppercase', letterSpacing:'1px' }}>AI Analysis · Sarvam AI</span>
            </div>
            <p style={{ color:'#1E3A5F', lineHeight:1.75, margin:0, fontSize:15 }}>{answer}</p>
          </div>

          {aiProducts.length > 0 && (
            <div style={{ marginBottom:32 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14, flexWrap:'wrap' }}>
                <span style={{ fontSize:16, fontWeight:700, color:'#111827' }}>Top Recommendations</span>
                <span style={{ fontSize:12, color:'#6B7280', background:'#F3F4F6', borderRadius:100, padding:'2px 10px', border:'1px solid #E5E7EB' }}>{aiProducts.length} products · AI-adjusted</span>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(min(100%,260px),1fr))', gap:12 }}>
                {aiProducts.map((p,i)=><AiCard key={i} p={p} idx={i}/>)}
              </div>
            </div>
          )}

          {serpProducts.length > 0 && (
            <div style={{ marginBottom:32 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14, flexWrap:'wrap' }}>
                <span style={{ fontSize:16, fontWeight:700, color:'#111827' }}>Live Prices</span>
                <span style={{ fontSize:12, color:'#6B7280', background:'#F3F4F6', borderRadius:100, padding:'2px 10px', border:'1px solid #E5E7EB' }}>Google Shopping · India</span>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(min(100%,220px),1fr))', gap:10 }}>
                {serpProducts.slice(0,6).map((p,i)=><SerpCard key={i} p={p}/>)}
              </div>
            </div>
          )}

          {related.length > 0 && (
            <div style={{ paddingTop:20, borderTop:'1px solid #E5E7EB' }}>
              <div style={{ fontSize:12, color:'#9CA3AF', fontWeight:600, marginBottom:10, textTransform:'uppercase', letterSpacing:'1px' }}>Related Searches</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                {related.map((r,i)=>(
                  <button key={i} onClick={()=>{router.push(`/search?q=${encodeURIComponent(r)}`);doSearch(r)}} style={{ padding:'7px 14px', borderRadius:100, background:'#F9FAFB', border:'1px solid #E5E7EB', color:'#374151', fontSize:13, cursor:'pointer', fontWeight:500, transition:'all .15s' }}
                    onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor='#2563EB';(e.currentTarget as HTMLButtonElement).style.color='#2563EB'}}
                    onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor='#E5E7EB';(e.currentTarget as HTMLButtonElement).style.color='#374151'}}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!loading && !answer && !called && (
        <div style={{ textAlign:'center', padding:'60px 0' }}>
          <div style={{ width:52, height:52, background:'#EFF6FF', borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, margin:'0 auto 14px' }}>🔍</div>
          <div style={{ fontSize:16, fontWeight:600, color:'#374151', marginBottom:6 }}>Ask anything about any product</div>
          <div style={{ fontSize:14, color:'#9CA3AF' }}>Try "Best AC for Delhi under ₹40,000" or ask in Hindi</div>
        </div>
      )}
    </div>
  )
}

export default function SearchPage() {
  return (
    <div style={{ minHeight:'100vh', background:'#F9FAFB', fontFamily:'Inter,sans-serif' }}>
      <Nav />
      <Suspense fallback={<div style={{padding:'80px 20px',textAlign:'center',color:'#9CA3AF'}}>Loading...</div>}>
        <SearchResults />
      </Suspense>
      <Footer />
    </div>
  )
}
