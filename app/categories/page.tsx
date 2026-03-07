// app/categories/page.tsx
import { Metadata } from 'next';
import { SITE_NAME, SITE_URL } from '@/lib/seo';

export const metadata: Metadata = {
  title: `All Categories — ${SITE_NAME}`,
  description: 'Browse product ratings and reviews by category. Smartphones, Home Appliances, Personal Care, Kitchen & Cookware, and Movies — all rated for Indian buyers.',
  alternates: { canonical: `${SITE_URL}/categories` },
};

const CATEGORIES = [
  { name: 'Smartphones & Electronics', slug: 'smartphones-electronics', emoji: '📱', count: '12,400+', desc: 'Phones, laptops, tablets, accessories and all consumer electronics' },
  { name: 'Home Appliances',           slug: 'home-appliances',          emoji: '🏠', count: '8,200+',  desc: 'Washing machines, refrigerators, ACs, microwaves and more' },
  { name: 'Personal Care & Beauty',    slug: 'personal-care-beauty',     emoji: '💄', count: '15,600+', desc: 'Skincare, haircare, grooming and wellness products' },
  { name: 'Kitchen & Cookware',        slug: 'kitchen-cookware',         emoji: '🍳', count: '6,800+',  desc: 'Pressure cookers, mixers, non-stick cookware and kitchen essentials' },
  { name: 'Movies',                    slug: 'movies',                   emoji: '🎬', count: 'All OTT', desc: 'Bollywood, regional and Hollywood movie ratings and reviews' },
];

export default function CategoriesPage() {
  return (
    <main className="pt-28 px-6 max-w-6xl mx-auto pb-24">
      <p className="font-mono text-xs text-saffron tracking-widest uppercase mb-4">// All Categories</p>
      <h1 className="font-syne font-black text-4xl md:text-5xl tracking-tight mb-3">
        Everything Indians buy, rated honestly.
      </h1>
      <p className="text-white/40 mb-12 max-w-lg">
        AI-powered ratings aggregated from Flipkart, Amazon, Nykaa, Meesho & more — built for Indian consumers.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {CATEGORIES.map((cat) => (
          <a
            key={cat.slug}
            href={`/categories/${cat.slug}`}
            className="group bg-surface border border-white/6 rounded-2xl p-8 hover:border-saffron/40 hover:bg-surface2 hover:-translate-y-1 transition-all duration-200 relative overflow-hidden"
          >
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-saffron scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
            <span className="text-5xl block mb-5">{cat.emoji}</span>
            <h2 className="font-syne font-black text-xl tracking-tight mb-2">{cat.name}</h2>
            <p className="text-sm text-white/40 leading-relaxed mb-4">{cat.desc}</p>
            <span className="font-mono text-xs text-saffron">{cat.count} products →</span>
          </a>
        ))}
      </div>
    </main>
  );
}
