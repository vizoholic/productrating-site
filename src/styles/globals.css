'use client'
import { useEffect, useRef } from 'react'

// #5 ICON SYSTEM — pure outline only, consistent strokeWidth=1.6
function Icon({ d, size=22 }: { d:string; size?:number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d={d}/>
    </svg>
  )
}

// Thin-line arc rating — premium, not stars
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

// Bespoke Editor Seal
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
    const el=ref.current;if(!el)return
    const obs=new IntersectionObserver(([e])=>{if(e.isIntersecting){el.classList.add('visible');obs.disconnect()}},{threshold:0.12})
    obs.observe(el);return()=>obs.disconnect()
  },[])
  return ref
}

function R({children,delay=0,className='',style={}}:{children:React.ReactNode;delay?:number;className?:string;style?:React.CSSProperties}) {
  const ref=useReveal()
  return <div ref={ref} className={`reveal ${className}`} style={{transitionDelay:`${delay}s`,...style}}>{children}</div>
}

const PLATFORMS=['Amazon.in','Flipkart','Nykaa','Croma','Meesho','JioMart','Myntra','Tata Cliq','Ajio','Reliance Digital']

export default function Features() {
  return (
    <>
      {/* ── BENTO GRID ── */}
      {/* #2 section padding 80-120px */}
      <section style={{padding:'clamp(96px,11vw,128px) clamp(24px,5vw,48px)',background:'var(--bg)'}}>
        <div style={{maxWidth:1120,margin:'0 auto'}}>

          {/* #3 Section heading — bigger, medium weight */}
          <R style={{textAlign:'center',marginBottom:64}}>
            <p style={{fontSize:11,fontWeight:500,color:'var(--accent)',fontFamily:'var(--font-mono)',letterSpacing:'2px',textTransform:'uppercase',marginBottom:14}}>What makes us different</p>
            <h2 style={{fontSize:'clamp(28px,4.5vw,52px)',fontWeight:700,color:'var(--ink)',letterSpacing:'-1.5px',lineHeight:1.06}}>
              Three things we do better.
            </h2>
          </R>

          {/* Bento — #1 elevation hierarchy */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(12,1fr)',gap:16,gridAutoRows:'auto'}}>

            {/* #6 Large card — more padding, cleaner structure */}
            <R style={{gridColumn:'span 7'}} className="bento-main">
              <div style={{
                background:'var(--bg-1)',
                border:'1.5px solid rgba(0,0,0,0.07)',
                borderRadius:24,              /* #6 bigger radius */
                padding:'clamp(36px,4vw,52px)', /* #6 more internal padding */
                height:'100%',
                position:'relative',overflow:'hidden',
                /* #1 DEPTH — card floats */
                boxShadow:'var(--shadow-card)',
                transition:`transform var(--t-mid) var(--ease), box-shadow var(--t-mid) var(--ease)`,
              }}
                onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.transform='translateY(-6px)';(e.currentTarget as HTMLDivElement).style.boxShadow='0 16px 40px rgba(0,0,0,0.11), 0 4px 10px rgba(0,0,0,0.06)'}}
                onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.transform='translateY(0)';(e.currentTarget as HTMLDivElement).style.boxShadow='var(--shadow-card)'}}>
                {/* Subtle bg glow — #8 visual depth */}
                <div style={{position:'absolute',top:-60,right:-60,width:240,height:240,borderRadius:'50%',background:'rgba(91,79,207,0.04)',filter:'blur(48px)',pointerEvents:'none'}}/>

                <EditorSeal/>
                {/* #3 bigger title, #11 medium not bold */}
                <h3 style={{fontSize:'clamp(22px,3vw,30px)',fontWeight:600,color:'var(--ink)',marginTop:20,marginBottom:14,letterSpacing:'-0.6px',lineHeight:1.2}}>
                  One honest score.<br/>Across every platform.
                </h3>
                {/* #3 lighter subtext */}
                <p style={{fontSize:14,color:'var(--ink-3)',lineHeight:1.85,letterSpacing:'0.02em',fontWeight:300,maxWidth:380,marginBottom:32}}>
                  We aggregate reviews from 8 Indian platforms and remove the fake ones. The score you see reflects what real buyers think.
                </p>
                {/* Rating comparison */}
                <div style={{display:'flex',gap:24,alignItems:'center',flexWrap:'wrap'}}>
                  <div style={{textAlign:'center'}}>
                    <div style={{fontSize:9,color:'var(--ink-4)',fontFamily:'var(--font-mono)',letterSpacing:'1px',textTransform:'uppercase',marginBottom:10}}>Platform shows</div>
                    <RatingArc score={4.7}/>
                    <div style={{fontSize:11,color:'var(--red)',marginTop:8,fontFamily:'var(--font-mono)',fontWeight:500}}>4.7 · with fakes</div>
                  </div>
                  <div style={{color:'var(--ink-4)'}}>
                    <Icon d="M5 12h14M12 5l7 7-7 7" size={18}/>
                  </div>
                  <div style={{textAlign:'center'}}>
                    <div style={{fontSize:9,color:'var(--ink-4)',fontFamily:'var(--font-mono)',letterSpacing:'1px',textTransform:'uppercase',marginBottom:10}}>Real PR Score</div>
                    <RatingArc score={4.2}/>
                    <div style={{fontSize:11,color:'var(--accent)',marginTop:8,fontFamily:'var(--font-mono)',fontWeight:500}}>4.2 · AI-adjusted</div>
                  </div>
                </div>
                <div style={{marginTop:22,fontSize:11,color:'var(--ink-4)',fontFamily:'var(--font-mono)',letterSpacing:'0.3px'}}>38% of reviews removed on average</div>
              </div>
            </R>

            {/* Right 2 small cards */}
            <div style={{gridColumn:'span 5',display:'flex',flexDirection:'column',gap:16}} className="bento-side">
              {/* India context */}
              <R delay={0.1} style={{flex:1}}>
                <div style={{
                  background:'rgba(91,79,207,0.06)',border:'1.5px solid rgba(91,79,207,0.2)',borderRadius:24,
                  padding:'clamp(28px,3.5vw,40px)',height:'100%',
                  /* #1 DEPTH — elevated card */
                  boxShadow:'var(--shadow-card)',
                  transition:`transform var(--t-mid) var(--ease), box-shadow var(--t-mid) var(--ease)`,
                }}
                  onMouseEnter={e=>(e.currentTarget as HTMLDivElement).style.transform='translateY(-5px)'}
                  onMouseLeave={e=>(e.currentTarget as HTMLDivElement).style.transform='translateY(0)'}>
                  <div style={{color:'var(--accent)',marginBottom:18}}>
                    <Icon d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" size={24}/>
                  </div>
                  <h3 style={{fontSize:'clamp(17px,2.5vw,22px)',fontWeight:600,color:'var(--ink)',marginBottom:12,letterSpacing:'-0.4px',lineHeight:1.2}}>Built for India's context</h3>
                  <p style={{fontSize:13,color:'var(--ink-3)',lineHeight:1.85,letterSpacing:'0.02em',fontWeight:300}}>Chennai heat. Delhi dust. Mumbai humidity. Recommendations that factor in your city's actual conditions.</p>
                  <div style={{marginTop:18,fontSize:10,color:'var(--accent)',fontFamily:'var(--font-mono)',letterSpacing:'0.5px',textTransform:'uppercase'}}>Tier 1 & 2 city intelligence</div>
                </div>
              </R>
              {/* Voice */}
              <R delay={0.2} style={{flex:1}}>
                <div style={{
                  background:'var(--accent-bg)',border:'1.5px solid var(--accent-border)',borderRadius:24,
                  padding:'clamp(28px,3.5vw,40px)',height:'100%',
                  boxShadow:'var(--shadow-card)',
                  transition:`transform var(--t-mid) var(--ease), box-shadow var(--t-mid) var(--ease)`,
                }}
                  onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.transform='translateY(-5px)';(e.currentTarget as HTMLDivElement).style.boxShadow='var(--shadow-hover)'}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.transform='translateY(0)';(e.currentTarget as HTMLDivElement).style.boxShadow='var(--shadow-card)'}}>
                  <div style={{color:'var(--accent)',marginBottom:18}}>
                    <Icon d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z M19 10v2a7 7 0 0 1-14 0v-2 M12 19v4 M8 23h8" size={24}/>
                  </div>
                  <h3 style={{fontSize:'clamp(17px,2.5vw,22px)',fontWeight:600,color:'var(--ink)',marginBottom:12,letterSpacing:'-0.4px',lineHeight:1.2}}>Voice in 22 languages</h3>
                  <p style={{fontSize:13,color:'var(--ink-3)',lineHeight:1.85,letterSpacing:'0.02em',fontWeight:300}}>Hindi, Tamil, Telugu, Bengali — ask in your language, get answers that understand India.</p>
                  <div style={{marginTop:18,fontSize:10,color:'var(--accent)',fontFamily:'var(--font-mono)',letterSpacing:'0.5px',textTransform:'uppercase'}}>All 22 scheduled languages</div>
                </div>
              </R>
            </div>
          </div>
        </div>
      </section>

      {/* Platform row — #7 cleaner, less noise */}
      <section style={{padding:'clamp(48px,6vw,64px) clamp(24px,5vw,48px)',background:'var(--bg-2)',borderTop:'1px solid rgba(0,0,0,0.06)',borderBottom:'1px solid rgba(0,0,0,0.06)'}}>
        <div style={{maxWidth:1120,margin:'0 auto'}}>
          <R>
            <p style={{fontSize:11,fontWeight:500,color:'var(--ink-4)',fontFamily:'var(--font-mono)',letterSpacing:'2px',textTransform:'uppercase',textAlign:'center',marginBottom:28}}>Signals from India's most-used marketplaces</p>
            <div style={{display:'flex',flexWrap:'wrap',gap:8,justifyContent:'center'}}>
              {PLATFORMS.map(p=>(
                <div key={p} style={{padding:'8px 18px',borderRadius:100,background:'var(--bg-1)',border:'1.5px solid rgba(0,0,0,0.07)',boxShadow:'0 1px 3px rgba(0,0,0,0.04)'}}>
                  <span style={{fontSize:13,fontWeight:400,color:'var(--ink-2)',letterSpacing:'0.01em'}}>{p}</span>
                </div>
              ))}
            </div>
          </R>
        </div>
      </section>

      {/* How it works — #2 big section spacing */}
      <section style={{padding:'clamp(96px,11vw,128px) clamp(24px,5vw,48px)',background:'var(--bg)'}}>
        <div style={{maxWidth:1120,margin:'0 auto'}}>
          <R style={{textAlign:'center',marginBottom:64}}>
            <p style={{fontSize:11,fontWeight:500,color:'var(--accent)',fontFamily:'var(--font-mono)',letterSpacing:'2px',textTransform:'uppercase',marginBottom:14}}>Process</p>
            <h2 style={{fontSize:'clamp(30px,4.5vw,54px)',fontWeight:700,color:'var(--ink)',letterSpacing:'-2px',lineHeight:1.04}}>From millions of reviews<br/>to one answer.</h2>
          </R>

          {/* #1 DEPTH — each step card on its own plane */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:2,background:'rgba(0,0,0,0.06)',borderRadius:22,overflow:'hidden'}}>
            {[
              {n:'01',title:'Collect',desc:'Every review from 8+ Indian platforms, updated daily.',icon:'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4'},
              {n:'02',title:'Filter',desc:'AI detects and removes fake, paid, and bot reviews.',icon:'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636'},
              {n:'03',title:'Score',desc:'One PR Score weighted by recency and city context.',icon:'M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z'},
              {n:'04',title:'Answer',desc:'Clear recommendation with pros, cons, and buy links.',icon:'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'},
            ].map((s,i)=>(
              <R key={s.n} delay={i*0.1}>
                <div style={{
                  background:'var(--bg-1)',
                  padding:'clamp(28px,3.5vw,40px)', /* #6 more internal padding */
                  height:'100%',
                }}>
                  <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:20}}>
                    <span style={{fontSize:11,color:'var(--ink-4)',fontFamily:'var(--font-mono)',letterSpacing:'0.5px'}}>{s.n}</span>
                    <div style={{flex:1,height:1,background:'rgba(0,0,0,0.07)'}}/>
                  </div>
                  {/* #5 consistent outline icon */}
                  <div style={{color:'var(--accent)',marginBottom:16}}>
                    <Icon d={s.icon} size={22}/>
                  </div>
                  <h3 style={{fontSize:21,fontWeight:600,color:'var(--ink)',marginBottom:10,letterSpacing:'-0.3px'}}>{s.title}</h3>
                  {/* #3 lighter body */}
                  <p style={{fontSize:13,color:'var(--ink-3)',lineHeight:1.85,letterSpacing:'0.02em',fontWeight:300}}>{s.desc}</p>
                </div>
              </R>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
