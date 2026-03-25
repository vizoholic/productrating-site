import type { Metadata } from 'next'
import Link from 'next/link'
import Nav from '@/components/Nav'
import Hero from '@/components/Hero'
import Features from '@/components/Features'
import Testimonials from '@/components/Testimonials'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'ProductRating.in — AI Product Intelligence for India',
  description: "Product decisions, rebuilt for India. One honest score across India's top platforms. Fake reviews filtered.",
  alternates: { canonical: 'https://www.productrating.in' },
}

export default function HomePage() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Features />
        <Testimonials />
      </main>
      <Footer />
      {/* ── Mobile sticky Ask AI bar (point 9) ── */}
      <div className="mobile-ask-bar">
        <div style={{ flex:1 }}>
          <div style={{ fontSize:13, fontWeight:600, color:'#111110', letterSpacing:'-0.2px' }}>Ask about any product</div>
          <div style={{ fontSize:11, color:'#8A857D', fontFamily:'var(--font-mono)', letterSpacing:'0.3px' }}>22 Indian languages · Free</div>
        </div>
        <Link href="/search" style={{
          display:'inline-flex', alignItems:'center', gap:8,
          background:'var(--accent)', color:'#fff',
          fontWeight:600, fontSize:14, letterSpacing:'0.02em',
          padding:'12px 22px', borderRadius:12,
          textDecoration:'none',
          boxShadow:'0 4px 16px rgba(91,79,207,0.35)',
          whiteSpace:'nowrap',
        }}>
          Ask AI →
        </Link>
      </div>
    </>
  )
}
