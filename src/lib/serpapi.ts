// src/lib/serpapi.ts
// Google Shopping via SerpAPI — pulls FULL product metadata for rich UI
// Price, image (800×800 via thumbnail_large), reviews, rating, deal tag, delivery
// All from live marketplace data. SerpAPI docs: https://serpapi.com/shopping-results

export type SerpProduct = {
  title: string
  link: string                  // direct product URL on marketplace
  source: string                // "Amazon.in" | "Flipkart" | "Croma" | etc
  price: string                 // display "₹18,999"
  price_numeric: number         // 18999
  old_price?: string            // original price before discount
  old_price_numeric?: number
  rating?: number               // 1-5 marketplace rating
  reviews?: number              // real review count (integer)
  thumbnail?: string            // product image URL (jpg/png, low-res fallback)
  thumbnail_large?: string      // new as of Apr 2026: up to 800×800
  tag?: string                  // "17% OFF" | "DEAL" | "SALE"
  badge?: string                // "Best Seller" | "Amazon's Choice"
  delivery?: string             // "Free delivery" | "2 days"
  product_id?: string
  product_link?: string         // Google Shopping product page
}

export type SerpSearchResult = {
  products: SerpProduct[]
  relatedSearches: string[]
  query: string
}

const SERP_API_URL = 'https://serpapi.com/search'

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SEARCH
// ─────────────────────────────────────────────────────────────────────────────

