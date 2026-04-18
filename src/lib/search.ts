// src/lib/search.ts
// ProductRating.in — Multi-Provider AI Engine
// Voice: Sarvam AI | Search: Google SERP | Intelligence: OpenAI gpt-4.1 / Claude claude-sonnet-4-6
// Routing: Best model per query type, automatic fallback chain

import { searchGoogleShopping, buildProductContext, type SerpSearchResult } from './serpapi'

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
}

export type SearchResult = {
  answer: string
  aiProducts: AiProduct[]
  serpProducts: SerpSearchResult['products']
  relatedSearches: string[]
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
    // Perplexity sonar: web-search grounded → real launch dates, current product info
    perplexity: keys.perplexity ? { provider: 'perplexity' as const, model: 'sonar-pro'        } : null,
    openai_41:  keys.openai     ? { provider: 'openai'      as const, model: 'gpt-4.1'          } : null,
    openai_52:  keys.openai     ? { provider: 'openai'      as const, model: 'gpt-5.4'           } : null,
    claude:     keys.claude     ? { provider: 'claude'      as const, model: 'claude-opus-4-6'   } : null,
    sarvam:     keys.sarvam     ? { provider: 'sarvam'      as const, model: 'sarvam-m'          } : null,
  }

  if (type === 'compare') {
    // Compare: Claude (best analysis) → OpenAI gpt-5.2 → gpt-4.1 → Sarvammini
    // Compare: Claude best for analysis, OpenAI gpt-5.2 next, gpt-4.1 fallback, Sarvam last
    const primary = available.claude || available.openai_52 || available.openai_41 || available.sarvam
    const fallbacks = [available.openai_52, available.openai_41, available.sarvam]
      .filter((p): p is NonNullable<typeof p> => p !== null && p !== primary)
    return { type, primary: primary!, fallbacks }
  } else {
    // Simple: Perplexity FIRST (web-grounded = latest India models + current prices)
    // OpenAI/Claude have knowledge cutoffs — they'll recommend discontinued models confidently
    const primary = available.perplexity || available.openai_41 || available.claude || available.openai_52 || available.sarvam
    const fallbacks = [available.openai_41, available.claude, available.openai_52, available.sarvam]
      .filter((p): p is NonNullable<typeof p> => p !== null && p !== primary)
    return { type, primary: primary!, fallbacks }
  }
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
    platform_rating: Math.min(5.0, Math.max(r+0.15, Number(p.platform_rating)||r+0.3)),
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
  if (m.includes('amazon'))   return `https://www.amazon.in/s?k=${q}`
  if (m.includes('flipkart')) return `https://www.flipkart.com/search?q=${q}`
  if (m.includes('croma'))    return `https://www.croma.com/searchB?q=${q}`
  if (m.includes('reliance')) return `https://www.reliancedigital.in/search?q=${q}`
  if (m.includes('vijay'))    return `https://www.vijaysales.com/search/${q}`
  if (m.includes('tata'))     return `https://www.tatacliq.com/search/?text=${q}`
  return `https://www.amazon.in/s?k=${q}`
}

// ─────────────────────────────────────────────────────────────────────────────
// PRICE ENRICHMENT — Skyscanner style
// ─────────────────────────────────────────────────────────────────────────────

