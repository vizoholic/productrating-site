'use client'
import { useState } from 'react'

const INITIAL_MSGS = [
  { role: 'user', text: 'Is the Voltas 1.5 Ton AC good for Chennai weather?' },
  { role: 'ai', text: 'Yes, with conditions. The Voltas 1.5T 5-Star Inverter performs well in Chennai\'s humidity, but reviews from South India buyers specifically note the compressor works harder above 38°C.', score: '4.2', sources: ['Flipkart 4.3', 'Amazon 4.1', 'Croma 4.2'], tip: '💡 Buy in March before summer demand surge. Price drops ~12% post-monsoon.' },
  { role: 'user', text: 'What about Daikin vs Voltas for Chennai?' },
  { role: 'ai', text: 'Daikin wins for Chennai specifically. Chennai reviewers give Daikin a 4.6 vs Voltas 4.0. Daikin handles high humidity better and after-sales service in TN is rated 4.4★ vs Voltas 3.6★.', score: null, verdict: '🥇 Daikin recommended for Chennai', sources: [] },
]

export default function AiDemoChat() {
  const [msgs, setMsgs] = useState(INITIAL_MSGS)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const send = async () => {
    const q = input.trim()
    if (!q || loading) return
    setInput('')
    setLoading(true)
    setMsgs(m => [...m, { role: 'user', text: q }])

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
      })
      const data = await res.json()
      setMsgs(m => [...m, { role: 'ai', text: data.answer || 'Let me analyse that for you...', score: null, sources: [], tip: null, verdict: null }])
    } catch {
      setMsgs(m => [...m, { role: 'ai', text: 'Connect this to your Claude API to get live AI answers!', score: null, sources: [], tip: null, verdict: null }])
    }
    setLoading(false)
  }

  return (
    <section style={{ background: 'var(--bg2)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '100px 48px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--saffron)', marginBottom: 16 }}>// AI Intelligence</div>
          <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: 'clamp(32px,4vw,52px)', fontWeight: 800, letterSpacing: '-1.5px', lineHeight: 1.1 }}>Ask anything.<br />Get the real answer.</h2>
          <p style={{ marginTop: 16, fontSize: 16, fontWeight: 300, color: 'var(--text-dim)', lineHeight: 1.8, maxWidth: 440 }}>
            Our AI reads lakhs of reviews, detects fake ones, weighs verified buyers, and gives you one honest verdict — in plain language.
          </p>
          <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {['Fake review detection powered by ML','Sentiment analysis in Hindi, Tamil & more','City-wise performance insights (Delhi heat, Mumbai humidity)','6-month & 1-year ownership reports'].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: 'var(--text-dim)' }}>
                <span style={{ color: 'var(--green)', fontSize: 18 }}>✓</span> {f}
              </div>
            ))}
          </div>
        </div>

        {/* Chat */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.5)' }}>
          <div style={{ background: 'var(--surface2)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {['#FF5F57','#FEBC2E','#28C840'].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
            </div>
            <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>productrating.in / ai-assistant</span>
          </div>
          <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 14, maxHeight: 380, overflowY: 'auto' }}>
            {msgs.map((m, i) => (
              <div key={i} style={{ maxWidth: '88%', alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                {m.role === 'user' ? (
                  <div style={{ background: 'rgba(255,107,0,0.15)', border: '1px solid rgba(255,107,0,0.2)', borderRadius: '12px 12px 4px 12px', padding: '12px 16px', fontSize: 13, lineHeight: 1.6 }}>{m.text}</div>
                ) : (
                  <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '12px 12px 12px 4px', padding: '12px 16px', fontSize: 13, lineHeight: 1.6 }}>
                    <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--saffron)', marginBottom: 6 }}>⚡ ProductRating AI</div>
                    {m.text}
                    {(m as any).score && <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.25)', borderRadius: 100, padding: '3px 10px', fontFamily: 'JetBrains Mono,monospace', fontSize: 12, fontWeight: 600, color: 'var(--green)', margin: '8px 0 4px', width: 'fit-content' }}>⭐ {(m as any).score} / 5.0 — PR Score</div>}
                    {(m as any).verdict && <div style={{ background: 'rgba(255,140,42,0.1)', border: '1px solid rgba(255,140,42,0.3)', borderRadius: 100, padding: '3px 10px', fontFamily: 'JetBrains Mono,monospace', fontSize: 12, fontWeight: 600, color: 'var(--saffron-glow)', marginTop: 8, width: 'fit-content' }}>{(m as any).verdict}</div>}
                    {(m as any).sources?.length > 0 && <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                      {(m as any).sources.map((s: string) => <span key={s} style={{ background: 'rgba(0,200,255,0.08)', border: '1px solid rgba(0,200,255,0.15)', borderRadius: 6, padding: '3px 8px', fontSize: 10, color: 'var(--electric)', fontFamily: 'JetBrains Mono,monospace' }}>{s}</span>)}
                    </div>}
                    {(m as any).tip && <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-dim)', fontStyle: 'italic' }}>{(m as any).tip}</div>}
                  </div>
                )}
              </div>
            ))}
            {loading && <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '12px 12px 12px 4px', padding: '12px 16px', fontSize: 13, color: 'var(--text-muted)', maxWidth: '88%' }}>⚡ Analysing...</div>}
          </div>
          <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10 }}>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Ask your product question..." style={{ flex: 1, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', fontFamily: 'DM Sans,sans-serif', fontSize: 13, color: 'var(--text)', outline: 'none' }} />
            <button onClick={send} style={{ background: 'var(--saffron)', border: 'none', borderRadius: 10, width: 36, height: 36, cursor: 'pointer', fontSize: 14, transition: 'background .2s', flexShrink: 0 }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--saffron-glow)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--saffron)')}>→</button>
          </div>
        </div>
      </div>
    </section>
  )
}
