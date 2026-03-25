'use client'
import { useEffect, useRef } from 'react'

// Custom rating indicator — thin-line arc, not generic stars
function RatingArc({ score, size=56 }: { score:number; size?:number }) {
  const pct = (score / 5)
  const r = (size/2) - 5
  const circ = 2 * Math.PI * r
  const dash = circ * pct
  return (
    <div style={{ position:'relative', width:size, height:size, flexShrink:0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform:'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--bg-3)" strokeWidth="2.5"/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--accent)" strokeWidth="2.5"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition:'stroke-dasharray 1s cubic-bezier(0.22,1,0.36,1)' }}/>
      </svg>
      <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column' }}>
        <span style={{ fontFamily:'var(--font-serif)', fontSize:size/3, fontWeight:700, color:'var(--ink)', lineHeight:1, letterSpacing:'-1px' }}>{score.toFixed(1)}</span>
        <span style={{ fontSize:8, color:'var(--ink-4)', fontFamily:'var(--font-mono)', letterSpacing:'0.3px' }}>/5</span>
      </div>
    </div>
  )
}

// Editor's Choice seal — bespoke branded badge
function EditorSeal({ label }: { label:string }) {
  return (
    <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'var(--gold-bg)', border:'1px solid rgba(139,105,20,0.25)', borderRadius:'var(--radius-sm)', padding:'6px 14px' }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.8">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
      <span style={{ fontSize:11, fontWeight:500, color:'var(--gold)', fontFamily:'var(--font-mono)', letterSpacing:'0.5px', textTransform:'uppercase' }}>{label}</span>
    </div>
  )
}

const PLATFORMS = ['Amazon.in','Flipkart','Nykaa','Croma','Meesho','JioMart','Myntra','Tata Cliq','Ajio','Reliance Digital']

// Scroll reveal hook
function useReveal() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { el.classList.add('visible'); obs.disconnect() } }, { threshold:0.15 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return ref
}

function RevealDiv({ children, delay=0, style={} }: { children:React.ReactNode; delay?:number; style?:React.CSSProperties }) {
  const ref = useReveal()
  return <div ref={ref} className="reveal" style={{ transitionDelay:`${delay}s`, ...style }}>{children}</div>
}

