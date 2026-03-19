'use client'
import Link from 'next/link'
export default function Footer() {
  return (
    <>
      <section style={{ padding:'clamp(48px,8vw,80px) clamp(16px,5vw,40px)', background:'#2563EB', textAlign:'center', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize:'24px 24px', pointerEvents:'none' }} />
        <h2 style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:'clamp(24px,4vw,48px)', fontWeight:800, letterSpacing:'-1.5px', color:'#fff', lineHeight:1.1, maxWidth:580, margin:'0 auto 16px', position:'relative' }}>
          Find the best product<br />in 10 seconds. Free.
        </h2>
        <p style={{ fontSize:15, color:'rgba(255,255,255,0.75)', maxWidth:380, margin:'0 auto 28px', lineHeight:1.6, position:'relative' }}>No ads. No paid placements. Honest AI-powered product intelligence.</p>
        <div style={{ display:'flex', gap:12, justifyContent:'center', position:'relative', flexWrap:'wrap' }}>
          <Link href="/search" style={{ background:'#fff', color:'#2563EB', fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:700, fontSize:15, padding:'12px 28px', borderRadius:10, transition:'all .15s', boxShadow:'0 4px 16px rgba(0,0,0,0.15)', whiteSpace:'nowrap' }}
            onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-1px)';e.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,0.2)'}}
            onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,0.15)'}}>
            Ask AI Now →
          </Link>
          <Link href="/categories/smartphones-electronics" style={{ background:'transparent', color:'rgba(255,255,255,0.9)', fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:600, fontSize:15, padding:'12px 28px', borderRadius:10, border:'1.5px solid rgba(255,255,255,0.35)', transition:'all .15s', whiteSpace:'nowrap' }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.8)';e.currentTarget.style.color='#fff'}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.35)';e.currentTarget.style.color='rgba(255,255,255,0.9)'}}>
            Browse Categories
          </Link>
        </div>
      </section>
      <footer style={{ padding:'20px clamp(16px,5vw,40px)', borderTop:'1px solid #E5E7EB', background:'#fff', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
        <Link href="/" style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:700, fontSize:14, color:'#111827', whiteSpace:'nowrap' }}>
          ProductRating<span style={{ color:'#2563EB' }}>.in</span>
        </Link>
        <span style={{ fontSize:12, color:'#9CA3AF', fontFamily:'JetBrains Mono,monospace' }}>© 2025 · Made with ❤️ in India</span>
        <div style={{ display:'flex', gap:16 }}>
          {['About','Privacy','Contact'].map(l=>(
            <Link key={l} href={`/${l.toLowerCase()}`} style={{ fontSize:13, color:'#9CA3AF', fontWeight:500, transition:'color .15s' }}
              onMouseEnter={e=>(e.currentTarget.style.color='#111827')}
              onMouseLeave={e=>(e.currentTarget.style.color='#9CA3AF')}>
              {l}
            </Link>
          ))}
        </div>
      </footer>
    </>
  )
}
