export type SerpProduct = {
  title: string; price: string; rating: number | null; reviews: number | null
  source: string; link: string; thumbnail: string; delivery: string; badge: string | null
}
export type SerpSearchResult = { products: SerpProduct[]; relatedSearches: string[]; query: string }

export async function searchGoogleShopping(query: string): Promise<SerpSearchResult> {
  const key = process.env.SERPAPI_KEY || ''
  if (!key) return { products: [], relatedSearches: [], query }
  const params = new URLSearchParams({ engine:'google_shopping', q:query, api_key:key, gl:'in', hl:'en', num:'10' })
  try {
    const res = await fetch(`https://www.searchapi.io/api/v1/search?${params}`, { headers:{'Accept':'application/json'}, next:{revalidate:3600} })
    if (!res.ok) { console.error('[SearchAPI]', res.status); return { products:[], relatedSearches:[], query } }
    const data = await res.json()
    // Log all keys to see what SearchAPI actually returns
    const sample = data.shopping_results?.[0]
    if (sample) console.log('[SearchAPI] Available fields:', Object.keys(sample).join(', '))
    const raw = data.shopping_results || data.organic_results || []
    const products: SerpProduct[] = raw.slice(0, 8).map((item: Record<string, unknown>) => {
      // Try every possible field name for direct product URL
      const directLink = String(
        item.product_link ||    // SearchAPI.io standard
        item.store_link ||      // alternate name
        item.buy_link ||        // alternate name
        item.product_url ||     // alternate name
        item.merchant_link ||   // alternate name
        ''
      )
      // If no direct link found, fall back to item.link (Google redirect)
      const finalLink = directLink || String(item.link || '')
      return {
        title: String(item.title || ''),
        price: String(item.price || item.extracted_price || ''),
        rating: typeof item.rating === 'number' ? Math.min(item.rating, 5) : null,
        reviews: typeof item.reviews === 'number' ? item.reviews : null,
        source: String(item.source || item.seller || ''),
        link: finalLink,
        thumbnail: String(item.thumbnail || item.image || ''),
        delivery: String(item.delivery || item.shipping || ''),
        badge: item.badge ? String(item.badge) : null,
      }
    })
    const relatedSearches: string[] = (data.related_searches || []).slice(0,5)
      .map((r: Record<string,unknown>) => String(r.query || r.title || '')).filter(Boolean)
    console.log(`[SearchAPI] ${products.length} products. Sample link: ${products[0]?.link?.slice(0,80)}`)
    return { products, relatedSearches, query }
  } catch (err) { console.error('[SearchAPI]', err); return { products:[], relatedSearches:[], query } }
}

export function buildProductContext(result: SerpSearchResult): string {
  if (!result.products.length) return ''
  return `Live Google Shopping India data for "${result.query}":\n` +
    result.products.map(p => `• ${p.title} — ${p.price} on ${p.source}${p.rating ? ` ⭐${p.rating}/5` : ''}`).join('\n')
}
