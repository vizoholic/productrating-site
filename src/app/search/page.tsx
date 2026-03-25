'use client'
export const dynamic = 'force-dynamic'
import { useState, Suspense, useRef, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Nav from '@/components/Nav'

type AiProduct = { name:string; price:string; seller:string; rating:number; platform_rating:number; reviews:string; badge:string; reason:string; pros:string[]; cons:string[]; avoid_if:string }
type SerpProduct = { title:string; price:string; rating:number|null; source:string; link:string; thumbnail:string; delivery:string }

function getDirectUrl(seller:string, name:string):string{
  const q=encodeURIComponent(name),s=(seller||'').toLowerCase().trim()
  const known:[string[],(q:string)=>string][]=[
    [['amazon'],q=>`https://www.amazon.in/s?k=${q}`],
    [['flipkart'],q=>`https://www.flipkart.com/search?q=${q}`],
    [['nykaa'],q=>`https://www.nykaa.com/search/result/?q=${q}`],
    [['meesho'],q=>`https://www.meesho.com/search?q=${q}`],
    [['croma'],q=>`https://www.croma.com/searchB?q=${q}`],
    [['jiomart'],q=>`https://www.jiomart.com/search/${q}`],
    [['myntra'],q=>`https://www.myntra.com/${q}`],
    [['tata cliq','tatacliq'],q=>`https://www.tatacliq.com/search/?searchCategory=all&text=${q}`],
    [['bigbasket'],q=>`https://www.bigbasket.com/ps/?q=${q}`],
    [['reliance'],q=>`https://www.reliancedigital.in/search?q=${q}`],
    [['vijay'],q=>`https://www.vijaysales.com/search/${q}`],
    [['ajio'],q=>`https://www.ajio.com/search/?text=${q}`],
    [['1mg'],q=>`https://www.1mg.com/search/all?name=${q}`],
    [['decathlon'],q=>`https://www.decathlon.in/search?Ntt=${q}`],
  ]
  for(const [keys,fn] of known) if(keys.some(k=>s.includes(k))) return fn(q)
  const dm=s.match(/([a-z0-9][a-z0-9-]*\.[a-z]{2,})/)
  if(dm) return `https://www.${dm[1]}/search?q=${q}`
  return `https://www.amazon.in/s?k=${q}`
}

function RatingBar({score}:{score:number}){
  return(
    <div style={{display:'flex',alignItems:'center',gap:8}}>
      <div style={{flex:1,height:5,background:'#F0EFed',borderRadius:3,overflow:'hidden'}}>
        <div style={{width:`${(score/5)*100}%`,height:'100%',background:'linear-gradient(90deg,#16A34A,#22C55E)',borderRadius:3,transition:'width 0.6s ease'}}/>
      </div>
      <span style={{fontSize:13,fontWeight:700,color:'#16A34A',minWidth:28,fontFamily:'Geist Mono, monospace'}}>{score.toFixed(1)}</span>
    </div>
  )
}

function AiCard({p,idx}:{p:AiProduct;idx:number}){
  const [open,setOpen]=useState(idx===0)
  const medals=['🥇','🥈','🥉']
  const rankLabel=['#1 Best Pick','#2 Runner Up','#3 Third Pick'][idx]||`#${idx+1}`
  const rankColors=['#5B4FCF','#57534E','#A0782A']
  const platRating=Math.min(5,p.platform_rating||Math.min(5,p.rating+0.3))
  const aiRating=Math.min(5,Math.max(1,p.rating))
  const buyUrl=getDirectUrl(p.seller,p.name)

  return(
    <div style={{background:'#FFFFFF',border:`1.5px solid ${idx===0?'rgba(91,79,207,0.25)':'rgba(0,0,0,0.08)'}`,borderRadius:18,overflow:'hidden',transition:'all 0.25s ease',display:'flex',flexDirection:'column',boxShadow:idx===0?'0 8px 32px rgba(91,79,207,0.1), 0 2px 8px rgba(0,0,0,0.06)':'0 2px 8px rgba(0,0,0,0.06)',animation:`card-in 0.4s ${idx*0.1}s ease both`}}
      onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.transform='translateY(-4px)';(e.currentTarget as HTMLDivElement).style.boxShadow=idx===0?'0 16px 48px rgba(91,79,207,0.15), 0 4px 12px rgba(0,0,0,0.08)':'0 12px 32px rgba(0,0,0,0.1)'}}
      onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.transform='translateY(0)';(e.currentTarget as HTMLDivElement).style.boxShadow=idx===0?'0 8px 32px rgba(91,79,207,0.1), 0 2px 8px rgba(0,0,0,0.06)':'0 2px 8px rgba(0,0,0,0.06)'}}>

      {/* Rank bar */}
      <div style={{padding:'10px 20px',background:idx===0?'rgba(91,79,207,0.06)':'#FAFAF9',borderBottom:'1px solid rgba(0,0,0,0.05)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <span style={{fontSize:11,fontWeight:700,color:rankColors[idx]||'#A8A29E',fontFamily:'Geist Mono, monospace',letterSpacing:'1px',textTransform:'uppercase'}}>{rankLabel}</span>
        <span style={{fontSize:18}}>{medals[idx]||''}</span>
      </div>

      <div style={{padding:22,flex:1}}>
        {p.badge&&<span style={{display:'inline-block',fontSize:11,fontWeight:600,color:'#16A34A',background:'rgba(22,163,74,0.08)',border:'1px solid rgba(22,163,74,0.2)',borderRadius:100,padding:'2px 12px',marginBottom:12,fontFamily:'Geist Mono, monospace'}}>● {p.badge}</span>}

        <h3 style={{fontWeight:700,fontSize:17,color:'#111110',lineHeight:1.3,marginBottom:14}}>{p.name}</h3>

        {/* Price */}
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:18,flexWrap:'wrap'}}>
          <span style={{fontSize:28,fontWeight:800,color:'#5B4FCF',letterSpacing:'-1px',fontFamily:'Sora,sans-serif'}}>{p.price}</span>
          {p.seller&&<span style={{fontSize:12,color:'#78716C',background:'#F5F4F2',borderRadius:6,padding:'3px 10px',fontWeight:500,border:'1px solid rgba(0,0,0,0.07)'}}>{p.seller}</span>}
        </div>

        {/* AI Score vs Platform — THE USP */}
        <div style={{background:'#F9F8F7',borderRadius:14,padding:18,marginBottom:16,border:'1px solid rgba(0,0,0,0.06)'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14}}>
            <div>
              <div style={{fontSize:10,color:'#A8A29E',fontFamily:'Geist Mono, monospace',letterSpacing:'0.5px',marginBottom:6}}>
                PR AI SCORE {p.reviews&&<span>· {p.reviews} reviews</span>}
              </div>
              <div style={{display:'flex',alignItems:'baseline',gap:4}}>
                <span style={{fontSize:40,fontWeight:800,color:'#16A34A',lineHeight:1,fontFamily:'Sora,sans-serif',letterSpacing:'-2px'}}>{aiRating.toFixed(1)}</span>
                <span style={{fontSize:14,color:'#A8A29E'}}>/5</span>
              </div>
            </div>
            <div style={{display:'flex',gap:2,paddingTop:8}}>
              {[1,2,3,4,5].map(n=>(
                <svg key={n} width="15" height="15" viewBox="0 0 24 24" fill={n<=Math.round(aiRating)?'#16A34A':'#E7E5E4'}>
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              ))}
            </div>
          </div>
          <RatingBar score={aiRating}/>

          {/* Comparison */}
          <div style={{marginTop:14,display:'flex',alignItems:'center',gap:8,padding:'10px 14px',background:'#FFFFFF',borderRadius:10,border:'1px solid rgba(0,0,0,0.06)'}}>
            <div style={{flex:1}}>
              <div style={{fontSize:10,color:'#A8A29E',fontFamily:'Geist Mono, monospace',marginBottom:2}}>PLATFORM SHOWS</div>
              <div style={{fontSize:14,fontWeight:700,color:'#DC2626'}}>{platRating.toFixed(1)} ⭐ <span style={{fontSize:10,color:'#A8A29E',fontWeight:400}}>incl. fakes</span></div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D6D3D1" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            <div style={{flex:1}}>
              <div style={{fontSize:10,color:'#A8A29E',fontFamily:'Geist Mono, monospace',marginBottom:2}}>REAL SCORE</div>
              <div style={{fontSize:14,fontWeight:700,color:'#16A34A'}}>{aiRating.toFixed(1)} ⭐ <span style={{fontSize:10,color:'#A8A29E',fontWeight:400}}>AI-adjusted</span></div>
            </div>
          </div>
        </div>

        {/* Why this result */}
        {p.reason&&(
          <div style={{marginBottom:14,padding:'12px 16px',background:'rgba(91,79,207,0.05)',borderRadius:10,borderLeft:'3px solid rgba(91,79,207,0.4)'}}>
            <div style={{fontSize:10,color:'#5B4FCF',fontFamily:'Geist Mono, monospace',letterSpacing:'1px',marginBottom:4}}>WHY THIS RESULT</div>
            <p style={{fontSize:13,color:'#57534E',lineHeight:1.65}}>{p.reason}</p>
          </div>
        )}

        {/* Pros/Cons toggle */}
        {(p.pros?.length>0||p.cons?.length>0||p.avoid_if)&&(
          <div>
            <button onClick={()=>setOpen(!open)}
              style={{fontSize:12,color:'#5B4FCF',fontWeight:500,background:'none',border:'none',cursor:'pointer',padding:'0 0 12px',display:'flex',alignItems:'center',gap:5,fontFamily:'Geist Mono, monospace',letterSpacing:'0.5px'}}>
              <span style={{display:'inline-block',transform:open?'rotate(90deg)':'rotate(0)',transition:'transform 0.2s',fontSize:10}}>▶</span>
              {open?'HIDE DETAILS':'PROS · CONS · AVOID IF'}
            </button>
            {open&&(
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {p.pros?.length>0&&(
                  <div style={{background:'rgba(22,163,74,0.06)',border:'1px solid rgba(22,163,74,0.15)',borderRadius:10,padding:'12px 16px'}}>
                    <div style={{fontSize:10,color:'#16A34A',fontFamily:'Geist Mono, monospace',letterSpacing:'1px',marginBottom:8}}>PROS</div>
                    {p.pros.map((pro,i)=><div key={i} style={{fontSize:13,color:'#374151',display:'flex',gap:8,marginBottom:i<p.pros.length-1?6:0}}><span style={{color:'#16A34A',flexShrink:0}}>+</span>{pro}</div>)}
                  </div>
                )}
                {p.cons?.length>0&&(
                  <div style={{background:'rgba(220,38,38,0.05)',border:'1px solid rgba(220,38,38,0.12)',borderRadius:10,padding:'12px 16px'}}>
                    <div style={{fontSize:10,color:'#DC2626',fontFamily:'Geist Mono, monospace',letterSpacing:'1px',marginBottom:8}}>CONS</div>
                    {p.cons.map((con,i)=><div key={i} style={{fontSize:13,color:'#374151',display:'flex',gap:8}}><span style={{color:'#DC2626',flexShrink:0}}>−</span>{con}</div>)}
                  </div>
                )}
                {p.avoid_if&&(
                  <div style={{background:'rgba(180,83,9,0.06)',border:'1px solid rgba(180,83,9,0.14)',borderRadius:10,padding:'12px 16px'}}>
                    <span style={{fontSize:10,color:'#B45309',fontFamily:'Geist Mono, monospace',letterSpacing:'1px'}}>AVOID IF </span>
                    <span style={{fontSize:13,color:'#374151'}}>{p.avoid_if}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Buy button */}
      <a href={buyUrl} target="_blank" rel="noopener noreferrer"
        style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,padding:'14px 20px',background:idx===0?'linear-gradient(135deg,#5B4FCF,#7C6FCD)':'#F5F4F2',color:idx===0?'#fff':'#57534E',fontSize:14,fontWeight:600,textDecoration:'none',transition:'all 0.2s',borderTop:'1px solid rgba(0,0,0,0.06)'}}
        onMouseEnter={e=>{e.currentTarget.style.background=idx===0?'linear-gradient(135deg,#6B5FDF,#8C7EDD)':'#EEECE9'}}
        onMouseLeave={e=>{e.currentTarget.style.background=idx===0?'linear-gradient(135deg,#5B4FCF,#7C6FCD)':'#F5F4F2'}}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        Search on {p.seller||'Amazon'}
      </a>
    </div>
  )
}

function SerpCard({p}:{p:SerpProduct}){
  const url=getDirectUrl(p.source,p.title)
  return(
    <a href={url} target="_blank" rel="noopener noreferrer"
      style={{display:'flex',gap:14,padding:'14px 18px',background:'#FFFFFF',border:'1.5px solid rgba(0,0,0,0.07)',borderRadius:14,textDecoration:'none',transition:'all 0.15s',alignItems:'flex-start',boxShadow:'0 1px 3px rgba(0,0,0,0.04)'}}
      onMouseEnter={e=>{(e.currentTarget as HTMLAnchorElement).style.boxShadow='0 8px 24px rgba(0,0,0,0.08)';(e.currentTarget as HTMLAnchorElement).style.borderColor='rgba(91,79,207,0.25)';(e.currentTarget as HTMLAnchorElement).style.transform='translateX(4px)'}}
      onMouseLeave={e=>{(e.currentTarget as HTMLAnchorElement).style.boxShadow='0 1px 3px rgba(0,0,0,0.04)';(e.currentTarget as HTMLAnchorElement).style.borderColor='rgba(0,0,0,0.07)';(e.currentTarget as HTMLAnchorElement).style.transform='translateX(0)'}}>
      {p.thumbnail&&<img src={p.thumbnail} alt="" style={{width:48,height:48,objectFit:'contain',borderRadius:8,background:'#F5F4F2',flexShrink:0,border:'1px solid rgba(0,0,0,0.06)'}} onError={e=>{(e.target as HTMLImageElement).style.display='none'}}/>}
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:13,fontWeight:500,color:'#374151',lineHeight:1.4,marginBottom:4}}>{p.title}</div>
        <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
          <span style={{fontSize:16,fontWeight:700,color:'#5B4FCF',fontFamily:'Sora,sans-serif'}}>{p.price}</span>
          <span style={{fontSize:11,color:'#A8A29E',fontFamily:'Geist Mono, monospace'}}>{p.source}</span>
          {p.rating&&<span style={{fontSize:11,color:'#16A34A',fontFamily:'Geist Mono, monospace'}}>{Math.min(5,p.rating).toFixed(1)}/5</span>}
        </div>
      </div>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C4B9AD" strokeWidth="2" strokeLinecap="round" style={{flexShrink:0,marginTop:2}}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
    </a>
  )
}

