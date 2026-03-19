'use client'
import Link from 'next/link'

const PROPS = [
  {
    icon: '🧠',
    title: 'AI-Cleaned Reviews',
    subtitle: 'No fake ratings',
    desc: 'Our ML removes bot reviews, incentivised ratings and seller-paid scores. Only real verified buyer feedback.',
    before: { label: 'Amazon rating', score: '4.3 ⭐', note: '2,847 reviews (many fake)', color: '#EF4444' },
    after: { label: 'ProductRating score', score: '3.9', note: 'After removing 38% fake reviews', color: '#059669' },
  },
  {
    icon: '🇮🇳',
    title: 'India-Specific Insights',
    subtitle: 'City + climate aware',
    desc: 'An AC rated 4.5★ in Shimla may fail in Chennai. We surface city-wise performance so your climate matters.',
    before: { label: 'Global review', score: 'Works great!', note: 'Posted from unknown location', color: '#EF4444' },
    after: { label: 'ProductRating insight', score: 'Delhi 4.2 · Mumbai 3.8', note: 'City-specific performance data', color: '#059669' },
  },
  {
    icon: '📊',
    title: 'One Smart Score',
    subtitle: 'No confusion',
    desc: 'Stop comparing 4.3★ on Flipkart vs 4.1★ on Amazon. We combine all sources into one honest PR Score.',
    before: { label: 'Flipkart', score: '4.3 · Amazon 4.1 · Nykaa 4.5', note: 'Which one to trust?', color: '#EF4444' },
    after: { label: 'PR Score', score: '4.0 / 5', note: 'Aggregated from all 8 platforms', color: '#059669' },
  },
]

export default function ValueProps() {
  return (
    <section style={{ padding:'96px 48px', background:'#F7F8FA', borderTop:'1px solid #E5E7EB' }}>
      <div style={{ maxWidth:1200, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:56 }}>
          <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:11, letterSpacing:3, textTransform:'uppercase', color:'#FF6B00', marginBottom:12 }}>Why it matters</div>
          <h2 style={{ fontFamily:'Syne,sans-serif', fontSize:'clamp(28px,4vw,48px)', fontWeight:800, letterSpacing:'-1.5px', color:'#111218', lineHeight:1.1 }}>
            Reviews are broken.<br />We fixed them.
          </h2>
          <p style={{ fontSize:16, color:'#6B7280', maxWidth:480, margin:'16px auto 0', lineHeight:1.7 }}>
            68% of online reviews in India are fake or misleading. We built the tool that filters them out.
          </p>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:24 }}>
          {PROPS.map(p => (
            <div key={p.title} style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:20, padding:32, boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
              {/* Header */}
              <div style={{ display:'flex', alignItems:'flex-start', gap:14, marginBottom:16 }}>
                <div style={{ width:48, height:48, background:'#FFF7F0', borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>{p.icon}</div>
                <div>
                  <div style={{ fontFamily:'Syne,sans-serif', fontSize:17, fontWeight:800, color:'#111218' }}>{p.title}</div>
                  <div style={{ fontSize:12, color:'#FF6B00', fontWeight:600, marginTop:2 }}>{p.subtitle}</div>
                </div>
              </div>
              <p style={{ fontSize:13, color:'#6B7280', lineHeight:1.7, marginBottom:20 }}>{p.desc}</p>

              {/* Before / After */}
              <div style={{ borderRadius:12, overflow:'hidden', border:'1px solid #E5E7EB' }}>
                <div style={{ padding:'12px 16px', background:'#FEF2F2', borderBottom:'1px solid #FECACA' }}>
                  <div style={{ fontSize:10, fontWeight:700, color:'#EF4444', textTransform:'uppercase', letterSpacing:1, marginBottom:4 }}>❌ Before</div>
                  <div style={{ fontSize:14, fontWeight:700, color:'#111218' }}>{p.before.score}</div>
                  <div style={{ fontSize:11, color:'#9CA3AF', marginTop:2 }}>{p.before.note}</div>
                </div>
                <div style={{ padding:'12px 16px', background:'#F0FDF4' }}>
                  <div style={{ fontSize:10, fontWeight:700, color:'#059669', textTransform:'uppercase', letterSpacing:1, marginBottom:4 }}>✅ ProductRating</div>
                  <div style={{ fontSize:14, fontWeight:700, color:'#111218' }}>{p.after.score}</div>
                  <div style={{ fontSize:11, color:'#9CA3AF', marginTop:2 }}>{p.after.note}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign:'center', marginTop:40 }}>
          <Link href="/search" style={{ display:'inline-flex', alignItems:'center', gap:8, background:'#FF6B00', color:'#fff', fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:15, padding:'14px 32px', borderRadius:12, transition:'background .15s' }}
            onMouseEnter={e => (e.currentTarget.style.background='#E55A00')}
            onMouseLeave={e => (e.currentTarget.style.background='#FF6B00')}>
            Get Honest Recommendations →
          </Link>
        </div>
      </div>
    </section>
  )
}
