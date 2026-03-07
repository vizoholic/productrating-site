'use client'
import React, { useState, useRef, useEffect } from 'react'

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

// Rich demo products that show immediately — looks great before any API call
const DEMO_PRODUCTS: SerpProduct[] = [
  { title: 'Daikin 1.5 Ton 5 Star Inverter Split AC', price: '₹47,990', rating: 4.6, reviews: 12840, source: 'Amazon', link: '#', thumbnail: 'https://m.media-amazon.com/images/I/41T8cpWlTTL._SL500_.jpg', delivery: 'Free delivery by tomorrow', badge: 'Best Seller' },
  { title: 'Voltas 1.5 Ton 5 Star Inverter Split AC', price: '₹38,490', rating: 4.2, reviews: 9650, source: 'Flipkart', link: '#', thumbnail: 'https://rukminim2.flixcart.com/image/312/312/xif0q/air-conditioner-new/u/d/o/-original-imaghpzfyxjegbpq.jpeg?q=70', delivery: 'Free delivery', badge: null },
  { title: 'LG 1.5 Ton 5 Star AI Dual Inverter AC', price: '₹52,990', rating: 4.5, reviews: 7320, source: 'Croma', link: '#', thumbnail: 'https://www.lg.com/in/images/air-conditioners/md07513501/gallery/medium01.jpg', delivery: 'Free delivery in 2 days', badge: 'Top Rated' },
  { title: 'Samsung 1.5 Ton 5 Star WindFree AC', price: '₹55,990', rating: 4.3, reviews: 4210, source: 'Amazon', link: '#', thumbnail: 'https://m.media-amazon.com/images/I/71W8YeZFb8L._SL500_.jpg', delivery: 'Free delivery', badge: null },
]

const INITIAL_MSGS: Message[] = [
  { role: 'user', text: 'Best AC under ₹50,000 for Chennai weather?' },
  {
    role: 'ai',
    text: "Daikin 1.5T 5★ Inverter is your best bet for Chennai — handles humidity exceptionally well. Chennai buyers rate it 4.6★ vs Voltas 4.0★. After-sales service in Tamil Nadu rated 4.4★ vs Voltas 3.6★.",
    score: '4.6',
    verdict: '🥇 Buy Now — Daikin',
    sources: ['Flipkart 4.5', 'Amazon 4.6', 'Croma 4.6'],
    tip: '💡 Price drops ~12% post-monsoon. Buy before summer for best stock.',
    serpProducts: DEMO_PRODUCTS,
    relatedSearches: ['Daikin vs Voltas', 'Best AC for Mumbai', '5 Star vs 3 Star AC'],
  },
]

function StarRating({ rating, reviews }: { rating: number; reviews?: number | null }) {
  const stars = Math.round(rating)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <div style={{ display: 'flex', gap: 1 }}>
        {[1,2,3,4,5].map(i => (
          <span key={i} style={{ fontSize: 10, color: i <= stars ? '#FFD700' : 'rgba(255,255,255,0.2)' }}>★</span>
        ))}
      </div>
      <span style={{ fontSize: 10, fontWeight: 700, color: '#FFD700', fontFamily: 'JetBrains Mono,monospace' }}>{rating.toFixed(1)}</span>
      {reviews && <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', fontFamily: 'JetBrains Mono,monospace' }}>({reviews >= 1000 ? `${(reviews/1000).toFixed(1)}k` : reviews})</span>}
    </div>
  )
}

