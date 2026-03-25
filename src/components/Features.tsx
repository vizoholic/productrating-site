'use client'
import { useEffect, useRef } from 'react'

function RatingArc({score,size=60}:{score:number;size?:number}){
  const r=(size/2)-5,circ=2*Math.PI*r,dash=circ*(score/5)
  return(
    <div style={{position:'relative',width:size,height:size,flexShrink:0}}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{transform:'rotate(-90deg)'}}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--bg-3)" strokeWidth="2.5"/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"/>
      </svg>
      <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column'}}>
        <span style={{fontFamily:'var(--font-sans)',fontSize:size/3.5,fontWeight:800,color:'var(--ink)',lineHeight:1,letterSpacing:'-1px'}}>{score.toFixed(1)}</span>
        <span style={{fontSize:8,color:'var(--ink-4)',fontFamily:'var(--font-mono)'}}>/ 5</span>
      </div>
    </div>
  )
}

function EditorSeal({label}:{label:string}){
  return(
    <div style={{display:'inline-flex',alignItems:'center',gap:6,background:'var(--gold-bg)',border:'1px solid rgba(160,120,42,0.22)',borderRadius:'var(--radius-sm)',padding:'5px 12px'}}>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.8"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
      <span style={{fontSize:10,fontWeight:600,color:'var(--gold)',fontFamily:'var(--font-mono)',letterSpacing:'0.5px',textTransform:'uppercase'}}>{label}</span>
    </div>
  )
}

function useReveal(){ const ref=useRef<HTMLDivElement>(null); useEffect(()=>{ const el=ref.current;if(!el)return; const obs=new IntersectionObserver(([e])=>{if(e.isIntersecting){el.classList.add('visible');obs.disconnect()}},{threshold:0.12}); obs.observe(el); return()=>obs.disconnect() },[]);return ref }

function R({children,delay=0,style={}}:{children:React.ReactNode;delay?:number;style?:React.CSSProperties}){
  const ref=useReveal()
  return <div ref={ref} className="reveal" style={{transitionDelay:`${delay}s`,...style}}>{children}</div>
}

const PLATFORMS=['Amazon.in','Flipkart','Nykaa','Croma','Meesho','JioMart','Myntra','Tata Cliq','Ajio','Reliance Digital']

