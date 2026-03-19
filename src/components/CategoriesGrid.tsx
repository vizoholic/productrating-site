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
    <section style={{ padding:'80px 40px', background:'var(--bg-2)', borderTop:'1px solid var(--border)' }}>
      <div style={{ maxWidth:1160, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:40 }}>
          <div style={{ fontSize:12, fontWeight:600, color:'var(--blue)', letterSpacing:'1px', textTransform:'uppercase', marginBottom:10, fontFamily:'JetBrains Mono,monospace' }}>Browse categories</div>
          <h2 style={{ fontSize:'clamp(24px,3vw,36px)', fontWeight:800, letterSpacing:'-1px', color:'var(--ink)', lineHeight:1.2 }}>Everything Indians buy, rated honestly.</h2>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12 }}>
          {cats.map(c=>(
            <Link key={c._id} href={`/categories/${c.slug}`} style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:10, padding:'24px 16px', textAlign:'center', display:'block', transition:'all .15s', boxShadow:'var(--shadow-xs)' }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--blue)';e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='var(--shadow-md)'}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='var(--shadow-xs)'}}>
              <div style={{ fontSize:28, marginBottom:10 }}>{ICONS[c.slug]||'📦'}</div>
              <div style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:13, fontWeight:700, color:'var(--ink)', marginBottom:4 }}>{c.name}</div>
              <div style={{ fontSize:11, color:'var(--subtle)', fontFamily:'JetBrains Mono,monospace' }}>{c.totalProducts?.toLocaleString('en-IN')}+ products</div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