function SearchResults(){
  const sp=useSearchParams(),router=useRouter()
  const query=sp.get('q')||''
  const [input,setInput]=useState(query)
  const [loading,setLoading]=useState(false)
  const [called,setCalled]=useState(false)
  const [answer,setAnswer]=useState('')
  const [aiProducts,setAiProducts]=useState<AiProduct[]>([])
  const [serpProducts,setSerpProducts]=useState<SerpProduct[]>([])
  const [related,setRelated]=useState<string[]>([])
  const [recState,setRecState]=useState<'idle'|'recording'|'processing'|'error'>('idle')
  const [voiceError,setVoiceError]=useState('')
  const [transcript,setTranscript]=useState('')
  const [dots,setDots]=useState(1)
  const mediaRef=useRef<MediaRecorder|null>(null)
  const chunksRef=useRef<Blob[]>([])
  const streamRef=useRef<MediaStream|null>(null)

  useEffect(()=>{if(recState!=='recording')return;const id=setInterval(()=>setDots(d=>d>=3?1:d+1),450);return()=>clearInterval(id)},[recState])

  const doSearch=async(q:string)=>{
    if(!q.trim())return
    setLoading(true);setCalled(true);setAnswer('');setAiProducts([]);setSerpProducts([]);setRelated([])
    try{const r=await fetch('/api/ask',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question:q})});const d=await r.json();setAnswer(d.answer||'');setAiProducts(d.aiProducts||[]);setSerpProducts(d.serpProducts||[]);setRelated(d.relatedSearches||[])}
    catch{setAnswer('Something went wrong.')}finally{setLoading(false)}
  }
  if(query&&!called&&!loading){doSearch(query);setCalled(true)}
  const submit=(q?:string)=>{const t=(q||input).trim();if(!t)return;router.push(`/search?q=${encodeURIComponent(t)}`);doSearch(t)}

  const stopRec=()=>{if(mediaRef.current?.state!=='inactive')mediaRef.current?.stop();streamRef.current?.getTracks().forEach(t=>t.stop());setRecState('processing')}
  const startRec=async()=>{
    setVoiceError('');setTranscript('')
    if(!navigator.mediaDevices?.getUserMedia){setRecState('error');setVoiceError('Use Chrome.');return}
    let stream:MediaStream
    try{stream=await navigator.mediaDevices.getUserMedia({audio:true});streamRef.current=stream}
    catch{setRecState('error');setVoiceError('Mic denied.');return}
    const mimes=['audio/webm;codecs=opus','audio/webm','audio/ogg;codecs=opus','audio/ogg']
    const mime=mimes.find(m=>MediaRecorder.isTypeSupported(m))||''
    const rec=mime?new MediaRecorder(stream,{mimeType:mime}):new MediaRecorder(stream)
    mediaRef.current=rec;chunksRef.current=[]
    rec.ondataavailable=e=>{if(e.data?.size>0)chunksRef.current.push(e.data)}
    rec.onstop=async()=>{
      const total=chunksRef.current.reduce((s,c)=>s+c.size,0)
      if(!total){setRecState('error');setVoiceError('No audio.');return}
      const bt=mime?mime.split(';')[0]:'audio/webm'
      const blob=new Blob(chunksRef.current,{type:bt})
      const form=new FormData()
      form.append('file',blob,`rec.${bt.includes('ogg')?'ogg':'webm'}`)
      try{const r=await fetch('/api/ask',{method:'POST',body:form});const d=await r.json();if(d.transcript){setTranscript(d.transcript);setInput(d.transcript);setRecState('idle');submit(d.transcript)}else{setRecState('error');setVoiceError(d.error||'Try again.')}}
      catch{setRecState('error');setVoiceError('Network error.')}
    }
    rec.start(200);setRecState('recording')
  }
  const toggleMic=()=>recState==='recording'?stopRec():startRec()
  const isRec=recState==='recording',isProc=recState==='processing',isBusy=isRec||isProc

  return(
    <div style={{maxWidth:1040,margin:'0 auto',padding:'clamp(68px,8vw,80px) clamp(12px,4vw,20px) 100px'}}>

      {/* Sticky search */}
      <div style={{position:'sticky',top:56,zIndex:50,paddingTop:12,paddingBottom:12,background:'rgba(250,250,249,0.96)',backdropFilter:'blur(20px)'}}>
        <div style={{display:'flex',alignItems:'center',gap:8,background:'#FFFFFF',border:`1.5px solid ${isRec?'rgba(220,38,38,0.4)':'rgba(0,0,0,0.1)'}`,borderRadius:14,padding:'5px 5px 5px 18px',boxShadow:'0 4px 16px rgba(0,0,0,0.07)',transition:'border-color 0.2s'}}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#C4B9AD" strokeWidth="2.5" strokeLinecap="round" style={{flexShrink:0}}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input value={isRec?('Listening'+'.'.repeat(dots)):isProc?'Transcribing...':input} onChange={e=>{if(!isBusy)setInput(e.target.value)}} onKeyDown={e=>e.key==='Enter'&&!isBusy&&submit()} placeholder="Search any product..." readOnly={isBusy}
            style={{flex:1,border:'none',outline:'none',fontSize:15,color:isRec?'#DC2626':'#111110',background:'transparent',fontFamily:'Sora,sans-serif',padding:'11px 0',minWidth:0,caretColor:'#5B4FCF'}}/>
          <button onClick={toggleMic} disabled={isProc}
            style={{width:40,height:40,borderRadius:9,border:'none',flexShrink:0,background:isRec?'rgba(220,38,38,0.08)':'#F5F4F2',cursor:isProc?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.2s',animation:isRec?'mic-ring 1s ease infinite':'none'}}>
            {isProc?<div style={{width:13,height:13,border:'2px solid #D6D3D1',borderTopColor:'#5B4FCF',borderRadius:'50%',animation:'spin .7s linear infinite'}}/>
              :isRec?<svg width="11" height="11" viewBox="0 0 24 24" fill="#DC2626"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
              :<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#78716C" strokeWidth="2" strokeLinecap="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>}
          </button>
          <button onClick={()=>submit()} disabled={!input.trim()||isBusy}
            style={{padding:'0 20px',height:40,borderRadius:9,background:input.trim()&&!isBusy?'linear-gradient(135deg,#5B4FCF,#7C6FCD)':'#F0EFed',color:input.trim()&&!isBusy?'#fff':'#C4B9AD',fontWeight:600,border:'none',cursor:!input.trim()||isBusy?'not-allowed':'pointer',fontSize:13,transition:'all 0.2s',whiteSpace:'nowrap',flexShrink:0,boxShadow:input.trim()&&!isBusy?'0 2px 8px rgba(91,79,207,0.3)':'none'}}>
            Search
          </button>
        </div>
        {recState==='error'&&voiceError&&<div style={{marginTop:6,fontSize:13,color:'#DC2626',padding:'6px 0'}}>⚠️ {voiceError}</div>}
        {transcript&&!isBusy&&<div style={{marginTop:6,fontSize:13,color:'#16A34A',padding:'6px 0'}}>✓ You said: {transcript}</div>}
      </div>

      <style>{`
        @keyframes card-in{from{opacity:0;transform:translateY(16px) scale(0.98)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes mic-ring{0%,100%{box-shadow:0 0 0 2px rgba(220,38,38,0.25)}50%{box-shadow:0 0 0 7px rgba(220,38,38,0.04)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes dot-bounce{0%,80%,100%{transform:scale(0.6);opacity:0.3}40%{transform:scale(1);opacity:1}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0.25}}
      `}</style>

      {/* Loading */}
      {loading&&(
        <div style={{textAlign:'center',padding:'80px 0'}}>
          <div style={{display:'flex',gap:8,justifyContent:'center',marginBottom:20}}>
            {[0,1,2].map(i=><div key={i} style={{width:10,height:10,borderRadius:'50%',background:'#5B4FCF',animation:`dot-bounce 1.2s ${i*0.2}s infinite ease-in-out`}}/>)}
          </div>
          <div style={{fontSize:13,color:'#A8A29E',fontFamily:'Geist Mono, monospace',letterSpacing:'0.5px'}}>ANALYSING REVIEWS · REMOVING FAKES · COMPUTING PR SCORE</div>
        </div>
      )}

      {!loading&&answer&&(
        <div>
          <div style={{marginBottom:24,paddingBottom:20,borderBottom:'1px solid rgba(0,0,0,0.07)'}}>
            <h1 style={{fontFamily:'Sora,sans-serif',fontSize:'clamp(18px,3vw,26px)',fontWeight:700,color:'#111110',letterSpacing:'-0.5px',marginBottom:6}}>{query||input}</h1>
            <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
              <span style={{fontSize:11,color:'#C4B9AD',fontFamily:'Geist Mono, monospace'}}>🤖 ProductRating AI</span>
              <span style={{fontSize:11,color:'#C4B9AD',fontFamily:'Geist Mono, monospace'}}>· FAKE REVIEWS REMOVED</span>
              <span style={{fontSize:11,color:'#C4B9AD',fontFamily:'Geist Mono, monospace'}}>· ALL SCORES OUT OF 5</span>
            </div>
          </div>

          {/* AI Answer */}
          <div style={{background:'rgba(91,79,207,0.05)',border:'1px solid rgba(91,79,207,0.15)',borderLeft:'3px solid rgba(91,79,207,0.5)',borderRadius:14,padding:'18px 22px',marginBottom:32}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
              <span style={{width:6,height:6,borderRadius:'50%',background:'#5B4FCF',display:'inline-block',animation:'blink 2s infinite'}}/>
              <span style={{fontSize:10,color:'#5B4FCF',fontFamily:'Geist Mono, monospace',letterSpacing:'1.5px'}}>AI ANALYSIS · PRODUCTRATING</span>
            </div>
            <p style={{color:'#374151',lineHeight:1.8,margin:0,fontSize:15}}>{answer}</p>
          </div>

          {/* Products */}
          {aiProducts.length>0&&(
            <div style={{marginBottom:40}}>
              <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20}}>
                <span style={{fontSize:16,fontWeight:700,color:'#111110'}}>Top Recommendations</span>
                <span style={{fontSize:10,color:'#A8A29E',fontFamily:'Geist Mono, monospace',border:'1px solid rgba(0,0,0,0.08)',borderRadius:4,padding:'2px 8px'}}>AI RANKED</span>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(min(100%,300px),1fr))',gap:16}}>
                {aiProducts.map((p,i)=><AiCard key={i} p={p} idx={i}/>)}
              </div>
            </div>
          )}

          {/* Live prices */}
          {serpProducts.length>0&&(
            <div style={{marginBottom:40}}>
              <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
                <span style={{fontSize:14,fontWeight:600,color:'#57534E'}}>Live Prices</span>
                <span style={{fontSize:10,color:'#A8A29E',fontFamily:'Geist Mono, monospace',border:'1px solid rgba(0,0,0,0.07)',borderRadius:4,padding:'2px 8px'}}>DIRECT LINKS</span>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {serpProducts.slice(0,5).map((p,i)=><SerpCard key={i} p={p}/>)}
              </div>
            </div>
          )}

          {/* Related */}
          {related.length>0&&(
            <div style={{paddingTop:24,borderTop:'1px solid rgba(0,0,0,0.07)'}}>
              <p style={{fontSize:10,color:'#C4B9AD',fontFamily:'Geist Mono, monospace',letterSpacing:'1px',marginBottom:12}}>RELATED SEARCHES</p>
              <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
                {related.map((r,i)=>(
                  <button key={i} onClick={()=>submit(r)}
                    style={{padding:'7px 16px',borderRadius:100,background:'#FFFFFF',border:'1.5px solid rgba(0,0,0,0.08)',color:'#78716C',fontSize:13,cursor:'pointer',transition:'all 0.15s',boxShadow:'0 1px 3px rgba(0,0,0,0.04)'}}
                    onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor='rgba(91,79,207,0.3)';(e.currentTarget as HTMLButtonElement).style.color='#5B4FCF';(e.currentTarget as HTMLButtonElement).style.transform='translateY(-1px)'}}
                    onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor='rgba(0,0,0,0.08)';(e.currentTarget as HTMLButtonElement).style.color='#78716C';(e.currentTarget as HTMLButtonElement).style.transform='translateY(0)'}}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!loading&&!answer&&!called&&(
        <div style={{textAlign:'center',padding:'80px 0'}}>
          <div style={{width:56,height:56,background:'rgba(91,79,207,0.08)',borderRadius:16,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',fontSize:22}}>◈</div>
          <div style={{fontSize:16,fontWeight:600,color:'#57534E',marginBottom:8}}>Ask anything about any product</div>
          <div style={{fontSize:13,color:'#A8A29E',fontFamily:'Geist Mono, monospace'}}>Type or tap 🎙️ to speak in any Indian language</div>
        </div>
      )}

      {/* Floating mic — mobile */}
      <button onClick={toggleMic} disabled={isProc}
        style={{position:'fixed',bottom:24,right:20,width:52,height:52,borderRadius:'50%',border:'none',background:isRec?'#DC2626':'linear-gradient(135deg,#5B4FCF,#7C6FCD)',cursor:isProc?'not-allowed':'pointer',alignItems:'center',justifyContent:'center',boxShadow:'0 8px 24px rgba(91,79,207,0.35)',zIndex:99,transition:'all 0.2s',display:'none'}}
        className="mobile-fab">
        {isProc?<div style={{width:18,height:18,border:'2.5px solid rgba(255,255,255,0.4)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin .7s linear infinite'}}/>
          :isRec?<svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
          :<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>}
        <style>{`.mobile-fab{display:none!important}@media(max-width:768px){.mobile-fab{display:flex!important}}`}</style>
      </button>
    </div>
  )
}

export default function SearchPage(){
  return(
    <div style={{minHeight:'100vh',background:'#FAFAF9',fontFamily:'Sora,sans-serif'}}>
      <Nav/>
      <Suspense fallback={<div style={{padding:'80px 20px',textAlign:'center',color:'#A8A29E',fontFamily:'Geist Mono, monospace'}}>LOADING...</div>}>
        <SearchResults/>
      </Suspense>
    </div>
  )
}
