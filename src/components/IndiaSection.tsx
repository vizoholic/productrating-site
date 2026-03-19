'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

// Saaras v3 STT supports 22 Indian languages
const LANGS = [
  { name:'हिंदी', en:'Hindi' },
  { name:'தமிழ்', en:'Tamil' },
  { name:'తెలుగు', en:'Telugu' },
  { name:'বাংলা', en:'Bengali' },
  { name:'मराठी', en:'Marathi' },
  { name:'ಕನ್ನಡ', en:'Kannada' },
  { name:' Malayalam', en:'Malayalam' },
  { name:'ગુજરાતી', en:'Gujarati' },
  { name:'ਪੰਜਾਬੀ', en:'Punjabi' },
  { name:'ओडिया', en:'Odia' },
  { name:'English', en:'English' },
  { name:'+11 more', en:'& more' },
]

export default function IndiaSection() {
  const [recording, setRecording] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const [status, setStatus] = useState('')
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const router = useRouter()

  const stopRec = () => {
    if (mediaRef.current && mediaRef.current.state !== 'inactive') mediaRef.current.stop()
    setRecording(false)
  }

  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mime = ['audio/webm;codecs=opus','audio/webm','audio/ogg'].find(m => MediaRecorder.isTypeSupported(m)) || ''
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
      mediaRef.current = rec; chunksRef.current = []
      rec.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      rec.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        setRecording(false); setTranscribing(true); setStatus('Transcribing...')
        try {
          const ext = mime.includes('ogg') ? 'ogg' : 'webm'
          const blob = new Blob(chunksRef.current, { type: mime || 'audio/webm' })
          const form = new FormData()
          form.append('file', blob, `rec.${ext}`)
          const res = await fetch('/api/ask', { method: 'POST', body: form })
          const data = await res.json()
          if (data.transcript) {
            setStatus(`You said: "${data.transcript}"`)
            setTimeout(() => router.push(`/search?q=${encodeURIComponent(data.transcript)}`), 800)
          } else { setStatus('Could not understand. Try again.') }
        } catch { setStatus('Error. Try again.') }
        setTranscribing(false)
      }
      rec.start(200); setRecording(true); setStatus('Listening...')
    } catch { alert('Microphone permission denied.') }
  }

  return (
    <section style={{ padding:'clamp(48px,8vw,80px) clamp(16px,5vw,40px)', background:'#fff', borderTop:'1px solid #E5E7EB' }}>
      <div style={{ maxWidth:1100, margin:'0 auto' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:'clamp(32px,5vw,60px)', alignItems:'center' }}>

          {/* Left */}
          <div>
            <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:100, padding:'5px 14px', marginBottom:20, fontSize:12, fontWeight:600, color:'#2563EB' }}>
              🇮🇳 Built for India
            </div>
            <h2 style={{ fontSize:'clamp(22px,3.5vw,38px)', fontWeight:800, letterSpacing:'-1px', color:'#111827', lineHeight:1.15, marginBottom:16 }}>
              The only product tool<br />that speaks your language.
            </h2>
            <p style={{ fontSize:15, color:'#6B7280', lineHeight:1.7, marginBottom:28 }}>
              We use Sarvam AI — India&apos;s own LLM — trained on Indian languages, culture, and context. Ask in Hindi, get answers that understand Delhi heat, Mumbai humidity, and Bengaluru traffic.
            </p>

            <div style={{ display:'flex', flexDirection:'column', gap:14, marginBottom:32 }}>
              {[
                { icon:'🎙️', title:'Voice Search in 22 Languages', desc:'Tap mic, speak naturally in Hindi, Tamil, Telugu, or any Indian language.' },
                { icon:'🌡️', title:'City-Specific Intelligence', desc:'Delhi summer vs Chennai humidity — our recommendations know the difference.' },
                { icon:'🧠', title:'Indian Context, Always', desc:'Understands Indian budgets, voltage fluctuations, local brands, and service quality.' },
              ].map(f => (
                <div key={f.title} style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
                  <div style={{ width:36, height:36, background:'#EFF6FF', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>{f.icon}</div>
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, color:'#111827', marginBottom:3 }}>{f.title}</div>
                    <div style={{ fontSize:13, color:'#6B7280', lineHeight:1.5 }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Inline voice recorder */}
            <div style={{ background:'#F9FAFB', border:'1px solid #E5E7EB', borderRadius:12, padding:'20px 20px' }}>
              <div style={{ fontSize:13, fontWeight:600, color:'#374151', marginBottom:14 }}>🎙️ Try voice search now</div>
              <button
                onClick={recording ? stopRec : startRec}
                disabled={transcribing}
                style={{
                  display:'flex', alignItems:'center', gap:10, width:'100%',
                  background: recording ? '#EF4444' : '#2563EB',
                  color:'#fff', border:'none', borderRadius:10, padding:'13px 20px',
                  fontSize:14, fontWeight:600, cursor: transcribing ? 'not-allowed' : 'pointer',
                  transition:'background .15s', fontFamily:'Inter,sans-serif',
                  animation: recording ? 'mic-pulse 1s ease infinite' : 'none',
                }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
                  {recording
                    ? <rect x="6" y="6" width="12" height="12" rx="2" fill="#fff"/>
                    : <><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></>
                  }
                </svg>
                {transcribing ? 'Transcribing...' : recording ? 'Stop Recording' : 'Tap to Speak'}
              </button>
              {status && (
                <div style={{ marginTop:10, fontSize:13, color: status.startsWith('You said') ? '#10B981' : '#6B7280', fontWeight:500, lineHeight:1.4 }}>
                  {status}
                </div>
              )}
              <p style={{ marginTop:10, fontSize:12, color:'#9CA3AF' }}>
                Speak in Hindi, Tamil, Telugu, or any Indian language — Sarvam AI will understand
              </p>
            </div>
          </div>

          {/* Right — language grid */}
          <div>
            <div style={{ fontSize:13, fontWeight:600, color:'#6B7280', marginBottom:14, textTransform:'uppercase', letterSpacing:'1px' }}>
              Saaras v3 · 22 Indian Languages
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(110px,1fr))', gap:8 }}>
              {LANGS.map(l => (
                <div key={l.name} style={{ background:'#F9FAFB', border:'1px solid #E5E7EB', borderRadius:10, padding:'12px 10px', textAlign:'center' }}>
                  <div style={{ fontSize:14, fontWeight:700, color:'#111827', marginBottom:2 }}>{l.name}</div>
                  <div style={{ fontSize:11, color:'#9CA3AF' }}>{l.en}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop:16, padding:'14px 18px', background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:10, display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:36, height:36, background:'#2563EB', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:16, flexShrink:0 }}>🤖</div>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:'#111827' }}>Sarvam AI · Speech-to-Text</div>
                <div style={{ fontSize:12, color:'#6B7280' }}>22 languages · Auto language detection · Indian accents</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
