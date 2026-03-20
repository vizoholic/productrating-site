'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const EXAMPLES = [
  { label: 'Best AC for Delhi heat', q: 'Best AC for Delhi under ₹40,000' },
  { label: '₹20K best phone', q: '₹20,000 ke andar best phone' },
  { label: 'Best washing machine', q: 'Best washing machine for hard water India' },
]

const LANGS = ['हिंदी','English','தமிழ்','తెలుగు','বাংলা','ಕನ್ನಡ','+16 more']

export default function Hero() {
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const [recState, setRecState] = useState<'idle'|'recording'|'processing'|'error'>('idle')
  const [voiceStatus, setVoiceStatus] = useState('')
  const [detectedLang, setDetectedLang] = useState('')
  const [transcript, setTranscript] = useState('')
  const [dots, setDots] = useState(1)
  const mediaRef = useRef<MediaRecorder|null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream|null>(null)
  const router = useRouter()

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
    if (mediaRef.current?.state !== 'inactive') mediaRef.current?.stop()
    streamRef.current?.getTracks().forEach(t => t.stop())
    setRecState('processing')
    setVoiceStatus('Transcribing your voice...')
  }

  const startRec = async () => {
    setTranscript(''); setDetectedLang(''); setVoiceStatus('')
    if (!navigator.mediaDevices?.getUserMedia) {
      setRecState('error'); setVoiceStatus('Voice not supported. Please use Chrome.'); return
    }
    let stream: MediaStream
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); streamRef.current = stream }
    catch { setRecState('error'); setVoiceStatus('Microphone denied. Allow mic in browser settings.'); return }

    const mimes = ['audio/webm;codecs=opus','audio/webm','audio/ogg;codecs=opus','audio/ogg']
    const mime = mimes.find(m => MediaRecorder.isTypeSupported(m)) || ''
    const rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream)
    mediaRef.current = rec; chunksRef.current = []
    rec.ondataavailable = e => { if (e.data?.size > 0) chunksRef.current.push(e.data) }
    rec.onstop = async () => {
      const total = chunksRef.current.reduce((s,c) => s+c.size, 0)
      if (total === 0) { setRecState('error'); setVoiceStatus('No audio. Speak louder and try again.'); return }
      const bt = mime ? mime.split(';')[0] : 'audio/webm'
      const blob = new Blob(chunksRef.current, { type: bt })
      const form = new FormData()
      form.append('file', blob, `rec.${bt.includes('ogg')?'ogg':'webm'}`)
      try {
        const res = await fetch('/api/ask', { method: 'POST', body: form })
        const data = await res.json()
        if (data.transcript) {
          setTranscript(data.transcript)
          setDetectedLang(data.detectedLanguage || '')
          setQuery(data.transcript)
          setRecState('idle')
          setVoiceStatus('')
        } else {
          setRecState('error')
          setVoiceStatus(data.error || 'Could not understand. Please try again.')
        }
      } catch { setRecState('error'); setVoiceStatus('Network error. Try again.') }
    }
    rec.start(200); setRecState('recording')
    setVoiceStatus('Listening' + '.'.repeat(dots))
  }

  const toggleMic = () => recState === 'recording' ? stopRec() : startRec()
  const isRec = recState === 'recording'
  const isProc = recState === 'processing'
  const isBusy = isRec || isProc

  return (
    <section style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: 'clamp(80px,10vw,100px) clamp(16px,5vw,24px) clamp(40px,5vw,60px)',
      background: '#fff', textAlign: 'center', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(#2563EB07 1px, transparent 1px)', backgroundSize:'28px 28px', pointerEvents:'none' }} />

      {/* Badge */}
      <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:100, padding:'5px 16px', marginBottom:20, fontSize:12, fontWeight:600, color:'#2563EB', animation:'fade-up .4s ease both' }}>
        <span style={{ width:6, height:6, borderRadius:'50%', background:'#2563EB', display:'inline-block', animation:'blink 2s infinite' }} />
        Powered by Sarvam AI — India&apos;s own LLM · 22 languages
      </div>

      {/* H1 — tight, dominant */}
      <h1 style={{ fontSize:'clamp(32px,6vw,60px)', fontWeight:800, lineHeight:1.05, letterSpacing:'-2px', color:'#111827', maxWidth:700, marginBottom:12, animation:'fade-up .4s .05s ease both', opacity:0, animationFillMode:'forwards' }}>
        Find the best product<br /><span style={{ color:'#2563EB' }}>in seconds.</span>
      </h1>

      <p style={{ fontSize:'clamp(15px,2vw,17px)', color:'#6B7280', maxWidth:440, lineHeight:1.6, marginBottom:36, animation:'fade-up .4s .1s ease both', opacity:0, animationFillMode:'forwards' }}>
        Ask in your language. We remove fake reviews and show you the real score — not what Amazon wants you to see.
      </p>

      {/* ── SEARCH BAR — THE HERO ── */}
      <div style={{ width:'100%', maxWidth:680, animation:'fade-up .4s .15s ease both', opacity:0, animationFillMode:'forwards' }}>
        <div style={{
          display:'flex', alignItems:'center', gap:6,
          background:'#fff', borderRadius:16, padding:'6px 6px 6px 18px',
          border:`2px solid ${isRec ? '#EF4444' : focused ? '#2563EB' : '#E5E7EB'}`,
          boxShadow: isRec ? '0 0 0 5px rgba(239,68,68,0.1), 0 4px 24px rgba(0,0,0,0.08)' : focused ? '0 0 0 5px rgba(37,99,235,0.1), 0 4px 24px rgba(0,0,0,0.08)' : '0 4px 20px rgba(0,0,0,0.07)',
          transition: 'all .2s',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={focused||isRec?'#2563EB':'#9CA3AF'} strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink:0, transition:'stroke .2s' }}>
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>

          <input
            value={isRec ? ('Listening' + '.'.repeat(dots)) : isProc ? 'Transcribing your voice...' : query}
            onChange={e => { if (!isBusy) setQuery(e.target.value) }}
            onKeyDown={e => e.key === 'Enter' && !isBusy && go()}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Best AC for Delhi under ₹40,000?"
            readOnly={isBusy}
            style={{ flex:1, border:'none', outline:'none', fontSize:17, color: isRec ? '#EF4444' : '#111827', background:'none', fontFamily:'Inter,sans-serif', padding:'13px 0', minWidth:0, fontWeight: isRec ? 500 : 400 }}
          />

          {/* Mic button — prominent */}
          <button onClick={toggleMic} disabled={isProc}
            title="Speak in any Indian language"
            style={{
              width:46, height:46, borderRadius:12, border:'none', flexShrink:0,
              background: isRec ? '#EF4444' : '#F3F4F6',
              cursor: isProc ? 'not-allowed' : 'pointer',
              display:'flex', alignItems:'center', justifyContent:'center',
              transition:'all .2s',
              animation: isRec ? 'mic-pulse 1s ease infinite' : 'none',
            }}
            onMouseEnter={e => { if (!isRec && !isProc) (e.currentTarget.style.background='#E5E7EB') }}
            onMouseLeave={e => { if (!isRec) (e.currentTarget.style.background=isRec?'#EF4444':'#F3F4F6') }}>
            {isProc
              ? <div style={{ width:18, height:18, border:'2.5px solid #D1D5DB', borderTopColor:'#2563EB', borderRadius:'50%', animation:'spin .7s linear infinite' }} />
              : isRec
              ? <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
              : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="23"/>
                  <line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
            }
          </button>

          <button onClick={() => go()} disabled={(!query.trim() && !transcript) || isBusy}
            style={{ background:'#2563EB', color:'#fff', border:'none', borderRadius:12, padding:'13px clamp(16px,2.5vw,28px)', fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:'Inter,sans-serif', transition:'background .15s', flexShrink:0, whiteSpace:'nowrap', opacity:(query.trim()||transcript)&&!isBusy?1:0.5 }}
            onMouseEnter={e => { if (query.trim()) e.currentTarget.style.background='#1D4ED8' }}
            onMouseLeave={e => (e.currentTarget.style.background='#2563EB')}>
            Search →
          </button>
        </div>

        {/* Voice feedback states */}
        {isRec && (
          <div style={{ marginTop:10, display:'flex', alignItems:'center', gap:8, justifyContent:'center' }}>
            <div style={{ display:'flex', gap:4 }}>
              {[0,1,2,3].map(i => (
                <div key={i} style={{ width:3, height: 8 + Math.random()*12, background:'#EF4444', borderRadius:2, animation:`wave-bar .6s ${i*0.1}s infinite alternate ease-in-out` }} />
              ))}
            </div>
            <span style={{ fontSize:14, color:'#EF4444', fontWeight:600 }}>Listening... tap stop when done</span>
          </div>
        )}
        {isProc && <p style={{ marginTop:10, fontSize:14, color:'#6B7280', textAlign:'center' }}>Transcribing with Sarvam AI...</p>}
        {recState === 'error' && voiceStatus && (
          <div style={{ marginTop:10, fontSize:13, color:'#EF4444', background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:8, padding:'8px 14px' }}>⚠️ {voiceStatus}</div>
        )}
        {transcript && !isBusy && recState !== 'error' && (
          <div style={{ marginTop:10, fontSize:14, background:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:8, padding:'10px 16px', textAlign:'left', display:'flex', alignItems:'flex-start', gap:8 }}>
            <span style={{ fontSize:16, flexShrink:0 }}>✅</span>
            <div>
              <span style={{ fontSize:12, color:'#059669', fontWeight:600, textTransform:'uppercase', letterSpacing:'.5px' }}>
                You said{detectedLang ? ` (${getLangName(detectedLang)})` : ''}:
              </span>
              <div style={{ fontSize:14, color:'#111827', fontWeight:600, marginTop:2 }}>{transcript}</div>
            </div>
          </div>
        )}
        {!isBusy && !transcript && recState !== 'error' && (
          <div style={{ marginTop:12, fontSize:13, color:'#9CA3AF', display:'flex', alignItems:'center', gap:6, justifyContent:'center' }}>
            <span>🎙️</span>
            <span>Try saying: <em style={{ color:'#6B7280', fontStyle:'normal', fontWeight:500 }}>&ldquo;Delhi mein best AC kaunsa hai?&rdquo;</em>
            </span>
          </div>
        )}

        {/* Example chips */}
        <div style={{ display:'flex', gap:8, marginTop:14, flexWrap:'wrap', justifyContent:'center' }}>
          {EXAMPLES.map(ex => (
            <button key={ex.q} onClick={() => go(ex.q)}
              style={{ background:'#F9FAFB', border:'1px solid #E5E7EB', borderRadius:100, padding:'7px 16px', fontSize:13, color:'#374151', cursor:'pointer', fontWeight:500, transition:'all .15s', whiteSpace:'nowrap' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='#2563EB'; e.currentTarget.style.color='#2563EB'; e.currentTarget.style.background='#EFF6FF' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='#E5E7EB'; e.currentTarget.style.color='#374151'; e.currentTarget.style.background='#F9FAFB' }}>
              {ex.label}
            </button>
          ))}
        </div>

        {/* Language pills */}
        <div style={{ display:'flex', gap:6, marginTop:16, flexWrap:'wrap', justifyContent:'center', alignItems:'center' }}>
          <span style={{ fontSize:12, color:'#9CA3AF' }}>Ask in:</span>
          {LANGS.map(l => <span key={l} style={{ fontSize:12, color:'#6B7280', background:'#F3F4F6', borderRadius:100, padding:'3px 10px', fontWeight:500 }}>{l}</span>)}
        </div>
      </div>

      {/* Stats strip */}
      <div style={{ display:'flex', marginTop:44, background:'#F9FAFB', border:'1px solid #E5E7EB', borderRadius:12, overflow:'hidden', animation:'fade-up .4s .3s ease both', opacity:0, animationFillMode:'forwards', flexWrap:'wrap' }}>
        {[['5M+','Reviews analysed'],['50K+','Products tracked'],['38%','Fake reviews caught'],['22','Indian languages']].map(([n,l],i) => (
          <div key={l} style={{ padding:'14px clamp(12px,3vw,28px)', textAlign:'center', borderRight: i<3 ? '1px solid #E5E7EB' : 'none', flexShrink:0 }}>
            <div style={{ fontSize:'clamp(17px,2.5vw,22px)', fontWeight:800, color:'#111827', letterSpacing:'-0.5px' }}>
              {n.replace(/[M%K+]/g,'')}<span style={{ color:'#2563EB' }}>{n.match(/[M%K+]+/)?.[0]}</span>
            </div>
            <div style={{ fontSize:11, color:'#9CA3AF', marginTop:2, fontWeight:500 }}>{l}</div>
          </div>
        ))}
      </div>

      <p style={{ marginTop:16, fontSize:12, color:'#9CA3AF', animation:'fade-up .4s .35s ease both', opacity:0, animationFillMode:'forwards' }}>
        🇮🇳 No ads · No paid placements · AI-adjusted ratings
      </p>

      <style>{`
        @keyframes mic-pulse{0%,100%{box-shadow:0 0 0 3px rgba(239,68,68,0.25)}50%{box-shadow:0 0 0 8px rgba(239,68,68,0.06)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0.3}}
        @keyframes wave-bar{from{transform:scaleY(0.4)}to{transform:scaleY(1)}}
      `}</style>
    </section>
  )
}

function getLangName(code: string): string {
  const map: Record<string,string> = { 'hi-IN':'Hindi','ta-IN':'Tamil','te-IN':'Telugu','bn-IN':'Bengali','mr-IN':'Marathi','kn-IN':'Kannada','ml-IN':'Malayalam','gu-IN':'Gujarati','pa-IN':'Punjabi','en-IN':'English' }
  return map[code] || code
}
