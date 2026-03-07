'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function Nav() {
  const [open, setOpen] = useState(false)
  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '18px 48px',
      background: 'rgba(8,10,15,0.88)', backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
    }}>
      <Link href="/" style={{ fontFamily:'Syne,sans-serif', fontWeight: 800, fontSize: 20, letterSpacing: '-0.5px' }}>
        Product<span style={{ color: 'var(--saffron)' }}>Rating</span>.in
      </Link>
      <div style={{ display: 'flex', gap: 36, alignItems: 'center' }}>
        {[['Categories', '/categories/smartphones-electronics'], ['How It Works', '/#how'], ['About', '/#features']].map(([label, href]) => (
          <Link key={label} href={href} style={{ fontSize: 14, color: 'var(--text-dim)', transition: 'color .2s' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-dim)')}>
            {label}
          </Link>
        ))}
        <Link href="/search" style={{
          background: 'var(--saffron)', color: '#000', fontWeight: 700, fontFamily: 'Syne,sans-serif',
          padding: '8px 20px', borderRadius: 8, fontSize: 14, transition: 'background .2s',
        }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--saffron-glow)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--saffron)')}>
          Ask AI →
        </Link>
      </div>
    </nav>
  )
}
