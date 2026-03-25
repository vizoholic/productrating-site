'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])
  return (
    <nav style={{
      position:'fixed', top:0, left:0, right:0, zIndex:90,
      height:56,
      background: scrolled ? 'rgba(250,250,249,0.94)' : 'transparent',
      backdropFilter: scrolled ? 'blur(20px)' : 'none',
      borderBottom: scrolled ? '1px solid rgba(0,0,0,0.07)' : '1px solid transparent',
      transition:'all 0.3s ease',
      display:'flex', alignItems:'center', justifyContent:'space-between',
      padding:'0 clamp(16px,4vw,40px)',
    }}>
      <Link href="/" style={{ display:'flex', alignItems:'center', gap:10 }}>
        <div style={{
          width:30, height:30, borderRadius:8,
          background:'linear-gradient(135deg, #5B4FCF, #7C6FCD)',
          display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow:'0 2px 12px rgba(91,79,207,0.35)',
        }}>
          <span style={{ color:'#fff', fontSize:13, fontWeight:700 }}>PR</span>
        </div>
        <span style={{ fontWeight:700, fontSize:15, color:'#111110', letterSpacing:'-0.3px' }}>
          ProductRating<span style={{ color:'#5B4FCF' }}>.in</span>
        </span>
      </Link>
      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
        <Link href="/about" style={{ fontSize:13, color:'#78716C', padding:'6px 12px', borderRadius:8, transition:'color .15s' }}
          onMouseEnter={e=>(e.currentTarget.style.color='#111110')}
          onMouseLeave={e=>(e.currentTarget.style.color='#78716C')}>About</Link>
        <Link href="/search" style={{
          fontSize:13, fontWeight:600, color:'#fff',
          padding:'7px 18px', borderRadius:8,
          background:'linear-gradient(135deg, #5B4FCF, #7C6FCD)',
          boxShadow:'0 2px 8px rgba(91,79,207,0.3)',
          transition:'all .15s',
        }}
          onMouseEnter={e=>{e.currentTarget.style.boxShadow='0 4px 16px rgba(91,79,207,0.4)';e.currentTarget.style.transform='translateY(-1px)'}}
          onMouseLeave={e=>{e.currentTarget.style.boxShadow='0 2px 8px rgba(91,79,207,0.3)';e.currentTarget.style.transform='translateY(0)'}}>
          Ask AI
        </Link>
      </div>
    </nav>
  )
}
