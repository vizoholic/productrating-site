'use client'
import Link from 'next/link'

export default function Footer() {
  return (
    <>
      {/* CTA */}
      <section style={{ textAlign:'center', padding:'100px 48px', background:'var(--saffron)', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, background:'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.04\'%3E%3Ccircle cx=\'30\' cy=\'30\' r=\'2\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")', pointerEvents:'none' }} />
        <h2 style={{ fontFamily:'Syne,sans-serif', fontSize:'clamp(32px,5vw,60px)', fontWeight:800, letterSpacing:'-2px', lineHeight:1.05, maxWidth:680, margin:'0 auto 20px', color:'#fff', position:'relative' }}>
          Stop guessing.<br />Start buying smarter.
        </h2>
        <p style={{ fontSize:17, color:'rgba(255,255,255,0.8)', maxWidth:420, margin:'0 auto 36px', lineHeight:1.7, position:'relative' }}>
          Join thousands of Indian buyers making better decisions with AI-powered product intelligence.
        </p>
        <div style={{ display:'flex', gap:14, justifyContent:'center', position:'relative' }}>
          <Link href="/search" style={{ background:'#fff', color:'var(--saffron)', fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:15, padding:'15px 32px', borderRadius:10, display:'inline-block', transition:'all .15s', boxShadow:'0 4px 16px rgba(0,0,0,0.15)' }}
            onMouseEnter={e => { e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,0.2)' }}
            onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,0.15)' }}>
            Try AI Search Free →
          </Link>
          <Link href="/categories/smartphones-electronics" style={{ background:'transparent', color:'rgba(255,255,255,0.9)', fontFamily:'Syne,sans-serif', fontWeight:600, fontSize:15, padding:'15px 32px', borderRadius:10, border:'1.5px solid rgba(255,255,255,0.4)', display:'inline-block', transition:'all .15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.8)'; e.currentTarget.style.color='#fff' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.4)'; e.currentTarget.style.color='rgba(255,255,255,0.9)' }}>
            Browse Categories
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding:'32px 48px', borderTop:'1px solid var(--border)', background:'#fff', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <Link href="/" style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:16, color:'var(--text)' }}>
          Product<span style={{ color:'var(--saffron)' }}>Rating</span><span style={{ color:'var(--text-muted)', fontWeight:400 }}>.in</span>
        </Link>
        <span style={{ fontSize:12, color:'var(--text-muted)', fontFamily:'JetBrains Mono,monospace' }}>
          © 2025 ProductRating.in · Made with ❤️ in India
        </span>
        <div style={{ display:'flex', gap:24 }}>
          {['About','Privacy','Contact'].map(l => (
            <Link key={l} href={`/${l.toLowerCase()}`} style={{ fontSize:13, color:'var(--text-muted)', fontWeight:500, transition:'color .15s' }}
              onMouseEnter={e=>(e.currentTarget.style.color='var(--text)')}
              onMouseLeave={e=>(e.currentTarget.style.color='var(--text-muted)')}>
              {l}
            </Link>
          ))}
        </div>
      </footer>
    </>
  )
}
