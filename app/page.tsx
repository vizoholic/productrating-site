// app/page.tsx
import { Metadata } from 'next';
import { getHomeMetadata, getWebsiteJsonLd, SITE_URL } from '@/lib/seo';
import { getFeaturedProducts, getCategories } from '@/lib/wix';
import { ScoreBar, VerdictBadge } from '@/components/ScoreBar';

export const metadata: Metadata = getHomeMetadata();

// Revalidate every 5 minutes
export const revalidate = 300;

const CATEGORIES = [
  { name: 'Smartphones & Electronics', slug: 'smartphones-electronics', emoji: '📱', count: '12,400+' },
  { name: 'Home Appliances',           slug: 'home-appliances',          emoji: '🏠', count: '8,200+' },
  { name: 'Personal Care & Beauty',    slug: 'personal-care-beauty',     emoji: '💄', count: '15,600+' },
  { name: 'Kitchen & Cookware',        slug: 'kitchen-cookware',         emoji: '🍳', count: '6,800+' },
  { name: 'Movies',                    slug: 'movies',                   emoji: '🎬', count: 'Bollywood · South · OTT' },
];

const PLATFORMS = [
  'Flipkart','Amazon India','Nykaa','Meesho','JioMart','Myntra','Snapdeal','BigBasket','Croma','Reliance Digital',
];

const DEMO_PRODUCTS = [
  { name: 'Samsung Galaxy S24 FE', cat: 'Smartphones · ₹34,999', emoji: '📱', fk: 4.4, amz: 4.3, score: 4.4, verdict: 'Buy Now' as const },
  { name: 'Daikin 1.5T 5★ Inverter AC', cat: 'Appliances · ₹42,500', emoji: '🌬️', fk: 4.5, amz: 4.4, score: 4.5, verdict: 'Buy Now' as const },
  { name: 'Minimalist 10% Niacinamide Serum', cat: 'Beauty · ₹599', emoji: '💊', fk: 4.1, amz: 3.9, score: 4.0, verdict: 'Consider' as const },
  { name: 'Pushpa 2: The Rule', cat: 'Movies · Tollywood · OTT: Prime', emoji: '🎬', fk: 4.6, amz: 4.7, score: 4.7, verdict: 'Must Watch' as const },
];

