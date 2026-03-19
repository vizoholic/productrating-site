'use client'

const PLATFORMS = ['Flipkart','Amazon','Nykaa','Meesho','Croma','JioMart','Myntra','Tata Cliq']
const REVIEWS = [
  { text:'"Finally bought the right AC for my Hyderabad flat. The city-specific rating saved me from a 1-star disaster."', name:'Priya S.', city:'Hyderabad', cat:'Home Appliances' },
  { text:'"Was about to buy a phone with 4.4★ on Flipkart. ProductRating showed the real score was 3.6 after filtering fakes."', name:'Arjun M.', city:'Bengaluru', cat:'Smartphones' },
  { text:'"The AI gave me a straight answer. No more reading 200 conflicting reviews to decide on a mixer grinder."', name:'Sunita R.', city:'Lucknow', cat:'Kitchen' },
]

export default function TrustSection() {
  return (
    <section style={{ padding:'80px 40px', background:'#fff', borderTop:'1px solid var(--border)' }}>
      <div style={{ maxWidth:1160, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:48 }}>
          <div style={{ fontSize:12, fontWeight:600, color:'var(--blue)', letterSpacing:'1px', textTransform:'uppercase', marginBottom:10, fontFamily:'JetBrains Mono,monospace' }}>Why trust us</div>
          <h2 style={{ fontSize:'clamp(26px,3.5vw,40px)', fontWeight:800, letterSpacing:'-1px', color:'var(--ink)', lineHeight:1.15 }}>
            Analysing 5M+ reviews<br />across India&apos;s top platforms
          </h2>
        </div>

        {/* Platform chips */}
        <div style={{ display:'flex', flexWrap:'wrap', gap:8, justifyContent:'center', marginBottom:52 }}>
          {PLATFORMS.map(p=>(
            <span key={p} style={{ background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:100, padding:'7px 18px', fontSize:13, fontWeight:600, color:'var(--ink-2)' }}>{p}</span>
          ))}
          <span style={{ background:'var(--blue-light)', border:'1px solid var(--blue-mid)', borderRadius:100, padding:'7px 18px', fontSize:13, fontWeight:600, color:'var(--blue)' }}>+ more</span>
        </div>

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:1, background:'var(--border)', borderRadius:12, overflow:'hidden', marginBottom:52, boxShadow:'var(--shadow-xs)' }}>
          {[
            { n:'5M+', l:'Reviews Analysed', s:'Updated daily' },
            { n:'38%', l:'Fake Reviews Caught', s:'Industry average: 0%' },
            { n:'11', l:'Indian Languages', s:'Hindi, Tamil, Telugu & more' },
            { n:'8', l:'Platforms Tracked', s:'Flipkart, Amazon & more' },
          ].map(s=>(
            <div key={s.l} style={{ background:'#fff', padding:'24px 20px', textAlign:'center' }}>
              <div style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:28, fontWeight:800, color:'var(--ink)', letterSpacing:'-1px' }}>
                {s.n.replace(/[M%+]/g,'')}<span style={{ color:'var(--blue)' }}>{s.n.match(/[M%+]+/)?.[0]}</span>
              </div>
              <div style={{ fontSize:14, fontWeight:600, color:'var(--ink)', marginTop:4 }}>{s.l}</div>
              <div style={{ fontSize:12, color:'var(--subtle)', marginTop:3 }}>{s.s}</div>
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
          {REVIEWS.map(r=>(
            <div key={r.name} style={{ background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:12, padding:24 }}>
              <div style={{ fontSize:20, color:'var(--blue)', fontFamily:'Georgia,serif', lineHeight:1, marginBottom:10 }}>&ldquo;</div>
              <p style={{ fontSize:14, color:'var(--ink-2)', lineHeight:1.7, marginBottom:18 }}>{r.text}</p>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:34, height:34, borderRadius:'50%', background:'var(--blue)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:14, fontFamily:'Plus Jakarta Sans,sans-serif', flexShrink:0 }}>
                  {r.name[0]}
                </div>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:'var(--ink)' }}>{r.name}</div>
                  <div style={{ fontSize:12, color:'var(--subtle)' }}>{r.city} · {r.cat}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
