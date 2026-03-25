'use client'
import Link from 'next/link'
export default function Footer() {
  return (
    <>
      <section style={{ padding:'clamp(60px,8vw,100px) clamp(16px,5vw,40px)', background:'#FAFAF9', textAlign:'center', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at center top, rgba(91,79,207,0.06) 0%, transparent 60%)', pointerEvents:'none' }} />
        <div style={{ position:'relative', maxWidth:600, margin:'0 auto' }}>
          <h2 style={{ fontFamily:'Sora,sans-serif', fontSize:'clamp(28px,5vw,52px)', fontWeight:800, letterSpacing:'-2px', color:'#111110', lineHeight:1.05, marginBottom:16 }}>
            Find the best product.<br/>
            <span style={{ background:'linear-gradient(135deg, #5B4FCF, #A0782A)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>Right now. Free.</span>
          </h2>
          <p style={{ fontSize:15, color:'#78716C', marginBottom:32, lineHeight:1.6 }}>No ads. No paid placements. Honest AI for India.</p>
          <Link href="/search" style={{ display:'inline-flex', alignItems:'center', gap:8, background:'linear-gradient(135deg, #5B4FCF, #7C6FCD)', color:'#fff', fontWeight:600, fontSize:15, padding:'14px 32px', borderRadius:12, textDecoration:'none', boxShadow:'0 8px 24px rgba(91,79,207,0.3)', transition:'all 0.2s' }}
            onMouseEnter={e=>{e.currentTarget.style.boxShadow='0 12px 32px rgba(91,79,207,0.4)';e.currentTarget.style.transform='translateY(-2px)'}}
            onMouseLeave={e=>{e.currentTarget.style.boxShadow='0 8px 24px rgba(91,79,207,0.3)';e.currentTarget.style.transform='translateY(0)'}}>
            Ask AI Now →
          </Link>
        </div>
      </section>
      <footer style={{ borderTop:'1px solid rgba(0,0,0,0.07)', padding:'20px clamp(16px,5vw,40px)', background:'#FAFAF9', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
        <span style={{ fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:14, color:'#111110' }}>
          ProductRating<span style={{ color:'#5B4FCF' }}>.in</span>
        </span>
        <span style={{ fontSize:12, color:'#C4B9AD', fontFamily:'Geist Mono, monospace' }}>© 2025 · 🇮🇳 Made in India</span>
        <div style={{ display:'flex', gap:16 }}>
          {['about','privacy','contact'].map(l => (
            <Link key={l} href={`/${l}`} style={{ fontSize:12, color:'#A8A29E', fontFamily:'Geist Mono, monospace', textTransform:'uppercase', letterSpacing:'0.5px', transition:'color 0.15s' }}
              onMouseEnter={e=>(e.currentTarget.style.color='#57534E')}
              onMouseLeave={e=>(e.currentTarget.style.color='#A8A29E')}>
              {l}
            </Link>
          ))}
        </div>
      </footer>
    </>
  )
}
