'use client'
export const dynamic = 'force-dynamic'
import { useState, Suspense, useRef, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Nav from '@/components/Nav'

type PlatformPrice = { platform:string; price:string; url:string; availability:string; isBrand?:boolean }
type NewerVersion = { name:string; reason:string; price_approx:string }
type AiProduct = { name:string; price:string; seller:string; rating:number; platform_rating:number; reviews:string; badge:string; reason:string; pros:string[]; cons:string[]; avoid_if:string; score?:number; platform_prices?:PlatformPrice[]; best_price?:string; best_price_platform?:string ; launch_date_india?:string; newer_version?:{name:string;reason:string;price_approx:string}|null }
type SerpProduct = { title:string; price:string; rating:number|null; source:string; link:string; thumbnail:string; delivery:string }

// Normalise platform display — never show brand/manufacturer sites
// Known Indian marketplaces only — any other name (brand stores, manufacturer sites) → 'Amazon'
const KNOWN_MARKETPLACES: Record<string, string> = {
  'amazon': 'Amazon', 'flipkart': 'Flipkart', 'croma': 'Croma',
  'reliance': 'Reliance Digital', 'vijay': 'Vijay Sales', 'tata': 'Tata Cliq',
  'meesho': 'Meesho', 'jio': 'JioMart', 'snapdeal': 'Snapdeal',
}
function normalisePlatform(platform: string): string {
  const p = platform.toLowerCase()
  for (const [key, display] of Object.entries(KNOWN_MARKETPLACES)) {
    if (p.includes(key)) return display
  }
  // Brand/manufacturer sites detected — show as Amazon
  return 'Amazon'
}
function getDirectUrl(seller:string,name:string):string{
  const q=encodeURIComponent(name),s=(seller||'').toLowerCase().trim()
  const map:[string[],(q:string)=>string][]=[
    [['amazon'],q=>`https://www.amazon.in/s?k=${q}`],[['flipkart'],q=>`https://www.flipkart.com/search?q=${q}`],
    [['nykaa'],q=>`https://www.nykaa.com/search/result/?q=${q}`],[['meesho'],q=>`https://www.meesho.com/search?q=${q}`],
    [['croma'],q=>`https://www.croma.com/searchB?q=${q}`],[['jiomart'],q=>`https://www.jiomart.com/search/${q}`],
    [['myntra'],q=>`https://www.myntra.com/${q}`],[['tata cliq','tatacliq'],q=>`https://www.tatacliq.com/search/?text=${q}`],
    [['reliance'],q=>`https://www.reliancedigital.in/search?q=${q}`],
  ]
  for(const [keys,fn] of map) if(keys.some(k=>s.includes(k))) return fn(q)
  return `https://www.amazon.in/s?k=${q}`
}

// Custom thin-line arc — not generic stars
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

// Bespoke editor seal
function EditorSeal({label}:{label:string}){
  return(
    <div style={{display:'inline-flex',alignItems:'center',gap:6,background:'var(--gold-bg)',border:'1px solid rgba(160,120,42,0.22)',borderRadius:'var(--radius-sm)',padding:'4px 10px'}}>
      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.8"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
      <span style={{fontSize:10,fontWeight:600,color:'var(--gold)',fontFamily:'var(--font-mono)',letterSpacing:'0.5px',textTransform:'uppercase'}}>{label}</span>
    </div>
  )
}


function AiCard({p,idx}:{p:AiProduct;idx:number}){
  const [open,setOpen]=useState(false)
  const buyUrl=getDirectUrl(p.seller,p.name)
  const platRating=Math.min(5,p.platform_rating||Math.min(5,p.rating+0.4))
  const aiRating=Math.min(5,Math.max(1,p.rating))
  const isTop=idx===0
  const rankLabel=['#1 Best Pick','#2 Runner Up','#3 Third Pick'][idx]||`#${idx+1}`

  return(
    <div style={{background:'var(--bg-1)',border:`1.5px solid ${isTop?'rgba(91,79,207,0.3)':'var(--border)'}`,borderRadius:'var(--radius-xl)',overflow:'hidden',transition:'transform 0.3s cubic-bezier(0.22,1,0.36,1),box-shadow 0.3s ease',boxShadow:isTop?'var(--shadow-lg)':'var(--shadow-sm)',animation:`card-in 0.5s ${idx*0.12}s ease both`,display:'flex',flexDirection:'column'}}
      onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.transform='translateY(-5px)';(e.currentTarget as HTMLDivElement).style.boxShadow='var(--shadow-xl)'}}
      onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.transform='translateY(0)';(e.currentTarget as HTMLDivElement).style.boxShadow=isTop?'var(--shadow-lg)':'var(--shadow-sm)'}}>

      {/* Rank header */}
      <div style={{padding:'11px 20px',background:isTop?'var(--accent-bg)':'var(--bg-2)',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <span style={{fontSize:10,fontWeight:700,color:isTop?'#4A3FBF':'#6B6560',fontFamily:'var(--font-mono)',letterSpacing:'1.5px',textTransform:'uppercase'}}>{rankLabel}</span>
        {isTop&&<EditorSeal label="Editor's Choice"/>}
      </div>

      <div style={{padding:'22px 22px 0',flex:1}}>
        {p.badge&&<span style={{display:'inline-block',fontSize:10,fontWeight:700,color:'#15803D',background:'rgba(22,163,74,0.08)',border:'1px solid rgba(22,163,74,0.25)',borderRadius:100,padding:'4px 14px',marginBottom:14,fontFamily:'var(--font-mono)',letterSpacing:'0.8px',textTransform:'uppercase'}}>● {p.badge}</span>}

        <h3 style={{fontWeight:700,fontSize:19,color:'#0D0D0C',lineHeight:1.25,letterSpacing:'-0.5px',marginBottom:14}}>{p.name}</h3>

          {/* Launch date badge */}
          {p.launch_date_india&&(
            <span style={{display:'inline-block',fontSize:10,color:'var(--ink-4)',fontFamily:'var(--font-mono)',letterSpacing:'0.5px',textTransform:'uppercase',background:'var(--bg-2)',border:'1px solid var(--border)',borderRadius:4,padding:'2px 8px',marginBottom:10}}>🗓 India launch: {p.launch_date_india}</span>
          )}

        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20,flexWrap:'wrap'}}>
          <span style={{fontSize:30,fontWeight:800,color:isTop?'#4A3FBF':'#0D0D0C',letterSpacing:'-2px',fontFamily:'var(--font-sans)'}}>{p.price}</span>
          
        </div>

        {/* Score block */}
        <div style={{background:'#F4F3FF',borderRadius:14,padding:20,marginBottom:16,border:'1px solid rgba(91,79,207,0.12)'}}>
          <div style={{display:'flex',gap:18,alignItems:'flex-start',marginBottom:14}}>
            <div>
              <div style={{fontSize:10,color:'var(--ink-2)',fontFamily:'var(--font-mono)',letterSpacing:'0.8px',textTransform:'uppercase',fontWeight:500,marginBottom:8}}>PR Score · {(p.reviews||'—').replace(/\s*\([^)]*\)/g,'')} reviews</div>
              <RatingArc score={aiRating} size={60}/>
            </div>
            <div style={{flex:1,paddingTop:4}}>
              {/* Custom progress bar */}
              <div style={{marginBottom:12}}>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'var(--ink-2)',fontFamily:'var(--font-mono)',marginBottom:6,fontWeight:500}}>
                  <span>AI-adjusted score</span><span>{aiRating.toFixed(1)}/5</span>
                </div>
                <div style={{height:4,background:'var(--bg-3)',borderRadius:2,overflow:'hidden'}}>
                  <div style={{height:'100%',width:`${(aiRating/5)*100}%`,background:'linear-gradient(90deg,var(--accent),var(--accent-2))',borderRadius:2,transition:'width 1s cubic-bezier(0.22,1,0.36,1)'}}/>
                </div>
              </div>
              {/* Platform vs real */}
              <div style={{background:'#FFFFFF',borderRadius:10,padding:'12px 14px',border:'1px solid rgba(0,0,0,0.08)',display:'flex',alignItems:'center',gap:8,fontSize:12,boxShadow:'0 1px 4px rgba(0,0,0,0.04)'}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:9,color:'var(--ink-4)',fontFamily:'var(--font-mono)',letterSpacing:'0.5px',marginBottom:3,textTransform:'uppercase'}}>Platform</div>
                  <span style={{color:'#C0392B',fontWeight:700,fontSize:16}}>{platRating.toFixed(1)}</span><span style={{color:'var(--ink-3)',fontSize:11,marginLeft:4,fontWeight:400}}>with fakes</span>
                </div>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--ink-4)" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                <div style={{flex:1}}>
                  <div style={{fontSize:9,color:'var(--ink-4)',fontFamily:'var(--font-mono)',letterSpacing:'0.5px',marginBottom:3,textTransform:'uppercase'}}>Real</div>
                  <span style={{color:'#16A34A',fontWeight:700,fontSize:16}}>{aiRating.toFixed(1)}</span><span style={{color:'var(--ink-3)',fontSize:11,marginLeft:4,fontWeight:400}}>AI-adjusted</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Why this result */}
        {p.reason&&(
          <div style={{marginBottom:14,padding:'12px 16px',background:'var(--accent-bg)',borderRadius:'var(--radius)',borderLeft:'2.5px solid var(--accent)'}}>
            <div style={{fontSize:10,color:'#4A3FBF',fontFamily:'var(--font-mono)',letterSpacing:'1.5px',textTransform:'uppercase',fontWeight:700,marginBottom:6}}>Why this result</div>
            <p style={{fontSize:13,color:'#3D3A36',lineHeight:1.75,letterSpacing:'0.01em',fontWeight:400}}>{p.reason}</p>
          </div>
        )}

        {/* Pros / Cons / Avoid if — collapsed by default, toggle to reveal all */}
        {(p.pros?.length>0||p.cons?.length>0||p.avoid_if)&&(
          <div style={{marginBottom:4}}>
            <button onClick={()=>setOpen(v=>!v)}
              style={{fontSize:11,color:'#57534E',fontWeight:600,background:'none',border:'none',cursor:'pointer',padding:'0 0 10px',display:'flex',alignItems:'center',gap:6,fontFamily:'var(--font-mono)',letterSpacing:'1px',textTransform:'uppercase',transition:'color 0.2s'}}
              onMouseEnter={e=>(e.currentTarget.style.color='var(--ink)')}
              onMouseLeave={e=>(e.currentTarget.style.color='#57534E')}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{transform:open?'rotate(90deg)':'rotate(0)',transition:'transform 0.2s'}}><path d="M9 18l6-6-6-6"/></svg>
              {open?'Hide details':'Pros · Cons · Avoid if'}
            </button>
            {open&&(
              <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:8}}>
                {p.pros?.length>0&&(
                  <div style={{background:'var(--green-bg)',border:'1px solid rgba(22,163,74,0.15)',borderRadius:'var(--radius)',padding:'12px 16px'}}>
                    <div style={{fontSize:9,color:'var(--green)',fontFamily:'var(--font-mono)',letterSpacing:'1px',textTransform:'uppercase',marginBottom:8}}>Pros</div>
                    {p.pros.map((pro,i)=><div key={i} style={{fontSize:13,color:'var(--ink-2)',display:'flex',gap:8,marginBottom:i<p.pros.length-1?6:0,lineHeight:1.7,letterSpacing:'0.01em',fontWeight:400}}><span style={{color:'var(--green)',flexShrink:0}}>+</span>{pro}</div>)}
                  </div>
                )}
                {p.cons?.length>0&&(
                  <div style={{background:'rgba(220,38,38,0.04)',border:'1px solid rgba(220,38,38,0.12)',borderRadius:'var(--radius)',padding:'12px 16px'}}>
                    <div style={{fontSize:9,color:'var(--red)',fontFamily:'var(--font-mono)',letterSpacing:'1px',textTransform:'uppercase',marginBottom:8}}>Cons</div>
                    {p.cons.map((con,i)=><div key={i} style={{fontSize:13,color:'var(--ink-2)',display:'flex',gap:8,lineHeight:1.7,letterSpacing:'0.01em',fontWeight:400,marginBottom:i<p.cons.length-1?6:0}}><span style={{color:'var(--red)',flexShrink:0}}>−</span>{con}</div>)}
                  </div>
                )}
                {p.avoid_if&&(
                  <div style={{background:'var(--gold-bg)',border:'1px solid rgba(160,120,42,0.15)',borderRadius:'var(--radius)',padding:'12px 16px'}}>
                    <span style={{fontSize:9,color:'var(--gold)',fontFamily:'var(--font-mono)',letterSpacing:'1px',textTransform:'uppercase'}}>Avoid if — </span>
                    <span style={{fontSize:13,color:'var(--ink-2)',lineHeight:1.7,letterSpacing:'0.01em',fontWeight:400}}>{p.avoid_if}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Newer version notice */}
      {p.newer_version?.name&&(
        <div style={{margin:'0 18px 14px',background:'rgba(91,79,207,0.04)',border:'1px solid rgba(91,79,207,0.2)',borderRadius:'var(--radius)',padding:'10px 14px'}}>
          <div style={{display:'flex',alignItems:'flex-start',gap:8}}>
            <span style={{fontSize:14,flexShrink:0}}>⚡</span>
            <div>
              <div style={{fontSize:10,color:'var(--accent)',fontFamily:'var(--font-mono)',letterSpacing:'1px',textTransform:'uppercase',marginBottom:4,fontWeight:600}}>Newer version available</div>
              <div style={{fontSize:13,color:'var(--ink)',fontWeight:600,marginBottom:2}}>{p.newer_version.name}</div>
              <div style={{fontSize:12,color:'var(--ink-3)',lineHeight:1.5}}>{p.newer_version.reason}</div>
              {p.newer_version.price_approx&&<div style={{fontSize:12,color:'var(--accent)',fontWeight:500,marginTop:4}}>~{p.newer_version.price_approx}</div>}
            </div>
          </div>
        </div>
      )}

      {/* Skyscanner-style price comparison */}
      <div style={{borderTop:'1px solid var(--border)',background:'var(--bg-2)'}}>
        {/* Best price headline */}
        <div style={{padding:'10px 18px 6px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{display:'flex',alignItems:'center',gap:7}}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
            <span style={{fontSize:10,color:'var(--green)',fontFamily:'var(--font-mono)',letterSpacing:'1px',textTransform:'uppercase',fontWeight:600}}>Best price</span>
          </div>
          <span style={{fontSize:18,fontWeight:800,color:'var(--green)',letterSpacing:'-0.8px'}}>
            {p.best_price || p.price}
          </span>
        </div>

        {/* Platform price list */}
        {p.platform_prices && p.platform_prices.length > 0 ? (
          <div style={{display:'flex',flexDirection:'column',gap:1}}>
            {p.platform_prices.map((pp, pi) => {
              const isLowest = pi === 0
              const priceNum = parseInt(pp.price.replace(/[^\d]/g,'')) || 0
              const bestNum = parseInt((p.best_price||p.price).replace(/[^\d]/g,'')) || priceNum
              const diff = priceNum - bestNum
              return (
                <a key={pi} href={pp.url} target="_blank" rel="noopener noreferrer"
                  style={{
                    display:'flex',alignItems:'center',justifyContent:'space-between',
                    padding:'9px 18px',
                    background:isLowest?'rgba(22,163,74,0.05)':'var(--bg-1)',
                    borderTop:'1px solid var(--border)',
                    textDecoration:'none',
                    transition:'background 0.2s',
                  }}
                  onMouseEnter={e=>(e.currentTarget.style.background=isLowest?'rgba(22,163,74,0.09)':'var(--bg-2)')}
                  onMouseLeave={e=>(e.currentTarget.style.background=isLowest?'rgba(22,163,74,0.05)':'var(--bg-1)')}>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    {isLowest && <svg width="8" height="8" viewBox="0 0 24 24" fill="var(--green)"><circle cx="12" cy="12" r="10"/></svg>}
                    <span style={{fontSize:13,fontWeight:isLowest?600:400,color:isLowest?'var(--ink)':'var(--ink-2)',letterSpacing:'0.01em'}}>{normalisePlatform(pp.platform)}</span>
                    {isLowest && <span style={{fontSize:9,color:'var(--green)',fontFamily:'var(--font-mono)',letterSpacing:'0.5px',textTransform:'uppercase',background:'rgba(22,163,74,0.1)',padding:'2px 6px',borderRadius:4}}>LOWEST</span>}
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <span style={{fontSize:14,fontWeight:700,color:isLowest?'var(--green)':'var(--ink-2)',letterSpacing:'-0.5px'}}>{pp.price}</span>
                    {!isLowest && diff > 0 && <span style={{fontSize:10,color:'var(--ink-4)',fontFamily:'var(--font-mono)'}}>+₹{diff.toLocaleString('en-IN')}</span>}
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--ink-4)" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/></svg>
                  </div>
                </a>
              )
            })}
          </div>
        ) : (
          /* Fallback single buy button */
          <a href={buyUrl} target="_blank" rel="noopener noreferrer"
            style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,padding:'13px 22px',background:isTop?'var(--accent)':'var(--bg-1)',color:isTop?'#fff':'var(--ink-2)',fontSize:13,fontWeight:600,letterSpacing:'0.02em',textDecoration:'none',transition:'all 0.2s',borderTop:'1px solid var(--border)'}}
            onMouseEnter={e=>{e.currentTarget.style.background=isTop?'#4A3FBF':'var(--bg-2)'}}
            onMouseLeave={e=>{e.currentTarget.style.background=isTop?'var(--accent)':'var(--bg-1)'}}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            Find Best Price on Amazon
          </a>
        )}
      </div>
    </div>
  )
}

