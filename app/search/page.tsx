// app/search/page.tsx
import { Metadata } from 'next';
import { searchProducts } from '@/lib/wix';
import { VerdictBadge } from '@/components/ScoreBar';

export const metadata: Metadata = {
  title: 'AI Product Search — ProductRating.in',
  description: 'Ask anything about any product and get AI-powered honest ratings from Indian buyers on Flipkart, Amazon, Nykaa, Meesho & more.',
  robots: { index: true, follow: true },
};

interface Props { searchParams: { q?: string } }

export default async function SearchPage({ searchParams }: Props) {
  const query = searchParams.q || '';
  let results = [];

  if (query.trim()) {
    try { results = await searchProducts(query); } catch {}
  }

  return (
    <main className="pt-28 px-6 max-w-4xl mx-auto pb-24">
      <h1 className="font-syne font-black text-3xl md:text-4xl tracking-tight mb-2">
        {query ? <>Results for "<span className="text-saffron">{query}</span>"</> : 'AI Product Search'}
      </h1>
      <p className="text-white/40 mb-10 text-sm">
        Ask any product question. Get honest AI-powered ratings from Indian buyers.
      </p>

      {/* Search bar */}
      <form method="GET" className="flex items-center bg-surface border border-saffron/30 rounded-xl px-5 py-2 gap-3 mb-10 focus-within:border-saffron transition-all shadow-[0_0_40px_rgba(255,107,0,0.08)]">
        <span className="text-white/30">🔍</span>
        <input
          name="q"
          type="search"
          defaultValue={query}
          placeholder="Ask: Best washing machine for hard water in Delhi?"
          className="flex-1 bg-transparent text-white placeholder-white/25 outline-none py-3 text-base"
          autoFocus
          autoComplete="off"
        />
        <button type="submit" className="bg-saffron text-black font-syne font-bold text-sm px-5 py-2.5 rounded-lg hover:bg-saffron-glow transition-colors">
          Ask AI →
        </button>
      </form>

      {/* AI Answer box (shown when there's a query) */}
      {query && (
        <div className="bg-surface border border-electric/20 rounded-2xl p-6 mb-10">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-electric animate-blink" />
            <span className="text-xs font-mono text-electric uppercase tracking-widest">⚡ ProductRating AI</span>
          </div>
          <AiAnswer query={query} />
        </div>
      )}

      {/* Product results from CMS */}
      {results.length > 0 && (
        <div>
          <h2 className="font-syne font-bold text-lg mb-4">
            Matching Products <span className="text-white/30 font-normal text-sm">({results.length})</span>
          </h2>
          <div className="space-y-4">
            {results.map((product) => (
              <a
                key={product._id}
                href={`/products/${product.slug}`}
                className="flex items-center gap-6 bg-surface border border-white/6 rounded-xl p-5 hover:border-saffron/30 transition-all group"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-syne font-bold text-base group-hover:text-saffron transition-colors">{product.name}</h3>
                  <p className="text-xs text-white/30 font-mono mt-0.5">{product.brand} · {product.category}</p>
                  {product.totalReviews > 0 && (
                    <p className="text-xs text-white/20 font-mono mt-1">{product.totalReviews.toLocaleString('en-IN')} reviews</p>
                  )}
                </div>
                <div className="font-syne font-black text-2xl text-pr-green shrink-0">
                  {product.aggregatedScore?.toFixed(1) || '—'}
                </div>
                <VerdictBadge verdict={product.verdictBadge || 'Consider'} />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* No results */}
      {query && results.length === 0 && (
        <div className="text-center py-16 text-white/30">
          <p className="text-4xl mb-4">🔍</p>
          <p className="font-syne font-bold text-lg">No products found for "{query}"</p>
          <p className="text-sm mt-2">Try a broader search like "Samsung" or "AC"</p>
        </div>
      )}

      {/* Suggested queries (when no query) */}
      {!query && (
        <div>
          <h2 className="font-syne font-bold text-lg mb-4">Popular Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              'Best AC under ₹35,000 in India?',
              'OnePlus 12 vs Samsung S24 camera comparison?',
              'Best mixer grinder for Indian cooking?',
              'Is Minimalist better than Nykaa skincare?',
              'Best washing machine for hard water areas?',
              'Which laptop under ₹60,000 for students?',
              'Best noise cancelling earbuds under ₹5,000?',
              'Prestige vs Hawkins pressure cooker?',
            ].map((q) => (
              <a
                key={q}
                href={`/search?q=${encodeURIComponent(q)}`}
                className="flex items-center gap-3 bg-surface border border-white/6 rounded-xl px-4 py-3 text-sm text-white/50 hover:border-saffron/30 hover:text-white transition-all"
              >
                <span className="text-saffron">→</span>{q}
              </a>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}

// ─── AI Answer Component ──────────────────────────────────
// This calls the Claude API server-side to generate a product intelligence answer
async function AiAnswer({ query }: { query: string }) {
  // Only call Claude if API key is set
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return (
      <div className="text-sm text-white/50 leading-relaxed">
        <strong className="text-white">AI answers coming soon!</strong>
        <br />Add your <span className="font-mono text-electric">ANTHROPIC_API_KEY</span> to <span className="font-mono text-electric">.env.local</span> to enable live AI product analysis.
        <br /><br />
        In the meantime, browse the product results below for ratings from Flipkart, Amazon & more.
      </div>
    );
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 400,
        system: `You are ProductRating.in's AI assistant — India's most trusted product intelligence platform. 
You help Indian consumers make smart buying decisions based on aggregated ratings from Flipkart, Amazon India, Nykaa, Meesho, Croma, and other Indian platforms.

When answering:
- Always give a specific, honest recommendation (not vague)
- Mention Indian-specific factors: price in INR, availability, after-sales service in India, climate considerations
- Be concise (max 3-4 sentences)
- End with a clear verdict: "Buy Now", "Consider", or "Wait"
- Never make up specific ratings — indicate when you don't have exact data`,
        messages: [{ role: 'user', content: query }],
      }),
      next: { revalidate: 3600 }, // Cache AI answer for 1 hour
    });

    if (!response.ok) throw new Error('AI API failed');

    const data = await response.json();
    const text = data.content?.[0]?.text || '';

    return <p className="text-sm text-white/70 leading-relaxed">{text}</p>;
  } catch {
    return (
      <p className="text-sm text-white/50 leading-relaxed">
        AI analysis unavailable right now. Please check the product ratings below.
      </p>
    );
  }
}
