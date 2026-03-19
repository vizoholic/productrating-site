'use client'

const STEPS = [
  { n:'01', icon:'🕸️', title:'We collect everything', desc:'Every review from Flipkart, Amazon, Nykaa, Meesho, Croma & more — collected in real-time, in all 11 Indian languages.' },
  { n:'02', icon:'🕵️', title:'We remove the fake ones', desc:'Our AI catches bot reviews, incentivised ratings, and seller-paid scores. Only real verified buyer feedback survives.' },
  { n:'03', icon:'📊', title:'We compute one honest score', desc:'The PR Score weighs recency, city-wise feedback, reviewer credibility, and after-sales experience into one clear number.' },
  { n:'04', icon:'💬', title:'You get a straight answer', desc:'Ask in English or Hindi. Get a specific recommendation — not just stars. "Best for Delhi weather?" gets a real answer.' },
]

export default function HowItWorks() {
  return (
    <section id="how" style={{ background:'#F7F8FA', borderTop:'1px solid #E5E7EB', borderBottom:'1px solid #E5E7EB', padding:'96px 48px' }}>
      <div style={{ maxWidth:1200, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:56 }}>
          <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:11, letterSpacing:3, textTransform:'uppercase', color:'#FF6B00', marginBottom:12 }}>How it works</div>
          <h2 style={{ fontFamily:'Syne,sans-serif', fontSize:'clamp(28px,4vw,48px)', fontWeight:800, letterSpacing:'-1.5px', color:'#111218', lineHeight:1.1 }}>
            From 5M messy reviews<br />to one honest answer.
          </h2>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:1, background:'#E5E7EB', borderRadius:16, overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
          {STEPS.map((s, i) => (
            <div key={s.n} style={{ background:'#fff', padding:'36px 28px', position:'relative' }}>
              {i < STEPS.length - 1 && (
                <div style={{ position:'absolute', top:'50%', right:-1, transform:'translateY(-50%)', width:2, height:'40%', background:'#F3F4F6', zIndex:1 }} />
              )}
              <div style={{ fontFamily:'Syne,sans-serif', fontSize:48, fontWeight:800, color:'rgba(255,107,0,0.07)', lineHeight:1, marginBottom:20, letterSpacing:'-3px' }}>{s.n}</div>
              <span style={{ fontSize:26, marginBottom:14, display:'block' }}>{s.icon}</span>
              <div style={{ fontFamily:'Syne,sans-serif', fontSize:15, fontWeight:700, marginBottom:8, color:'#111218' }}>{s.title}</div>
              <div style={{ fontSize:13, color:'#6B7280', lineHeight:1.7 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
