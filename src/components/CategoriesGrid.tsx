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
  { _id:'1', name:'Smartphones & Electronics', slug:'smartphones-electronics', description:'Phones, laptops, tablets', totalProducts:12400, featured:true },
  { _id:'2', name:'Home Appliances', slug:'home-appliances', description:'ACs, washing machines, fridges', totalProducts:8200, featured:true },
  { _id:'3', name:'Personal Care & Beauty', slug:'personal-care-beauty', description:'Skincare, haircare, wellness', totalProducts:15600, featured:true },
  { _id:'4', name:'Kitchen & Cookware', slug:'kitchen-cookware', description:'Pressure cookers, mixers', totalProducts:6800, featured:true },
  { _id:'5', name:'Movies', slug:'movies', description:'Bollywood, South Indian & OTT', totalProducts:2400, featured:true },
]

export default function CategoriesGrid({ categories }: { categories: Category[] }) {
  const cats = categories.length > 0 ? categories : FALLBACK_CATEGORIES
  return (
    <section style={{ padding:'100px 48px', background:'var(--bg2)', borderTop:'1px solid var(--border)' }}>
      <div style={{ maxWidth:1200, margin:'0 auto' }}>
        <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:11, letterSpacing:3, textTransform:'uppercase', color:'var(--saffron)', marginBottom:12 }}>Browse Categories</div>
        <h2 style={{ fontFamily:'Syne,sans-serif', fontSize:'clamp(28px,4vw,48px)', fontWeight:800, letterSpacing:'-1.5px', lineHeight:1.1, color:'var(--text)' }}>
          Everything Indians buy,<br />rated honestly.
        </h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:14, marginTop:48 }}>
          {cats.map(cat => (
            <Link key={cat._id} href={`/categories/${cat.slug}`} style={{
              background:'#fff', border:'1px solid var(--border)', borderRadius:14,
              padding:'28px 16px', textAlign:'center', display:'block',
              transition:'all .2s', boxShadow:'var(--shadow-sm)',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='var(--saffron)'; e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='var(--shadow-md)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='var(--shadow-sm)' }}>
              <span style={{ fontSize:32, marginBottom:12, display:'block' }}>{CAT_ICONS[cat.slug] || '📦'}</span>
              <div style={{ fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700, color:'var(--text)' }}>{cat.name}</div>
              <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:4, fontFamily:'JetBrains Mono,monospace' }}>
                {cat.totalProducts?.toLocaleString('en-IN')}+ products
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
