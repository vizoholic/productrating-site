// src/lib/serpapi.ts
// Google Shopping via SerpAPI — extracts full product metadata for enriched UI
// Review counts, images, ratings, deals, delivery — all from live marketplace data

export type SerpProduct = {
  title: string
  link: string            // direct product URL on marketplace
  source: string          // "Amazon.in" | "Flipkart" | "Croma" | etc
  price: string           // display "₹18,999"
  price_numeric: number   // 18999
  rating?: number         // 1-5 marketplace rating
  reviews?: number        // real review count (integer)
  thumbnail?: string      // product image URL (jpg/png)
  tag?: string            // "SALE · 17% OFF" | "DEAL" | "FREE SHIPPING"
  delivery?: string       // "Free delivery" | "Delivered in 2 days"
  product_id?: string
}

export type SerpSearchResult = {
  products: SerpProduct[]
  relatedSearches: string[]
  query: string
  filters?: Array<{ type: string; options: string[] }>
}

const SERP_API_URL = 'https://serpapi.com/search'

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SEARCH
// ─────────────────────────────────────────────────────────────────────────────

export async function searchGoogleShopping(query: string): Promise<SerpSearchResult> {
  const apiKey = process.env.SERPAPI_API_KEY || ''
  if (!apiKey) {
    console.error('[SERP] SERPAPI_API_KEY missing')
    return { products: [], relatedSearches: [], query }
  }

  const params = new URLSearchParams({
    engine: 'google_shopping',
    q: query,
    location: 'India',
    google_domain: 'google.co.in',
    gl: 'in',
    hl: 'en',
    num: '40',  // fetch more results so we have enough matches per AI product
    api_key: apiKey,
  })

  try {
    const res = await fetch(`${SERP_API_URL}?${params}`, { method: 'GET' })
    if (!res.ok) {
      console.error(`[SERP] HTTP ${res.status}`)
      return { products: [], relatedSearches: [], query }
    }
    const data = await res.json()
    return parseShoppingResults(data, query)
  } catch (e) {
    console.error('[SERP] fetch error:', String(e))
    return { products: [], relatedSearches: [], query }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PARSER — extract all useful fields
// ─────────────────────────────────────────────────────────────────────────────

function parseShoppingResults(data: Record<string, unknown>, query: string): SerpSearchResult {
  const products: SerpProduct[] = []

  // Primary source: shopping_results
  const shoppingResults = (data.shopping_results as Record<string, unknown>[]) || []
  for (const r of shoppingResults) {
    const p = extractProduct(r)
    if (p) products.push(p)
  }

  // Secondary: inline_shopping_results (sometimes appears)
  const inline = (data.inline_shopping_results as Record<string, unknown>[]) || []
  for (const r of inline) {
    const p = extractProduct(r)
    if (p) products.push(p)
  }

  // Related searches
  const rs = (data.related_searches as Array<{ query?: string }>) || []
  const relatedSearches = rs.map(r => String(r.query || '')).filter(Boolean).slice(0, 8)

  console.log(`[SERP] Parsed ${products.length} products, ${relatedSearches.length} related`)
  return { products, relatedSearches, query }
}

function extractProduct(r: Record<string, unknown>): SerpProduct | null {
  const title = String(r.title || '').trim()
  const link = String(r.link || r.product_link || '').trim()
  const source = String(r.source || r.seller || '').trim()
  const priceStr = String(r.price || '').trim()

  if (!title || !priceStr) return null

  // Parse numeric price
  const priceNum = Number(r.extracted_price) || parseInt(priceStr.replace(/[^\d]/g, '')) || 0
  if (priceNum === 0) return null

  // Rating (1-5)
  let rating: number | undefined
  if (r.rating !== undefined && r.rating !== null) {
    const rNum = Number(r.rating)
    if (!isNaN(rNum) && rNum >= 1 && rNum <= 5) rating = rNum
  }

  // Reviews — this is the KEY field for accurate review counts
  let reviews: number | undefined
  if (r.reviews !== undefined && r.reviews !== null) {
    const rvNum = Number(r.reviews)
    if (!isNaN(rvNum) && rvNum >= 0) reviews = rvNum
  }

  // Thumbnail image
  let thumbnail: string | undefined
  if (typeof r.thumbnail === 'string') thumbnail = r.thumbnail
  else if (Array.isArray(r.thumbnails) && typeof r.thumbnails[0] === 'string') thumbnail = r.thumbnails[0] as string

  // Deal tag / discount
  let tag: string | undefined
  if (typeof r.tag === 'string') tag = r.tag
  else if (typeof r.extensions === 'object' && Array.isArray((r.extensions as unknown[]))) {
    const exts = r.extensions as string[]
    const dealExt = exts.find(e => /deal|off|%|sale/i.test(String(e)))
    if (dealExt) tag = String(dealExt)
  }

  // Delivery info
  let delivery: string | undefined
  if (typeof r.delivery === 'string') delivery = r.delivery
  else if (typeof r.shipping === 'string') delivery = r.shipping

  const productId = r.product_id ? String(r.product_id) : undefined

  return {
    title, link, source,
    price: priceStr,
    price_numeric: priceNum,
    rating, reviews, thumbnail, tag, delivery,
    product_id: productId,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PROMPT CONTEXT BUILDER — for AI to see live pricing
// ─────────────────────────────────────────────────────────────────────────────

export function buildProductContext(result: SerpSearchResult): string {
  if (result.products.length === 0) return ''
  const top = result.products.slice(0, 15)  // top 15 for context
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
