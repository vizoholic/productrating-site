const SOURCES = ['Flipkart','Amazon','Nykaa','Meesho','Croma','JioMart','Myntra','Tata Cliq','Reliance Digital','BigBasket','Blinkit','Ajio']

export default function SourcesTicker() {
  const items = [...SOURCES, ...SOURCES]
  return (
    <div style={{ borderTop:'1px solid var(--border)', borderBottom:'1px solid var(--border)', background:'#fff', padding:'14px 0', overflow:'hidden', position:'relative' }}>
      <div style={{ display:'flex', gap:48, width:'max-content', animation:'ticker 24s linear infinite' }}>
        {items.map((s,i) => (
          <span key={i} style={{ fontSize:12, fontWeight:600, color:'var(--text-muted)', whiteSpace:'nowrap', fontFamily:'JetBrains Mono,monospace', letterSpacing:1, textTransform:'uppercase' }}>
            {s}
          </span>
        ))}
      </div>
    </div>
  )
}
