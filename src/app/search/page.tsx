'use client'
export const dynamic = 'force-dynamic'
import { useState, Suspense, useRef, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

type AiProduct = { name:string; price:string; seller:string; rating:number; platform_rating:number; reviews:string; badge:string; reason:string; pros:string[]; cons:string[]; avoid_if:string }
type SerpProduct = { title:string; price:string; rating:number|null; source:string; link:string; thumbnail:string; delivery:string }

function getDirectUrl(seller: string, name: string): string {
  const q = encodeURIComponent(name), s=(seller||'').toLowerCase()
  if (s.includes('amazon'))   return `https://www.amazon.in/s?k=${q}`
  if (s.includes('flipkart')) return `https://www.flipkart.com/search?q=${q}`
  if (s.includes('nykaa'))    return `https://www.nykaa.com/search/result/?q=${q}`
  if (s.includes('meesho'))   return `https://www.meesho.com/search?q=${q}`
  if (s.includes('croma'))    return `https://www.croma.com/searchB?q=${q}`
  if (s.includes('jiomart'))  return `https://www.jiomart.com/search/${q}`
  if (s.includes('myntra'))   return `https://www.myntra.com/${q}`
  if (s.includes('tata'))     return `https://www.tatacliq.com/search/?searchCategory=all&text=${q}`
  if (s.includes('reliance')) return `https://www.reliancedigital.in/search?q=${q}`
  if (s.includes('vijay'))    return `https://www.vijaysales.com/search/${q}`
  return `https://www.amazon.in/s?k=${q}`
}

function AiCard({ p, idx }: { p:AiProduct; idx:number }) {
  const [open, setOpen] = useState(false)
  const medals = ['🥇','🥈','🥉']
  const rankColors = ['#2563EB','#6B7280','#B45309','#374151','#374151','#374151']
  const platRating = Math.min(5, p.platform_rating || Math.min(5, p.rating + 0.3))
  const aiRating = Math.min(5, Math.max(1, p.rating))
  const buyUrl = getDirectUrl(p.seller, p.name)

  return (
    <div style={{ background:'#fff', border:`1px solid ${idx===0?'#BFDBFE':'#E5E7EB'}`, borderRadius:14, overflow:'hidden', boxShadow: idx===0?'0 4px 20px rgba(37,99,235,0.1)':'0 1px 3px rgba(0,0,0,0.06)', transition:'all .2s', display:'flex', flexDirection:'column' }}
      onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.boxShadow='0 8px 28px rgba(0,0,0,0.1)'}}
      onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.boxShadow=idx===0?'0 4px 20px rgba(37,99,235,0.1)':'0 1px 3px rgba(0,0,0,0.06)'}}>

      {/* Rank banner */}
      <div style={{ background:rankColors[idx], padding:'7px 16px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontSize:12, fontWeight:700, color:'#fff', textTransform:'uppercase', letterSpacing:'.5px' }}>
          #{idx+1} {idx===0?'Best Pick':idx===1?'Runner Up':idx===2?'3rd Pick':''}
        </span>
        {idx < 3 && <span style={{ fontSize:18 }}>{medals[idx]}</span>}
      </div>

      <div style={{ padding:20, flex:1 }}>
        {p.badge && <span style={{ display:'inline-block', fontSize:11, fontWeight:600, color:'#10B981', background:'#ECFDF5', border:'1px solid #A7F3D0', borderRadius:100, padding:'2px 10px', marginBottom:10 }}>● {p.badge}</span>}

        <div style={{ fontWeight:700, fontSize:16, color:'#111827', lineHeight:1.35, marginBottom:10 }}>{p.name}</div>

        {/* Price + seller */}
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16, flexWrap:'wrap' }}>
          <span style={{ fontSize:24, fontWeight:800, color:'#2563EB' }}>{p.price}</span>
          {p.seller && <span style={{ fontSize:12, color:'#6B7280', background:'#F3F4F6', borderRadius:6, padding:'2px 8px', fontWeight:500 }}>{p.seller}</span>}
        </div>

        {/* ── THE KILLER FEATURE: AI Score vs Amazon ── */}
        <div style={{ background:'#F9FAFB', border:'1px solid #E5E7EB', borderRadius:10, padding:'14px 16px', marginBottom:16 }}>
          {/* AI Score — BIG and green */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
            <div>
              <div style={{ fontSize:11, fontWeight:600, color:'#6B7280', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:4 }}>
                ProductRating AI Score
                <span style={{ marginLeft:6, fontSize:10, color:'#9CA3AF', textTransform:'none', letterSpacing:0 }}>({p.reviews} reviews)</span>
              </div>
              <div style={{ display:'flex', alignItems:'baseline', gap:4 }}>
                <span style={{ fontSize:32, fontWeight:900, color:'#10B981', lineHeight:1 }}>{aiRating.toFixed(1)}</span>
                <span style={{ fontSize:14, color:'#9CA3AF' }}>/ 5</span>
              </div>
            </div>
            {/* Stars */}
            <div style={{ display:'flex', gap:2 }}>
              {[1,2,3,4,5].map(i => (
                <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill={i <= Math.round(aiRating) ? '#10B981' : '#E5E7EB'}>
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              ))}
            </div>
          </div>

          {/* Amazon vs Our score — the USP */}
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px', background:'#fff', borderRadius:8, border:'1px solid #F3F4F6' }}>
            <div style={{ display:'flex', alignItems:'center', gap:6, flex:1 }}>
              <span style={{ fontSize:13, color:'#6B7280' }}>Platform:</span>
              <span style={{ fontSize:15, fontWeight:700, color:'#EF4444' }}>{platRating.toFixed(1)} ⭐</span>
              <span style={{ fontSize:11, color:'#9CA3AF' }}>(with fakes)</span>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            <div style={{ display:'flex', alignItems:'center', gap:6, flex:1 }}>
              <span style={{ fontSize:13, color:'#6B7280' }}>Real:</span>
              <span style={{ fontSize:15, fontWeight:700, color:'#10B981' }}>{aiRating.toFixed(1)} ⭐</span>
              <span style={{ fontSize:11, color:'#9CA3AF' }}>(AI-adjusted)</span>
            </div>
          </div>
        </div>

        {/* One-line reason */}
        {p.reason && <p style={{ fontSize:13, color:'#374151', lineHeight:1.6, marginBottom:12 }}>{p.reason}</p>}

        {/* Pros / Cons / Avoid — expandable */}
        {(p.pros?.length > 0 || p.cons?.length > 0 || p.avoid_if) && (
          <div>
            <button onClick={() => setOpen(!open)}
              style={{ fontSize:12, color:'#2563EB', fontWeight:600, background:'none', border:'none', cursor:'pointer', padding:0, display:'flex', alignItems:'center', gap:4, marginBottom: open?10:0 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.5" style={{ transform: open?'rotate(180deg)':'none', transition:'transform .2s' }}><path d="M6 9l6 6 6-6"/></svg>
              {open ? 'Hide details' : 'See pros, cons & who should avoid'}
            </button>
            {open && (
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {p.pros?.length > 0 && (
                  <div style={{ background:'#F0FDF4', borderRadius:8, padding:'10px 12px' }}>
                    <div style={{ fontSize:11, fontWeight:700, color:'#059669', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:6 }}>👍 Pros</div>
                    {p.pros.map((pro,i) => <div key={i} style={{ fontSize:13, color:'#374151', display:'flex', gap:6, marginBottom: i<p.pros.length-1?4:0 }}><span style={{color:'#10B981',flexShrink:0}}>✓</span>{pro}</div>)}
                  </div>
                )}
                {p.cons?.length > 0 && (
                  <div style={{ background:'#FEF2F2', borderRadius:8, padding:'10px 12px' }}>
                    <div style={{ fontSize:11, fontWeight:700, color:'#DC2626', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:6 }}>👎 Cons</div>
                    {p.cons.map((con,i) => <div key={i} style={{ fontSize:13, color:'#374151', display:'flex', gap:6, marginBottom: i<p.cons.length-1?4:0 }}><span style={{color:'#EF4444',flexShrink:0}}>✗</span>{con}</div>)}
                  </div>
                )}
                {p.avoid_if && (
                  <div style={{ background:'#FFFBEB', borderRadius:8, padding:'10px 12px' }}>
                    <div style={{ fontSize:11, fontWeight:700, color:'#D97706', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:4 }}>⚠️ Avoid if…</div>
                    <div style={{ fontSize:13, color:'#374151' }}>{p.avoid_if}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Buy button */}
      <a href={buyUrl} target="_blank" rel="noopener noreferrer"
        style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'14px 20px', background:'#2563EB', color:'#fff', fontSize:14, fontWeight:700, textDecoration:'none', transition:'background .15s' }}
        onMouseEnter={e=>(e.currentTarget.style.background='#1D4ED8')}
        onMouseLeave={e=>(e.currentTarget.style.background='#2563EB')}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
        </svg>
        Search on {p.seller || 'Amazon'}
      </a>
    </div>
  )
}

function SerpCard({ p }: { p:SerpProduct }) {
  const url = getDirectUrl(p.source, p.title)
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      style={{ display:'flex', flexDirection:'column', textDecoration:'none', background:'#fff', border:'1px solid #E5E7EB', borderRadius:12, overflow:'hidden', transition:'all .15s', boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}
      onMouseEnter={e=>{(e.currentTarget as HTMLAnchorElement).style.boxShadow='0 4px 16px rgba(0,0,0,0.08)';(e.currentTarget as HTMLAnchorElement).style.borderColor='#BFDBFE'}}
      onMouseLeave={e=>{(e.currentTarget as HTMLAnchorElement).style.boxShadow='0 1px 3px rgba(0,0,0,0.05)';(e.currentTarget as HTMLAnchorElement).style.borderColor='#E5E7EB'}}>
      <div style={{ padding:14, flex:1 }}>
        <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
          {p.thumbnail && <img src={p.thumbnail} alt="" style={{ width:52, height:52, objectFit:'contain', borderRadius:8, background:'#F9FAFB', flexShrink:0 }} onError={e=>{(e.target as HTMLImageElement).style.display='none'}}/>}
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:13, fontWeight:600, color:'#111827', lineHeight:1.4, marginBottom:4 }}>{p.title}</div>
            <div style={{ fontSize:18, fontWeight:800, color:'#2563EB', marginBottom:4 }}>{p.price}</div>
            <div style={{ display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:4 }}>
              <span style={{ fontSize:12, color:'#9CA3AF' }}>{p.source}</span>
              {p.rating!==null && p.rating!==undefined && p.rating>0 &&
                <span style={{ fontSize:12, color:'#10B981', fontWeight:700 }}>{Math.min(5,p.rating).toFixed(1)}/5</span>}
            </div>
          </div>
        </div>
      </div>
      <div style={{ padding:'9px 14px', background:'#EFF6FF', borderTop:'1px solid #BFDBFE', display:'flex', justifyContent:'space-between' }}>
        <span style={{ fontSize:12, color:'#2563EB', fontWeight:500 }}>Search on {p.source||'store'}</span>
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
  const [recState, setRecState] = useState<'idle'|'recording'|'processing'|'error'>('idle')
  const [voiceError, setVoiceError] = useState('')
  const [transcript, setTranscript] = useState('')
  const [dots, setDots] = useState(1)
  const mediaRef = useRef<MediaRecorder|null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream|null>(null)

  useEffect(() => {
    if (recState !== 'recording') return
    const id = setInterval(() => setDots(d => d>=3?1:d+1), 450)
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

  const stopRec = () => { if(mediaRef.current?.state!=='inactive')mediaRef.current?.stop(); streamRef.current?.getTracks().forEach(t=>t.stop()); setRecState('processing') }
  const startRec = async () => {
    setVoiceError(''); setTranscript('')
    if (!navigator.mediaDevices?.getUserMedia) { setRecState('error'); setVoiceError('Voice not supported. Use Chrome.'); return }
    let stream: MediaStream
    try { stream=await navigator.mediaDevices.getUserMedia({audio:true}); streamRef.current=stream }
    catch { setRecState('error'); setVoiceError('Mic denied. Allow mic in browser settings.'); return }
    const mimes=['audio/webm;codecs=opus','audio/webm','audio/ogg;codecs=opus','audio/ogg']
    const mime=mimes.find(m=>MediaRecorder.isTypeSupported(m))||''
    const rec=mime?new MediaRecorder(stream,{mimeType:mime}):new MediaRecorder(stream)
    mediaRef.current=rec; chunksRef.current=[]
    rec.ondataavailable=e=>{if(e.data?.size>0)chunksRef.current.push(e.data)}
    rec.onstop=async()=>{
      const total=chunksRef.current.reduce((s,c)=>s+c.size,0)
      if(total===0){setRecState('error');setVoiceError('No audio captured.');return}
      const bt=mime?mime.split(';')[0]:'audio/webm'
      const blob=new Blob(chunksRef.current,{type:bt})
      const form=new FormData()
      form.append('file',blob,`rec.${bt.includes('ogg')?'ogg':'webm'}`)
      try {
        const r=await fetch('/api/ask',{method:'POST',body:form})
        const d=await r.json()
        if(d.transcript){setTranscript(d.transcript);setInput(d.transcript);setRecState('idle');submit(d.transcript)}
        else{setRecState('error');setVoiceError(d.error||'Could not understand. Try again.')}
      } catch{setRecState('error');setVoiceError('Network error.')}
    }
    rec.start(200); setRecState('recording')
  }
  const toggleMic=()=>recState==='recording'?stopRec():startRec()
  const isRec=recState==='recording',isProc=recState==='processing',isBusy=isRec||isProc

  return (
    <div style={{ maxWidth:980, margin:'0 auto', padding:'clamp(60px,8vw,72px) clamp(12px,4vw,20px) 80px', position:'relative' }}>

      {/* Sticky search bar */}
      <div style={{ position:'sticky', top:56, zIndex:50, background:'#F9FAFB', paddingTop:12, paddingBottom:12, marginBottom:16 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6, background:'#fff', borderRadius:12, padding:'5px 5px 5px 14px', border:`1.5px solid ${isRec?'#EF4444':'#D1D5DB'}`, boxShadow:isRec?'0 0 0 3px rgba(239,68,68,0.1)':'0 2px 8px rgba(0,0,0,0.07)', transition:'all .2s' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round" style={{flexShrink:0}}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input value={isRec?('Listening'+'.'.repeat(dots)):isProc?'Transcribing...':input} onChange={e=>{if(!isBusy)setInput(e.target.value)}} onKeyDown={e=>e.key==='Enter'&&!isBusy&&submit()} placeholder="Search any product..." readOnly={isBusy}
            style={{flex:1,border:'none',outline:'none',fontSize:16,color:isRec?'#EF4444':'#111827',background:'none',fontFamily:'Inter,sans-serif',padding:'11px 0',minWidth:0}}/>
          <button onClick={toggleMic} disabled={isProc} title="Voice search — 22 Indian languages"
            style={{width:42,height:42,borderRadius:10,border:'none',flexShrink:0,background:isRec?'#EF4444':'#F3F4F6',cursor:isProc?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'all .2s',animation:isRec?'mic-pulse 1s ease infinite':'none'}}>
            {isProc?<div style={{width:14,height:14,border:'2px solid #D1D5DB',borderTopColor:'#2563EB',borderRadius:'50%',animation:'spin .7s linear infinite'}}/>
              :isRec?<svg width="12" height="12" viewBox="0 0 24 24" fill="#fff"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
              :<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>}
          </button>
          <button onClick={()=>submit()} disabled={!input.trim()||isBusy}
            style={{padding:'0 20px',height:42,borderRadius:10,background:'#2563EB',color:'#fff',fontWeight:700,border:'none',cursor:'pointer',fontSize:14,transition:'background .15s',whiteSpace:'nowrap',flexShrink:0,opacity:input.trim()&&!isBusy?1:0.5}}
            onMouseEnter={e=>{if(input.trim())(e.currentTarget.style.background='#1D4ED8')}} onMouseLeave={e=>(e.currentTarget.style.background='#2563EB')}>
            Search
          </button>
        </div>
        {isRec&&<div style={{marginTop:6,display:'flex',alignItems:'center',gap:6,fontSize:13,color:'#EF4444',fontWeight:500}}><span style={{width:7,height:7,borderRadius:'50%',background:'#EF4444',display:'inline-block',animation:'blink 1s infinite'}}/>Listening... tap stop when done · Speak in any language</div>}
        {isProc&&<p style={{marginTop:6,fontSize:13,color:'#6B7280'}}>Transcribing with Sarvam AI...</p>}
        {recState==='error'&&voiceError&&<div style={{marginTop:6,fontSize:13,color:'#EF4444',background:'#FEF2F2',border:'1px solid #FECACA',borderRadius:6,padding:'6px 12px'}}>⚠️ {voiceError}</div>}
        {transcript&&!isBusy&&recState!=='error'&&<div style={{marginTop:6,fontSize:13,color:'#374151',background:'#F0FDF4',border:'1px solid #BBF7D0',borderRadius:6,padding:'6px 12px'}}><span style={{color:'#059669',fontWeight:600}}>You said: </span>{transcript}</div>}
      </div>

      <style>{`@keyframes mic-pulse{0%,100%{box-shadow:0 0 0 3px rgba(239,68,68,0.25)}50%{box-shadow:0 0 0 6px rgba(239,68,68,0.08)}}@keyframes spin{to{transform:rotate(360deg)}}@keyframes blink{0%,100%{opacity:1}50%{opacity:0.3}}@keyframes analyzing-dot{0%,80%,100%{transform:scale(0.6);opacity:0.4}40%{transform:scale(1);opacity:1}}`}</style>

      {/* Loading — "Analyzing" animation */}
      {loading&&(
        <div style={{textAlign:'center',padding:'60px 0'}}>
          <div style={{display:'flex',gap:8,justifyContent:'center',marginBottom:16}}>
            {[0,1,2].map(i=><div key={i} style={{width:12,height:12,borderRadius:'50%',background:'#2563EB',animation:`analyzing-dot 1.2s ${i*0.2}s infinite ease-in-out`}}/>)}
          </div>
          <div style={{fontSize:15,color:'#374151',fontWeight:600,marginBottom:6}}>Analyzing reviews across India&apos;s platforms...</div>
          <div style={{fontSize:13,color:'#9CA3AF'}}>Removing fake reviews · City data · Computing PR Score</div>
        </div>
      )}

      {!loading&&answer&&(
        <div>
          <div style={{marginBottom:20,paddingBottom:16,borderBottom:'1px solid #E5E7EB'}}>
            <div style={{fontSize:12,color:'#9CA3AF',marginBottom:6,textTransform:'uppercase',letterSpacing:'1px',fontWeight:600}}>Results for</div>
            <h1 style={{fontFamily:'Plus Jakarta Sans,sans-serif',fontSize:'clamp(18px,3vw,24px)',fontWeight:800,color:'#111827',letterSpacing:'-0.5px'}}>{query||input}</h1>
          </div>

          {/* AI Answer */}
          <div style={{background:'#EFF6FF',border:'1px solid #BFDBFE',borderRadius:12,padding:'16px 20px',marginBottom:28}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
              <span style={{fontSize:18}}>🤖</span>
              <span style={{fontSize:12,color:'#2563EB',fontWeight:700,textTransform:'uppercase',letterSpacing:'1px'}}>AI Analysis · Sarvam AI · India&apos;s LLM</span>
            </div>
            <p style={{color:'#1E3A5F',lineHeight:1.75,margin:0,fontSize:15}}>{answer}</p>
          </div>

          {/* AI Product Cards */}
          {aiProducts.length>0&&(
            <div style={{marginBottom:40}}>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:18,flexWrap:'wrap'}}>
                <span style={{fontSize:17,fontWeight:800,color:'#111827'}}>Top Recommendations</span>
                <span style={{fontSize:12,color:'#6B7280',background:'#F3F4F6',borderRadius:100,padding:'3px 12px',border:'1px solid #E5E7EB'}}>AI Score vs Platform Rating · All out of 5</span>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(min(100%,300px),1fr))',gap:16}}>
                {aiProducts.map((p,i)=><AiCard key={i} p={p} idx={i}/>)}
              </div>
            </div>
          )}

          {/* Live Prices */}
          {serpProducts.length>0&&(
            <div style={{marginBottom:36}}>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14,flexWrap:'wrap'}}>
                <span style={{fontSize:17,fontWeight:800,color:'#111827'}}>Live Prices</span>
                <span style={{fontSize:12,color:'#6B7280',background:'#F3F4F6',borderRadius:100,padding:'3px 12px',border:'1px solid #E5E7EB'}}>Click → goes to seller website</span>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(min(100%,220px),1fr))',gap:10}}>
                {serpProducts.slice(0,6).map((p,i)=><SerpCard key={i} p={p}/>)}
              </div>
            </div>
          )}

          {related.length>0&&(
            <div style={{paddingTop:20,borderTop:'1px solid #E5E7EB'}}>
              <div style={{fontSize:12,color:'#9CA3AF',fontWeight:600,marginBottom:10,textTransform:'uppercase',letterSpacing:'1px'}}>Related Searches</div>
              <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
                {related.map((r,i)=>(
                  <button key={i} onClick={()=>submit(r)} style={{padding:'7px 14px',borderRadius:100,background:'#F9FAFB',border:'1px solid #E5E7EB',color:'#374151',fontSize:13,cursor:'pointer',fontWeight:500,transition:'all .15s'}}
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

      {!loading&&!answer&&!called&&(
        <div style={{textAlign:'center',padding:'60px 0'}}>
          <div style={{width:56,height:56,background:'#EFF6FF',borderRadius:16,display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,margin:'0 auto 16px'}}>🔍</div>
          <div style={{fontSize:16,fontWeight:700,color:'#374151',marginBottom:8}}>Ask anything about any product</div>
          <div style={{fontSize:14,color:'#9CA3AF',marginBottom:16}}>Type or tap 🎙️ to speak in Hindi, English, or any Indian language</div>
          <div style={{fontSize:13,color:'#6B7280',background:'#F9FAFB',border:'1px solid #E5E7EB',borderRadius:10,padding:'10px 16px',display:'inline-block'}}>
            Try: &ldquo;₹20,000 ke andar best phone&rdquo; or &ldquo;Best AC for Delhi heat&rdquo;
          </div>
        </div>
      )}

      {/* Floating mic button for mobile */}
      <button onClick={toggleMic} disabled={isProc}
        style={{ position:'fixed', bottom:24, right:20, width:56, height:56, borderRadius:'50%', border:'none', background:isRec?'#EF4444':'#2563EB', color:'#fff', cursor:isProc?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 20px rgba(37,99,235,0.4)', zIndex:99, transition:'all .2s', animation:isRec?'mic-pulse 1s ease infinite':'none' }}
        className="mobile-fab">
        {isProc?<div style={{width:20,height:20,border:'2.5px solid rgba(255,255,255,0.4)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin .7s linear infinite'}}/>
          :isRec?<svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
          :<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>}
        <style>{`.mobile-fab{display:none}@media(max-width:768px){.mobile-fab{display:flex!important}}`}</style>
      </button>
    </div>
  )
}

export default function SearchPage() {
  return (
    <div style={{minHeight:'100vh',background:'#F9FAFB',fontFamily:'Inter,sans-serif'}}>
      <Nav/>
      <Suspense fallback={<div style={{padding:'80px 20px',textAlign:'center',color:'#9CA3AF'}}>Loading...</div>}>
        <SearchResults/>
      </Suspense>
      <Footer/>
    </div>
  )
}
