import { getCategories } from '@/lib/wix'
import Nav from '@/components/Nav'
import Hero from '@/components/Hero'
import SourcesTicker from '@/components/SourcesTicker'
import ValueProps from '@/components/ValueProps'
import TrustSection from '@/components/TrustSection'
import CategoriesGrid from '@/components/CategoriesGrid'
import HowItWorks from '@/components/HowItWorks'
import Features from '@/components/Features'
import Footer from '@/components/Footer'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ProductRating.in — India\'s AI Product Intelligence Platform',
  description: 'Find the best product in 10 seconds. AI-powered ratings from real Indian buyers — no fake reviews, city-specific insights, 11 languages.',
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
        <TrustSection />
        <CategoriesGrid categories={categories} />
        <HowItWorks />
        <Features />
      </main>
      <Footer />
    </>
  )
}
