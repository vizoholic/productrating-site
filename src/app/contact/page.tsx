import { Metadata } from 'next'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Contact ProductRating.in',
  description: 'Get in touch with the ProductRating.in team.',
  alternates: { canonical: 'https://www.productrating.in/contact' },
}

export default function ContactPage() {
  return (
    <>
      <Nav />
      <main style={{ maxWidth: 720, margin: '0 auto', padding: 'clamp(88px,10vw,100px) clamp(16px,5vw,24px) 80px', fontFamily: 'Inter,sans-serif' }}>
        
        <h1 style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:'clamp(26px,4vw,38px)', fontWeight:800, letterSpacing:'-1px', color:'#111827', marginBottom:8 }}>
          Contact Us
        </h1>
        <p style={{ fontSize:16, color:'#6B7280', lineHeight:1.7, marginBottom:40 }}>
          We&apos;re a small team building India&apos;s most honest product platform. We read every message.
        </p>

        <div style={{ display:'flex', flexDirection:'column', gap:16, marginBottom:48 }}>
          {[
            { icon:'📧', title:'General enquiries', value:'hello@productrating.in', href:'mailto:hello@productrating.in' },
            { icon:'🔒', title:'Privacy & data requests', value:'privacy@productrating.in', href:'mailto:privacy@productrating.in' },
            { icon:'🤝', title:'Partnerships & API access', value:'partners@productrating.in', href:'mailto:partners@productrating.in' },
            { icon:'🐛', title:'Bug reports', value:'bugs@productrating.in', href:'mailto:bugs@productrating.in' },
          ].map(item => (
            <a key={item.title} href={item.href}
              style={{ display:'flex', alignItems:'center', gap:16, background:'#fff', border:'1px solid #E5E7EB', borderRadius:12, padding:'18px 22px', textDecoration:'none', transition:'all .15s', boxShadow:'0 1px 3px rgba(0,0,0,0.04)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor='#BFDBFE'; (e.currentTarget as HTMLAnchorElement).style.boxShadow='0 4px 12px rgba(37,99,235,0.08)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor='#E5E7EB'; (e.currentTarget as HTMLAnchorElement).style.boxShadow='0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ width:44, height:44, background:'#EFF6FF', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>{item.icon}</div>
              <div>
                <div style={{ fontSize:13, color:'#9CA3AF', fontWeight:500, marginBottom:2 }}>{item.title}</div>
                <div style={{ fontSize:15, color:'#2563EB', fontWeight:600 }}>{item.value}</div>
              </div>
              <svg style={{ marginLeft:'auto', flexShrink:0 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
          ))}
        </div>

        <div style={{ background:'#F9FAFB', border:'1px solid #E5E7EB', borderRadius:12, padding:'24px 28px', marginBottom:32 }}>
          <h2 style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:18, fontWeight:700, color:'#111827', marginBottom:16 }}>Frequently asked</h2>
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {[
              { q:'Can I list my product on ProductRating.in?', a:'No. We do not accept paid placements or brand partnerships. All scores are AI-generated from real buyer reviews — sellers cannot influence rankings.' },
              { q:'How do I report a wrong product rating?', a:'Email bugs@productrating.in with the product name and the platform URL. We investigate all reports within 48 hours.' },
              { q:'How can my business use ProductRating\'s data?', a:'We offer an API for fintechs, banks, and BNPL companies to embed AI-adjusted product scores. Email partners@productrating.in for access.' },
              { q:'Is ProductRating.in free?', a:'Yes. ProductRating.in is completely free for Indian consumers and always will be. We do not run ads.' },
            ].map(item => (
              <div key={item.q} style={{ borderBottom:'1px solid #E5E7EB', paddingBottom:16 }}>
                <div style={{ fontSize:14, fontWeight:700, color:'#111827', marginBottom:6 }}>Q: {item.q}</div>
                <div style={{ fontSize:13, color:'#6B7280', lineHeight:1.7 }}>{item.a}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
          <Link href="/" style={{ display:'inline-flex', alignItems:'center', gap:8, background:'#2563EB', color:'#fff', fontWeight:700, fontSize:14, padding:'12px 24px', borderRadius:10, textDecoration:'none' }}>
            ← Back to Home
          </Link>
          <Link href="/about" style={{ display:'inline-flex', alignItems:'center', gap:8, background:'#F9FAFB', color:'#374151', fontWeight:600, fontSize:14, padding:'12px 24px', borderRadius:10, textDecoration:'none', border:'1px solid #E5E7EB' }}>
            About us
          </Link>
        </div>
      </main>
      <Footer />
    </>
  )
}