function SerpCard({p}:{p:SerpProduct}){
  const url=getDirectUrl(p.source,p.title)
  return(
    <a href={url} target="_blank" rel="noopener noreferrer"
      style={{display:'flex',gap:14,padding:'14px 18px',background:'var(--bg-1)',border:'1.5px solid var(--border)',borderRadius:'var(--radius)',textDecoration:'none',transition:'all 0.2s cubic-bezier(0.22,1,0.36,1)',alignItems:'flex-start',boxShadow:'var(--shadow-xs)'}}
      onMouseEnter={e=>{(e.currentTarget as HTMLAnchorElement).style.transform='translateX(4px)';(e.currentTarget as HTMLAnchorElement).style.borderColor='var(--accent-border)';(e.currentTarget as HTMLAnchorElement).style.boxShadow='var(--shadow-sm)'}}
      onMouseLeave={e=>{(e.currentTarget as HTMLAnchorElement).style.transform='translateX(0)';(e.currentTarget as HTMLAnchorElement).style.borderColor='var(--border)';(e.currentTarget as HTMLAnchorElement).style.boxShadow='var(--shadow-xs)'}}>
      {p.thumbnail&&<img src={p.thumbnail} alt="" style={{width:52,height:52,objectFit:'contain',borderRadius:'var(--radius-sm)',background:'var(--bg-2)',flexShrink:0,border:'1px solid var(--border)',filter:'saturate(0.9)'}} onError={e=>{(e.target as HTMLImageElement).style.display='none'}}/>}
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:13,fontWeight:400,color:'var(--ink-2)',lineHeight:1.5,marginBottom:5,letterSpacing:'0.01em'}}>{p.title}</div>
        <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
          <span style={{fontSize:18,fontWeight:800,color:'var(--ink)',letterSpacing:'-0.8px'}}>{p.price}</span>
          <span style={{fontSize:11,color:'var(--ink-4)',fontFamily:'var(--font-mono)',letterSpacing:'0.3px'}}>{p.source}</span>
          {p.rating&&<span style={{fontSize:11,color:'var(--green)',fontFamily:'var(--font-mono)',fontWeight:500}}>{Math.min(5,p.rating).toFixed(1)}/5</span>}
        </div>
      </div>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--ink-4)" strokeWidth="1.8" style={{flexShrink:0,marginTop:3}}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
    </a>
  )
}

