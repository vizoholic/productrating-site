import { Metadata } from 'next'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Privacy Policy | ProductRating.in',
  description: 'How ProductRating.in collects, uses, and protects your data.',
  alternates: { canonical: 'https://www.productrating.in/privacy' },
}

export default function PrivacyPage() {
  const updated = 'March 2025'
  return (
    <>
      <Nav />
      <main style={{ maxWidth: 760, margin: '0 auto', padding: 'clamp(88px,10vw,100px) clamp(16px,5vw,24px) 80px', fontFamily: 'Inter,sans-serif' }}>
        <h1 style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:'clamp(26px,4vw,38px)', fontWeight:800, letterSpacing:'-1px', color:'#111827', marginBottom:8 }}>
          Privacy Policy
        </h1>
        <p style={{ fontSize:13, color:'#9CA3AF', marginBottom:40 }}>Last updated: {updated}</p>

        {[
          {
            title: '1. What we collect',
            body: `When you use ProductRating.in, we may collect:
• Search queries you enter (text or voice)
• Browser type, device type, and general location (city-level, from browser permission you grant)
• Pages you visit and how long you spend on them
• Cookies for session management

We do NOT collect: your name, email, phone number, payment information, or any personally identifiable information unless you voluntarily contact us.`,
          },
          {
            title: '2. How we use your data',
            body: `Your data is used to:
• Improve search results and AI recommendations
• Understand which products and categories are most searched
• Fix bugs and improve performance
• Generate anonymised analytics (e.g. "most searched category this week")

We never sell your data to advertisers, brands, or third parties.`,
          },
          {
            title: '3. Voice search',
            body: `If you use voice search, your audio is sent to Sarvam AI (sarvam.ai) for speech-to-text transcription. Sarvam AI is an Indian company and processes audio in compliance with Indian data laws. Your audio is not stored by us after transcription is complete.`,
          },
          {
            title: '4. Location data',
            body: `If you grant location permission, your coordinates are used only to detect your city/state for better product recommendations. We use OpenStreetMap's Nominatim service to reverse-geocode coordinates. We store your city name in your browser's sessionStorage — it is never sent to our servers or stored in a database.`,
          },
          {
            title: '5. Cookies',
            body: `We use minimal cookies for:
• Session management (anonymous session ID)
• Remembering your location preference (sessionStorage only)

We do not use advertising cookies or cross-site tracking cookies.`,
          },
          {
            title: '6. Third-party services',
            body: `ProductRating.in uses:
• Sarvam AI (sarvam.ai) — voice transcription and AI recommendations
• SearchAPI.io — Google Shopping data for live prices
• OpenStreetMap Nominatim — reverse geocoding
• Vercel — hosting and edge delivery

Each service has its own privacy policy.`,
          },
          {
            title: '7. Your rights',
            body: `You have the right to:
• Know what data we hold about you
• Request deletion of your data
• Opt out of analytics

To exercise these rights, contact us at privacy@productrating.in.`,
          },
          {
            title: '8. Children',
            body: `ProductRating.in is not directed at children under 13. We do not knowingly collect data from children.`,
          },
          {
            title: '9. Changes to this policy',
            body: `We may update this policy from time to time. Material changes will be noted at the top of this page with an updated date.`,
          },
          {
            title: '10. Contact',
            body: `For privacy-related queries: privacy@productrating.in`,
          },
        ].map(section => (
          <section key={section.title} style={{ marginBottom: 32 }}>
            <h2 style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:17, fontWeight:700, color:'#111827', marginBottom:10 }}>{section.title}</h2>
            <p style={{ fontSize:14, color:'#374151', lineHeight:1.85, whiteSpace:'pre-line' }}>{section.body}</p>
          </section>
        ))}
      </main>
      <Footer />
    </>
  )
}
