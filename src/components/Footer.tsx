'use client'
// Point 11 — richer footer
import Link from 'next/link'

export default function Footer() {
  return (
    <>
      {/* CTA */}
      <section style={{ padding:'clamp(60px,8vw,100px) clamp(20px,5vw,40px)', background:'#FAFAF9', borderTop:'1px solid rgba(0,0,0,0.06)', textAlign:'center', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at center, rgba(91,79,207,0.05) 0%, transparent 65%)', pointerEvents:'none' }} />
        <div style={{ position:'relative', maxWidth:560, margin:'0 auto' }}>
          <h2 style={{ fontFamily:'Sora,sans-serif', fontSize:'clamp(26px,4.5vw,48px)', fontWeight:800, letterSpacing:'-1.5px', color:'#111110', lineHeight:1.08, marginBottom:16 }}>
            Reviews, made trustworthy.<br/>
            <span style={{ background:'linear-gradient(135deg,#5B4FCF,#8B5CF6)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
              Free, forever.
            </span>
          </h2>
          <p style={{ fontSize:15, color:'#78716C', marginBottom:32, lineHeight:1.6 }}>No ads. No paid placements. No compromises.</p>
          <Link href="/search" style={{ display:'inline-flex', alignItems:'center', gap:8, background:'linear-gradient(135deg,#5B4FCF,#7C6FCD)', color:'#fff', fontWeight:600, fontSize:15, padding:'14px 32px', borderRadius:14, textDecoration:'none', boxShadow:'0 8px 24px rgba(91,79,207,0.28)', transition:'all 0.2s' }}
            onMouseEnter={e=>{e.currentTarget.style.boxShadow='0 12px 32px rgba(91,79,207,0.38)';e.currentTarget.style.transform='translateY(-2px)'}}
            onMouseLeave={e=>{e.currentTarget.style.boxShadow='0 8px 24px rgba(91,79,207,0.28)';e.currentTarget.style.transform='translateY(0)'}}>
            Ask AI Now →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background:'#FFFFFF', borderTop:'1px solid rgba(0,0,0,0.07)', padding:'clamp(32px,4vw,48px) clamp(20px,5vw,40px) clamp(20px,3vw,32px)' }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gap:40, marginBottom:40 }}>

            {/* Brand column */}
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
                <div style={{ width:30, height:30, borderRadius:8, background:'linear-gradient(135deg,#5B4FCF,#7C6FCD)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 10px rgba(91,79,207,0.3)' }}>
                  <span style={{ color:'#fff', fontSize:13, fontWeight:700 }}>PR</span>
                </div>
                <span style={{ fontWeight:700, fontSize:15, color:'#111110' }}>ProductRating<span style={{ color:'#5B4FCF' }}>.in</span></span>
              </div>
              <p style={{ fontSize:13, color:'#78716C', lineHeight:1.75, maxWidth:280, marginBottom:16 }}>
                India&apos;s AI product intelligence platform. One honest score across 8+ platforms. No ads, no paid placements.
              </p>
              {/* Trust note */}
              <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(22,163,74,0.07)', border:'1px solid rgba(22,163,74,0.15)', borderRadius:8, padding:'6px 12px' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <span style={{ fontSize:11, color:'#16A34A', fontFamily:'Geist Mono, monospace', fontWeight:500 }}>No ads · No paid placements</span>
              </div>
            </div>

            {/* Product links */}
            <div>
              <p style={{ fontSize:11, color:'#A8A29E', fontFamily:'Geist Mono, monospace', letterSpacing:'1px', textTransform:'uppercase', marginBottom:16 }}>Product</p>
              {[['Search','/search'],['How it works','/#how'],['About','/about']].map(([l,h]) => (
                <Link key={l} href={h} style={{ display:'block', fontSize:13, color:'#57534E', marginBottom:10, transition:'color .15s' }}
                  onMouseEnter={e=>(e.currentTarget.style.color='#111110')}
                  onMouseLeave={e=>(e.currentTarget.style.color='#57534E')}>{l}</Link>
              ))}
            </div>

            {/* Legal links */}
            <div>
              <p style={{ fontSize:11, color:'#A8A29E', fontFamily:'Geist Mono, monospace', letterSpacing:'1px', textTransform:'uppercase', marginBottom:16 }}>Legal</p>
              {[['Privacy Policy','/privacy'],['Contact','/contact'],['Terms','/privacy']].map(([l,h]) => (
                <Link key={l} href={h} style={{ display:'block', fontSize:13, color:'#57534E', marginBottom:10, transition:'color .15s' }}
                  onMouseEnter={e=>(e.currentTarget.style.color='#111110')}
                  onMouseLeave={e=>(e.currentTarget.style.color='#57534E')}>{l}</Link>
              ))}
            </div>
          </div>

          {/* Bottom bar */}
          <div style={{ borderTop:'1px solid rgba(0,0,0,0.06)', paddingTop:20, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
            <span style={{ fontSize:12, color:'#A8A29E', fontFamily:'Geist Mono, monospace' }}>© 2025 ProductRating.in · 🇮🇳 Built in India</span>
            <span style={{ fontSize:12, color:'#C4B9AD', fontFamily:'Geist Mono, monospace' }}>AI Product Intelligence</span>
          </div>
        </div>
      </footer>
    </>
  )
}