function SearchResults(){
  const sp=useSearchParams(),router=useRouter()
  const query=sp.get('q')||''
  const [input,setInput]=useState(query)
  // Sync input box when URL query param changes (e.g. from example pill clicks)
  useEffect(()=>{if(query)setInput(query)},[query])
  const [loading,setLoading]=useState(false)
  const [called,setCalled]=useState(false)
  const [answer,setAnswer]=useState('')
  const [aiProducts,setAiProducts]=useState<AiProduct[]>([])
  const [serpProducts,setSerpProducts]=useState<SerpProduct[]>([])
  const [related,setRelated]=useState<string[]>([])
  const [recState,setRecState]=useState<'idle'|'recording'|'processing'|'error'>('idle')
  const [voiceError,setVoiceError]=useState('')
  const [transcript,setTranscript]=useState('')
  const [dots,setDots]=useState(1)
  const mediaRef=useRef<MediaRecorder|null>(null)
  const chunksRef=useRef<Blob[]>([])
  const streamRef=useRef<MediaStream|null>(null)
  const lastSearchedRef=useRef<string>('')  // deduplication — prevent same query firing twice

  const doSearch=async(q:string)=>{
    if(!q.trim()||loading)return  // loading guard prevents double calls
    setLoading(true);setAnswer('');setAiProducts([]);setSerpProducts([]);setRelated([])
    try{const r=await fetch('/api/ask',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question:q})});const d=await r.json();if(d.isOutOfScope){setAnswer('__OUT_OF_SCOPE__');setAiProducts([]);setSerpProducts([]);setRelated([]);setLoading(false);return;}
      const ans = String(d.answer||'').replace(/^(advice:|note:)\s*/i,'').trim()
      setAnswer(ans);setAiProducts(d.aiProducts||[]);setSerpProducts(d.serpProducts||[]);setRelated(d.relatedSearches||[])}
    catch{setAnswer('Something went wrong. Please try again.')}finally{setLoading(false)}
  }
  useEffect(()=>{
    if(query&&query.trim()&&!loading&&query!==lastSearchedRef.current){
      lastSearchedRef.current=query
      doSearch(query)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[query])
  const submit=(q?:string)=>{const t=(q||input).trim();if(!t)return;setInput(t);router.push(`/search?q=${encodeURIComponent(t)}`)}

  const stopRec=()=>{if(mediaRef.current?.state!=='inactive')mediaRef.current?.stop();streamRef.current?.getTracks().forEach(t=>t.stop());setRecState('processing')}
  const startRec=async()=>{
    setVoiceError('');setTranscript('')
    if(!navigator.mediaDevices?.getUserMedia){setRecState('error');setVoiceError('Use Chrome.');return}
    let stream:MediaStream
    try{stream=await navigator.mediaDevices.getUserMedia({audio:true});streamRef.current=stream}
    catch{setRecState('error');setVoiceError('Mic access denied.');return}
    const mimes=['audio/webm;codecs=opus','audio/webm','audio/ogg;codecs=opus','audio/ogg']
    const mime=mimes.find(m=>MediaRecorder.isTypeSupported(m))||''
    const rec=mime?new MediaRecorder(stream,{mimeType:mime}):new MediaRecorder(stream)
    mediaRef.current=rec;chunksRef.current=[]
    rec.ondataavailable=e=>{if(e.data?.size>0)chunksRef.current.push(e.data)}
    rec.onstop=async()=>{
      const total=chunksRef.current.reduce((s,c)=>s+c.size,0)
      if(!total){setRecState('error');setVoiceError('No audio captured.');return}
      const bt=mime?mime.split(';')[0]:'audio/webm'
      const blob=new Blob(chunksRef.current,{type:bt})
      const form=new FormData();form.append('file',blob,`rec.${bt.includes('ogg')?'ogg':'webm'}`)
      try{const r=await fetch('/api/ask',{method:'POST',body:form});const d=await r.json();if(d.transcript){setTranscript(d.transcript);setInput(d.transcript);setRecState('idle');submit(d.transcript)}else{setRecState('error');setVoiceError(d.error||'Try again.')}}
      catch{setRecState('error');setVoiceError('Network error.')}
    }
    rec.start(200);setRecState('recording')
  }
  const toggleMic=()=>recState==='recording'?stopRec():startRec()
  const isRec=recState==='recording',isProc=recState==='processing',isBusy=isRec||isProc

  return(
    <div style={{maxWidth:1040,margin:'0 auto',padding:'clamp(70px,8vw,84px) clamp(16px,4vw,24px) 100px'}}>



      {/* Sticky search */}
      <div style={{position:'sticky',top:56,zIndex:60,paddingTop:12,paddingBottom:12,background:'rgba(255,255,255,1)',backdropFilter:'blur(20px)'}}>
        <div style={{display:'flex',alignItems:'center',gap:8,background:'var(--bg-1)',border:`1.5px solid ${isRec?'rgba(220,38,38,0.4)':'var(--border-hi)'}`,borderRadius:18,padding:'5px 5px 5px 18px',boxShadow:'var(--shadow-md)',transition:'border-color 0.2s'}}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--ink-4)" strokeWidth="2.5" strokeLinecap="round" style={{flexShrink:0}}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input value={isRec?('Listening'+'.'.repeat(dots)):isProc?'Transcribing...':input} onChange={e=>{if(!isBusy)setInput(e.target.value)}} onKeyDown={e=>e.key==='Enter'&&!isBusy&&submit()} placeholder="Search any product..." readOnly={isBusy}
            style={{flex:1,border:'none',outline:'none',fontSize:15,fontWeight:300,letterSpacing:'0.02em',color:isRec?'var(--red)':'var(--ink)',background:'transparent',fontFamily:'var(--font-sans)',padding:'12px 0',minWidth:0,caretColor:'var(--accent)'}}/>
          <button onClick={toggleMic} disabled={isProc}
            style={{width:42,height:42,borderRadius:12,border:'1px solid var(--border)',flexShrink:0,background:isRec?'rgba(220,38,38,0.07)':'var(--bg-2)',cursor:isProc?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.2s',animation:isRec?'mic-ring 1.2s ease infinite':'none'}}>
            {isProc?<div style={{width:14,height:14,border:'1.5px solid var(--ink-4)',borderTopColor:'var(--accent)',borderRadius:'50%',animation:'spin .8s linear infinite'}}/>
              :isRec?<svg width="11" height="11" viewBox="0 0 24 24" fill="var(--red)"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
              :<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" strokeWidth="2" strokeLinecap="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>}
          </button>
          <button onClick={()=>submit()} disabled={!input.trim()||isBusy}
            style={{padding:'0 22px',height:42,borderRadius:12,background:input.trim()&&!isBusy?'var(--accent)':'var(--bg-3)',color:input.trim()&&!isBusy?'#fff':'var(--ink-4)',fontWeight:600,border:'none',cursor:!input.trim()||isBusy?'not-allowed':'pointer',fontSize:13,transition:'all 0.2s',whiteSpace:'nowrap',flexShrink:0,boxShadow:input.trim()&&!isBusy?'0 2px 8px rgba(91,79,207,0.25)':'none'}}>
            Search
          </button>
        </div>
        {recState==='error'&&voiceError&&<div style={{marginTop:6,fontSize:12,color:'var(--red)',padding:'5px 2px',letterSpacing:'0.01em'}}>⚠️ {voiceError}</div>}
        {transcript&&!isBusy&&<div style={{marginTop:6,fontSize:12,color:'var(--green)',padding:'5px 2px'}}>✓ You said: {transcript}</div>}
      </div>

      <style>{`
        @keyframes card-in{from{opacity:0;transform:translateY(18px) scale(0.98)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes mic-ring{0%,100%{box-shadow:0 0 0 2px rgba(220,38,38,0.2)}50%{box-shadow:0 0 0 8px rgba(220,38,38,0.03)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes dot-bounce{0%,80%,100%{transform:scale(0.6);opacity:0.3}40%{transform:scale(1);opacity:1}}
        @keyframes wave-bar{from{transform:scaleY(0.3)}to{transform:scaleY(1)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0.2}}
        @media(max-width:640px){
          .verdict-name{max-width:140px !important;}
          .ai-card-grid{grid-template-columns:1fr !important;}
          .serp-card{padding:12px 14px !important;}
        }
        .reveal{opacity:0;transform:translateY(26px);transition:opacity .65s cubic-bezier(0.22,1,0.36,1),transform .65s cubic-bezier(0.22,1,0.36,1)}
        .reveal.visible{opacity:1;transform:translateY(0)}
      `}</style>

      {loading&&(
        <div style={{textAlign:'center',padding:'96px 0'}}>
          <div style={{display:'flex',gap:8,justifyContent:'center',marginBottom:20}}>
            {[0,1,2].map(i=><div key={i} style={{width:9,height:9,borderRadius:'50%',background:'var(--accent)',animation:`dot-bounce 1.2s ${i*0.2}s infinite ease-in-out`}}/>)}
          </div>
          <div style={{fontSize:11,color:'var(--ink-4)',fontFamily:'var(--font-mono)',letterSpacing:'1.5px',textTransform:'uppercase'}}>Analysing reviews · Removing fakes · Computing PR Score</div>
        </div>
      )}

      {!loading&&answer&&(
        <div>
          {/* Query heading */}
          <div style={{marginBottom:24,paddingBottom:20,borderBottom:'1px solid var(--border)',marginTop:8}}>
            <h1 style={{fontSize:'clamp(20px,3.5vw,28px)',fontWeight:700,color:'var(--ink)',letterSpacing:'-0.8px',marginBottom:8,lineHeight:1.2}}>{query||input}</h1>
            <div style={{display:'flex',gap:14,flexWrap:'wrap'}}>
              {['AI-adjusted ratings','Fake reviews removed','All scores out of 5'].map(t=>(
                <span key={t} style={{fontSize:10,color:'var(--ink-4)',fontFamily:'var(--font-mono)',letterSpacing:'0.5px',textTransform:'uppercase',display:'flex',alignItems:'center',gap:4}}>
                  <span style={{width:3,height:3,borderRadius:'50%',background:'var(--accent)',display:'inline-block'}}/>
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* AI answer */}
          <div style={{background:'var(--accent-bg)',border:'1.5px solid var(--accent-border)',borderLeft:'3px solid var(--accent)',borderRadius:'var(--radius)',padding:'16px 20px',marginBottom:32}}>
            <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:9}}>
              <span style={{width:5,height:5,borderRadius:'50%',background:'var(--accent)',display:'inline-block',animation:'blink 2s infinite'}}/>
              <span style={{fontSize:9,color:'var(--accent)',fontFamily:'var(--font-mono)',letterSpacing:'1.5px',textTransform:'uppercase'}}>AI Analysis · ProductRating</span>
            </div>
            <p style={{color:'var(--ink-2)',lineHeight:1.85,margin:0,fontSize:14,letterSpacing:'0.02em',fontWeight:300}}>{answer}</p>
          </div>

          {/* Product cards */}
          {aiProducts.length>0&&(
            <div style={{marginBottom:44}}>
              <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20}}>
                <h2 style={{fontSize:18,fontWeight:700,color:'var(--ink)',letterSpacing:'-0.4px'}}>Top Recommendations</h2>
                <span style={{fontSize:9,color:'var(--ink-4)',fontFamily:'var(--font-mono)',border:'1px solid var(--border)',borderRadius:4,padding:'3px 10px',letterSpacing:'1px',textTransform:'uppercase'}}>AI Ranked</span>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(min(100%,280px),1fr))',gap:16}}>
                {aiProducts.map((p,i)=><AiCard key={i} p={p} idx={i}/>)}
              </div>

              {/* Verdict bar — bottom of cards, no overlap */}
              {aiProducts[0] && (
                <div style={{marginTop:20,background:'#FFFFFF',border:'1.5px solid rgba(91,79,207,0.2)',borderRadius:16,padding:'16px 20px',display:'flex',alignItems:'center',gap:16,flexWrap:'wrap',boxShadow:'0 4px 16px rgba(91,79,207,0.1)'}}>
                  <div style={{display:'flex',alignItems:'center',gap:10,flex:1,minWidth:0}}>
                    <span style={{fontSize:22,fontWeight:800,color:'var(--accent)',letterSpacing:'-1px',flexShrink:0}}>{aiProducts[0].rating.toFixed(1)}</span>
                    <div style={{minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:600,color:'var(--ink)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{aiProducts[0].name}</div>
                      <div style={{fontSize:11,color:'var(--ink-4)',fontFamily:'var(--font-mono)',letterSpacing:'0.3px'}}>#1 Best Pick · {aiProducts[0].price}</div>
                    </div>
                  </div>
                  <a href={getDirectUrl(aiProducts[0].seller,aiProducts[0].name)} target="_blank" rel="noopener noreferrer"
                    style={{display:'inline-flex',alignItems:'center',gap:7,background:'var(--accent)',color:'#fff',fontSize:13,fontWeight:600,padding:'10px 22px',borderRadius:10,textDecoration:'none',letterSpacing:'0.02em',flexShrink:0,transition:'background 0.25s',boxShadow:'0 2px 10px rgba(91,79,207,0.3)'}}
                    onMouseEnter={e=>(e.currentTarget.style.background='#4A3FBF')}
                    onMouseLeave={e=>(e.currentTarget.style.background='var(--accent)')}>
                    Check Price
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Live prices */}
          {serpProducts.length>0&&(
            <div style={{marginBottom:44}}>
              <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
                <h2 style={{fontSize:16,fontWeight:600,color:'var(--ink-2)',letterSpacing:'-0.2px'}}>Live Prices</h2>
                <span style={{fontSize:9,color:'var(--ink-4)',fontFamily:'var(--font-mono)',border:'1px solid var(--border)',borderRadius:4,padding:'3px 10px',letterSpacing:'1px',textTransform:'uppercase'}}>Direct Links</span>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {serpProducts.slice(0,5).map((p,i)=><SerpCard key={i} p={p}/>)}
              </div>
            </div>
          )}

          {/* Related */}
          {related.length>0&&(
            <div style={{paddingTop:24,borderTop:'1px solid var(--border)'}}>
              <p style={{fontSize:9,color:'var(--ink-4)',fontFamily:'var(--font-mono)',letterSpacing:'1.5px',textTransform:'uppercase',marginBottom:14}}>Related Searches</p>
              <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
                {related.map((r,i)=>(
                  <button key={i} onClick={()=>submit(r)}
                    style={{padding:'7px 16px',borderRadius:100,background:'transparent',border:'1.5px solid var(--border-hi)',color:'var(--ink-3)',fontSize:13,cursor:'pointer',transition:'all 0.2s',fontFamily:'var(--font-sans)',fontWeight:300,letterSpacing:'0.01em'}}
                    onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor='var(--accent)';(e.currentTarget as HTMLButtonElement).style.color='var(--accent)';(e.currentTarget as HTMLButtonElement).style.transform='translateY(-1px)'}}
                    onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor='var(--border-hi)';(e.currentTarget as HTMLButtonElement).style.color='var(--ink-3)';(e.currentTarget as HTMLButtonElement).style.transform='translateY(0)'}}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!loading&&answer==='__OUT_OF_SCOPE__'&&(
        <div style={{textAlign:'center',padding:'72px 20px',maxWidth:520,margin:'0 auto'}}>
          <div style={{width:64,height:64,background:'var(--gold-bg)',borderRadius:18,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 20px',border:'1.5px solid rgba(160,120,42,0.2)'}}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <h3 style={{fontSize:20,fontWeight:700,color:'var(--ink)',marginBottom:10,letterSpacing:'-0.4px'}}>Electronics only — for now</h3>
          <p style={{fontSize:15,color:'var(--ink-3)',lineHeight:1.75,marginBottom:24,fontWeight:300}}>ProductRating.in currently covers <strong>electronics only</strong> — phones, laptops, TVs, ACs, appliances, audio &amp; more. Try asking in Hindi, Tamil, Telugu or any Indian language too!</p>
          <div style={{display:'flex',flexWrap:'wrap',gap:8,justifyContent:'center'}}>
            {['Best phone under ₹20,000','बेस्ट मोबाइल ₹15,000 में','Best AC for Chennai','Best TWS earbuds','Best 4K TV under ₹50,000'].map(ex=>(
              <button key={ex} onClick={()=>submit(ex)}
                style={{padding:'8px 16px',borderRadius:100,fontSize:13,fontWeight:400,background:'var(--bg-2)',border:'1.5px solid var(--border-hi)',color:'var(--ink-2)',cursor:'pointer',transition:'all 0.25s',letterSpacing:'0.01em'}}
                onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor='var(--accent)';(e.currentTarget as HTMLButtonElement).style.color='var(--accent)'}}
                onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor='var(--border-hi)';(e.currentTarget as HTMLButtonElement).style.color='var(--ink-2)'}}>
                {ex}
              </button>
            ))}
          </div>
        </div>
      )}

      {!loading&&!answer&&!called&&(
        <div style={{textAlign:'center',padding:'96px 0'}}>
          <div style={{width:56,height:56,background:'var(--accent-bg)',borderRadius:16,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px'}}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          </div>
          <p style={{fontSize:18,fontWeight:600,color:'var(--ink-3)',marginBottom:8,letterSpacing:'-0.3px'}}>Ask anything about electronics</p>
          <p style={{fontSize:11,color:'var(--ink-4)',fontFamily:'var(--font-mono)',letterSpacing:'1px',textTransform:'uppercase'}}>Phones · Laptops · TVs · ACs · Appliances · Audio</p>
        </div>
      )}

      {/* Mobile floating mic */}
      <button onClick={toggleMic} disabled={isProc} className="mobile-fab"
        style={{position:'fixed',bottom:24,right:20,width:52,height:52,borderRadius:'50%',border:'none',background:isRec?'var(--red)':'var(--accent)',cursor:isProc?'not-allowed':'pointer',display:'none',alignItems:'center',justifyContent:'center',boxShadow:'0 8px 24px rgba(91,79,207,0.35)',zIndex:99,transition:'all 0.3s cubic-bezier(0.22,1,0.36,1)'}}>
        {isProc?<div style={{width:18,height:18,border:'2px solid rgba(255,255,255,0.4)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin .8s linear infinite'}}/>
          :isRec?<svg width="15" height="15" viewBox="0 0 24 24" fill="#fff"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
          :<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>}
        <style>{`.mobile-fab{display:none!important}@media(max-width:768px){.mobile-fab{display:flex!important}}`}</style>
      </button>
    </div>
  )
}

export default function SearchPage(){
  return(
    <div style={{minHeight:'100vh',background:'var(--bg)',fontFamily:'var(--font-sans)'}}>
      <Nav/>
      <Suspense fallback={<div style={{padding:'96px 20px',textAlign:'center',color:'var(--ink-4)',fontFamily:'var(--font-mono)',letterSpacing:'1px',textTransform:'uppercase',fontSize:11}}>Loading...</div>}>
        <SearchResults/>
      </Suspense>
    </div>
  )
}
