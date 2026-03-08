// SearchAPI.io — Google Shopping India integration
// https://www.searchapi.io/docs/google-shopping

export type SerpProduct = {
  title: string
  price: string
  rating: number | null
  reviews: number | null
  source: string
  link: string
  thumbnail: string
  delivery: string
  badge: string | null
}

export type SerpSearchResult = {
  products: SerpProduct[]
  relatedSearches: string[]
  query: string
}

export async function searchGoogleShopping(query: string): Promise<SerpSearchResult> {
  const key = process.env.SERPAPI_KEY || ''
  if (!key) {
    console.warn('[SearchAPI] SERPAPI_KEY not set — returning empty results')
    return { products: [], relatedSearches: [], query }
  }

  const params = new URLSearchParams({
    engine: 'google_shopping',
    q: query,
    api_key: key,
    gl: 'in',        // India
    hl: 'en',
    num: '10',
  })

  try {
    const res = await fetch(`https://www.searchapi.io/api/v1/search?${params}`, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 3600 },
    })

    if (!res.ok) {
      const txt = await res.text()
      console.error('[SearchAPI] Error', res.status, txt.slice(0, 200))
      return { products: [], relatedSearches: [], query }
    }

    const data = await res.json()

    // SearchAPI.io returns shopping_results array
    const raw = data.shopping_results || data.organic_results || []
    const products: SerpProduct[] = raw
      .slice(0, 8)
      .map((item: Record<string, unknown>) => ({
        title: String(item.title || ''),
        price: String(item.price || item.extracted_price || ''),
        rating: typeof item.rating === 'number' ? item.rating : null,
        reviews: typeof item.reviews === 'number' ? item.reviews : null,
        source: String(item.source || item.seller || ''),
        link: String(item.link || item.product_link || ''),
        thumbnail: String(item.thumbnail || item.image || ''),
        delivery: String(item.delivery || ''),
        badge: item.badge ? String(item.badge) : null,
      }))

    const relatedSearches: string[] = (data.related_searches || [])
      .slice(0, 5)
      .map((r: Record<string, unknown>) => String(r.query || r.title || ''))
      .filter(Boolean)

    console.log(`[SearchAPI] Found ${products.length} products for "${query}"`)
    return { products, relatedSearches, query }

  } catch (err) {
    console.error('[SearchAPI] Fetch error:', err)
    return { products: [], relatedSearches: [], query }
  }
}

export function buildProductContext(result: SerpSearchResult): string {
  if (!result.products.length) return ''
  const lines = result.products.map(p => {
    const rating = p.rating ? `⭐ ${p.rating}` : ''
    return `• ${p.title} — ${p.price} on ${p.source} ${rating}`
  }).join('\n')
  return `Live Google Shopping India data for "${result.query}":\n${lines}`
}
