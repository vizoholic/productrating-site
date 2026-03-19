'use client'

const FEATURES = [
  { icon:'🇮🇳', title:'India-First Intelligence', desc:'Ratings calibrated for Indian income brackets, regional climates, power fluctuations, and local service availability. Not global averages.', tag:'Live Now', green:true },
  { icon:'🕵️', title:'Fake Review Detection', desc:'Our ML flags incentivised, bot-generated, and seller-paid reviews. What you see is what real Indian buyers actually experienced.', tag:'Live Now', green:true },
  { icon:'🗣️', title:'11 Language Sentiment', desc:'Hindi, Tamil, Telugu, Bengali, Marathi, Kannada, Malayalam, Gujarati reviews — all understood, none skipped.', tag:'Live Now', green:true },
  { icon:'📍', title:'City-Wise Performance', desc:'An AC that works in Shimla fails in Ahmedabad. We surface geographic performance breakdowns so your city informs your decision.', tag:'Live Now', green:true },
  { icon:'⏳', title:'Longevity Tracker', desc:'We track products for 6 months and 1 year post-purchase. Know if it still works before you buy — not just on day one.', tag:'Coming Soon', green:false },
  { icon:'🔌', title:'API for Brands & Fintechs', desc:'Banks, BNPLs, and e-commerce platforms can license the ProductRating API. Your score becomes infrastructure.', tag:'Coming Soon', green:false },
]

export default function Features() {
  return (
    <section id="features" style={{ padding:'96px 48px', background:'#fff' }}>
      <div style={{ maxWidth:1200, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:56 }}>
          <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:11, letterSpacing:3, textTransform:'uppercase', color:'#FF6B00', marginBottom:12 }}>What makes us different</div>
          <h2 style={{ fontFamily:'Syne,sans-serif', fontSize:'clamp(28px,4vw,48px)', fontWeight:800, letterSpacing:'-1.5px', color:'#111218', lineHeight:1.1 }}>
            Built for India.<br />Impossible to fake.
          </h2>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20 }}>
          {FEATURES.map(f => (
            <div key={f.title} style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:16, padding:32, transition:'box-shadow .2s, transform .2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow='0 8px 32px rgba(0,0,0,0.08)'; (e.currentTarget as HTMLDivElement).style.transform='translateY(-2px)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow='none'; (e.currentTarget as HTMLDivElement).style.transform='translateY(0)' }}>
              <div style={{ width:46, height:46, background:'#FFF7F0', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, marginBottom:18 }}>{f.icon}</div>
              <div style={{ fontFamily:'Syne,sans-serif', fontSize:17, fontWeight:700, marginBottom:8, color:'#111218' }}>{f.title}</div>
              <div style={{ fontSize:13, color:'#6B7280', lineHeight:1.8, marginBottom:16 }}>{f.desc}</div>
              <div style={{ display:'inline-block', fontFamily:'JetBrains Mono,monospace', fontSize:10, letterSpacing:1.5, textTransform:'uppercase', padding:'4px 10px', borderRadius:100, background: f.green ? '#F0FDF4' : '#EFF6FF', border:`1px solid ${f.green ? '#A7F3D0' : '#BFDBFE'}`, color: f.green ? '#059669' : '#2563EB' }}>{f.tag}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
