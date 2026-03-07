// app/products/[slug]/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProductBySlug, getReviewsByProduct, getQnAByProduct } from '@/lib/wix';
import { getProductMetadata, getProductJsonLd, getBreadcrumbJsonLd, getFaqJsonLd, SITE_URL } from '@/lib/seo';
import { ScoreBar, VerdictBadge, BigScore } from '@/components/ScoreBar';

interface Props { params: { slug: string } }

// Generate metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProductBySlug(params.slug);
  if (!product) return { title: 'Product Not Found' };
  return getProductMetadata(product);
}

export default async function ProductPage({ params }: Props) {
  const product = await getProductBySlug(params.slug);
  if (!product) notFound();

  const [reviews, qnas] = await Promise.all([
    getReviewsByProduct(product._id),
    getQnAByProduct(product._id),
  ]);

  const productJsonLd  = getProductJsonLd(product);
  const breadcrumbJsonLd = getBreadcrumbJsonLd([
    { name: 'Home', url: SITE_URL },
    { name: product.category, url: `${SITE_URL}/categories/${product.category?.toLowerCase().replace(/\s+/g, '-')}` },
    { name: product.name, url: `${SITE_URL}/products/${product.slug}` },
  ]);
  const faqJsonLd = qnas.length > 0
    ? getFaqJsonLd(qnas.slice(0, 5).map((q) => ({ question: q.question, answer: q.answer || '' })))
    : null;

  const platforms = [
    { label: 'Flipkart', score: product.flipkartScore, color: 'bg-saffron' },
    { label: 'Amazon',   score: product.amazonScore,   color: 'bg-orange-400' },
    { label: 'Meesho',   score: product.meeshoScore,   color: 'bg-violet-400' },
    { label: 'Nykaa',    score: product.nykaaScore,    color: 'bg-pink-400' },
  ].filter((p) => p.score > 0);

  return (
    <>
      {/* Structured Data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {faqJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />}

      <main className="pt-24 px-6 max-w-6xl mx-auto pb-24">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs font-mono text-white/30 mb-8" aria-label="Breadcrumb">
          <a href="/" className="hover:text-white transition-colors">Home</a>
          <span>/</span>
          <a href={`/categories/${product.category?.toLowerCase().replace(/\s+/g, '-')}`} className="hover:text-white transition-colors">{product.category}</a>
          <span>/</span>
          <span className="text-white/60">{product.name}</span>
        </nav>

        {/* Hero */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mb-16">
          {/* Left: Image + Score */}
          <div>
            <div className="bg-surface border border-white/6 rounded-2xl aspect-square flex items-center justify-center text-9xl mb-6">
              {product.image ? (
                <img src={product.image} alt={product.name} className="w-full h-full object-contain p-8 rounded-2xl" />
              ) : '📦'}
            </div>

            {/* Score card */}
            <div className="bg-surface border border-white/6 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-xs font-mono text-white/30 uppercase tracking-widest mb-1">ProductRating Score</p>
                  <BigScore score={product.aggregatedScore || 0} total={product.totalReviews} />
                </div>
                <VerdictBadge verdict={product.verdictBadge || 'Consider'} size="md" />
              </div>

              <div className="space-y-3">
                {platforms.map((p) => (
                  <ScoreBar key={p.label} label={p.label} score={p.score} color={p.color} />
                ))}
              </div>

              {product.priceMin && (
                <div className="mt-5 pt-5 border-t border-white/6 flex items-center justify-between">
                  <span className="text-xs font-mono text-white/30">Price Range</span>
                  <span className="font-syne font-bold text-saffron">
                    ₹{product.priceMin?.toLocaleString('en-IN')}
                    {product.priceMax && product.priceMax !== product.priceMin && ` – ₹${product.priceMax?.toLocaleString('en-IN')}`}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right: Info */}
          <div>
            <div className="inline-flex items-center gap-2 bg-saffron/10 border border-saffron/20 rounded-full px-3 py-1 text-xs font-mono text-saffron mb-4">
              {product.category}
            </div>

            <h1 className="font-syne font-black text-3xl md:text-4xl tracking-tight leading-tight mb-2">
              {product.name}
            </h1>
            {product.brand && (
              <p className="text-sm text-white/40 font-mono mb-6">by {product.brand}</p>
            )}

            {/* AI Summary */}
            {product.aiSummary && (
              <div className="bg-surface border border-electric/20 rounded-xl p-5 mb-6">
                <p className="text-xs font-mono text-electric uppercase tracking-widest mb-2">⚡ AI Summary</p>
                <div className="text-sm text-white/70 leading-relaxed" dangerouslySetInnerHTML={{ __html: product.aiSummary }} />
              </div>
            )}

            {/* Pros & Cons */}
            {(product.pros?.length > 0 || product.cons?.length > 0) && (
              <div className="grid grid-cols-2 gap-4 mb-6">
                {product.pros?.length > 0 && (
                  <div className="bg-pr-green/5 border border-pr-green/20 rounded-xl p-4">
                    <p className="text-xs font-mono text-pr-green uppercase tracking-widest mb-3">✓ Pros</p>
                    <ul className="space-y-2">
                      {product.pros.map((p, i) => (
                        <li key={i} className="text-xs text-white/60 flex gap-2">
                          <span className="text-pr-green shrink-0">+</span>{p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {product.cons?.length > 0 && (
                  <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                    <p className="text-xs font-mono text-red-400 uppercase tracking-widest mb-3">✗ Cons</p>
                    <ul className="space-y-2">
                      {product.cons.map((c, i) => (
                        <li key={i} className="text-xs text-white/60 flex gap-2">
                          <span className="text-red-400 shrink-0">−</span>{c}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Tags */}
            {product.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <span key={tag} className="text-xs font-mono bg-surface2 border border-white/6 rounded-full px-3 py-1 text-white/30">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Reviews */}
        {reviews.length > 0 && (
          <section className="mb-16" aria-label="Customer Reviews">
            <h2 className="font-syne font-black text-2xl tracking-tight mb-6">
              Customer Reviews <span className="text-white/30 font-normal text-lg">({product.totalReviews?.toLocaleString('en-IN')})</span>
            </h2>
            <div className="space-y-4">
              {reviews.map((review) => (
                <article key={review._id} className="bg-surface border border-white/6 rounded-xl p-6">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-syne font-bold text-sm">{review.reviewerName}</span>
                        {review.verifiedBuyer && (
                          <span className="text-xs font-mono text-pr-green border border-pr-green/20 bg-pr-green/8 rounded-full px-2 py-0.5">✓ Verified</span>
                        )}
                        {review.reviewerCity && (
                          <span className="text-xs text-white/30 font-mono">📍 {review.reviewerCity}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i} className={i < Math.floor(review.rating) ? 'text-saffron text-sm' : 'text-white/20 text-sm'}>★</span>
                        ))}
                        <span className="text-xs text-white/30 font-mono ml-1">{review.rating}/5</span>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-white/20 bg-surface2 px-2 py-1 rounded-md shrink-0">{review.source}</span>
                  </div>
                  {review.title && <h3 className="font-syne font-bold text-sm mb-1">{review.title}</h3>}
                  <p className="text-sm text-white/50 leading-relaxed">{review.body}</p>
                  {review.usageDuration && (
                    <p className="mt-2 text-xs text-white/25 font-mono">Used for: {review.usageDuration}</p>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Q&A */}
        {qnas.length > 0 && (
          <section aria-label="Product Questions and Answers">
            <h2 className="font-syne font-black text-2xl tracking-tight mb-6">Community Q&A</h2>
            <div className="space-y-4">
              {qnas.map((qna) => (
                <div key={qna._id} className="bg-surface border border-white/6 rounded-xl p-6">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="w-6 h-6 bg-saffron/20 text-saffron rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">Q</span>
                    <div>
                      <p className="font-syne font-bold text-sm">{qna.question}</p>
                      {qna.askedByCity && <p className="text-xs text-white/30 font-mono mt-0.5">Asked from {qna.askedByCity}</p>}
                    </div>
                  </div>
                  {qna.answer && (
                    <div className="flex items-start gap-3 pl-0">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${qna.aiGenerated ? 'bg-electric/20 text-electric' : 'bg-pr-green/20 text-pr-green'}`}>A</span>
                      <div>
                        <p className="text-sm text-white/60 leading-relaxed">{qna.answer}</p>
                        {qna.aiGenerated && <p className="text-xs text-electric/60 font-mono mt-1">⚡ AI Generated Answer</p>}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
