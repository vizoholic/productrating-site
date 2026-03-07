'use client'
import React, { useState, useRef } from 'react'

type SerpProduct = {
  title: string
  price: string
  rating: number | null
  reviews: number | null
  source: string
  link: string
  thumbnail: string
  delivery: string
  badge: string | null
}

type Message = {
  role: string
  text: string
  score?: string | null
  sources?: string[]
  tip?: string | null
  verdict?: string | null
  serpProducts?: SerpProduct[]
  relatedSearches?: string[]
}

const INITIAL_MSGS: Message[] = [
  { role: 'user', text: 'Is the Voltas 1.5 Ton AC good for Chennai weather?' },
  { role: 'ai', text: "Yes, with conditions. The Voltas 1.5T 5-Star Inverter performs well in Chennai's humidity, but reviews from South India buyers note the compressor works harder above 38°C.", score: '4.2', sources: ['Flipkart 4.3', 'Amazon 4.1', 'Croma 4.2'], tip: '💡 Buy in March before summer demand surge. Price drops ~12% post-monsoon.', verdict: null },
  { role: 'user', text: 'What about Daikin vs Voltas for Chennai?' },
  { role: 'ai', text: 'Daikin wins for Chennai specifically. Chennai reviewers give Daikin a 4.6 vs Voltas 4.0. Daikin handles high humidity better and after-sales service in TN is rated 4.4★ vs Voltas 3.6★.', score: null, verdict: '🥇 Daikin recommended for Chennai', sources: [] },
]

