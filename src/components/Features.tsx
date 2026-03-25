'use client'
// Points 3, 5, 7, 8 — 3 signature cards, consistent outline icons,
// platform logo row, visual how-it-works

// Consistent outline icon component
function Icon({ d, size=20 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={d}/>
    </svg>
  )
}

const SIGNATURE_CARDS = [
  {
    icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    title: 'Honest Score',
    desc: 'One AI-adjusted rating across 8 Indian platforms. Fake reviews filtered out.',
    metric: '38% fake reviews removed',
    color: '#16A34A',
    bg: 'rgba(22,163,74,0.06)',
    border: 'rgba(22,163,74,0.15)',
  },
  {
    icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z',
    title: 'India Context',
    desc: 'Recommendations factoring in your city\'s climate, power supply, and service centres.',
    metric: 'Tier 1 & 2 city intelligence',
    color: '#5B4FCF',
    bg: 'rgba(91,79,207,0.06)',
    border: 'rgba(91,79,207,0.15)',
  },
  {
    icon: 'M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z',
    title: 'Voice in 22 Languages',
    desc: 'Speak in Hindi, Tamil, Telugu, Bengali, or any Indian language — we understand.',
    metric: 'All 22 scheduled languages',
    color: '#B45309',
    bg: 'rgba(180,83,9,0.06)',
    border: 'rgba(180,83,9,0.15)',
  },
]

const PLATFORMS = ['Amazon', 'Flipkart', 'Nykaa', 'Croma', 'Meesho', 'JioMart', 'Myntra', 'Tata Cliq', 'Ajio', 'Reliance Digital']

const HOW_STEPS = [
  { n:'01', icon:'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4', label:'Collect reviews' },
  { n:'02', icon:'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636', label:'Remove fakes' },
  { n:'03', icon:'M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z', label:'Build PR Score' },
  { n:'04', icon:'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z', label:'Recommend instantly' },
]

export default function Features() {
  return (
    <section style={{ padding:'clamp(48px,6vw,80px) clamp(20px,5vw,40px)', background:'#FAFAF9' }}>
      <div style={{ maxWidth:1100, margin:'0 auto' }}>

        {/* ── 3 SIGNATURE CARDS ── */}
        <div style={{ textAlign:'center', marginBottom:40 }}>
          <p style={{ fontSize:11, color:'#A8A29E', fontFamily:'Geist Mono, monospace', letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:12 }}>What makes us different</p>
          <h2 style={{ fontSize:'clamp(22px,3.5vw,36px)', fontWeight:800, color:'#111110', letterSpacing:'-1px' }}>Three things we do better.</h2>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px,1fr))', gap:14, marginBottom:72 }}>
          {SIGNATURE_CARDS.map(c => (
            <div key={c.title}
              style={{ background:'#FFFFFF', border:`1.5px solid ${c.border}`, borderRadius:18, padding:28, transition:'all 0.2s', boxShadow:'0 2px 8px rgba(0,0,0,0.05)' }}
              onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.transform='translateY(-3px)';(e.currentTarget as HTMLDivElement).style.boxShadow=`0 12px 32px rgba(0,0,0,0.08)`}}
              onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.transform='translateY(0)';(e.currentTarget as HTMLDivElement).style.boxShadow='0 2px 8px rgba(0,0,0,0.05)'}}>
              {/* One outline icon — consistent style */}
              <div style={{ width:44, height:44, background:c.bg, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:18, color:c.color }}>
                <Icon d={c.icon} size={20} />
              </div>
              <h3 style={{ fontSize:17, fontWeight:700, color:'#111110', marginBottom:8 }}>{c.title}</h3>
              <p style={{ fontSize:13, color:'#78716C', lineHeight:1.7, marginBottom:16 }}>{c.desc}</p>
              <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:c.bg, borderRadius:100, padding:'4px 12px' }}>
                <span style={{ width:5, height:5, borderRadius:'50%', background:c.color, flexShrink:0 }} />
                <span style={{ fontSize:11, color:c.color, fontFamily:'Geist Mono, monospace', fontWeight:500 }}>{c.metric}</span>
              </div>
            </div>
          ))}
        </div>

        {/* ── PLATFORM ROW — editorial, monochrome ── */}
        <div style={{ background:'#FFFFFF', border:'1.5px solid rgba(0,0,0,0.07)', borderRadius:18, padding:'28px 32px', marginBottom:72, boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
          <p style={{ fontSize:11, color:'#A8A29E', fontFamily:'Geist Mono, monospace', letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:20, textAlign:'center' }}>
            Signals from India&apos;s most-used marketplaces
          </p>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8, justifyContent:'center' }}>
            {PLATFORMS.map(p => (
              <div key={p} style={{ padding:'7px 16px', borderRadius:100, background:'#F5F4F2', border:'1px solid rgba(0,0,0,0.06)' }}>
                <span style={{ fontSize:13, fontWeight:500, color:'#57534E' }}>{p}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── HOW IT WORKS — horizontal visual flow ── */}
        <div style={{ textAlign:'center', marginBottom:36 }}>
          <p style={{ fontSize:11, color:'#A8A29E', fontFamily:'Geist Mono, monospace', letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:12 }}>How it works</p>
          <h2 style={{ fontSize:'clamp(20px,3vw,32px)', fontWeight:800, color:'#111110', letterSpacing:'-1px' }}>From millions of reviews to one answer.</h2>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px,1fr))', gap:0, background:'#FFFFFF', border:'1.5px solid rgba(0,0,0,0.07)', borderRadius:18, overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
          {HOW_STEPS.map((s, i) => (
            <div key={s.n} style={{ padding:'28px 24px', borderRight: i < HOW_STEPS.length-1 ? '1px solid rgba(0,0,0,0.06)' : 'none', position:'relative' }}>
              {/* Connector arrow on desktop */}
              {i < HOW_STEPS.length-1 && (
                <div style={{ position:'absolute', top:'50%', right:-8, transform:'translateY(-50%)', width:16, height:16, background:'#FFFFFF', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1 }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#D6D3D1" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
                </div>
              )}
              {/* Outline icon — same style as signature cards */}
              <div style={{ width:40, height:40, background:'rgba(91,79,207,0.07)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:14, color:'#5B4FCF' }}>
                <Icon d={s.icon} size={18} />
              </div>
              <div style={{ fontSize:28, fontWeight:800, color:'rgba(91,79,207,0.1)', fontFamily:'Sora,sans-serif', letterSpacing:'-2px', lineHeight:1, marginBottom:10 }}>{s.n}</div>
              <div style={{ fontSize:14, fontWeight:600, color:'#111110' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
