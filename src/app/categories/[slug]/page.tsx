import { getProductsByCategory, getCategories } from '@/lib/wix'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import FeaturedProducts from '@/components/FeaturedProducts'
import type { Metadata } from 'next'

const CAT_NAMES: Record<string, string> = {
  'smartphones-electronics': 'Smartphones & Electronics',
  'home-appliances': 'Home Appliances',
  'personal-care-beauty': 'Personal Care & Beauty',
  'kitchen-cookware': 'Kitchen & Cookware',
  'movies': 'Movies',
}

export async function generateStaticParams() {
  const categories = await getCategories()
  return categories.map(c => ({ slug: c.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const name = CAT_NAMES[slug] || slug
  return {
    title: `Best ${name} in India 2025 — Ratings & Reviews | ProductRating.in`,
    description: `Compare the best ${name} in India. AI-powered ratings from Flipkart, Amazon & more. Find the highest-rated products with honest reviews from real Indian buyers.`,
    alternates: { canonical: `https://productrating.in/categories/${slug}` },
  }
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const name = CAT_NAMES[slug] || slug
  const products = await getProductsByCategory(name)

  return (
    <>
      <Nav />
      <main style={{ paddingTop: 80, minHeight: '100vh' }}>
        <section style={{ padding: '60px 48px', background: 'var(--bg2)', borderBottom: '1px solid var(--border)' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: 'var(--text-muted)', marginBottom: 16 }}>
              <a href="/" style={{ color: 'var(--text-muted)' }}>Home</a> / {name}
            </div>
            <h1 style={{ fontFamily: 'Syne,sans-serif', fontSize: 'clamp(36px,5vw,64px)', fontWeight: 800, letterSpacing: '-2px', lineHeight: 1.05 }}>
              Best <span style={{ color: 'var(--saffron)' }}>{name}</span><br />in India
            </h1>
            <p style={{ marginTop: 16, fontSize: 16, color: 'var(--text-dim)', fontWeight: 300 }}>
              AI-powered ratings from real Indian buyers across all major platforms
            </p>
          </div>
        </section>
        <FeaturedProducts products={products} />
      </main>
      <Footer />
    </>
  )
}
