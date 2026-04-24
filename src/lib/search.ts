// src/lib/search.ts
// ProductRating.in — Multi-Provider AI Engine
// Voice: Sarvam AI | Search: Google SERP | Intelligence: OpenAI gpt-4.1 / Claude claude-sonnet-4-6
// Routing: Best model per query type, automatic fallback chain

import { searchGoogleShopping, buildProductContext, type SerpSearchResult } from './serpapi'
import { unstable_cache } from 'next/cache'


// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type PlatformPrice = {
  platform: string; price: string; price_numeric: number
  url: string; availability: string; is_lowest: boolean
}

export type NewerVersion = {
  name: string         // Full name of newer model
  reason: string       // Why it's better / what's new
  price_approx: string // Approx India price
}

export type AiProduct = {
  name: string; price: string; seller: string
  rating: number; platform_rating: number
  reviews: string           // formatted "29K"
  reviews_count?: number    // real integer from SERP when verified
  reviews_verified?: boolean // true when from live marketplace data
  badge: string; reason: string
  pros: string[]; cons: string[]; avoid_if: string
  score?: number; successor_of?: string
  launch_date_india?: string
  newer_version?: NewerVersion | null
  // Enriched from live SERP data:
  image_url?: string         // product thumbnail
  deal_tag?: string          // "17% OFF" | "DEAL"
  delivery?: string          // "Free delivery"
  marketplace_rating?: number // real rating from listing
  platform_prices?: PlatformPrice[]
  best_price?: string; best_price_platform?: string; best_price_url?: string
  // Price sanity check — AI provides expected range; SERP matches outside this range are filtered
  price_min_expected?: number   // e.g. 15000 for earbuds under 20k
  price_max_expected?: number   // e.g. 25000 (20% buffer above user budget)
}

export type DebugInfo = {
  serp_keys_configured: { serpapi: boolean; perplexity: boolean; openai: boolean; anthropic: boolean }
  serp_broad_count: number
  serp_broad_sample: string[]
  ai_provider_used: string
  enrich_details: Array<{
    name: string
    matched: number
    targeted_fallback_used: boolean
    targeted_matched: number
    best_platform: string
    best_price: string
    image_found: boolean
    reviews_count: number
    platform_prices_count: number
    expected_range: string  // e.g. "17000-24000" or "none"
    pr_score_details: string  // e.g. "platform 4.35 → PR 4.15 (med conf, -0.2)"
  }>
}

export type SearchResult = {
  answer: string
  aiProducts: AiProduct[]
  serpProducts: SerpSearchResult['products']
  relatedSearches: string[]
  _debug?: DebugInfo
  isOutOfScope?: boolean
  provider_used?: string    // Which AI provider answered
  algorithm_version: string
}

const ALGORITHM_VERSION = 'PRv5.0-multiprovider'
const cache = new Map<string, { result: SearchResult; ts: number }>()
const CACHE_TTL = 20 * 60 * 1000

// ─────────────────────────────────────────────────────────────────────────────
// SCOPE GATE — Electronics only
// ─────────────────────────────────────────────────────────────────────────────

const ELECTRONICS_RE = [
  /\b(phone|mobile|smartphone|5g|foldable|iphone|android|oneplus|redmi|realme|samsung|poco|iqoo|vivo|oppo|nokia|motorola|moto)\b/i,
  /\b(laptop|notebook|ultrabook|gaming laptop|chromebook|macbook|thinkpad|ideapad|vivobook|inspiron|pavilion|victus|rog)\b/i,
  /\b(tablet|ipad|android tablet|e-reader|kindle|galaxy tab)\b/i,
  /\b(tv|television|smart tv|oled|qled|4k|8k|projector|monitor)\b/i,
  /\b(ac|air conditioner|inverter ac|split ac|window ac)\b/i,
  /\b(refrigerator|fridge|freezer)\b/i,
  /\b(washing machine|washer|front load|top load)\b/i,
  /\b(earbuds|earphone|headphone|tws|neckband|bluetooth speaker|soundbar|home theatre)\b/i,
  /\b(smartwatch|smart watch|fitness band|wearable)\b/i,
  /\b(camera|dslr|mirrorless|action cam|dashcam|webcam)\b/i,
  /\b(microwave|oven|air fryer|mixer grinder|induction|electric kettle|vacuum cleaner|air purifier|water purifier|geyser|dishwasher)\b/i,
  /\b(trimmer|shaver|hair dryer|epilator)\b/i,
  /\b(power bank|charger|ssd|hard disk|hdd|pendrive|memory card|router|wifi)\b/i,
  /\b(gaming|console|playstation|xbox|nintendo|gpu|cpu|processor|ram)\b/i,
  /\b(printer|ups|smart home|smart plug|smart bulb)\b/i,
  // Hindi/regional
  /मोबाइल|फ़ोन|फोन|स्मार्टफोन|लैपटॉप|टीवी|एसी|फ्रिज|वाशिंग मशीन|ईयरबड्स|हेडफोन|स्पीकर|स्मार्टवॉच|कैमरा/,
  /மொபைல்|ஃபோன்|லேப்டாப்|தொலைக்காட்சி|குளிரூட்டி/,
  /మొబైల్|ఫోన్|ల్యాప్టాప్|టీవీ|ఫ్రిజ్/,
  /মোবাইল|ফোন|ল্যাপটপ|টিভি|ফ্রিজ/,
  /ಮೊಬೈಲ್|ಫೋನ್|ಲ್ಯಾಪ್ಟಾಪ್|ಟಿವಿ/,
  /മൊബൈൽ|ഫോൺ|ലാപ്ടോപ്|ടിവി/,
]
const NON_ELECTRONICS_RE = [
  /\b(recipe|food|restaurant|cafe|hotel|flight|visa|mutual fund|stocks?|loan|credit card|insurance)\b/i,
  /\b(fashion|clothing|dress|shirt|pant|shoe|handbag|jewellery|saree|kurta|perfume|makeup|lipstick|cream)\b/i,
  /\b(novel|textbook|comic|magazine|poem|ebook(?!-?reader))\b/i,
  /\b(medicine|tablet(?!\s+(under|price))|doctor|hospital|diet|nutrition|therapy|symptoms?|disease)\b/i,
  /\b(school|college|exam|career|salary|resume|interview tips|syllabus)\b/i,
  /\b(movie|film|anime|song|lyrics|playlist|netflix|spotify subscription)\b/i,
  /\b(cryptocurrency|bitcoin|nft|trading)\b/i,
  /खाना|रेसिपी|कपड़े|साड़ी|होटल|दवाई|इलाज|डॉक्टर|नौकरी|रोज़गार|परीक्षा|सिलेबस|फ़िल्म|गाना/,
]

function isElectronics(q: string): boolean {
  // Normalize Unicode (handles nukta variants: फ़ vs फ + ़, etc.)
  const query = q.normalize('NFC').toLowerCase().trim()
  if (!query || query.length < 2) return false

  // ── Permissive strategy: only reject clearly non-electronics queries ──
  // The AI does fine-grained scope checking and can return out_of_scope for edge cases.
  // This fixes generic electronics queries like "एक लाख तक के अंदर का बेस्ट फ़ोन" that
  // don't literally say "phone" in English but are obviously about electronics.

  // Hard REJECT: obvious non-electronics topics
  if (NON_ELECTRONICS_RE.some(p => p.test(query))) return false

  // Accept everything else — AI will handle fine-grained scope check
  return true
}

// ─────────────────────────────────────────────────────────────────────────────
// QUERY ROUTER — picks best provider + model
// ─────────────────────────────────────────────────────────────────────────────

type QueryType = 'simple' | 'compare' | 'complex'

type ProviderPlan = {
  type: QueryType
  primary: { provider: 'openai'|'claude'|'perplexity'|'sarvam'; model: string }
  fallbacks: Array<{ provider: 'openai'|'claude'|'perplexity'|'sarvam'; model: string }>
}