function StarBar({ rating }: { rating: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <div style={{ width: 60, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${(rating / 5) * 100}%`, height: '100%', background: rating >= 4 ? 'var(--green)' : rating >= 3 ? 'var(--saffron)' : '#ff453a', borderRadius: 2 }} />
      </div>
      <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono,monospace' }}>{rating.toFixed(1)}</span>
    </div>
  )
}

function SerpCard({ p }: { p: SerpProduct }) {
  return (
    <a href={p.link} target="_blank" rel="noopener noreferrer"
      style={{ display: 'flex', gap: 10, padding: '10px 12px', background: 'rgba(255,107,0,0.04)', border: '1px solid rgba(255,107,0,0.12)', borderRadius: 10, textDecoration: 'none', alignItems: 'flex-start', transition: 'all 0.2s' }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,107,0,0.09)'; e.currentTarget.style.borderColor = 'rgba(255,107,0,0.3)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,107,0,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,107,0,0.12)' }}
    >
      {p.thumbnail && <img src={p.thumbnail} alt={p.title} style={{ width: 40, height: 40, objectFit: 'contain', borderRadius: 6, flexShrink: 0, background: '#111' }} />}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: 'var(--text)', fontWeight: 600, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--saffron)', fontFamily: 'Syne,sans-serif' }}>{p.price}</span>
          <span style={{ fontSize: 9, color: 'var(--text-muted)', background: 'rgba(0,200,255,0.08)', border: '1px solid rgba(0,200,255,0.15)', borderRadius: 4, padding: '1px 5px', fontFamily: 'JetBrains Mono,monospace' }}>{p.source}</span>
          {p.badge && <span style={{ fontSize: 9, color: '#ffd60a', background: 'rgba(255,214,10,0.1)', border: '1px solid rgba(255,214,10,0.2)', borderRadius: 4, padding: '1px 5px', fontFamily: 'JetBrains Mono,monospace' }}>{p.badge}</span>}
        </div>
        {p.rating && <div style={{ marginTop: 4 }}><StarBar rating={p.rating} />{p.reviews && <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono,monospace' }}>{p.reviews.toLocaleString('en-IN')} reviews</span>}</div>}
        {p.delivery && <div style={{ fontSize: 9, color: 'var(--green)', marginTop: 2, fontFamily: 'JetBrains Mono,monospace' }}>{p.delivery}</div>}
      </div>
      <span style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }}>↗</span>
    </a>
  )
}

export default function AiDemoChat() {
  const [msgs, setMsgs] = useState<Message[]>(INITIAL_MSGS)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [recording, setRecording] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const send = async (question?: string) => {
    const q = (question ?? input).trim()
    if (!q || loading) return
    setInput('')
    setLoading(true)
    setMsgs(m => [...m, { role: 'user', text: q }])
    try {
      const res = await fetch('/api/ask', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: q }) })
      const data = await res.json()
      setMsgs(m => [...m, { role: 'ai', text: data.answer || 'Let me analyse that...', score: null, sources: [], tip: null, verdict: null, serpProducts: data.serpProducts || [], relatedSearches: data.relatedSearches || [] }])
    } catch {
      setMsgs(m => [...m, { role: 'ai', text: 'Add your SARVAM_API_KEY to enable live answers!', score: null, sources: [], tip: null, verdict: null }])
    }
    setLoading(false)
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg'
      const mr = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = mr
      audioChunksRef.current = []
      mr.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data) }
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        setTranscribing(true)
        try {
          const blob = new Blob(audioChunksRef.current, { type: mimeType })
          const fd = new FormData()
          fd.append('audio', blob, `recording.${mimeType.split('/')[1]}`)
          const res = await fetch('/api/ask', { method: 'POST', body: fd })
          const data = await res.json()
          if (data.transcript) setInput(data.transcript)
        } catch { /* ignore */ }
        setTranscribing(false)
      }
      mr.start()
      setRecording(true)
    } catch { alert('Mic permission denied.') }
  }

  const stopRecording = () => { if (mediaRecorderRef.current && recording) { mediaRecorderRef.current.stop(); setRecording(false) } }

  const micBtnStyle: React.CSSProperties = {
    background: recording ? 'rgba(255,59,48,0.9)' : 'rgba(255,255,255,0.08)',
    border: `1px solid ${recording ? 'rgba(255,59,48,0.6)' : 'var(--border)'}`,
    borderRadius: 10, width: 36, height: 36, cursor: 'pointer', fontSize: 15,
    flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.2s', animation: recording ? 'pulse 1.2s infinite' : 'none',
  }

  return (
    <section style={{ background: 'var(--bg2)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '100px 48px' }}>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.6} }`}</style>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--saffron)', marginBottom: 16 }}>// AI Intelligence — Sarvam + Google Shopping</div>
          <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: 'clamp(32px,4vw,52px)', fontWeight: 800, letterSpacing: '-1.5px', lineHeight: 1.1 }}>Ask anything.<br />Get the real answer.</h2>
          <p style={{ marginTop: 16, fontSize: 16, fontWeight: 300, color: 'var(--text-dim)', lineHeight: 1.8, maxWidth: 440 }}>India&apos;s own AI reads lakhs of reviews, detects fake ones, and gives you one honest verdict — with live Google Shopping prices.</p>
          <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {['🛒 Live prices from Google Shopping India', '🎙️ Voice input in 22 Indian languages', 'Fake review detection powered by ML', 'Sentiment analysis in Hindi, Tamil & more', 'City-wise performance insights', '6-month & 1-year ownership reports'].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: 'var(--text-dim)' }}>
                <span style={{ color: 'var(--green)', fontSize: 18 }}>✓</span> {f}
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.5)' }}>
          <div style={{ background: 'var(--surface2)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', gap: 6 }}>{['#FF5F57','#FEBC2E','#28C840'].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}</div>
            <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>productrating.in / sarvam-ai</span>
            <span style={{ marginLeft: 'auto', fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: 'var(--saffron)', background: 'rgba(255,107,0,0.1)', border: '1px solid rgba(255,107,0,0.2)', borderRadius: 4, padding: '2px 6px' }}>🇮🇳 INDIA AI</span>
          </div>

          <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 14, maxHeight: 420, overflowY: 'auto' }}>
            {msgs.map((m, i) => (
              <div key={i} style={{ maxWidth: '92%', alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                {m.role === 'user' ? (
                  <div style={{ background: 'rgba(255,107,0,0.15)', border: '1px solid rgba(255,107,0,0.2)', borderRadius: '12px 12px 4px 12px', padding: '12px 16px', fontSize: 13, lineHeight: 1.6 }}>{m.text}</div>
                ) : (
                  <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '12px 12px 12px 4px', padding: '12px 16px', fontSize: 13, lineHeight: 1.6 }}>
                    <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--saffron)', marginBottom: 6 }}>⚡ Sarvam AI × ProductRating</div>
                    {m.text}
                    {m.score && <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.25)', borderRadius: 100, padding: '3px 10px', fontFamily: 'JetBrains Mono,monospace', fontSize: 12, fontWeight: 600, color: 'var(--green)', margin: '8px 0 4px', width: 'fit-content' }}>⭐ {m.score} / 5.0 — PR Score</div>}
                    {m.verdict && <div style={{ background: 'rgba(255,140,42,0.1)', border: '1px solid rgba(255,140,42,0.3)', borderRadius: 100, padding: '3px 10px', fontFamily: 'JetBrains Mono,monospace', fontSize: 12, fontWeight: 600, color: 'var(--saffron-glow)', marginTop: 8, width: 'fit-content' }}>{m.verdict}</div>}
                    {m.sources && m.sources.length > 0 && (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                        {m.sources.map((s: string) => <span key={s} style={{ background: 'rgba(0,200,255,0.08)', border: '1px solid rgba(0,200,255,0.15)', borderRadius: 6, padding: '3px 8px', fontSize: 10, color: 'var(--electric)', fontFamily: 'JetBrains Mono,monospace' }}>{s}</span>)}
                      </div>
                    )}
                    {m.tip && <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-dim)', fontStyle: 'italic' }}>{m.tip}</div>}
                    {m.serpProducts && m.serpProducts.length > 0 && (
                      <div style={{ marginTop: 12 }}>
                        <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--electric)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--green)', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
                          Live Google Shopping India
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {m.serpProducts.slice(0, 4).map((p, pi) => <SerpCard key={pi} p={p} />)}
                        </div>
                      </div>
                    )}
                    {m.relatedSearches && m.relatedSearches.length > 0 && (
                      <div style={{ marginTop: 10, display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                        {m.relatedSearches.slice(0, 3).map((s, si) => (
                          <button key={si} onClick={() => send(s)} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 100, padding: '3px 10px', fontSize: 10, color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'DM Sans,sans-serif' }}>{s} →</button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            {loading && <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '12px 12px 12px 4px', padding: '12px 16px', fontSize: 13, color: 'var(--text-muted)', maxWidth: '88%' }}>⚡ Searching Google Shopping India + Sarvam AI...</div>}
            {transcribing && <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '12px 12px 12px 4px', padding: '12px 16px', fontSize: 13, color: 'var(--text-muted)', maxWidth: '88%' }}>🎙️ Converting speech to text...</div>}
          </div>

          <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, alignItems: 'center' }}>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}
              placeholder={recording ? '🔴 Recording... tap mic to stop' : transcribing ? 'Transcribing...' : 'Ask in Hindi, English, Tamil...'}
              disabled={recording || transcribing}
              style={{ flex: 1, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', fontFamily: 'DM Sans,sans-serif', fontSize: 13, color: 'var(--text)', outline: 'none' }}
            />
            <button onClick={() => { if (recording) stopRecording(); else startRecording() }} disabled={transcribing || loading} style={micBtnStyle} title={recording ? 'Stop recording' : 'Speak in 22 Indian languages'}>
              {recording ? '⏹' : '🎙️'}
            </button>
            <button onClick={() => send()} disabled={loading || recording || transcribing} style={{ background: 'var(--saffron)', border: 'none', borderRadius: 10, width: 36, height: 36, cursor: 'pointer', fontSize: 14, flexShrink: 0 }}>→</button>
          </div>
          <div style={{ padding: '8px 20px 12px', fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono,monospace', textAlign: 'center' }}>
            🛒 Live Google Shopping · 🎙️ Hindi · Tamil · Telugu · Bengali + more
          </div>
        </div>
      </div>
    </section>
  )
}
