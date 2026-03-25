// Point 9 — sample product result mockup on homepage
export default function MockResult() {
  return (
    <section style={{ padding:'0 clamp(20px,5vw,40px) clamp(48px,6vw,80px)', background:'#FAFAF9' }}>
      <div style={{ maxWidth:860, margin:'0 auto' }}>

        <div style={{ textAlign:'center', marginBottom:32 }}>
          <p style={{ fontSize:12, color:'#A8A29E', fontFamily:'Geist Mono, monospace', letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:10 }}>Sample Result</p>
          <h2 style={{ fontSize:'clamp(20px,3vw,28px)', fontWeight:800, color:'#111110', letterSpacing:'-1px' }}>This is what your answer looks like</h2>
        </div>

        {/* Mock card */}
        <div style={{ background:'#FFFFFF', border:'1.5px solid rgba(91,79,207,0.2)', borderRadius:20, overflow:'hidden', boxShadow:'0 8px 40px rgba(91,79,207,0.1), 0 2px 8px rgba(0,0,0,0.05)', maxWidth:600, margin:'0 auto' }}>

          {/* Rank bar */}
          <div style={{ background:'rgba(91,79,207,0.07)', padding:'10px 24px', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid rgba(0,0,0,0.05)' }}>
            <span style={{ fontSize:11, fontWeight:700, color:'#5B4FCF', fontFamily:'Geist Mono, monospace', letterSpacing:'1px', textTransform:'uppercase' }}>#1 Best Pick</span>
            <span style={{ fontSize:18 }}>🥇</span>
          </div>

          <div style={{ padding:'24px 24px 0' }}>
            <div style={{ display:'flex', alignItems:'flex-start', gap:16, marginBottom:20 }}>
              {/* Product image placeholder */}
              <div style={{ width:72, height:72, borderRadius:12, background:'linear-gradient(135deg, #F0EEF8, #E8E5F5)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, border:'1px solid rgba(91,79,207,0.1)' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7C6FCD" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
              </div>
              <div style={{ flex:1 }}>
                <span style={{ display:'inline-block', fontSize:11, fontWeight:600, color:'#16A34A', background:'rgba(22,163,74,0.08)', border:'1px solid rgba(22,163,74,0.18)', borderRadius:100, padding:'2px 10px', marginBottom:8, fontFamily:'Geist Mono, monospace' }}>● Best for Chennai</span>
                <h3 style={{ fontWeight:700, fontSize:17, color:'#111110', lineHeight:1.3, marginBottom:6 }}>Samsung 1.5 Ton 5 Star Inverter AC</h3>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ fontSize:24, fontWeight:800, color:'#5B4FCF', fontFamily:'Sora,sans-serif', letterSpacing:'-1px' }}>₹38,990</span>
                  <span style={{ fontSize:12, color:'#78716C', background:'#F5F4F2', borderRadius:6, padding:'2px 10px', border:'1px solid rgba(0,0,0,0.07)' }}>Amazon</span>
                </div>
              </div>
            </div>

            {/* Score comparison */}
            <div style={{ background:'#F9F8F7', borderRadius:12, padding:'16px', marginBottom:16, border:'1px solid rgba(0,0,0,0.05)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                <div>
                  <div style={{ fontSize:10, color:'#A8A29E', fontFamily:'Geist Mono, monospace', marginBottom:4 }}>PR AI SCORE · 2.1k reviews</div>
                  <div style={{ display:'flex', alignItems:'baseline', gap:3 }}>
                    <span style={{ fontSize:38, fontWeight:800, color:'#16A34A', lineHeight:1, fontFamily:'Sora,sans-serif', letterSpacing:'-2px' }}>4.3</span>
                    <span style={{ fontSize:13, color:'#A8A29E' }}>/5</span>
                  </div>
                </div>
                <div style={{ display:'flex', gap:2 }}>
                  {[1,2,3,4,5].map(n => <svg key={n} width="14" height="14" viewBox="0 0 24 24" fill={n<=4?'#16A34A':'#E7E5E4'}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>)}
                </div>
              </div>
              <div style={{ height:5, background:'#EEECEA', borderRadius:3, overflow:'hidden' }}>
                <div style={{ width:'86%', height:'100%', background:'linear-gradient(90deg,#16A34A,#22C55E)', borderRadius:3 }} />
              </div>
              <div style={{ marginTop:10, display:'flex', gap:8, padding:'8px 12px', background:'#FFFFFF', borderRadius:8, border:'1px solid rgba(0,0,0,0.06)' }}>
                <div style={{ flex:1, fontSize:12 }}><span style={{ color:'#A8A29E' }}>Amazon shows </span><span style={{ color:'#DC2626', fontWeight:600 }}>4.7 ⭐</span></div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D6D3D1" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                <div style={{ flex:1, fontSize:12 }}><span style={{ color:'#A8A29E' }}>Real score </span><span style={{ color:'#16A34A', fontWeight:600 }}>4.3 ⭐</span></div>
              </div>
            </div>

            {/* Why this wins */}
            <div style={{ marginBottom:16, padding:'12px 16px', background:'rgba(91,79,207,0.04)', borderRadius:10, borderLeft:'3px solid rgba(91,79,207,0.4)' }}>
              <div style={{ fontSize:10, color:'#5B4FCF', fontFamily:'Geist Mono, monospace', letterSpacing:'1px', marginBottom:4 }}>WHY THIS WINS</div>
              <p style={{ fontSize:13, color:'#57534E', lineHeight:1.65 }}>Handles Chennai&apos;s high humidity well. Rated highly for energy savings in summer months. Strong after-sales network in Tamil Nadu.</p>
            </div>

            {/* Pros / Cons */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:20 }}>
              <div style={{ background:'rgba(22,163,74,0.05)', border:'1px solid rgba(22,163,74,0.13)', borderRadius:10, padding:'10px 14px' }}>
                <div style={{ fontSize:10, color:'#16A34A', fontFamily:'Geist Mono, monospace', marginBottom:6 }}>PROS</div>
                {['5-star energy rating','Humidity-resistant coils'].map((p,i) => <div key={i} style={{ fontSize:12, color:'#374151', display:'flex', gap:6, marginBottom:i<1?4:0 }}><span style={{color:'#16A34A'}}>+</span>{p}</div>)}
              </div>
              <div style={{ background:'rgba(220,38,38,0.04)', border:'1px solid rgba(220,38,38,0.1)', borderRadius:10, padding:'10px 14px' }}>
                <div style={{ fontSize:10, color:'#DC2626', fontFamily:'Geist Mono, monospace', marginBottom:6 }}>CONS</div>
                <div style={{ fontSize:12, color:'#374151', display:'flex', gap:6 }}><span style={{color:'#DC2626'}}>−</span>Slightly noisy at max speed</div>
              </div>
            </div>
          </div>

          <a href="/search?q=best+ac+for+chennai" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'14px 24px', background:'linear-gradient(135deg,#5B4FCF,#7C6FCD)', color:'#fff', fontSize:14, fontWeight:600, textDecoration:'none' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            Search on Amazon
          </a>
        </div>

        <p style={{ textAlign:'center', marginTop:16, fontSize:12, color:'#C4B9AD', fontFamily:'Geist Mono, monospace' }}>
          Search anything above to get your personalised result
        </p>
      </div>
    </section>
  )
}
