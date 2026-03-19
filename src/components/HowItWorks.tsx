'use client'
const STEPS = [
  { n:'01', icon:'🕸️', title:'We collect everything', desc:'Every review from Flipkart, Amazon, Nykaa, Meesho, Croma & more — in real-time, across 22 Indian languages.' },
  { n:'02', icon:'🕵️', title:'We remove the fake ones', desc:'Our AI catches bot reviews, incentivised ratings, and seller-paid scores. Only verified buyer feedback survives.' },
  { n:'03', icon:'📊', title:'We build one honest score', desc:'The PR Score weighs recency, city-wise feedback, reviewer credibility, and after-sales experience.' },
  { n:'04', icon:'💬', title:'You get a straight answer', desc:'Ask in English or Hindi. Get a specific recommendation with city-specific insights for India.' },
]
export default function HowItWorks() {
  return (
    <section id="how" style={{ background:'#F9FAFB', borderTop:'1px solid #E5E7EB', borderBottom:'1px solid #E5E7EB', padding:'clamp(48px,8vw,80px) clamp(16px,5vw,40px)' }}>
      <div style={{ maxWidth:1160, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:40 }}>
          <div style={{ fontSize:12, fontWeight:600, color:'#2563EB', letterSpacing:'1px', textTransform:'uppercase', marginBottom:10, fontFamily:'JetBrains Mono,monospace' }}>How it works</div>
          <h2 style={{ fontSize:'clamp(24px,3.5vw,40px)', fontWeight:800, letterSpacing:'-1px', color:'#111827', lineHeight:1.15 }}>From 5M messy reviews<br />to one honest answer.</h2>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:1, background:'#E5E7EB', borderRadius:12, overflow:'hidden' }}>
          {STEPS.map(s=>(
            <div key={s.n} style={{ background:'#fff', padding:'28px 22px' }}>
              <div style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:36, fontWeight:800, color:'rgba(37,99,235,0.06)', letterSpacing:'-2px', lineHeight:1, marginBottom:14 }}>{s.n}</div>
              <div style={{ fontSize:20, marginBottom:10 }}>{s.icon}</div>
              <div style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:15, fontWeight:700, color:'#111827', marginBottom:6 }}>{s.title}</div>
              <div style={{ fontSize:13, color:'#6B7280', lineHeight:1.65 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