export default function Features() {
  return (
    <>
      {/* ── BENTO GRID — What makes us different ── */}
      <section style={{ padding:'clamp(80px,10vw,120px) clamp(20px,5vw,48px)', background:'var(--bg)' }}>
        <div style={{ maxWidth:1140, margin:'0 auto' }}>

          <RevealDiv style={{ marginBottom:56, textAlign:'center' }}>
            <p style={{ fontSize:11, color:'var(--accent)', fontFamily:'var(--font-mono)', letterSpacing:'2px', textTransform:'uppercase', marginBottom:14 }}>What makes us different</p>
            <h2 style={{ fontFamily:'var(--font-serif)', fontSize:'clamp(28px,4.5vw,52px)', fontWeight:700, color:'var(--ink)', letterSpacing:'-1px', lineHeight:1.1 }}>
              Three things we do<br/><em style={{ fontStyle:'italic', color:'var(--accent)' }}>better than anyone.</em>
            </h2>
          </RevealDiv>

          {/* Bento grid */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(12, 1fr)', gridTemplateRows:'auto', gap:16 }}>

            {/* Large card — Honest Score */}
            <RevealDiv style={{ gridColumn:'span 7' }}>
              <div className="hover-lift" style={{ background:'var(--bg-1)', border:'1.5px solid var(--border)', borderRadius:'var(--radius-xl)', padding:'clamp(28px,4vw,48px)', height:'100%', position:'relative', overflow:'hidden', boxShadow:'var(--shadow-sm)' }}>
                <div style={{ position:'absolute', top:0, right:0, width:'200px', height:'200px', background:'radial-gradient(circle, rgba(44,95,46,0.06) 0%, transparent 70%)', filter:'blur(30px)' }} />
                <EditorSeal label="ProductRating Certified" />
                <h3 style={{ fontFamily:'var(--font-serif)', fontSize:'clamp(22px,3vw,32px)', fontWeight:700, color:'var(--ink)', marginTop:20, marginBottom:12, letterSpacing:'-0.5px', lineHeight:1.2 }}>
                  One honest score.<br/>Across every platform.
                </h3>
                <p style={{ fontSize:14, color:'var(--ink-3)', lineHeight:1.85, letterSpacing:'0.02em', fontWeight:300, maxWidth:380, marginBottom:28 }}>
                  We aggregate reviews from 8 Indian platforms and remove the fake ones. The number you see is what real buyers think — not what sellers paid for.
                </p>
                {/* Custom rating comparison */}
                <div style={{ display:'flex', gap:24, alignItems:'center', flexWrap:'wrap' }}>
                  <div style={{ textAlign:'center' }}>
                    <div style={{ fontSize:10, color:'var(--ink-4)', fontFamily:'var(--font-mono)', letterSpacing:'1px', textTransform:'uppercase', marginBottom:10 }}>Platform shows</div>
                    <RatingArc score={4.7} />
                    <div style={{ fontSize:11, color:'#B91C1C', marginTop:6, fontFamily:'var(--font-mono)' }}>4.7 · with fakes</div>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:4, color:'var(--ink-4)' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </div>
                  <div style={{ textAlign:'center' }}>
                    <div style={{ fontSize:10, color:'var(--ink-4)', fontFamily:'var(--font-mono)', letterSpacing:'1px', textTransform:'uppercase', marginBottom:10 }}>Real PR Score</div>
                    <RatingArc score={4.2} />
                    <div style={{ fontSize:11, color:'var(--accent)', marginTop:6, fontFamily:'var(--font-mono)' }}>4.2 · AI-adjusted</div>
                  </div>
                </div>
                <div style={{ marginTop:24, fontSize:11, color:'var(--ink-4)', fontFamily:'var(--font-mono)', letterSpacing:'0.5px' }}>38% of reviews removed on average</div>
              </div>
            </RevealDiv>

            {/* Right column — 2 smaller cards */}
            <div style={{ gridColumn:'span 5', display:'flex', flexDirection:'column', gap:16 }}>

              {/* India Context */}
              <RevealDiv delay={0.1} style={{ flex:1 }}>
                <div className="hover-lift" style={{ background:'var(--ink)', border:'1.5px solid var(--ink)', borderRadius:'var(--radius-xl)', padding:'clamp(22px,3vw,32px)', height:'100%', boxShadow:'var(--shadow-md)' }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--bg-2)" strokeWidth="1.5" strokeLinecap="round" style={{ marginBottom:16 }}>
                    <path d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  <h3 style={{ fontFamily:'var(--font-serif)', fontSize:'clamp(18px,2.5vw,24px)', fontWeight:700, color:'var(--bg)', marginBottom:10, letterSpacing:'-0.3px' }}>
                    Built for India&apos;s context
                  </h3>
                  <p style={{ fontSize:13, color:'rgba(248,246,241,0.6)', lineHeight:1.8, letterSpacing:'0.02em', fontWeight:300 }}>
                    Chennai heat. Delhi dust. Mumbai humidity. Our recommendations factor in your city&apos;s actual conditions.
                  </p>
                  <div style={{ marginTop:16, fontSize:11, color:'rgba(248,246,241,0.35)', fontFamily:'var(--font-mono)', letterSpacing:'0.5px' }}>Tier 1 & 2 city intelligence</div>
                </div>
              </RevealDiv>

              {/* Voice */}
              <RevealDiv delay={0.2} style={{ flex:1 }}>
                <div className="hover-lift" style={{ background:'var(--accent-bg)', border:'1.5px solid var(--accent-border)', borderRadius:'var(--radius-xl)', padding:'clamp(22px,3vw,32px)', height:'100%', boxShadow:'var(--shadow-sm)' }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" style={{ marginBottom:16 }}>
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                    <line x1="12" y1="19" x2="12" y2="23"/>
                    <line x1="8" y1="23" x2="16" y2="23"/>
                  </svg>
                  <h3 style={{ fontFamily:'var(--font-serif)', fontSize:'clamp(18px,2.5vw,24px)', fontWeight:700, color:'var(--ink)', marginBottom:10, letterSpacing:'-0.3px' }}>
                    Voice in 22 languages
                  </h3>
                  <p style={{ fontSize:13, color:'var(--ink-3)', lineHeight:1.8, letterSpacing:'0.02em', fontWeight:300 }}>
                    Hindi, Tamil, Telugu, Bengali — ask in your language, get answers that understand India.
                  </p>
                  <div style={{ marginTop:16, fontSize:11, color:'var(--accent)', fontFamily:'var(--font-mono)', letterSpacing:'0.5px' }}>All 22 scheduled languages</div>
                </div>
              </RevealDiv>
            </div>
          </div>
        </div>
      </section>

      {/* ── PLATFORM ROW — editorial ── */}
      <section style={{ padding:'clamp(48px,6vw,72px) clamp(20px,5vw,48px)', background:'var(--bg-1)', borderTop:'1px solid var(--border)', borderBottom:'1px solid var(--border)' }}>
        <div style={{ maxWidth:1140, margin:'0 auto' }}>
          <RevealDiv>
            <p style={{ fontSize:11, color:'var(--ink-4)', fontFamily:'var(--font-mono)', letterSpacing:'2px', textTransform:'uppercase', textAlign:'center', marginBottom:28 }}>
              Signals from India&apos;s most-used marketplaces
            </p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8, justifyContent:'center' }}>
              {PLATFORMS.map(p => (
                <div key={p} style={{ padding:'8px 18px', borderRadius:'var(--radius-xl)', background:'var(--bg-2)', border:'1px solid var(--border)' }}>
                  <span style={{ fontSize:13, fontWeight:400, color:'var(--ink-2)', fontFamily:'var(--font-sans)', letterSpacing:'0.01em' }}>{p}</span>
                </div>
              ))}
            </div>
          </RevealDiv>
        </div>
      </section>

      {/* ── HOW IT WORKS — horizontal connected flow ── */}
      <section style={{ padding:'clamp(80px,10vw,120px) clamp(20px,5vw,48px)', background:'var(--bg)' }}>
        <div style={{ maxWidth:1140, margin:'0 auto' }}>
          <RevealDiv style={{ textAlign:'center', marginBottom:64 }}>
            <p style={{ fontSize:11, color:'var(--accent)', fontFamily:'var(--font-mono)', letterSpacing:'2px', textTransform:'uppercase', marginBottom:14 }}>Process</p>
            <h2 style={{ fontFamily:'var(--font-serif)', fontSize:'clamp(26px,4vw,46px)', fontWeight:700, color:'var(--ink)', letterSpacing:'-1px', lineHeight:1.1 }}>
              From millions of reviews<br/><em style={{ fontStyle:'italic' }}>to one answer.</em>
            </h2>
          </RevealDiv>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px,1fr))', gap:2, background:'var(--border)', borderRadius:'var(--radius-xl)', overflow:'hidden' }}>
            {[
              { n:'01', title:'Collect', desc:'Every review from 8+ Indian platforms, updated daily.', icon:'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4' },
              { n:'02', title:'Filter', desc:'AI detects and removes fake, paid, and bot-generated reviews.', icon:'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636' },
              { n:'03', title:'Score', desc:'One PR Score — weighted by recency, credibility, and city context.', icon:'M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z' },
              { n:'04', title:'Answer', desc:'A clear recommendation with pros, cons, and direct buy links.', icon:'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
            ].map((s,i) => (
              <RevealDiv key={s.n} delay={i*0.1}>
                <div style={{ background:'var(--bg-1)', padding:'36px 28px', height:'100%' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
                    <span style={{ fontFamily:'var(--font-serif)', fontSize:13, fontStyle:'italic', color:'var(--ink-4)', letterSpacing:'0.5px' }}>{s.n}</span>
                    <div style={{ flex:1, height:1, background:'var(--border)' }} />
                  </div>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" style={{ marginBottom:14 }}>
                    <path d={s.icon}/>
                  </svg>
                  <h3 style={{ fontFamily:'var(--font-serif)', fontSize:22, fontWeight:700, color:'var(--ink)', marginBottom:10, letterSpacing:'-0.3px' }}>{s.title}</h3>
                  <p style={{ fontSize:13, color:'var(--ink-3)', lineHeight:1.8, letterSpacing:'0.02em', fontWeight:300 }}>{s.desc}</p>
                </div>
              </RevealDiv>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
