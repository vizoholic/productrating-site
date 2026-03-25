'use client'
import Link from 'next/link'

export default function Footer() {
  return (
    <>
      {/* CTA — #2 generous spacing */}
      <section style={{padding:'clamp(96px,11vw,128px) clamp(24px,5vw,48px)',background:'var(--bg)',borderTop:'1px solid rgba(0,0,0,0.06)',textAlign:'center',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at center, rgba(91,79,207,0.05) 0%, transparent 60%)',pointerEvents:'none'}}/>
        <div style={{position:'relative',maxWidth:540,margin:'0 auto'}}>
          {/* #3 bigger headline */}
          <h2 style={{fontSize:'clamp(30px,5.5vw,58px)',fontWeight:700,letterSpacing:'-2px',color:'var(--ink)',lineHeight:1.04,marginBottom:18}}>
            Reviews, made trustworthy.<br/>
            <span style={{background:'linear-gradient(135deg,var(--accent),var(--accent-2))',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>
              Free, forever.
            </span>
          </h2>
          {/* #3 lighter subtext */}
          <p style={{fontSize:16,color:'var(--ink-3)',marginBottom:40,lineHeight:1.8,letterSpacing:'0.02em',fontWeight:300}}>
            No ads. No paid placements. No compromises.
          </p>
          {/* #4 premium button */}
          <Link href="/search" style={{display:'inline-flex',alignItems:'center',gap:8,background:'var(--accent)',color:'#fff',fontWeight:500,fontSize:15,letterSpacing:'0.03em',padding:'16px 36px',borderRadius:14,textDecoration:'none',boxShadow:'var(--shadow-btn)',transition:`all var(--t-mid) var(--ease)`}}
            onMouseEnter={e=>{e.currentTarget.style.background='#4A3FBF';e.currentTarget.style.boxShadow='var(--shadow-btn-hv)';e.currentTarget.style.transform='translateY(-2px) scale(1.02)'}}
            onMouseLeave={e=>{e.currentTarget.style.background='var(--accent)';e.currentTarget.style.boxShadow='var(--shadow-btn)';e.currentTarget.style.transform='translateY(0) scale(1)'}}
            onMouseDown={e=>{e.currentTarget.style.transform='scale(0.98)'}}
            onMouseUp={e=>{e.currentTarget.style.transform='scale(1.02)'}}>
            Ask AI Now
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
        </div>
      </section>

      <footer style={{background:'var(--bg-2)',borderTop:'1px solid rgba(0,0,0,0.07)',padding:'clamp(48px,6vw,64px) clamp(24px,5vw,48px) clamp(24px,3vw,32px)'}}>
        <div style={{maxWidth:1120,margin:'0 auto'}}>
          <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr',gap:48,marginBottom:48}}>
            <div>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
                <div style={{width:32,height:32,borderRadius:9,background:'var(--ink)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 2px 8px rgba(0,0,0,0.12)'}}>
                  <span style={{color:'var(--bg)',fontSize:12,fontWeight:700}}>PR</span>
                </div>
                <span style={{fontWeight:600,fontSize:15,color:'var(--ink)',letterSpacing:'-0.2px'}}>ProductRating<span style={{color:'var(--accent)' }}>.in</span></span>
              </div>
              <p style={{fontSize:13,color:'var(--ink-2)',lineHeight:1.85,maxWidth:280,letterSpacing:'0.02em',fontWeight:300,marginBottom:18}}>
                India's AI product intelligence platform. One honest score across 8+ platforms. No ads, no paid placements.
              </p>
              <div style={{display:'inline-flex',alignItems:'center',gap:7,background:'var(--green-bg)',border:'1px solid rgba(22,163,74,0.18)',borderRadius:8,padding:'6px 14px'}}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <span style={{fontSize:11,color:'var(--green)',fontFamily:'var(--font-mono)',letterSpacing:'0.4px'}}>No ads · No paid placements</span>
              </div>
            </div>
            {[
              {head:'Product',links:[['Search','/search'],['About','/about'],['Contact','/contact']]},
              {head:'Legal',links:[['Privacy Policy','/privacy'],['Terms','/privacy'],['Contact','/contact']]},
            ].map(col=>(
              <div key={col.head}>
                <p style={{fontSize:10,fontWeight:500,color:'var(--ink-4)',fontFamily:'var(--font-mono)',letterSpacing:'1.5px',textTransform:'uppercase',marginBottom:20}}>{col.head}</p>
                {col.links.map(([l,h])=>(
                  <Link key={l} href={h} style={{display:'block',fontSize:13,fontWeight:400,color:'var(--ink-2)',marginBottom:12,transition:`color var(--t-fast) var(--ease)`,letterSpacing:'0.02em'}}
                    onMouseEnter={e=>(e.currentTarget.style.color='var(--ink)')}
                    onMouseLeave={e=>(e.currentTarget.style.color='var(--ink-3)')}>{l}
                  </Link>
                ))}
              </div>
            ))}
          </div>
          <div style={{borderTop:'1px solid rgba(0,0,0,0.07)',paddingTop:24,display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:12}}>
            <span style={{fontSize:12,color:'var(--ink-3)',fontFamily:'var(--font-mono)'}}>© 2025 ProductRating.in · 🇮🇳 Built in India</span>
            <span style={{fontSize:12,color:'var(--ink-3)',fontFamily:'var(--font-mono)'}}>AI Product Intelligence</span>
          </div>
        </div>
      </footer>
    </>
  )
}
