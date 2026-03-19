'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Saaras STT supports 22 Indian languages
const LANG_PILLS = ['हिंदी','தமிழ்','తెలుగు','বাংলা','मराठी','ਪੰਜਾਬੀ','ગુજરાતી','ಕನ್ನಡ','English', '+13 more']

const EXAMPLES = [
  'Delhi mein best AC kaunsa hai?',
  '₹20,000 ke andar best phone',
  'Best fridge for small family',
]

export default function Hero() {
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const [recording, setRecording] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [dots, setDots] = useState(1)
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const router = useRouter()

  useEffect(() => {
    if (!recording) return
    const id = setInterval(() => setDots(d => d >= 3 ? 1 : d + 1), 500)
    return () => clearInterval(id)
  }, [recording])

  const go = (q?: string) => {
    const t = (q || query).trim()
    if (t) router.push(`/search?q=${encodeURIComponent(t)}`)
  }

  const stopRec = () => {
    if (mediaRef.current && mediaRef.current.state !== 'inactive') mediaRef.current.stop()
    setRecording(false)
  }

  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mime = ['audio/webm;codecs=opus','audio/webm','audio/ogg'].find(m => MediaRecorder.isTypeSupported(m)) || ''
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
      mediaRef.current = rec
      chunksRef.current = []
      rec.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      rec.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        setRecording(false)
        setTranscribing(true)
        try {
          const ext = mime.includes('ogg') ? 'ogg' : 'webm'
          const blob = new Blob(chunksRef.current, { type: mime || 'audio/webm' })
          const form = new FormData()
          form.append('file', blob, `rec.${ext}`)
          const res = await fetch('/api/ask', { method: 'POST', body: form })
          const data = await res.json()
          if (data.transcript) { setTranscript(data.transcript); setQuery(data.transcript) }
          else if (data.error) console.error('STT error:', data.error)
        } catch (e) { console.error('Voice error:', e) }
        setTranscribing(false)
      }
      rec.start(200)
      setRecording(true)
      setTranscript('')
    } catch { alert('Microphone permission denied. Please allow mic access.') }
  }

  const toggleMic = () => recording ? stopRec() : startRec()

  return (
    <section style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: 'clamp(88px,12vw,120px) clamp(16px,5vw,24px) clamp(48px,6vw,60px)',
      background: '#fff', textAlign: 'center', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(#2563EB08 1px, transparent 1px)', backgroundSize:'28px 28px', pointerEvents:'none' }} />

      {/* Badge */}
      <div style={{ display:'inline-flex', alignItems:'center', gap:7, background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:100, padding:'5px 14px', marginBottom:20, fontSize:12, fontWeight:600, color:'#2563EB', animation:'fade-up .4s ease both', whiteSpace:'nowrap' }}>
        <span style={{ width:6, height:6, borderRadius:'50%', background:'#2563EB', display:'inline-block', animation:'blink 2s infinite' }} />
        Powered by Sarvam AI — India&apos;s own LLM
      </div>

      {/* H1 */}
      <h1 style={{ fontSize:'clamp(32px,6vw,56px)', fontWeight:800, lineHeight:1.08, letterSpacing:'-1.5px', color:'#111827', maxWidth:700, marginBottom:12, animation:'fade-up .4s .06s ease both', opacity:0, animationFillMode:'forwards' }}>
        Find the best product<br /><span style={{ color:'#2563EB' }}>in seconds.</span>
      </h1>

      <p style={{ fontSize:'clamp(15px,2vw,17px)', color:'#6B7280', maxWidth:460, lineHeight:1.6, marginBottom:32, animation:'fade-up .4s .12s ease both', opacity:0, animationFillMode:'forwards' }}>
        Ask in your language. Built on India&apos;s LLM (Sarvam AI).<br />
        No fake reviews. City-specific insights.
      </p>

      {/* ── SEARCH BAR ── */}
      <div style={{ width:'100%', maxWidth:660, animation:'fade-up .4s .18s ease both', opacity:0, animationFillMode:'forwards' }}>
        <div style={{
          display:'flex', alignItems:'center', gap:6,
          background:'#fff', borderRadius:14, padding:'5px 5px 5px 16px',
          border:`2px solid ${recording ? '#EF4444' : focused ? '#2563EB' : '#E5E7EB'}`,
          boxShadow: recording ? '0 0 0 4px rgba(239,68,68,0.1)' : focused ? '0 0 0 4px rgba(37,99,235,0.1)' : '0 2px 12px rgba(0,0,0,0.06)',
          transition:'all .2s',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={focused||recording?'#2563EB':'#9CA3AF'} strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink:0, transition:'stroke .2s' }}>
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            value={recording ? 'Listening' + '.'.repeat(dots) : transcribing ? 'Transcribing...' : query}
            onChange={e => { if (!recording && !transcribing) setQuery(e.target.value) }}
            onKeyDown={e => e.key === 'Enter' && !recording && !transcribing && go()}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Best AC for Delhi under ₹40,000?"
            readOnly={recording || transcribing}
            style={{ flex:1, border:'none', outline:'none', fontSize:16, color: recording ? '#EF4444' : '#111827', background:'none', fontFamily:'Inter,sans-serif', padding:'11px 0', minWidth:0 }}
          />
          {/* Mic button */}
          <button onClick={toggleMic} disabled={transcribing}
            title="Speak in any Indian language — Sarvam AI supports 22 languages"
            style={{
              width:42, height:42, borderRadius:10, border:'none', flexShrink:0,
              background: recording ? '#EF4444' : '#F3F4F6',
              cursor: transcribing ? 'not-allowed' : 'pointer',
              display:'flex', alignItems:'center', justifyContent:'center',
              transition:'all .2s',
              animation: recording ? 'mic-pulse 1s ease infinite' : 'none',
            }}>
            {transcribing ? (
              <div style={{ width:16, height:16, border:'2px solid #D1D5DB', borderTopColor:'#2563EB', borderRadius:'50%', animation:'spin .7s linear infinite' }} />
            ) : recording ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            )}
          </button>
          {/* Search btn */}
          <button onClick={() => go()} disabled={(!query.trim()&&!transcript)||recording||transcribing}
            style={{ background:'#2563EB', color:'#fff', border:'none', borderRadius:10, padding:'11px clamp(14px,2vw,22px)', fontSize:clamp14(), fontWeight:600, cursor:'pointer', fontFamily:'Inter,sans-serif', transition:'background .15s', flexShrink:0, whiteSpace:'nowrap', opacity:(query.trim()||transcript)&&!recording?1:0.5 }}
            onMouseEnter={e=>{if(query.trim())(e.currentTarget.style.background='#1D4ED8')}}
            onMouseLeave={e=>(e.currentTarget.style.background='#2563EB')}>
            Search →
          </button>
        </div>

        {/* Status messages */}
        {recording && (
          <div style={{ marginTop:10, fontSize:14, color:'#EF4444', fontWeight:500, display:'flex', alignItems:'center', gap:6, justifyContent:'center' }}>
            <span style={{ width:8, height:8, borderRadius:'50%', background:'#EF4444', display:'inline-block', animation:'blink 1s infinite' }} />
            Listening... tap stop when done
          </div>
        )}
        {transcribing && <p style={{ marginTop:10, fontSize:14, color:'#6B7280' }}>Transcribing your voice...</p>}
        {transcript && !recording && !transcribing && (
          <div style={{ marginTop:10, fontSize:14, color:'#374151', background:'#F9FAFB', border:'1px solid #E5E7EB', borderRadius:8, padding:'8px 14px', textAlign:'left' }}>
            <span style={{ color:'#6B7280', fontWeight:500 }}>You said: </span>
            <span style={{ fontWeight:600 }}>{transcript}</span>
          </div>
        )}
        {!recording && !transcribing && !transcript && (
          <p style={{ marginTop:10, fontSize:13, color:'#9CA3AF', display:'flex', alignItems:'center', gap:5, justifyContent:'center', flexWrap:'wrap' }}>
            <span>🎙️</span> Tap mic · Powered by Sarvam AI (22 Indian languages)
          </p>
        )}

        {/* Example chips */}
        <div style={{ display:'flex', gap:8, marginTop:14, flexWrap:'wrap', justifyContent:'center' }}>
          {EXAMPLES.map(ex => (
            <button key={ex} onClick={() => go(ex)} style={{ background:'#F9FAFB', border:'1px solid #E5E7EB', borderRadius:100, padding:'7px 14px', fontSize:13, color:'#374151', cursor:'pointer', fontWeight:500, transition:'all .15s', whiteSpace:'nowrap' }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor='#2563EB';e.currentTarget.style.color='#2563EB';e.currentTarget.style.background='#EFF6FF'}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='#E5E7EB';e.currentTarget.style.color='#374151';e.currentTarget.style.background='#F9FAFB'}}>
              {ex}
            </button>
          ))}
        </div>
      </div>

      {/* Language pills */}
      <div style={{ display:'flex', gap:6, marginTop:24, flexWrap:'wrap', justifyContent:'center', animation:'fade-up .4s .24s ease both', opacity:0, animationFillMode:'forwards' }}>
        <span style={{ fontSize:12, color:'#9CA3AF', fontWeight:500, alignSelf:'center' }}>Ask in:</span>
        {LANG_PILLS.map(l => (
          <span key={l} style={{ fontSize:12, color:'#6B7280', background:'#F3F4F6', borderRadius:100, padding:'3px 10px', fontWeight:500 }}>{l}</span>
        ))}
      </div>

      {/* Stats */}
      <div style={{ display:'flex', marginTop:44, background:'#F9FAFB', border:'1px solid #E5E7EB', borderRadius:12, overflow:'hidden', animation:'fade-up .4s .3s ease both', opacity:0, animationFillMode:'forwards', flexWrap:'wrap' }}>
        {[['5M+','Reviews analysed'],['50K+','Products tracked'],['38%','Fake reviews caught'],['22','Indian languages']].map(([n,l],i) => (
          <div key={l} style={{ padding:'14px clamp(14px,3vw,28px)', textAlign:'center', borderRight:i<3?'1px solid #E5E7EB':'none', flexShrink:0 }}>
            <div style={{ fontSize:'clamp(17px,2.5vw,22px)', fontWeight:800, color:'#111827', letterSpacing:'-0.5px' }}>
              {n.replace(/[M%K+]/g,'')}<span style={{ color:'#2563EB' }}>{n.match(/[M%K+]+/)?.[0]}</span>
            </div>
            <div style={{ fontSize:11, color:'#9CA3AF', marginTop:2, fontWeight:500 }}>{l}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

function clamp14() { return 14 }
