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

  const placeholder = location?.city
    ? `Ask anything — best phone for ${location.city}, best AC under ₹40,000`
    : 'Ask anything — best AC for Chennai, best phone under ₹20,000'

  return (
    <section style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'clamp(80px,10vw,110px) clamp(20px,5vw,24px) 80px', position:'relative', overflow:'hidden', background:'#FAFAF9' }}>

      {/* Background — very subtle */}
      <div style={{ position:'absolute', inset:0, pointerEvents:'none' }}>
        <div style={{ position:'absolute', top:'-15%', left:'50%', transform:'translateX(-50%)', width:'800px', height:'600px', background:'radial-gradient(ellipse, rgba(91,79,207,0.06) 0%, transparent 65%)', filter:'blur(80px)' }} />
        <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(0,0,0,0.022) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.022) 1px, transparent 1px)', backgroundSize:'52px 52px' }} />
      </div>

      <div style={{ position:'relative', width:'100%', maxWidth:720, textAlign:'center' }}>

        {/* Clean eyebrow — single pill */}
        <div style={{ display:'inline-flex', alignItems:'center', gap:8, marginBottom:28, animation:'fade-up 0.5s ease both' }}>
          <span style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(91,79,207,0.07)', border:'1px solid rgba(91,79,207,0.15)', borderRadius:100, padding:'5px 16px', fontSize:12, fontWeight:500, color:'#5B4FCF', fontFamily:'Geist Mono, monospace', letterSpacing:'0.3px' }}>
            <span style={{ width:5, height:5, borderRadius:'50%', background:'#5B4FCF', display:'inline-block', animation:'blink 2s infinite' }} />
            Ask in 22 Indian languages
          </span>
        </div>

        {/* Headline — calmer, more luxury */}
        <h1 style={{ fontSize:'clamp(38px,6vw,68px)', fontWeight:800, lineHeight:1.05, letterSpacing:'-2.5px', color:'#111110', marginBottom:14, animation:'fade-up 0.5s 0.07s ease both', opacity:0, animationFillMode:'forwards' }}>
          Product decisions,<br/>
          <span style={{ background:'linear-gradient(135deg, #5B4FCF 0%, #8B5CF6 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
            rebuilt for India.
          </span>
        </h1>

        <p style={{ fontSize:'clamp(15px,2vw,17px)', color:'#78716C', lineHeight:1.7, maxWidth:420, margin:'0 auto 44px', animation:'fade-up 0.5s 0.13s ease both', opacity:0, animationFillMode:'forwards' }}>
          One honest score across India&apos;s top platforms.<br/>Fake reviews filtered. Real ratings, only.
        </p>

        {/* ── SEARCH BAR — THE HERO PRODUCT ── */}
        <div style={{ animation:'fade-up 0.5s 0.19s ease both', opacity:0, animationFillMode:'forwards' }}>
          <div style={{
            background:'#FFFFFF',
            border:`1.5px solid ${isRec ? 'rgba(220,38,38,0.4)' : focused ? 'rgba(91,79,207,0.4)' : 'rgba(0,0,0,0.09)'}`,
            borderRadius:20,
            boxShadow: isRec
              ? '0 0 0 5px rgba(220,38,38,0.07), 0 20px 60px rgba(0,0,0,0.1)'
              : focused
              ? '0 0 0 5px rgba(91,79,207,0.07), 0 20px 60px rgba(0,0,0,0.12)'
              : '0 8px 40px rgba(0,0,0,0.08)',
            transition:'all 0.25s ease',
          }}>
            <div style={{ display:'flex', alignItems:'center', padding:'8px 8px 8px 22px', gap:8 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={focused ? '#5B4FCF' : '#C4B9AD'} strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink:0, transition:'stroke 0.2s' }}>
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>

              <input
                value={isRec ? ('Listening' + '.'.repeat(dots)) : isProc ? 'Transcribing your voice...' : query}
                onChange={e => { if (!isBusy) setQuery(e.target.value) }}
                onKeyDown={e => e.key==='Enter' && !isBusy && go()}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder={placeholder}
                readOnly={isBusy}
                style={{ flex:1, border:'none', outline:'none', fontSize:17, fontWeight:400, color: isRec ? '#DC2626' : '#111110', background:'transparent', fontFamily:'Sora,sans-serif', padding:'16px 0', minWidth:0, caretColor:'#5B4FCF' }}
              />

              {/* Mic button */}
              <button onClick={toggleMic} disabled={isProc}
                style={{ width:48, height:48, borderRadius:12, border:'none', flexShrink:0, background: isRec ? 'rgba(220,38,38,0.08)' : '#F5F4F2', cursor: isProc ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s', animation: isRec ? 'mic-ring 1s ease infinite' : 'none' }}
                onMouseEnter={e => { if (!isRec&&!isProc) e.currentTarget.style.background='rgba(91,79,207,0.08)' }}
                onMouseLeave={e => { if (!isRec) e.currentTarget.style.background=isRec?'rgba(220,38,38,0.08)':'#F5F4F2' }}>
                {isProc
                  ? <div style={{ width:16, height:16, border:'2px solid #D6D3D1', borderTopColor:'#5B4FCF', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />
                  : isRec
                  ? <svg width="14" height="14" viewBox="0 0 24 24" fill="#DC2626"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
                  : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#78716C" strokeWidth="2" strokeLinecap="round">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                      <line x1="12" y1="19" x2="12" y2="23"/>
                      <line x1="8" y1="23" x2="16" y2="23"/>
                    </svg>
                }
              </button>

              <button onClick={() => go()} disabled={!query.trim() || isBusy}
                style={{ padding:'14px 26px', borderRadius:14, border:'none', background: query.trim()&&!isBusy ? 'linear-gradient(135deg, #5B4FCF, #7C6FCD)' : '#EEECEA', color: query.trim()&&!isBusy ? '#fff' : '#C4B9AD', fontSize:15, fontWeight:600, cursor: !query.trim()||isBusy ? 'not-allowed' : 'pointer', transition:'all 0.2s', flexShrink:0, whiteSpace:'nowrap', boxShadow: query.trim()&&!isBusy ? '0 4px 16px rgba(91,79,207,0.3)' : 'none' }}
                onMouseEnter={e => { if (query.trim()&&!isBusy) e.currentTarget.style.transform='translateY(-1px)' }}
                onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)' }}>
                Search
              </button>
            </div>
          </div>

          {/* Voice feedback */}
          {isRec && (
            <div style={{ marginTop:14, display:'flex', alignItems:'center', gap:8, justifyContent:'center' }}>
              <div style={{ display:'flex', gap:3, alignItems:'flex-end' }}>
                {[0,1,2,3].map(i => (
                  <div key={i} style={{ width:3, background:'#DC2626', borderRadius:2, height:`${10+i*3}px`, animation:`wave-bar 0.5s ${i*0.1}s infinite alternate ease-in-out` }} />
                ))}
              </div>
              <span style={{ fontSize:13, color:'#DC2626', fontWeight:500 }}>Listening — tap stop when done</span>
            </div>
          )}
          {recState==='error' && voiceMsg && (
            <div style={{ marginTop:10, fontSize:13, color:'#DC2626', background:'rgba(220,38,38,0.05)', border:'1px solid rgba(220,38,38,0.15)', borderRadius:10, padding:'8px 16px' }}>⚠️ {voiceMsg}</div>
          )}
          {transcript && !isBusy && (
            <div style={{ marginTop:10, fontSize:13, background:'rgba(22,163,74,0.06)', border:'1px solid rgba(22,163,74,0.18)', borderRadius:10, padding:'8px 16px', textAlign:'left', display:'flex', gap:8 }}>
              <span style={{ color:'#16A34A' }}>✓</span>
              <span><span style={{ color:'#78716C' }}>You said: </span><span style={{ color:'#111110', fontWeight:500 }}>{transcript}</span></span>
            </div>
          )}

          {/* 3 example prompts only */}
          <div style={{ display:'flex', gap:8, marginTop:20, flexWrap:'wrap', justifyContent:'center' }}>
            {EXAMPLES.map(ex => (
              <button key={ex} onClick={() => go(ex)}
                style={{ padding:'8px 16px', borderRadius:100, fontSize:13, background:'#FFFFFF', border:'1.5px solid rgba(0,0,0,0.08)', color:'#57534E', cursor:'pointer', transition:'all 0.15s', whiteSpace:'nowrap', boxShadow:'0 1px 3px rgba(0,0,0,0.04)' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(91,79,207,0.35)'; e.currentTarget.style.color='#5B4FCF'; e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='0 4px 12px rgba(91,79,207,0.1)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(0,0,0,0.08)'; e.currentTarget.style.color='#57534E'; e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 1px 3px rgba(0,0,0,0.04)' }}>
                {ex}
              </button>
            ))}
          </div>
        </div>

        {/* Stats — luxury spacing, big numerals */}
        <div style={{ marginTop:64, display:'flex', justifyContent:'center', gap:clamp(52), flexWrap:'wrap', animation:'fade-up 0.5s 0.32s ease both', opacity:0, animationFillMode:'forwards' }}>
          {[['5M+','Reviews, made trustworthy'],['38%','Fake reviews removed'],['22','Indian languages'],['8+','Platforms tracked']].map(([n,l]) => (
            <div key={l} style={{ textAlign:'center', minWidth:80 }}>
              <div style={{ fontSize:'clamp(28px,4vw,36px)', fontWeight:800, color:'#111110', letterSpacing:'-1.5px', lineHeight:1, fontFamily:'Sora,sans-serif' }}>
                {n.replace(/[M%+]/g,'')}<span style={{ color:'#5B4FCF' }}>{n.match(/[M%+]+/)?.[0]}</span>
              </div>
              <div style={{ fontSize:12, color:'#A8A29E', marginTop:6, fontFamily:'Geist Mono, monospace', letterSpacing:'0.2px' }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes fade-up{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0.2}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes wave-bar{from{transform:scaleY(0.35)}to{transform:scaleY(1)}}
        @keyframes mic-ring{0%,100%{box-shadow:0 0 0 2px rgba(220,38,38,0.25)}50%{box-shadow:0 0 0 7px rgba(220,38,38,0.04)}}
      `}</style>
    </section>
  )
}
function clamp(n: number) { return n }
