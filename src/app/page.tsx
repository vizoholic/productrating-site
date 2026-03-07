import { getFeaturedProducts, getCategories } from '@/lib/wix'
import Nav from '@/components/Nav'
import Hero from '@/components/Hero'
import SourcesTicker from '@/components/SourcesTicker'
import CategoriesGrid from '@/components/CategoriesGrid'
import FeaturedProducts from '@/components/FeaturedProducts'
import HowItWorks from '@/components/HowItWorks'
import Features from '@/components/Features'
import AiDemoChat from '@/components/AiDemoChat'
import Footer from '@/components/Footer'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ProductRating.in — India\'s AI Product Intelligence Platform',
  description: 'Ask anything about any product. Get AI-powered ratings aggregated from Flipkart, Amazon, Nykaa, Meesho & more. India\'s most trusted product review platform.',
  alternates: { canonical: 'https://productrating.in' },
}

export default async function HomePage() {
  const [featured, categories] = await Promise.all([
    getFeaturedProducts(),
    getCategories(),
  ])

  return (
    <>
      <Nav />
      <main>
        <Hero />
        <SourcesTicker />
        <AiDemoChat />
        <CategoriesGrid categories={categories} />
        <FeaturedProducts products={featured} />
        <HowItWorks />
        <Features />
      </main>
      <Footer />
    </>
  )
}
