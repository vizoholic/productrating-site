'use client'
import { useState } from 'react'

const REVIEWS = [
  { quote: 'Bought the wrong AC last year trusting Amazon ratings. ProductRating showed me a 4.6 was actually 3.9. Saved me from repeating the same mistake.', name:'Arjun M.', city:'Bengaluru', category:'Home Appliances', initials:'AM', color:'var(--accent)' },
  { quote: 'The Hindi voice search is genuinely useful. Asked "Delhi mein best AC kaunsa hai" and got recommendations that actually mentioned heat and humidity.', name:'Priya S.', city:'Delhi', category:'Air Conditioners', initials:'PS', color:'var(--ink)' },
  { quote: 'Finally a product tool that understands Indian context — not just Amazon US reviews repackaged. It knew about service centre availability in Hyderabad.', name:'Sunita R.', city:'Hyderabad', category:'Smartphones', initials:'SR', color:'var(--gold)' },
]

export default function Testimonials() {
  const [active, setActive] = useState(0)
  const r = REVIEWS[active]
  return (
    <section style={{ padding:'clamp(80px,10vw,120px) clamp(20px,5vw,48px)', background:'var(--bg-2)', borderTop:'1px solid var(--border)' }}>
      <div style={{ maxWidth:800, margin:'0 auto', textAlign:'center' }}>
        <p style={{ fontSize:11, color:'var(--ink-4)', fontFamily:'var(--font-mono)', letterSpacing:'2px', textTransform:'uppercase', marginBottom:56 }}>Verified users</p>
        <div style={{ background:'var(--bg-1)', border:'1.5px solid var(--border)', borderRadius:'var(--radius-xl)', padding:'clamp(32px,5vw,56px)', marginBottom:28, position:'relative', boxShadow:'var(--shadow-md)', transition:'all 0.4s ease' }}>
          <div style={{ position:'absolute', top:24, left:32, fontFamily:'Georgia, serif', fontSize:80, lineHeight:1, color:'var(--border-hi)', pointerEvents:'none', userSelect:'none' }}>&ldquo;</div>
          <p style={{ fontFamily:'var(--font-serif)', fontSize:'clamp(17px,2.5vw,22px)', fontWeight:400, fontStyle:'italic', color:'var(--ink)', lineHeight:1.75, marginBottom:36, position:'relative', letterSpacing:'-0.2px' }}>
            {r.quote}
          </p>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:14 }}>
            <div style={{ width:44, height:44, borderRadius:'50%', background:r.color, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--bg)', fontWeight:600, fontSize:14, fontFamily:'var(--font-serif)', flexShrink:0 }}>{r.initials}</div>
            <div style={{ textAlign:'left' }}>
              <div style={{ fontSize:14, fontWeight:500, color:'var(--ink)', fontFamily:'var(--font-sans)', letterSpacing:'0.01em' }}>{r.name}</div>
              <div style={{ fontSize:12, color:'var(--ink-4)', fontFamily:'var(--font-mono)', display:'flex', gap:8, marginTop:2 }}>
                <span>{r.city}</span><span>·</span>
                <span style={{ background:'var(--bg-2)', borderRadius:4, padding:'1px 8px', border:'1px solid var(--border)' }}>{r.category}</span>
              </div>
            </div>
            <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:6, background:'var(--accent-bg)', border:'1px solid var(--accent-border)', borderRadius:'var(--radius-sm)', padding:'5px 12px' }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
              <span style={{ fontSize:10, color:'var(--accent)', fontFamily:'var(--font-mono)', letterSpacing:'0.5px', textTransform:'uppercase' }}>Verified</span>
            </div>
          </div>
        </div>
        <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
          {REVIEWS.map((_,i) => (
            <button key={i} onClick={() => setActive(i)}
              style={{ width:i===active?28:7, height:7, borderRadius:100, border:'none', cursor:'pointer', transition:'all 0.3s cubic-bezier(0.22,1,0.36,1)', background:i===active?'var(--ink)':'var(--bg-3)' }} />
          ))}
        </div>
      </div>
    </section>
  )
}