export default async function HomePage() {
  // Fetch featured products from Wix CMS (with fallback to demo data)
  let featured = [];
  try { featured = await getFeaturedProducts(); } catch {}

  return (
    <>
      {/* Hero */}
      <section className="min-h-screen flex flex-col items-center justify-center text-center px-6 pt-28 pb-20 relative overflow-hidden">
        {/* Radial glow */}
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[400px] pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(255,107,0,0.13) 0%, rgba(0,200,255,0.06) 40%, transparent 70%)', animation: 'pulse-glow 4s ease-in-out infinite alternate' }}
        />

        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-saffron/10 border border-saffron/30 rounded-full px-4 py-1.5 text-xs font-semibold text-saffron tracking-widest uppercase mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-saffron animate-blink" />
          India's First AI Product Intelligence Platform
        </div>

        <h1 className="font-syne font-black text-5xl md:text-7xl lg:text-8xl leading-none tracking-tight max-w-4xl">
          Don't buy blind.<br />
          Buy <span className="text-saffron">smarter.</span>
        </h1>

        <p className="mt-6 text-lg text-white/50 font-light max-w-xl leading-relaxed">
          Ask anything about any product. Get AI-powered ratings aggregated from Flipkart, Amazon, Meesho, Nykaa & more — built specifically for Indian consumers.
        </p>

        {/* Search bar */}
        <SearchBar />

        {/* Stats */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 border border-white/6 rounded-2xl overflow-hidden max-w-2xl w-full">
          {[
            { num: '12L+', label: 'Reviews Analysed' },
            { num: '50K+', label: 'Products Indexed' },
            { num: '8',    label: 'Indian Platforms' },
            { num: '11',   label: 'Indian Languages' },
          ].map((s) => (
            <div key={s.label} className="bg-surface hover:bg-surface2 transition-colors border-r border-white/6 last:border-r-0 p-6 text-left">
              <div className="font-syne font-black text-3xl tracking-tight">
                {s.num.replace(/[0-9L+K]+/, (m) => `<span>${m}</span>`)}
                <span className="text-saffron text-xl">{s.num.match(/[LK+]+$/)?.[0] || ''}</span>
                <span>{s.num.replace(/[LK+]+$/, '')}</span>
              </div>
              <div className="text-xs text-white/30 font-mono uppercase tracking-widest mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 inline-flex items-center gap-2 bg-saffron/8 border border-saffron/20 rounded-lg px-4 py-2 text-xs text-white/40 font-mono">
          🇮🇳 Built for Bharat · Powered by AI
        </div>
      </section>

      {/* Platform ticker */}
      <div className="bg-surface border-y border-white/6 py-4 overflow-hidden">
        <div className="flex gap-12 animate-ticker w-max">
          {[...PLATFORMS, ...PLATFORMS].map((p, i) => (
            <span key={i} className="flex items-center gap-2 text-xs font-mono text-white/30 uppercase tracking-widest whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-saffron" />{p}
            </span>
          ))}
        </div>
      </div>

      {/* Categories */}
      <section className="py-24 px-6" id="categories">
        <div className="max-w-6xl mx-auto">
          <p className="font-mono text-xs text-saffron tracking-widest uppercase mb-4">// Browse Categories</p>
          <h2 className="font-syne font-black text-4xl md:text-5xl tracking-tight max-w-xl">
            Everything Indians buy, rated honestly.
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-12">
            {CATEGORIES.map((cat) => (
              <a
                key={cat.slug}
                href={`/categories/${cat.slug}`}
                className="group bg-surface border border-white/6 rounded-2xl p-7 text-center hover:border-saffron/40 hover:bg-surface2 hover:-translate-y-1 transition-all duration-200 relative overflow-hidden"
              >
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-saffron scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                <span className="text-4xl block mb-3">{cat.emoji}</span>
                <div className="font-syne font-bold text-sm">{cat.name}</div>
                <div className="text-xs text-white/30 font-mono mt-1">{cat.count}</div>
              </a>
            ))}
          </div>

          {/* Live score preview table */}
          <div className="mt-12 bg-surface border border-white/6 rounded-2xl p-10">
            <p className="font-mono text-xs text-white/30 uppercase tracking-widest mb-6">Live Score Preview — Top Trending</p>
            <div className="divide-y divide-white/6">
              {DEMO_PRODUCTS.map((p) => (
                <div key={p.name} className="flex items-center gap-6 py-5">
                  <div className="w-14 h-14 bg-surface2 rounded-xl flex items-center justify-center text-3xl shrink-0">{p.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-syne font-bold text-sm truncate">{p.name}</div>
                    <div className="text-xs text-white/30 font-mono mt-0.5">{p.cat}</div>
                  </div>
                  <div className="hidden md:flex gap-2 shrink-0">
                    <span className="text-xs font-mono bg-saffron/20 text-saffron px-2 py-1 rounded-md">FK {p.fk}</span>
                    <span className="text-xs font-mono bg-orange-500/20 text-orange-400 px-2 py-1 rounded-md">AMZ {p.amz}</span>
                  </div>
                  <div className="font-syne font-black text-2xl text-pr-green shrink-0">{p.score}</div>
                  <VerdictBadge verdict={p.verdict} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 bg-bg2 border-y border-white/6" id="how">
        <div className="max-w-6xl mx-auto">
          <p className="font-mono text-xs text-saffron tracking-widest uppercase mb-4">// How It Works</p>
          <h2 className="font-syne font-black text-4xl md:text-5xl tracking-tight max-w-lg">One score. All of India's voice.</h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-px mt-16 bg-white/6 rounded-2xl overflow-hidden">
            {[
              { n: '01', icon: '🕸️', title: 'Aggregate from all platforms', desc: 'Continuously collect reviews from Flipkart, Amazon, Nykaa, Meesho, Croma, JioMart & more in real-time.' },
              { n: '02', icon: '🧠', title: 'AI cleans & analyses', desc: 'ML detects fake reviews, weights verified buyers, runs multilingual sentiment across 11 Indian languages.' },
              { n: '03', icon: '🏆', title: 'Compute the PR Score', desc: 'Proprietary ProductRating Score weighs recency, reviewer reliability, city-wise variation & after-sales.' },
              { n: '04', icon: '💬', title: 'AI answers your question', desc: 'Ask in English or Hindi. "Is this good for Mumbai humidity?" — get a real, specific, honest answer.' },
            ].map((step) => (
              <div key={step.n} className="bg-surface hover:bg-surface2 transition-colors p-10">
                <div className="font-syne font-black text-6xl text-saffron/10 leading-none mb-6">{step.n}</div>
                <span className="text-3xl block mb-4">{step.icon}</span>
                <div className="font-syne font-bold text-base mb-2">{step.title}</div>
                <p className="text-sm text-white/40 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6" id="features">
        <div className="max-w-6xl mx-auto">
          <p className="font-mono text-xs text-saffron tracking-widest uppercase mb-4">// Why ProductRating.in</p>
          <h2 className="font-syne font-black text-4xl md:text-5xl tracking-tight max-w-xl">Built to be LLM-proof.<br />Your moat is the data.</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-16">
            {[
              { icon: '🇮🇳', title: 'India-First Intelligence', desc: 'Ratings calibrated to Indian income brackets, regional climates, power fluctuations, and local service availability — not global averages.', tag: 'Live', blue: false },
              { icon: '🕵️', title: 'Fake Review Detection', desc: 'Proprietary ML flags incentivised, bot-generated, and seller-paid reviews. What you see is what real Indian buyers actually experienced.', tag: 'Live', blue: false },
              { icon: '🗣️', title: '11 Language Sentiment', desc: 'Hindi, Tamil, Telugu, Bengali, Marathi, Kannada, Malayalam, Gujarati reviews all read and understood — not skipped.', tag: 'Live', blue: true },
              { icon: '📍', title: 'City-Wise Performance', desc: 'An AC that works in Shimla fails in Ahmedabad. Geographic performance breakdowns so your city\'s climate informs your decision.', tag: 'Live', blue: false },
              { icon: '⏳', title: 'Longevity Tracker', desc: 'We track products for 6 months and 1 year post-purchase. Know if it still works before you buy — not just on day one.', tag: 'Soon', blue: true },
              { icon: '🔌', title: 'API for Brands & Fintechs', desc: 'Banks, BNPLs, and e-commerce platforms can license the ProductRating API. Your score becomes infrastructure — not just a website.', tag: 'Soon', blue: true },
            ].map((f) => (
              <div key={f.title} className="bg-surface border border-white/6 rounded-2xl p-9 hover:border-saffron/30 hover:-translate-y-1 transition-all duration-200">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl mb-5 ${f.blue ? 'bg-electric/10 border border-electric/20' : 'bg-saffron/10 border border-saffron/20'}`}>
                  {f.icon}
                </div>
                <div className="font-syne font-bold text-lg mb-2">{f.title}</div>
                <p className="text-sm text-white/40 leading-relaxed">{f.desc}</p>
                <span className={`inline-block mt-4 text-xs font-mono uppercase tracking-widest px-3 py-1 rounded-full border ${
                  f.tag === 'Live'
                    ? 'bg-pr-green/8 border-pr-green/20 text-pr-green'
                    : 'bg-electric/8 border-electric/20 text-electric'
                }`}>
                  {f.tag === 'Live' ? '✓ Live Now' : '⟳ Coming Soon'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-28 px-6 bg-bg2 border-t border-white/6 text-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(0,200,255,0.07), transparent 70%)' }} />
        <h2 className="font-syne font-black text-5xl md:text-6xl tracking-tight max-w-2xl mx-auto leading-tight relative">
          Stop guessing.<br />Start rating <span className="text-saffron">smarter.</span>
        </h2>
        <p className="mt-6 text-lg text-white/40 max-w-md mx-auto leading-relaxed relative">
          Join thousands of Indian buyers making better decisions with AI-powered product intelligence.
        </p>
        <div className="mt-10 flex gap-4 justify-center relative">
          <a href="/search" className="font-syne font-bold text-base bg-saffron text-black px-9 py-4 rounded-xl hover:bg-saffron-glow hover:scale-105 transition-all">
            Try AI Search Free →
          </a>
          <a href="/categories" className="font-syne font-semibold text-base text-white/50 border border-white/10 px-9 py-4 rounded-xl hover:border-white/30 hover:text-white transition-all">
            Browse Categories
          </a>
        </div>
      </section>
    </>
  );
}

// ─── Search Bar (client component) ───────────────────────
function SearchBar() {
  const suggestions = [
    'Best AC under ₹35,000?',
    'OnePlus vs Samsung camera?',
    'Best mixer for Indian cooking?',
    'Nykaa vs Amazon skincare deals?',
  ];

  return (
    <div className="mt-12 w-full max-w-2xl">
      <form action="/search" method="GET" className="flex items-center bg-surface border border-saffron/30 rounded-2xl px-6 py-2 gap-3 shadow-[0_0_60px_rgba(255,107,0,0.12)] focus-within:border-saffron focus-within:shadow-[0_0_80px_rgba(255,107,0,0.2)] transition-all">
        <span className="text-lg text-white/30">🔍</span>
        <input
          name="q"
          type="search"
          placeholder="Ask: Is Samsung Galaxy S24 worth buying in India?"
          className="flex-1 bg-transparent text-base text-white placeholder-white/25 outline-none py-3"
          autoComplete="off"
        />
        <button type="submit" className="bg-saffron text-black font-syne font-bold text-sm px-6 py-3 rounded-xl hover:bg-saffron-glow transition-colors whitespace-nowrap">
          Ask AI →
        </button>
      </form>
      <div className="flex gap-2 mt-4 flex-wrap justify-center">
        {suggestions.map((s) => (
          <a key={s} href={`/search?q=${encodeURIComponent(s)}`}
            className="bg-surface2 border border-white/6 rounded-full px-4 py-1.5 text-xs text-white/40 hover:border-saffron/40 hover:text-saffron transition-all">
            {s}
          </a>
        ))}
      </div>
    </div>
  );
}
