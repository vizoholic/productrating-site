'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const EXAMPLES = [
  'Delhi mein best AC kaunsa hai?',
  '₹20,000 ke andar best phone',
  'Best fridge for small family',
]

const LANGS = ['हिंदी','தமிழ்','తెలుగు','বাংলা','मराठी','ಕನ್ನಡ','English','+15 more']

export default function Hero() {
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const [recState, setRecState] = useState<'idle'|'recording'|'processing'|'error'>('idle')
  const [statusMsg, setStatusMsg] = useState('')
  const [transcript, setTranscript] = useState('')
  const [dots, setDots] = useState(1)
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (recState !== 'recording') return
    const id = setInterval(() => setDots(d => d >= 3 ? 1 : d + 1), 500)
    return () => clearInterval(id)
  }, [recState])

  const go = (q?: string) => {
    const t = (q || query).trim()
    if (t) router.push(`/search?q=${encodeURIComponent(t)}`)
  }

  const stopRecording = () => {
    if (mediaRef.current && mediaRef.current.state !== 'inactive') {
      mediaRef.current.stop()
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
    }
    setRecState('processing')
    setStatusMsg('Transcribing...')
  }

  const startRecording = async () => {
    setTranscript('')
    setStatusMsg('')

    // Check browser support
    if (!navigator.mediaDevices?.getUserMedia) {
      setRecState('error')
      setStatusMsg('Voice not supported in this browser. Use Chrome on mobile.')
      return
    }

    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
    } catch (e) {
      setRecState('error')
      setStatusMsg('Microphone access denied. Allow mic in browser settings.')
      return
    }

    // Find best supported MIME type
    const mimes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/ogg', 'audio/mp4']
    const mime = mimes.find(m => MediaRecorder.isTypeSupported(m)) || ''
    console.log('[Voice] Using MIME:', mime || 'browser default')

    let rec: MediaRecorder
    try {
      rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream)
    } catch (e) {
      setRecState('error')
      setStatusMsg('Could not start recorder. Try Chrome browser.')
      stream.getTracks().forEach(t => t.stop())
      return
    }

    mediaRef.current = rec
    chunksRef.current = []

    rec.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data)
    }

    rec.onstop = async () => {
      const chunks = chunksRef.current
      const totalSize = chunks.reduce((s, c) => s + c.size, 0)
      console.log(`[Voice] Chunks: ${chunks.length}, Total: ${totalSize} bytes`)

      if (totalSize === 0) {
        setRecState('error')
        setStatusMsg('No audio captured. Speak louder or check mic.')
        return
      }

      const blobType = mime ? mime.split(';')[0] : 'audio/webm'
      const ext = blobType.includes('ogg') ? 'ogg' : blobType.includes('mp4') ? 'mp4' : 'webm'
      const blob = new Blob(chunks, { type: blobType })

      console.log(`[Voice] Blob: ${blob.size}B, type=${blobType}, ext=${ext}`)

      const form = new FormData()
      form.append('file', blob, `recording.${ext}`)

      try {
        const res = await fetch('/api/ask', { method: 'POST', body: form })
        const data = await res.json()

        if (!res.ok) {
          console.error('[Voice] API error:', data)
          setRecState('error')
          setStatusMsg(data.error || `Server error ${res.status}`)
          return
        }

        if (data.transcript) {
          setTranscript(data.transcript)
          setQuery(data.transcript)
          setRecState('idle')
          setStatusMsg('')
        } else {
          setRecState('error')
          setStatusMsg(data.error || 'Could not understand. Speak clearly and try again.')
        }
      } catch (e) {
        console.error('[Voice] Fetch error:', e)
        setRecState('error')
        setStatusMsg('Network error. Check connection and try again.')
      }
    }

    rec.onerror = (e) => {
      console.error('[Voice] MediaRecorder error:', e)
      setRecState('error')
      setStatusMsg('Recording error. Try again.')
    }

    rec.start(250)
    setRecState('recording')
    setStatusMsg('')
  }

  const toggleMic = () => {
    if (recState === 'recording') stopRecording()
    else if (recState === 'idle' || recState === 'error') startRecording()
  }

  const isRecording = recState === 'recording'
  const isProcessing = recState === 'processing'
  const isError = recState === 'error'
  const isBusy = isRecording || isProcessing

  return (
    <section style={{
      minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      padding:'clamp(88px,12vw,120px) clamp(16px,5vw,24px) clamp(48px,6vw,60px)',
      background:'#fff', textAlign:'center', position:'relative', overflow:'hidden',
    }}>
      <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(#2563EB08 1px, transparent 1px)', backgroundSize:'28px 28px', pointerEvents:'none' }} />

      {/* Badge */}
      <div style={{ display:'inline-flex', alignItems:'center', gap:7, background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:100, padding:'5px 14px', marginBottom:20, fontSize:12, fontWeight:600, color:'#2563EB', animation:'fade-up .4s ease both' }}>
        <span style={{ width:6, height:6, borderRadius:'50%', background:'#2563EB', animation:'blink 2s infinite', display:'inline-block' }} />
        Powered by Sarvam AI — India&apos;s own LLM
      </div>

      {/* H1 */}
      <h1 style={{ fontSize:'clamp(32px,6vw,56px)', fontWeight:800, lineHeight:1.08, letterSpacing:'-1.5px', color:'#111827', maxWidth:700, marginBottom:12, animation:'fade-up .4s .06s ease both', opacity:0, animationFillMode:'forwards' }}>
        Find the best product<br /><span style={{ color:'#2563EB' }}>in seconds.</span>
      </h1>

      <p style={{ fontSize:'clamp(15px,2vw,17px)', color:'#6B7280', maxWidth:460, lineHeight:1.6, marginBottom:32, animation:'fade-up .4s .12s ease both', opacity:0, animationFillMode:'forwards' }}>
        Ask in your language. Built on India&apos;s LLM (Sarvam AI).<br />No fake reviews. City-specific insights.
      </p>

      {/* ── SEARCH BAR ── */}
      <div style={{ width:'100%', maxWidth:660, animation:'fade-up .4s .18s ease both', opacity:0, animationFillMode:'forwards' }}>
        <div style={{
          display:'flex', alignItems:'center', gap:6,
          background:'#fff', borderRadius:14, padding:'5px 5px 5px 16px',
          border:`2px solid ${isError ? '#EF4444' : isRecording ? '#EF4444' : focused ? '#2563EB' : '#E5E7EB'}`,
          boxShadow: isRecording ? '0 0 0 4px rgba(239,68,68,0.1)' : focused ? '0 0 0 4px rgba(37,99,235,0.1)' : '0 2px 12px rgba(0,0,0,0.06)',
          transition:'all .2s',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={focused ? '#2563EB' : '#9CA3AF'} strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink:0 }}>
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>

          <input
            value={isRecording ? ('Listening' + '.'.repeat(dots)) : isProcessing ? 'Transcribing your voice...' : query}
            onChange={e => { if (!isBusy) setQuery(e.target.value) }}
            onKeyDown={e => e.key === 'Enter' && !isBusy && go()}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Best AC for Delhi under ₹40,000?"
            readOnly={isBusy}
            style={{ flex:1, border:'none', outline:'none', fontSize:16, color: isRecording ? '#EF4444' : '#111827', background:'none', fontFamily:'Inter,sans-serif', padding:'11px 0', minWidth:0 }}
          />

          {/* Mic button */}
          <button
            onClick={toggleMic}
            disabled={isProcessing}
            title={isRecording ? 'Stop recording' : 'Speak in any Indian language'}
            style={{
              width:42, height:42, borderRadius:10, border:'none', flexShrink:0, cursor: isProcessing ? 'not-allowed' : 'pointer',
              background: isRecording ? '#EF4444' : isError ? '#FEF2F2' : '#F3F4F6',
              display:'flex', alignItems:'center', justifyContent:'center', transition:'all .2s',
              animation: isRecording ? 'mic-pulse 1s ease infinite' : 'none',
            }}>
            {isProcessing ? (
              <div style={{ width:16, height:16, border:'2px solid #D1D5DB', borderTopColor:'#2563EB', borderRadius:'50%', animation:'spin .7s linear infinite' }} />
            ) : isRecording ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isError ? '#EF4444' : '#6B7280'} strokeWidth="2" strokeLinecap="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            )}
          </button>

          <button
            onClick={() => go()}
            disabled={(!query.trim() && !transcript) || isBusy}
            style={{ background:'#2563EB', color:'#fff', border:'none', borderRadius:10, padding:'11px clamp(12px,2vw,22px)', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'Inter,sans-serif', transition:'background .15s', flexShrink:0, whiteSpace:'nowrap', opacity:(query.trim()||transcript)&&!isBusy?1:0.5 }}
            onMouseEnter={e => { if (query.trim())(e.currentTarget.style.background='#1D4ED8') }}
            onMouseLeave={e => (e.currentTarget.style.background='#2563EB')}>
            Search →
          </button>
        </div>

        {/* Status messages */}
        {isRecording && (
          <div style={{ marginTop:10, display:'flex', alignItems:'center', gap:6, justifyContent:'center', fontSize:14, color:'#EF4444', fontWeight:500 }}>
            <span style={{ width:8, height:8, borderRadius:'50%', background:'#EF4444', display:'inline-block', animation:'blink 1s infinite' }} />
            Recording... tap the stop button when done
          </div>
        )}
        {isProcessing && (
          <p style={{ marginTop:10, fontSize:14, color:'#6B7280', textAlign:'center' }}>Transcribing with Sarvam AI...</p>
        )}
        {isError && statusMsg && (
          <div style={{ marginTop:10, fontSize:13, color:'#EF4444', background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:8, padding:'8px 14px', textAlign:'left' }}>
            ⚠️ {statusMsg}
          </div>
        )}
        {transcript && !isBusy && !isError && (
          <div style={{ marginTop:10, fontSize:14, color:'#374151', background:'#F9FAFB', border:'1px solid #E5E7EB', borderRadius:8, padding:'8px 14px', textAlign:'left' }}>
            <span style={{ color:'#6B7280', fontWeight:500 }}>You said: </span>
            <span style={{ fontWeight:600 }}>{transcript}</span>
          </div>
        )}
        {!isBusy && !isError && !transcript && (
          <p style={{ marginTop:10, fontSize:13, color:'#9CA3AF', textAlign:'center' }}>
            🎙️ Tap mic · 22 Indian languages · Powered by Sarvam AI
          </p>
        )}

        {/* Example chips */}
        <div style={{ display:'flex', gap:8, marginTop:14, flexWrap:'wrap', justifyContent:'center' }}>
          {EXAMPLES.map(ex => (
            <button key={ex} onClick={() => go(ex)} style={{ background:'#F9FAFB', border:'1px solid #E5E7EB', borderRadius:100, padding:'7px 14px', fontSize:13, color:'#374151', cursor:'pointer', fontWeight:500, transition:'all .15s', whiteSpace:'nowrap' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='#2563EB'; e.currentTarget.style.color='#2563EB'; e.currentTarget.style.background='#EFF6FF' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='#E5E7EB'; e.currentTarget.style.color='#374151'; e.currentTarget.style.background='#F9FAFB' }}>
              {ex}
            </button>
          ))}
        </div>
      </div>

      {/* Language pills */}
      <div style={{ display:'flex', gap:6, marginTop:24, flexWrap:'wrap', justifyContent:'center', animation:'fade-up .4s .24s ease both', opacity:0, animationFillMode:'forwards' }}>
        <span style={{ fontSize:12, color:'#9CA3AF', fontWeight:500, alignSelf:'center' }}>Ask in:</span>
        {LANGS.map(l => <span key={l} style={{ fontSize:12, color:'#6B7280', background:'#F3F4F6', borderRadius:100, padding:'3px 10px', fontWeight:500 }}>{l}</span>)}
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
