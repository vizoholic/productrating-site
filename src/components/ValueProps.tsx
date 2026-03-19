'use client'
import Link from 'next/link'

const CARDS = [
  {
    icon: '🧠',
    title: 'AI-Cleaned Reviews',
    sub: 'No fake ratings',
    body: 'Our model removes bot reviews, incentivised ratings, and seller-paid scores. Only real verified buyer feedback.',
    before: { val: '4.6 ⭐', note: 'Amazon · 3,200 reviews (unfiltered)', bad: true },
    after:  { val: '3.9 / 5', note: 'PR Score · after removing 38% fake reviews', bad: false },
  },
  {
    icon: '🇮🇳',
    title: 'India-Specific Insights',
    sub: 'City + climate aware',
    body: 'An AC rated 4.5★ in Shimla may fail in Chennai. We show city-wise performance so your climate informs your decision.',
    before: { val: '"Works great!"', note: 'Generic review · location unknown', bad: true },
    after:  { val: 'Delhi 4.2 · Mumbai 3.7', note: 'City-specific performance breakdown', bad: false },
  },
  {
    icon: '📊',
    title: 'One Clear Score',
    sub: 'No platform confusion',
    body: 'Stop comparing 4.3★ on Flipkart vs 4.1★ on Amazon. We aggregate all sources into one honest PR Score.',
    before: { val: 'Flipkart 4.3 · Amazon 4.1 · Nykaa 4.6', note: 'Which one to trust?', bad: true },
    after:  { val: '4.0 PR Score', note: 'Aggregated from 8 Indian platforms', bad: false },
  },
]

export default function ValueProps() {
  return (
    <section style={{ padding:'80px 40px', background:'var(--bg-2)', borderTop:'1px solid var(--border)' }}>
      <div style={{ maxWidth:1160, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:48 }}>
          <div style={{ fontSize:12, fontWeight:600, color:'var(--blue)', letterSpacing:'1px', textTransform:'uppercase', marginBottom:10, fontFamily:'JetBrains Mono,monospace' }}>Why it matters</div>
          <h2 style={{ fontSize:'clamp(26px,3.5vw,40px)', fontWeight:800, letterSpacing:'-1px', color:'var(--ink)', lineHeight:1.15 }}>
            Reviews are broken.<br />We fixed them.
          </h2>
          <p style={{ fontSize:16, color:'var(--muted)', maxWidth:440, margin:'12px auto 0', lineHeight:1.6 }}>
            68% of online reviews in India are fake or misleading. Here&apos;s what we do about it.
          </p>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20 }}>
          {CARDS.map(c => (
            <div key={c.title} style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:12, padding:28, boxShadow:'var(--shadow-xs)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
                <div style={{ width:40, height:40, background:'var(--blue-light)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>{c.icon}</div>
                <div>
                  <div style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:16, fontWeight:700, color:'var(--ink)' }}>{c.title}</div>
                  <div style={{ fontSize:12, color:'var(--blue)', fontWeight:600, marginTop:1 }}>{c.sub}</div>
                </div>
              </div>
              <p style={{ fontSize:14, color:'var(--muted)', lineHeight:1.65, marginBottom:18 }}>{c.body}</p>
              {/* Before / After */}
              <div style={{ borderRadius:8, overflow:'hidden', border:'1px solid var(--border)', fontSize:13 }}>
                <div style={{ padding:'10px 14px', background:'var(--red-light)', borderBottom:'1px solid #FECACA' }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'var(--red)', textTransform:'uppercase', letterSpacing:'.8px', marginBottom:3 }}>❌ Before</div>
                  <div style={{ fontWeight:700, color:'var(--ink)' }}>{c.before.val}</div>
                  <div style={{ fontSize:12, color:'var(--subtle)', marginTop:2 }}>{c.before.note}</div>
                </div>
                <div style={{ padding:'10px 14px', background:'var(--green-light)' }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'var(--green)', textTransform:'uppercase', letterSpacing:'.8px', marginBottom:3 }}>✅ ProductRating</div>
                  <div style={{ fontWeight:700, color:'var(--ink)' }}>{c.after.val}</div>
                  <div style={{ fontSize:12, color:'var(--subtle)', marginTop:2 }}>{c.after.note}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign:'center', marginTop:36 }}>
          <Link href="/search" style={{ display:'inline-flex', alignItems:'center', gap:8, background:'var(--blue)', color:'#fff', fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:700, fontSize:15, padding:'13px 28px', borderRadius:10, transition:'background .15s' }}
            onMouseEnter={e=>(e.currentTarget.style.background='#1D4ED8')}
            onMouseLeave={e=>(e.currentTarget.style.background='var(--blue)')}>
            Get Honest Recommendations →
          </Link>
        </div>
      </div>
    </section>
  )
}
