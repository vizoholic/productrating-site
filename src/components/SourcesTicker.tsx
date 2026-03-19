const SRCS = ['Flipkart','Amazon','Nykaa','Meesho','Croma','JioMart','Myntra','Tata Cliq','Reliance Digital','Ajio']
export default function SourcesTicker() {
  const items = [...SRCS,...SRCS]
  return (
    <div style={{ borderTop:'1px solid var(--border)', borderBottom:'1px solid var(--border)', background:'var(--bg-2)', padding:'12px 0', overflow:'hidden' }}>
      <div style={{ display:'flex', gap:48, width:'max-content', animation:'ticker 22s linear infinite' }}>
        {items.map((s,i)=>(
          <span key={i} style={{ fontSize:12, fontWeight:600, color:'var(--subtle)', whiteSpace:'nowrap', fontFamily:'JetBrains Mono,monospace', letterSpacing:'.5px', textTransform:'uppercase' }}>{s}</span>
        ))}
      </div>
    </div>
  )
}
