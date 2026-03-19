'use client'
const STEPS = [
  { n:'01', icon:'🕸️', title:'We collect everything', desc:'Every review from Flipkart, Amazon, Nykaa, Meesho, Croma & more — in real-time, across all 11 Indian languages.' },
  { n:'02', icon:'🕵️', title:'We remove the fake ones', desc:'Our AI catches bot reviews, incentivised ratings, and seller-paid scores. Only verified buyer feedback survives.' },
  { n:'03', icon:'📊', title:'We build one honest score', desc:'The PR Score weighs recency, city-wise feedback, reviewer credibility, and after-sales experience into one number.' },
  { n:'04', icon:'💬', title:'You get a straight answer', desc:'Ask in English or Hindi. Get a specific recommendation — not just stars. City-specific answers for India.' },
]
export default function HowItWorks() {
  return (
    <section id="how" style={{ background:'var(--bg-2)', borderTop:'1px solid var(--border)', borderBottom:'1px solid var(--border)', padding:'80px 40px' }}>
      <div style={{ maxWidth:1160, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:48 }}>
          <div style={{ fontSize:12, fontWeight:600, color:'var(--blue)', letterSpacing:'1px', textTransform:'uppercase', marginBottom:10, fontFamily:'JetBrains Mono,monospace' }}>How it works</div>
          <h2 style={{ fontSize:'clamp(26px,3.5vw,40px)', fontWeight:800, letterSpacing:'-1px', color:'var(--ink)', lineHeight:1.15 }}>
            From 5M messy reviews<br />to one honest answer.
          </h2>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:1, background:'var(--border)', borderRadius:12, overflow:'hidden' }}>
          {STEPS.map(s=>(
            <div key={s.n} style={{ background:'#fff', padding:'32px 24px' }}>
              <div style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:40, fontWeight:800, color:'rgba(37,99,235,0.06)', letterSpacing:'-2px', lineHeight:1, marginBottom:16 }}>{s.n}</div>
              <div style={{ fontSize:22, marginBottom:12 }}>{s.icon}</div>
              <div style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:15, fontWeight:700, color:'var(--ink)', marginBottom:8 }}>{s.title}</div>
              <div style={{ fontSize:13, color:'var(--muted)', lineHeight:1.65 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
