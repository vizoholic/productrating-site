const STEPS = [
  { n:'01', icon:'🕸️', title:'Aggregate from all platforms', desc:'We continuously collect reviews from Flipkart, Amazon, Nykaa, Meesho, Croma, JioMart & more — in real-time.' },
  { n:'02', icon:'🧠', title:'AI cleans & analyses', desc:'Our ML model detects fake reviews, weights verified buyers higher, and runs multilingual sentiment analysis across 11 Indian languages.' },
  { n:'03', icon:'🏆', title:'Compute the PR Score', desc:'The proprietary ProductRating Score weighs recency, reviewer reliability, city-wise variation, and after-sales experience.' },
  { n:'04', icon:'💬', title:'AI answers your question', desc:'Ask in plain English or Hindi. Get a specific, honest recommendation — not just stars.' },
]

export default function HowItWorks() {
  return (
    <section id="how" style={{ background:'var(--bg2)', borderTop:'1px solid var(--border)', borderBottom:'1px solid var(--border)', padding:'100px 48px' }}>
      <div style={{ maxWidth:1200, margin:'0 auto' }}>
        <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:11, letterSpacing:3, textTransform:'uppercase', color:'var(--saffron)', marginBottom:12 }}>How It Works</div>
        <h2 style={{ fontFamily:'Syne,sans-serif', fontSize:'clamp(28px,4vw,48px)', fontWeight:800, letterSpacing:'-1.5px', lineHeight:1.1, color:'var(--text)' }}>One score.<br />All of India&apos;s voice.</h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:1, marginTop:52, background:'var(--border)', borderRadius:16, overflow:'hidden', boxShadow:'var(--shadow-sm)' }}>
          {STEPS.map(s => (
            <div key={s.n} style={{ background:'#fff', padding:'36px 28px' }}>
              <div style={{ fontFamily:'Syne,sans-serif', fontSize:56, fontWeight:800, color:'rgba(255,107,0,0.08)', lineHeight:1, marginBottom:20, letterSpacing:'-3px' }}>{s.n}</div>
              <span style={{ fontSize:26, marginBottom:14, display:'block' }}>{s.icon}</span>
              <div style={{ fontFamily:'Syne,sans-serif', fontSize:15, fontWeight:700, marginBottom:8, color:'var(--text)' }}>{s.title}</div>
              <div style={{ fontSize:13, color:'var(--text-dim)', lineHeight:1.7 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