function enrichPrices(aiProducts: AiProduct[], serpProducts: SerpSearchResult['products']): AiProduct[] {
  return aiProducts.map(ai => {
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

    const matched = serpProducts.filter(sp => {
      if (!sp.title || !sp.price || !isMarketplace(sp.source)) return false
      const spTokens = new Set(tokenize(sp.title))

      // ALL must-match identifiers must be present (model numbers, storage, etc.)
      if (mustMatch.length > 0) {
        const modelHits = mustMatch.filter(t => spTokens.has(t) || Array.from(spTokens).some(st => st.includes(t))).length
        if (modelHits < Math.max(1, Math.ceil(mustMatch.length * 0.6))) return false
      }
      // At least one brand word must match
      const brandHit = brandTokens.some(t => spTokens.has(t))
      if (!brandHit && mustMatch.length === 0) return false

      return true
    })

    console.log(`[enrichPrices] "${ai.name.slice(0,40)}" → ${matched.length} SERP matches`)

    // ── Build per-platform best-price map ──
    // Keep the LOWEST price listing per platform (handles multiple sellers on Amazon/Flipkart)
    const byPlatform = new Map<string, {price_str:string;price_num:number;url:string}>()
    for (const sp of matched) {
      const key = normaliseMarketplace(sp.source)
      const priceNum = sp.price_numeric || parseInt(String(sp.price).replace(/[^\d]/g,'')) || 0
      if (priceNum <= 0) continue  // skip junk
      const existing = byPlatform.get(key)
      if (!existing || priceNum < existing.price_num) {
        byPlatform.set(key, {
          price_str: sp.price,
          price_num: priceNum,
          url: (sp.link && isMarketplace(sp.source)) ? sp.link : buildSearchUrl(key, ai.name),
        })
      }
    }

    // Ensure Amazon + Flipkart always appear (with search-fallback URL if no match)
    // Also add Croma, Reliance Digital as additional marketplaces if they had matches
    const ensurePlatforms = ['Amazon','Flipkart']
    for (const m of ensurePlatforms) {
      if (!byPlatform.has(m)) {
        byPlatform.set(m, { price_str:'', price_num:999999, url:buildSearchUrl(m, ai.name) })
      }
    }

    // Sort: real prices ascending, then unavailable at the end
    const entries = Array.from(byPlatform.entries())
      .sort((a,b) => {
        if (a[1].price_num === 999999) return 1
        if (b[1].price_num === 999999) return -1
        return a[1].price_num - b[1].price_num
      })
      .slice(0, 5)

    const platform_prices: PlatformPrice[] = entries.map(([platform, data], idx) => ({
      platform,
      price: data.price_num === 999999 ? '' : data.price_str,
      price_numeric: data.price_num,
      url: data.url,
      availability: data.price_num === 999999 ? 'unknown' : 'in_stock',
      is_lowest: idx === 0 && data.price_num !== 999999,
    }))
    // "Best" = lowest-priced platform that actually has data
    const best = platform_prices.find(p => p.is_lowest) || platform_prices.find(p => p.price_numeric !== 999999) || platform_prices[0]

    console.log(`[enrichPrices] "${ai.name.slice(0,30)}" best=${best?.platform}:${best?.price||'—'} platforms=${platform_prices.map(p=>`${p.platform}:${p.price||'—'}`).join(',')}`)

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

    // ── Average marketplace rating (weighted by review count) ──
    let ratingSum = 0, ratingWeight = 0
    for (const sp of matched) {
      if (sp.rating && sp.reviews) {
        ratingSum += sp.rating * sp.reviews
        ratingWeight += sp.reviews
      }
    }
    const marketplaceRating = ratingWeight > 0 ? Number((ratingSum / ratingWeight).toFixed(2)) : undefined

    // ── Best product image (from highest-rated matched listing) ──
    const bestImage = matched
      .filter(sp => sp.thumbnail)
      .sort((a,b) => (b.reviews||0) - (a.reviews||0))[0]?.thumbnail

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
    if (bestImage) result.image_url = bestImage
    if (bestDeal) result.deal_tag = bestDeal
    if (bestDelivery) result.delivery = bestDelivery

    return result
  })
}

function formatReviewCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/,'')}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/,'')}K`
  return String(n)
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED SYSTEM PROMPT
// ─────────────────────────────────────────────────────────────────────────────

function buildSystemPrompt(lang: string, loc: string, monthYear: string, currentYear: number): string {
  const locationNote = loc ? `User location: ${loc}.` : ''
  return `You are ProductRating.in, India's most trusted electronics advisor. ${monthYear}.