export default function Features(){
  return(
    <>
      {/* BENTO GRID */}
      <section style={{padding:'clamp(80px,10vw,120px) clamp(20px,5vw,40px)',background:'var(--bg)'}}>
        <div style={{maxWidth:1120,margin:'0 auto'}}>
          <R style={{textAlign:'center',marginBottom:52}}>
            <p style={{fontSize:11,color:'var(--accent)',fontFamily:'var(--font-mono)',letterSpacing:'2px',textTransform:'uppercase',marginBottom:12}}>What makes us different</p>
            <h2 style={{fontSize:'clamp(26px,4vw,48px)',fontWeight:800,color:'var(--ink)',letterSpacing:'-1.5px',lineHeight:1.08}}>Three things we do better.</h2>
          </R>

          {/* Bento */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(12,1fr)',gap:14}}>

            {/* Large — honest score */}
            <R style={{gridColumn:'span 7'}}>
              <div style={{background:'var(--bg-1)',border:'1.5px solid var(--border)',borderRadius:'var(--radius-xl)',padding:'clamp(28px,4vw,44px)',height:'100%',position:'relative',overflow:'hidden',boxShadow:'var(--shadow-sm)',transition:'transform 0.3s cubic-bezier(0.22,1,0.36,1),box-shadow 0.3s ease'}}
                onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.transform='translateY(-4px)';(e.currentTarget as HTMLDivElement).style.boxShadow='var(--shadow-lg)'}}
                onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.transform='translateY(0)';(e.currentTarget as HTMLDivElement).style.boxShadow='var(--shadow-sm)'}}>
                <div style={{position:'absolute',top:-40,right:-40,width:200,height:200,borderRadius:'50%',background:'rgba(91,79,207,0.04)',filter:'blur(40px)'}}/>
                <EditorSeal label="ProductRating Certified"/>
                <h3 style={{fontSize:'clamp(20px,2.8vw,28px)',fontWeight:800,color:'var(--ink)',marginTop:18,marginBottom:12,letterSpacing:'-0.8px',lineHeight:1.2}}>One honest score.<br/>Across every platform.</h3>
                <p style={{fontSize:14,color:'var(--ink-3)',lineHeight:1.85,letterSpacing:'0.02em',fontWeight:300,maxWidth:380,marginBottom:28}}>We aggregate reviews from 8 Indian platforms and remove the fake ones. The score you see reflects what real buyers think.</p>
                {/* Rating comparison */}
                <div style={{display:'flex',gap:20,alignItems:'center',flexWrap:'wrap'}}>
                  <div style={{textAlign:'center'}}>
                    <div style={{fontSize:9,color:'var(--ink-4)',fontFamily:'var(--font-mono)',letterSpacing:'1px',textTransform:'uppercase',marginBottom:10}}>Platform shows</div>
                    <RatingArc score={4.7}/>
                    <div style={{fontSize:11,color:'var(--red)',marginTop:6,fontFamily:'var(--font-mono)',fontWeight:500}}>4.7 · with fakes</div>
                  </div>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--ink-4)" strokeWidth="1.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  <div style={{textAlign:'center'}}>
                    <div style={{fontSize:9,color:'var(--ink-4)',fontFamily:'var(--font-mono)',letterSpacing:'1px',textTransform:'uppercase',marginBottom:10}}>Real PR Score</div>
                    <RatingArc score={4.2}/>
                    <div style={{fontSize:11,color:'var(--accent)',marginTop:6,fontFamily:'var(--font-mono)',fontWeight:500}}>4.2 · AI-adjusted</div>
                  </div>
                </div>
                <div style={{marginTop:20,fontSize:11,color:'var(--ink-4)',fontFamily:'var(--font-mono)',letterSpacing:'0.3px'}}>38% of reviews removed on average</div>
              </div>
            </R>

            {/* Right 2 cards */}
            <div style={{gridColumn:'span 5',display:'flex',flexDirection:'column',gap:14}}>
              <R delay={0.1} style={{flex:1}}>
                <div style={{background:'var(--ink)',border:'1.5px solid var(--ink)',borderRadius:'var(--radius-xl)',padding:'clamp(22px,3vw,30px)',height:'100%',boxShadow:'var(--shadow-md)',transition:'transform 0.3s cubic-bezier(0.22,1,0.36,1)',cursor:'default'}}
                  onMouseEnter={e=>(e.currentTarget as HTMLDivElement).style.transform='translateY(-4px)'}
                  onMouseLeave={e=>(e.currentTarget as HTMLDivElement).style.transform='translateY(0)'}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round" style={{marginBottom:14}}><path d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  <h3 style={{fontSize:'clamp(17px,2.2vw,22px)',fontWeight:700,color:'#fff',marginBottom:10,letterSpacing:'-0.4px',lineHeight:1.2}}>Built for India's context</h3>
                  <p style={{fontSize:13,color:'rgba(255,255,255,0.55)',lineHeight:1.8,letterSpacing:'0.02em',fontWeight:300}}>Chennai heat. Delhi dust. Mumbai humidity. Recommendations that factor in your city's actual conditions.</p>
                  <div style={{marginTop:14,fontSize:10,color:'rgba(255,255,255,0.25)',fontFamily:'var(--font-mono)',letterSpacing:'0.5px',textTransform:'uppercase'}}>Tier 1 & 2 city intelligence</div>
                </div>
              </R>
              <R delay={0.2} style={{flex:1}}>
                <div style={{background:'var(--accent-bg)',border:'1.5px solid var(--accent-border)',borderRadius:'var(--radius-xl)',padding:'clamp(22px,3vw,30px)',height:'100%',boxShadow:'var(--shadow-sm)',transition:'transform 0.3s cubic-bezier(0.22,1,0.36,1)',cursor:'default'}}
                  onMouseEnter={e=>(e.currentTarget as HTMLDivElement).style.transform='translateY(-4px)'}
                  onMouseLeave={e=>(e.currentTarget as HTMLDivElement).style.transform='translateY(0)'}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" style={{marginBottom:14}}><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                  <h3 style={{fontSize:'clamp(17px,2.2vw,22px)',fontWeight:700,color:'var(--ink)',marginBottom:10,letterSpacing:'-0.4px',lineHeight:1.2}}>Voice in 22 languages</h3>
                  <p style={{fontSize:13,color:'var(--ink-3)',lineHeight:1.8,letterSpacing:'0.02em',fontWeight:300}}>Hindi, Tamil, Telugu, Bengali — ask in your language, get answers that understand India.</p>
                  <div style={{marginTop:14,fontSize:10,color:'var(--accent)',fontFamily:'var(--font-mono)',letterSpacing:'0.5px',textTransform:'uppercase'}}>All 22 scheduled languages</div>
                </div>
              </R>
            </div>
          </div>
        </div>
      </section>

      {/* Platform row */}
      <section style={{padding:'clamp(40px,5vw,64px) clamp(20px,5vw,40px)',background:'var(--bg-2)',borderTop:'1px solid var(--border)',borderBottom:'1px solid var(--border)'}}>
        <div style={{maxWidth:1120,margin:'0 auto'}}>
          <R>
            <p style={{fontSize:11,color:'var(--ink-4)',fontFamily:'var(--font-mono)',letterSpacing:'2px',textTransform:'uppercase',textAlign:'center',marginBottom:24}}>Signals from India's most-used marketplaces</p>
            <div style={{display:'flex',flexWrap:'wrap',gap:8,justifyContent:'center'}}>
              {PLATFORMS.map(p=>(
                <div key={p} style={{padding:'7px 16px',borderRadius:100,background:'var(--bg-1)',border:'1.5px solid var(--border)',boxShadow:'var(--shadow-xs)'}}>
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
            <p style={{fontSize:11,color:'var(--accent)',fontFamily:'var(--font-mono)',letterSpacing:'2px',textTransform:'uppercase',marginBottom:12}}>Process</p>
            <h2 style={{fontSize:'clamp(24px,4vw,44px)',fontWeight:800,color:'var(--ink)',letterSpacing:'-1.5px',lineHeight:1.08}}>From millions of reviews<br/>to one answer.</h2>
          </R>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:2,background:'var(--border)',borderRadius:'var(--radius-xl)',overflow:'hidden',boxShadow:'var(--shadow-sm)'}}>
            {[
              {n:'01',title:'Collect',desc:'Every review from 8+ Indian platforms, updated daily.',icon:'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4'},
              {n:'02',title:'Filter',desc:'AI detects and removes fake, paid, and bot-generated reviews.',icon:'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636'},
              {n:'03',title:'Score',desc:'One PR Score weighted by recency, credibility, and city context.',icon:'M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z'},
              {n:'04',title:'Answer',desc:'A clear recommendation with pros, cons, and direct buy links.',icon:'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'},
            ].map((s,i)=>(
              <R key={s.n} delay={i*0.1}>
                <div style={{background:'var(--bg-1)',padding:'32px 26px',height:'100%'}}>
                  <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:18}}>
                    <span style={{fontSize:11,color:'var(--ink-4)',fontFamily:'var(--font-mono)',letterSpacing:'0.5px'}}>{s.n}</span>
                    <div style={{flex:1,height:1,background:'var(--border)'}}/>
                  </div>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" style={{marginBottom:12}}><path d={s.icon}/></svg>
                  <h3 style={{fontSize:20,fontWeight:700,color:'var(--ink)',marginBottom:8,letterSpacing:'-0.4px'}}>{s.title}</h3>
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
