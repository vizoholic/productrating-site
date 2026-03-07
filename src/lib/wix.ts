const WIX_SITE_ID = process.env.WIX_SITE_ID || 'a7e8b2ff-2cba-4df7-a6c2-f802f17ddab1'
const WIX_API_KEY = process.env.WIX_API_KEY || ''
const WIX_BASE = 'https://www.wixapis.com/wix-data/v2'

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': WIX_API_KEY,
  'wix-site-id': WIX_SITE_ID,
})

export type Product = {
  _id: string; name: string; slug: string; category: string; brand: string
  description: string; image: string; aggregatedScore: number; totalReviews: number
  flipkartScore: number; amazonScore: number; meeshoScore: number; nykaaScore: number
  priceMin: number; priceMax: number; tags: string[]; aiSummary: string
  pros: string[]; cons: string[]; verdictBadge: string; featured: boolean
}

export type Review = {
  _id: string; productId: string; reviewerName: string; reviewerCity: string
  rating: number; title: string; body: string; source: string
  verifiedBuyer: boolean; usageDuration: string; language: string
}

export type Category = {
  _id: string; name: string; slug: string; description: string
  totalProducts: number; featured: boolean
}

async function queryCollection(collectionId: string, query: object = {}, revalidate = 3600) {
  try {
    const res = await fetch(`${WIX_BASE}/items/query`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ dataCollectionId: collectionId, query }),
      next: { revalidate },
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.dataItems?.map((item: any) => ({ _id: item.id, ...item.data })) ?? []
  } catch { return [] }
}

export const getFeaturedProducts = (): Promise<Product[]> =>
  queryCollection('Products', { filter: { featured: true }, sort: [{ fieldName: 'aggregatedScore', order: 'DESC' }], paging: { limit: 8 } })

export const getProductsByCategory = (category: string): Promise<Product[]> =>
  queryCollection('Products', { filter: { category }, sort: [{ fieldName: 'aggregatedScore', order: 'DESC' }], paging: { limit: 20 } })

export const getProductBySlug = async (slug: string): Promise<Product | null> => {
  const r = await queryCollection('Products', { filter: { slug }, paging: { limit: 1 } })
  return r[0] ?? null
}

export const searchProducts = (q: string): Promise<Product[]> =>
  queryCollection('Products', { filter: { name: { $contains: q } }, paging: { limit: 20 } })

export const getAllProductSlugs = async (): Promise<string[]> => {
  const p = await queryCollection('Products', { paging: { limit: 1000 } }, 86400)
  return p.map((x: Product) => x.slug).filter(Boolean)
}

export const getReviewsByProductId = (productId: string): Promise<Review[]> =>
  queryCollection('Reviews', { filter: { productId, approved: true }, sort: [{ fieldName: '_createdDate', order: 'DESC' }], paging: { limit: 20 } })

export const getCategories = (): Promise<Category[]> =>
  queryCollection('Categories', { filter: { featured: true } }, 86400)
