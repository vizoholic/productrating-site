'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <nav style={{
      position:'fixed', top:0, left:0, right:0, zIndex:100,
      display:'flex', alignItems:'center', justifyContent:'space-between',
      padding:'0 48px', height:60,
      background:'rgba(255,255,255,0.97)',
      backdropFilter:'blur(12px)',
      borderBottom:'1px solid var(--border)',
      boxShadow: scrolled ? 'var(--shadow-sm)' : 'none',
      transition:'box-shadow 0.2s',
    }}>
      <Link href="/" style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:18, letterSpacing:'-0.5px', color:'var(--text)' }}>
        Product<span style={{ color:'var(--saffron)' }}>Rating</span><span style={{ color:'var(--text-muted)', fontWeight:400 }}>.in</span>
      </Link>
      <div style={{ display:'flex', gap:32, alignItems:'center' }}>
        {[['Categories','/categories/smartphones-electronics'],['How It Works','/#how'],['About','/#features']].map(([label,href]) => (
          <Link key={label} href={href} style={{ fontSize:14, fontWeight:500, color:'var(--text-dim)', transition:'color .15s' }}
            onMouseEnter={e=>(e.currentTarget.style.color='var(--text)')}
            onMouseLeave={e=>(e.currentTarget.style.color='var(--text-dim)')}>
            {label}
          </Link>
        ))}
        <Link href="/search" style={{ background:'var(--saffron)', color:'#fff', fontWeight:600, fontFamily:'Syne,sans-serif', padding:'8px 20px', borderRadius:8, fontSize:14, transition:'background .15s' }}
          onMouseEnter={e=>(e.currentTarget.style.background='#E55A00')}
          onMouseLeave={e=>(e.currentTarget.style.background='var(--saffron)')}>
          Ask AI →
        </Link>
      </div>
    </nav>
  )
}
