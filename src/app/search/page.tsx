'use client'
export const dynamic = 'force-dynamic'
import { useState, Suspense, useRef, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

type AiProduct = { name:string; price:string; seller:string; rating:number; platform_rating:number; reviews:string; badge:string; reason:string }
type SerpProduct = { title:string; price:string; rating:number|null; source:string; link:string; thumbnail:string; delivery:string }

// Map seller name → direct search URL on that platform
function getBuyUrl(seller: string, productName: string): string {
  const q = encodeURIComponent(productName)
  const s = (seller || '').toLowerCase()
  if (s.includes('flipkart'))  return `https://www.flipkart.com/search?q=${q}`
  if (s.includes('amazon'))    return `https://www.amazon.in/s?k=${q}`
  if (s.includes('nykaa'))     return `https://www.nykaa.com/search/result/?q=${q}`
  if (s.includes('meesho'))    return `https://www.meesho.com/search?q=${q}`
  if (s.includes('croma'))     return `https://www.croma.com/searchB?q=${q}`
  if (s.includes('jiomart'))   return `https://www.jiomart.com/search/${q}`
  if (s.includes('myntra'))    return `https://www.myntra.com/${q}`
  if (s.includes('tata'))      return `https://www.tatacliq.com/search/?searchCategory=all&text=${q}`
  if (s.includes('reliance'))  return `https://www.reliancedigital.in/search?q=${q}`
  if (s.includes('vijay'))     return `https://www.vijaysales.com/search/${q}`
  // fallback — Amazon India
  return `https://www.amazon.in/s?k=${q}`
}

function StarRating({ score, max=5 }: { score:number; max?:number }) {
  const pct = (score / max) * 100
  const full = Math.floor(score)
  const half = score - full >= 0.4
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
      {/* Star icons */}
      <div style={{ display:'flex', gap:1 }}>
        {[1,2,3,4,5].map(i => (
          <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill={i <= full ? '#10B981' : i === full+1 && half ? 'url(#half)' : '#E5E7EB'}>
            <defs><linearGradient id="half"><stop offset="50%" stopColor="#10B981"/><stop offset="50%" stopColor="#E5E7EB"/></linearGradient></defs>
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        ))}
      </div>
      {/* Progress bar */}
      <div style={{ flex:1, height:6, background:'#E5E7EB', borderRadius:3, overflow:'hidden', minWidth:60 }}>
        <div style={{ width:`${pct}%`, height:'100%', background:'#10B981', borderRadius:3 }} />
      </div>
      <span style={{ fontSize:15, fontWeight:800, color:'#10B981', minWidth:32 }}>{score.toFixed(1)}</span>
      <span style={{ fontSize:12, color:'#9CA3AF', whiteSpace:'nowrap' }}>/ {max}</span>
    </div>
  )
}

