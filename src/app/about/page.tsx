import { Metadata } from 'next'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About ProductRating.in — AI-Powered Product Intelligence for India',
  description: 'ProductRating.in aggregates reviews from Amazon, Flipkart and 6+ Indian platforms, removes fake reviews with AI, and shows you the real score.',
  alternates: { canonical: 'https://www.productrating.in/about' },
}

export default function AboutPage() {
  return (
    <>
      <style>{`
        .about-cta-primary:hover { box-shadow: 0 8px 24px rgba(91,79,207,0.4) !important; transform: translateY(-1px); }
        .about-cta-secondary:hover { background: #EEECE9 !important; }
        .about-principle:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.08) !important; transform: translateY(-2px); }
      `}</style>

      <Nav />
      <main style={{ maxWidth: 800, margin: '0 auto', padding: 'clamp(88px,10vw,100px) clamp(16px,5vw,24px) 80px', fontFamily: 'Sora, sans-serif' }}>

        <div style={{ marginBottom: 40 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(91,79,207,0.07)', border:'1px solid rgba(91,79,207,0.15)', borderRadius:100, padding:'5px 16px', marginBottom:20, fontSize:12, fontWeight:500, color:'#5B4FCF', fontFamily:'Geist Mono, monospace' }}>
            🇮🇳 Made in India
          </div>
          <h1 style={{ fontFamily:'Sora,sans-serif', fontSize:'clamp(28px,5vw,44px)', fontWeight:800, letterSpacing:'-1.5px', color:'#111110', lineHeight:1.1, marginBottom:16 }}>
            About ProductRating.in
          </h1>
          <p style={{ fontSize:17, color:'#78716C', lineHeight:1.75 }}>
            India&apos;s first AI-powered product discovery platform built specifically for Indian buyers — in every Indian language.
          </p>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:32 }}>

          <section>
            <h2 style={{ fontFamily:'Sora,sans-serif', fontSize:22, fontWeight:800, color:'#111110', marginBottom:12 }}>Why we built this</h2>
            <p style={{ fontSize:15, color:'#57534E', lineHeight:1.8, marginBottom:12 }}>
              68% of product reviews on Indian e-commerce platforms are fake, incentivised, or bot-generated. A product showing 4.5★ on Amazon could be 3.6★ in reality. Indian buyers lose thousands of rupees every year buying products based on inflated ratings.
            </p>
            <p style={{ fontSize:15, color:'#57534E', lineHeight:1.8 }}>
              ProductRating.in was built to fix this. We aggregate reviews from Amazon.in, Flipkart, Nykaa, Meesho, Croma, Reliance Digital, and other Indian platforms — then use AI to remove fake reviews and calculate an honest score that reflects real buyer experience.
            </p>
          </section>

          <section style={{ background:'#FFFFFF', border:'1.5px solid rgba(0,0,0,0.07)', borderRadius:16, padding:'28px', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
            <h2 style={{ fontFamily:'Sora,sans-serif', fontSize:20, fontWeight:800, color:'#111110', marginBottom:20 }}>How it works</h2>
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              {[
                { n:'01', title:'We collect reviews from 8+ Indian platforms', desc:'Every review from Amazon, Flipkart, Nykaa, Meesho, Croma, JioMart, Tata Cliq and more — updated daily.' },
                { n:'02', title:'AI removes fake reviews', desc:'Our model flags bot-generated reviews, incentivised ratings, seller-paid scores, and fake verified purchases.' },
                { n:'03', title:'We compute one honest PR Score', desc:'Weighted by recency, reviewer credibility, platform diversity, and city-specific feedback patterns.' },
                { n:'04', title:'You get a straight answer', desc:'Ask in English, Hindi, Tamil, or any of 22 Indian languages. Get a clear recommendation with pros, cons, and a direct buy link.' },
              ].map(s => (
                <div key={s.n} style={{ display:'flex', gap:16, alignItems:'flex-start' }}>
                  <div style={{ fontFamily:'Sora,sans-serif', fontSize:24, fontWeight:800, color:'rgba(91,79,207,0.18)', lineHeight:1, flexShrink:0, width:32 }}>{s.n}</div>
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, color:'#111110', marginBottom:4 }}>{s.title}</div>
                    <div style={{ fontSize:13, color:'#78716C', lineHeight:1.65 }}>{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 style={{ fontFamily:'Sora,sans-serif', fontSize:22, fontWeight:800, color:'#111110', marginBottom:12 }}>Our principles</h2>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:12 }}>
              {[
                { icon:'🚫', title:'No ads', desc:'We never charge sellers to promote their products.' },
                { icon:'🎯', title:'No paid placements', desc:'Rankings are 100% based on AI score.' },
                { icon:'🇮🇳', title:'India-first', desc:'Built for Indian buyers, budgets, and conditions.' },
                { icon:'🔓', title:'Free forever', desc:'ProductRating.in is free for all Indian consumers.' },
              ].map(p => (
                <div key={p.title} className="about-principle" style={{ background:'#FFFFFF', border:'1.5px solid rgba(0,0,0,0.07)', borderRadius:14, padding:'18px', transition:'all 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.04)' }}>
                  <div style={{ fontSize:24, marginBottom:10 }}>{p.icon}</div>
                  <div style={{ fontSize:14, fontWeight:700, color:'#111110', marginBottom:5 }}>{p.title}</div>
                  <div style={{ fontSize:13, color:'#78716C', lineHeight:1.55 }}>{p.desc}</div>
                </div>
              ))}
            </div>
          </section>

          <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
            <Link href="/search" className="about-cta-primary" style={{ display:'inline-flex', alignItems:'center', gap:8, background:'linear-gradient(135deg,#5B4FCF,#7C6FCD)', color:'#fff', fontWeight:700, fontSize:14, padding:'12px 24px', borderRadius:10, textDecoration:'none', boxShadow:'0 4px 16px rgba(91,79,207,0.28)', transition:'all 0.2s' }}>
              Try AI Search →
            </Link>
            <Link href="/contact" className="about-cta-secondary" style={{ display:'inline-flex', alignItems:'center', gap:8, background:'#F5F4F2', color:'#374151', fontWeight:600, fontSize:14, padding:'12px 24px', borderRadius:10, textDecoration:'none', border:'1px solid rgba(0,0,0,0.08)', transition:'all 0.2s' }}>
              Contact Us
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
