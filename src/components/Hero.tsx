'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { detectLocation, getCachedLocation, cacheLocation, type LocationData } from '@/lib/useLocation'

const EXAMPLES = [
  'Best AC for Chennai heat under ₹40,000',
  'Best phone under ₹20,000',
  'Best washing machine for hard water',
]

export default function Hero() {
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const [recState, setRecState] = useState<'idle'|'recording'|'processing'|'error'>('idle')
  const [voiceMsg, setVoiceMsg] = useState('')
  const [transcript, setTranscript] = useState('')
  const [dots, setDots] = useState(1)
  const [location, setLocation] = useState<LocationData|null>(null)
  const mediaRef = useRef<MediaRecorder|null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream|null>(null)
  const router = useRouter()

  useEffect(() => {
    const cached = getCachedLocation()
    if (cached?.city) { setLocation(cached); return }
    detectLocation().then(loc => { if (loc?.city) { setLocation(loc); cacheLocation(loc) } })
  }, [])

  useEffect(() => {
    if (recState !== 'recording') return
    const id = setInterval(() => setDots(d => d >= 3 ? 1 : d + 1), 450)
    return () => clearInterval(id)
  }, [recState])

  const go = (q?: string) => {
    const t = (q || query).trim()
    if (t) router.push(`/search?q=${encodeURIComponent(t)}`)
  }

  const stopRec = () => {
    mediaRef.current?.stop()
    streamRef.current?.getTracks().forEach(t => t.stop())
    setRecState('processing')
  }

  const startRec = async () => {
    setTranscript(''); setVoiceMsg('')
    if (!navigator.mediaDevices?.getUserMedia) { setRecState('error'); setVoiceMsg('Not supported. Use Chrome.'); return }
    let stream: MediaStream
    try { stream = await navigator.mediaDevices.getUserMedia({ audio:true }); streamRef.current = stream }
    catch { setRecState('error'); setVoiceMsg('Mic access denied.'); return }
    const mimes = ['audio/webm;codecs=opus','audio/webm','audio/ogg;codecs=opus','audio/ogg']
    const mime = mimes.find(m => MediaRecorder.isTypeSupported(m)) || ''
    const rec = mime ? new MediaRecorder(stream,{mimeType:mime}) : new MediaRecorder(stream)
    mediaRef.current = rec; chunksRef.current = []
    rec.ondataavailable = e => { if (e.data?.size>0) chunksRef.current.push(e.data) }
    rec.onstop = async () => {
      const total = chunksRef.current.reduce((s,c)=>s+c.size,0)
      if (!total) { setRecState('error'); setVoiceMsg('No audio. Try again.'); return }
      const bt = mime ? mime.split(';')[0] : 'audio/webm'
      const blob = new Blob(chunksRef.current,{type:bt})
      const form = new FormData()
      form.append('file', blob, `rec.${bt.includes('ogg')?'ogg':'webm'}`)
      try {
        const r = await fetch('/api/ask',{method:'POST',body:form})
        const d = await r.json()
        if (d.transcript) { setTranscript(d.transcript); setQuery(d.transcript); setRecState('idle'); setVoiceMsg('') }
        else { setRecState('error'); setVoiceMsg(d.error||'Could not understand.') }
      } catch { setRecState('error'); setVoiceMsg('Network error.') }
    }
    rec.start(200); setRecState('recording')
  }

  const toggleMic = () => recState==='recording' ? stopRec() : startRec()
  const isRec = recState==='recording', isProc = recState==='processing', isBusy = isRec||isProc

  return (
    <section style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'clamp(100px,12vw,140px) clamp(20px,5vw,48px) clamp(80px,8vw,120px)', position:'relative', overflow:'hidden', background:'var(--bg)' }}>

      {/* Architectural background */}
      <div style={{ position:'absolute', inset:0, pointerEvents:'none', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:'-20%', right:'-10%', width:'600px', height:'600px', borderRadius:'50%', background:'radial-gradient(circle, rgba(44,95,46,0.05) 0%, transparent 70%)', filter:'blur(60px)' }} />
        <div style={{ position:'absolute', bottom:'-10%', left:'-5%', width:'500px', height:'500px', borderRadius:'50%', background:'radial-gradient(circle, rgba(139,105,20,0.04) 0%, transparent 70%)', filter:'blur(80px)' }} />
        {/* Fine grid */}
        <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(26,24,20,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(26,24,20,0.018) 1px, transparent 1px)', backgroundSize:'60px 60px' }} />
      </div>

      <div style={{ position:'relative', width:'100%', maxWidth:780, textAlign:'center' }}>

        {/* Serif editorial label */}
        <div style={{ display:'inline-flex', alignItems:'center', gap:10, marginBottom:36, animation:'fade-in 0.8s ease both' }}>
          <div style={{ width:28, height:1, background:'var(--accent)' }} />
          <span style={{ fontSize:11, fontWeight:500, color:'var(--accent)', fontFamily:'var(--font-mono)', letterSpacing:'2px', textTransform:'uppercase' }}>
            AI Product Intelligence · India
          </span>
          <div style={{ width:28, height:1, background:'var(--accent)' }} />
        </div>

        {/* Playfair Display headline — editorial authority */}
        <h1 style={{ fontFamily:'var(--font-serif)', fontSize:'clamp(40px,7vw,76px)', fontWeight:700, lineHeight:1.08, letterSpacing:'-1px', color:'var(--ink)', marginBottom:20, animation:'fade-up 0.8s 0.1s ease both', opacity:0, animationFillMode:'forwards' }}>
          Product decisions,<br/>
          <em style={{ fontStyle:'italic', color:'var(--accent)' }}>rebuilt for India.</em>
        </h1>

        {/* DM Sans body — wide spaced */}
        <p style={{ fontFamily:'var(--font-sans)', fontSize:'clamp(15px,2vw,18px)', color:'var(--ink-3)', lineHeight:1.8, letterSpacing:'0.02em', maxWidth:480, margin:'0 auto 52px', fontWeight:300, animation:'fade-up 0.8s 0.18s ease both', opacity:0, animationFillMode:'forwards' }}>
          One honest score across India&apos;s top platforms.<br/>
          Fake reviews filtered. Real ratings, only.
        </p>

        {/* ── SEARCH — premium field ── */}
        <div style={{ animation:'fade-up 0.8s 0.26s ease both', opacity:0, animationFillMode:'forwards' }}>
          <div style={{
            background:'var(--bg-1)',
            border:`1.5px solid ${isRec ? 'rgba(220,38,38,0.5)' : focused ? 'var(--ink)' : 'var(--border-hi)'}`,
            borderRadius:'var(--radius-xl)',
            boxShadow: focused
              ? '0 0 0 4px rgba(26,24,20,0.06), var(--shadow-xl)'
              : 'var(--shadow-lg)',
            transition:'all 0.35s cubic-bezier(0.22,1,0.36,1)',
          }}>
            <div style={{ display:'flex', alignItems:'center', padding:'8px 8px 8px 24px', gap:8 }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={focused?'var(--ink)':'var(--ink-4)'} strokeWidth="2" strokeLinecap="round" style={{ flexShrink:0, transition:'stroke 0.2s' }}>
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>

              <input
                value={isRec ? ('Listening' + '.'.repeat(dots)) : isProc ? 'Transcribing your voice...' : query}
                onChange={e => { if (!isBusy) setQuery(e.target.value) }}
                onKeyDown={e => e.key==='Enter' && !isBusy && go()}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder={location?.city ? `Ask anything — best phone for ${location.city}...` : 'Ask anything — best AC for Chennai, best phone under ₹20,000'}
                readOnly={isBusy}
                style={{ flex:1, border:'none', outline:'none', fontSize:16, fontWeight:300, letterSpacing:'0.02em', color: isRec ? '#DC2626' : 'var(--ink)', background:'transparent', fontFamily:'var(--font-sans)', padding:'17px 0', minWidth:0, caretColor:'var(--accent)' }}
              />

              {/* Mic — minimal */}
              <button onClick={toggleMic} disabled={isProc}
                style={{ width:48, height:48, borderRadius:'var(--radius)', border:'1px solid var(--border)', flexShrink:0, background: isRec ? 'rgba(220,38,38,0.06)' : 'var(--bg-2)', cursor: isProc ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s', animation: isRec ? 'mic-ring 1.2s ease infinite' : 'none' }}
                onMouseEnter={e => { if (!isRec&&!isProc) { e.currentTarget.style.background='var(--bg-3)'; e.currentTarget.style.borderColor='var(--border-hi)' } }}
                onMouseLeave={e => { if (!isRec) { e.currentTarget.style.background='var(--bg-2)'; e.currentTarget.style.borderColor='var(--border)' } }}>
                {isProc
                  ? <div style={{ width:16, height:16, border:'1.5px solid var(--ink-4)', borderTopColor:'var(--accent)', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
                  : isRec
                  ? <svg width="13" height="13" viewBox="0 0 24 24" fill="#DC2626"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
                  : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" strokeWidth="1.8" strokeLinecap="round">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                      <line x1="12" y1="19" x2="12" y2="23"/>
                      <line x1="8" y1="23" x2="16" y2="23"/>
                    </svg>
                }
              </button>

              {/* Search — ink-filled button */}
              <button onClick={() => go()} disabled={!query.trim() || isBusy}
                style={{ padding:'14px 28px', borderRadius:'var(--radius-lg)', border:'none', background: query.trim()&&!isBusy ? 'var(--ink)' : 'var(--bg-3)', color: query.trim()&&!isBusy ? 'var(--bg)' : 'var(--ink-4)', fontSize:14, fontWeight:500, letterSpacing:'0.03em', cursor: !query.trim()||isBusy ? 'not-allowed' : 'pointer', transition:'all 0.25s cubic-bezier(0.22,1,0.36,1)', flexShrink:0, whiteSpace:'nowrap', fontFamily:'var(--font-sans)' }}
                onMouseEnter={e => { if (query.trim()&&!isBusy) { e.currentTarget.style.background='var(--accent)'; e.currentTarget.style.transform='translateY(-1px)' } }}
                onMouseLeave={e => { e.currentTarget.style.background=query.trim()&&!isBusy?'var(--ink)':'var(--bg-3)'; e.currentTarget.style.transform='translateY(0)' }}>
                Search
              </button>
            </div>
          </div>

          {/* Voice feedback */}
          {isRec && (
            <div style={{ marginTop:16, display:'flex', alignItems:'center', gap:10, justifyContent:'center' }}>
              <div style={{ display:'flex', gap:3, alignItems:'flex-end' }}>
                {[0,1,2,3].map(i => <div key={i} style={{ width:2.5, background:'#DC2626', borderRadius:2, height:`${10+i*3}px`, animation:`wave-bar 0.5s ${i*0.1}s infinite alternate ease-in-out` }} />)}
              </div>
              <span style={{ fontSize:13, color:'#DC2626', fontWeight:400, fontFamily:'var(--font-sans)', letterSpacing:'0.02em' }}>Listening — tap stop when done</span>
            </div>
          )}
          {recState==='error' && voiceMsg && (
            <div style={{ marginTop:12, fontSize:13, color:'#B91C1C', background:'rgba(220,38,38,0.05)', border:'1px solid rgba(220,38,38,0.15)', borderRadius:10, padding:'10px 18px', letterSpacing:'0.01em' }}>⚠️ {voiceMsg}</div>
          )}
          {transcript && !isBusy && (
            <div style={{ marginTop:12, fontSize:13, background:'rgba(44,95,46,0.06)', border:'1px solid rgba(44,95,46,0.18)', borderRadius:10, padding:'10px 18px', textAlign:'left', display:'flex', gap:8 }}>
              <span style={{ color:'var(--accent)' }}>✓</span>
              <span><span style={{ color:'var(--ink-3)' }}>You said: </span><span style={{ color:'var(--ink)', fontWeight:500 }}>{transcript}</span></span>
            </div>
          )}

          {/* Hint text */}
          {!isRec && !isProc && !transcript && (
            <p style={{ marginTop:14, fontSize:12, color:'var(--ink-4)', fontFamily:'var(--font-mono)', letterSpacing:'0.5px' }}>
              {location?.city ? `📍 Personalised for ${location.city}` : '🎙️  Speak in 22 Indian languages'}
            </p>
          )}

          {/* Example queries — refined pills */}
          <div style={{ display:'flex', gap:8, marginTop:24, flexWrap:'wrap', justifyContent:'center' }}>
            {EXAMPLES.map(ex => (
              <button key={ex} onClick={() => go(ex)}
                style={{ padding:'9px 18px', borderRadius:'var(--radius-xl)', fontSize:13, fontWeight:300, letterSpacing:'0.02em', background:'transparent', border:'1px solid var(--border-hi)', color:'var(--ink-3)', cursor:'pointer', transition:'all 0.25s cubic-bezier(0.22,1,0.36,1)', whiteSpace:'nowrap', fontFamily:'var(--font-sans)' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor='var(--ink)'; e.currentTarget.style.color='var(--ink)'; e.currentTarget.style.background='var(--bg-1)'; e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='var(--shadow-sm)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border-hi)'; e.currentTarget.style.color='var(--ink-3)'; e.currentTarget.style.background='transparent'; e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none' }}>
                {ex}
              </button>
            ))}
          </div>
        </div>

        {/* Stats — generous whitespace, large numerals */}
        <div style={{ marginTop:80, display:'flex', justifyContent:'center', gap:clamp(64), flexWrap:'wrap', animation:'fade-up 0.8s 0.4s ease both', opacity:0, animationFillMode:'forwards' }}>
          {[['5M+','Reviews analysed'],['38%','Fake reviews filtered'],['22','Indian languages'],['8+','Platforms']].map(([n,l],i) => (
            <div key={l} style={{ textAlign:'center' }}>
              {i > 0 && <div style={{ position:'absolute', width:1, height:32, background:'var(--border)', top:'50%', left:0, transform:'translateY(-50%)' }} />}
              <div style={{ fontFamily:'var(--font-serif)', fontSize:'clamp(30px,4.5vw,44px)', fontWeight:700, color:'var(--ink)', letterSpacing:'-1.5px', lineHeight:1, fontStyle:'italic' }}>
                {n.replace(/[M%+]/g,'')}<span style={{ color:'var(--accent)' }}>{n.match(/[M%+]+/)?.[0]}</span>
              </div>
              <div style={{ fontSize:11, color:'var(--ink-4)', marginTop:8, fontFamily:'var(--font-mono)', letterSpacing:'0.5px', textTransform:'uppercase' }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes fade-up{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fade-in{from{opacity:0}to{opacity:1}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0.2}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes wave-bar{from{transform:scaleY(0.3)}to{transform:scaleY(1)}}
        @keyframes mic-ring{0%,100%{box-shadow:0 0 0 2px rgba(220,38,38,0.25)}50%{box-shadow:0 0 0 8px rgba(220,38,38,0.03)}}
      `}</style>
    </section>
  )
}
function clamp(n:number){return n}
