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
      <Nav />
      <main style={{ maxWidth: 800, margin: '0 auto', padding: 'clamp(88px,10vw,100px) clamp(16px,5vw,24px) 80px', fontFamily: 'Inter,sans-serif' }}>
        
        <div style={{ marginBottom: 40 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:100, padding:'5px 16px', marginBottom:20, fontSize:12, fontWeight:600, color:'#2563EB' }}>
            🇮🇳 Made in India
          </div>
          <h1 style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:'clamp(28px,5vw,44px)', fontWeight:800, letterSpacing:'-1.5px', color:'#111827', lineHeight:1.1, marginBottom:16 }}>
            About ProductRating.in
          </h1>
          <p style={{ fontSize:17, color:'#6B7280', lineHeight:1.75 }}>
            India&apos;s first AI-powered product discovery platform built specifically for Indian buyers — in every Indian language.
          </p>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:32 }}>

          <section>
            <h2 style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:22, fontWeight:800, color:'#111827', marginBottom:12 }}>Why we built this</h2>
            <p style={{ fontSize:15, color:'#374151', lineHeight:1.8, marginBottom:12 }}>
              68% of product reviews on Indian e-commerce platforms are fake, incentivised, or bot-generated. A product showing 4.5★ on Amazon could be 3.6★ in reality. Indian buyers lose thousands of rupees every year buying products based on inflated ratings.
            </p>
            <p style={{ fontSize:15, color:'#374151', lineHeight:1.8 }}>
              ProductRating.in was built to fix this. We aggregate reviews from Amazon.in, Flipkart, Nykaa, Meesho, Croma, Reliance Digital, and other Indian platforms — then use AI to remove fake reviews and calculate an honest score that reflects real buyer experience.
            </p>
          </section>

          <section style={{ background:'#F9FAFB', border:'1px solid #E5E7EB', borderRadius:12, padding:'24px 28px' }}>
            <h2 style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:20, fontWeight:800, color:'#111827', marginBottom:20 }}>How it works</h2>
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              {[
                { n:'01', title:'We collect reviews from 8+ Indian platforms', desc:'Every review from Amazon, Flipkart, Nykaa, Meesho, Croma, JioMart, Tata Cliq and more — updated daily.' },
                { n:'02', title:'AI removes fake reviews', desc:'Our model flags bot-generated reviews, incentivised ratings, seller-paid scores, and fake verified purchases. Only real buyer feedback survives.' },
                { n:'03', title:'We compute one honest PR Score', desc:'Weighted by recency, reviewer credibility, platform diversity, and city-specific feedback patterns.' },
                { n:'04', title:'You get a straight answer', desc:'Ask in English, Hindi, Tamil, or any of 22 Indian languages. Get a clear recommendation with pros, cons, and a direct buy link.' },
              ].map(s => (
                <div key={s.n} style={{ display:'flex', gap:16, alignItems:'flex-start' }}>
                  <div style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:24, fontWeight:800, color:'#BFDBFE', lineHeight:1, flexShrink:0, width:32 }}>{s.n}</div>
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, color:'#111827', marginBottom:4 }}>{s.title}</div>
                    <div style={{ fontSize:13, color:'#6B7280', lineHeight:1.6 }}>{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:22, fontWeight:800, color:'#111827', marginBottom:12 }}>Powered by Sarvam AI</h2>
            <p style={{ fontSize:15, color:'#374151', lineHeight:1.8 }}>
              Our AI is powered by <strong>Sarvam AI</strong> — India&apos;s own Large Language Model trained specifically on Indian languages, culture, and context. Unlike generic AI models, Sarvam understands the difference between a product review from Mumbai and one from a rural village. It supports 22 Indian languages including Hindi, Tamil, Telugu, Bengali, Marathi, Kannada, Malayalam, and more.
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:22, fontWeight:800, color:'#111827', marginBottom:12 }}>Our principles</h2>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:12 }}>
              {[
                { icon:'🚫', title:'No ads', desc:'We never charge sellers to promote their products.' },
                { icon:'🎯', title:'No paid placements', desc:'Rankings are 100% based on AI score, not sponsorships.' },
                { icon:'🇮🇳', title:'India-first', desc:'Built for Indian buyers, Indian budgets, Indian conditions.' },
                { icon:'🔓', title:'Free forever', desc:'ProductRating.in is free for all Indian consumers.' },
              ].map(p => (
                <div key={p.title} style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:10, padding:'16px 18px' }}>
                  <div style={{ fontSize:24, marginBottom:8 }}>{p.icon}</div>
                  <div style={{ fontSize:14, fontWeight:700, color:'#111827', marginBottom:4 }}>{p.title}</div>
                  <div style={{ fontSize:13, color:'#6B7280', lineHeight:1.5 }}>{p.desc}</div>
                </div>
              ))}
            </div>
          </section>

          <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
            <Link href="/search" style={{ display:'inline-flex', alignItems:'center', gap:8, background:'#2563EB', color:'#fff', fontWeight:700, fontSize:14, padding:'12px 24px', borderRadius:10, textDecoration:'none' }}>
              Try AI Search →
            </Link>
            <Link href="/contact" style={{ display:'inline-flex', alignItems:'center', gap:8, background:'#F9FAFB', color:'#374151', fontWeight:600, fontSize:14, padding:'12px 24px', borderRadius:10, textDecoration:'none', border:'1px solid #E5E7EB' }}>
              Contact Us
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
