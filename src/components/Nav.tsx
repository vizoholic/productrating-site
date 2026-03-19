'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])
  return (
    <nav style={{
      position:'fixed', top:0, left:0, right:0, zIndex:100,
      height:56, display:'flex', alignItems:'center', justifyContent:'space-between',
      padding:'0 clamp(16px,4vw,40px)',
      background:'rgba(255,255,255,0.97)', backdropFilter:'blur(8px)',
      borderBottom:'1px solid var(--border)',
      boxShadow: scrolled ? 'var(--shadow-xs)' : 'none',
      transition:'box-shadow 0.2s',
    }}>
      <Link href="/" style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
        <div style={{ width:28, height:28, background:'var(--blue)', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <span style={{ color:'#fff', fontSize:14, fontWeight:800 }}>P</span>
        </div>
        <span style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:700, fontSize:15, color:'var(--ink)', letterSpacing:'-0.3px', whiteSpace:'nowrap' }}>
          ProductRating<span style={{ color:'var(--blue)' }}>.in</span>
        </span>
      </Link>
      {/* Desktop links */}
      <div style={{ display:'flex', gap:28, alignItems:'center' }} className="desktop-nav">
        <style>{`@media(max-width:640px){.desktop-nav{display:none!important}}`}</style>
        {[['Categories','/categories/smartphones-electronics'],['How It Works','/#how']].map(([l,h]) => (
          <Link key={l} href={h} style={{ fontSize:14, fontWeight:500, color:'var(--muted)', transition:'color .15s' }}
            onMouseEnter={e=>(e.currentTarget.style.color='var(--ink)')}
            onMouseLeave={e=>(e.currentTarget.style.color='var(--muted)')}>
            {l}
          </Link>
        ))}
        <Link href="/search" style={{ background:'var(--blue)', color:'#fff', fontWeight:600, fontSize:14, padding:'7px 18px', borderRadius:8, transition:'background .15s', fontFamily:'Plus Jakarta Sans,sans-serif', whiteSpace:'nowrap' }}
          onMouseEnter={e=>(e.currentTarget.style.background='#1D4ED8')}
          onMouseLeave={e=>(e.currentTarget.style.background='var(--blue)')}>
          Ask AI
        </Link>
      </div>
      {/* Mobile ask button */}
      <Link href="/search" style={{ display:'none', background:'var(--blue)', color:'#fff', fontWeight:600, fontSize:13, padding:'6px 14px', borderRadius:8 }} className="mobile-ask">
        <style>{`@media(max-width:640px){.mobile-ask{display:block!important}}`}</style>
        Ask AI
      </Link>
    </nav>
  )
}