export async function searchGoogleShopping(query: string): Promise<SerpSearchResult> {
  const apiKey = process.env.SERPAPI_API_KEY || ''
  if (!apiKey) {
    console.error('[SERP] SERPAPI_API_KEY missing — skipping live data')
    return { products: [], relatedSearches: [], query }
  }

  // Clean query for Google Shopping:
  // 1. Expand "20k" / "50k" shorthand to full numbers (Shopping doesn't interpret k)
  // 2. Strip meta-words that confuse Shopping ranking ("best", "top", "2026")
  const cleanQuery = query
    .replace(/(\d+)\s*k\b/gi, (_, n) => String(parseInt(n) * 1000))  // 20k → 20000
    .replace(/(\d+)\s*lakh\b/gi, (_, n) => String(parseInt(n) * 100000))  // 2 lakh → 200000
    .replace(/\b(best|top|latest|new|2024|2025|2026)\b/gi, ' ')  // remove meta words
    .replace(/\s+/g, ' ')
    .trim() || query  // fall back to original if cleanup leaves empty string
  console.log(`[SERP] query="${query}" cleaned="${cleanQuery}"`)

  const params = new URLSearchParams({
    engine: 'google_shopping',
    q: cleanQuery,
    location: 'India',
    google_domain: 'google.co.in',
    gl: 'in',
    hl: 'en',
    num: '40',
    api_key: apiKey,
  })

  try {
    const start = Date.now()
    const res = await fetch(`${SERP_API_URL}?${params}`, { method: 'GET' })
    const elapsed = Date.now() - start
    if (!res.ok) {
      console.error(`[SERP] HTTP ${res.status} for "${query}" (${elapsed}ms)`)
      return { products: [], relatedSearches: [], query }
    }
    const data = await res.json()
    const result = parseShoppingResults(data, query)
    console.log(`[SERP] "${query}" → ${result.products.length} products, ${elapsed}ms`)
    // Sample first 3 products to logs so we can verify SERP returns
    if (result.products.length > 0) {
      const sample = result.products.slice(0, 3).map(p =>
        `${p.source}:${p.price}${p.thumbnail_large || p.thumbnail ? '[img]' : '[noimg]'}${p.reviews ? ` ${p.reviews}rv` : ''}`
      ).join(' | ')
      console.log(`[SERP] sample: ${sample}`)
    }
    return result
  } catch (e) {
    console.error('[SERP] fetch error:', String(e))
    return { products: [], relatedSearches: [], query }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PARSER
// ─────────────────────────────────────────────────────────────────────────────

function parseShoppingResults(data: Record<string, unknown>, query: string): SerpSearchResult {
  const products: SerpProduct[] = []

  // Primary source: shopping_results
  const shoppingResults = (data.shopping_results as Record<string, unknown>[]) || []
  for (const r of shoppingResults) {
    const p = extractProduct(r)
    if (p) products.push(p)
  }

  // Secondary: inline_shopping_results
  const inline = (data.inline_shopping_results as Record<string, unknown>[]) || []
  for (const r of inline) {
    const p = extractProduct(r)
    if (p) products.push(p)
  }

  // Related searches
  const rs = (data.related_searches as Array<{ query?: string }>) || []
  const relatedSearches = rs.map(r => String(r.query || '')).filter(Boolean).slice(0, 8)

  return { products, relatedSearches, query }
}

/**
 * Extract direct seller URL from Google Shopping redirect links.
 * SerpAPI returns links like:
 *   https://www.google.com/url?url=https://amazon.in/dp/B0XXX&...
 *   https://www.google.com/aclk?...&adurl=https://flipkart.com/p/abc
 *   https://www.google.co.in/search?ibp=oshop&q=...&prds=catalogid:...  (pure Google — no direct link)
 * Returns the embedded seller URL if found, null otherwise.
 */
function extractDirectUrl(googleUrl: string): string | null {
  if (!googleUrl) return null
  try {
    const u = new URL(googleUrl)
    // Only process Google redirect URLs
    if (!/(^|\.)google\./.test(u.hostname)) {
      // Already a direct URL (e.g. amazon.in, flipkart.com)
      return googleUrl
    }
    // Try common query param names where direct URLs are embedded
    for (const param of ['url', 'adurl', 'q']) {
      const val = u.searchParams.get(param)
      if (val && /^https?:\/\//i.test(val)) {
        const host = new URL(val).hostname
        // Reject if the "direct" URL is also Google
        if (!/(^|\.)google\./.test(host)) {
          return val
        }
      }
    }
    return null  // Pure Google redirect, no embedded seller URL
  } catch {
    return null
  }
}

function extractProduct(r: Record<string, unknown>): SerpProduct | null {
  const title = String(r.title || '').trim()
  const rawLink = String(r.link || '').trim()
  const productLink = String(r.product_link || '').trim()
  // SerpAPI's Google Shopping API returns Google redirect URLs (google.com/aclk?... or google.com/url?url=...)
  // Extract the embedded direct seller URL from query params if present
  const link = extractDirectUrl(rawLink) || productLink || rawLink
  const source = String(r.source || r.seller || '').trim()
  const priceStr = String(r.price || '').trim()

  if (!title || !priceStr) return null

  // Parse numeric price — prefer extracted_price, fallback to regex
  const priceNum = Number(r.extracted_price) || parseInt(priceStr.replace(/[^\d]/g, '')) || 0
  if (priceNum === 0) return null

  // Old price (before discount)
  const oldPriceStr = r.old_price ? String(r.old_price).trim() : undefined
  const oldPriceNum = r.extracted_old_price ? Number(r.extracted_old_price) :
                      (oldPriceStr ? parseInt(oldPriceStr.replace(/[^\d]/g, '')) || undefined : undefined)

  // Rating (1-5)
  let rating: number | undefined
  if (r.rating !== undefined && r.rating !== null) {
    const rNum = Number(r.rating)
    if (!isNaN(rNum) && rNum >= 1 && rNum <= 5) rating = rNum
  }

  // Reviews — KEY field for accurate review counts
  let reviews: number | undefined
  if (r.reviews !== undefined && r.reviews !== null) {
    const rvNum = Number(r.reviews)
    if (!isNaN(rvNum) && rvNum >= 0) reviews = rvNum
  }

  // Thumbnail — prefer thumbnail_large (800×800, new Apr 2026), fallback to thumbnail
  let thumbnail: string | undefined
  let thumbnailLarge: string | undefined
  if (typeof r.thumbnail_large === 'string') thumbnailLarge = r.thumbnail_large as string
  if (typeof r.thumbnail === 'string') thumbnail = r.thumbnail
  else if (Array.isArray(r.thumbnails) && typeof (r.thumbnails as unknown[])[0] === 'string') {
    thumbnail = (r.thumbnails as string[])[0]
  }

  // Deal tag
  let tag: string | undefined
  if (typeof r.tag === 'string') tag = r.tag
  else if (Array.isArray(r.extensions)) {
    const exts = r.extensions as string[]
    const dealExt = exts.find(e => /deal|off|%|sale/i.test(String(e)))
    if (dealExt) tag = String(dealExt)
  }

  // Badge ("Best Seller", "Amazon's Choice")
  const badge = typeof r.badge === 'string' ? r.badge : undefined

  // Delivery
  let delivery: string | undefined
  if (typeof r.delivery === 'string') delivery = r.delivery
  else if (typeof r.shipping === 'string') delivery = r.shipping

  return {
    title, link, source,
    price: priceStr,
    price_numeric: priceNum,
    old_price: oldPriceStr,
    old_price_numeric: oldPriceNum,
    rating, reviews,
    thumbnail, thumbnail_large: thumbnailLarge,
    tag, badge, delivery,
    product_id: r.product_id ? String(r.product_id) : undefined,
    product_link: r.product_link ? String(r.product_link) : undefined,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// AI PROMPT CONTEXT
// ─────────────────────────────────────────────────────────────────────────────

export function buildProductContext(result: SerpSearchResult): string {
  if (result.products.length === 0) return ''
  const top = result.products.slice(0, 15)
  const lines = top.map((p, i) => {
    const rating = p.rating ? ` ${p.rating}★` : ''
    const reviews = p.reviews ? ` (${formatCount(p.reviews)} reviews)` : ''
    const tag = p.tag ? ` [${p.tag}]` : ''
    return `${i + 1}. ${p.title} — ${p.price}${rating}${reviews} on ${p.source}${tag}`
  })
  return lines.join('\n')
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`
  return String(n)
}