function AiCard({ p, idx }: { p:AiProduct; idx:number }) {
  const medals = ['🥇','🥈','🥉']
  const buyUrl = getBuyUrl(p.seller, p.name)
  const platformRating = Math.min(5, p.platform_rating || Math.min(5, p.rating + 0.3))

  return (
    <div style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:12, overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,0.06)', transition:'all .15s', display:'flex', flexDirection:'column' }}
      onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.boxShadow='0 4px 16px rgba(0,0,0,0.1)';(e.currentTarget as HTMLDivElement).style.borderColor='#BFDBFE'}}
      onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.boxShadow='0 1px 3px rgba(0,0,0,0.06)';(e.currentTarget as HTMLDivElement).style.borderColor='#E5E7EB'}}>

      <div style={{ padding:20, flex:1 }}>
        {/* Top row: badge + medal */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
          {p.badge
            ? <span style={{ fontSize:11, fontWeight:600, color:'#10B981', background:'#ECFDF5', border:'1px solid #A7F3D0', borderRadius:100, padding:'2px 10px' }}>● {p.badge}</span>
            : <span />}
          {idx < 3 && <span style={{ fontSize:20 }}>{medals[idx]}</span>}
        </div>

        <div style={{ fontWeight:700, fontSize:15, color:'#111827', lineHeight:1.35, marginBottom:10 }}>{p.name}</div>

        {/* Price + seller */}
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16, flexWrap:'wrap' }}>
          <span style={{ fontSize:22, fontWeight:800, color:'#2563EB' }}>{p.price}</span>
          {p.seller && <span style={{ fontSize:12, color:'#6B7280', background:'#F3F4F6', borderRadius:6, padding:'2px 8px', fontWeight:500 }}>{p.seller}</span>}
        </div>

        {/* Rating section */}
        {p.rating > 0 && (
          <div style={{ marginBottom:16 }}>
            {/* Our AI score */}
            <div style={{ marginBottom:6 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                <span style={{ fontSize:12, fontWeight:600, color:'#374151' }}>ProductRating AI Score</span>
                {p.reviews && <span style={{ fontSize:12, color:'#9CA3AF' }}>{p.reviews} reviews</span>}
              </div>
              <StarRating score={p.rating} />
            </div>

            {/* Comparison box */}
            <div style={{ marginTop:10, background:'#F9FAFB', borderRadius:8, padding:'10px 12px', border:'1px solid #F3F4F6' }}>
              <div style={{ fontSize:11, fontWeight:600, color:'#6B7280', marginBottom:6, textTransform:'uppercase', letterSpacing:'.5px' }}>How we calculate</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr auto 1fr', gap:6, alignItems:'center' }}>
                <div style={{ background:'#FEF2F2', borderRadius:6, padding:'6px 10px', textAlign:'center' }}>
                  <div style={{ fontSize:10, color:'#EF4444', fontWeight:600, marginBottom:2 }}>Platform shows</div>
                  <div style={{ fontSize:16, fontWeight:800, color:'#EF4444' }}>{platformRating.toFixed(1)}/5</div>
                  <div style={{ fontSize:10, color:'#9CA3AF' }}>incl. fake reviews</div>
                </div>
                <div style={{ fontSize:16, color:'#9CA3AF', textAlign:'center' }}>→</div>
                <div style={{ background:'#ECFDF5', borderRadius:6, padding:'6px 10px', textAlign:'center' }}>
                  <div style={{ fontSize:10, color:'#10B981', fontWeight:600, marginBottom:2 }}>Our score</div>
                  <div style={{ fontSize:16, fontWeight:800, color:'#10B981' }}>{p.rating.toFixed(1)}/5</div>
                  <div style={{ fontSize:10, color:'#9CA3AF' }}>fake reviews removed</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {p.reason && (
          <div style={{ fontSize:13, color:'#374151', lineHeight:1.6, borderTop:'1px solid #F3F4F6', paddingTop:10 }}>{p.reason}</div>
        )}
      </div>

      {/* Buy button */}
      <a href={buyUrl} target="_blank" rel="noopener noreferrer" style={{
        display:'flex', alignItems:'center', justifyContent:'center', gap:8,
        padding:'13px 20px', background:'#2563EB', color:'#fff',
        fontSize:14, fontWeight:600, textDecoration:'none', transition:'background .15s',
      }}
        onMouseEnter={e=>(e.currentTarget.style.background='#1D4ED8')}
        onMouseLeave={e=>(e.currentTarget.style.background='#2563EB')}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
          <path d="M16 10a4 4 0 0 1-8 0"/>
        </svg>
        Buy on {p.seller || 'Amazon'}
      </a>
    </div>
  )
}

function SerpCard({ p }: { p:SerpProduct }) {
  return (
    <a href={p.link} target="_blank" rel="noopener noreferrer" style={{ display:'flex', flexDirection:'column', textDecoration:'none', background:'#fff', border:'1px solid #E5E7EB', borderRadius:12, overflow:'hidden', transition:'all .15s', boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}
      onMouseEnter={e=>{(e.currentTarget as HTMLAnchorElement).style.boxShadow='0 4px 16px rgba(0,0,0,0.08)';(e.currentTarget as HTMLAnchorElement).style.borderColor='#BFDBFE'}}
      onMouseLeave={e=>{(e.currentTarget as HTMLAnchorElement).style.boxShadow='0 1px 3px rgba(0,0,0,0.05)';(e.currentTarget as HTMLAnchorElement).style.borderColor='#E5E7EB'}}>
      <div style={{ padding:14, flex:1 }}>
        <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
          {p.thumbnail && <img src={p.thumbnail} alt="" style={{ width:56, height:56, objectFit:'contain', borderRadius:8, background:'#F9FAFB', flexShrink:0, border:'1px solid #F3F4F6' }} onError={e=>{(e.target as HTMLImageElement).style.display='none'}} />}
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:13, fontWeight:600, color:'#111827', lineHeight:1.4, marginBottom:4 }}>{p.title}</div>
            <div style={{ fontSize:18, fontWeight:800, color:'#2563EB', marginBottom:4 }}>{p.price}</div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:4 }}>
              <span style={{ fontSize:12, color:'#9CA3AF', fontWeight:500 }}>{p.source}</span>
              {p.delivery && <span style={{ fontSize:11, color:'#10B981', fontWeight:500 }}>{p.delivery}</span>}
            </div>
            {p.rating && (
              <div style={{ marginTop:6, display:'flex', alignItems:'center', gap:4 }}>
                <span style={{ fontSize:12, color:'#10B981', fontWeight:700 }}>{p.rating.toFixed(1)}/5</span>
                <span style={{ fontSize:12, color:'#9CA3AF' }}>on platform</span>
              </div>
            )}
          </div>
        </div>
      </div>
      <div style={{ padding:'10px 14px', background:'#EFF6FF', borderTop:'1px solid #BFDBFE', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <span style={{ fontSize:12, color:'#2563EB', fontWeight:500 }}>Buy directly on {p.source || 'store'}</span>
        <span style={{ fontSize:13, color:'#2563EB', fontWeight:700 }}>Buy now ↗</span>
      </div>
    </a>
  )
}

function SearchResults() {
  const sp = useSearchParams(), router = useRouter()
  const query = sp.get('q') || ''
  const [input, setInput] = useState(query)
  const [loading, setLoading] = useState(false)
  const [called, setCalled] = useState(false)
  const [answer, setAnswer] = useState('')
  const [aiProducts, setAiProducts] = useState<AiProduct[]>([])
  const [serpProducts, setSerpProducts] = useState<SerpProduct[]>([])
  const [related, setRelated] = useState<string[]>([])

  // Voice
  const [recState, setRecState] = useState<'idle'|'recording'|'processing'|'error'>('idle')
  const [voiceError, setVoiceError] = useState('')
  const [dots, setDots] = useState(1)
  const mediaRef = useRef<MediaRecorder|null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream|null>(null)

  useEffect(() => {
    if (recState !== 'recording') return
    const id = setInterval(() => setDots(d => d >= 3 ? 1 : d + 1), 500)
    return () => clearInterval(id)
  }, [recState])

  const doSearch = async (q: string) => {
    if (!q.trim()) return
    setLoading(true); setCalled(true); setAnswer(''); setAiProducts([]); setSerpProducts([]); setRelated([])
    try {
      const r = await fetch('/api/ask', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ question:q }) })
      const d = await r.json()
      setAnswer(d.answer||''); setAiProducts(d.aiProducts||[]); setSerpProducts(d.serpProducts||[]); setRelated(d.relatedSearches||[])
    } catch { setAnswer('Something went wrong.') } finally { setLoading(false) }
  }

  if (query && !called && !loading) { doSearch(query); setCalled(true) }
  const submit = (q?: string) => { const t=(q||input).trim(); if(!t)return; router.push(`/search?q=${encodeURIComponent(t)}`); doSearch(t) }

  const stopRec = () => { if(mediaRef.current&&mediaRef.current.state!=='inactive')mediaRef.current.stop(); if(streamRef.current)streamRef.current.getTracks().forEach(t=>t.stop()); setRecState('processing') }
  const startRec = async () => {
    setVoiceError('')
    if (!navigator.mediaDevices?.getUserMedia) { setRecState('error'); setVoiceError('Voice not supported. Use Chrome.'); return }
    let stream: MediaStream
    try { stream = await navigator.mediaDevices.getUserMedia({ audio:true }); streamRef.current = stream }
    catch { setRecState('error'); setVoiceError('Mic denied. Allow mic in browser settings.'); return }
    const mimes = ['audio/webm;codecs=opus','audio/webm','audio/ogg;codecs=opus','audio/ogg']
    const mime = mimes.find(m => MediaRecorder.isTypeSupported(m)) || ''
    const rec = mime ? new MediaRecorder(stream, { mimeType:mime }) : new MediaRecorder(stream)
    mediaRef.current = rec; chunksRef.current = []
    rec.ondataavailable = e => { if(e.data?.size>0)chunksRef.current.push(e.data) }
    rec.onstop = async () => {
      const total = chunksRef.current.reduce((s,c)=>s+c.size,0)
      if (total===0) { setRecState('error'); setVoiceError('No audio captured.'); return }
      const bt = mime?mime.split(';')[0]:'audio/webm'
      const blob = new Blob(chunksRef.current, { type:bt })
      const form = new FormData()
      form.append('file', blob, `rec.${bt.includes('ogg')?'ogg':'webm'}`)
      try {
        const r = await fetch('/api/ask', { method:'POST', body:form })
        const d = await r.json()
        if (d.transcript) { setInput(d.transcript); setRecState('idle'); submit(d.transcript) }
        else { setRecState('error'); setVoiceError(d.error||'Could not understand. Try again.') }
      } catch { setRecState('error'); setVoiceError('Network error.') }
    }
    rec.start(250); setRecState('recording')
  }

  const toggleMic = () => recState==='recording' ? stopRec() : startRec()
  const isRec = recState==='recording', isProc = recState==='processing', isBusy = isRec||isProc

  return (
    <div style={{ maxWidth:960, margin:'0 auto', padding:'68px clamp(12px,4vw,20px) 60px' }}>
      {/* Search bar */}
      <div style={{ marginBottom:28 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6, background:'#fff', borderRadius:12, padding:'5px 5px 5px 14px', border:`1.5px solid ${isRec?'#EF4444':'#D1D5DB'}`, boxShadow:isRec?'0 0 0 3px rgba(239,68,68,0.1)':'0 1px 4px rgba(0,0,0,0.06)', transition:'all .2s' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink:0 }}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input value={isRec?('Listening'+'.'.repeat(dots)):isProc?'Transcribing...':input} onChange={e=>{if(!isBusy)setInput(e.target.value)}} onKeyDown={e=>e.key==='Enter'&&!isBusy&&submit()} placeholder="Search any product..." readOnly={isBusy}
            style={{ flex:1, border:'none', outline:'none', fontSize:16, color:isRec?'#EF4444':'#111827', background:'none', fontFamily:'Inter,sans-serif', padding:'10px 0', minWidth:0 }} />
          <button onClick={toggleMic} disabled={isProc} title="Voice search — 22 Indian languages"
            style={{ width:40, height:40, borderRadius:8, border:'none', flexShrink:0, background:isRec?'#EF4444':'#F3F4F6', cursor:isProc?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all .2s', animation:isRec?'mic-pulse 1s ease infinite':'none' }}>
            {isProc ? <div style={{ width:14, height:14, border:'2px solid #D1D5DB', borderTopColor:'#2563EB', borderRadius:'50%', animation:'spin .7s linear infinite' }} />
              : isRec ? <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
              : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>}
          </button>
          <button onClick={()=>submit()} disabled={!input.trim()||isBusy}
            style={{ padding:'0 18px', height:40, borderRadius:8, background:'#2563EB', color:'#fff', fontWeight:600, border:'none', cursor:'pointer', fontSize:14, transition:'background .15s', whiteSpace:'nowrap', flexShrink:0, opacity:input.trim()&&!isBusy?1:0.5 }}
            onMouseEnter={e=>{if(input.trim())(e.currentTarget.style.background='#1D4ED8')}} onMouseLeave={e=>(e.currentTarget.style.background='#2563EB')}>
            Search
          </button>
        </div>
        {isRec && <div style={{ marginTop:8, display:'flex', alignItems:'center', gap:6, fontSize:13, color:'#EF4444', fontWeight:500 }}><span style={{ width:7, height:7, borderRadius:'50%', background:'#EF4444', display:'inline-block', animation:'blink 1s infinite' }} />Recording... tap stop when done</div>}
        {isProc && <p style={{ marginTop:8, fontSize:13, color:'#6B7280' }}>Transcribing with Sarvam AI...</p>}
        {recState==='error'&&voiceError && <div style={{ marginTop:8, fontSize:13, color:'#EF4444', background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:6, padding:'6px 12px' }}>⚠️ {voiceError}</div>}
        <style>{`@keyframes mic-pulse{0%,100%{box-shadow:0 0 0 3px rgba(239,68,68,0.25)}50%{box-shadow:0 0 0 6px rgba(239,68,68,0.08)}}@keyframes spin{to{transform:rotate(360deg)}}@keyframes blink{0%,100%{opacity:1}50%{opacity:0.3}}@keyframes analyzing-dot{0%,80%,100%{transform:scale(0.6);opacity:0.4}40%{transform:scale(1);opacity:1}}`}</style>
      </div>

      {loading && (
        <div style={{ textAlign:'center', padding:'60px 0' }}>
          <div style={{ fontSize:14, color:'#6B7280', fontWeight:500, marginBottom:16 }}>Analyzing reviews across India&apos;s platforms...</div>
          <div style={{ display:'flex', gap:8, justifyContent:'center', marginBottom:12 }}>{[0,1,2].map(i=><div key={i} style={{ width:10, height:10, borderRadius:'50%', background:'#2563EB', animation:`analyzing-dot 1.2s ${i*0.2}s infinite ease-in-out` }} />)}</div>
          <div style={{ fontSize:12, color:'#9CA3AF' }}>Removing fake reviews · City data · Computing PR Score</div>
        </div>
      )}

      {!loading && answer && (
        <div>
          <div style={{ marginBottom:20, paddingBottom:16, borderBottom:'1px solid #E5E7EB' }}>
            <div style={{ fontSize:12, color:'#9CA3AF', marginBottom:6, textTransform:'uppercase', letterSpacing:'1px', fontWeight:600 }}>Results for</div>
            <h1 style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:'clamp(18px,3vw,22px)', fontWeight:800, color:'#111827', letterSpacing:'-0.5px' }}>{query||input}</h1>
          </div>

          <div style={{ background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:10, padding:'16px 20px', marginBottom:28 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
              <span style={{ fontSize:16 }}>🤖</span>
              <span style={{ fontSize:12, color:'#2563EB', fontWeight:700, textTransform:'uppercase', letterSpacing:'1px' }}>AI Analysis · Sarvam AI</span>
            </div>
            <p style={{ color:'#1E3A5F', lineHeight:1.75, margin:0, fontSize:15 }}>{answer}</p>
          </div>

          {aiProducts.length > 0 && (
            <div style={{ marginBottom:36 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16, flexWrap:'wrap' }}>
                <span style={{ fontSize:16, fontWeight:700, color:'#111827' }}>Top Recommendations</span>
                <span style={{ fontSize:12, color:'#6B7280', background:'#F3F4F6', borderRadius:100, padding:'2px 10px', border:'1px solid #E5E7EB' }}>{aiProducts.length} products · All scores out of 5</span>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(min(100%,280px),1fr))', gap:14 }}>
                {aiProducts.map((p,i)=><AiCard key={i} p={p} idx={i}/>)}
              </div>
            </div>
          )}

          {serpProducts.length > 0 && (
            <div style={{ marginBottom:36 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16, flexWrap:'wrap' }}>
                <span style={{ fontSize:16, fontWeight:700, color:'#111827' }}>Live Prices</span>
                <span style={{ fontSize:12, color:'#6B7280', background:'#F3F4F6', borderRadius:100, padding:'2px 10px', border:'1px solid #E5E7EB' }}>Click to buy directly</span>
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
                  <button key={i} onClick={()=>submit(r)} style={{ padding:'7px 14px', borderRadius:100, background:'#F9FAFB', border:'1px solid #E5E7EB', color:'#374151', fontSize:13, cursor:'pointer', fontWeight:500, transition:'all .15s' }}
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
          <div style={{ fontSize:14, color:'#9CA3AF' }}>Type or tap 🎙️ to speak in any Indian language</div>
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
