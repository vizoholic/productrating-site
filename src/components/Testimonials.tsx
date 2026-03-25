'use client'
import { useState } from 'react'

const REVIEWS = [
  { quote:'Bought the wrong AC last year trusting Amazon ratings. ProductRating showed me the 4.6 was actually 3.9 after fake reviews were removed. Saved me from repeating that mistake.', name:'Arjun M.', city:'Bengaluru', category:'Home Appliances', initials:'AM', color:'var(--accent)' },
  { quote:'The Hindi voice search genuinely works. I asked "Delhi mein best AC kaunsa hai" and got recommendations that actually mentioned humidity and dust — not generic global advice.', name:'Priya S.', city:'Delhi', category:'Air Conditioners', initials:'PS', color:'var(--green)' },
  { quote:'Finally a tool that understands Indian conditions. It knew about service centre availability in Hyderabad and factored in voltage fluctuation. No other platform does this.', name:'Sunita R.', city:'Hyderabad', category:'Smartphones', initials:'SR', color:'var(--gold)' },
]

export default function Testimonials() {
  const [active,setActive]=useState(0)
  const r=REVIEWS[active]
  return (
    <section style={{
      padding:'clamp(96px,11vw,128px) clamp(24px,5vw,48px)',
      background:'var(--bg-2)',borderTop:'1px solid rgba(0,0,0,0.06)'
    }}>
      <div style={{maxWidth:720,margin:'0 auto',textAlign:'center'}}>
        <p style={{fontSize:11,fontWeight:500,color:'var(--ink-4)',fontFamily:'var(--font-mono)',letterSpacing:'2px',textTransform:'uppercase',marginBottom:56}}>
          Verified users
        </p>

        {/* #1 DEPTH — card floats above bg */}
        <div style={{
          background:'var(--bg-1)',
          border:'1.5px solid rgba(0,0,0,0.07)',
          borderRadius:24,
          padding:'clamp(36px,5vw,52px)',
          /* card sits above the section */
          boxShadow:'var(--shadow-raised)',
          marginBottom:28,
          position:'relative',overflow:'hidden',
          transition:`box-shadow var(--t-mid) var(--ease)`,
        }}
          onMouseEnter={e=>(e.currentTarget as HTMLDivElement).style.boxShadow='var(--shadow-xl)'}
          onMouseLeave={e=>(e.currentTarget as HTMLDivElement).style.boxShadow='var(--shadow-raised)'}>
          <div style={{position:'absolute',top:16,left:28,fontSize:96,lineHeight:1,color:'var(--bg-3)',fontFamily:'Georgia,serif',userSelect:'none',pointerEvents:'none'}}>&ldquo;</div>

          {/* #3 lighter body weight for quote */}
          <p style={{fontSize:'clamp(16px,2.5vw,20px)',fontWeight:300,color:'var(--ink)',lineHeight:1.8,letterSpacing:'0.01em',marginBottom:32,position:'relative',paddingTop:20}}>
            {r.quote}
          </p>

          <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:14}}>
            <div style={{width:42,height:42,borderRadius:'50%',background:r.color,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,boxShadow:'0 4px 12px rgba(0,0,0,0.1)'}}>
              <span style={{color:'#fff',fontSize:13,fontWeight:600}}>{r.initials}</span>
            </div>
            <div style={{textAlign:'left'}}>
              <div style={{fontSize:14,fontWeight:500,color:'var(--ink)',letterSpacing:'0.01em'}}>{r.name}</div>
              <div style={{fontSize:12,color:'var(--ink-4)',fontFamily:'var(--font-mono)',letterSpacing:'0.3px',display:'flex',gap:8,alignItems:'center',marginTop:3}}>
                <span>{r.city}</span>
                <span style={{width:2,height:2,borderRadius:'50%',background:'var(--ink-4)',display:'inline-block'}}/>
                <span>{r.category}</span>
              </div>
            </div>
            <div style={{marginLeft:8,display:'inline-flex',alignItems:'center',gap:6,background:'var(--gold-bg)',border:'1px solid rgba(160,120,42,0.2)',borderRadius:8,padding:'5px 12px'}}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.8"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              <span style={{fontSize:10,color:'var(--gold)',fontFamily:'var(--font-mono)',letterSpacing:'0.5px',textTransform:'uppercase'}}>Verified</span>
            </div>
          </div>
        </div>

        {/* Dot nav — #13 smooth transition */}
        <div style={{display:'flex',gap:10,justifyContent:'center'}}>
          {REVIEWS.map((_,i)=>(
            <button key={i} onClick={()=>setActive(i)}
              style={{width:i===active?28:8,height:8,borderRadius:100,border:'none',cursor:'pointer',transition:`all var(--t-mid) var(--ease)`,background:i===active?'var(--accent)':'var(--bg-3)'}}/>
          ))}
        </div>
      </div>
    </section>
  )
}
