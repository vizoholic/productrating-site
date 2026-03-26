'use client'
export const dynamic = 'force-dynamic'
import { useState, Suspense, useRef, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Nav from '@/components/Nav'

type AiProduct = { name:string; price:string; seller:string; rating:number; platform_rating:number; reviews:string; badge:string; reason:string; pros:string[]; cons:string[]; avoid_if:string }
type SerpProduct = { title:string; price:string; rating:number|null; source:string; link:string; thumbnail:string; delivery:string }

function getDirectUrl(seller:string,name:string):string{
  const q=encodeURIComponent(name),s=(seller||'').toLowerCase().trim()
  const map:[string[],(q:string)=>string][]=[
    [['amazon'],q=>`https://www.amazon.in/s?k=${q}`],[['flipkart'],q=>`https://www.flipkart.com/search?q=${q}`],
    [['nykaa'],q=>`https://www.nykaa.com/search/result/?q=${q}`],[['meesho'],q=>`https://www.meesho.com/search?q=${q}`],
    [['croma'],q=>`https://www.croma.com/searchB?q=${q}`],[['jiomart'],q=>`https://www.jiomart.com/search/${q}`],
    [['myntra'],q=>`https://www.myntra.com/${q}`],[['tata cliq','tatacliq'],q=>`https://www.tatacliq.com/search/?text=${q}`],
    [['reliance'],q=>`https://www.reliancedigital.in/search?q=${q}`],
  ]
  for(const [keys,fn] of map) if(keys.some(k=>s.includes(k))) return fn(q)
  return `https://www.amazon.in/s?k=${q}`
}

// Custom thin-line arc — not generic stars
function RatingArc({score,size=60}:{score:number;size?:number}){
  const r=(size/2)-5,circ=2*Math.PI*r,dash=circ*(score/5)
  return(
    <div style={{position:'relative',width:size,height:size,flexShrink:0}}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{transform:'rotate(-90deg)'}}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--bg-3)" strokeWidth="2.5"/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"/>
      </svg>
      <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column'}}>
        <span style={{fontFamily:'var(--font-sans)',fontSize:size/3.5,fontWeight:800,color:'var(--ink)',lineHeight:1,letterSpacing:'-1px'}}>{score.toFixed(1)}</span>
        <span style={{fontSize:8,color:'var(--ink-4)',fontFamily:'var(--font-mono)'}}>/ 5</span>
      </div>
    </div>
  )
}

// Bespoke editor seal
function EditorSeal({label}:{label:string}){
  return(
    <div style={{display:'inline-flex',alignItems:'center',gap:6,background:'var(--gold-bg)',border:'1px solid rgba(160,120,42,0.22)',borderRadius:'var(--radius-sm)',padding:'4px 10px'}}>
      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.8"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
      <span style={{fontSize:10,fontWeight:600,color:'var(--gold)',fontFamily:'var(--font-mono)',letterSpacing:'0.5px',textTransform:'uppercase'}}>{label}</span>
    </div>
  )
}


