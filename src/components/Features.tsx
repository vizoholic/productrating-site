'use client'
const FEATURES = [
  { icon:'🇮🇳', title:'India-First Intelligence', desc:'Calibrated for Indian climates, income brackets, power fluctuations, and local service quality — not global averages.', tag:'Live', green:true },
  { icon:'🕵️', title:'Fake Review Detection', desc:'ML flags incentivised, bot-generated, and seller-paid reviews. What you see is what real Indian buyers experienced.', tag:'Live', green:true },
  { icon:'🗣️', title:'11 Language Sentiment', desc:'Hindi, Tamil, Telugu, Bengali, Marathi, Kannada, Malayalam, Gujarati — all read and understood, not skipped.', tag:'Live', green:true },
  { icon:'📍', title:'City-Wise Performance', desc:'An AC that works in Shimla fails in Ahmedabad. Geographic performance data so your city informs your decision.', tag:'Live', green:true },
  { icon:'⏳', title:'Longevity Tracker', desc:'We track products 6 months and 1 year post-purchase. Know before you buy whether it lasts.', tag:'Soon', green:false },
  { icon:'🔌', title:'API for Fintechs & Brands', desc:'Banks, BNPLs, and e-commerce platforms can license the PR Score. Your infrastructure, not just a website.', tag:'Soon', green:false },
]
export default function Features() {
  return (
    <section id="features" style={{ padding:'80px 40px', background:'#fff' }}>
      <div style={{ maxWidth:1160, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:48 }}>
          <div style={{ fontSize:12, fontWeight:600, color:'var(--blue)', letterSpacing:'1px', textTransform:'uppercase', marginBottom:10, fontFamily:'JetBrains Mono,monospace' }}>What makes us different</div>
          <h2 style={{ fontSize:'clamp(26px,3.5vw,40px)', fontWeight:800, letterSpacing:'-1px', color:'var(--ink)', lineHeight:1.15 }}>
            Built for India.<br />Impossible to fake.
          </h2>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
          {FEATURES.map(f=>(
            <div key={f.title} style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:10, padding:28, transition:'box-shadow .2s, transform .2s', boxShadow:'var(--shadow-xs)' }}
              onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.boxShadow='var(--shadow-md)';(e.currentTarget as HTMLDivElement).style.transform='translateY(-2px)'}}
              onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.boxShadow='var(--shadow-xs)';(e.currentTarget as HTMLDivElement).style.transform='translateY(0)'}}>
              <div style={{ width:40, height:40, background:'var(--blue-light)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, marginBottom:16 }}>{f.icon}</div>
              <div style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:16, fontWeight:700, color:'var(--ink)', marginBottom:8 }}>{f.title}</div>
              <div style={{ fontSize:13, color:'var(--muted)', lineHeight:1.7, marginBottom:14 }}>{f.desc}</div>
              <span style={{ display:'inline-block', fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:100, background:f.green?'var(--green-light)':'var(--blue-light)', color:f.green?'var(--green)':'var(--blue)', border:`1px solid ${f.green?'#A7F3D0':'var(--blue-mid)'}`, fontFamily:'JetBrains Mono,monospace', letterSpacing:'.5px' }}>
                {f.green?'● ':'○ '}{f.tag}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
