// src/app/sitemap.ts — dynamic sitemap

import { MetadataRoute } from 'next'
import { queryToSlug } from '@/lib/seo'

// High-value seed queries — always indexed
const SEED_QUERIES = [
  // ACs
  'best AC under 30000', 'best AC under 40000', 'best AC under 50000',
  'best inverter AC India', 'best 5 star AC India', 'best AC for small room',
  // Phones
  'best phone under 15000', 'best phone under 20000', 'best phone under 30000',
  'best camera phone India', 'best battery phone India', 'best 5G phone under 20000',
  // Laptops
  'best laptop under 40000', 'best laptop under 60000', 'best laptop for students India',
  'best gaming laptop India', 'best lightweight laptop India',
  // Appliances
  'best washing machine India', 'best front load washing machine',
  'best refrigerator under 30000', 'best double door fridge India',
  'best geyser India', 'best mixer grinder India',
  // Electronics
  'best TV under 30000', 'best 43 inch TV India', 'best 55 inch TV India',
  'best TWS earbuds under 2000', 'best wireless earbuds India',
  'best smartwatch under 5000', 'best smartwatch India',
  // Personal care
  'best moisturiser for oily skin India', 'best sunscreen India',
  'best shampoo for hair fall India',
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = 'https://www.productrating.in'
  const now = new Date()

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${base}/search`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
  ]

  // Dynamic query pages
  const queryPages: MetadataRoute.Sitemap = SEED_QUERIES.map(q => ({
    url: `${base}/r/${queryToSlug(q)}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  return [...staticPages, ...queryPages]
}
