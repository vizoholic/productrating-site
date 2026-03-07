import Link from 'next/link'
import type { Product } from '@/lib/wix'

const VERDICT_STYLE: Record<string, { bg: string; border: string; color: string }> = {
  'Buy Now':    { bg: 'rgba(0,230,118,0.1)',  border: 'rgba(0,230,118,0.3)',  color: 'var(--green)' },
  'Consider':   { bg: 'rgba(255,200,0,0.1)',  border: 'rgba(255,200,0,0.3)',  color: '#FFC800' },
  'Wait':       { bg: 'rgba(255,60,0,0.1)',   border: 'rgba(255,60,0,0.3)',   color: '#FF5733' },
  'Must Watch': { bg: 'rgba(0,230,118,0.1)',  border: 'rgba(0,230,118,0.3)',  color: 'var(--green)' },
}

const SAMPLE_PRODUCTS = [
  { _id: '1', name: 'Samsung Galaxy S24 FE', slug: 'samsung-galaxy-s24-fe', category: 'Smartphones & Electronics', brand: 'Samsung', aggregatedScore: 4.4, totalReviews: 12400, flipkartScore: 4.4, amazonScore: 4.3, meeshoScore: 0, nykaaScore: 0, priceMin: 34999, priceMax: 39999, verdictBadge: 'Buy Now', featured: true, pros: [], cons: [], tags: [], description: '', image: '', aiSummary: '' },
  { _id: '2', name: 'Daikin 1.5T 5 Star Inverter AC', slug: 'daikin-15t-5star-inverter', category: 'Home Appliances', brand: 'Daikin', aggregatedScore: 4.5, totalReviews: 8200, flipkartScore: 4.5, amazonScore: 4.4, meeshoScore: 0, nykaaScore: 0, priceMin: 42500, priceMax: 48000, verdictBadge: 'Buy Now', featured: true, pros: [], cons: [], tags: [], description: '', image: '', aiSummary: '' },
  { _id: '3', name: 'Minimalist 10% Niacinamide Serum', slug: 'minimalist-niacinamide-serum', category: 'Personal Care & Beauty', brand: 'Minimalist', aggregatedScore: 4.0, totalReviews: 31000, flipkartScore: 4.1, amazonScore: 4.0, meeshoScore: 3.9, nykaaScore: 4.1, priceMin: 599, priceMax: 699, verdictBadge: 'Consider', featured: true, pros: [], cons: [], tags: [], description: '', image: '', aiSummary: '' },
  { _id: '4', name: 'Pushpa 2: The Rule', slug: 'pushpa-2-the-rule', category: 'Movies', brand: 'Mythri Movie Makers', aggregatedScore: 4.7, totalReviews: 95000, flipkartScore: 0, amazonScore: 4.6, meeshoScore: 0, nykaaScore: 0, priceMin: 0, priceMax: 0, verdictBadge: 'Must Watch', featured: true, pros: [], cons: [], tags: [], description: '', image: '', aiSummary: '' },
]

function ScoreBar({ label, score, color }: { label: string; score: number; color: string }) {
  if (!score) return null
  return (
    <span style={{ background: color, borderRadius: 6, padding: '3px 8px', fontSize: 10, fontWeight: 600, fontFamily: 'JetBrains Mono,monospace', color: '#fff', marginRight: 4 }}>
      {label} {score.toFixed(1)}
    </span>
  )
}

export default function FeaturedProducts({ products }: { products: Product[] }) {
  const displayProducts = products.length > 0 ? products : SAMPLE_PRODUCTS

  return (
    <section style={{ background: 'var(--bg2)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '100px 48px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--saffron)', marginBottom: 16 }}>// Trending Now</div>
        <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: 'clamp(32px,4vw,52px)', fontWeight: 800, letterSpacing: '-1.5px', lineHeight: 1.1 }}>Top rated<br />this week.</h2>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 24, padding: 40, marginTop: 48 }}>
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 24 }}>Live Score Preview</div>
          {displayProducts.map((p, i) => {
            const verdict = VERDICT_STYLE[p.verdictBadge] || VERDICT_STYLE['Consider']
            return (
              <Link key={p._id} href={`/products/${p.slug}`} style={{
                display: 'flex', alignItems: 'center', gap: 24, padding: '20px 0',
                borderBottom: i < displayProducts.length - 1 ? '1px solid var(--border)' : 'none',
                textDecoration: 'none', transition: 'opacity .2s',
              }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '.8')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                <div style={{ width: 56, height: 56, background: 'var(--surface2)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>
                  {p.category === 'Movies' ? '🎬' : p.category?.includes('Appliance') ? '🌬️' : p.category?.includes('Beauty') ? '💊' : '📱'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 15, fontWeight: 700 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono,monospace', marginTop: 2 }}>
                    {p.category}{p.priceMin ? ` · ₹${p.priceMin.toLocaleString('en-IN')}` : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', maxWidth: 200 }}>
                  <ScoreBar label="FK" score={p.flipkartScore} color="rgba(255,107,0,0.6)" />
                  <ScoreBar label="AMZ" score={p.amazonScore} color="rgba(255,153,0,0.6)" />
                  <ScoreBar label="MSH" score={p.meeshoScore} color="rgba(139,92,246,0.6)" />
                </div>
                <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 32, fontWeight: 800, letterSpacing: '-1px', color: 'var(--green)', flexShrink: 0, minWidth: 70, textAlign: 'right' }}>
                  {p.aggregatedScore?.toFixed(1)}
                </div>
                <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1.5, padding: '4px 10px', borderRadius: 100, flexShrink: 0, background: verdict.bg, border: `1px solid ${verdict.border}`, color: verdict.color }}>
                  {p.verdictBadge}
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