function AiCard({p,idx}:{p:AiProduct;idx:number}){
  const [open,setOpen]=useState(false)
  const buyUrl=getDirectUrl(p.seller,p.name)
  const platRating=Math.min(5,p.platform_rating||Math.min(5,p.rating+0.4))
  const aiRating=Math.min(5,Math.max(1,p.rating))
  const isTop=idx===0
  const rankLabel=['#1 Best Pick','#2 Runner Up','#3 Third Pick'][idx]||`#${idx+1}`

  return(
    <div style={{background:'var(--bg-1)',border:`1.5px solid ${isTop?'rgba(91,79,207,0.3)':'var(--border)'}`,borderRadius:'var(--radius-xl)',overflow:'hidden',transition:'transform 0.3s cubic-bezier(0.22,1,0.36,1),box-shadow 0.3s ease',boxShadow:isTop?'var(--shadow-lg)':'var(--shadow-sm)',animation:`card-in 0.5s ${idx*0.12}s ease both`,display:'flex',flexDirection:'column'}}
      onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.transform='translateY(-5px)';(e.currentTarget as HTMLDivElement).style.boxShadow='var(--shadow-xl)'}}
      onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.transform='translateY(0)';(e.currentTarget as HTMLDivElement).style.boxShadow=isTop?'var(--shadow-lg)':'var(--shadow-sm)'}}>

      {/* Rank header */}
      <div style={{padding:'11px 20px',background:isTop?'var(--accent-bg)':'var(--bg-2)',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <span style={{fontSize:10,fontWeight:600,color:isTop?'var(--accent)':'var(--ink-4)',fontFamily:'var(--font-mono)',letterSpacing:'1.5px',textTransform:'uppercase'}}>{rankLabel}</span>
        {isTop&&<EditorSeal label="Editor's Choice"/>}
      </div>

      <div style={{padding:'22px 22px 0',flex:1}}>
        {p.badge&&<span style={{display:'inline-block',fontSize:10,fontWeight:600,color:'var(--green)',background:'var(--green-bg)',border:'1px solid rgba(22,163,74,0.2)',borderRadius:100,padding:'2px 12px',marginBottom:12,fontFamily:'var(--font-mono)',letterSpacing:'0.5px',textTransform:'uppercase'}}>● {p.badge}</span>}

        <h3 style={{fontWeight:700,fontSize:18,color:'var(--ink)',lineHeight:1.3,letterSpacing:'-0.4px',marginBottom:12}}>{p.name}</h3>

        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20,flexWrap:'wrap'}}>
          <span style={{fontSize:28,fontWeight:800,color:isTop?'var(--accent)':'var(--ink)',letterSpacing:'-1.5px',fontFamily:'var(--font-sans)'}}>{p.price}</span>
          {p.seller&&<span style={{fontSize:12,color:'var(--ink-3)',background:'var(--bg-2)',borderRadius:'var(--radius-sm)',padding:'3px 12px',border:'1px solid var(--border)',letterSpacing:'0.01em'}}>{p.seller}</span>}
        </div>

        {/* Score block */}
        <div style={{background:'var(--bg-2)',borderRadius:'var(--radius-lg)',padding:18,marginBottom:16,border:'1px solid var(--border)'}}>
          <div style={{display:'flex',gap:18,alignItems:'flex-start',marginBottom:14}}>
            <div>
              <div style={{fontSize:9,color:'var(--ink-4)',fontFamily:'var(--font-mono)',letterSpacing:'1px',textTransform:'uppercase',marginBottom:8}}>PR Score · {p.reviews||'—'} reviews</div>
              <RatingArc score={aiRating} size={60}/>
            </div>
            <div style={{flex:1,paddingTop:4}}>
              {/* Custom progress bar */}
              <div style={{marginBottom:12}}>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:'var(--ink-4)',fontFamily:'var(--font-mono)',marginBottom:6}}>
                  <span>AI-adjusted score</span><span>{aiRating.toFixed(1)}/5</span>
                </div>
                <div style={{height:4,background:'var(--bg-3)',borderRadius:2,overflow:'hidden'}}>
                  <div style={{height:'100%',width:`${(aiRating/5)*100}%`,background:'linear-gradient(90deg,var(--accent),var(--accent-2))',borderRadius:2,transition:'width 1s cubic-bezier(0.22,1,0.36,1)'}}/>
                </div>
              </div>
              {/* Platform vs real */}
              <div style={{background:'var(--bg-1)',borderRadius:'var(--radius-sm)',padding:'10px 12px',border:'1px solid var(--border)',display:'flex',alignItems:'center',gap:8,fontSize:12}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:9,color:'var(--ink-4)',fontFamily:'var(--font-mono)',letterSpacing:'0.5px',marginBottom:3,textTransform:'uppercase'}}>Platform</div>
                  <span style={{color:'var(--red)',fontWeight:700,fontSize:15}}>{platRating.toFixed(1)}</span><span style={{color:'var(--ink-4)',fontSize:10,marginLeft:3}}>with fakes</span>
                </div>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--ink-4)" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                <div style={{flex:1}}>
                  <div style={{fontSize:9,color:'var(--ink-4)',fontFamily:'var(--font-mono)',letterSpacing:'0.5px',marginBottom:3,textTransform:'uppercase'}}>Real</div>
                  <span style={{color:'var(--green)',fontWeight:700,fontSize:15}}>{aiRating.toFixed(1)}</span><span style={{color:'var(--ink-4)',fontSize:10,marginLeft:3}}>AI-adjusted</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Why this result */}
        {p.reason&&(
          <div style={{marginBottom:14,padding:'12px 16px',background:'var(--accent-bg)',borderRadius:'var(--radius)',borderLeft:'2.5px solid var(--accent)'}}>
            <div style={{fontSize:9,color:'var(--accent)',fontFamily:'var(--font-mono)',letterSpacing:'1.5px',textTransform:'uppercase',marginBottom:5}}>Why this result</div>
            <p style={{fontSize:13,color:'var(--ink-2)',lineHeight:1.75,letterSpacing:'0.01em',fontWeight:300}}>{p.reason}</p>
          </div>
        )}

        {/* Pros / Cons */}
        {(p.pros?.length>0||p.cons?.length>0||p.avoid_if)&&(
          <div style={{marginBottom:4}}>
            <button onClick={()=>setOpen(!open)}
              style={{fontSize:10,color:'var(--ink-3)',fontWeight:500,background:'none',border:'none',cursor:'pointer',padding:'0 0 10px',display:'flex',alignItems:'center',gap:6,fontFamily:'var(--font-mono)',letterSpacing:'1px',textTransform:'uppercase',transition:'color 0.2s'}}
              onMouseEnter={e=>(e.currentTarget.style.color='var(--ink)')}
              onMouseLeave={e=>(e.currentTarget.style.color='var(--ink-3)')}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{transform:open?'rotate(90deg)':'rotate(0)',transition:'transform 0.2s'}}><path d="M9 18l6-6-6-6"/></svg>
              {open?'Hide details':'Pros · Cons · Avoid if'}
            </button>
            {open&&(
              <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:8}}>
                {p.pros?.length>0&&(
                  <div style={{background:'var(--green-bg)',border:'1px solid rgba(22,163,74,0.15)',borderRadius:'var(--radius)',padding:'12px 16px'}}>
                    <div style={{fontSize:9,color:'var(--green)',fontFamily:'var(--font-mono)',letterSpacing:'1px',textTransform:'uppercase',marginBottom:8}}>Pros</div>
                    {p.pros.map((pro,i)=><div key={i} style={{fontSize:13,color:'var(--ink-2)',display:'flex',gap:8,marginBottom:i<p.pros.length-1?6:0,lineHeight:1.7,letterSpacing:'0.01em',fontWeight:300}}><span style={{color:'var(--green)',flexShrink:0}}>+</span>{pro}</div>)}
                  </div>
                )}
                {p.cons?.length>0&&(
                  <div style={{background:'rgba(220,38,38,0.04)',border:'1px solid rgba(220,38,38,0.12)',borderRadius:'var(--radius)',padding:'12px 16px'}}>
                    <div style={{fontSize:9,color:'var(--red)',fontFamily:'var(--font-mono)',letterSpacing:'1px',textTransform:'uppercase',marginBottom:8}}>Cons</div>
                    {p.cons.map((con,i)=><div key={i} style={{fontSize:13,color:'var(--ink-2)',display:'flex',gap:8,lineHeight:1.7,letterSpacing:'0.01em',fontWeight:300,marginBottom:i<p.cons.length-1?6:0}}><span style={{color:'var(--red)',flexShrink:0}}>−</span>{con}</div>)}
                  </div>
                )}
                {p.avoid_if&&(
                  <div style={{background:'var(--gold-bg)',border:'1px solid rgba(160,120,42,0.15)',borderRadius:'var(--radius)',padding:'12px 16px'}}>
                    <span style={{fontSize:9,color:'var(--gold)',fontFamily:'var(--font-mono)',letterSpacing:'1px',textTransform:'uppercase'}}>Avoid if </span>
                    <span style={{fontSize:13,color:'var(--ink-2)',lineHeight:1.7,letterSpacing:'0.01em',fontWeight:300}}>{p.avoid_if}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Buy CTA */}
      <a href={buyUrl} target="_blank" rel="noopener noreferrer"
        style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,padding:'14px 22px',background:isTop?'var(--accent)':'var(--bg-2)',color:isTop?'#fff':'var(--ink-2)',fontSize:13,fontWeight:600,letterSpacing:'0.02em',textDecoration:'none',transition:'all 0.2s',borderTop:'1px solid var(--border)'}}
        onMouseEnter={e=>{e.currentTarget.style.background=isTop?'#4A3FBF':'var(--bg-3)'}}
        onMouseLeave={e=>{e.currentTarget.style.background=isTop?'var(--accent)':'var(--bg-2)'}}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        Search on {p.seller||'Amazon'}
      </a>
    </div>
  )
}

