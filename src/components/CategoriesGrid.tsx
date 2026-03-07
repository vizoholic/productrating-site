'use client'
import Link from 'next/link'
import type { Category } from '@/lib/wix'

const CAT_ICONS: Record<string, string> = {
  'smartphones-electronics': '📱',
  'home-appliances': '🏠',
  'personal-care-beauty': '💄',
  'kitchen-cookware': '🍳',
  'movies': '🎬',
}

const FALLBACK_CATEGORIES = [
  { _id: '1', name: 'Smartphones & Electronics', slug: 'smartphones-electronics', description: 'Phones, laptops, tablets & accessories', totalProducts: 12400, featured: true },
  { _id: '2', name: 'Home Appliances', slug: 'home-appliances', description: 'ACs, washing machines, refrigerators', totalProducts: 8200, featured: true },
  { _id: '3', name: 'Personal Care & Beauty', slug: 'personal-care-beauty', description: 'Skincare, haircare, wellness', totalProducts: 15600, featured: true },
  { _id: '4', name: 'Kitchen & Cookware', slug: 'kitchen-cookware', description: 'Pressure cookers, mixers, essentials', totalProducts: 6800, featured: true },
  { _id: '5', name: 'Movies', slug: 'movies', description: 'Bollywood, South Indian & OTT', totalProducts: 2400, featured: true },
]

export default function CategoriesGrid({ categories }: { categories: Category[] }) {
  const cats = categories.length > 0 ? categories : FALLBACK_CATEGORIES

  return (
    <section style={{ padding: '100px 48px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--saffron)', marginBottom: 16 }}>// Browse Categories</div>
        <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: 'clamp(32px,4vw,52px)', fontWeight: 800, letterSpacing: '-1.5px', lineHeight: 1.1 }}>
          Everything Indians buy,<br />rated honestly.
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 16, marginTop: 48 }}>
          {cats.map(cat => (
            <Link key={cat._id} href={`/categories/${cat.slug}`} style={{
              background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16,
              padding: '28px 20px', textAlign: 'center', display: 'block',
              transition: 'all .25s', textDecoration: 'none',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,107,0,0.4)'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.3)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}>
              <span style={{ fontSize: 36, marginBottom: 12, display: 'block' }}>{CAT_ICONS[cat.slug] || '📦'}</span>
              <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 13, fontWeight: 700 }}>{cat.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, fontFamily: 'JetBrains Mono,monospace' }}>
                {cat.totalProducts?.toLocaleString('en-IN')}+ products
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
