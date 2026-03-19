'use client'
import Link from 'next/link'
import type { Category } from '@/lib/wix'
const ICONS: Record<string,string> = { 'smartphones-electronics':'📱', 'home-appliances':'🏠', 'personal-care-beauty':'💄', 'kitchen-cookware':'🍳', 'movies':'🎬' }
const FALLBACK = [
  { _id:'1', name:'Smartphones & Electronics', slug:'smartphones-electronics', totalProducts:12400 },
  { _id:'2', name:'Home Appliances', slug:'home-appliances', totalProducts:8200 },
  { _id:'3', name:'Personal Care & Beauty', slug:'personal-care-beauty', totalProducts:15600 },
  { _id:'4', name:'Kitchen & Cookware', slug:'kitchen-cookware', totalProducts:6800 },
  { _id:'5', name:'Movies', slug:'movies', totalProducts:2400 },
]
export default function CategoriesGrid({ categories }: { categories: Category[] }) {
  const cats = categories.length ? categories : FALLBACK
  return (
    <section style={{ padding:'clamp(48px,8vw,80px) clamp(16px,5vw,40px)', background:'#F9FAFB', borderTop:'1px solid #E5E7EB' }}>
      <div style={{ maxWidth:1160, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:36 }}>
          <div style={{ fontSize:12, fontWeight:600, color:'#2563EB', letterSpacing:'1px', textTransform:'uppercase', marginBottom:10, fontFamily:'JetBrains Mono,monospace' }}>Browse categories</div>
          <h2 style={{ fontSize:'clamp(22px,3vw,36px)', fontWeight:800, letterSpacing:'-1px', color:'#111827', lineHeight:1.2 }}>Everything Indians buy, rated honestly.</h2>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:12 }}>
          {cats.map(c=>(
            <Link key={c._id} href={`/categories/${c.slug}`} style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:10, padding:'22px 14px', textAlign:'center', display:'block', transition:'all .15s', boxShadow:'0 1px 2px rgba(0,0,0,0.04)' }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor='#2563EB';e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 4px 12px rgba(0,0,0,0.08)'}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='#E5E7EB';e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='0 1px 2px rgba(0,0,0,0.04)'}}>
              <div style={{ fontSize:28, marginBottom:8 }}>{ICONS[c.slug]||'📦'}</div>
              <div style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:13, fontWeight:700, color:'#111827', marginBottom:4 }}>{c.name}</div>
              <div style={{ fontSize:11, color:'#9CA3AF', fontFamily:'JetBrains Mono,monospace' }}>{c.totalProducts?.toLocaleString('en-IN')}+</div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
