'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { detectLocation, getCachedLocation, cacheLocation, type LocationData } from '@/lib/useLocation'

const EXAMPLES = [
  'Best AC for Chennai heat under ₹40,000',
  'Best phone under ₹20,000',
  'Best washing machine for hard water',
]
const SOURCES = ['Amazon','Flipkart','Nykaa','Croma','Meesho','JioMart','Myntra','Tata Cliq']

export default function Hero() {
  const [query,setQuery]=useState('')
  const [focused,setFocused]=useState(false)
  const [recState,setRecState]=useState<'idle'|'recording'|'processing'|'error'>('idle')
  const [voiceMsg,setVoiceMsg]=useState('')
  const [transcript,setTranscript]=useState('')
  const [dots,setDots]=useState(1)
  const [location,setLocation]=useState<LocationData|null>(null)
  const mediaRef=useRef<MediaRecorder|null>(null)
  const chunksRef=useRef<Blob[]>([])
  const streamRef=useRef<MediaStream|null>(null)
  const router=useRouter()

  useEffect(()=>{
    const cached=getCachedLocation()
    if(cached?.city){setLocation(cached);return}
    detectLocation().then(loc=>{if(loc?.city){setLocation(loc);cacheLocation(loc)}})
  },[])
  useEffect(()=>{
    if(recState!=='recording')return
    const id=setInterval(()=>setDots(d=>d>=3?1:d+1),450)
    return()=>clearInterval(id)
  },[recState])

  const go=(q?:string)=>{const t=(q||query).trim();if(t)router.push(`/search?q=${encodeURIComponent(t)}`)}
  const stopRec=()=>{mediaRef.current?.stop();streamRef.current?.getTracks().forEach(t=>t.stop());setRecState('processing')}
  const startRec=async()=>{
    setTranscript('');setVoiceMsg('')
    if(!navigator.mediaDevices?.getUserMedia){setRecState('error');setVoiceMsg('Not supported. Use Chrome.');return}
    let stream:MediaStream
    try{stream=await navigator.mediaDevices.getUserMedia({audio:true});streamRef.current=stream}
    catch{setRecState('error');setVoiceMsg('Mic access denied.');return}
    const mimes=['audio/webm;codecs=opus','audio/webm','audio/ogg;codecs=opus','audio/ogg']
    const mime=mimes.find(m=>MediaRecorder.isTypeSupported(m))||''
    const rec=mime?new MediaRecorder(stream,{mimeType:mime}):new MediaRecorder(stream)
    mediaRef.current=rec;chunksRef.current=[]
    rec.ondataavailable=e=>{if(e.data?.size>0)chunksRef.current.push(e.data)}
    rec.onstop=async()=>{
      const total=chunksRef.current.reduce((s,c)=>s+c.size,0)
      if(!total){setRecState('error');setVoiceMsg('No audio. Try again.');return}
      const bt=mime?mime.split(';')[0]:'audio/webm'
      const blob=new Blob(chunksRef.current,{type:bt})
      const form=new FormData();form.append('file',blob,`rec.${bt.includes('ogg')?'ogg':'webm'}`)
      try{
        const r=await fetch('/api/ask',{method:'POST',body:form});const d=await r.json()
        if(d.transcript){setTranscript(d.transcript);setQuery(d.transcript);setRecState('idle');setVoiceMsg('')}
        else{setRecState('error');setVoiceMsg(d.error||'Could not understand.')}
      }catch{setRecState('error');setVoiceMsg('Network error.')}
    }
    rec.start(200);setRecState('recording')
  }
  const toggleMic=()=>recState==='recording'?stopRec():startRec()
  const isRec=recState==='recording',isProc=recState==='processing',isBusy=isRec||isProc

  return (
    <section style={{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'clamp(96px,10vw,120px) clamp(20px,5vw,40px) 80px',position:'relative',overflow:'hidden',background:'var(--bg)'}}>

      {/* Subtle bg */}
      <div style={{position:'absolute',inset:0,pointerEvents:'none'}}>
        <div style={{position:'absolute',top:'-15%',left:'50%',transform:'translateX(-50%)',width:'900px',height:'700px',background:'radial-gradient(ellipse, rgba(91,79,207,0.055) 0%, transparent 65%)',filter:'blur(80px)'}}/>
        <div style={{position:'absolute',inset:0,backgroundImage:'linear-gradient(rgba(0,0,0,0.022) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.022) 1px, transparent 1px)',backgroundSize:'52px 52px'}}/>
      </div>

      <div style={{position:'relative',width:'100%',maxWidth:740,textAlign:'center'}}>

        {/* Badge */}
        <div style={{display:'inline-flex',alignItems:'center',gap:7,marginBottom:28,animation:'fade-in 0.6s ease both'}}>
          <div style={{display:'flex',alignItems:'center',gap:7,background:'var(--accent-bg)',border:'1px solid var(--accent-border)',borderRadius:100,padding:'5px 16px'}}>
            <span style={{width:5,height:5,borderRadius:'50%',background:'var(--accent)',display:'inline-block',animation:'blink 2s infinite'}}/>
            <span style={{fontSize:11,fontWeight:500,color:'var(--accent)',fontFamily:'var(--font-mono)',letterSpacing:'0.3px'}}>India's AI Product Intelligence</span>
          </div>
        </div>

        {/* H1 — Sora, bold, tight */}
        <h1 style={{fontSize:'clamp(38px,6.5vw,72px)',fontWeight:800,lineHeight:1.05,letterSpacing:'-2.5px',color:'var(--ink)',marginBottom:16,animation:'fade-up 0.6s 0.08s ease both',opacity:0,animationFillMode:'forwards'}}>
          Product decisions,<br/>
          <span style={{background:'linear-gradient(135deg, var(--accent) 0%, var(--accent-2) 100%)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>
            rebuilt for India.
          </span>
        </h1>

        <p style={{fontSize:'clamp(15px,2vw,18px)',color:'var(--ink-3)',lineHeight:1.75,letterSpacing:'0.02em',maxWidth:460,margin:'0 auto 48px',fontWeight:300,animation:'fade-up 0.6s 0.15s ease both',opacity:0,animationFillMode:'forwards'}}>
          One honest score across India's top platforms.<br/>Fake reviews filtered. Real ratings, only.
        </p>

        {/* SEARCH BAR */}
        <div style={{animation:'fade-up 0.6s 0.22s ease both',opacity:0,animationFillMode:'forwards'}}>
          <div style={{background:'var(--bg-1)',border:`1.5px solid ${isRec?'rgba(220,38,38,0.45)':focused?'var(--accent)':'var(--border-hi)'}`,borderRadius:20,boxShadow:focused?`0 0 0 4px var(--accent-bg), var(--shadow-xl)`:`var(--shadow-lg)`,transition:'all 0.25s cubic-bezier(0.22,1,0.36,1)'}}>
            <div style={{display:'flex',alignItems:'center',padding:'7px 7px 7px 22px',gap:8}}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={focused?'var(--accent)':'var(--ink-4)'} strokeWidth="2.5" strokeLinecap="round" style={{flexShrink:0,transition:'stroke 0.2s'}}>
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input value={isRec?('Listening'+'.'.repeat(dots)):isProc?'Transcribing your voice...':query}
                onChange={e=>{if(!isBusy)setQuery(e.target.value)}}
                onKeyDown={e=>e.key==='Enter'&&!isBusy&&go()}
                onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
                placeholder={location?.city?`Ask anything — best phone for ${location.city}...`:'Ask anything — best AC for Chennai, best phone under ₹20,000'}
                readOnly={isBusy}
                style={{flex:1,border:'none',outline:'none',fontSize:16,fontWeight:300,letterSpacing:'0.02em',color:isRec?'var(--red)':'var(--ink)',background:'transparent',fontFamily:'var(--font-sans)',padding:'17px 0',minWidth:0,caretColor:'var(--accent)'}}/>
              {/* Mic */}
              <button onClick={toggleMic} disabled={isProc}
                style={{width:48,height:48,borderRadius:13,border:'1px solid var(--border)',flexShrink:0,background:isRec?'rgba(220,38,38,0.06)':'var(--bg-2)',cursor:isProc?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.2s',animation:isRec?'mic-ring 1.2s ease infinite':'none'}}
                onMouseEnter={e=>{if(!isRec&&!isProc){e.currentTarget.style.background='var(--accent-bg)';e.currentTarget.style.borderColor='var(--accent-border)'}}}
                onMouseLeave={e=>{if(!isRec){e.currentTarget.style.background='var(--bg-2)';e.currentTarget.style.borderColor='var(--border)'}}}>
                {isProc?<div style={{width:16,height:16,border:'1.5px solid var(--ink-4)',borderTopColor:'var(--accent)',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
                  :isRec?<svg width="13" height="13" viewBox="0 0 24 24" fill="var(--red)"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
                  :<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" strokeWidth="2" strokeLinecap="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>}
              </button>
              {/* Search btn */}
              <button onClick={()=>go()} disabled={!query.trim()||isBusy}
                style={{padding:'14px 26px',borderRadius:14,border:'none',background:query.trim()&&!isBusy?'var(--accent)':'var(--bg-3)',color:query.trim()&&!isBusy?'#fff':'var(--ink-4)',fontSize:14,fontWeight:600,cursor:!query.trim()||isBusy?'not-allowed':'pointer',transition:'all 0.2s',flexShrink:0,whiteSpace:'nowrap',boxShadow:query.trim()&&!isBusy?'0 4px 16px rgba(91,79,207,0.3)':'none'}}
                onMouseEnter={e=>{if(query.trim()&&!isBusy){e.currentTarget.style.background='#4A3FBF';e.currentTarget.style.transform='translateY(-1px)'}}}
                onMouseLeave={e=>{e.currentTarget.style.background=query.trim()&&!isBusy?'var(--accent)':'var(--bg-3)';e.currentTarget.style.transform='translateY(0)'}}>
                Search
              </button>
            </div>
          </div>

          {/* Voice feedback */}
          {isRec&&(
            <div style={{marginTop:14,display:'flex',alignItems:'center',gap:8,justifyContent:'center'}}>
              <div style={{display:'flex',gap:3,alignItems:'flex-end'}}>
                {[0,1,2,3].map(i=><div key={i} style={{width:2.5,background:'var(--red)',borderRadius:2,height:`${10+i*3}px`,animation:`wave-bar 0.5s ${i*0.1}s infinite alternate ease-in-out`}}/>)}
              </div>
              <span style={{fontSize:13,color:'var(--red)',fontWeight:500,letterSpacing:'0.01em'}}>Listening — tap stop when done</span>
            </div>
          )}
          {recState==='error'&&voiceMsg&&<div style={{marginTop:10,fontSize:13,color:'var(--red)',background:'rgba(220,38,38,0.05)',border:'1px solid rgba(220,38,38,0.15)',borderRadius:10,padding:'9px 16px'}}>⚠️ {voiceMsg}</div>}
          {transcript&&!isBusy&&<div style={{marginTop:10,fontSize:13,background:'var(--green-bg)',border:'1px solid rgba(22,163,74,0.18)',borderRadius:10,padding:'9px 16px',textAlign:'left',display:'flex',gap:8}}><span style={{color:'var(--green)'}}>✓</span><span><span style={{color:'var(--ink-3)'}}>You said: </span><span style={{color:'var(--ink)',fontWeight:500}}>{transcript}</span></span></div>}

          {/* Hint */}
          {!isRec&&!isProc&&!transcript&&<p style={{marginTop:12,fontSize:11,color:'var(--ink-4)',fontFamily:'var(--font-mono)',letterSpacing:'0.5px'}}>{location?.city?`📍 Personalised for ${location.city}`:'🎙️  Speak in 22 Indian languages'}</p>}

          {/* Example pills */}
          <div style={{display:'flex',gap:8,marginTop:20,flexWrap:'wrap',justifyContent:'center'}}>
            {EXAMPLES.map(ex=>(
              <button key={ex} onClick={()=>go(ex)}
                style={{padding:'8px 18px',borderRadius:100,fontSize:13,fontWeight:300,letterSpacing:'0.02em',background:'var(--bg-1)',border:'1.5px solid var(--border-hi)',color:'var(--ink-3)',cursor:'pointer',transition:'all 0.2s',whiteSpace:'nowrap',boxShadow:'var(--shadow-xs)'}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--accent)';e.currentTarget.style.color='var(--accent)';e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 4px 12px rgba(91,79,207,0.12)'}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border-hi)';e.currentTarget.style.color='var(--ink-3)';e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='var(--shadow-xs)'}}>
                {ex}
              </button>
            ))}
          </div>
        </div>

        {/* Stats — generous spacing */}
        <div style={{marginTop:72,display:'flex',justifyContent:'center',gap:clamp(56),flexWrap:'wrap',animation:'fade-up 0.6s 0.38s ease both',opacity:0,animationFillMode:'forwards'}}>
          {[['5M+','Reviews analysed'],['38%','Fake reviews removed'],['22','Indian languages'],['8+','Platforms']].map(([n,l])=>(
            <div key={l} style={{textAlign:'center',minWidth:72}}>
              <div style={{fontSize:'clamp(28px,4vw,38px)',fontWeight:800,color:'var(--ink)',letterSpacing:'-1.5px',lineHeight:1,fontFamily:'var(--font-sans)'}}>
                {n.replace(/[M%+]/g,'')}<span style={{color:'var(--accent)'}}>{n.match(/[M%+]+/)?.[0]}</span>
              </div>
              <div style={{fontSize:11,color:'var(--ink-4)',marginTop:6,fontFamily:'var(--font-mono)',letterSpacing:'0.3px',textTransform:'uppercase'}}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Platform ticker */}
      <div style={{position:'absolute',bottom:0,left:0,right:0,borderTop:'1px solid var(--border)',overflow:'hidden',padding:'13px 0',background:'rgba(255,255,255,0.9)',backdropFilter:'blur(8px)'}}>
        <div style={{display:'flex',gap:48,width:'max-content',animation:'ticker 28s linear infinite'}}>
          {[...SOURCES,...SOURCES].map((s,i)=><span key={i} style={{fontSize:11,fontWeight:500,color:'var(--ink-4)',whiteSpace:'nowrap',fontFamily:'var(--font-mono)',letterSpacing:'1px',textTransform:'uppercase'}}>◆ {s}</span>)}
        </div>
      </div>

      <style>{`
        @keyframes fade-up{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fade-in{from{opacity:0}to{opacity:1}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0.2}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes wave-bar{from{transform:scaleY(0.3)}to{transform:scaleY(1)}}
        @keyframes mic-ring{0%,100%{box-shadow:0 0 0 2px rgba(220,38,38,0.25)}50%{box-shadow:0 0 0 8px rgba(220,38,38,0.03)}}
        @keyframes ticker{from{transform:translateX(0)}to{transform:translateX(-50%)}}
      `}</style>
    </section>
  )
}
function clamp(n:number){return n}
