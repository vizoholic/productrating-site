// app/sitemap.ts
import { MetadataRoute } from 'next';
import { getProducts, getCategories } from '@/lib/wix';
import { SITE_URL } from '@/lib/seo';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${SITE_URL}/search`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/categories`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
  ];

  // Category pages
  let categoryPages: MetadataRoute.Sitemap = [];
  try {
    const categories = await getCategories();
    categoryPages = categories.map((cat) => ({
      url: `${SITE_URL}/categories/${cat.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
  } catch {}

  // Product pages
  let productPages: MetadataRoute.Sitemap = [];
  try {
    const products = await getProducts(500);
    productPages = products.map((product) => ({
      url: `${SITE_URL}/products/${product.slug}`,
      lastModified: new Date(product.lastScraped || Date.now()),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    }));
  } catch {}

  return [...staticPages, ...categoryPages, ...productPages];
}
