'use client'
const FEATURES = [
  { icon:'🇮🇳', title:'India-First Intelligence', desc:'Ratings calibrated to Indian income brackets, regional climates, power fluctuations, and local service availability.', tag:'Live Now', tagClass:'green' },
  { icon:'🕵️', title:'Fake Review Detection', desc:'Our proprietary ML flags incentivised, bot-generated, and seller-paid reviews. What you see is what real Indian buyers experienced.', tag:'Live Now', tagClass:'green' },
  { icon:'🗣️', title:'11 Language Sentiment', desc:'Hindi, Tamil, Telugu, Bengali, Marathi, Kannada, Malayalam, Gujarati reviews — all understood, not skipped.', tag:'Live Now', tagClass:'green' },
  { icon:'📍', title:'City-Wise Performance', desc:'An AC that works in Shimla fails in Ahmedabad. We surface geographic performance breakdowns for your city.', tag:'Live Now', tagClass:'green' },
  { icon:'⏳', title:'Longevity Tracker', desc:'We track products for 6 months and 1 year post-purchase. Know if it still works before you buy.', tag:'Coming Soon', tagClass:'blue' },
  { icon:'🔌', title:'API for Brands & Fintechs', desc:'Banks, BNPLs, and e-commerce platforms can license the ProductRating API. Your score becomes infrastructure.', tag:'Coming Soon', tagClass:'blue' },
]

export default function Features() {
  return (
    <section id="features" style={{ padding:'100px 48px', background:'#fff' }}>
      <div style={{ maxWidth:1200, margin:'0 auto' }}>
        <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:11, letterSpacing:3, textTransform:'uppercase', color:'var(--saffron)', marginBottom:12 }}>Why ProductRating.in</div>
        <h2 style={{ fontFamily:'Syne,sans-serif', fontSize:'clamp(28px,4vw,48px)', fontWeight:800, letterSpacing:'-1.5px', lineHeight:1.1, color:'var(--text)' }}>Built to be LLM-proof.<br />Your moat is the data.</h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20, marginTop:52 }}>
          {FEATURES.map(f => (
            <div key={f.title} style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:16, padding:32, transition:'box-shadow .2s, transform .2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow='var(--shadow-md)'; (e.currentTarget as HTMLDivElement).style.transform='translateY(-2px)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow='none'; (e.currentTarget as HTMLDivElement).style.transform='translateY(0)' }}>
              <div style={{ width:44, height:44, background:'var(--saffron-light)', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, marginBottom:18 }}>{f.icon}</div>
              <div style={{ fontFamily:'Syne,sans-serif', fontSize:17, fontWeight:700, marginBottom:8, color:'var(--text)' }}>{f.title}</div>
              <div style={{ fontSize:13, color:'var(--text-dim)', lineHeight:1.8 }}>{f.desc}</div>
              <div style={{ display:'inline-block', marginTop:16, fontFamily:'JetBrains Mono,monospace', fontSize:10, letterSpacing:1.5, textTransform:'uppercase', padding:'4px 10px', borderRadius:100, background: f.tagClass==='green' ? 'var(--green-bg)' : 'var(--blue-bg)', border:`1px solid ${f.tagClass==='green' ? '#A7F3D0' : '#BFDBFE'}`, color: f.tagClass==='green' ? 'var(--green)' : 'var(--blue)' }}>{f.tag}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
