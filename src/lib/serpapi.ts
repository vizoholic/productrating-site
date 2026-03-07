// SerpApi — Google Shopping India integration
// Fetches live product data: ratings, prices, sellers, reviews

export type SerpProduct = {
  title: string
  price: string
  rating: number | null
  reviews: number | null
  source: string        // seller name e.g. "Flipkart", "Amazon"
  link: string
  thumbnail: string
  delivery: string
  badge: string | null  // e.g. "Best Seller", "Top Pick"
}

export type SerpSearchResult = {
  products: SerpProduct[]
  relatedSearches: string[]
  query: string
}

export async function searchGoogleShopping(query: string): Promise<SerpSearchResult> {
  const key = process.env.SERPAPI_KEY || ''
  if (!key) {
    console.warn('[SerpApi] SERPAPI_KEY not set — returning empty results')
    return { products: [], relatedSearches: [], query }
  }

  const params = new URLSearchParams({
    engine: 'google_shopping',
    q: query,
    api_key: key,
    gl: 'in',          // India
    hl: 'en',          // English interface
    num: '10',         // top 10 results
    location: 'India',
  })

  try {
    const res = await fetch(`https://serpapi.com/search?${params}`, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 3600 }, // cache for 1 hour
    })

    if (!res.ok) {
      const txt = await res.text()
      console.error('[SerpApi] Error', res.status, txt)
      return { products: [], relatedSearches: [], query }
    }

    const data = await res.json()

    // Map shopping_results to our clean type
    const products: SerpProduct[] = (data.shopping_results || [])
      .slice(0, 8)
      .map((item: Record<string, unknown>) => ({
        title: String(item.title || ''),
        price: String(item.price || ''),
        rating: typeof item.rating === 'number' ? item.rating : null,
        reviews: typeof item.reviews === 'number' ? item.reviews : null,
        source: String(item.source || ''),
        link: String(item.link || item.product_link || ''),
        thumbnail: String(item.thumbnail || ''),
        delivery: String(item.delivery || ''),
        badge: item.badge ? String(item.badge) : null,
      }))

    // Related searches for suggestions
    const relatedSearches: string[] = (data.related_searches || [])
      .slice(0, 5)
      .map((r: Record<string, unknown>) => String(r.query || ''))
      .filter(Boolean)

    console.log(`[SerpApi] Found ${products.length} products for "${query}"`)
    return { products, relatedSearches, query }
  } catch (err) {
    console.error('[SerpApi] Fetch error:', err)
    return { products: [], relatedSearches: [], query }
  }
}

// Build a concise product context string for Sarvam AI prompt
export function buildProductContext(result: SerpSearchResult): string {
  if (!result.products.length) return ''

  const lines = result.products.map(p => {
    const rating = p.rating ? `⭐ ${p.rating}` : 'No rating'
    const reviews = p.reviews ? `(${p.reviews.toLocaleString('en-IN')} reviews)` : ''
    const badge = p.badge ? ` [${p.badge}]` : ''
    return `• ${p.title}${badge} — ${p.price} on ${p.source} | ${rating} ${reviews} | ${p.delivery}`
  }).join('\n')

  return `Live Google Shopping India data for "${result.query}":\n${lines}`
}
