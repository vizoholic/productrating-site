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
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }
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
        } catch { /* ignore STT errors */ }
        setTranscribing(false)
      }
      mediaRecorder.start()
      setRecording(true)
    } catch {
      alert('Microphone permission denied. Please allow mic access to use voice search.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop()
      setRecording(false)
    }
  }

  const toggleRecording = () => {
    if (recording) stopRecording()
    else startRecording()
  }

  return (
    <section style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '120px 24px 80px', position: 'relative', textAlign: 'center', overflow: 'hidden',
    }}>
      {/* Glow */}
      <div style={{
        position: 'absolute', top: '10%', left: '50%',
        transform: 'translateX(-50%)',
        width: 800, height: 500, borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(255,107,0,0.13) 0%, rgba(0,200,255,0.06) 40%, transparent 70%)',
        animation: 'pulse-glow 4s ease-in-out infinite alternate',
        pointerEvents: 'none',
      }} />
      {/* Orbs */}
      <div style={{ position: 'fixed', top: '15%', right: -100, width: 400, height: 400, borderRadius: '50%', background: 'var(--saffron)', filter: 'blur(90px)', opacity: 0.12, animation: 'float 8s ease-in-out infinite alternate', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '20%', left: -80, width: 300, height: 300, borderRadius: '50%', background: 'var(--electric)', filter: 'blur(90px)', opacity: 0.1, animation: 'float 10s ease-in-out infinite alternate-reverse', pointerEvents: 'none', zIndex: 0 }} />

      {/* Badge */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        background: 'rgba(255,107,0,0.1)', border: '1px solid rgba(255,107,0,0.3)',
        borderRadius: 100, padding: '6px 18px', marginBottom: 32,
        fontSize: 11, fontFamily: 'JetBrains Mono,monospace', letterSpacing: 2,
        textTransform: 'uppercase', color: 'var(--saffron)', position: 'relative', zIndex: 1,
        animation: 'fade-up .6s ease both',
      }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--saffron)', display: 'inline-block', animation: 'blink 1.5s infinite' }} />
        India&apos;s First AI Product Intelligence Platform
      </div>

      {/* H1 — SEO critical */}
      <h1 style={{
        fontFamily: 'Syne,sans-serif', fontSize: 'clamp(40px,7vw,88px)', fontWeight: 800,
        lineHeight: 1.0, letterSpacing: '-2px', maxWidth: 900, position: 'relative', zIndex: 1,
        animation: 'fade-up .6s .1s ease both', opacity: 0, animationFillMode: 'forwards',
      }}>
        Don&apos;t buy blind.<br />
        Buy <span style={{ color: 'var(--saffron)' }}>smarter.</span>
      </h1>

      <p style={{
        marginTop: 24, fontSize: 18, fontWeight: 300, color: 'var(--text-dim)',
        maxWidth: 560, lineHeight: 1.75, position: 'relative', zIndex: 1,
        animation: 'fade-up .6s .2s ease both', opacity: 0, animationFillMode: 'forwards',
      }}>
        Ask anything about any product. Get AI-powered ratings aggregated from Flipkart, Amazon, Nykaa, Meesho &amp; more — built for Indian consumers.
      </p>

      {/* Search */}
      <style>{`@keyframes hero-pulse { 0%,100%{opacity:1} 50%{opacity:0.6} }`}</style>
      <div style={{ marginTop: 48, width: '100%', maxWidth: 680, position: 'relative', zIndex: 2, animation: 'fade-up .6s .3s ease both', opacity: 0, animationFillMode: 'forwards' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          background: 'var(--surface)', border: `1px solid ${recording ? 'rgba(255,59,48,0.5)' : 'var(--border-accent)'}`,
          borderRadius: 16, padding: '6px 6px 6px 22px',
          boxShadow: '0 0 60px rgba(255,107,0,0.1), 0 20px 60px rgba(0,0,0,0.35)',
          transition: 'border-color 0.2s',
        }}>
          <span style={{ fontSize: 18, color: recording ? 'rgba(255,59,48,0.8)' : 'var(--text-muted)', flexShrink: 0, transition: 'color 0.2s' }}>
            {recording ? '🔴' : '🔍'}
          </span>
          <input
            type="text" value={query} onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder={recording ? 'Listening... tap mic to stop' : transcribing ? 'Transcribing your voice...' : 'Ask: Is Samsung Galaxy S24 worth buying in India?'}
            disabled={recording || transcribing}
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              fontFamily: 'DM Sans,sans-serif', fontSize: 16, color: 'var(--text)', padding: '12px 0',
            }}
          />
          {/* Mic button */}
          <button
            onClick={toggleRecording}
            disabled={transcribing}
            title={recording ? 'Stop recording' : 'Voice search in Hindi, Tamil, Telugu & more'}
            style={{
              background: recording ? 'rgba(255,59,48,0.85)' : 'rgba(255,255,255,0.07)',
              border: `1px solid ${recording ? 'rgba(255,59,48,0.5)' : 'var(--border)'}`,
              borderRadius: 10, width: 44, height: 44, cursor: 'pointer', fontSize: 18,
              flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s',
              animation: recording ? 'hero-pulse 1.2s infinite' : 'none',
            }}
          >
            {recording ? '⏹' : '🎙️'}
          </button>
          <button onClick={handleSearch} disabled={recording || transcribing} style={{
            background: 'var(--saffron)', color: '#000', border: 'none', borderRadius: 12,
            padding: '14px 28px', fontFamily: 'Syne,sans-serif', fontSize: 14, fontWeight: 700,
            cursor: 'pointer', whiteSpace: 'nowrap', transition: 'background .2s',
          }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--saffron-glow)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--saffron)')}>
            Ask AI →
          </button>
        </div>

        {/* Suggestions */}
        <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
          {SUGGESTIONS.map(s => (
            <button key={s} onClick={() => setQuery(s)} style={{
              background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 100,
              padding: '6px 14px', fontSize: 12, color: 'var(--text-dim)', cursor: 'pointer',
              fontFamily: 'DM Sans,sans-serif', transition: 'all .2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--saffron)'; e.currentTarget.style.color = 'var(--saffron)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-dim)' }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div style={{
        display: 'flex', gap: 0, marginTop: 72, maxWidth: 780, width: '100%',
        border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden',
        animation: 'fade-up .6s .4s ease both', opacity: 0, animationFillMode: 'forwards',
        position: 'relative', zIndex: 1,
      }}>
        {[['12L+', 'Reviews Analysed'], ['50K+', 'Products Indexed'], ['8', 'Indian Platforms'], ['11', 'Indian Languages']].map(([num, label], i) => (
          <div key={label} style={{
            flex: 1, padding: '24px 20px', textAlign: 'left',
            background: 'var(--surface)', borderRight: i < 3 ? '1px solid var(--border)' : 'none',
          }}>
            <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 28, fontWeight: 800, letterSpacing: '-1px' }}>
              {num.replace(/[LK+]/g, '')}<span style={{ color: 'var(--saffron)', fontSize: 18 }}>{num.match(/[LK+]+/)?.[0]}</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '.8px', textTransform: 'uppercase', marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* India badge */}
      <div style={{
        marginTop: 28, display: 'inline-flex', alignItems: 'center', gap: 8,
        background: 'rgba(255,107,0,0.07)', border: '1px solid rgba(255,107,0,0.18)',
        borderRadius: 8, padding: '8px 16px', fontSize: 12, color: 'var(--text-dim)',
        fontFamily: 'JetBrains Mono,monospace', position: 'relative', zIndex: 1,
      }}>
        🇮🇳 Built for Bharat · Powered by AI
      </div>
    </section>
  )
}
