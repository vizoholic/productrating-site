'use client'
import Link from 'next/link'

export default function Footer() {
  return (
    <>
      {/* CTA — confident, not loud */}
      <section style={{ padding:'clamp(80px,10vw,120px) clamp(20px,5vw,48px)', background:'var(--ink)', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(248,246,241,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(248,246,241,0.015) 1px, transparent 1px)', backgroundSize:'60px 60px', pointerEvents:'none' }} />
        <div style={{ position:'relative', maxWidth:680, margin:'0 auto', textAlign:'center' }}>
          <p style={{ fontSize:11, color:'rgba(248,246,241,0.3)', fontFamily:'var(--font-mono)', letterSpacing:'2px', textTransform:'uppercase', marginBottom:24 }}>Free · No ads · No paid placements</p>
          <h2 style={{ fontFamily:'var(--font-serif)', fontSize:'clamp(30px,5vw,58px)', fontWeight:700, color:'var(--bg)', letterSpacing:'-1.5px', lineHeight:1.08, marginBottom:20 }}>
            Reviews, made<br/><em style={{ fontStyle:'italic', color:'rgba(44,95,46,0.9)' }}>trustworthy.</em>
          </h2>
          <p style={{ fontSize:15, color:'rgba(248,246,241,0.5)', marginBottom:40, lineHeight:1.8, letterSpacing:'0.02em', fontWeight:300 }}>
            One honest score across India&apos;s top platforms. Always free.
          </p>
          <Link href="/search"
            style={{ display:'inline-flex', alignItems:'center', gap:10, background:'var(--bg)', color:'var(--ink)', fontFamily:'var(--font-sans)', fontWeight:500, fontSize:14, letterSpacing:'0.03em', padding:'15px 36px', borderRadius:'var(--radius-xl)', textDecoration:'none', transition:'all 0.3s cubic-bezier(0.22,1,0.36,1)' }}
            onMouseEnter={e=>{e.currentTarget.style.background='var(--accent)';e.currentTarget.style.color='var(--bg)';e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 12px 32px rgba(44,95,46,0.35)'}}
            onMouseLeave={e=>{e.currentTarget.style.background='var(--bg)';e.currentTarget.style.color='var(--ink)';e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='none'}}>
            Ask AI Now
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background:'var(--ink)', borderTop:'1px solid rgba(248,246,241,0.08)', padding:'clamp(40px,5vw,60px) clamp(20px,5vw,48px) clamp(24px,3vw,36px)' }}>
        <div style={{ maxWidth:1140, margin:'0 auto' }}>
          <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gap:48, marginBottom:48 }}>

            <div>
              <div style={{ display:'flex', alignItems:'center', gap:11, marginBottom:16 }}>
                <div style={{ width:32, height:32, borderRadius:9, background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <span style={{ color:'var(--ink)', fontSize:12, fontWeight:700, fontFamily:'var(--font-serif)' }}>PR</span>
                </div>
                <span style={{ fontFamily:'var(--font-serif)', fontWeight:600, fontSize:16, color:'var(--bg)' }}>
                  ProductRating<span style={{ color:'rgba(44,95,46,0.8)' }}>.in</span>
                </span>
              </div>
              <p style={{ fontSize:13, color:'rgba(248,246,241,0.4)', lineHeight:1.85, maxWidth:280, letterSpacing:'0.02em', fontWeight:300, marginBottom:20 }}>
                India&apos;s AI product intelligence platform. One honest score across 8+ platforms. No ads, no paid placements.
              </p>
              <div style={{ display:'inline-flex', alignItems:'center', gap:7, background:'rgba(44,95,46,0.15)', border:'1px solid rgba(44,95,46,0.25)', borderRadius:'var(--radius-sm)', padding:'6px 14px' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(44,95,46,0.9)" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <span style={{ fontSize:11, color:'rgba(44,95,46,0.9)', fontFamily:'var(--font-mono)', letterSpacing:'0.5px' }}>No ads · No paid placements</span>
              </div>
            </div>

            <div>
              <p style={{ fontSize:10, color:'rgba(248,246,241,0.25)', fontFamily:'var(--font-mono)', letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:18 }}>Product</p>
              {[['Search','/search'],['How it works','/#how'],['About','/about']].map(([l,h]) => (
                <Link key={l} href={h} style={{ display:'block', fontSize:13, color:'rgba(248,246,241,0.45)', marginBottom:12, transition:'color .2s', letterSpacing:'0.02em', fontWeight:300 }}
                  onMouseEnter={e=>(e.currentTarget.style.color='rgba(248,246,241,0.9)')}
                  onMouseLeave={e=>(e.currentTarget.style.color='rgba(248,246,241,0.45)')}>
                  {l}
                </Link>
              ))}
            </div>

            <div>
              <p style={{ fontSize:10, color:'rgba(248,246,241,0.25)', fontFamily:'var(--font-mono)', letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:18 }}>Legal</p>
              {[['Privacy Policy','/privacy'],['Contact','/contact'],['About','/about']].map(([l,h]) => (
                <Link key={l} href={h} style={{ display:'block', fontSize:13, color:'rgba(248,246,241,0.45)', marginBottom:12, transition:'color .2s', letterSpacing:'0.02em', fontWeight:300 }}
                  onMouseEnter={e=>(e.currentTarget.style.color='rgba(248,246,241,0.9)')}
                  onMouseLeave={e=>(e.currentTarget.style.color='rgba(248,246,241,0.45)')}>
                  {l}
                </Link>
              ))}
            </div>
          </div>

          <div style={{ borderTop:'1px solid rgba(248,246,241,0.07)', paddingTop:24, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
            <span style={{ fontSize:12, color:'rgba(248,246,241,0.25)', fontFamily:'var(--font-mono)', letterSpacing:'0.3px' }}>© 2025 ProductRating.in · 🇮🇳 Built in India</span>
            <span style={{ fontSize:12, color:'rgba(248,246,241,0.2)', fontFamily:'var(--font-mono)', letterSpacing:'0.3px' }}>AI Product Intelligence</span>
          </div>
        </div>
      </footer>
    </>
  )
}
