'use client'
const FEATURES = [
  { icon:'🇮🇳', title:'India-First Intelligence', desc:'Calibrated for Indian climates, income brackets, power fluctuations, and local service quality.', tag:'Live', green:true },
  { icon:'🕵️', title:'Fake Review Detection', desc:'ML flags incentivised, bot-generated, and seller-paid reviews. Only real Indian buyers speak.', tag:'Live', green:true },
  { icon:'🗣️', title:'22 Language Support', desc:'Saaras v3 STT supports all 22 scheduled Indian languages — voice search works in all of them.', tag:'Live', green:true },
  { icon:'📍', title:'City-Wise Performance', desc:'An AC that works in Shimla fails in Ahmedabad. Geographic data informs every recommendation.', tag:'Live', green:true },
  { icon:'⏳', title:'Longevity Tracker', desc:'We track products 6 months and 1 year post-purchase. Know before you buy whether it lasts.', tag:'Soon', green:false },
  { icon:'🔌', title:'API for Fintechs', desc:'Banks and BNPLs can license the PR Score API. Your infrastructure, not just a website.', tag:'Soon', green:false },
]
export default function Features() {
  return (
    <section id="features" style={{ padding:'clamp(48px,8vw,80px) clamp(16px,5vw,40px)', background:'#fff' }}>
      <div style={{ maxWidth:1160, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:40 }}>
          <div style={{ fontSize:12, fontWeight:600, color:'#2563EB', letterSpacing:'1px', textTransform:'uppercase', marginBottom:10, fontFamily:'JetBrains Mono,monospace' }}>What makes us different</div>
          <h2 style={{ fontSize:'clamp(24px,3.5vw,40px)', fontWeight:800, letterSpacing:'-1px', color:'#111827', lineHeight:1.15 }}>Built for India.<br />Impossible to fake.</h2>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:16 }}>
          {FEATURES.map(f=>(
            <div key={f.title} style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:10, padding:24, transition:'box-shadow .2s, transform .2s', boxShadow:'0 1px 2px rgba(0,0,0,0.05)' }}
              onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.boxShadow='0 4px 16px rgba(0,0,0,0.08)';(e.currentTarget as HTMLDivElement).style.transform='translateY(-2px)'}}
              onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.boxShadow='0 1px 2px rgba(0,0,0,0.05)';(e.currentTarget as HTMLDivElement).style.transform='translateY(0)'}}>
              <div style={{ width:40, height:40, background:'#EFF6FF', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, marginBottom:14 }}>{f.icon}</div>
              <div style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:16, fontWeight:700, color:'#111827', marginBottom:6 }}>{f.title}</div>
              <div style={{ fontSize:13, color:'#6B7280', lineHeight:1.7, marginBottom:12 }}>{f.desc}</div>
              <span style={{ display:'inline-block', fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:100, background:f.green?'#ECFDF5':'#EFF6FF', color:f.green?'#10B981':'#2563EB', border:`1px solid ${f.green?'#A7F3D0':'#BFDBFE'}`, fontFamily:'JetBrains Mono,monospace' }}>
                {f.green?'●':'○'} {f.tag}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