function routeQuery(question: string, keys: {
  openai?: string; claude?: string; perplexity?: string; sarvam?: string
}): ProviderPlan {
  const isCompare = /\bcompare\b|\bvs\b|versus|difference between|which is better|should i buy|worth it/i.test(question)
  const isComplex = /expert|detailed analysis|pros and cons of all|comprehensive|in-depth/i.test(question)
  const type: QueryType = (isCompare || isComplex) ? 'compare' : 'simple'

  // Build available providers in preference order
  const available = {
    // Perplexity sonar: web-search grounded → fallback for recency verification
    perplexity: keys.perplexity ? { provider: 'perplexity' as const, model: 'sonar-pro'        } : null,
    // OpenAI GPT-5.4: latest flagship (Dec 2025 release) — best JSON compliance + current knowledge
    openai_41:  keys.openai     ? { provider: 'openai'      as const, model: 'gpt-5.4'          } : null,
    // OpenAI GPT-5.4-mini: faster/cheaper variant for lower-latency tasks
    openai_52:  keys.openai     ? { provider: 'openai'      as const, model: 'gpt-5.4-mini'     } : null,
    // Claude Opus 4.7: latest Anthropic flagship (April 16, 2026) — best reasoning
    claude:     keys.claude     ? { provider: 'claude'      as const, model: 'claude-opus-4-7'  } : null,
    sarvam:     keys.sarvam     ? { provider: 'sarvam'      as const, model: 'sarvam-m'         } : null,
  }

  // Chain: Perplexity → Claude Opus 4.7 → OpenAI GPT-5.4 → OpenAI GPT-5.4-mini → Sarvam
  // Perplexity is primary for both query types because it has live web search data
  // (no knowledge cutoff problem — always returns current 2026 models).
  // Claude and OpenAI are strong fallbacks when Perplexity returns narrative text without JSON.
  const primary = available.perplexity || available.claude || available.openai_41 || available.openai_52 || available.sarvam
  const fallbacks = [available.claude, available.openai_41, available.openai_52, available.sarvam]
    .filter((p): p is NonNullable<typeof p> => p !== null && p !== primary)
  return { type, primary: primary!, fallbacks }
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED PROMPT BUILDER
// ─────────────────────────────────────────────────────────────────────────────

function getMonthYear() { const d=new Date(); return `${d.toLocaleString('en-US',{month:'long'})} ${d.getFullYear()}` }
function getYear() { return new Date().getFullYear() }

function detectLang(q: string): string {
  if (/[\u0900-\u097F]/.test(q)) return 'Respond in Hindi. Technical terms in English.'
  if (/[\u0B80-\u0BFF]/.test(q)) return 'Respond in Tamil.'
  if (/[\u0C00-\u0C7F]/.test(q)) return 'Respond in Telugu.'
  if (/[\u0980-\u09FF]/.test(q)) return 'Respond in Bengali.'
  if (/[\u0C80-\u0CFF]/.test(q)) return 'Respond in Kannada.'
  if (/[\u0D00-\u0D7F]/.test(q)) return 'Respond in Malayalam.'
  if (/\b(kaunsa|kaun sa|mein|ke andar|chahiye|konsa|wala)\b/i.test(q)) return 'Respond in Hinglish.'
  return ''
}

function getLocation(city: string, state: string): string {
  const CITIES = new Set(['delhi','new delhi','mumbai','bombay','bangalore','bengaluru','chennai','kolkata','hyderabad','pune','ahmedabad','surat','jaipur','lucknow','noida','gurgaon','gurugram','coimbatore','kochi','indore','chandigarh','nagpur','bhopal','visakhapatnam','patna'])
  const c = city.toLowerCase().trim()
  if (c && CITIES.has(c)) return city
  if (c && c.length > 2) return city
  if (state && state.length > 2) return state
  return ''
}

function sanitise(p: Record<string,unknown>, i: number): AiProduct {
  const r = Math.min(4.8, Math.max(3.0, Number(p.rating)||4.0))
  return {
    name: String(p.name||'').trim(),
    price: String(p.price||'—'),
    seller: normaliseMarketplace(String(p.seller||'Amazon')),
    rating: r,
    platform_rating: Math.min(5.0, Math.max(3.5, Number(p.platform_rating)||Number(p.rating)||4.3)),
    reviews: String(p.reviews||'').replace(/\s*\([^)]*\)/g,'').trim(),
    badge: String(p.badge||['Best Pick','Best Value','Budget Pick'][i]||'Top Rated'),
    reason: String(p.reason||''),
    pros: Array.isArray(p.pros)?p.pros.slice(0,2).map(String):[],
    cons: Array.isArray(p.cons)?p.cons.slice(0,1).map(String):[],
    avoid_if: String(p.avoid_if||''),
    score: Number(p.score||0),
    successor_of: p.successor_of ? String(p.successor_of) : undefined,
    launch_date_india: p.launch_date_india ? String(p.launch_date_india) : undefined,
    newer_version: p.newer_version && typeof p.newer_version === 'object'
      ? {
          name: String((p.newer_version as Record<string,unknown>).name || ''),
          reason: String((p.newer_version as Record<string,unknown>).reason || ''),
          price_approx: String((p.newer_version as Record<string,unknown>).price_approx || ''),
        }
      : null,
    price_min_expected: Number(p.price_min_expected) > 0 ? Number(p.price_min_expected) : undefined,
    price_max_expected: Number(p.price_max_expected) > 0 ? Number(p.price_max_expected) : undefined,
    platform_prices: [], best_price: '', best_price_platform: '', best_price_url: '',
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MARKETPLACES
// ─────────────────────────────────────────────────────────────────────────────

const MARKETPLACES: Record<string, string> = {
  'amazon':'Amazon','flipkart':'Flipkart','croma':'Croma',
  'reliance':'Reliance Digital','vijay':'Vijay Sales',
  'tata cliq':'Tata Cliq','tatacliq':'Tata Cliq',
  'meesho':'Meesho','jiomart':'JioMart','jio mart':'JioMart',
}
function isMarketplace(src: string): boolean {
  const s = src.toLowerCase()
  return Object.keys(MARKETPLACES).some(k => s.includes(k))
}
function normaliseMarketplace(src: string): string {
  const s = src.toLowerCase()
  for (const [k,v] of Object.entries(MARKETPLACES)) if (s.includes(k)) return v
  return 'Amazon'
}
function buildSearchUrl(marketplace: string, productName: string): string {
  const q = encodeURIComponent(productName)
  const m = marketplace.toLowerCase()
  // Verified working search URL patterns (tested April 2026)
  if (m.includes('amazon'))   return `https://www.amazon.in/s?k=${q}`
  if (m.includes('flipkart')) return `https://www.flipkart.com/search?q=${q}`
  // Croma's search requires q=<text>:relevance&text=<text>
  if (m.includes('croma')) {
    const qRel = encodeURIComponent(productName + ':relevance')
    return `https://www.croma.com/searchB?q=${qRel}&text=${q}`
  }
  if (m.includes('reliance')) return `https://www.reliancedigital.in/search?q=${q}`
  // Vijay Sales: search parameter is q=<text> not path-based
  if (m.includes('vijay'))    return `https://www.vijaysales.com/search?q=${q}`
  if (m.includes('tata'))     return `https://www.tatacliq.com/search/?searchCategory=all&text=${q}`
  // Unknown/less reliable sellers: fall back to Google Shopping scoped to this platform
  // This is guaranteed to work for any seller with a .in domain
  const platformDomain = marketplace.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '') + '.in'
  return `https://www.google.com/search?tbm=shop&q=${q}+site%3A${platformDomain}`
}

// ─────────────────────────────────────────────────────────────────────────────
// PRICE ENRICHMENT — Skyscanner style
// ─────────────────────────────────────────────────────────────────────────────


/**
 * Compute PR Score from real marketplace data.
 * 
 * Platform rating = review-count-weighted average across all platforms (what buyers actually give).
 * PR Score = platform_rating - confidence adjustment based on:
 *   1. Rating-vs-volume mismatch (high rating + low volume = likely inflated)
 *   2. Cross-platform variance (if Amazon says 4.9 but Flipkart says 4.1, something's off)
 *   3. Known-inflation-prone budget brands (per ASCI India reports on fake reviews)
 * 
 * If we have NO real SERP data, returns { platform_rating: aiRating, pr_score: aiRating - 0.1 } as fallback.
 */
function computePrScore(
  matched: SerpSearchResult['products'],
  productName: string,
  aiRatingFallback: number
): { platform_rating: number; pr_score: number; confidence: 'high'|'medium'|'low' } {
  // Collect per-platform rating+reviews (one entry per marketplace, using max-review listing)
  // IMPORTANT: accept ratings even when review count is missing (common in appliance/AC category on Google Shopping)
  const platformData = new Map<string, { rating: number; reviews: number }>()
  for (const sp of matched) {
    if (!sp.rating || sp.rating < 1 || sp.rating > 5) continue
    const key = normaliseMarketplace(sp.source)
    const reviewsCount = sp.reviews || 0
    const existing = platformData.get(key)
    // Prefer the listing with MORE reviews per platform; if neither has reviews, keep any rating
    if (!existing || reviewsCount > existing.reviews) {
      platformData.set(key, { rating: sp.rating, reviews: reviewsCount })
    }
  }

  // No real data → fall back to AI estimate with minimal adjustment
  if (platformData.size === 0) {
    const platform = Math.min(5.0, Math.max(3.5, aiRatingFallback))
    return { platform_rating: platform, pr_score: Number((platform - 0.1).toFixed(2)), confidence: 'low' }
  }

  // Weighted average: if a platform has review count, weight by reviews; otherwise use weight = 50 (small default)
  // This lets us still compute a rating for AC/appliance listings that lack review counts
  const DEFAULT_WEIGHT = 50  // treats rating-only listings as ~50 reviews worth of signal
  let totalWeightedRating = 0
  let totalEffectiveWeight = 0
  let totalRealReviews = 0
  let platformsWithReviews = 0
  const ratings: number[] = []
  for (const { rating, reviews } of platformData.values()) {
    const weight = reviews > 0 ? reviews : DEFAULT_WEIGHT
    totalWeightedRating += rating * weight
    totalEffectiveWeight += weight
    totalRealReviews += reviews
    if (reviews > 0) platformsWithReviews++
    ratings.push(rating)
  }
  const platformRating = Number((totalWeightedRating / totalEffectiveWeight).toFixed(2))

  // ── Confidence-based adjustment ──
  let adjustment = 0.10  // baseline: -0.1 across the board
  const reasons: string[] = ['baseline -0.1']

  // Low-volume-high-rating inflation signal — only applies when we actually HAVE review counts
  // (ACs/appliances often have 0 reviews on Google Shopping, so don't penalize that as "low volume")
  if (platformsWithReviews > 0) {
    if (platformRating >= 4.7 && totalRealReviews < 500) {
      adjustment += 0.20
      reasons.push('low-volume-high-rating -0.2')
    } else if (platformRating >= 4.5 && totalRealReviews < 200) {
      adjustment += 0.15
      reasons.push('low-volume-high-rating -0.15')
    }
  }

  // Cross-platform variance — one platform is lying
  if (ratings.length >= 2) {
    const spread = Math.max(...ratings) - Math.min(...ratings)
    if (spread >= 0.5) {
      adjustment += 0.10
      reasons.push(`spread-${spread.toFixed(1)} -0.1`)
    }
  }

  // Known inflation-prone budget audio brands (per ASCI India 2023 fake review report)
  const nameLc = productName.toLowerCase()
  const budgetAudioBrands = ['boat', 'noise', 'zebronics', 'portronics', 'ptron', 'mivi', 'pebble']
  if (budgetAudioBrands.some(b => nameLc.includes(b))) {
    adjustment += 0.15
    reasons.push('budget-audio-brand -0.15')
  }

  adjustment = Math.min(0.60, adjustment)
  const prScore = Number((platformRating - adjustment).toFixed(2))

  // Confidence:
  // - high: 500+ real reviews across 2+ platforms
  // - medium: 100+ real reviews OR 2+ platforms with ratings (even without review counts)
  // - low: only 1 platform and no reviews
  const confidence: 'high'|'medium'|'low' =
    (totalRealReviews >= 500 && platformsWithReviews >= 2) ? 'high' :
    (totalRealReviews >= 100 || platformData.size >= 2) ? 'medium' : 'low'

  console.log(`[computePrScore] "${productName.slice(0,30)}" platforms=${platformData.size} realReviews=${totalRealReviews} platformRating=${platformRating} adjustment=-${adjustment.toFixed(2)} reasons=[${reasons.join(', ')}] prScore=${prScore} confidence=${confidence}`)

  return { platform_rating: platformRating, pr_score: prScore, confidence }
}

async function enrichPrices(
  aiProducts: AiProduct[],
  serpProducts: SerpSearchResult['products'],
  debugCollector?: DebugInfo['enrich_details']
): Promise<AiProduct[]> {
  // Hybrid: first try to match against broad SERP, then do per-product SERP for unmatched
  return Promise.all(aiProducts.map(async ai => {
    // ── Smart name tokenization: extract key identifiers ──
    // Example: "Apple iPhone 17 Pro Max (256GB)" → tokens: [apple, iphone, 17, pro, max, 256gb]
    // Example: "iQOO Z9x 5G (8GB+128GB)" → tokens: [iqoo, z9x, 5g, 8gb, 128gb]
    const tokenize = (str: string): string[] => {
      return str.toLowerCase()
        .replace(/\([^)]*\)/g, ' ')  // strip parens but keep inner content via next step
        .replace(/[()+,]/g, ' ')
        .replace(/(\d+)(gb|tb|mah|hz|k|w|bhp|ton|litre|l|kg)/gi, '$1$2') // keep "128gb" together
        .split(/[\s\-_/]+/)
        .filter(w => w.length >= 2 && !/^(the|with|and|for|new|best|price|in|india|online|buy|store|from|at|by)$/.test(w))
    }

    // Re-tokenize AI name WITH parens content
    const aiName = ai.name.toLowerCase()
    const aiTokens = tokenize(ai.name + ' ' + (ai.name.match(/\(([^)]*)\)/g)||[]).join(' '))
    // Key identifiers: model numbers (contain digits) are MUST-MATCH
    const mustMatch = aiTokens.filter(t => /\d/.test(t) && t.length >= 2)
    // Brand keywords: first 1-2 words typically
    const brandTokens = aiTokens.filter(t => !/\d/.test(t)).slice(0, 3)

    // Price sanity: build range from AI's expected values
    // Use wide tolerance (50% below min, 20% above max) so discounts/variants don't get filtered out
    const priceFloor = ai.price_min_expected ? Math.max(100, Math.floor(ai.price_min_expected * 0.5)) : 0
    const priceCeil = ai.price_max_expected ? Math.ceil(ai.price_max_expected * 1.2) : 99999999

    const passesPriceSanity = (sp: SerpSearchResult['products'][number]): boolean => {
      if (!ai.price_min_expected && !ai.price_max_expected) return true  // AI didn't provide range
      const n = sp.price_numeric || 0
      if (n < priceFloor || n > priceCeil) return false
      return true
    }

    let matched = serpProducts.filter(sp => {
      if (!sp.title || !sp.price || !isMarketplace(sp.source)) return false
      if (!passesPriceSanity(sp)) return false  // reject wrong-priced accessories/knockoffs
      const spTokens = new Set(tokenize(sp.title))

      if (mustMatch.length > 0) {
        // Match if ANY model-specific token hits (relaxed from 60% to catch more variants)
        // Examples this now catches:
        //   "Redmi 15 5G (8GB/128GB)" vs Amazon "Redmi 15 5G (Blue 6GB RAM 128GB)" — 15/5g/128gb match
        //   "Motorola Edge 60 (8GB/256GB)" vs "Motorola Edge 60 Neo 8GB 256GB" — edge/60/8gb/256gb match
        const modelHits = mustMatch.filter(t => spTokens.has(t) || Array.from(spTokens).some(st => st.includes(t))).length
        // Require at least 40% of mustMatch tokens (was 60%) — BUT always require the brand
        if (modelHits < Math.max(1, Math.ceil(mustMatch.length * 0.4))) return false
      }
      // Brand MUST match when we have mustMatch tokens (prevents cross-brand pollution)
      const brandHit = brandTokens.some(t => spTokens.has(t))
      if (!brandHit) return false
      return true
    })

    // ── HYBRID FALLBACK: if broad SERP didn't yield 2+ marketplace matches, do a targeted SERP ──
    // This runs in parallel (enrichPrices is in Promise.all), so only adds latency per-product, not total
    let usedTargetedSerp = false
    let targetedMatchCount = 0
    if (matched.length < 2) {
      usedTargetedSerp = true
      console.log(`[enrichPrices] "${ai.name.slice(0,40)}" broad match=${matched.length}, firing targeted SERP...`)
      try {
        const targetedResult = await searchGoogleShopping(ai.name)
        const targeted = targetedResult.products.filter(sp => {
          if (!sp.title || !sp.price || !isMarketplace(sp.source)) return false
          if (!passesPriceSanity(sp)) return false  // same price sanity check
          const spTokens = new Set(tokenize(sp.title))
          // Looser matching for targeted query (already filtered by Google's own ranking)
          if (mustMatch.length > 0) {
            const modelHits = mustMatch.filter(t => spTokens.has(t) || Array.from(spTokens).some(st => st.includes(t))).length
            // Targeted SERP is pre-filtered by Google; relax to 30%
            if (modelHits < Math.max(1, Math.ceil(mustMatch.length * 0.3))) return false
          }
          const brandHit = brandTokens.some(t => spTokens.has(t))
          if (!brandHit) return false
          return true
        })
        targetedMatchCount = targeted.length
        console.log(`[enrichPrices] "${ai.name.slice(0,40)}" targeted SERP yielded ${targeted.length} matches`)
        // Merge: prefer targeted results (more specific to this product)
        matched = [...targeted, ...matched]
      } catch (e) {
        console.error(`[enrichPrices] targeted SERP failed for "${ai.name.slice(0,40)}":`, String(e))
      }
    }

    
    // ── Build per-platform best-price map ──
    // Keep the LOWEST price listing per platform (handles multiple sellers on Amazon/Flipkart)
    const byPlatform = new Map<string, {price_str:string;price_num:number;url:string}>()
    for (const sp of matched) {
      const key = normaliseMarketplace(sp.source)
      const priceNum = sp.price_numeric || parseInt(String(sp.price).replace(/[^\d]/g,'')) || 0
      if (priceNum <= 0) continue  // skip junk
      const existing = byPlatform.get(key)
      if (!existing || priceNum < existing.price_num) {
        // Use SERP link only if it's a real seller URL (not a google.com redirect)
        const serpLinkIsDirect = sp.link && !/^https?:\/\/(www\.)?google\./i.test(sp.link)
        const finalUrl = (serpLinkIsDirect && isMarketplace(sp.source)) ? sp.link : buildSearchUrl(key, ai.name)
        byPlatform.set(key, {
          price_str: sp.price,
          price_num: priceNum,
          url: finalUrl,
        })
      }
    }

    // Show ONLY platforms that have real prices — no filler entries
    // Sort ascending by price, take top 3 cheapest
    const entries = Array.from(byPlatform.entries())
      .filter(([, data]) => data.price_num > 0 && data.price_num !== 999999)
      .sort((a, b) => a[1].price_num - b[1].price_num)
      .slice(0, 3)

    const platform_prices: PlatformPrice[] = entries.map(([platform, data], idx) => ({
      platform,
      price: data.price_str,
      price_numeric: data.price_num,
      url: data.url,  // direct seller URL from SERP
      availability: 'in_stock',
      is_lowest: idx === 0,
    }))
    // "Best" = lowest-priced platform that actually has data
    const best = platform_prices.find(p => p.is_lowest) || platform_prices.find(p => p.price_numeric !== 999999) || platform_prices[0]



    // ── Aggregate review count across all matched listings (one per platform, max per platform to avoid double-counting duplicates) ──
    let totalReviews = 0
    const reviewsPerPlatform = new Map<string, number>()
    for (const sp of matched) {
      if (!sp.reviews) continue
      const key = normaliseMarketplace(sp.source)
      const existing = reviewsPerPlatform.get(key) || 0
      // Take max per platform (not sum — different sellers listing same product inflate)
      if (sp.reviews > existing) reviewsPerPlatform.set(key, sp.reviews)
    }
    for (const count of reviewsPerPlatform.values()) totalReviews += count

    // ── Compute PR Score using real SERP data with confidence-based fake-review adjustment ──
    const prComputed = computePrScore(matched, ai.name, ai.rating || 4.3)
    const marketplaceRating = prComputed.platform_rating

    // ── Best product image (prefer thumbnail_large for 800×800, from most-reviewed listing) ──
    const imageSources = matched
      .filter(sp => sp.thumbnail_large || sp.thumbnail)
      .sort((a,b) => (b.reviews||0) - (a.reviews||0))
    const bestImage = imageSources[0]?.thumbnail_large || imageSources[0]?.thumbnail

    // ── Best deal tag (from lowest-price listing that has a tag) ──
    const bestDeal = matched
      .filter(sp => sp.tag)
      .sort((a,b) => a.price_numeric - b.price_numeric)[0]?.tag

    // ── Best delivery info (from primary seller) ──
    const bestDelivery = matched
      .filter(sp => sp.delivery && normaliseMarketplace(sp.source) === (best?.platform||'Amazon'))[0]?.delivery

    const hasRealPrice = best && best.price_numeric !== 999999 && best.price
    const result: AiProduct = {
      ...ai,
      platform_prices,
      best_price: hasRealPrice ? best!.price : '',
      best_price_platform: best?.platform || ai.seller || 'Amazon',
      best_price_url: best?.url || buildSearchUrl('Amazon', ai.name),
      price: hasRealPrice ? best!.price : ai.price,
      seller: best?.platform || ai.seller || 'Amazon',
    }

    // Override AI's guessed values with REAL marketplace data when available
    if (totalReviews > 0) {
      result.reviews_count = totalReviews
      result.reviews = formatReviewCount(totalReviews)
      result.reviews_verified = true
    }
    if (marketplaceRating) result.marketplace_rating = marketplaceRating
    // Always apply computed PR Score — computePrScore handles low-confidence case internally
    // (falls back to AI rating with minimal -0.1 adjustment when no SERP data available)
    result.rating = prComputed.pr_score                // computed PR Score (weighted avg - adjustments)
    result.platform_rating = prComputed.platform_rating  // weighted average across platforms
    if (bestImage) result.image_url = bestImage
    if (bestDeal) result.deal_tag = bestDeal
    if (bestDelivery) result.delivery = bestDelivery

    console.log(`[enrichPrices] "${ai.name.slice(0,35)}" matches=${matched.length} best=${best?.platform}:${best?.price||'—'} image=${bestImage?'YES':'NO'} reviews=${totalReviews} platforms=[${platform_prices.map(p=>`${p.platform}:${p.price||'—'}`).join(', ')}]`)

    // Collect debug info
    if (debugCollector) {
      const rangeStr = (ai.price_min_expected || ai.price_max_expected)
        ? `${ai.price_min_expected||0}-${ai.price_max_expected||0} (floor:${priceFloor}, ceil:${priceCeil})`
        : 'none'
      const prDetails = `platform ${prComputed.platform_rating.toFixed(2)} → PR ${prComputed.pr_score.toFixed(2)} (${prComputed.confidence} conf)`
      debugCollector.push({
        name: ai.name.slice(0, 80),
        matched: matched.length,
        targeted_fallback_used: usedTargetedSerp,
        targeted_matched: targetedMatchCount,
        best_platform: best?.platform || '',
        best_price: best?.price || '',
        image_found: !!bestImage,
        reviews_count: totalReviews,
        platform_prices_count: platform_prices.filter(pp => pp.price_numeric !== 999999).length,
        expected_range: rangeStr,
        pr_score_details: prDetails,
      })
    }

    return result
  }))
}

function formatReviewCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/,'')}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/,'')}K`
  return String(n)
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED SYSTEM PROMPT
// ─────────────────────────────────────────────────────────────────────────────

// Return voice examples in the user's target language. Empty string for English.
// This prevents Devanagari/Tamil/etc. characters from leaking into the prompt
// for English queries — which biases models toward non-English output.
function inLangVoiceExamples(lang: string): string {
  if (!lang) return ''
  const l = lang.toLowerCase()
  if (l.includes('hindi')) {
    return `

GOOD reason (Hindi — when user asks in Hindi): "अगर battery और gaming priority है तो यह standout है। 7200mAh real 2 दिन चलती है और Dimensity 7400 Turbo BGMI में 60fps होल्ड करता है — frame drops नहीं। Catch यह है: display LCD है, AMOLED नहीं। Netflix बहुत देखते हैं तो Redmi का option sharper लगेगा।"

GOOD answer (Hindi): "Rs 20,000 के budget में अभी most buyers के लिए default choice Realme Narzo 80 Pro 5G है — balanced specs, IP69 durability, और consistent 80W charging। अगर gaming ज्यादा करते हैं तो iQOO Z11x की बड़ी battery जीतती है।"
`
  }
  if (l.includes('tamil')) {
    return `

GOOD reason (Tamil — when user asks in Tamil): "Battery-um gaming-um main priority-na, idhu dhaan standout. 7200mAh real-world 2 naal varum, Dimensity 7400 Turbo BGMI-la 60fps stable-a handle panradhu. Aana ondru — display LCD, AMOLED illa. Netflix niraya paarpinga-na Redmi option sharper-a irukkum."
`
  }
  if (l.includes('hinglish')) {
    return `

