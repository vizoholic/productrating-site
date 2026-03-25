import type { Metadata } from 'next'
import Nav from '@/components/Nav'
import Hero from '@/components/Hero'
import Features from '@/components/Features'
import Testimonials from '@/components/Testimonials'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'ProductRating.in — AI Product Intelligence for India',
  description: 'One honest score across India\'s top platforms. Fake reviews filtered. Product decisions, rebuilt for India.',
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
    </>
  )
}