function ProductCard({ p, index }: { p: SerpProduct; index: number }) {
  const [imgErr, setImgErr] = useState(false)
  const colors = ['#FF6B00', '#00C8FF', '#00E676', '#FFD60A']
  const accent = colors[index % colors.length]

  return (
    <a href={p.link} target="_blank" rel="noopener noreferrer"
      style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.03)', border: `1px solid rgba(255,255,255,0.08)`, borderRadius: 16, overflow: 'hidden', transition: 'all 0.25s', cursor: 'pointer', flex: '0 0 180px', position: 'relative' }}
      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.border = `1px solid ${accent}40`; el.style.transform = 'translateY(-4px)'; el.style.boxShadow = `0 12px 32px ${accent}18` }}
      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.border = '1px solid rgba(255,255,255,0.08)'; el.style.transform = 'translateY(0)'; el.style.boxShadow = 'none' }}
    >
      {p.badge && (
        <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 2, background: accent, color: '#000', fontSize: 9, fontWeight: 800, fontFamily: 'JetBrains Mono,monospace', padding: '2px 7px', borderRadius: 4, letterSpacing: 0.5 }}>{p.badge}</div>
      )}
      {/* Product image */}
      <div style={{ height: 120, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {!imgErr && p.thumbnail ? (
          <img src={p.thumbnail} alt={p.title} onError={() => setImgErr(true)}
            style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 12 }} />
        ) : (
          <div style={{ fontSize: 36, opacity: 0.3 }}>📦</div>
        )}
      </div>
      {/* Info */}
      <div style={{ padding: '10px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', fontWeight: 600, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.title}</div>
        <div style={{ fontSize: 15, fontWeight: 800, color: accent, fontFamily: 'Syne,sans-serif', marginTop: 'auto' }}>{p.price}</div>
        {p.rating && <StarRating rating={p.rating} reviews={p.reviews} />}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.06)', borderRadius: 4, padding: '2px 6px', fontFamily: 'JetBrains Mono,monospace' }}>{p.source}</span>
          {p.delivery && <span style={{ fontSize: 8, color: '#00E676', fontFamily: 'JetBrains Mono,monospace', textAlign: 'right', maxWidth: 80, lineHeight: 1.2 }}>{p.delivery.replace('Free delivery', 'Free')}</span>}
        </div>
      </div>
    </a>
  )
}

