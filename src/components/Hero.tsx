'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

const EXAMPLES = [
  { q: 'Best AC for Delhi under ₹40K?', tag: '🌡️ Most searched' },
  { q: 'OnePlus 12 vs Samsung S24 camera?', tag: '📱 Trending' },
  { q: 'Best mixer grinder for Indian cooking?', tag: '🍳 Popular' },
]

const STATS = [
  { n: '5M+', label: 'Reviews analysed' },
  { n: '50K+', label: 'Products tracked' },
  { n: '8', label: 'Indian platforms' },
  { n: '11', label: 'Languages' },
]

export default function Hero() {
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const [recording, setRecording] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const router = useRouter()

  const handleSearch = (q?: string) => {
    const term = (q || query).trim()
    if (term) router.push(`/search?q=${encodeURIComponent(term)}`)
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg'
      const mediaRecorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []
      mediaRecorder.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data) }
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        setTranscribing(true)
        try {
          const blob = new Blob(audioChunksRef.current, { type: mimeType })
          const form = new FormData()
          form.append('audio', blob, `rec.${mimeType.split('/')[1]}`)
          const res = await fetch('/api/ask', { method: 'POST', body: form })
          const data = await res.json()
          if (data.transcript) setQuery(data.transcript)
        } catch { /* ignore */ }
        setTranscribing(false)
      }
      mediaRecorder.start()
      setRecording(true)
    } catch { alert('Microphone permission denied.') }
  }

  const toggleRecording = () => {
    if (recording) { mediaRecorderRef.current?.stop(); setRecording(false) }
    else startRecording()
  }

  return (
    <section style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '100px 24px 60px', background: '#fff',
      position: 'relative', textAlign: 'center', overflow: 'hidden',
    }}>
      {/* Subtle background grid */}
      <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(#FF6B0008 1px, transparent 1px)', backgroundSize:'32px 32px', pointerEvents:'none' }} />

      {/* Live badge */}
      <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'#FFF7F0', border:'1px solid #FFD4B3', borderRadius:100, padding:'6px 16px', marginBottom:28, fontSize:12, color:'#FF6B00', fontFamily:'JetBrains Mono,monospace', letterSpacing:1.5, textTransform:'uppercase', position:'relative', animation:'fade-up .4s ease both' }}>
        <span style={{ width:7, height:7, borderRadius:'50%', background:'#FF6B00', display:'inline-block', animation:'blink 1.5s infinite' }} />
        India&apos;s AI Product Intelligence Platform
      </div>

      {/* Headline */}
      <h1 style={{ fontFamily:'Syne,sans-serif', fontSize:'clamp(36px,6vw,72px)', fontWeight:800, lineHeight:1.05, letterSpacing:'-2.5px', color:'#111218', maxWidth:820, marginBottom:16, position:'relative', animation:'fade-up .4s .06s ease both', opacity:0, animationFillMode:'forwards' }}>
        Find the best product<br />
        <span style={{ color:'#FF6B00' }}>in 10 seconds.</span>
      </h1>

      <p style={{ fontSize:17, color:'#6B7280', maxWidth:480, lineHeight:1.7, marginBottom:40, animation:'fade-up .4s .12s ease both', opacity:0, animationFillMode:'forwards' }}>
        Ask anything in plain English. Get AI-powered recommendations from real Indian buyer reviews — no fake ratings, no confusion.
      </p>

      {/* SEARCH BAR — the hero */}
      <div style={{ width:'100%', maxWidth:700, animation:'fade-up .4s .18s ease both', opacity:0, animationFillMode:'forwards', position:'relative' }}>
        <div style={{
          display:'flex', alignItems:'center', gap:10,
          background:'#fff', borderRadius:16, padding:'8px 8px 8px 20px',
          border:`2px solid ${focused ? '#FF6B00' : recording ? '#EF4444' : '#E5E7EB'}`,
          boxShadow: focused ? '0 0 0 4px rgba(255,107,0,0.08), 0 8px 32px rgba(0,0,0,0.08)' : '0 4px 20px rgba(0,0,0,0.07)',
          transition:'all .2s',
        }}>
          <span style={{ fontSize:18, color:'#9CA3AF', flexShrink:0 }}>{recording ? '🔴' : '🔍'}</span>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Ask: Best AC for Delhi under ₹40K?"
            disabled={recording || transcribing}
            style={{ flex:1, border:'none', outline:'none', fontSize:16, color:'#111218', fontFamily:'DM Sans,sans-serif', background:'none', padding:'12px 0' }}
          />
          <button onClick={toggleRecording} disabled={transcribing} style={{ background: recording ? '#FEF2F2' : '#F9FAFB', border:`1px solid ${recording ? '#FECACA' : '#E5E7EB'}`, borderRadius:10, width:44, height:44, cursor:'pointer', fontSize:17, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all .15s' }}>
            {transcribing ? '⏳' : recording ? '⏹' : '🎙️'}
          </button>
          <button onClick={() => handleSearch()} disabled={recording || transcribing} style={{ background:'#FF6B00', color:'#fff', border:'none', borderRadius:12, padding:'13px 28px', fontFamily:'Syne,sans-serif', fontSize:14, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap', transition:'background .15s', flexShrink:0 }}
            onMouseEnter={e => (e.currentTarget.style.background='#E55A00')}
            onMouseLeave={e => (e.currentTarget.style.background='#FF6B00')}>
            Ask AI →
          </button>
        </div>

        {/* Example queries */}
        <div style={{ display:'flex', gap:10, marginTop:14, justifyContent:'center', flexWrap:'wrap' }}>
          {EXAMPLES.map(ex => (
            <button key={ex.q} onClick={() => handleSearch(ex.q)} style={{ display:'flex', alignItems:'center', gap:6, background:'#fff', border:'1px solid #E5E7EB', borderRadius:100, padding:'7px 14px', fontSize:12, color:'#6B7280', cursor:'pointer', transition:'all .15s', fontFamily:'DM Sans,sans-serif', fontWeight:500 }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='#FF6B00'; e.currentTarget.style.color='#FF6B00'; e.currentTarget.style.background='#FFF7F0' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='#E5E7EB'; e.currentTarget.style.color='#6B7280'; e.currentTarget.style.background='#fff' }}>
              <span style={{ fontSize:10, background:'#F3F4F6', borderRadius:4, padding:'2px 6px', color:'#9CA3AF', fontFamily:'JetBrains Mono,monospace' }}>{ex.tag}</span>
              {ex.q}
            </button>
          ))}
        </div>
      </div>

      {/* Trust stats */}
      <div style={{ display:'flex', gap:0, marginTop:56, background:'#fff', border:'1px solid #E5E7EB', borderRadius:14, overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,0.05)', animation:'fade-up .4s .24s ease both', opacity:0, animationFillMode:'forwards' }}>
        {STATS.map((s, i) => (
          <div key={s.label} style={{ padding:'18px 32px', textAlign:'center', borderRight: i < STATS.length-1 ? '1px solid #E5E7EB' : 'none' }}>
            <div style={{ fontFamily:'Syne,sans-serif', fontSize:24, fontWeight:800, color:'#111218', letterSpacing:'-1px' }}>
              {s.n.replace(/[M+K]/g,'')}<span style={{ color:'#FF6B00' }}>{s.n.match(/[M+K]+/)?.[0]}</span>
            </div>
            <div style={{ fontSize:11, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'.5px', marginTop:3, fontWeight:500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop:20, fontSize:12, color:'#9CA3AF', fontFamily:'JetBrains Mono,monospace', animation:'fade-up .4s .3s ease both', opacity:0, animationFillMode:'forwards' }}>
        🇮🇳 Trusted by Indian buyers · No ads · No paid placements
      </div>

      <style>{`@keyframes hero-pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
    </section>
  )
}
