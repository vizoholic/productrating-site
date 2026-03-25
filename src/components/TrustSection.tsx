'use client'

const PLATFORMS = [
  { name:'Amazon.in', icon:'📦', reviews:'3.2M+', color:'#FF9900' },
  { name:'Flipkart',  icon:'🛍️', reviews:'1.8M+', color:'#2874F0' },
  { name:'Nykaa',     icon:'💄', reviews:'0.6M+', color:'#FC2779' },
  { name:'Croma',     icon:'🔌', reviews:'0.3M+', color:'#6DB33F' },
  { name:'Meesho',    icon:'🌸', reviews:'0.5M+', color:'#9E3D8C' },
  { name:'JioMart',   icon:'🛒', reviews:'0.2M+', color:'#0070E0' },
  { name:'Myntra',    icon:'👗', reviews:'0.8M+', color:'#FF3F6C' },
  { name:'Tata Cliq', icon:'⭐', reviews:'0.2M+', color:'#2D3092' },
]

const HOW = [
  { step:'01', title:'Aggregate', desc:'We pull every review from 8+ Indian platforms in real time, every day.' },
  { step:'02', title:'Detect',    desc:'AI flags bot reviews, paid promotions, and incentivised ratings.' },
  { step:'03', title:'Adjust',    desc:'PR Score = genuine buyer experience, weighted by recency and credibility.' },
  { step:'04', title:'Answer',    desc:'One clear recommendation in your language, personalised for your city.' },
]

export default function TrustSection() {
  return (
    <section style={{ padding:'clamp(64px,8vw,100px) clamp(16px,5vw,40px)', background:'#FAFAF9', position:'relative' }}>
      <div style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', width:'60%', height:'1px', background:'linear-gradient(90deg, transparent, rgba(91,79,207,0.2), transparent)' }} />

      <div style={{ maxWidth:1100, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:56 }}>
          <p style={{ fontSize:11, color:'#5B4FCF', fontFamily:'Geist Mono, monospace', letterSpacing:'2px', textTransform:'uppercase', marginBottom:12 }}>Trust Infrastructure</p>
          <h2 style={{ fontSize:'clamp(26px,4vw,44px)', fontWeight:800, color:'#111110', letterSpacing:'-1.5px', lineHeight:1.1, marginBottom:16 }}>
            Every review. Every platform.<br/>One honest score.
          </h2>
          <p style={{ fontSize:15, color:'#78716C', maxWidth:420, margin:'0 auto', lineHeight:1.7 }}>
            68% of Indian product reviews are fake. We remove them.
          </p>
        </div>

        {/* Platform cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px,1fr))', gap:12, marginBottom:60 }}>
          {PLATFORMS.map(p => (
            <div key={p.name}
              style={{ background:'#FFFFFF', border:'1.5px solid rgba(0,0,0,0.07)', borderRadius:14, padding:'16px 20px', display:'flex', alignItems:'center', gap:14, transition:'all 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.04)' }}
              onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.boxShadow='0 8px 24px rgba(0,0,0,0.08)';(e.currentTarget as HTMLDivElement).style.borderColor='rgba(0,0,0,0.12)';(e.currentTarget as HTMLDivElement).style.transform='translateY(-2px)'}}
              onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.boxShadow='0 1px 3px rgba(0,0,0,0.04)';(e.currentTarget as HTMLDivElement).style.borderColor='rgba(0,0,0,0.07)';(e.currentTarget as HTMLDivElement).style.transform='translateY(0)'}}>
              <div style={{ width:38, height:38, background:'#F5F4F2', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>{p.icon}</div>
              <div>
                <div style={{ fontSize:14, fontWeight:600, color:'#111110' }}>{p.name}</div>
                <div style={{ fontSize:12, color:'#A8A29E', fontFamily:'Geist Mono, monospace', marginTop:2 }}>{p.reviews} reviews</div>
              </div>
              <div style={{ marginLeft:'auto', width:7, height:7, borderRadius:'50%', background:p.color, boxShadow:`0 0 8px ${p.color}66`, flexShrink:0 }} />
            </div>
          ))}
        </div>

        {/* How it works */}
        <div style={{ background:'#FFFFFF', border:'1.5px solid rgba(0,0,0,0.07)', borderRadius:20, overflow:'hidden', boxShadow:'0 4px 16px rgba(0,0,0,0.05)' }}>
          <div style={{ padding:'28px 32px', borderBottom:'1px solid rgba(0,0,0,0.06)' }}>
            <p style={{ fontSize:11, color:'#5B4FCF', fontFamily:'Geist Mono, monospace', letterSpacing:'2px', textTransform:'uppercase' }}>How It Works</p>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px,1fr))' }}>
            {HOW.map((h,i) => (
              <div key={h.step} style={{ padding:'28px 28px', borderRight: i<HOW.length-1?'1px solid rgba(0,0,0,0.05)':'none', borderBottom:'none', position:'relative' }}>
                <div style={{ fontSize:36, fontWeight:800, color:'rgba(91,79,207,0.1)', fontFamily:'Sora,sans-serif', letterSpacing:'-2px', lineHeight:1, marginBottom:14 }}>{h.step}</div>
                <div style={{ fontSize:15, fontWeight:700, color:'#111110', marginBottom:8 }}>{h.title}</div>
                <div style={{ fontSize:13, color:'#78716C', lineHeight:1.7 }}>{h.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