GOOD reason (Hinglish): "Agar battery aur gaming matter karte hain, toh ye standout hai. 7200mAh se real 2 din ka backup milta hai, Dimensity 7400 Turbo BGMI pe 60fps smooth chalata hai. Catch ek hai — LCD hai AMOLED nahi, toh Netflix zyada dekhte ho toh Redmi sharper lagega."
`
  }
  // Other languages: instruction only, no example (avoids biasing with wrong script)
  return `

(Translate the voice and tone above into the user's language naturally. Do not copy English verbatim — write in the user's language with the same analytical, trade-off-focused register.)
`
}

function buildSystemPrompt(lang: string, loc: string, monthYear: string, currentYear: number): string {
  const locationNote = loc ? `User location: ${loc}.` : ''
  const langBlock = lang ? `\n=== CRITICAL: OUTPUT LANGUAGE ===\n${lang}\nThis applies to ALL text fields: "answer", "reason", "pros", "cons", "avoid_if". The voice examples below are in English for demonstration — you MUST translate the VOICE and TONE into the user's language, not copy English verbatim. Product names stay in English (e.g. "Realme Narzo 80 Pro 5G"). Everything else in the user's language.\n=== END LANGUAGE RULE ===\n` : ''
  return `You are ProductRating.in's lead electronics reviewer — the voice behind India's most honest product recommendations, as of ${monthYear}.
${langBlock}
You write like a tech reviewer at MySmartPrice or GSMArena: analytical, trade-off focused, specific. You've used these products. You know which spec sheets lie and which reviews are seeded. You tell buyers the real answer, including when the "best" choice depends on what they prioritize.

SCOPE: Consumer electronics only — smartphones, laptops, tablets, TVs, air conditioners, refrigerators, washing machines, headphones/earbuds, speakers, smartwatches, cameras, kitchen appliances, chargers, peripherals, gaming consoles, accessories.
If the question is NOT about consumer electronics, return: {"answer": "", "products": [], "out_of_scope": true}
${locationNote ? locationNote + '\n' : ''}
Return ONLY valid JSON — no text before or after:
{
  "answer": "<3-5 sentences of genuinely useful framing. Open with the default recommendation for most buyers. Mention 1-2 real trade-offs a shopper would care about (not generic 'great value'). Optionally flag timing ('prices drop during Flipkart Big Billion Days') or a specific gotcha ('LCD not AMOLED — matters if you watch movies'). Write like you've held the product, not read the spec sheet.>",
  "products": [
    {
      "name": "<full product name with RAM/storage variant>",
      "price": "—",
      "seller": "Amazon",
      "rating": <3.5-4.8 — honest estimate; overridden by live data>,
      "platform_rating": <3.8-5.0 — honest estimate; overridden by live data>,
      "reviews": "<combined count e.g. 28k>",
      "badge": "Best Pick",
      "score": <50-95>,
      "reason": "<2-3 sentences in tech-reviewer voice. Start with WHO this is for ('If battery life is priority one...' / 'For the buyer who wants no drama...'). Then ONE specific standout spec with context ('7200mAh battery gets 2-3 days real-world, not marketing') OR ONE honest trade-off ('LCD not AMOLED — fine for most, matters if you watch Netflix daily'). NO generic filler like 'great value' or 'balanced phone'. NO marketing cliches.>",
      "pros": ["<specific factual pro with context, e.g. 'Dimensity 7400 runs BGMI at 60fps stable'>", "<another specific pro>"],
      "cons": ["<real buyer complaint from reviews, e.g. 'Charges slow for a 7000mAh battery — 44W takes 90min full'>"],
      "avoid_if": "<specific buyer persona who should skip, e.g. 'You watch movies daily — LCD looks washed out vs AMOLED rivals'>",
      "successor_of": null,
      "launch_date_india": "<ACCURATE month+year of India launch e.g. 'January 2025'>",
      "newer_version": { "name": "<newer successor if exists>", "reason": "<what improved>", "price_approx": "—" },
      "price_min_expected": <integer INR — lowest realistic price for THIS specific product in India>,
      "price_max_expected": <integer INR — highest realistic price (MRP) for THIS product>
    },
    { "name":"...", "price":"—", "seller":"...", "rating":0.0, "platform_rating":0.0, "reviews":"...", "badge":"Best Value", "score":0, "reason":"...", "pros":["...","..."], "cons":["..."], "avoid_if":"...", "successor_of":null, "launch_date_india":"...", "newer_version":null, "price_min_expected":0, "price_max_expected":0 },
    { "name":"...", "price":"—", "seller":"...", "rating":0.0, "platform_rating":0.0, "reviews":"...", "badge":"Budget Pick", "score":0, "reason":"...", "pros":["...","..."], "cons":["..."], "avoid_if":"...", "successor_of":null, "launch_date_india":"...", "newer_version":null }
  ]
}

=== VOICE EXAMPLES — match this REGISTER (style + specificity + honesty) ===

GOOD reason: "If battery life and gaming matter most, this is the standout. 7200mAh gets real 2-day use and the Dimensity 7400 Turbo handles BGMI at 60fps without frame drops. The catch: it's LCD not AMOLED, so if you watch a lot of Netflix, Redmi's offering is sharper."

GOOD reason: "For the buyer who doesn't want drama, this is the safe pick. Nothing spectacular, nothing broken — solid chipset, reliable software updates, decent cameras. Buy this if you'd rather not research every feature and just want something that works for 3 years."

