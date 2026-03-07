'use client'
import Link from 'next/link'

export default function Footer() {
  return (
    <>
      {/* CTA */}
      <section style={{ textAlign: 'center', padding: '100px 48px', background: 'var(--bg2)', borderTop: '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 600, height: 400, background: 'radial-gradient(ellipse, rgba(0,200,255,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: 'clamp(36px,5vw,64px)', fontWeight: 800, letterSpacing: '-2px', lineHeight: 1.05, maxWidth: 700, margin: '0 auto 24px', position: 'relative' }}>
          Stop guessing.<br />Start rating <span style={{ color: 'var(--saffron)' }}>smarter.</span>
        </h2>
        <p style={{ fontSize: 17, color: 'var(--text-dim)', maxWidth: 440, margin: '0 auto 40px', lineHeight: 1.7, fontWeight: 300 }}>
          Join thousands of Indian buyers making better decisions with AI-powered product intelligence.
        </p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', position: 'relative' }}>
          <Link href="/search" style={{ background: 'var(--saffron)', color: '#000', fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 15, padding: '16px 36px', borderRadius: 12, display: 'inline-block', transition: 'background .2s' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--saffron-glow)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--saffron)')}>
            Try AI Search Free →
          </Link>
          <Link href="/categories/smartphones-electronics" style={{ background: 'transparent', color: 'var(--text-dim)', fontFamily: 'Syne,sans-serif', fontWeight: 600, fontSize: 15, padding: '16px 36px', borderRadius: 12, border: '1px solid var(--border)', display: 'inline-block', transition: 'all .2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--text-dim)'; e.currentTarget.style.color = 'var(--text)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-dim)' }}>
            Browse Categories
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '40px 48px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/" style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 18 }}>
          Product<span style={{ color: 'var(--saffron)' }}>Rating</span>.in
        </Link>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono,monospace' }}>
          © 2025 ProductRating.in · Made with ❤️ in India
        </span>
        <div style={{ display: 'flex', gap: 24 }}>
          {['About', 'API', 'Privacy', 'Contact'].map(l => (
            <Link key={l} href={`/${l.toLowerCase()}`} style={{ fontSize: 13, color: 'var(--text-muted)', transition: 'color .2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
              {l}
            </Link>
          ))}
        </div>
      </footer>
    </>
  )
}
