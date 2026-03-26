'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 28)
    const onResize = () => setIsMobile(window.innerWidth < 640)
    onResize()
    window.addEventListener('scroll', onScroll)
    window.addEventListener('resize', onResize)
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onResize) }
  }, [])

  return (
    <nav style={{
      position:'fixed', top:0, left:0, right:0, zIndex:100, height:56,
      background: scrolled ? 'rgba(255,255,255,0.97)' : 'transparent',
      backdropFilter: scrolled ? 'blur(24px)' : 'none',
      borderBottom: scrolled ? '1px solid rgba(0,0,0,0.07)' : '1px solid transparent',
      boxShadow: scrolled ? '0 2px 16px rgba(0,0,0,0.06)' : 'none',
      transition: 'all 350ms cubic-bezier(0.22,1,0.36,1)',
      display:'flex', alignItems:'center', justifyContent:'space-between',
      padding:'0 clamp(16px,4vw,40px)',
    }}>
      {/* Logo */}
      <Link href="/" style={{ display:'flex', alignItems:'center', gap:9, flexShrink:0, overflow:'hidden' }}>
        <div style={{
          width:32, height:32, borderRadius:9, flexShrink:0,
          background:'linear-gradient(135deg, #5B4FCF, #7C6FCD)',
          display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow:'0 2px 10px rgba(91,79,207,0.4)',
        }}>
          <span style={{ color:'#fff', fontSize:12, fontWeight:800 }}>PR</span>
        </div>
        <span style={{ fontWeight:600, fontSize: isMobile ? 14 : 15, color:'var(--ink)', letterSpacing:'-0.3px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
          {isMobile ? <>PR<span style={{color:'var(--accent)' }}>.in</span></> : <>ProductRating<span style={{color:'var(--accent)' }}>.in</span></>}
        </span>
      </Link>

      {/* Right */}
      <div style={{ display:'flex', alignItems:'center', gap:4, flexShrink:0 }}>
        {!isMobile && <>
          <Link href="/about" style={{ fontSize:13, fontWeight:400, color:'var(--ink-3)', padding:'7px 14px', borderRadius:8, transition:'color 250ms', letterSpacing:'0.02em', whiteSpace:'nowrap' }}
            onMouseEnter={e=>(e.currentTarget.style.color='var(--ink)')}
            onMouseLeave={e=>(e.currentTarget.style.color='var(--ink-3)')}>About</Link>
          <Link href="/contact" style={{ fontSize:13, fontWeight:400, color:'var(--ink-3)', padding:'7px 14px', borderRadius:8, transition:'color 250ms', letterSpacing:'0.02em', whiteSpace:'nowrap' }}
            onMouseEnter={e=>(e.currentTarget.style.color='var(--ink)')}
            onMouseLeave={e=>(e.currentTarget.style.color='var(--ink-3)')}>Contact</Link>
        </>}
        <Link href="/search" style={{
          fontSize:13, fontWeight:500, color:'#fff',
          padding: isMobile ? '8px 14px' : '8px 20px',
          borderRadius:10, background:'var(--accent)',
          boxShadow:'0 2px 10px rgba(91,79,207,0.35)',
          transition:'all 250ms', whiteSpace:'nowrap', flexShrink:0, letterSpacing:'0.02em',
        }}
          onMouseEnter={e=>{e.currentTarget.style.background='#4A3FBF';e.currentTarget.style.transform='translateY(-1px)'}}
          onMouseLeave={e=>{e.currentTarget.style.background='var(--accent)';e.currentTarget.style.transform='translateY(0)'}}>
          Ask AI
        </Link>
      </div>
    </nav>
  )
}
