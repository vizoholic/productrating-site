import Nav from '@/components/Nav'
import Hero from '@/components/Hero'
import TrustSection from '@/components/TrustSection'
import Footer from '@/components/Footer'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ProductRating.in — AI Product Intelligence for India',
  description: 'AI-adjusted product ratings from Amazon, Flipkart, Nykaa & 6+ Indian platforms. Fake reviews removed. Ask in Hindi, Tamil, Telugu or any Indian language.',
  alternates: { canonical: 'https://www.productrating.in' },
}

export default function HomePage() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <TrustSection />
      </main>
      <Footer />
    </>
  )
}
