// app/categories/[slug]/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCategoryBySlug, getProductsByCategory } from '@/lib/wix';
import { getCategoryMetadata, getBreadcrumbJsonLd, SITE_URL } from '@/lib/seo';
import { VerdictBadge } from '@/components/ScoreBar';

interface Props { params: { slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = await getCategoryBySlug(params.slug);
  if (!category) return { title: 'Category Not Found' };
  return getCategoryMetadata(category);
}

const CATEGORY_META: Record<string, { emoji: string; color: string }> = {
  'smartphones-electronics': { emoji: '📱', color: 'bg-blue-500/10 border-blue-500/20 text-blue-400' },
  'home-appliances':         { emoji: '🏠', color: 'bg-saffron/10 border-saffron/20 text-saffron' },
  'personal-care-beauty':    { emoji: '💄', color: 'bg-pink-500/10 border-pink-500/20 text-pink-400' },
  'kitchen-cookware':        { emoji: '🍳', color: 'bg-orange-500/10 border-orange-500/20 text-orange-400' },
  'movies':                  { emoji: '🎬', color: 'bg-purple-500/10 border-purple-500/20 text-purple-400' },
};

export default async function CategoryPage({ params }: Props) {
  const [category, products] = await Promise.all([
    getCategoryBySlug(params.slug),
    getProductsByCategory(params.slug === 'movies' ? 'Movies' : params.slug),
  ]);

  if (!category) notFound();

  const meta = CATEGORY_META[params.slug] || { emoji: '📦', color: 'bg-white/5 border-white/10 text-white' };

  const breadcrumbJsonLd = getBreadcrumbJsonLd([
    { name: 'Home', url: SITE_URL },
    { name: 'Categories', url: `${SITE_URL}/categories` },
    { name: category.name, url: `${SITE_URL}/categories/${params.slug}` },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <main className="pt-24 px-6 max-w-6xl mx-auto pb-24">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs font-mono text-white/30 mb-8">
          <a href="/" className="hover:text-white transition-colors">Home</a>
          <span>/</span>
          <a href="/categories" className="hover:text-white transition-colors">Categories</a>
          <span>/</span>
          <span className="text-white/60">{category.name}</span>
        </nav>

        {/* Header */}
        <div className="flex items-start gap-6 mb-12">
          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-4xl border ${meta.color}`}>
            {meta.emoji}
          </div>
          <div>
            <h1 className="font-syne font-black text-4xl md:text-5xl tracking-tight">{category.name}</h1>
            <p className="text-white/40 mt-2">{category.description}</p>
            <p className="font-mono text-xs text-saffron mt-2">{category.totalProducts || products.length}+ products rated</p>
          </div>
        </div>

        {/* Products grid */}
        {products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {products.map((product) => (
              <a
                key={product._id}
                href={`/products/${product.slug}`}
                className="group bg-surface border border-white/6 rounded-2xl p-6 hover:border-saffron/30 hover:-translate-y-1 transition-all duration-200 block"
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex-1 min-w-0">
                    <h2 className="font-syne font-bold text-base leading-tight truncate group-hover:text-saffron transition-colors">
                      {product.name}
                    </h2>
                    <p className="text-xs text-white/30 font-mono mt-1">{product.brand}</p>
                  </div>
                  <div className="font-syne font-black text-2xl text-pr-green shrink-0">
                    {product.aggregatedScore?.toFixed(1) || '—'}
                  </div>
                </div>

                {/* Platform scores */}
                <div className="flex gap-2 mb-4 flex-wrap">
                  {product.flipkartScore > 0 && (
                    <span className="text-xs font-mono bg-saffron/15 text-saffron px-2 py-0.5 rounded">FK {product.flipkartScore}</span>
                  )}
                  {product.amazonScore > 0 && (
                    <span className="text-xs font-mono bg-orange-400/15 text-orange-400 px-2 py-0.5 rounded">AMZ {product.amazonScore}</span>
                  )}
                  {product.meeshoScore > 0 && (
                    <span className="text-xs font-mono bg-violet-400/15 text-violet-400 px-2 py-0.5 rounded">MSH {product.meeshoScore}</span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  {product.priceMin ? (
                    <span className="text-sm font-syne font-bold text-white/60">
                      ₹{product.priceMin.toLocaleString('en-IN')}
                      {product.priceMax && product.priceMax !== product.priceMin && `+`}
                    </span>
                  ) : <span />}
                  <VerdictBadge verdict={product.verdictBadge || 'Consider'} />
                </div>

                {product.totalReviews > 0 && (
                  <p className="text-xs text-white/20 font-mono mt-3">
                    {product.totalReviews.toLocaleString('en-IN')} reviews analysed
                  </p>
                )}
              </a>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 text-white/30">
            <p className="text-5xl mb-4">{meta.emoji}</p>
            <p className="font-syne font-bold text-xl">Products coming soon</p>
            <p className="text-sm mt-2">We're adding {category.name} products. Check back soon!</p>
          </div>
        )}
      </main>
    </>
  );
}
