import { getCategories } from '@/lib/wix'
import Nav from '@/components/Nav'
import Hero from '@/components/Hero'
import SourcesTicker from '@/components/SourcesTicker'
import ValueProps from '@/components/ValueProps'
import IndiaSection from '@/components/IndiaSection'
import TrustSection from '@/components/TrustSection'
import CategoriesGrid from '@/components/CategoriesGrid'
import HowItWorks from '@/components/HowItWorks'
import Features from '@/components/Features'
import Footer from '@/components/Footer'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "ProductRating.in — Find the Best Product in Seconds",
  description: 'Ask in any Indian language. Powered by Sarvam AI — 22 Indian languages, no fake reviews, city-specific insights.',
  alternates: { canonical: 'https://productrating.in' },
}

export default async function HomePage() {
  const categories = await getCategories().catch(() => [])
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <SourcesTicker />
        <ValueProps />
        <IndiaSection />
        <TrustSection />
        <CategoriesGrid categories={categories} />
        <HowItWorks />
        <Features />
      </main>
      <Footer />
    </>
  )
}
