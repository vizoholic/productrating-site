'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

const SUGGESTIONS = [
  'Best AC under ₹35,000?',
  'OnePlus vs Samsung camera?',
  'Best mixer for Indian cooking?',
  'Sunscreen for oily skin India?',
]

export default function Hero() {
  const [query, setQuery] = useState('')
  const [recording, setRecording] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const router = useRouter()

  const handleSearch = () => {
    if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`)
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg'
      const mediaRecorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data) }
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        setTranscribing(true)
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType })
          const formData = new FormData()
          formData.append('audio', audioBlob, `recording.${mimeType.split('/')[1]}`)
          const res = await fetch('/api/ask', { method: 'POST', body: formData })
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
      padding: '100px 24px 80px', position: 'relative', textAlign: 'center', overflow: 'hidden',
      background: 'linear-gradient(180deg, #fff 0%, #F7F8FA 100%)',
    }}>
      {/* Subtle saffron glow */}
      <div style={{ position:'absolute', top:'5%', left:'50%', transform:'translateX(-50%)', width:800, height:400, borderRadius:'50%', background:'radial-gradient(ellipse, rgba(255,107,0,0.06) 0%, transparent 70%)', pointerEvents:'none' }} />

      {/* Badge */}
      <div style={{
        display:'inline-flex', alignItems:'center', gap:8,
        background:'var(--saffron-light)', border:'1px solid var(--saffron-mid)',
        borderRadius:100, padding:'6px 18px', marginBottom:32,
        fontSize:11, fontFamily:'JetBrains Mono,monospace', letterSpacing:2,
        textTransform:'uppercase', color:'var(--saffron)',
        animation:'fade-up .5s ease both',
      }}>
        <span style={{ width:6, height:6, borderRadius:'50%', background:'var(--saffron)', display:'inline-block', animation:'blink 1.5s infinite' }} />
        India&apos;s First AI Product Intelligence Platform
      </div>

      <h1 style={{
        fontFamily:'Syne,sans-serif', fontSize:'clamp(40px,7vw,84px)', fontWeight:800,
        lineHeight:1.0, letterSpacing:'-3px', maxWidth:880, color:'var(--text)',
        animation:'fade-up .5s .08s ease both', opacity:0, animationFillMode:'forwards',
      }}>
        Don&apos;t buy blind.<br />
        Buy <span style={{ color:'var(--saffron)', position:'relative' }}>smarter.</span>
      </h1>

      <p style={{
        marginTop:24, fontSize:18, fontWeight:400, color:'var(--text-dim)',
        maxWidth:520, lineHeight:1.7,
        animation:'fade-up .5s .16s ease both', opacity:0, animationFillMode:'forwards',
      }}>
        Ask anything about any product. AI-powered ratings from Flipkart, Amazon, Nykaa &amp; more — built for Indian consumers.
      </p>

      {/* Search bar */}
      <style>{`@keyframes hero-pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
      <div style={{ marginTop:44, width:'100%', maxWidth:680, animation:'fade-up .5s .24s ease both', opacity:0, animationFillMode:'forwards' }}>
        <div style={{
          display:'flex', alignItems:'center', gap:10,
          background:'#fff', border:`1.5px solid ${recording ? '#EF4444' : 'var(--border-strong)'}`,
          borderRadius:14, padding:'6px 6px 6px 18px',
          boxShadow:'var(--shadow-md)',
          transition:'border-color 0.2s, box-shadow 0.2s',
        }}
          onFocus={e => (e.currentTarget.style.borderColor = 'var(--saffron)')}
          onBlur={e => (e.currentTarget.style.borderColor = recording ? '#EF4444' : 'var(--border-strong)')}
        >
          <span style={{ fontSize:16, color: recording ? '#EF4444' : 'var(--text-muted)', flexShrink:0 }}>
            {recording ? '🔴' : '🔍'}
          </span>
          <input
            type="text" value={query} onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder={recording ? 'Listening...' : transcribing ? 'Transcribing...' : 'Ask: Is Samsung Galaxy S24 worth buying in India?'}
            disabled={recording || transcribing}
            style={{ flex:1, background:'none', border:'none', outline:'none', fontFamily:'DM Sans,sans-serif', fontSize:15, color:'var(--text)', padding:'12px 0' }}
          />
          <button onClick={toggleRecording} disabled={transcribing} style={{
            background: recording ? '#FEE2E2' : 'var(--bg2)',
            border:`1px solid ${recording ? '#FECACA' : 'var(--border)'}`,
            borderRadius:10, width:42, height:42, cursor:'pointer', fontSize:16,
            flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center',
            transition:'all 0.2s', animation: recording ? 'hero-pulse 1s infinite' : 'none',
          }}>
            {recording ? '⏹' : '🎙️'}
          </button>
          <button onClick={handleSearch} disabled={recording || transcribing} style={{
            background:'var(--saffron)', color:'#fff', border:'none', borderRadius:10,
            padding:'12px 24px', fontFamily:'Syne,sans-serif', fontSize:14, fontWeight:700,
            cursor:'pointer', whiteSpace:'nowrap', transition:'background .15s',
          }}
            onMouseEnter={e => (e.currentTarget.style.background = '#E55A00')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--saffron)')}>
            Ask AI →
          </button>
        </div>

        {/* Suggestions */}
        <div style={{ display:'flex', gap:8, marginTop:14, flexWrap:'wrap', justifyContent:'center' }}>
          {SUGGESTIONS.map(s => (
            <button key={s} onClick={() => setQuery(s)} style={{
              background:'#fff', border:'1px solid var(--border)', borderRadius:100,
              padding:'6px 14px', fontSize:12, color:'var(--text-dim)', cursor:'pointer',
              fontFamily:'DM Sans,sans-serif', transition:'all .15s', fontWeight:500,
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='var(--saffron)'; e.currentTarget.style.color='var(--saffron)'; e.currentTarget.style.background='var(--saffron-light)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--text-dim)'; e.currentTarget.style.background='#fff' }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div style={{
        display:'flex', gap:0, marginTop:64, maxWidth:720, width:'100%',
        background:'#fff', border:'1px solid var(--border)', borderRadius:16,
        boxShadow:'var(--shadow-sm)', overflow:'hidden',
        animation:'fade-up .5s .32s ease both', opacity:0, animationFillMode:'forwards',
      }}>
        {[['12L+', 'Reviews Analysed'], ['50K+', 'Products Indexed'], ['8', 'Indian Platforms'], ['11', 'Languages']].map(([num, label], i) => (
          <div key={label} style={{
            flex:1, padding:'20px 16px', textAlign:'center',
            borderRight: i < 3 ? '1px solid var(--border)' : 'none',
          }}>
            <div style={{ fontFamily:'Syne,sans-serif', fontSize:26, fontWeight:800, letterSpacing:'-1px', color:'var(--text)' }}>
              {num.replace(/[LK+]/g,'')}
              <span style={{ color:'var(--saffron)', fontSize:16 }}>{num.match(/[LK+]+/)?.[0]}</span>
            </div>
            <div style={{ fontSize:11, color:'var(--text-muted)', letterSpacing:'.5px', textTransform:'uppercase', marginTop:4, fontWeight:500 }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop:24, display:'inline-flex', alignItems:'center', gap:6, fontSize:12, color:'var(--text-muted)', fontFamily:'JetBrains Mono,monospace', animation:'fade-up .5s .4s ease both', opacity:0, animationFillMode:'forwards' }}>
        🇮🇳 Built for Bharat · Powered by AI
      </div>
    </section>
  )
}