function SerpCard({p}:{p:SerpProduct}){
  const url=getDirectUrl(p.source,p.title)
  return(
    <a href={url} target="_blank" rel="noopener noreferrer"
      style={{display:'flex',gap:14,padding:'14px 18px',background:'var(--bg-1)',border:'1.5px solid var(--border)',borderRadius:'var(--radius)',textDecoration:'none',transition:'all 0.2s cubic-bezier(0.22,1,0.36,1)',alignItems:'flex-start',boxShadow:'var(--shadow-xs)'}}
      onMouseEnter={e=>{(e.currentTarget as HTMLAnchorElement).style.transform='translateX(4px)';(e.currentTarget as HTMLAnchorElement).style.borderColor='var(--accent-border)';(e.currentTarget as HTMLAnchorElement).style.boxShadow='var(--shadow-sm)'}}
      onMouseLeave={e=>{(e.currentTarget as HTMLAnchorElement).style.transform='translateX(0)';(e.currentTarget as HTMLAnchorElement).style.borderColor='var(--border)';(e.currentTarget as HTMLAnchorElement).style.boxShadow='var(--shadow-xs)'}}>
      {p.thumbnail&&<img src={p.thumbnail} alt="" style={{width:52,height:52,objectFit:'contain',borderRadius:'var(--radius-sm)',background:'var(--bg-2)',flexShrink:0,border:'1px solid var(--border)',filter:'saturate(0.9)'}} onError={e=>{(e.target as HTMLImageElement).style.display='none'}}/>}
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:13,fontWeight:400,color:'var(--ink-2)',lineHeight:1.5,marginBottom:5,letterSpacing:'0.01em'}}>{p.title}</div>
        <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
          <span style={{fontSize:18,fontWeight:800,color:'var(--ink)',letterSpacing:'-0.8px'}}>{p.price}</span>
          <span style={{fontSize:11,color:'var(--ink-4)',fontFamily:'var(--font-mono)',letterSpacing:'0.3px'}}>{p.source}</span>
          {p.rating&&<span style={{fontSize:11,color:'var(--green)',fontFamily:'var(--font-mono)',fontWeight:500}}>{Math.min(5,p.rating).toFixed(1)}/5</span>}
        </div>
      </div>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--ink-4)" strokeWidth="1.8" style={{flexShrink:0,marginTop:3}}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
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
  const resultsRef=useRef<HTMLDivElement>(null)

  useEffect(()=>{if(recState!=='recording')return;const id=setInterval(()=>setDots(d=>d>=3?1:d+1),450);return()=>clearInterval(id)},[recState])

  useEffect(()=>{
    const fn=()=>{ if(resultsRef.current){const rect=resultsRef.current.getBoundingClientRect();setVerdictVisible(rect.top<-100)} }
    window.addEventListener('scroll',fn,{passive:true});return()=>window.removeEventListener('scroll',fn)
  },[])

  const doSearch=async(q:string)=>{
    if(!q.trim())return
    setLoading(true);setCalled(true);setAnswer('');setAiProducts([]);setSerpProducts([]);setRelated([])
    try{const r=await fetch('/api/ask',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question:q})});const d=await r.json();setAnswer(d.answer||'');setAiProducts(d.aiProducts||[]);setSerpProducts(d.serpProducts||[]);setRelated(d.relatedSearches||[])}
    catch{setAnswer('Something went wrong. Please try again.')}finally{setLoading(false)}
  }
  if(query&&!called&&!loading){doSearch(query);setCalled(true)}
  const submit=(q?:string)=>{const t=(q||input).trim();if(!t)return;router.push(`/search?q=${encodeURIComponent(t)}`);doSearch(t)}

  const stopRec=()=>{if(mediaRef.current?.state!=='inactive')mediaRef.current?.stop();streamRef.current?.getTracks().forEach(t=>t.stop());setRecState('processing')}
  const startRec=async()=>{
    setVoiceError('');setTranscript('')
    if(!navigator.mediaDevices?.getUserMedia){setRecState('error');setVoiceError('Use Chrome.');return}
    let stream:MediaStream
    try{stream=await navigator.mediaDevices.getUserMedia({audio:true});streamRef.current=stream}
    catch{setRecState('error');setVoiceError('Mic access denied.');return}
    const mimes=['audio/webm;codecs=opus','audio/webm','audio/ogg;codecs=opus','audio/ogg']
    const mime=mimes.find(m=>MediaRecorder.isTypeSupported(m))||''
    const rec=mime?new MediaRecorder(stream,{mimeType:mime}):new MediaRecorder(stream)
    mediaRef.current=rec;chunksRef.current=[]
    rec.ondataavailable=e=>{if(e.data?.size>0)chunksRef.current.push(e.data)}
    rec.onstop=async()=>{
      const total=chunksRef.current.reduce((s,c)=>s+c.size,0)
      if(!total){setRecState('error');setVoiceError('No audio captured.');return}
      const bt=mime?mime.split(';')[0]:'audio/webm'
      const blob=new Blob(chunksRef.current,{type:bt})
      const form=new FormData();form.append('file',blob,`rec.${bt.includes('ogg')?'ogg':'webm'}`)
      try{const r=await fetch('/api/ask',{method:'POST',body:form});const d=await r.json();if(d.transcript){setTranscript(d.transcript);setInput(d.transcript);setRecState('idle');submit(d.transcript)}else{setRecState('error');setVoiceError(d.error||'Try again.')}}
      catch{setRecState('error');setVoiceError('Network error.')}
    }
    rec.start(200);setRecState('recording')
  }
  const toggleMic=()=>recState==='recording'?stopRec():startRec()
  const isRec=recState==='recording',isProc=recState==='processing',isBusy=isRec||isProc

  return(
    <div style={{maxWidth:1040,margin:'0 auto',padding:'clamp(70px,8vw,84px) clamp(16px,4vw,24px) 100px'}}>



      {/* Sticky search */}
      <div style={{position:'sticky',top:56,zIndex:60,paddingTop:12,paddingBottom:12,background:'rgba(255,255,255,1)',backdropFilter:'blur(20px)'}}>
        <div style={{display:'flex',alignItems:'center',gap:8,background:'var(--bg-1)',border:`1.5px solid ${isRec?'rgba(220,38,38,0.4)':'var(--border-hi)'}`,borderRadius:18,padding:'5px 5px 5px 18px',boxShadow:'var(--shadow-md)',transition:'border-color 0.2s'}}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--ink-4)" strokeWidth="2.5" strokeLinecap="round" style={{flexShrink:0}}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input value={isRec?('Listening'+'.'.repeat(dots)):isProc?'Transcribing...':input} onChange={e=>{if(!isBusy)setInput(e.target.value)}} onKeyDown={e=>e.key==='Enter'&&!isBusy&&submit()} placeholder="Search any product..." readOnly={isBusy}
            style={{flex:1,border:'none',outline:'none',fontSize:15,fontWeight:300,letterSpacing:'0.02em',color:isRec?'var(--red)':'var(--ink)',background:'transparent',fontFamily:'var(--font-sans)',padding:'12px 0',minWidth:0,caretColor:'var(--accent)'}}/>
          <button onClick={toggleMic} disabled={isProc}
            style={{width:42,height:42,borderRadius:12,border:'1px solid var(--border)',flexShrink:0,background:isRec?'rgba(220,38,38,0.07)':'var(--bg-2)',cursor:isProc?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.2s',animation:isRec?'mic-ring 1.2s ease infinite':'none'}}>
            {isProc?<div style={{width:14,height:14,border:'1.5px solid var(--ink-4)',borderTopColor:'var(--accent)',borderRadius:'50%',animation:'spin .8s linear infinite'}}/>
              :isRec?<svg width="11" height="11" viewBox="0 0 24 24" fill="var(--red)"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
              :<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" strokeWidth="2" strokeLinecap="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>}
          </button>
          <button onClick={()=>submit()} disabled={!input.trim()||isBusy}
            style={{padding:'0 22px',height:42,borderRadius:12,background:input.trim()&&!isBusy?'var(--accent)':'var(--bg-3)',color:input.trim()&&!isBusy?'#fff':'var(--ink-4)',fontWeight:600,border:'none',cursor:!input.trim()||isBusy?'not-allowed':'pointer',fontSize:13,transition:'all 0.2s',whiteSpace:'nowrap',flexShrink:0,boxShadow:input.trim()&&!isBusy?'0 2px 8px rgba(91,79,207,0.25)':'none'}}>
            Search
          </button>
        </div>
        {recState==='error'&&voiceError&&<div style={{marginTop:6,fontSize:12,color:'var(--red)',padding:'5px 2px',letterSpacing:'0.01em'}}>⚠️ {voiceError}</div>}
        {transcript&&!isBusy&&<div style={{marginTop:6,fontSize:12,color:'var(--green)',padding:'5px 2px'}}>✓ You said: {transcript}</div>}
      </div>

      <style>{`
        @keyframes card-in{from{opacity:0;transform:translateY(18px) scale(0.98)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes mic-ring{0%,100%{box-shadow:0 0 0 2px rgba(220,38,38,0.2)}50%{box-shadow:0 0 0 8px rgba(220,38,38,0.03)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes dot-bounce{0%,80%,100%{transform:scale(0.6);opacity:0.3}40%{transform:scale(1);opacity:1}}
        @keyframes wave-bar{from{transform:scaleY(0.3)}to{transform:scaleY(1)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0.2}}
        @media(max-width:640px){
          .verdict-name{max-width:140px !important;}
          .ai-card-grid{grid-template-columns:1fr !important;}
          .serp-card{padding:12px 14px !important;}
        }
        .reveal{opacity:0;transform:translateY(26px);transition:opacity .65s cubic-bezier(0.22,1,0.36,1),transform .65s cubic-bezier(0.22,1,0.36,1)}
        .reveal.visible{opacity:1;transform:translateY(0)}
      `}</style>

      {loading&&(
        <div style={{textAlign:'center',padding:'96px 0'}}>
          <div style={{display:'flex',gap:8,justifyContent:'center',marginBottom:20}}>
            {[0,1,2].map(i=><div key={i} style={{width:9,height:9,borderRadius:'50%',background:'var(--accent)',animation:`dot-bounce 1.2s ${i*0.2}s infinite ease-in-out`}}/>)}
          </div>
          <div style={{fontSize:11,color:'var(--ink-4)',fontFamily:'var(--font-mono)',letterSpacing:'1.5px',textTransform:'uppercase'}}>Analysing reviews · Removing fakes · Computing PR Score</div>
        </div>
      )}

      {!loading&&answer&&(
        <div ref={resultsRef}>
          {/* Query heading */}
          <div style={{marginBottom:24,paddingBottom:20,borderBottom:'1px solid var(--border)',marginTop:8}}>
            <h1 style={{fontSize:'clamp(20px,3.5vw,28px)',fontWeight:700,color:'var(--ink)',letterSpacing:'-0.8px',marginBottom:8,lineHeight:1.2}}>{query||input}</h1>
            <div style={{display:'flex',gap:14,flexWrap:'wrap'}}>
              {['AI-adjusted ratings','Fake reviews removed','All scores out of 5'].map(t=>(
                <span key={t} style={{fontSize:10,color:'var(--ink-4)',fontFamily:'var(--font-mono)',letterSpacing:'0.5px',textTransform:'uppercase',display:'flex',alignItems:'center',gap:4}}>
                  <span style={{width:3,height:3,borderRadius:'50%',background:'var(--accent)',display:'inline-block'}}/>
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* AI answer */}
          <div style={{background:'var(--accent-bg)',border:'1.5px solid var(--accent-border)',borderLeft:'3px solid var(--accent)',borderRadius:'var(--radius)',padding:'16px 20px',marginBottom:32}}>
            <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:9}}>
              <span style={{width:5,height:5,borderRadius:'50%',background:'var(--accent)',display:'inline-block',animation:'blink 2s infinite'}}/>
              <span style={{fontSize:9,color:'var(--accent)',fontFamily:'var(--font-mono)',letterSpacing:'1.5px',textTransform:'uppercase'}}>AI Analysis · ProductRating</span>
            </div>
            <p style={{color:'var(--ink-2)',lineHeight:1.85,margin:0,fontSize:14,letterSpacing:'0.02em',fontWeight:300}}>{answer}</p>
          </div>

          {/* Product cards */}
          {aiProducts.length>0&&(
            <div style={{marginBottom:44}}>
              <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20}}>
                <h2 style={{fontSize:18,fontWeight:700,color:'var(--ink)',letterSpacing:'-0.4px'}}>Top Recommendations</h2>
                <span style={{fontSize:9,color:'var(--ink-4)',fontFamily:'var(--font-mono)',border:'1px solid var(--border)',borderRadius:4,padding:'3px 10px',letterSpacing:'1px',textTransform:'uppercase'}}>AI Ranked</span>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(min(100%,280px),1fr))',gap:16}}>
                {aiProducts.map((p,i)=><AiCard key={i} p={p} idx={i}/>)}
              </div>

              {/* Verdict bar — bottom of cards, no overlap */}
              {aiProducts[0] && (
                <div style={{marginTop:20,background:'#FFFFFF',border:'1.5px solid rgba(91,79,207,0.2)',borderRadius:16,padding:'16px 20px',display:'flex',alignItems:'center',gap:16,flexWrap:'wrap',boxShadow:'0 4px 16px rgba(91,79,207,0.1)'}}>
                  <div style={{display:'flex',alignItems:'center',gap:10,flex:1,minWidth:0}}>
                    <span style={{fontSize:22,fontWeight:800,color:'var(--accent)',letterSpacing:'-1px',flexShrink:0}}>{aiProducts[0].rating.toFixed(1)}</span>
                    <div style={{minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:600,color:'var(--ink)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{aiProducts[0].name}</div>
                      <div style={{fontSize:11,color:'var(--ink-4)',fontFamily:'var(--font-mono)',letterSpacing:'0.3px'}}>#1 Best Pick · {aiProducts[0].price}</div>
                    </div>
                  </div>
                  <a href={getDirectUrl(aiProducts[0].seller,aiProducts[0].name)} target="_blank" rel="noopener noreferrer"
                    style={{display:'inline-flex',alignItems:'center',gap:7,background:'var(--accent)',color:'#fff',fontSize:13,fontWeight:600,padding:'10px 22px',borderRadius:10,textDecoration:'none',letterSpacing:'0.02em',flexShrink:0,transition:'background 0.25s',boxShadow:'0 2px 10px rgba(91,79,207,0.3)'}}
                    onMouseEnter={e=>(e.currentTarget.style.background='#4A3FBF')}
                    onMouseLeave={e=>(e.currentTarget.style.background='var(--accent)')}>
                    Check Price
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Live prices */}
          {serpProducts.length>0&&(
            <div style={{marginBottom:44}}>
              <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
                <h2 style={{fontSize:16,fontWeight:600,color:'var(--ink-2)',letterSpacing:'-0.2px'}}>Live Prices</h2>
                <span style={{fontSize:9,color:'var(--ink-4)',fontFamily:'var(--font-mono)',border:'1px solid var(--border)',borderRadius:4,padding:'3px 10px',letterSpacing:'1px',textTransform:'uppercase'}}>Direct Links</span>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {serpProducts.slice(0,5).map((p,i)=><SerpCard key={i} p={p}/>)}
              </div>
            </div>
          )}

          {/* Related */}
          {related.length>0&&(
            <div style={{paddingTop:24,borderTop:'1px solid var(--border)'}}>
              <p style={{fontSize:9,color:'var(--ink-4)',fontFamily:'var(--font-mono)',letterSpacing:'1.5px',textTransform:'uppercase',marginBottom:14}}>Related Searches</p>
              <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
                {related.map((r,i)=>(
                  <button key={i} onClick={()=>submit(r)}
                    style={{padding:'7px 16px',borderRadius:100,background:'transparent',border:'1.5px solid var(--border-hi)',color:'var(--ink-3)',fontSize:13,cursor:'pointer',transition:'all 0.2s',fontFamily:'var(--font-sans)',fontWeight:300,letterSpacing:'0.01em'}}
                    onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor='var(--accent)';(e.currentTarget as HTMLButtonElement).style.color='var(--accent)';(e.currentTarget as HTMLButtonElement).style.transform='translateY(-1px)'}}
                    onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor='var(--border-hi)';(e.currentTarget as HTMLButtonElement).style.color='var(--ink-3)';(e.currentTarget as HTMLButtonElement).style.transform='translateY(0)'}}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!loading&&!answer&&!called&&(
        <div style={{textAlign:'center',padding:'96px 0'}}>
          <div style={{width:56,height:56,background:'var(--accent-bg)',borderRadius:16,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px'}}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          </div>
          <p style={{fontSize:18,fontWeight:600,color:'var(--ink-3)',marginBottom:8,letterSpacing:'-0.3px'}}>Ask anything about any product</p>
          <p style={{fontSize:11,color:'var(--ink-4)',fontFamily:'var(--font-mono)',letterSpacing:'1px',textTransform:'uppercase'}}>Type above or tap the mic · 22 Indian languages</p>
        </div>
      )}

      {/* Mobile floating mic */}
      <button onClick={toggleMic} disabled={isProc} className="mobile-fab"
        style={{position:'fixed',bottom:24,right:20,width:52,height:52,borderRadius:'50%',border:'none',background:isRec?'var(--red)':'var(--accent)',cursor:isProc?'not-allowed':'pointer',display:'none',alignItems:'center',justifyContent:'center',boxShadow:'0 8px 24px rgba(91,79,207,0.35)',zIndex:99,transition:'all 0.3s cubic-bezier(0.22,1,0.36,1)'}}>
        {isProc?<div style={{width:18,height:18,border:'2px solid rgba(255,255,255,0.4)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin .8s linear infinite'}}/>
          :isRec?<svg width="15" height="15" viewBox="0 0 24 24" fill="#fff"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
          :<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>}
        <style>{`.mobile-fab{display:none!important}@media(max-width:768px){.mobile-fab{display:flex!important}}`}</style>
      </button>
    </div>
  )
}

export default function SearchPage(){
  return(
    <div style={{minHeight:'100vh',background:'var(--bg)',fontFamily:'var(--font-sans)'}}>
      <Nav/>
      <Suspense fallback={<div style={{padding:'96px 20px',textAlign:'center',color:'var(--ink-4)',fontFamily:'var(--font-mono)',letterSpacing:'1px',textTransform:'uppercase',fontSize:11}}>Loading...</div>}>
        <SearchResults/>
      </Suspense>
    </div>
  )
}
