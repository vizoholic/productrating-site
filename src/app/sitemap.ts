import { MetadataRoute } from 'next'
import { getAllProductSlugs, getCategories } from '@/lib/wix'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = 'https://productrating.in'
  const slugs = await getAllProductSlugs()
  const categories = await getCategories()

  const productUrls = slugs.map(slug => ({
    url: `${base}/products/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }))

  const categoryUrls = categories.map(cat => ({
    url: `${base}/categories/${cat.slug}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }))

  return [
    { url: base, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${base}/search`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
    ...categoryUrls,
    ...productUrls,
  ]
}