SCOPE: You ONLY help with consumer electronics queries — smartphones, laptops, tablets, TVs, air conditioners, refrigerators, washing machines, headphones/earbuds, speakers, smartwatches, cameras, kitchen appliances, chargers, peripherals, gaming consoles, accessories. You handle queries in English, Hindi, Hinglish, Tamil, Telugu, Bengali, Kannada, Malayalam, Marathi, and other Indian languages.
If the question is NOT about consumer electronics, return: {"answer": "", "products": [], "out_of_scope": true}
Otherwise, answer normally with full product recommendations.
${lang ? lang + '\n' : ''}${locationNote ? locationNote + '\n' : ''}
Return ONLY valid JSON — no text before or after:
{
  "answer": "<2 sentences of direct buying advice. No reasoning, no methodology. Just the recommendation.>",
  "products": [
    {
      "name": "<full product name with RAM/storage variant>",
      "price": "—",
      "seller": "Amazon",
      "rating": <3.5-4.8>,
      "platform_rating": <3.8-5.0>,
      "reviews": "<combined count e.g. 28k>",
      "badge": "Best Pick",
      "score": <50-95>,
      "reason": "<one sentence why #1 for this query>",
      "pros": ["<specific factual pro>", "<specific factual pro>"],
      "cons": ["<main real complaint from buyer reviews>"],
      "avoid_if": "<who should not buy this>",
      "successor_of": null,
      "launch_date_india": "<ACCURATE month+year of India launch e.g. 'January 2025' — search if unsure>",
      "newer_version": { "name": "<newer successor model if exists>", "reason": "<what improved>", "price_approx": "—" }
    },
    { "name":"...", "price":"—", "seller":"...", "rating":0.0, "platform_rating":0.0, "reviews":"...", "badge":"Best Value", "score":0, "reason":"...", "pros":["...","..."], "cons":["..."], "avoid_if":"...", "successor_of":null, "launch_date_india":"...", "newer_version":null },
    { "name":"...", "price":"—", "seller":"...", "rating":0.0, "platform_rating":0.0, "reviews":"...", "badge":"Budget Pick", "score":0, "reason":"...", "pros":["...","..."], "cons":["..."], "avoid_if":"...", "successor_of":null, "launch_date_india":"...", "newer_version":null }
  ]
}

IMPORTANT RULES:
• "price" field: Always set to "—" — real prices come from live shopping data, never hallucinate prices
• "launch_date_india": MUST be accurate India launch date (not global). Search your knowledge carefully. Format: "Month Year" e.g. "January 2025". If unsure, write "2024" or "2025" as approximate year only.
• "newer_version": Set to null if this IS the newest model. Populate only when a confirmed successor exists.

SELECTION CRITERIA (apply internally, never describe in output):
• Relevance: Exact match to query budget/category
• Recency: ${currentYear} > ${currentYear-1} > ${currentYear-2}. Replace outdated models with ${currentYear}/${currentYear-1} successors
• Reviews: Amazon.in + Flipkart combined. Deduct 30% for budget brands (boat/Noise/Zebronics)
• PR Score = platform rating minus fake inflation (subtract 0.1-0.5). PR Score always < platform_rating
• Value: Specs per rupee vs India average
• Service: Brands with India service centres${loc ? ' near ' + loc : ''}