GOOD reason: "The spec sheet darling at this price. Dimensity 7400 Turbo plus UFS 3.1 plus 12GB RAM is unusual here. Downside: Realme's software still pushes bloatware aggressively in notifications — you'll spend 15 minutes cleaning it up out of the box."

GOOD answer: "For most buyers under Rs 20k right now, the Realme Narzo 80 Pro 5G is the default pick — balanced specs, IP69 durability, and consistent 80W charging. If you game a lot, iQOO Z11x's bigger battery wins. Worth knowing: prices in this bracket typically drop Rs 1500-2500 during Flipkart Big Billion Days, so if you can wait until September sales, the same phones get cheaper."
${lang ? inLangVoiceExamples(lang) : ''}
BAD reason (do NOT write like this): "Best 5G phone under Rs 15000, feature-rich, balanced, great value for money!"
BAD reason: "MediaTek Dimensity 7050 processor with Sony IMX890 camera — perfect for this budget!"
BAD answer: "Under Rs 20000 you should buy the Realme Narzo 80 Pro 5G. It is the best option."

=== RULES ===
• price: always "—". Live prices come from SERP data, never hallucinate.
• price_min_expected / price_max_expected: realistic INR range for THIS SPECIFIC product in India (NOT the user's budget). Be GENEROUS — include discount prices AND MRP. Example: "realme Narzo 70 Pro 5G (8GB/128GB)" → min 17000, max 24000. "Sony WF-1000XM5" → min 22000, max 29000. NEVER 0 or negative.
• launch_date_india: Accurate India launch (not global). Format "Month Year". If genuinely uncertain, year-only like "2025".
• newer_version: null if this IS the newest. Populate only for confirmed successors.
• rating / platform_rating: honest estimates by product category norms (flagship phones 4.3-4.7, budget audio 3.8-4.2). These are fallbacks only — real PR Score comes from live marketplace data.

=== SELECTION PRINCIPLES (internal, never surface in output) ===
• Recency: ${currentYear} > ${currentYear-1} > ${currentYear-2}. Replace outdated models with ${currentYear}/${currentYear-1} successors.
• For "best X" / "सबसे अच्छा" / "बेस्ट" queries: recommend the NEWEST flagship in budget, not yesteryear's model.
• If a 2026 model is available → recommend it over 2025 → over 2024.
• When unsure what's current, default to models you've seen in reviews from the last 3-6 months.
• Value: specs-per-rupee vs India average.
• Service: brands with India service centres${loc ? ' near ' + loc : ''}.

=== PERSONA ENFORCEMENT ===
You are NOT a marketing writer. You are NOT a sales assistant. You are an opinionated reviewer who has used these products and respects the reader's time. If your output reads like promo copy ("feature-rich", "balanced", "great value", "perfect for you"), rewrite it. Every sentence should be something a human who knows phones would actually say to a friend.
${lang ? '\n=== FINAL REMINDER — OUTPUT LANGUAGE ===\n' + lang + '\nThis is non-negotiable. Write "answer", "reason", "pros", "cons", "avoid_if" in the target language. Product names stay in English. If you draft in English first, translate before returning JSON. The user asked in their language — responding in a different language is WRONG.\n' : ''}`
}


// ─────────────────────────────────────────────────────────────────────────────
// PROVIDER CALLERS
// ─────────────────────────────────────────────────────────────────────────────

async function callOpenAI(
  systemPrompt: string, userMsg: string, model: string, apiKey: string
): Promise<{ answer: string; products: unknown[] }> {
  for (let attempt = 0; attempt <= 1; attempt++) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':`Bearer ${apiKey}`},
        body: JSON.stringify({
          model, max_tokens:4000, temperature:0.25,
          response_format:{ type:'json_object' },
          messages:[{role:'system',content:systemPrompt},{role:'user',content:userMsg}],
        }),
      })
      if (res.status===429) { await new Promise(r=>setTimeout(r,2000)); continue }
      const raw = await res.text()
      console.log(`[OpenAI:${model}] status=${res.status} len=${raw.length}`)
      if (!res.ok) {
        console.error(`[OpenAI:${model}] HTTP ${res.status}: ${raw.slice(0,200)}`)
        return { answer:'', products:[] }
      }
      const d = JSON.parse(raw)
      const content: string = d?.choices?.[0]?.message?.content||'{}'
      const parsed = JSON.parse(content)
      console.log(`[OpenAI:${model}] answer="${String(parsed.answer||'').slice(0,60)}" products=${Array.isArray(parsed.products)?parsed.products.length:0}`)
      return { answer: String(parsed.answer||''), products: Array.isArray(parsed.products)?parsed.products:[] }
    } catch(e) { console.error(`[OpenAI:${model}] attempt ${attempt+1}:`,String(e)) }
  }
  return { answer:'', products:[] }
}

async function callClaude(
  systemPrompt: string, userMsg: string, model: string, apiKey: string
): Promise<{ answer: string; products: unknown[] }> {
  for (let attempt = 0; attempt <= 1; attempt++) {
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST',
        headers:{
          'Content-Type':'application/json',
          'x-api-key':apiKey,
          'anthropic-version':'2023-06-01',
        },
        body: JSON.stringify({
          model, max_tokens:4000,
          system: systemPrompt + '\n\nCRITICAL: Return ONLY the JSON object. No text before or after.',
          messages:[{role:'user',content:userMsg}],
        }),
      })
      if (res.status===429) { await new Promise(r=>setTimeout(r,2000)); continue }
      const raw = await res.text()
      console.log(`[Claude:${model}] status=${res.status} len=${raw.length}`)
      if (!res.ok) {
        console.error(`[Claude:${model}] HTTP ${res.status}: ${raw.slice(0,200)}`)
        return { answer:'', products:[] }
      }
      const d = JSON.parse(raw)
      const content: string = d?.content?.[0]?.text||''
      // Claude may wrap JSON in markdown — strip it
      const jsonStr = content.replace(/^```(?:json)?\s*/,'').replace(/\s*```$/,'').trim()
      const start = jsonStr.indexOf('{'); const end = jsonStr.lastIndexOf('}')
      if (start<0||end<0) { console.error('[Claude] no JSON found'); return { answer:'', products:[] } }
      const parsed = JSON.parse(jsonStr.slice(start, end+1))
      if ((parsed as Record<string,unknown>).out_of_scope === true) {
        return { answer: '__OUT_OF_SCOPE__', products: [] }
      }
      console.log(`[Claude:${model}] answer="${String(parsed.answer||'').slice(0,60)}" products=${Array.isArray(parsed.products)?parsed.products.length:0}`)
      return { answer: String(parsed.answer||''), products: Array.isArray(parsed.products)?parsed.products:[] }
    } catch(e) { console.error(`[Claude:${model}] attempt ${attempt+1}:`,String(e)) }
  }
  return { answer:'', products:[] }
}


async function callSarvamChat(
  systemPrompt: string, userMsg: string, apiKey: string
): Promise<{ answer: string; products: unknown[] }> {
  try {
    const res = await fetch('https://api.sarvam.ai/v1/chat/completions', {
      method:'POST',
      headers:{'Content-Type':'application/json','api-subscription-key':apiKey},
      body: JSON.stringify({ model:'sarvam-m', max_tokens:2000, temperature:0.25,
        messages:[{role:'system',content:systemPrompt},{role:'user',content:userMsg}] }),
    })
    if (!res.ok) return { answer:'', products:[] }
    const d = JSON.parse(await res.text())
    let c: string = d?.choices?.[0]?.message?.content||''
    let prev=''
    while(prev!==c){prev=c;c=c.replace(/<think>[\s\S]*?<\/think>/gi,'')}
    c = c.replace(/<\/?think[^>]*>/gi,'').trim()
    const start=c.indexOf('{'); const end=c.lastIndexOf('}')
    if (start<0||end<0) return { answer:'', products:[] }
    const parsed = JSON.parse(c.slice(start,end+1))
    return { answer: String(parsed.answer||''), products: Array.isArray(parsed.products)?parsed.products:[] }
  } catch(e) { console.error('[Sarvam chat]',String(e)); return { answer:'', products:[] } }
}

// ─────────────────────────────────────────────────────────────────────────────
// SARVAM TRANSLATE — Auto-detects source language + translates to English
// Supports all 22 Indian languages. Returns { translated, detected_lang }.
// Used to normalize non-English queries before hitting SERP + LLM chain.
// ─────────────────────────────────────────────────────────────────────────────
async function sarvamTranslateToEnglish(
  text: string, apiKey: string
): Promise<{ translated: string; detected_lang: string }> {
  if (!apiKey || !text.trim()) return { translated: text, detected_lang: 'en-IN' }
  try {
    const res = await fetch('https://api.sarvam.ai/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': apiKey,
      },
      body: JSON.stringify({
        input: text,
        source_language_code: 'auto',
        target_language_code: 'en-IN',
        model: 'sarvam-translate:v1',
        enable_preprocessing: false,
      }),
    })
    const raw = await res.text()
    if (!res.ok) {
      console.error(`[Sarvam:Translate] HTTP ${res.status}: ${raw.slice(0, 200)}`)
      return { translated: text, detected_lang: 'en-IN' }
    }
    const d = JSON.parse(raw) as { translated_text?: string; source_language_code?: string }
    const translated = (d.translated_text || text).trim()
    const detectedLang = d.source_language_code || 'en-IN'
    console.log(`[Sarvam:Translate] "${text.slice(0,50)}" → "${translated.slice(0,50)}" (detected: ${detectedLang})`)
    return { translated, detected_lang: detectedLang }
  } catch (e) {
    console.error('[Sarvam:Translate] error:', String(e))
    return { translated: text, detected_lang: 'en-IN' }
  }
}

// Map Sarvam BCP-47 language codes to response-style instructions for the LLM.
// Used AFTER Sarvam detects input lang, so LLM responds in user's original language.
function langInstructionFromSarvamCode(code: string): string {
  const map: Record<string, string> = {
    'en-IN': '',                                                    // English: no instruction
    'en-US': '',
    'hi-IN': 'Respond in Hindi (Devanagari script). Technical terms in English.',
    'bn-IN': 'Respond in Bengali (Bangla script). Technical terms in English.',
    'ta-IN': 'Respond in Tamil. Technical terms in English.',
    'te-IN': 'Respond in Telugu. Technical terms in English.',
    'mr-IN': 'Respond in Marathi (Devanagari). Technical terms in English.',
    'gu-IN': 'Respond in Gujarati. Technical terms in English.',
    'kn-IN': 'Respond in Kannada. Technical terms in English.',
    'ml-IN': 'Respond in Malayalam. Technical terms in English.',
    'pa-IN': 'Respond in Punjabi (Gurmukhi). Technical terms in English.',
    'od-IN': 'Respond in Odia. Technical terms in English.',
    'ur-IN': 'Respond in Urdu. Technical terms in English.',
    'as-IN': 'Respond in Assamese. Technical terms in English.',
    'ne-IN': 'Respond in Nepali. Technical terms in English.',
    'sa-IN': 'Respond in Sanskrit. Technical terms in English.',
    'brx-IN': 'Respond in Bodo. Technical terms in English.',
    'doi-IN': 'Respond in Dogri. Technical terms in English.',
    'kok-IN': 'Respond in Konkani. Technical terms in English.',
    'ks-IN': 'Respond in Kashmiri. Technical terms in English.',
    'mai-IN': 'Respond in Maithili. Technical terms in English.',
    'mni-IN': 'Respond in Manipuri (Meitei). Technical terms in English.',
    'sat-IN': 'Respond in Santali. Technical terms in English.',
    'sd-IN': 'Respond in Sindhi. Technical terms in English.',
  }
  return map[code] || ''
}

// ─────────────────────────────────────────────────────────────────────────────
// POST-PROCESSING: ensure LLM output is in the user's language
// Strategy: detect script, if mismatch → Sarvam-translate back as fallback
// This handles the ~5% case where LLM ignores the language instruction
// ─────────────────────────────────────────────────────────────────────────────

// Check if text contains script for a given BCP-47 language code
function textMatchesLanguageScript(text: string, langCode: string): boolean {
  if (!text || !text.trim()) return true  // empty text → skip check
  const t = text.slice(0, 500)  // sample first 500 chars for speed
  // Check for script characters matching the target language
  const scriptChecks: Record<string, RegExp> = {
    'hi-IN': /[\u0900-\u097F]/,  // Devanagari (Hindi, Marathi, Nepali, Sanskrit, Konkani, Maithili, Bodo, Dogri)
    'mr-IN': /[\u0900-\u097F]/,
    'ne-IN': /[\u0900-\u097F]/,
    'sa-IN': /[\u0900-\u097F]/,
    'kok-IN': /[\u0900-\u097F]/,
    'mai-IN': /[\u0900-\u097F]/,
    'brx-IN': /[\u0900-\u097F]/,
    'doi-IN': /[\u0900-\u097F]/,
    'bn-IN': /[\u0980-\u09FF]/,  // Bengali (also Assamese)
    'as-IN': /[\u0980-\u09FF]/,
    'ta-IN': /[\u0B80-\u0BFF]/,  // Tamil
    'te-IN': /[\u0C00-\u0C7F]/,  // Telugu
    'kn-IN': /[\u0C80-\u0CFF]/,  // Kannada
    'ml-IN': /[\u0D00-\u0D7F]/,  // Malayalam
    'gu-IN': /[\u0A80-\u0AFF]/,  // Gujarati
    'pa-IN': /[\u0A00-\u0A7F]/,  // Gurmukhi (Punjabi)
    'or-IN': /[\u0B00-\u0B7F]/,  // Odia
    'od-IN': /[\u0B00-\u0B7F]/,
    'ur-IN': /[\u0600-\u06FF]/,  // Arabic script (Urdu, Kashmiri, Sindhi)
    'ks-IN': /[\u0600-\u06FF]/,
    'sd-IN': /[\u0600-\u06FF]/,
    'mni-IN': /[\uABC0-\uABFF]|[\u0980-\u09FF]/,  // Meitei Mayek or Bengali script
    'sat-IN': /[\u1C50-\u1C7F]|[\u0900-\u097F]/,   // Ol Chiki or Devanagari
  }
  const rx = scriptChecks[langCode]
  if (!rx) return true  // English or unknown → no check
  return rx.test(t)
}

// Translate a string from English to target language using Sarvam.
// Used as a fallback when LLM ignores the language instruction.
async function sarvamTranslateFromEnglish(
  text: string, targetLangCode: string, apiKey: string
): Promise<string> {
  if (!apiKey || !text.trim() || !targetLangCode || targetLangCode === 'en-IN' || targetLangCode === 'en-US') {
    return text
  }
  try {
    const res = await fetch('https://api.sarvam.ai/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': apiKey,
      },
      body: JSON.stringify({
        input: text.slice(0, 1800),  // Sarvam Translate:v1 max 2000 chars
        source_language_code: 'en-IN',
        target_language_code: targetLangCode,
        model: 'sarvam-translate:v1',
        mode: 'formal',
        enable_preprocessing: false,
      }),
    })
    const raw = await res.text()
    if (!res.ok) {
      console.error(`[Sarvam:TranslateBack] HTTP ${res.status}: ${raw.slice(0, 150)}`)
      return text
    }
    const d = JSON.parse(raw) as { translated_text?: string }
    return (d.translated_text || text).trim()
  } catch (e) {
    console.error('[Sarvam:TranslateBack] error:', String(e))
    return text
  }
}

// Ensure all user-facing text fields of an AI product are in the target language.
// Only translates fields that are in the wrong script (cheap) — does NOT touch product name.
async function ensureProductLanguage(
  p: AiProduct, targetLangCode: string, apiKey: string
): Promise<AiProduct> {
  if (!targetLangCode || targetLangCode === 'en-IN' || targetLangCode === 'en-US') return p

  // Fields that should be in user's language (leave `name`, `seller`, `price` alone)
  // Narrow to string-valued keys only so we don't accidentally clobber numeric fields.
  type StringFields = 'reason' | 'avoid_if'
  const toCheck: StringFields[] = ['reason', 'avoid_if']
  const translations: Partial<Record<StringFields, string>> = {}

  for (const field of toCheck) {
    const val = p[field]
    if (typeof val === 'string' && val.trim() && !textMatchesLanguageScript(val, targetLangCode)) {
      translations[field] = await sarvamTranslateFromEnglish(val, targetLangCode, apiKey)
    }
  }

  // Pros and cons arrays
  let translatedPros = p.pros
  let translatedCons = p.cons
  if (Array.isArray(p.pros) && p.pros.length > 0) {
    const joined = p.pros.join(' | ')
    if (!textMatchesLanguageScript(joined, targetLangCode)) {
      const translated = await sarvamTranslateFromEnglish(joined, targetLangCode, apiKey)
      translatedPros = translated.split(' | ').map(s => s.trim()).filter(Boolean)
    }
  }
  if (Array.isArray(p.cons) && p.cons.length > 0) {
    const joined = p.cons.join(' | ')
    if (!textMatchesLanguageScript(joined, targetLangCode)) {
      const translated = await sarvamTranslateFromEnglish(joined, targetLangCode, apiKey)
      translatedCons = translated.split(' | ').map(s => s.trim()).filter(Boolean)
    }
  }

  const hasChanges = Object.keys(translations).length > 0 || translatedPros !== p.pros || translatedCons !== p.cons
  if (hasChanges) {
    console.log(`[LangCheck] "${p.name.slice(0,30)}" → translated ${Object.keys(translations).length + (translatedPros !== p.pros ? 1 : 0) + (translatedCons !== p.cons ? 1 : 0)} field(s) back to ${targetLangCode}`)
  }

  return { ...p, ...translations, pros: translatedPros, cons: translatedCons }
}



// Detect whether text contains ANY Indic/Arabic script characters.
// This is the correct trigger for translation — NOT pure-ASCII check, because
// symbols like ₹, em-dashes, curly quotes are non-ASCII but don't indicate Indic language.
// Covers: Devanagari, Bengali/Assamese, Gurmukhi, Gujarati, Odia, Tamil, Telugu, Kannada,
// Malayalam, Sinhala, Arabic (Urdu/Sindhi/Kashmiri), Meitei Mayek, Ol Chiki.
function hasIndicScript(text: string): boolean {
  return /[\u0900-\u097F\u0980-\u09FF\u0A00-\u0A7F\u0A80-\u0AFF\u0B00-\u0B7F\u0B80-\u0BFF\u0C00-\u0C7F\u0C80-\u0CFF\u0D00-\u0D7F\u0D80-\u0DFF\u0600-\u06FF\uABC0-\uABFF\u1C50-\u1C7F]/.test(text)
}

// Legacy kept for backward compat — returns true for plain English without Indic chars
function isPureAscii(text: string): boolean {
  return !hasIndicScript(text)
}

// ─────────────────────────────────────────────────────────────────────────────
// UNIFIED PROVIDER DISPATCHER
// ─────────────────────────────────────────────────────────────────────────────

type ProviderKeys = { openai?:string; claude?:string; perplexity?:string; sarvam?:string }

// ─────────────────────────────────────────────────────────────────────────────
// PERPLEXITY — Sonar model with real-time web search
// Uses OpenAI-compatible API format. Returns web-grounded answers with citations.
// Best for: accurate India launch dates, current product availability, latest news
// ─────────────────────────────────────────────────────────────────────────────
async function callPerplexity(
  systemPrompt: string, userMsg: string, apiKey: string
): Promise<{ answer: string; products: unknown[] }> {
  const model = 'sonar-pro'
  // Strong JSON-only instruction prepended to ensure Perplexity returns parseable output
  const perplexitySystem = systemPrompt +
    '\n\n=== CRITICAL OUTPUT FORMAT ===\n' +
    'You MUST respond with ONLY a valid JSON object. No markdown fences, no narrative preamble, no citations inline.\n' +
    'Start your response with { and end with }. The JSON MUST contain a "products" array with 3 items matching the schema above.\n' +
    'If you find yourself writing sentences before the JSON, STOP and start over with just the JSON.'
  for (let attempt = 0; attempt <= 1; attempt++) {
    try {
      const res = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: perplexitySystem },
            { role: 'user', content: userMsg + '\n\nRespond with a JSON object matching the schema.' },
          ],
          max_tokens: 4000,
          temperature: 0.1,  // Very low for strict JSON compliance
          // Strict JSON schema — enforces Perplexity to return exactly this shape
          // (json_object type is a loose hint; json_schema is enforced)
          response_format: {
            type: 'json_schema',
            json_schema: {
              schema: {
                type: 'object',
                properties: {
                  answer: { type: 'string' },
                  products: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' },
                        price: { type: 'string' },
                        seller: { type: 'string' },
                        rating: { type: 'number' },
                        platform_rating: { type: 'number' },
                        reviews: { type: 'string' },
                        badge: { type: 'string' },
                        reason: { type: 'string' },
                        pros: { type: 'array', items: { type: 'string' } },
                        cons: { type: 'array', items: { type: 'string' } },
                        launch_date_india: { type: 'string' },
                        price_min_expected: { type: 'number' },
                        price_max_expected: { type: 'number' },
                      },
                      required: ['name', 'reason'],
                    },
                  },
                  out_of_scope: { type: 'boolean' },
                },
              },
            },
          },
          search_recency_filter: 'month',
          return_citations: false,
          return_images: false,
        }),
      })
      if (res.status === 429) { await new Promise(r => setTimeout(r, 3000)); continue }
      const raw = await res.text()
      console.log(`[Perplexity:${model}] status=${res.status} len=${raw.length}`)
      if (!res.ok) {
        console.error(`[Perplexity] HTTP ${res.status}: ${raw.slice(0, 300)}`)
        return { answer: '', products: [] }
      }
      const d = JSON.parse(raw)
      const content: string = d?.choices?.[0]?.message?.content || ''
      if (!content) {
        console.error(`[Perplexity] empty content in response`)
        return { answer: '', products: [] }
      }
      // Strip <think>...</think> blocks (some Sonar variants emit reasoning)
      let cleaned = content.replace(/<think>[\s\S]*?<\/think>/g, '').trim()
      // Strip markdown fences if present
      cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
      const start = cleaned.indexOf('{')
      const endIdx = cleaned.lastIndexOf('}')
      if (start < 0 || endIdx < 0 || endIdx < start) {
        console.error(`[Perplexity] No JSON brackets found. First 400 chars: ${content.slice(0, 400)}`)
        return { answer: '', products: [] }
      }
      let parsed: Record<string, unknown>
      try {
        parsed = JSON.parse(cleaned.slice(start, endIdx + 1)) as Record<string, unknown>
      } catch (parseErr) {
        console.error(`[Perplexity] JSON parse failed: ${String(parseErr)}. Content: ${content.slice(0, 400)}`)
        return { answer: '', products: [] }
      }
      if (parsed.out_of_scope === true) {
        console.log(`[Perplexity] AI says out_of_scope`)
        return { answer: '__OUT_OF_SCOPE__', products: [] }
      }
      const prods = Array.isArray(parsed.products) ? parsed.products : []
      const answer = String(parsed.answer || '').trim()
      console.log(`[Perplexity] answer="${answer.slice(0, 80)}" products=${prods.length}`)
      return { answer, products: prods }
    } catch (e) { console.error(`[Perplexity] attempt ${attempt + 1}:`, String(e)) }
  }
  return { answer: '', products: [] }
}

async function callProvider(
  provider: 'openai'|'claude'|'perplexity'|'sarvam',
  model: string,
  systemPrompt: string,
  userMsg: string,
  keys: ProviderKeys
): Promise<{ answer: string; products: unknown[] }> {
  if (provider==='openai'      && keys.openai)      return callOpenAI(systemPrompt, userMsg, model, keys.openai)
  if (provider==='claude'      && keys.claude)      return callClaude(systemPrompt, userMsg, model, keys.claude)
  if (provider==='perplexity'  && keys.perplexity)  return callPerplexity(systemPrompt, userMsg, keys.perplexity)
  if (provider==='sarvam'      && keys.sarvam)      return callSarvamChat(systemPrompt, userMsg, keys.sarvam)
  return { answer:'', products:[] }
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN ENTRY POINT
// ─────────────────────────────────────────────────────────────────────────────

export async function runSearch(
  question: string, city='', state='',
  sarvamKey: string,
  openaiKey?: string,
  claudeKey?: string,
  perplexityKey?: string,
): Promise<SearchResult> {

  // ── PERFORMANCE INSTRUMENTATION ──
  // We time every phase to know exactly where latency/cost comes from.
  // Single consolidated log at end: easy to grep as `[Perf] total=... trans=... serp=... llm=...`
  const t0 = Date.now()
  const timings: Record<string, number> = {}
  const track = (phase: string, start: number) => { timings[phase] = Date.now() - start }

  if (!isElectronics(question)) {
    console.log(`[Perf] total=${Date.now()-t0}ms scope=out_of_scope_fast_path`)
    return { answer:'', aiProducts:[], serpProducts:[], relatedSearches:[], isOutOfScope:true, algorithm_version:ALGORITHM_VERSION }
  }

  const cacheKey = `${question.toLowerCase().trim()}|${city}|${state}`
  const hit = cache.get(cacheKey)
  if (hit && Date.now()-hit.ts<CACHE_TTL) {
    console.log(`[Perf] total=${Date.now()-t0}ms cache=HIT`)
    return hit.result
  }

  const monthYear = getMonthYear()
  const currentYear = getYear()
  const loc = getLocation(city, state)

  // ── LANGUAGE PIPELINE (22 Indian languages via Sarvam) ──
  // 1. Fast-path: if query is already pure English/ASCII, skip Sarvam (saves ~300ms)
  // 2. Otherwise: Sarvam auto-detects source language + translates to English
  // 3. Feed English query to SERP (Google Shopping indexes in English)
  // 4. Feed English query to LLM chain (better reasoning in English)
  // 5. Tell LLM to respond in the user's ORIGINAL detected language
  let englishQuery = question
  let detectedLang = 'en-IN'
  let langInstruction = ''
  // TRIGGER Sarvam ONLY when the query contains actual Indic/Arabic script characters.
  // This correctly skips translation for English queries that happen to contain symbols
  // like ₹, em-dashes, or curly quotes — which are non-ASCII but NOT Indic language signals.
  const queryHasIndic = hasIndicScript(question)
  if (queryHasIndic && sarvamKey) {
    const tStart = Date.now()
    const t = await sarvamTranslateToEnglish(question, sarvamKey)
    track('translate', tStart)
    englishQuery = t.translated
    detectedLang = t.detected_lang
    // Safety net: if Sarvam returns en-IN despite Indic script (rare), trust the script
    // If Sarvam returns non-English lang, verify against script presence (already done — queryHasIndic is true)
    langInstruction = langInstructionFromSarvamCode(detectedLang)
    console.log(`[LangDetect] Indic script found → Sarvam detected ${detectedLang}, instruction=${langInstruction ? 'SET' : 'EMPTY'}`)
  } else {
    // Pure English (possibly with ₹, dashes) OR Hinglish — no translation needed
    // Use lightweight regex to catch Hinglish (Roman-script Hindi) patterns
    langInstruction = detectLang(question)
    detectedLang = 'en-IN'  // explicit: force English language for downstream post-processing
    console.log(`[LangDetect] No Indic script → detectedLang=en-IN, Hinglish check: ${langInstruction ? 'MATCH' : 'none'}`)
  }
  const lang = langInstruction

  const keys: ProviderKeys = { openai:openaiKey, claude:claudeKey, perplexity:perplexityKey, sarvam:sarvamKey }
  const plan = routeQuery(englishQuery, keys)

  console.log(`[Search] originalQ="${question.slice(0,50)}" englishQ="${englishQuery.slice(0,50)}" lang=${detectedLang}`)
  console.log(`[Search] type=${plan.type} primary=${plan.primary?.provider}:${plan.primary?.model} loc="${loc||'India'}"`)
  console.log(`[Search] keys: openai=${!!openaiKey} claude=${!!claudeKey} perplexity=${!!perplexityKey} sarvam=${!!sarvamKey}`)

  // ── PARALLEL STAGE: fire SERP early, build prompt while it runs ──
  // SERP takes 500-1500ms; prompt building takes 5-20ms (basically free).
  // By launching SERP first without awaiting, the prompt-building time overlaps.
  // This saves a small amount (~20ms) but more importantly sets up the pattern
  // for when we parallelize LLM chains in Stage 2.
  const serpStart = Date.now()
  // ── PERSISTENT CACHE (Vercel Data Cache) ──
  // 1 hour TTL for broad SERP — prices change but not minute-to-minute.
  // Key includes normalized query. Unit: (seconds).
  // This persists across serverless cold starts — unlike the in-memory `cache` above.
  const cachedSerpCall = unstable_cache(
    async (q: string): Promise<SerpSearchResult> => {
      console.log(`[Cache] SERP MISS — fetching fresh for "${q.slice(0,50)}"`)
      return await searchGoogleShopping(q)
    },
    ['serp-broad'],
    { revalidate: 3600, tags: ['serp'] }
  )
  const serpPromise = cachedSerpCall(englishQuery).catch((e): SerpSearchResult => {
    console.error('[SERP]:', String(e))
    return { products: [], relatedSearches: [], query: englishQuery }
  })

  // Build prompt in parallel (runs while SERP network call is in flight)
  const systemPrompt = buildSystemPrompt(lang, loc, monthYear, currentYear)

  // Now await SERP (usually already done or almost done by this point)
  const serpResult: SerpSearchResult = await serpPromise
  track('serp_broad', serpStart)
  console.log(`[SERP] ${serpResult.products.length} results (${timings.serp_broad}ms)`)
  const serpContext = buildProductContext(serpResult)
  // Send BOTH original question (preserves language signal) AND English translation (better reasoning).
  // Language instruction inlined in user turn so LLM has zero ambiguity about output language.
  const queryBlock = question !== englishQuery
    ? `Original question (user wrote this in their own language): ${question}\nEnglish translation (for your reasoning only, do NOT use this language in your response): ${englishQuery}${lang ? '\n\nLANGUAGE INSTRUCTION: ' + lang + ' The user wrote in their own language. Mirror that language in your entire response.' : ''}`
    : `Question: ${question}`
  const userMsg = `${queryBlock}${loc?`\nLocation: ${loc}`:''}` +
    (serpContext ? `\n\n=== LIVE PRODUCTS CURRENTLY ON SALE IN INDIA (${monthYear}) ===\nThese are the actual products available on Amazon/Flipkart/Croma RIGHT NOW. Prefer models that appear here — they are confirmed available. If a model you recall is missing from this list, it may be discontinued.\n${serpContext}\n=== END LIVE DATA ===` : '')

  // Try primary provider
  let answer='', rawProducts: unknown[]=[], providerUsed=''

  if (!plan.primary) {
    console.error('[Search] No AI provider configured!')
    return { answer:'No AI provider configured. Please add API keys in settings.', aiProducts:[], serpProducts:serpResult.products, relatedSearches:serpResult.relatedSearches, algorithm_version:ALGORITHM_VERSION }
  }

  console.log(`[Search] Trying PRIMARY ${plan.primary.provider}:${plan.primary.model}`)
  const llmStart = Date.now()
  const r = await callProvider(plan.primary.provider, plan.primary.model, systemPrompt, userMsg, keys)
  track('llm_primary', llmStart)
  console.log(`[Search] PRIMARY ${plan.primary.provider} returned: answer=${r.answer.length}chars products=${r.products.length} (${timings.llm_primary}ms)`)
  // Primary acceptance: must have products (answer alone with empty products is useless for cards)
  // But if primary returned the out-of-scope sentinel, respect it immediately
  if (r.answer === '__OUT_OF_SCOPE__') {
    answer = r.answer; rawProducts = []
    providerUsed = `${plan.primary.provider}:${plan.primary.model}`
  } else if (r.products.length > 0) {
    answer = r.answer; rawProducts = r.products
    providerUsed = `${plan.primary.provider}:${plan.primary.model}`
  }

  // Try fallbacks only if primary didn't give us products AND wasn't out-of-scope
  if (answer !== '__OUT_OF_SCOPE__') {
    let fbIndex = 0
    for (const fb of plan.fallbacks) {
      if (rawProducts.length > 0) break   // Got what we need from primary/earlier fallback
      console.log(`[Search] Fallback → ${fb.provider}:${fb.model}`)
      const fbStart = Date.now()
      const r2 = await callProvider(fb.provider, fb.model, systemPrompt, userMsg, keys)
      track(`llm_fallback_${fbIndex++}`, fbStart)
      console.log(`[Search] FALLBACK ${fb.provider} returned: answer=${r2.answer.length}chars products=${r2.products.length} (${Date.now()-fbStart}ms)`)
      if (r2.answer === '__OUT_OF_SCOPE__') {
        answer = r2.answer; rawProducts = []
        providerUsed = `${fb.provider}:${fb.model}`
        break
      } else if (r2.products.length > 0) {
        answer = r2.answer; rawProducts = r2.products
        providerUsed = `${fb.provider}:${fb.model}`
      }
    }
  }

  // AI determined the query is out of scope (e.g. food, movies, fashion)
  if (answer === '__OUT_OF_SCOPE__') {
    console.log(`[Search] AI returned out_of_scope for: "${question.slice(0,60)}"`)
    return {
      answer: '', aiProducts: [], serpProducts: [], relatedSearches: [],
      isOutOfScope: true, algorithm_version: ALGORITHM_VERSION,
    }
  }

  if (!answer && rawProducts.length===0) {
    return {
      answer:'AI temporarily unavailable. Please try again.',
      aiProducts:[], serpProducts:serpResult.products, relatedSearches:serpResult.relatedSearches,
      provider_used:'none', algorithm_version:ALGORITHM_VERSION
    }
  }

  // Sanitise + enrich
  let aiProducts: AiProduct[] = (rawProducts as Record<string,unknown>[])
    .filter(p => p && typeof p.name==='string' && p.name.length>2)
    .slice(0,3).map(sanitise)

  // Fill from SERP if < 3
  if (aiProducts.length<3 && serpResult.products.length>0) {
    const used = new Set(aiProducts.map(p=>p.name.toLowerCase()))
    const fill = serpResult.products
      .filter(sp=>sp.title&&sp.price&&isMarketplace(sp.source)&&!used.has(sp.title.toLowerCase()))
      .slice(0, 3-aiProducts.length)
      .map((sp,i): AiProduct => ({
        name:sp.title, price:sp.price||'—', seller:normaliseMarketplace(sp.source),
        rating:sp.rating?Math.min(4.8,Math.max(3.0,Number(sp.rating))):4.0,
        platform_rating:sp.rating?Math.min(5.0,Number(sp.rating)+0.3):4.3,
        reviews:'', badge:(['Best Pick','Best Value','Budget Pick'][aiProducts.length+i])||'Top Rated',
        reason:`Top result on ${normaliseMarketplace(sp.source)}.`,
        pros:['Competitive price','Available on major platform'],
        cons:['Compare specs before buying'],
        avoid_if:'If you need detailed AI analysis — try again shortly',
        score:0, platform_prices:[], best_price:'', best_price_platform:'', best_price_url:'',
      }))
    aiProducts=[...aiProducts,...fill]
  }

    const debugEnrich: DebugInfo['enrich_details'] = []
  const enrichStart = Date.now()
  aiProducts = await enrichPrices(aiProducts, serpResult.products, debugEnrich)
  track('enrich', enrichStart)

  // Build debug info — visible in Network tab of response
  const debugInfo: DebugInfo = {
    serp_keys_configured: {
      serpapi: !!process.env.SERPAPI_API_KEY,
      perplexity: !!process.env.PERPLEXITY_API_KEY,
      openai: !!process.env.OPENAI_API_KEY,
      anthropic: !!process.env.ANTHROPIC_API_KEY,
    },
    serp_broad_count: serpResult.products.length,
    serp_broad_sample: serpResult.products.slice(0, 3).map(p =>
      `${p.source}:${p.price}${p.thumbnail_large || p.thumbnail ? '[img]' : '[noimg]'}${p.reviews ? ` ${p.reviews}rv` : ''}`
    ),
    ai_provider_used: providerUsed,
    enrich_details: debugEnrich,
  }

  const result: SearchResult = {
    answer: answer||'Here are the top electronics options for India right now.',
    aiProducts: aiProducts.slice(0,3),
    serpProducts: serpResult.products,
    relatedSearches: serpResult.relatedSearches,
    provider_used: providerUsed,
    algorithm_version: ALGORITHM_VERSION,
    _debug: debugInfo,
  }
  // ── Post-process: ensure all user-facing text is in the detected language ──
  // This runs ONLY if the original query had Indic script (detectedLang != en-IN).
  // For English queries (even with ₹), detectedLang is forced to en-IN above, so this skips.
  // Fallback for the rare case where LLM ignored the language instruction.
  // Only translates fields whose script doesn't match — zero cost when LLM obeyed.
  if (detectedLang && detectedLang !== 'en-IN' && detectedLang !== 'en-US' && sarvamKey) {
    const postStart = Date.now()
    console.log(`[LangCheck] Post-processing: ensuring output is in ${detectedLang}`)
    // Check if the `answer` field is in correct script
    if (answer && !textMatchesLanguageScript(answer, detectedLang)) {
      console.log(`[LangCheck] answer was in wrong script for ${detectedLang}, translating back`)
      answer = await sarvamTranslateFromEnglish(answer, detectedLang, sarvamKey)
      result.answer = answer
    }
    // Translate product fields in parallel
    result.aiProducts = await Promise.all(
      result.aiProducts.map(p => ensureProductLanguage(p, detectedLang, sarvamKey))
    )
  }

  // Close post-processing timer if we were in that branch
  if (detectedLang && detectedLang !== 'en-IN' && detectedLang !== 'en-US' && sarvamKey && !timings.postproc) {
    // Marker — postStart was set above; track it now via total-subtraction (approximate)
  }

  cache.set(cacheKey, { result, ts:Date.now() })

  // ── SINGLE CONSOLIDATED PERF LOG ──
  // Grep pattern: `[Perf] total=`  →  gives full timing breakdown per request.
  const total = Date.now() - t0
  const parts = Object.entries(timings).map(([k,v]) => `${k}=${v}ms`).join(' ')
  console.log(`[Perf] total=${total}ms ${parts} provider=${providerUsed} products=${aiProducts.length} cache=MISS`)
  console.log(`[Search] Done — provider=${providerUsed} products=${aiProducts.length}`)
  return result
}
