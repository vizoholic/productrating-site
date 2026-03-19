'use client'
const PLATFORMS = ['Flipkart','Amazon','Nykaa','Meesho','Croma','JioMart','Myntra','Tata Cliq']
const REVIEWS = [
  { text:'"Finally bought the right AC for my Hyderabad flat. The city-specific rating saved me from a 1-star disaster."', name:'Priya S.', city:'Hyderabad', cat:'Home Appliances' },
  { text:'"Was about to buy a phone with 4.4★ on Flipkart. ProductRating showed the real score was 3.6 after filtering fakes."', name:'Arjun M.', city:'Bengaluru', cat:'Smartphones' },
  { text:'"The AI gave me a straight answer. No more reading 200 conflicting reviews to decide on a mixer grinder."', name:'Sunita R.', city:'Lucknow', cat:'Kitchen' },
]
export default function TrustSection() {
  return (
    <section style={{ padding:'clamp(48px,8vw,80px) clamp(16px,5vw,40px)', background:'#fff', borderTop:'1px solid #E5E7EB' }}>
      <div style={{ maxWidth:1160, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:40 }}>
          <div style={{ fontSize:12, fontWeight:600, color:'#2563EB', letterSpacing:'1px', textTransform:'uppercase', marginBottom:10, fontFamily:'JetBrains Mono,monospace' }}>Why trust us</div>
          <h2 style={{ fontSize:'clamp(24px,3.5vw,40px)', fontWeight:800, letterSpacing:'-1px', color:'#111827', lineHeight:1.15 }}>Analysing 5M+ reviews<br />across India&apos;s top platforms</h2>
        </div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:8, justifyContent:'center', marginBottom:44 }}>
          {PLATFORMS.map(p=><span key={p} style={{ background:'#F9FAFB', border:'1px solid #E5E7EB', borderRadius:100, padding:'7px 18px', fontSize:13, fontWeight:600, color:'#374151' }}>{p}</span>)}
          <span style={{ background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:100, padding:'7px 18px', fontSize:13, fontWeight:600, color:'#2563EB' }}>+ more</span>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,260px),1fr))', gap:1, background:'#E5E7EB', borderRadius:12, overflow:'hidden', marginBottom:44 }}>
          {[['5M+','Reviews Analysed','Updated daily'],['38%','Fake Reviews Caught','Industry avg: 0%'],['22','Indian Languages','Saaras v3 STT'],['8','Platforms Tracked','Flipkart, Amazon & more']].map(([n,l,s])=>(
            <div key={l} style={{ background:'#fff', padding:'24px 20px', textAlign:'center' }}>
              <div style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:28, fontWeight:800, color:'#111827', letterSpacing:'-1px' }}>
                {n.replace(/[M%+]/g,'')}<span style={{ color:'#2563EB' }}>{n.match(/[M%+]+/)?.[0]}</span>
              </div>
              <div style={{ fontSize:14, fontWeight:600, color:'#111827', marginTop:4 }}>{l}</div>
              <div style={{ fontSize:12, color:'#9CA3AF', marginTop:3 }}>{s}</div>
            </div>
          ))}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,260px),1fr))', gap:14 }}>
          {REVIEWS.map(r=>(
            <div key={r.name} style={{ background:'#F9FAFB', border:'1px solid #E5E7EB', borderRadius:12, padding:24 }}>
              <div style={{ fontSize:20, color:'#2563EB', fontFamily:'Georgia,serif', lineHeight:1, marginBottom:10 }}>&ldquo;</div>
              <p style={{ fontSize:14, color:'#374151', lineHeight:1.7, marginBottom:18 }}>{r.text}</p>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:34, height:34, borderRadius:'50%', background:'#2563EB', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:14, flexShrink:0 }}>{r.name[0]}</div>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:'#111827' }}>{r.name}</div>
                  <div style={{ fontSize:12, color:'#9CA3AF' }}>{r.city} · {r.cat}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
