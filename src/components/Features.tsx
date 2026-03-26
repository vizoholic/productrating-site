'use client'
import { useEffect, useRef } from 'react'

function Icon({ d, size=22 }: { d:string; size?:number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d={d}/>
    </svg>
  )
}

function RatingArc({ score, size=60 }: { score:number; size?:number }) {
  const r=(size/2)-5, circ=2*Math.PI*r, dash=circ*(score/5)
  return (
    <div style={{position:'relative',width:size,height:size,flexShrink:0}}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{transform:'rotate(-90deg)'}}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--bg-3)" strokeWidth="2.5"/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--accent)" strokeWidth="2.5"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"/>
      </svg>
      <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column'}}>
        <span style={{fontSize:size/3.5,fontWeight:700,color:'var(--ink)',lineHeight:1,letterSpacing:'-1px'}}>{score.toFixed(1)}</span>
        <span style={{fontSize:8,color:'var(--ink-4)',fontFamily:'var(--font-mono)'}}>/ 5</span>
      </div>
    </div>
  )
}

function EditorSeal() {
  return (
    <div style={{display:'inline-flex',alignItems:'center',gap:7,background:'var(--gold-bg)',border:'1px solid rgba(160,120,42,0.2)',borderRadius:8,padding:'6px 14px'}}>
      <Icon d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" size={11}/>
      <span style={{fontSize:10,fontWeight:500,color:'var(--gold)',fontFamily:'var(--font-mono)',letterSpacing:'0.5px',textTransform:'uppercase'}}>Editor's Choice</span>
    </div>
  )
}

function useReveal() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(()=>{
    const el=ref.current; if(!el) return
    const obs=new IntersectionObserver(([e])=>{if(e.isIntersecting){el.classList.add('visible');obs.disconnect()}},{threshold:0.1})
    obs.observe(el); return()=>obs.disconnect()
  },[])
  return ref
}
function R({children,delay=0,style={}}:{children:React.ReactNode;delay?:number;style?:React.CSSProperties}) {
  const ref=useReveal()
  return <div ref={ref} className="reveal" style={{transitionDelay:`${delay}s`,...style}}>{children}</div>
}

const PLATFORMS=['Amazon.in','Flipkart','Nykaa','Croma','Meesho','JioMart','Myntra','Tata Cliq','Ajio','Reliance Digital']

