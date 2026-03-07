const FEATURES = [
  { icon: '🇮🇳', title: 'India-First Intelligence', desc: 'Ratings calibrated to Indian income brackets, regional climates, power fluctuations, and local service availability. Not global averages — India-specific truth.', tag: 'Live Now', tagClass: 'green' },
  { icon: '🕵️', title: 'Fake Review Detection', desc: 'Our proprietary ML flags incentivised, bot-generated, and seller-paid reviews. What you see is what real Indian buyers actually experienced.', tag: 'Live Now', tagClass: 'green' },
  { icon: '🗣️', title: '11 Language Sentiment', desc: 'Hindi, Tamil, Telugu, Bengali, Marathi, Kannada, Malayalam, Gujarati reviews are all read and understood — not skipped.', tag: 'Live Now', tagClass: 'green' },
  { icon: '📍', title: 'City-Wise Performance', desc: 'An AC that works in Shimla fails in Ahmedabad. We surface geographic performance breakdowns so your city\'s climate informs your decision.', tag: 'Live Now', tagClass: 'green' },
  { icon: '⏳', title: 'Longevity Tracker', desc: 'We track products for 6 months and 1 year post-purchase. Know if it still works before you buy — not just on day one.', tag: 'Coming Soon', tagClass: 'blue' },
  { icon: '🔌', title: 'API for Brands & Fintechs', desc: 'Banks, BNPLs, and e-commerce platforms can license the ProductRating API. Your score becomes infrastructure — not just a website.', tag: 'Coming Soon', tagClass: 'blue' },
]

export default function Features() {
  return (
    <section id="features" style={{ padding: '100px 48px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--saffron)', marginBottom: 16 }}>// Why ProductRating.in</div>
        <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: 'clamp(32px,4vw,52px)', fontWeight: 800, letterSpacing: '-1.5px', lineHeight: 1.1, maxWidth: 600 }}>Built to be LLM-proof.<br />Your moat is the data.</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20, marginTop: 60 }}>
          {FEATURES.map(f => (
            <div key={f.title} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: 36 }}>
              <div style={{ width: 48, height: 48, background: 'rgba(255,107,0,0.1)', border: '1px solid rgba(255,107,0,0.2)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 20 }}>{f.icon}</div>
              <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 18, fontWeight: 700, marginBottom: 10 }}>{f.title}</div>
              <div style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.8 }}>{f.desc}</div>
              <div style={{ display: 'inline-block', marginTop: 16, fontFamily: 'JetBrains Mono,monospace', fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', padding: '4px 10px', borderRadius: 100, background: f.tagClass === 'green' ? 'rgba(0,230,118,0.08)' : 'rgba(0,200,255,0.08)', border: `1px solid ${f.tagClass === 'green' ? 'rgba(0,230,118,0.2)' : 'rgba(0,200,255,0.2)'}`, color: f.tagClass === 'green' ? 'var(--green)' : 'var(--electric)' }}>{f.tag}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