function ProductShelf({ products, label }: { products: SerpProduct[]; label?: string }) {
  const scrollRef = useRef<HTMLDivElement>(null)

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00E676', display: 'inline-block', animation: 'livePulse 1.5s infinite' }} />
        <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: '#00C8FF' }}>
          {label || 'Live Google Shopping India'}
        </span>
      </div>
      <div ref={scrollRef} style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'none' }}>
        {products.map((p, i) => <ProductCard key={i} p={p} index={i} />)}
      </div>
    </div>
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
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs, loading])

  const send = async (question?: string) => {
    const q = (question ?? input).trim()
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
      setMsgs(m => [...m, {
        role: 'ai',
        text: data.answer || 'Let me analyse that for you...',
        score: null, sources: [], tip: null, verdict: null,
        serpProducts: data.serpProducts || [],
        relatedSearches: data.relatedSearches || [],
      }])
    } catch {
      setMsgs(m => [...m, { role: 'ai', text: 'Connect SARVAM_API_KEY + SERPAPI_KEY in Vercel to get live answers!', score: null, sources: [], tip: null, verdict: null }])
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
          const d = await res.json()
          if (d.transcript) setInput(d.transcript)
        } catch { /* ignore */ }
        setTranscribing(false)
      }
      mr.start()
      setRecording(true)
    } catch { alert('Mic permission denied.') }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) { mediaRecorderRef.current.stop(); setRecording(false) }
  }

  return (
    <section style={{ background: 'linear-gradient(180deg, #0a0a0a 0%, #080808 100%)', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '80px 0' }}>
      <style>{`
        @keyframes livePulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.4)} }
        @keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(300%)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .scrollbar-hide::-webkit-scrollbar { display:none }
      `}</style>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 48px' }}>

        {/* Section header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 40, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: '#FF6B00', marginBottom: 10 }}>// Live AI + Google Shopping</div>
            <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: 'clamp(28px,3.5vw,48px)', fontWeight: 800, letterSpacing: '-1.5px', lineHeight: 1.1, margin: 0 }}>
              Ask. Get prices.<br />Buy smarter. 🇮🇳
            </h2>
          </div>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {[['22', 'Languages'], ['4+', 'Platforms'], ['Live', 'Prices']].map(([val, label]) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 24, fontWeight: 800, color: '#FF6B00' }}>{val}</div>
                <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: 2, textTransform: 'uppercase' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Main layout: Chat left, Product shelf right */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 24, alignItems: 'stretch' }}>

          {/* LEFT: Chat */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {/* Chrome bar */}
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: 5 }}>
                {['#FF5F57','#FEBC2E','#28C840'].map(c => <div key={c} style={{ width: 8, height: 8, borderRadius: '50%', background: c, opacity: 0.7 }} />)}
              </div>
              <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: 'rgba(255,255,255,0.25)', marginLeft: 4 }}>sarvam-ai · productrating.in</span>
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 5, height: 5, background: '#28C840', borderRadius: '50%', animation: 'livePulse 2s infinite' }} />
                <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: '#28C840' }}>LIVE</span>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 480 }}>
              {msgs.map((m, i) => (
                <div key={i} style={{ animation: 'fadeUp 0.3s ease', animationFillMode: 'both', animationDelay: `${i * 0.05}s` }}>
                  {m.role === 'user' ? (
                    <div style={{ alignSelf: 'flex-end', maxWidth: '85%', marginLeft: 'auto' }}>
                      <div style={{ background: 'rgba(255,107,0,0.12)', border: '1px solid rgba(255,107,0,0.25)', borderRadius: '14px 14px 4px 14px', padding: '10px 14px', fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.9)' }}>{m.text}</div>
                    </div>
                  ) : (
                    <div style={{ maxWidth: '95%' }}>
                      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '4px 14px 14px 14px', padding: '12px 14px' }}>
                        <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 8, letterSpacing: 2, textTransform: 'uppercase', color: '#FF6B00', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>⚡ Sarvam AI</span>
                        </div>
                        <div style={{ fontSize: 13, lineHeight: 1.7, color: 'rgba(255,255,255,0.85)' }}>{m.text}</div>

                        {/* Score + Verdict row */}
                        {(m.score || m.verdict) && (
                          <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                            {m.score && <span style={{ background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.25)', borderRadius: 100, padding: '3px 10px', fontFamily: 'JetBrains Mono,monospace', fontSize: 11, fontWeight: 700, color: '#00E676' }}>⭐ {m.score} / 5.0</span>}
                            {m.verdict && <span style={{ background: 'rgba(255,107,0,0.1)', border: '1px solid rgba(255,107,0,0.3)', borderRadius: 100, padding: '3px 10px', fontFamily: 'JetBrains Mono,monospace', fontSize: 11, fontWeight: 700, color: '#FF6B00' }}>{m.verdict}</span>}
                          </div>
                        )}

                        {/* Source chips */}
                        {m.sources && m.sources.length > 0 && (
                          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 10 }}>
                            {m.sources.map(s => <span key={s} style={{ background: 'rgba(0,200,255,0.07)', border: '1px solid rgba(0,200,255,0.15)', borderRadius: 5, padding: '2px 7px', fontSize: 9, color: '#00C8FF', fontFamily: 'JetBrains Mono,monospace' }}>{s}</span>)}
                          </div>
                        )}
                        {m.tip && <div style={{ marginTop: 10, fontSize: 12, color: 'rgba(255,255,255,0.45)', fontStyle: 'italic', borderLeft: '2px solid rgba(255,107,0,0.3)', paddingLeft: 8 }}>{m.tip}</div>}

                        {/* Related searches */}
                        {m.relatedSearches && m.relatedSearches.length > 0 && (
                          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 10 }}>
                            {m.relatedSearches.slice(0, 3).map((s, si) => (
                              <button key={si} onClick={() => send(s)} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 100, padding: '3px 10px', fontSize: 10, color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', transition: 'all 0.2s' }}
                                onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = 'rgba(255,107,0,0.4)'; (e.target as HTMLElement).style.color = '#FF6B00' }}
                                onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)'; (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.5)' }}
                              >{s} →</button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div style={{ maxWidth: '85%' }}>
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '4px 14px 14px 14px', padding: '12px 14px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontFamily: 'JetBrains Mono,monospace' }}>
                      <span style={{ color: '#28C840' }}>▶</span> Searching Google Shopping India + Sarvam AI...
                    </div>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(90deg,transparent,rgba(255,107,0,0.05),transparent)', animation: 'shimmer 1.5s infinite' }} />
                  </div>
                </div>
              )}
              {transcribing && (
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontFamily: 'JetBrains Mono,monospace', padding: '0 4px' }}>🎙️ Converting to text...</div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div style={{ padding: '12px 14px', borderTop: '1px solid rgba(255,255,255,0.05)', flexShrink: 0, background: 'rgba(0,0,0,0.2)' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}
                  placeholder={recording ? '🔴 Recording...' : transcribing ? 'Transcribing...' : 'Ask in Hindi, Tamil, English...'}
                  disabled={recording || transcribing}
                  style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '9px 12px', fontFamily: 'DM Sans,sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.9)', outline: 'none' }}
                />
                <button onClick={() => { if (recording) stopRecording(); else startRecording() }} disabled={transcribing || loading}
                  style={{ background: recording ? 'rgba(255,59,48,0.8)' : 'rgba(255,255,255,0.06)', border: `1px solid ${recording ? 'rgba(255,59,48,0.5)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 10, width: 36, height: 36, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {recording ? '⏹' : '🎙️'}
                </button>
                <button onClick={() => send()} disabled={loading || recording || transcribing}
                  style={{ background: '#FF6B00', border: 'none', borderRadius: 10, width: 36, height: 36, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: loading ? 0.5 : 1 }}>→</button>
              </div>
              <div style={{ marginTop: 6, fontSize: 9, color: 'rgba(255,255,255,0.2)', fontFamily: 'JetBrains Mono,monospace', textAlign: 'center', letterSpacing: 1 }}>
                HINDI · TAMIL · TELUGU · BENGALI · KANNADA · MALAYALAM + 16 MORE
              </div>
            </div>
          </div>

          {/* RIGHT: Live Product Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Header bar */}
            <div style={{ background: 'rgba(0,200,255,0.04)', border: '1px solid rgba(0,200,255,0.12)', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 6, height: 6, background: '#00E676', borderRadius: '50%', animation: 'livePulse 1.5s infinite' }} />
                <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: '#00C8FF' }}>Live · Google Shopping India</span>
              </div>
              <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>gl=in · Updated just now</span>
            </div>

            {/* Product grid — shows last AI message's products */}
            {(() => {
              const lastAi = [...msgs].reverse().find(m => m.role === 'ai' && m.serpProducts && m.serpProducts.length > 0)
              const products = lastAi?.serpProducts || DEMO_PRODUCTS
              return (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                  {products.slice(0, 4).map((p, i) => (
                    <ProductCard key={i} p={p} index={i} />
                  ))}
                </div>
              )
            })()}

            {/* Price comparison mini-bar */}
            {(() => {
              const lastAi = [...msgs].reverse().find(m => m.role === 'ai' && m.serpProducts && m.serpProducts.length > 0)
              const products = (lastAi?.serpProducts || DEMO_PRODUCTS).slice(0, 4)
              const prices = products.map(p => parseInt(p.price.replace(/[^0-9]/g,'')) || 0).filter(Boolean)
              if (!prices.length) return null
              const min = Math.min(...prices)
              const max = Math.max(...prices)
              return (
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '14px 16px' }}>
                  <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 10 }}>Price Range (India)</div>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {products.map((p, i) => {
                      const price = parseInt(p.price.replace(/[^0-9]/g,'')) || 0
                      const pct = max > min ? ((price - min) / (max - min)) * 100 : 50
                      const colors = ['#FF6B00','#00C8FF','#00E676','#FFD60A']
                      const c = colors[i % colors.length]
                      return (
                        <div key={i} style={{ flex: '1 1 120px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontFamily: 'JetBrains Mono,monospace', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.source}</span>
                            <span style={{ fontSize: 10, fontWeight: 700, color: c, fontFamily: 'Syne,sans-serif' }}>{p.price}</span>
                          </div>
                          <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{ width: `${Math.max(20, pct)}%`, height: '100%', background: c, borderRadius: 2, transition: 'width 0.5s ease' }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })()}

            <div style={{ textAlign: 'center', fontSize: 9, fontFamily: 'JetBrains Mono,monospace', color: 'rgba(255,255,255,0.15)', letterSpacing: 1.5 }}>
              DATA FROM GOOGLE SHOPPING · SERPAPI · UPDATED IN REAL-TIME
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
