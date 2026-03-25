'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { detectLocation, getCachedLocation, cacheLocation, type LocationData } from '@/lib/useLocation'

const TRENDING = [
  'Best AC under ₹40,000',
  'Best phone under ₹20,000',
  'Best laptop for students',
  'Best washing machine India',
  'Best TWS earbuds 2025',
  'Best refrigerator under ₹30,000',
]

const SOURCES = ['Amazon', 'Flipkart', 'Nykaa', 'Croma', 'Meesho', 'JioMart', 'Myntra', 'Tata Cliq']

export default function Hero() {
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const [recState, setRecState] = useState<'idle'|'recording'|'processing'|'error'>('idle')
  const [voiceMsg, setVoiceMsg] = useState('')
  const [transcript, setTranscript] = useState('')
  const [dots, setDots] = useState(1)
  const [location, setLocation] = useState<LocationData|null>(null)
  const mediaRef = useRef<MediaRecorder|null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream|null>(null)
  const router = useRouter()

  useEffect(() => {
    const cached = getCachedLocation()
    if (cached?.city) { setLocation(cached); return }
    detectLocation().then(loc => { if (loc?.city) { setLocation(loc); cacheLocation(loc) } })
  }, [])

  useEffect(() => {
    if (recState !== 'recording') return
    const id = setInterval(() => setDots(d => d >= 3 ? 1 : d + 1), 450)
    return () => clearInterval(id)
  }, [recState])

  const go = (q?: string) => {
    const t = (q || query).trim()
    if (t) router.push(`/search?q=${encodeURIComponent(t)}`)
  }

  const stopRec = () => {
    mediaRef.current?.stop()
    streamRef.current?.getTracks().forEach(t => t.stop())
    setRecState('processing')
  }

  const startRec = async () => {
    setTranscript(''); setVoiceMsg('')
    if (!navigator.mediaDevices?.getUserMedia) { setRecState('error'); setVoiceMsg('Not supported. Use Chrome.'); return }
    let stream: MediaStream
    try { stream = await navigator.mediaDevices.getUserMedia({ audio:true }); streamRef.current = stream }
    catch { setRecState('error'); setVoiceMsg('Mic access denied. Allow in browser settings.'); return }
    const mimes = ['audio/webm;codecs=opus','audio/webm','audio/ogg;codecs=opus','audio/ogg']
    const mime = mimes.find(m => MediaRecorder.isTypeSupported(m)) || ''
    const rec = mime ? new MediaRecorder(stream,{mimeType:mime}) : new MediaRecorder(stream)
    mediaRef.current = rec; chunksRef.current = []
    rec.ondataavailable = e => { if (e.data?.size>0) chunksRef.current.push(e.data) }
    rec.onstop = async () => {
      const total = chunksRef.current.reduce((s,c)=>s+c.size,0)
      if (!total) { setRecState('error'); setVoiceMsg('No audio detected. Try again.'); return }
      const bt = mime ? mime.split(';')[0] : 'audio/webm'
      const blob = new Blob(chunksRef.current,{type:bt})
      const form = new FormData()
      form.append('file', blob, `rec.${bt.includes('ogg')?'ogg':'webm'}`)
      try {
        const r = await fetch('/api/ask',{method:'POST',body:form})
        const d = await r.json()
        if (d.transcript) { setTranscript(d.transcript); setQuery(d.transcript); setRecState('idle'); setVoiceMsg('') }
        else { setRecState('error'); setVoiceMsg(d.error||'Could not understand. Try again.') }
      } catch { setRecState('error'); setVoiceMsg('Network error.') }
    }
    rec.start(200); setRecState('recording')
  }

  const toggleMic = () => recState==='recording' ? stopRec() : startRec()
  const isRec = recState==='recording', isProc = recState==='processing', isBusy = isRec||isProc

  return (
    <section style={{
      minHeight:'100vh', display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center',
      padding:'clamp(80px,10vw,120px) clamp(16px,5vw,24px) 60px',
      position:'relative', overflow:'hidden', background:'#FAFAF9',
    }}>

      {/* Subtle radial gradient + grid */}
      <div style={{ position:'absolute', inset:0, pointerEvents:'none' }}>
        <div style={{ position:'absolute', top:'-10%', left:'50%', transform:'translateX(-50%)', width:'900px', height:'700px', background:'radial-gradient(ellipse, rgba(91,79,207,0.07) 0%, transparent 65%)', filter:'blur(60px)' }} />
        <div style={{ position:'absolute', bottom:'5%', right:'5%', width:'400px', height:'400px', background:'radial-gradient(ellipse, rgba(201,169,110,0.05) 0%, transparent 70%)', filter:'blur(80px)' }} />
        <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(0,0,0,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.025) 1px, transparent 1px)', backgroundSize:'48px 48px' }} />
      </div>

      <div style={{ position:'relative', width:'100%', maxWidth:760, textAlign:'center' }}>

        {/* Badge */}
        <div style={{ display:'inline-flex', alignItems:'center', gap:8, marginBottom:28, animation:'fade-up 0.5s ease both' }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(91,79,207,0.08)', border:'1px solid rgba(91,79,207,0.18)', borderRadius:100, padding:'5px 16px' }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:'#5B4FCF', display:'inline-block', animation:'blink 2s infinite' }} />
            <span style={{ fontSize:12, fontWeight:500, color:'#5B4FCF', letterSpacing:'0.3px', fontFamily:'Geist Mono, monospace' }}>POWERED BY SARVAM AI · INDIA&apos;S OWN LLM</span>
          </div>
        </div>

        {/* H1 */}
        <h1 style={{ fontSize:'clamp(36px,6vw,72px)', fontWeight:800, lineHeight:1.04, letterSpacing:'-2.5px', color:'#111110', marginBottom:16, animation:'fade-up 0.5s 0.06s ease both', opacity:0, animationFillMode:'forwards' }}>
          Find the best product.<br/>
          <span style={{ background:'linear-gradient(135deg, #5B4FCF 0%, #A0782A 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
            No fake reviews.
          </span>
        </h1>

        <p style={{ fontSize:'clamp(15px,2vw,18px)', color:'#78716C', lineHeight:1.7, maxWidth:480, margin:'0 auto 40px', animation:'fade-up 0.5s 0.12s ease both', opacity:0, animationFillMode:'forwards' }}>
          AI-adjusted ratings from 8+ Indian platforms.<br/>Ask in Hindi, Tamil, Telugu — any language.
        </p>

        {/* ── SEARCH BAR ── */}
        <div style={{ animation:'fade-up 0.5s 0.18s ease both', opacity:0, animationFillMode:'forwards' }}>
          <div style={{
            background:'#FFFFFF',
            border:`1.5px solid ${isRec ? 'rgba(220,38,38,0.45)' : focused ? 'rgba(91,79,207,0.45)' : 'rgba(0,0,0,0.1)'}`,
            borderRadius:18,
            boxShadow: isRec
              ? '0 0 0 4px rgba(220,38,38,0.08), 0 20px 50px rgba(0,0,0,0.1)'
              : focused
              ? '0 0 0 4px rgba(91,79,207,0.08), 0 20px 50px rgba(0,0,0,0.12)'
              : '0 8px 30px rgba(0,0,0,0.08)',
            transition:'all 0.2s ease',
            animation: focused ? 'search-glow 3s infinite' : 'none',
          }}>
            <div style={{ display:'flex', alignItems:'center', padding:'6px 6px 6px 20px', gap:8 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={focused ? '#5B4FCF' : '#A8A29E'} strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink:0, transition:'stroke 0.2s' }}>
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>

              <input
                value={isRec ? ('Listening' + '.'.repeat(dots)) : isProc ? 'Transcribing with Sarvam AI...' : query}
                onChange={e => { if (!isBusy) setQuery(e.target.value) }}
                onKeyDown={e => e.key==='Enter' && !isBusy && go()}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder={location?.city ? `Best phone for ${location.city} buyers...` : 'Best AC for Delhi under ₹40,000?'}
                readOnly={isBusy}
                style={{
                  flex:1, border:'none', outline:'none', fontSize:17, fontWeight:400,
                  color: isRec ? '#DC2626' : '#111110',
                  background:'transparent', fontFamily:'Sora,sans-serif',
                  padding:'15px 0', minWidth:0, caretColor:'#5B4FCF',
                }}
              />

              {/* Mic */}
              <button onClick={toggleMic} disabled={isProc}
                style={{
                  width:46, height:46, borderRadius:12, border:'none', flexShrink:0,
                  background: isRec ? 'rgba(220,38,38,0.08)' : '#F5F4F2',
                  cursor: isProc ? 'not-allowed' : 'pointer',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  transition:'all 0.2s',
                  animation: isRec ? 'mic-ring 1s ease infinite' : 'none',
                }}
                onMouseEnter={e => { if (!isRec&&!isProc) { e.currentTarget.style.background='rgba(91,79,207,0.08)' } }}
                onMouseLeave={e => { if (!isRec) e.currentTarget.style.background=isRec?'rgba(220,38,38,0.08)':'#F5F4F2' }}>
                {isProc
                  ? <div style={{ width:16, height:16, border:'2px solid #D6D3D1', borderTopColor:'#5B4FCF', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />
                  : isRec
                  ? <svg width="14" height="14" viewBox="0 0 24 24" fill="#DC2626"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
                  : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#78716C" strokeWidth="2" strokeLinecap="round">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                      <line x1="12" y1="19" x2="12" y2="23"/>
                      <line x1="8" y1="23" x2="16" y2="23"/>
                    </svg>
                }
              </button>

              {/* Search btn */}
              <button onClick={() => go()} disabled={!query.trim() || isBusy}
                style={{
                  padding:'13px 24px', borderRadius:12, border:'none',
                  background: query.trim()&&!isBusy ? 'linear-gradient(135deg, #5B4FCF, #7C6FCD)' : '#F0EFed',
                  color: query.trim()&&!isBusy ? '#fff' : '#A8A29E',
                  fontSize:14, fontWeight:600,
                  cursor: !query.trim()||isBusy ? 'not-allowed' : 'pointer',
                  transition:'all 0.2s', flexShrink:0, whiteSpace:'nowrap',
                  boxShadow: query.trim()&&!isBusy ? '0 4px 16px rgba(91,79,207,0.3)' : 'none',
                }}
                onMouseEnter={e => { if (query.trim()&&!isBusy) e.currentTarget.style.transform='translateY(-1px)' }}
                onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)' }}>
                Search
              </button>
            </div>
          </div>

          {/* Voice feedback */}
          {isRec && (
            <div style={{ marginTop:14, display:'flex', alignItems:'center', gap:8, justifyContent:'center' }}>
              <div style={{ display:'flex', gap:3, alignItems:'flex-end' }}>
                {[0,1,2,3].map(i => (
                  <div key={i} style={{ width:3, background:'#DC2626', borderRadius:2, height:`${10+i*3}px`, animation:`wave-bar 0.5s ${i*0.1}s infinite alternate ease-in-out` }} />
                ))}
              </div>
              <span style={{ fontSize:13, color:'#DC2626', fontWeight:500 }}>Listening... tap stop when done</span>
            </div>
          )}
          {recState==='error' && voiceMsg && (
            <div style={{ marginTop:10, fontSize:13, color:'#DC2626', background:'rgba(220,38,38,0.06)', border:'1px solid rgba(220,38,38,0.15)', borderRadius:10, padding:'8px 16px' }}>⚠️ {voiceMsg}</div>
          )}
          {transcript && !isBusy && (
            <div style={{ marginTop:10, fontSize:13, background:'rgba(22,163,74,0.06)', border:'1px solid rgba(22,163,74,0.18)', borderRadius:10, padding:'8px 16px', textAlign:'left', display:'flex', gap:8, alignItems:'flex-start' }}>
              <span style={{ color:'#16A34A', flexShrink:0 }}>✓</span>
              <span><span style={{ color:'#78716C' }}>You said: </span><span style={{ color:'#111110', fontWeight:500 }}>{transcript}</span></span>
            </div>
          )}
          {!isBusy && !transcript && (
            <p style={{ marginTop:12, fontSize:12, color:'#C4B9AD', display:'flex', gap:6, justifyContent:'center', alignItems:'center', fontFamily:'Geist Mono, monospace' }}>
              🎙️ {location?.city ? `Personalised for ${location.city}` : 'Tap mic · 22 Indian languages · Sarvam AI'}
            </p>
          )}

          {/* Trending */}
          <div style={{ marginTop:32 }}>
            <p style={{ fontSize:11, color:'#C4B9AD', fontFamily:'Geist Mono, monospace', letterSpacing:'1px', textTransform:'uppercase', marginBottom:14 }}>Trending searches</p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8, justifyContent:'center' }}>
              {TRENDING.map(t => (
                <button key={t} onClick={() => go(t)}
                  style={{ padding:'8px 16px', borderRadius:100, fontSize:13, fontWeight:400, background:'#FFFFFF', border:'1.5px solid rgba(0,0,0,0.09)', color:'#57534E', cursor:'pointer', transition:'all 0.15s', whiteSpace:'nowrap', boxShadow:'0 1px 3px rgba(0,0,0,0.04)' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(91,79,207,0.35)'; e.currentTarget.style.color='#5B4FCF'; e.currentTarget.style.boxShadow='0 4px 12px rgba(91,79,207,0.1)'; e.currentTarget.style.transform='translateY(-1px)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(0,0,0,0.09)'; e.currentTarget.style.color='#57534E'; e.currentTarget.style.boxShadow='0 1px 3px rgba(0,0,0,0.04)'; e.currentTarget.style.transform='translateY(0)' }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ marginTop:52, display:'flex', justifyContent:'center', gap:clamp(32), flexWrap:'wrap', animation:'fade-up 0.5s 0.3s ease both', opacity:0, animationFillMode:'forwards' }}>
          {[['5M+','Reviews analysed'],['38%','Fake reviews caught'],['22','Indian languages'],['8+','Platforms']].map(([n,l]) => (
            <div key={l} style={{ textAlign:'center' }}>
              <div style={{ fontSize:'clamp(22px,3vw,30px)', fontWeight:800, color:'#111110', letterSpacing:'-1px', fontFamily:'Sora,sans-serif' }}>
                {n.replace(/[M%+]/g,'')}<span style={{ color:'#5B4FCF' }}>{n.match(/[M%+]+/)?.[0]}</span>
              </div>
              <div style={{ fontSize:11, color:'#A8A29E', marginTop:3, fontFamily:'Geist Mono, monospace' }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Sources ticker */}
      <div style={{ position:'absolute', bottom:0, left:0, right:0, borderTop:'1px solid rgba(0,0,0,0.06)', overflow:'hidden', padding:'14px 0', background:'rgba(250,250,249,0.8)' }}>
        <div style={{ display:'flex', gap:48, width:'max-content', animation:'ticker 25s linear infinite' }}>
          {[...SOURCES,...SOURCES].map((s,i) => (
            <span key={i} style={{ fontSize:11, fontWeight:500, color:'#C4B9AD', whiteSpace:'nowrap', fontFamily:'Geist Mono, monospace', letterSpacing:'1px', textTransform:'uppercase' }}>◆ {s}</span>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes search-glow{0%,100%{box-shadow:0 0 0 0 rgba(91,79,207,0.08),0 20px 50px rgba(0,0,0,0.12)}50%{box-shadow:0 0 0 5px rgba(91,79,207,0.04),0 24px 60px rgba(0,0,0,0.14)}}
        @keyframes mic-ring{0%,100%{box-shadow:0 0 0 2px rgba(220,38,38,0.25)}50%{box-shadow:0 0 0 7px rgba(220,38,38,0.04)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0.25}}
        @keyframes wave-bar{from{transform:scaleY(0.35)}to{transform:scaleY(1)}}
        @keyframes ticker{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        @keyframes fade-up{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
      `}</style>
    </section>
  )
}
function clamp(n: number) { return n }
