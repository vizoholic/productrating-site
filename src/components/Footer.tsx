'use client'
import Link from 'next/link'

export default function Footer() {
  return (
    <>
      <section style={{padding:'clamp(72px,9vw,108px) clamp(20px,5vw,40px)',background:'var(--bg)',borderTop:'1px solid var(--border)',textAlign:'center',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at center, rgba(91,79,207,0.05) 0%, transparent 60%)',pointerEvents:'none'}}/>
        <div style={{position:'relative',maxWidth:560,margin:'0 auto'}}>
          <h2 style={{fontSize:'clamp(28px,5vw,52px)',fontWeight:800,letterSpacing:'-1.5px',color:'var(--ink)',lineHeight:1.06,marginBottom:16}}>
            Reviews, made trustworthy.<br/>
            <span style={{background:'linear-gradient(135deg,var(--accent),var(--accent-2))',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>Free, forever.</span>
          </h2>
          <p style={{fontSize:15,color:'var(--ink-3)',marginBottom:32,lineHeight:1.75,letterSpacing:'0.02em',fontWeight:300}}>No ads. No paid placements. No compromises.</p>
          <Link href="/search" style={{display:'inline-flex',alignItems:'center',gap:8,background:'var(--accent)',color:'#fff',fontWeight:600,fontSize:15,padding:'14px 32px',borderRadius:14,textDecoration:'none',boxShadow:'0 8px 24px rgba(91,79,207,0.28)',transition:'all 0.2s'}}
            onMouseEnter={e=>{e.currentTarget.style.background='#4A3FBF';e.currentTarget.style.boxShadow='0 12px 32px rgba(91,79,207,0.38)';e.currentTarget.style.transform='translateY(-2px)'}}
            onMouseLeave={e=>{e.currentTarget.style.background='var(--accent)';e.currentTarget.style.boxShadow='0 8px 24px rgba(91,79,207,0.28)';e.currentTarget.style.transform='translateY(0)'}}>
            Ask AI Now →
          </Link>
        </div>
      </section>
      <footer style={{background:'var(--bg-2)',borderTop:'1px solid var(--border)',padding:'clamp(36px,5vw,52px) clamp(20px,5vw,40px) clamp(20px,3vw,28px)'}}>
        <div style={{maxWidth:1120,margin:'0 auto'}}>
          <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr',gap:40,marginBottom:40}}>
            <div>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
                <div style={{width:30,height:30,borderRadius:8,background:'var(--ink)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 2px 8px rgba(0,0,0,0.15)'}}>
                  <span style={{color:'var(--bg)',fontSize:12,fontWeight:700}}>PR</span>
                </div>
                <span style={{fontWeight:700,fontSize:15,color:'var(--ink)'}}>ProductRating<span style={{color:'var(--accent)' }}>.in</span></span>
              </div>
              <p style={{fontSize:13,color:'var(--ink-3)',lineHeight:1.85,maxWidth:280,letterSpacing:'0.02em',fontWeight:300,marginBottom:16}}>India's AI product intelligence platform. One honest score across 8+ platforms. No ads, no paid placements.</p>
              <div style={{display:'inline-flex',alignItems:'center',gap:7,background:'var(--green-bg)',border:'1px solid rgba(22,163,74,0.18)',borderRadius:'var(--radius-sm)',padding:'5px 12px'}}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <span style={{fontSize:11,color:'var(--green)',fontFamily:'var(--font-mono)',letterSpacing:'0.5px'}}>No ads · No paid placements</span>
              </div>
            </div>
            <div>
              <p style={{fontSize:10,color:'var(--ink-4)',fontFamily:'var(--font-mono)',letterSpacing:'1.5px',textTransform:'uppercase',marginBottom:16}}>Product</p>
              {[['Search','/search'],['About','/about'],['Contact','/contact']].map(([l,h])=>(
                <Link key={l} href={h} style={{display:'block',fontSize:13,color:'var(--ink-3)',marginBottom:10,transition:'color .15s',letterSpacing:'0.02em',fontWeight:300}}
                  onMouseEnter={e=>(e.currentTarget.style.color='var(--ink)')}
                  onMouseLeave={e=>(e.currentTarget.style.color='var(--ink-3)')}>{l}</Link>
              ))}
            </div>
            <div>
              <p style={{fontSize:10,color:'var(--ink-4)',fontFamily:'var(--font-mono)',letterSpacing:'1.5px',textTransform:'uppercase',marginBottom:16}}>Legal</p>
              {[['Privacy Policy','/privacy'],['Terms','/privacy'],['Contact','/contact']].map(([l,h])=>(
                <Link key={l} href={h} style={{display:'block',fontSize:13,color:'var(--ink-3)',marginBottom:10,transition:'color .15s',letterSpacing:'0.02em',fontWeight:300}}
                  onMouseEnter={e=>(e.currentTarget.style.color='var(--ink)')}
                  onMouseLeave={e=>(e.currentTarget.style.color='var(--ink-3)')}>{l}</Link>
              ))}
            </div>
          </div>
          <div style={{borderTop:'1px solid var(--border)',paddingTop:20,display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:12}}>
            <span style={{fontSize:12,color:'var(--ink-4)',fontFamily:'var(--font-mono)'}}>© 2025 ProductRating.in · 🇮🇳 Built in India</span>
            <span style={{fontSize:12,color:'var(--ink-4)',fontFamily:'var(--font-mono)'}}>AI Product Intelligence</span>
          </div>
        </div>
      </footer>
    </>
  )
}