export default function Features() {
  return (
    <>
      <style>{`
        /* Bento grid — stacks on mobile */
        .bento-grid { display: grid; grid-template-columns: 7fr 5fr; gap: 16px; }
        .bento-side  { display: flex; flex-direction: column; gap: 16px; }
        @media (max-width: 860px) {
          .bento-grid { grid-template-columns: 1fr; }
          .bento-side  { flex-direction: row; flex-wrap: wrap; }
          .bento-side > div { flex: 1 1 280px; }
        }
        @media (max-width: 540px) {
          .bento-side { flex-direction: column; }
          .bento-side > div { flex: 1 1 100%; }
        }
        /* How-it-works mobile */
        @media (max-width: 640px) {
          .how-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 400px) {
          .how-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ── BENTO SECTION ── */}
      <section style={{padding:'clamp(80px,10vw,120px) clamp(20px,5vw,40px)',background:'var(--bg)'}}>
        <div style={{maxWidth:1120,margin:'0 auto'}}>

          <R style={{textAlign:'center',marginBottom:clamp(52)}}>
            <p style={{fontSize:11,fontWeight:500,color:'var(--accent)',fontFamily:'var(--font-mono)',letterSpacing:'2px',textTransform:'uppercase',marginBottom:14}}>What makes us different</p>
            <h2 style={{fontSize:'clamp(28px,5vw,56px)',fontWeight:700,color:'var(--ink)',letterSpacing:'-2px',lineHeight:1.04}}>Three things we do better.</h2>
          </R>

          <div className="bento-grid">

            {/* Large card */}
            <R>
              <div style={{
                background:'var(--bg-1)',border:'1.5px solid rgba(0,0,0,0.07)',
                borderRadius:22,padding:'clamp(28px,4vw,48px)',
                position:'relative',overflow:'hidden',
                boxShadow:'0 2px 8px rgba(0,0,0,0.06)',
                transition:'transform 350ms cubic-bezier(0.22,1,0.36,1),box-shadow 350ms ease',
              }}
                onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.transform='translateY(-5px)';(e.currentTarget as HTMLDivElement).style.boxShadow='0 16px 40px rgba(0,0,0,0.1)'}}
                onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.transform='translateY(0)';(e.currentTarget as HTMLDivElement).style.boxShadow='0 2px 8px rgba(0,0,0,0.06)'}}>
                <div style={{position:'absolute',top:-40,right:-40,width:200,height:200,borderRadius:'50%',background:'rgba(91,79,207,0.04)',filter:'blur(40px)',pointerEvents:'none'}}/>
                <EditorSeal/>
                <h3 style={{fontSize:'clamp(20px,2.8vw,28px)',fontWeight:600,color:'var(--ink)',marginTop:18,marginBottom:12,letterSpacing:'-0.6px',lineHeight:1.2}}>
                  One honest score.<br/>Across every platform.
                </h3>
                <p style={{fontSize:14,color:'var(--ink-3)',lineHeight:1.85,letterSpacing:'0.02em',fontWeight:300,maxWidth:380,marginBottom:28}}>
                  We aggregate reviews from 8 Indian platforms and remove the fake ones. The score you see reflects what real buyers think.
                </p>
                <div style={{display:'flex',gap:20,alignItems:'center',flexWrap:'wrap'}}>
                  <div style={{textAlign:'center'}}>
                    <div style={{fontSize:9,color:'var(--ink-4)',fontFamily:'var(--font-mono)',letterSpacing:'1px',textTransform:'uppercase',marginBottom:10}}>Platform shows</div>
                    <RatingArc score={4.7}/>
                    <div style={{fontSize:11,color:'var(--red)',marginTop:8,fontFamily:'var(--font-mono)',fontWeight:500}}>4.7 · with fakes</div>
                  </div>
                  <div style={{color:'var(--ink-4)'}}><Icon d="M5 12h14M12 5l7 7-7 7" size={18}/></div>
                  <div style={{textAlign:'center'}}>
                    <div style={{fontSize:9,color:'var(--ink-4)',fontFamily:'var(--font-mono)',letterSpacing:'1px',textTransform:'uppercase',marginBottom:10}}>Real PR Score</div>
                    <RatingArc score={4.2}/>
                    <div style={{fontSize:11,color:'var(--accent)',marginTop:8,fontFamily:'var(--font-mono)',fontWeight:500}}>4.2 · AI-adjusted</div>
                  </div>
                </div>
                <div style={{marginTop:20,fontSize:11,color:'var(--ink-4)',fontFamily:'var(--font-mono)',letterSpacing:'0.3px'}}>38% of reviews removed on average</div>
              </div>
            </R>

            {/* Right 2 cards */}
            <div className="bento-side">
              <R delay={0.1} style={{flex:1}}>
                <div style={{
                  background:'rgba(91,79,207,0.06)',border:'1.5px solid rgba(91,79,207,0.2)',
                  borderRadius:22,padding:'clamp(22px,3vw,32px)',height:'100%',
                  boxShadow:'0 2px 8px rgba(0,0,0,0.04)',
                  transition:'transform 350ms cubic-bezier(0.22,1,0.36,1)',
                }}
                  onMouseEnter={e=>(e.currentTarget as HTMLDivElement).style.transform='translateY(-4px)'}
                  onMouseLeave={e=>(e.currentTarget as HTMLDivElement).style.transform='translateY(0)'}>
                  <div style={{color:'var(--accent)',marginBottom:14}}>
                    <Icon d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" size={24}/>
                  </div>
                  <h3 style={{fontSize:'clamp(16px,2.2vw,21px)',fontWeight:600,color:'var(--ink)',marginBottom:10,letterSpacing:'-0.3px',lineHeight:1.2}}>Built for India's context</h3>
                  <p style={{fontSize:13,color:'var(--ink-3)',lineHeight:1.8,letterSpacing:'0.02em',fontWeight:300}}>Chennai heat. Delhi dust. Mumbai humidity. Recommendations that factor in your city's actual conditions.</p>
                  <div style={{marginTop:14,fontSize:10,color:'var(--accent)',fontFamily:'var(--font-mono)',letterSpacing:'0.5px',textTransform:'uppercase'}}>Tier 1 & 2 city intelligence</div>
                </div>
              </R>
              <R delay={0.2} style={{flex:1}}>
                <div style={{
                  background:'var(--accent-bg)',border:'1.5px solid var(--accent-border)',
                  borderRadius:22,padding:'clamp(22px,3vw,32px)',height:'100%',
                  boxShadow:'0 2px 8px rgba(0,0,0,0.04)',
                  transition:'transform 350ms cubic-bezier(0.22,1,0.36,1)',
                }}
                  onMouseEnter={e=>(e.currentTarget as HTMLDivElement).style.transform='translateY(-4px)'}
                  onMouseLeave={e=>(e.currentTarget as HTMLDivElement).style.transform='translateY(0)'}>
                  <div style={{color:'var(--accent)',marginBottom:14}}>
                    <Icon d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z M19 10v2a7 7 0 0 1-14 0v-2 M12 19v4 M8 23h8" size={24}/>
                  </div>
                  <h3 style={{fontSize:'clamp(16px,2.2vw,21px)',fontWeight:600,color:'var(--ink)',marginBottom:10,letterSpacing:'-0.3px',lineHeight:1.2}}>Voice in 22 languages</h3>
                  <p style={{fontSize:13,color:'var(--ink-3)',lineHeight:1.8,letterSpacing:'0.02em',fontWeight:300}}>Hindi, Tamil, Telugu, Bengali — ask in your language, get answers that understand India.</p>
                  <div style={{marginTop:14,fontSize:10,color:'var(--accent)',fontFamily:'var(--font-mono)',letterSpacing:'0.5px',textTransform:'uppercase'}}>All 22 scheduled languages</div>
                </div>
              </R>
            </div>
          </div>
        </div>
      </section>

      {/* Platform row */}
      <section style={{padding:'clamp(40px,5vw,64px) clamp(20px,5vw,40px)',background:'linear-gradient(180deg, var(--bg) 0%, var(--bg-2) 12%, var(--bg-2) 88%, var(--bg) 100%)'}}>
        <div style={{maxWidth:1120,margin:'0 auto'}}>
          <R>
            <p style={{fontSize:11,fontWeight:500,color:'var(--ink-4)',fontFamily:'var(--font-mono)',letterSpacing:'2px',textTransform:'uppercase',textAlign:'center',marginBottom:24}}>Signals from India's most-used marketplaces</p>
            <div style={{display:'flex',flexWrap:'wrap',gap:8,justifyContent:'center'}}>
              {PLATFORMS.map(p=>(
                <div key={p} style={{padding:'7px 16px',borderRadius:100,background:'var(--bg-1)',border:'1.5px solid rgba(0,0,0,0.07)',boxShadow:'0 1px 3px rgba(0,0,0,0.04)'}}>
                  <span style={{fontSize:13,fontWeight:400,color:'var(--ink-2)',letterSpacing:'0.01em'}}>{p}</span>
                </div>
              ))}
            </div>
          </R>
        </div>
      </section>

      {/* How it works */}
      <section style={{padding:'clamp(80px,10vw,120px) clamp(20px,5vw,40px)',background:'var(--bg)'}}>
        <div style={{maxWidth:1120,margin:'0 auto'}}>
          <R style={{textAlign:'center',marginBottom:56}}>
            <p style={{fontSize:11,fontWeight:500,color:'var(--accent)',fontFamily:'var(--font-mono)',letterSpacing:'2px',textTransform:'uppercase',marginBottom:14}}>Process</p>
            <h2 style={{fontSize:'clamp(26px,4.5vw,52px)',fontWeight:700,color:'var(--ink)',letterSpacing:'-2px',lineHeight:1.04}}>From millions of reviews<br/>to one answer.</h2>
          </R>

          <div className="how-grid" style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:2,background:'rgba(91,79,207,0.04)',borderRadius:22,overflow:'hidden'}}>
            {[
              {n:'01',title:'Collect',desc:'Every review from 8+ Indian platforms, updated daily.',icon:'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4'},
              {n:'02',title:'Filter',desc:'AI detects and removes fake, paid, and bot reviews.',icon:'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636'},
              {n:'03',title:'Score',desc:'One PR Score weighted by recency and city context.',icon:'M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z'},
              {n:'04',title:'Answer',desc:'Clear recommendation with pros, cons, buy links.',icon:'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'},
            ].map((s,i)=>(
              <R key={s.n} delay={i*0.1}>
                <div style={{background:'var(--bg-1)',padding:'clamp(22px,3vw,36px)',height:'100%'}}>
                  <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:18}}>
                    <span style={{fontSize:11,color:'var(--ink-4)',fontFamily:'var(--font-mono)',letterSpacing:'0.5px'}}>{s.n}</span>
                    <div style={{flex:1,height:1,background:'rgba(0,0,0,0.07)'}}/>
                  </div>
                  <div style={{color:'var(--accent)',marginBottom:12}}><Icon d={s.icon} size={20}/></div>
                  <h3 style={{fontSize:'clamp(16px,2vw,20px)',fontWeight:600,color:'var(--ink)',marginBottom:8,letterSpacing:'-0.3px'}}>{s.title}</h3>
                  <p style={{fontSize:13,color:'var(--ink-3)',lineHeight:1.8,letterSpacing:'0.02em',fontWeight:300}}>{s.desc}</p>
                </div>
              </R>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
function clamp(n:number){return n}