• launch_date_india: The INDIA launch date (not global). India is typically 1-3 months after global launch. Use your web knowledge to verify accurately. Format: "Month Year" e.g. "January 2025". If genuinely uncertain, write year only e.g. "2025".
• newer_version: Search your knowledge for whether a newer model in this exact product series exists and is sold in India. Set to null if this IS the current/latest model. If a confirmed successor exists, populate name + what improved. price_approx always "—".
• CRITICAL — Always recommend the LATEST CURRENT models available for purchase in India as of ${monthYear}:
  - For "best iPhone" → recommend the newest iPhone currently sold in India (check 2025/2026 launches, not 2023/2024)
  - For "best Samsung Galaxy" → recommend the latest S-series / Fold / Flip available RIGHT NOW
  - NEVER recommend a model that has been superseded by a newer version in the same series and price tier
  - If a 2026 model is available → recommend it over 2025 models → over 2024 models
  - Examples of generations in ${monthYear}: iPhone series currently sells iPhone 15/16/17, check which is newest
  - When the user says "best" / "सबसे अच्छा" / "बेस्ट" they expect the NEWEST flagship, not an older one
  - If unsure about what's latest, search the web first before recommending`
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
  const model = 'sonar-pro'  // Latest Perplexity model: web search grounded, smarter reasoning
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
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMsg },
          ],
          max_tokens: 4000,
          temperature: 0.15,  // Lower for more factual, less creative
          response_format: { type: 'json_object' },
          // Perplexity-specific: web search controls for fresh results
          search_recency_filter: 'month',  // Prefer recent (last 30 days) sources
          search_domain_filter: [],        // No domain restriction
          return_citations: false,         // Don't need citations inline
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
      if (!content) return { answer: '', products: [] }
      // Strip markdown fences if present
      const jsonStr = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
      const start = jsonStr.indexOf('{'); const end = jsonStr.lastIndexOf('}')
      if (start < 0 || end < 0) {
        console.error(`[Perplexity] No JSON found: ${content.slice(0, 200)}`)
        return { answer: '', products: [] }
      }
      const parsed = JSON.parse(jsonStr.slice(start, end + 1))
      if ((parsed as Record<string,unknown>).out_of_scope === true) {
        return { answer: '__OUT_OF_SCOPE__', products: [] }
      }
      if ((parsed as Record<string,unknown>).out_of_scope === true) {
        console.log(`[OpenAI] AI says out_of_scope`)
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

  if (!isElectronics(question)) {
    return { answer:'', aiProducts:[], serpProducts:[], relatedSearches:[], isOutOfScope:true, algorithm_version:ALGORITHM_VERSION }
  }

  const cacheKey = `${question.toLowerCase().trim()}|${city}|${state}`
  const hit = cache.get(cacheKey)
  if (hit && Date.now()-hit.ts<CACHE_TTL) { console.log('[Search] cache hit'); return hit.result }

  const monthYear = getMonthYear()
  const currentYear = getYear()
  const lang = detectLang(question)
  const loc = getLocation(city, state)

  const keys: ProviderKeys = { openai:openaiKey, claude:claudeKey, perplexity:perplexityKey, sarvam:sarvamKey }
  const plan = routeQuery(question, keys)

  console.log(`[Search] type=${plan.type} primary=${plan.primary?.provider}:${plan.primary?.model} loc="${loc||'India'}"`)
  console.log(`[Search] keys: openai=${!!openaiKey} claude=${!!claudeKey} perplexity=${!!perplexityKey} sarvam=${!!sarvamKey}`)

  // SERP — live prices from Google Shopping
  let serpResult: SerpSearchResult = { products:[], relatedSearches:[], query:question }
  try { serpResult = await searchGoogleShopping(question); console.log(`[SERP] ${serpResult.products.length} results`) }
  catch(e) { console.error('[SERP]:', String(e)) }
  const serpContext = buildProductContext(serpResult)

  const systemPrompt = buildSystemPrompt(lang, loc, monthYear, currentYear)
  const userMsg = `Question: ${question}${loc?`\nLocation: ${loc}`:''}` +
    (serpContext ? `\n\n=== LIVE PRODUCTS CURRENTLY ON SALE IN INDIA (${monthYear}) ===\nThese are the actual products available on Amazon/Flipkart/Croma RIGHT NOW. Prefer models that appear here — they are confirmed available. If a model you recall is missing from this list, it may be discontinued.\n${serpContext}\n=== END LIVE DATA ===` : '')

  // Try primary provider
  let answer='', rawProducts: unknown[]=[], providerUsed=''

  if (!plan.primary) {
    console.error('[Search] No AI provider configured!')
    return { answer:'No AI provider configured. Please add API keys in settings.', aiProducts:[], serpProducts:serpResult.products, relatedSearches:serpResult.relatedSearches, algorithm_version:ALGORITHM_VERSION }
  }

  console.log(`[Search] Trying ${plan.primary.provider}:${plan.primary.model}`)
  const r = await callProvider(plan.primary.provider, plan.primary.model, systemPrompt, userMsg, keys)
  if (r.answer || r.products.length>0) {
    answer=r.answer; rawProducts=r.products
    providerUsed=`${plan.primary.provider}:${plan.primary.model}`
  }

  // Try fallbacks if primary failed
  for (const fb of plan.fallbacks) {
    if (answer && rawProducts.length>0) break
    console.log(`[Search] Fallback → ${fb.provider}:${fb.model}`)
    const r2 = await callProvider(fb.provider, fb.model, systemPrompt, userMsg, keys)
    if (r2.answer || r2.products.length>0) {
      answer=r2.answer; rawProducts=r2.products
      providerUsed=`${fb.provider}:${fb.model}`
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

  aiProducts = enrichPrices(aiProducts, serpResult.products)

  const result: SearchResult = {
    answer: answer||'Here are the top electronics options for India right now.',
    aiProducts: aiProducts.slice(0,3),
    serpProducts: serpResult.products,
    relatedSearches: serpResult.relatedSearches,
    provider_used: providerUsed,
    algorithm_version: ALGORITHM_VERSION,
  }
  cache.set(cacheKey, { result, ts:Date.now() })
  console.log(`[Search] Done — provider=${providerUsed} products=${aiProducts.length}`)
  return result
}
