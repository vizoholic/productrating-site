'use client'

const PLATFORMS = ['Flipkart','Amazon','Nykaa','Meesho','Croma','JioMart','Myntra','Tata Cliq']

const TESTIMONIALS = [
  { text: "Finally bought the right AC for my Hyderabad flat. The city-specific rating saved me from a 1-star disaster.", name: 'Priya S.', city: 'Hyderabad', category: 'Home Appliances' },
  { text: "I was about to buy a phone with 4.4★ on Flipkart. ProductRating showed it was 3.6 after removing fake reviews.", name: 'Arjun M.', city: 'Bengaluru', category: 'Smartphones' },
  { text: "The AI gave me a straight answer in Hindi. No more reading 200 conflicting reviews.", name: 'Sunita R.', city: 'Lucknow', category: 'Kitchen' },
]

export default function TrustSection() {
  return (
    <section style={{ padding:'96px 48px', background:'#fff', borderTop:'1px solid #E5E7EB' }}>
      <div style={{ maxWidth:1200, margin:'0 auto' }}>

        {/* Headline */}
        <div style={{ textAlign:'center', marginBottom:56 }}>
          <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:11, letterSpacing:3, textTransform:'uppercase', color:'#FF6B00', marginBottom:12 }}>Why trust us</div>
          <h2 style={{ fontFamily:'Syne,sans-serif', fontSize:'clamp(28px,4vw,48px)', fontWeight:800, letterSpacing:'-1.5px', color:'#111218', lineHeight:1.1 }}>
            Analysing 5M+ reviews<br />across India&apos;s top platforms
          </h2>
        </div>

        {/* Platform logos as chips */}
        <div style={{ display:'flex', flexWrap:'wrap', gap:10, justifyContent:'center', marginBottom:64 }}>
          {PLATFORMS.map(p => (
            <div key={p} style={{ background:'#F7F8FA', border:'1px solid #E5E7EB', borderRadius:100, padding:'8px 20px', fontSize:13, fontWeight:600, color:'#374151' }}>{p}</div>
          ))}
          <div style={{ background:'#FFF7F0', border:'1px solid #FFD4B3', borderRadius:100, padding:'8px 20px', fontSize:13, fontWeight:600, color:'#FF6B00' }}>+ more coming</div>
        </div>

        {/* Trust numbers */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:1, background:'#E5E7EB', borderRadius:16, overflow:'hidden', marginBottom:64, boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
          {[
            { n:'5M+', label:'Reviews Analysed', sub:'Updated daily' },
            { n:'38%', label:'Fake Reviews Caught', sub:'Industry average: 0%' },
            { n:'11', label:'Indian Languages', sub:'Hindi, Tamil, Telugu & more' },
            { n:'8', label:'Platforms Tracked', sub:'Flipkart, Amazon & more' },
          ].map(s => (
            <div key={s.label} style={{ background:'#fff', padding:'28px 24px', textAlign:'center' }}>
              <div style={{ fontFamily:'Syne,sans-serif', fontSize:32, fontWeight:800, color:'#111218', letterSpacing:'-1px' }}>
                {s.n.replace(/[M%+]/g,'')}<span style={{ color:'#FF6B00' }}>{s.n.match(/[M%+]+/)?.[0]}</span>
              </div>
              <div style={{ fontSize:14, fontWeight:700, color:'#111218', marginTop:4 }}>{s.label}</div>
              <div style={{ fontSize:11, color:'#9CA3AF', marginTop:4 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20 }}>
          {TESTIMONIALS.map(t => (
            <div key={t.name} style={{ background:'#F7F8FA', border:'1px solid #E5E7EB', borderRadius:16, padding:28 }}>
              <div style={{ fontSize:24, color:'#FF6B00', fontFamily:'Georgia,serif', lineHeight:1, marginBottom:12 }}>&ldquo;</div>
              <p style={{ fontSize:14, color:'#374151', lineHeight:1.75, marginBottom:20 }}>{t.text}</p>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:36, height:36, borderRadius:'50%', background:'#FF6B00', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:14, fontFamily:'Syne,sans-serif', flexShrink:0 }}>
                  {t.name[0]}
                </div>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:'#111218' }}>{t.name}</div>
                  <div style={{ fontSize:11, color:'#9CA3AF' }}>{t.city} · {t.category}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
