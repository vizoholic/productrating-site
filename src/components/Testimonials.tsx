// Point 6 — premium social proof with verified styling
'use client'
import { useState } from 'react'

const REVIEWS = [
  {
    quote: 'Bought the wrong AC last year by trusting Amazon ratings. This time ProductRating showed me a 4.6 was actually 3.9. Saved me from repeating the mistake.',
    name: 'Arjun M.',
    city: 'Bengaluru',
    category: 'Home Appliances',
    initials: 'AM',
    color: '#5B4FCF',
  },
  {
    quote: 'The Hindi voice search is genuinely useful. I just asked "Delhi mein best AC kaunsa hai" and got proper recommendations that mentioned heat and humidity.',
    name: 'Priya S.',
    city: 'Delhi',
    category: 'Air Conditioners',
    initials: 'PS',
    color: '#16A34A',
  },
  {
    quote: 'Finally a product tool that understands Indian context. Not just Amazon US reviews repackaged — it actually knew about service center availability in Hyderabad.',
    name: 'Sunita R.',
    city: 'Hyderabad',
    category: 'Smartphones',
    initials: 'SR',
    color: '#B45309',
  },
]

export default function Testimonials() {
  const [active, setActive] = useState(0)
  const r = REVIEWS[active]

  return (
    <section style={{ padding:'clamp(48px,6vw,80px) clamp(20px,5vw,40px)', background:'#FFFFFF', borderTop:'1px solid rgba(0,0,0,0.06)' }}>
      <div style={{ maxWidth:700, margin:'0 auto', textAlign:'center' }}>

        <p style={{ fontSize:11, color:'#A8A29E', fontFamily:'Geist Mono, monospace', letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:40 }}>Verified users</p>

        {/* Standout single testimonial */}
        <div style={{ background:'#FAFAF9', border:'1.5px solid rgba(0,0,0,0.07)', borderRadius:20, padding:'36px 36px 28px', marginBottom:24, position:'relative', boxShadow:'0 4px 16px rgba(0,0,0,0.05)' }}>
          {/* Large quote mark */}
          <div style={{ position:'absolute', top:20, left:28, fontSize:64, lineHeight:1, color:'rgba(91,79,207,0.1)', fontFamily:'Georgia, serif', pointerEvents:'none' }}>&ldquo;</div>

          <p style={{ fontSize:'clamp(15px,2vw,17px)', color:'#374151', lineHeight:1.8, marginBottom:28, position:'relative', fontStyle:'italic' }}>
            {r.quote}
          </p>

          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:12 }}>
            <div style={{ width:40, height:40, borderRadius:'50%', background:r.color, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:14, flexShrink:0 }}>
              {r.initials}
            </div>
            <div style={{ textAlign:'left' }}>
              <div style={{ fontSize:14, fontWeight:600, color:'#111110' }}>{r.name}</div>
              <div style={{ fontSize:12, color:'#A8A29E', display:'flex', gap:6, alignItems:'center' }}>
                <span>{r.city}</span>
                <span style={{ width:3, height:3, borderRadius:'50%', background:'#D6D3D1', display:'inline-block' }} />
                <span style={{ background:'rgba(0,0,0,0.05)', borderRadius:4, padding:'1px 8px' }}>{r.category}</span>
              </div>
            </div>
            {/* Verified badge */}
            <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:4, background:'rgba(22,163,74,0.07)', border:'1px solid rgba(22,163,74,0.15)', borderRadius:100, padding:'3px 10px' }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              <span style={{ fontSize:10, color:'#16A34A', fontFamily:'Geist Mono, monospace', fontWeight:500 }}>Verified</span>
            </div>
          </div>
        </div>

        {/* Dots navigation */}
        <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
          {REVIEWS.map((_, i) => (
            <button key={i} onClick={() => setActive(i)}
              style={{ width: i===active ? 24 : 8, height:8, borderRadius:100, border:'none', cursor:'pointer', transition:'all 0.25s', background: i===active ? '#5B4FCF' : '#E7E5E4' }} />
          ))}
        </div>
      </div>
    </section>
  )
}
