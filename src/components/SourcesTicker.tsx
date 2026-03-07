const SOURCES = ['Flipkart','Amazon India','Nykaa','Meesho','JioMart','Myntra','Snapdeal','BigBasket','Croma','Reliance Digital']
const DOUBLED = [...SOURCES, ...SOURCES]

export default function SourcesTicker() {
  return (
    <div style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '16px 0', overflow: 'hidden' }}>
      <div style={{ display: 'flex', gap: 48, animation: 'ticker 22s linear infinite', width: 'max-content' }}>
        {DOUBLED.map((s, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap', fontFamily: 'JetBrains Mono,monospace', fontSize: 11, letterSpacing: 1, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--saffron)', flexShrink: 0, display: 'inline-block' }} />
            {s}
          </span>
        ))}
      </div>
    </div>
  )
}
