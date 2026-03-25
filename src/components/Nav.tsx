'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 32)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])
  return (
    <nav style={{
      position:'fixed', top:0, left:0, right:0, zIndex:90, height:60,
      background: scrolled ? 'rgba(248,246,241,0.95)' : 'transparent',
      backdropFilter: scrolled ? 'blur(24px)' : 'none',
      borderBottom: scrolled ? '1px solid rgba(26,24,20,0.07)' : '1px solid transparent',
      transition: 'all 0.4s cubic-bezier(0.22,1,0.36,1)',
      display:'flex', alignItems:'center', justifyContent:'space-between',
      padding:'0 clamp(20px,5vw,48px)',
    }}>
      <Link href="/" style={{ display:'flex', alignItems:'center', gap:11 }}>
        <div style={{
          width:32, height:32, borderRadius:9,
          background:'var(--ink)',
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          <span style={{ color:'var(--bg)', fontSize:12, fontWeight:700, fontFamily:'var(--font-serif)', letterSpacing:'0.5px' }}>PR</span>
        </div>
        <span style={{ fontFamily:'var(--font-serif)', fontWeight:600, fontSize:16, color:'var(--ink)', letterSpacing:'-0.3px' }}>
          ProductRating<span style={{ color:'var(--accent)' }}>.in</span>
        </span>
      </Link>
      <div style={{ display:'flex', alignItems:'center', gap:4 }}>
        {[['About','/about'],['Contact','/contact']].map(([l,h]) => (
          <Link key={l} href={h} style={{ fontSize:13, fontWeight:400, color:'var(--ink-3)', padding:'7px 14px', borderRadius:'var(--radius-sm)', transition:'color .2s', letterSpacing:'0.02em' }}
            onMouseEnter={e=>(e.currentTarget.style.color='var(--ink)')}
            onMouseLeave={e=>(e.currentTarget.style.color='var(--ink-3)')}>
            {l}
          </Link>
        ))}
        <Link href="/search" style={{
          fontFamily:'var(--font-sans)', fontSize:13, fontWeight:500, color:'var(--bg)',
          padding:'8px 20px', borderRadius:'var(--radius-sm)',
          background:'var(--ink)', letterSpacing:'0.02em',
          transition:'all .2s', marginLeft:8,
        }}
          onMouseEnter={e=>{e.currentTarget.style.background='var(--accent)';e.currentTarget.style.transform='translateY(-1px)'}}
          onMouseLeave={e=>{e.currentTarget.style.background='var(--ink)';e.currentTarget.style.transform='translateY(0)'}}>
          Ask AI
        </Link>
      </div>
    </nav>
  )
}
