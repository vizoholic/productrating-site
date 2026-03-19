'use client'
import Link from 'next/link'
const CARDS = [
  { icon:'🧠', title:'AI-Cleaned Reviews', sub:'No fake ratings', body:'Our model removes bot reviews, incentivised ratings, and seller-paid scores. Only real verified buyer feedback.', bVal:'4.6 ⭐', bNote:'Amazon · 3,200 reviews (unfiltered)', aVal:'3.9 / 5', aNote:'PR Score · after removing 38% fake reviews' },
  { icon:'🇮🇳', title:'India-Specific Insights', sub:'City + climate aware', body:'An AC rated 4.5★ in Shimla may fail in Chennai. We show city-wise performance so your climate informs your decision.', bVal:'"Works great!"', bNote:'Generic review · location unknown', aVal:'Delhi 4.2 · Mumbai 3.7', aNote:'City-specific performance' },
  { icon:'📊', title:'One Clear Score', sub:'No platform confusion', body:'Stop comparing 4.3★ on Flipkart vs 4.1★ on Amazon. One honest PR Score aggregated from all 8 Indian platforms.', bVal:'Flipkart 4.3 · Amazon 4.1', bNote:'Which one to trust?', aVal:'4.0 PR Score', aNote:'Aggregated from 8 platforms' },
]
export default function ValueProps() {
  return (
    <section style={{ padding:'clamp(48px,8vw,80px) clamp(16px,5vw,40px)', background:'#F9FAFB', borderTop:'1px solid #E5E7EB' }}>
      <div style={{ maxWidth:1160, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:40 }}>
          <div style={{ fontSize:12, fontWeight:600, color:'#2563EB', letterSpacing:'1px', textTransform:'uppercase', marginBottom:10, fontFamily:'JetBrains Mono,monospace' }}>Why it matters</div>
          <h2 style={{ fontSize:'clamp(24px,3.5vw,40px)', fontWeight:800, letterSpacing:'-1px', color:'#111827', lineHeight:1.15 }}>Reviews are broken.<br />We fixed them.</h2>
          <p style={{ fontSize:15, color:'#6B7280', maxWidth:420, margin:'12px auto 0', lineHeight:1.6 }}>68% of online reviews in India are fake or misleading. Here&apos;s what we do about it.</p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:16 }}>
          {CARDS.map(c => (
            <div key={c.title} style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:12, padding:24, boxShadow:'0 1px 2px rgba(0,0,0,0.05)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
                <div style={{ width:40, height:40, background:'#EFF6FF', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>{c.icon}</div>
                <div>
                  <div style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:16, fontWeight:700, color:'#111827' }}>{c.title}</div>
                  <div style={{ fontSize:12, color:'#2563EB', fontWeight:600, marginTop:1 }}>{c.sub}</div>
                </div>
              </div>
              <p style={{ fontSize:14, color:'#6B7280', lineHeight:1.65, marginBottom:16 }}>{c.body}</p>
              <div style={{ borderRadius:8, overflow:'hidden', border:'1px solid #E5E7EB', fontSize:13 }}>
                <div style={{ padding:'10px 14px', background:'#FEF2F2', borderBottom:'1px solid #FECACA' }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'#EF4444', textTransform:'uppercase', letterSpacing:'.8px', marginBottom:3 }}>❌ Before</div>
                  <div style={{ fontWeight:700, color:'#111827' }}>{c.bVal}</div>
                  <div style={{ fontSize:12, color:'#9CA3AF', marginTop:2 }}>{c.bNote}</div>
                </div>
                <div style={{ padding:'10px 14px', background:'#ECFDF5' }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'#10B981', textTransform:'uppercase', letterSpacing:'.8px', marginBottom:3 }}>✅ ProductRating</div>
                  <div style={{ fontWeight:700, color:'#111827' }}>{c.aVal}</div>
                  <div style={{ fontSize:12, color:'#9CA3AF', marginTop:2 }}>{c.aNote}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ textAlign:'center', marginTop:32 }}>
          <Link href="/search" style={{ display:'inline-flex', alignItems:'center', gap:8, background:'#2563EB', color:'#fff', fontWeight:600, fontSize:15, padding:'12px 28px', borderRadius:10, transition:'background .15s' }}
            onMouseEnter={e=>(e.currentTarget.style.background='#1D4ED8')}
            onMouseLeave={e=>(e.currentTarget.style.background='#2563EB')}>
            Get Honest Recommendations →
          </Link>
        </div>
      </div>
    </section>
  )
}
