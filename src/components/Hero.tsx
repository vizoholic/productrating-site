'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const EXAMPLES = [
  { hi: 'Delhi mein best AC kaunsa hai?', en: 'Best AC for Delhi' },
  { hi: '₹20,000 ke andar best phone', en: 'Best phone under ₹20K' },
  { hi: 'Best fridge for small family', en: 'Best fridge for family' },
]

const LANGS = ['हिंदी', 'தமிழ்', 'తెలుగు', 'বাংলা', 'मराठी', 'English']

export default function Hero() {
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const [recording, setRecording] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [dots, setDots] = useState(0)
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const dotsRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const router = useRouter()

  // Animate dots while recording
  useEffect(() => {
    if (recording) {
      dotsRef.current = setInterval(() => setDots(d => (d + 1) % 4), 400)
    } else {
      if (dotsRef.current) clearInterval(dotsRef.current)
      setDots(0)
    }
    return () => { if (dotsRef.current) clearInterval(dotsRef.current) }
  }, [recording])

  const go = (q?: string) => {
    const t = (q || query).trim()
    if (t) router.push(`/search?q=${encodeURIComponent(t)}`)
  }

  const stopRecording = () => {
    if (mediaRef.current && mediaRef.current.state !== 'inactive') {
      mediaRef.current.stop()
    }
    setRecording(false)
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/ogg'

      const rec = new MediaRecorder(stream, { mimeType: mime })
      mediaRef.current = rec
      chunksRef.current = []

      rec.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }

      rec.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        setRecording(false)
        setTranscribing(true)
        try {
          const blob = new Blob(chunksRef.current, { type: mime.split(';')[0] })
          const form = new FormData()
          form.append('file', blob, `recording.${mime.includes('webm') ? 'webm' : 'ogg'}`)
          const res = await fetch('/api/ask', { method: 'POST', body: form })
          const data = await res.json()
          if (data.transcript) {
            setTranscript(data.transcript)
            setQuery(data.transcript)
          }
        } catch (e) {
          console.error('STT error:', e)
        }
        setTranscribing(false)
      }

      rec.start(250) // collect data every 250ms
      setRecording(true)
      setTranscript('')
    } catch (err) {
      alert('Microphone permission denied. Please allow mic access to use voice search.')
    }
  }

  const toggleMic = () => {
    if (recording) stopRecording()
    else startRecording()
  }

  const listenText = 'Listening' + '.'.repeat(dots)

  return (
    <section style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: 'clamp(80px,10vw,120px) clamp(16px,4vw,24px) 60px',
      background: '#fff', textAlign: 'center', position: 'relative',
    }}>
      {/* Subtle dot grid */}
      <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(#2563EB0A 1px, transparent 1px)', backgroundSize:'28px 28px', pointerEvents:'none' }} />

      {/* India LLM badge */}
      <div style={{
        display:'inline-flex', alignItems:'center', gap:8,
        background:'#EFF6FF', border:'1px solid #BFDBFE',
        borderRadius:100, padding:'5px 16px', marginBottom:24,
        fontSize:13, fontWeight:600, color:'#2563EB', animation:'fade-up .4s ease both',
      }}>
        <span style={{ width:7, height:7, borderRadius:'50%', background:'#2563EB', display:'inline-block', animation:'blink 2s infinite' }} />
        Powered by Sarvam AI — India&apos;s own LLM
      </div>

      {/* H1 */}
      <h1 style={{
        fontSize:'clamp(36px,5.5vw,56px)', fontWeight:800,
        lineHeight:1.08, letterSpacing:'-1.5px', color:'#111827',
        maxWidth:700, marginBottom:14,
        animation:'fade-up .4s .06s ease both', opacity:0, animationFillMode:'forwards',
      }}>
        Find the best product<br />
        <span style={{ color:'#2563EB' }}>in seconds.</span>
      </h1>

      <p style={{
        fontSize:17, color:'#6B7280', maxWidth:460, lineHeight:1.6,
        marginBottom:36, fontWeight:400,
        animation:'fade-up .4s .12s ease both', opacity:0, animationFillMode:'forwards',
      }}>
        Ask in your language. Built on India&apos;s LLM (Sarvam AI).<br />
        No fake reviews. City-specific insights.
      </p>

      {/* ── SEARCH BAR ── */}
      <div style={{ width:'100%', maxWidth:680, animation:'fade-up .4s .18s ease both', opacity:0, animationFillMode:'forwards' }}>
        <div style={{
          display:'flex', alignItems:'center', gap:8,
          background:'#fff', borderRadius:14, padding:'6px 6px 6px 18px',
          border:`2px solid ${recording ? '#EF4444' : focused ? '#2563EB' : '#E5E7EB'}`,
          boxShadow: recording
            ? '0 0 0 4px rgba(239,68,68,0.1), 0 4px 20px rgba(0,0,0,0.08)'
            : focused
            ? '0 0 0 4px rgba(37,99,235,0.1), 0 4px 20px rgba(0,0,0,0.08)'
            : '0 2px 12px rgba(0,0,0,0.06)',
          transition:'all .2s',
        }}>
          {/* Search icon */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={focused||recording?'#2563EB':'#9CA3AF'} strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink:0, transition:'stroke .2s' }}>
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>

          <input
            value={recording ? listenText : transcribing ? 'Transcribing your voice...' : query}
            onChange={e => { if (!recording && !transcribing) setQuery(e.target.value) }}
            onKeyDown={e => e.key === 'Enter' && !recording && !transcribing && go()}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder='Best AC for Delhi under ₹40,000'
            readOnly={recording || transcribing}
            style={{
              flex:1, border:'none', outline:'none',
              fontSize:16, color: recording ? '#EF4444' : '#111827',
              background:'none', fontFamily:'Inter,sans-serif',
              padding:'12px 0', fontWeight: recording ? 500 : 400,
            }}
          />

          {/* Mic button */}
          <button
            onClick={toggleMic}
            disabled={transcribing}
            title="Speak in any language — हिंदी, தமிழ், తెలుగు & more"
            style={{
              width:42, height:42, borderRadius:10, border:'none',
              background: recording ? '#EF4444' : '#F3F4F6',
              cursor: transcribing ? 'not-allowed' : 'pointer',
              display:'flex', alignItems:'center', justifyContent:'center',
              flexShrink:0, transition:'all .2s',
              boxShadow: recording ? '0 0 0 3px rgba(239,68,68,0.25)' : 'none',
              animation: recording ? 'mic-pulse 1s ease infinite' : 'none',
            }}
            onMouseEnter={e => { if (!recording && !transcribing) (e.currentTarget.style.background='#E5E7EB') }}
            onMouseLeave={e => { if (!recording) (e.currentTarget.style.background=recording?'#EF4444':'#F3F4F6') }}
          >
            {transcribing ? (
              <div style={{ width:16, height:16, border:'2px solid #9CA3AF', borderTopColor:'#2563EB', borderRadius:'50%', animation:'spin .6s linear infinite' }} />
            ) : recording ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff">
                <rect x="6" y="6" width="12" height="12" rx="2"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            )}
          </button>

          {/* Search button */}
          <button
            onClick={() => go()}
            disabled={(!query.trim() && !transcript) || recording || transcribing}
            style={{
              background:'#2563EB', color:'#fff', border:'none', borderRadius:10,
              padding:'11px 24px', fontSize:15, fontWeight:600, cursor:'pointer',
              fontFamily:'Inter,sans-serif', transition:'background .15s', flexShrink:0,
              opacity: (query.trim() || transcript) && !recording ? 1 : 0.5,
            }}
            onMouseEnter={e => { if (query.trim()) (e.currentTarget.style.background='#1D4ED8') }}
            onMouseLeave={e => (e.currentTarget.style.background='#2563EB')}
          >
            Search →
          </button>
        </div>

        {/* Recording state info */}
        {recording && (
          <div style={{ marginTop:10, fontSize:14, color:'#EF4444', fontWeight:500, display:'flex', alignItems:'center', gap:6, justifyContent:'center' }}>
            <span style={{ width:8, height:8, borderRadius:'50%', background:'#EF4444', display:'inline-block', animation:'blink 1s infinite' }} />
            Listening... Tap the stop button when done
          </div>
        )}
        {transcribing && (
          <div style={{ marginTop:10, fontSize:14, color:'#6B7280', fontWeight:500 }}>
            Transcribing your voice...
          </div>
        )}
        {transcript && !recording && !transcribing && (
          <div style={{ marginTop:10, fontSize:14, color:'#374151', background:'#F9FAFB', border:'1px solid #E5E7EB', borderRadius:8, padding:'8px 14px', textAlign:'left' }}>
            <span style={{ color:'#6B7280', fontWeight:500 }}>You said: </span>
            <span style={{ fontWeight:600 }}>{transcript}</span>
          </div>
        )}

        {/* Mic hint */}
        {!recording && !transcribing && !transcript && (
          <p style={{ marginTop:10, fontSize:13, color:'#9CA3AF', display:'flex', alignItems:'center', gap:6, justifyContent:'center' }}>
            <span>🎙️</span> Tap mic to speak — Powered by Sarvam AI (India LLM)
          </p>
        )}

        {/* Example queries */}
        <div style={{ display:'flex', gap:8, marginTop:14, flexWrap:'wrap', justifyContent:'center' }}>
          {EXAMPLES.map(ex => (
            <button key={ex.hi} onClick={() => go(ex.hi)} style={{
              background:'#F9FAFB', border:'1px solid #E5E7EB', borderRadius:100,
              padding:'7px 16px', fontSize:13, color:'#374151',
              cursor:'pointer', fontFamily:'Inter,sans-serif',
              fontWeight:500, transition:'all .15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='#2563EB'; e.currentTarget.style.color='#2563EB'; e.currentTarget.style.background='#EFF6FF' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='#E5E7EB'; e.currentTarget.style.color='#374151'; e.currentTarget.style.background='#F9FAFB' }}>
              {ex.hi}
            </button>
          ))}
        </div>
      </div>

      {/* Language pills */}
      <div style={{ display:'flex', gap:8, marginTop:28, flexWrap:'wrap', justifyContent:'center', animation:'fade-up .4s .24s ease both', opacity:0, animationFillMode:'forwards' }}>
        <span style={{ fontSize:12, color:'#9CA3AF', fontWeight:500, marginRight:4 }}>Ask in:</span>
        {LANGS.map(l => (
          <span key={l} style={{ fontSize:12, color:'#6B7280', background:'#F3F4F6', borderRadius:100, padding:'3px 10px', fontWeight:500 }}>{l}</span>
        ))}
        <span style={{ fontSize:12, color:'#6B7280' }}>& more</span>
      </div>

      {/* Stats */}
      <div style={{
        display:'flex', marginTop:48, background:'#F9FAFB',
        border:'1px solid #E5E7EB', borderRadius:12, overflow:'hidden',
        animation:'fade-up .4s .3s ease both', opacity:0, animationFillMode:'forwards',
      }}>
        {[['5M+','Reviews analysed'],['50K+','Products tracked'],['38%','Fake reviews caught'],['11','Languages']].map(([n,l],i) => (
          <div key={l} style={{ padding:'16px clamp(16px,3vw,28px)', textAlign:'center', borderRight:i<3?'1px solid #E5E7EB':'none' }}>
            <div style={{ fontSize:'clamp(18px,2.5vw,22px)', fontWeight:800, color:'#111827', letterSpacing:'-0.5px', fontFamily:'Inter,sans-serif' }}>
              {n.replace(/[M%K+]/g,'')}<span style={{ color:'#2563EB' }}>{n.match(/[M%K+]+/)?.[0]}</span>
            </div>
            <div style={{ fontSize:11, color:'#9CA3AF', marginTop:2, fontWeight:500 }}>{l}</div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes mic-pulse { 0%,100%{box-shadow:0 0 0 3px rgba(239,68,68,0.25)} 50%{box-shadow:0 0 0 6px rgba(239,68,68,0.1)} }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </section>
  )
}
