'use client'
import Link from 'next/link'

export default function Footer() {
  return (
    <>
      <section style={{ padding:'80px 40px', background:'var(--blue)', textAlign:'center', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize:'24px 24px', pointerEvents:'none' }} />
        <h2 style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:'clamp(28px,4vw,52px)', fontWeight:800, letterSpacing:'-1.5px', color:'#fff', lineHeight:1.1, maxWidth:620, margin:'0 auto 16px', position:'relative' }}>
          Find the best product<br />in 10 seconds. Free.
        </h2>
        <p style={{ fontSize:16, color:'rgba(255,255,255,0.75)', maxWidth:400, margin:'0 auto 32px', lineHeight:1.6, position:'relative' }}>
          No ads. No paid placements. Just honest AI-powered product intelligence for Indian buyers.
        </p>
        <div style={{ display:'flex', gap:12, justifyContent:'center', position:'relative' }}>
          <Link href="/search" style={{ background:'#fff', color:'var(--blue)', fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:700, fontSize:15, padding:'13px 28px', borderRadius:10, transition:'all .15s', boxShadow:'0 4px 16px rgba(0,0,0,0.15)' }}
            onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-1px)';e.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,0.2)'}}
            onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,0.15)'}}>
            Ask AI Now →
          </Link>
          <Link href="/categories/smartphones-electronics" style={{ background:'transparent', color:'rgba(255,255,255,0.9)', fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:600, fontSize:15, padding:'13px 28px', borderRadius:10, border:'1.5px solid rgba(255,255,255,0.35)', transition:'all .15s' }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.8)';e.currentTarget.style.color='#fff'}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.35)';e.currentTarget.style.color='rgba(255,255,255,0.9)'}}>
            Browse Categories
          </Link>
        </div>
      </section>
      <footer style={{ padding:'24px 40px', borderTop:'1px solid var(--border)', background:'#fff', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <Link href="/" style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:700, fontSize:14, color:'var(--ink)' }}>
          ProductRating<span style={{ color:'var(--blue)' }}>.in</span>
        </Link>
        <span style={{ fontSize:12, color:'var(--subtle)', fontFamily:'JetBrains Mono,monospace' }}>© 2025 · Made with ❤️ in India</span>
        <div style={{ display:'flex', gap:20 }}>
          {['About','Privacy','Contact'].map(l=>(
            <Link key={l} href={`/${l.toLowerCase()}`} style={{ fontSize:13, color:'var(--subtle)', fontWeight:500, transition:'color .15s' }}
              onMouseEnter={e=>(e.currentTarget.style.color='var(--ink)')}
              onMouseLeave={e=>(e.currentTarget.style.color='var(--subtle)')}>
              {l}
            </Link>
          ))}
        </div>
      </footer>
    </>
  )
}
