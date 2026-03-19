'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

const CHIPS = [
  'Best AC for Delhi under ₹40K',
  'OnePlus 12 vs Samsung S24',
  'Washing machine for hard water',
  'Sunscreen for oily skin India',
]

export default function Hero() {
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const [recording, setRecording] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const mediaRef = useRef<MediaRecorder|null>(null)
  const chunksRef = useRef<Blob[]>([])
  const router = useRouter()

  const go = (q?: string) => {
    const t = (q || query).trim()
    if (t) router.push(`/search?q=${encodeURIComponent(t)}`)
  }

  const toggleMic = async () => {
    if (recording) { mediaRef.current?.stop(); setRecording(false); return }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mime = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg'
      const rec = new MediaRecorder(stream, { mimeType: mime })
      mediaRef.current = rec; chunksRef.current = []
      rec.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      rec.onstop = async () => {
        stream.getTracks().forEach(t => t.stop()); setTranscribing(true)
        try {
          const form = new FormData()
          form.append('audio', new Blob(chunksRef.current, { type: mime }), `rec.${mime.split('/')[1]}`)
          const d = await (await fetch('/api/ask', { method:'POST', body:form })).json()
          if (d.transcript) setQuery(d.transcript)
        } catch {}
        setTranscribing(false)
      }
      rec.start(); setRecording(true)
    } catch { alert('Mic permission denied.') }
  }

  return (
    <section style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'80px 24px 60px', background:'var(--bg)', textAlign:'center', position:'relative' }}>
      {/* Minimal dot grid */}
      <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(#2563EB0A 1px, transparent 1px)', backgroundSize:'28px 28px', pointerEvents:'none' }} />

      {/* Badge */}
      <div style={{ display:'inline-flex', alignItems:'center', gap:7, background:'var(--blue-light)', border:'1px solid var(--blue-mid)', borderRadius:100, padding:'5px 14px', marginBottom:24, fontSize:12, fontWeight:600, color:'var(--blue)', letterSpacing:'.2px', animation:'fade-up .4s ease both' }}>
        <span style={{ width:6, height:6, borderRadius:'50%', background:'var(--blue)', display:'inline-block', animation:'blink 2s infinite' }} />
        AI-Powered · No Fake Reviews · India-First
      </div>

      {/* H1 */}
      <h1 style={{ fontSize:'clamp(36px,5.5vw,60px)', fontWeight:800, lineHeight:1.08, letterSpacing:'-1.5px', color:'var(--ink)', maxWidth:760, marginBottom:16, animation:'fade-up .4s .06s ease both', opacity:0, animationFillMode:'forwards' }}>
        Find the best product<br />
        <span style={{ color:'var(--blue)' }}>in 10 seconds.</span>
      </h1>

      <p style={{ fontSize:17, color:'var(--muted)', maxWidth:460, lineHeight:1.6, marginBottom:36, fontWeight:400, animation:'fade-up .4s .12s ease both', opacity:0, animationFillMode:'forwards' }}>
        Ask anything. Get AI-powered recommendations from real Indian buyer reviews — fake ratings removed, city-specific insights included.
      </p>

      {/* Search bar */}
      <div style={{ width:'100%', maxWidth:660, animation:'fade-up .4s .18s ease both', opacity:0, animationFillMode:'forwards' }}>
        <div style={{
          display:'flex', alignItems:'center', gap:8,
          background:'#fff', borderRadius:12, padding:'6px 6px 6px 18px',
          border:`1.5px solid ${focused ? 'var(--blue)' : 'var(--border-strong)'}`,
          boxShadow: focused ? '0 0 0 3px rgba(37,99,235,0.1), var(--shadow-md)' : 'var(--shadow-sm)',
          transition:'border-color .15s, box-shadow .15s',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={focused ? '#2563EB' : '#9CA3AF'} strokeWidth="2" strokeLinecap="round" style={{ flexShrink:0, transition:'stroke .15s' }}>
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            value={query} onChange={e=>setQuery(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&go()}
            onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
            placeholder="Best AC for Delhi under ₹40,000?"
            disabled={recording||transcribing}
            style={{ flex:1, border:'none', outline:'none', fontSize:15, color:'var(--ink)', background:'none', fontFamily:'Inter,sans-serif', padding:'11px 0' }}
          />
          <button onClick={toggleMic} disabled={transcribing} title="Voice search" style={{
            width:38, height:38, borderRadius:8, border:`1px solid ${recording?'#FECACA':'var(--border)'}`,
            background: recording?'var(--red-light)':'var(--bg-2)', cursor:'pointer', fontSize:15,
            display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all .15s',
          }}>
            {transcribing ? '⏳' : recording ? '⏹' : '🎙️'}
          </button>
          <button onClick={()=>go()} disabled={!query.trim()&&!recording} style={{
            background:'var(--blue)', color:'#fff', border:'none', borderRadius:8,
            padding:'10px 22px', fontSize:14, fontWeight:600, cursor:'pointer',
            fontFamily:'Plus Jakarta Sans,sans-serif', transition:'background .15s', flexShrink:0,
            opacity: query.trim() ? 1 : 0.6,
          }}
            onMouseEnter={e=>{if(query.trim())(e.currentTarget.style.background='#1D4ED8')}}
            onMouseLeave={e=>(e.currentTarget.style.background='var(--blue)')}>
            Search →
          </button>
        </div>

        {/* Quick chips */}
        <div style={{ display:'flex', gap:8, marginTop:12, flexWrap:'wrap', justifyContent:'center' }}>
          {CHIPS.map(c => (
            <button key={c} onClick={()=>go(c)} style={{
              background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:100,
              padding:'6px 14px', fontSize:13, color:'var(--muted)', cursor:'pointer',
              fontFamily:'Inter,sans-serif', fontWeight:500, transition:'all .15s',
            }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--blue)';e.currentTarget.style.color='var(--blue)';e.currentTarget.style.background='var(--blue-light)'}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--muted)';e.currentTarget.style.background='var(--bg-2)'}}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display:'flex', alignItems:'center', gap:0, marginTop:48, background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden', animation:'fade-up .4s .24s ease both', opacity:0, animationFillMode:'forwards' }}>
        {[['5M+','Reviews analysed'],['50K+','Products tracked'],['38%','Fake reviews caught'],['11','Indian languages']].map(([n,l],i) => (
          <div key={l} style={{ padding:'14px 28px', textAlign:'center', borderRight:i<3?'1px solid var(--border)':'none' }}>
            <div style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:20, fontWeight:800, color:'var(--ink)', letterSpacing:'-0.5px' }}>
              {n.replace(/[M%K+]/g,'')}<span style={{ color:'var(--blue)' }}>{n.match(/[M%K+]+/)?.[0]}</span>
            </div>
            <div style={{ fontSize:12, color:'var(--subtle)', marginTop:2, fontWeight:500 }}>{l}</div>
          </div>
        ))}
      </div>

      <p style={{ marginTop:16, fontSize:13, color:'var(--subtle)', animation:'fade-up .4s .3s ease both', opacity:0, animationFillMode:'forwards' }}>
        🇮🇳 Built for India &nbsp;·&nbsp; No ads &nbsp;·&nbsp; No paid placements
      </p>
    </section>
  )
}
