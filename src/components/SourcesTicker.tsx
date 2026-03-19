const S = ['Flipkart','Amazon','Nykaa','Meesho','Croma','JioMart','Myntra','Tata Cliq','Ajio','Reliance Digital']
export default function SourcesTicker() {
  const items = [...S,...S]
  return (
    <div style={{ borderTop:'1px solid #E5E7EB', borderBottom:'1px solid #E5E7EB', background:'#F9FAFB', padding:'11px 0', overflow:'hidden' }}>
      <div style={{ display:'flex', gap:48, width:'max-content', animation:'ticker 22s linear infinite' }}>
        {items.map((s,i)=><span key={i} style={{ fontSize:11, fontWeight:600, color:'#9CA3AF', whiteSpace:'nowrap', fontFamily:'JetBrains Mono,monospace', letterSpacing:'.5px', textTransform:'uppercase' }}>{s}</span>)}
      </div>
    </div>
  )
}
