// src/lib/seo.ts — SEO utilities for ProductRating.in

// Stop words to remove from slugs (keep SEO-meaningful words)
const STOP_WORDS = new Set([
  'a','an','the','is','are','was','were','be','been','being',
  'have','has','had','do','does','did','will','would','could',
  'should','may','might','shall','can','and','or','but','nor',
  'so','yet','both','either','neither','just','very','too',
  'than','such','each','few','more','most','other','some',
  'me','my','we','our','you','your','he','his','she','her','they','their',
  'what','which','who','whom','this','that','these','those',
  'am','it','its','itself','how','all','any','both','own',
  'same','so','as','if','then','because','while','although',
])

const RUPEE_RE = /₹\s*(\d[\d,]*)/g
const NUM_RE = /\d[\d,]*/g

export function queryToSlug(query: string): string {
  let q = query.toLowerCase().trim()
  // Normalise ₹40,000 → 40000
  q = q.replace(RUPEE_RE, '$1').replace(/,/g, '')
  // Remove special chars except spaces and hyphens
  q = q.replace(/[^a-z0-9\s-]/g, ' ')
  const words = q.split(/\s+/).filter(w => w.length > 1 && !STOP_WORDS.has(w))
  const slug = words.join('-').replace(/-{2,}/g, '-').replace(/^-|-$/g, '').slice(0, 80)
  return slug || 'search'
}

export function slugToQuery(slug: string): string {
  return slug.replace(/-/g, ' ').trim()
}

// Generate SEO-optimised title, description, H1 from query + results
export type SeoMeta = {
  title: string
  description: string
  h1: string
  canonical: string
  shouldIndex: boolean
}

export function generateMeta(
  query: string,
  slug: string,
  productCount: number,
  hasCategory: boolean
): SeoMeta {
  const q = query.trim()
  const qCapital = q.charAt(0).toUpperCase() + q.slice(1)

  // Detect commercial intent keywords
  const commercialIntent = /best|top|cheap|budget|under|below|good|review|vs|compare|buy|price|rating/i.test(q)

  // Decide indexing
  const shouldIndex = productCount >= 3 && hasCategory && commercialIntent

  // Extract price if present
  const priceMatch = q.match(/(?:₹\s*)?(\d[\d,]+)/)
  const price = priceMatch ? `₹${parseInt(priceMatch[1].replace(/,/g,''), 10).toLocaleString('en-IN')}` : ''

  const title = price
    ? `${qCapital} (AI Rated, Fake Reviews Removed) | ProductRating.in`
    : `${qCapital} — AI-Adjusted Ratings | ProductRating.in`

  const description = `Find the ${q} with AI-adjusted ratings aggregated from Amazon, Flipkart, Nykaa & more. Fake reviews removed. Real scores, honest recommendations for Indian buyers.`

  return {
    title: title.slice(0, 120),
    description: description.slice(0, 160),
    h1: title.replace(' | ProductRating.in', ''),
    canonical: `https://www.productrating.in/r/${slug}`,
    shouldIndex,
  }
}

// Detect broad product category from query
export function detectCategory(query: string): string | null {
  const q = query.toLowerCase()
  const cats: [RegExp, string][] = [
    [/\bac\b|air condition|aircondition/, 'Air Conditioners'],
    [/\bphone\b|mobile|smartphone/, 'Smartphones'],
    [/\blaptop\b|notebook/, 'Laptops'],
    [/\bfridge\b|refrigerator/, 'Refrigerators'],
    [/\bwashing machine\b|washer/, 'Washing Machines'],
    [/\btv\b|television/, 'Televisions'],
    [/\bheadphone\b|earphone|earbuds|tws/, 'Headphones'],
    [/\bspeaker\b/, 'Speakers'],
    [/\bcamera\b/, 'Cameras'],
    [/\bwatch\b|smartwatch/, 'Smartwatches'],
    [/\bgeysers?\b|water heater/, 'Geysers'],
    [/\bmixer\b|grinder\b|blender/, 'Kitchen Appliances'],
    [/\bfan\b/, 'Fans'],
    [/\bpurifier\b|air purifier/, 'Air Purifiers'],
    [/\bcream\b|moisturis|serum|lotion|sunscreen/, 'Skincare'],
    [/\bshampoo\b|conditioner\b/, 'Haircare'],
    [/\bshoe\b|sneaker|footwear/, 'Footwear'],
    [/\bbag\b|backpack/, 'Bags'],
  ]
  for (const [re, cat] of cats) {
    if (re.test(q)) return cat
  }
  return null
}

// Generate AI content block heading + intro
export function generateContentBlock(query: string, category: string | null): string {
  const q = query.trim()
  const qCapital = q.charAt(0).toUpperCase() + q.slice(1)
  return `What is the ${q}?`
}

// Generate related searches from query
export function generateRelatedSearches(query: string, category: string | null): string[] {
  const q = query.toLowerCase()
  const related: string[] = []

  // Price variants
  const priceMatch = q.match(/(\d[\d,]+)/)
  if (priceMatch) {
    const price = parseInt(priceMatch[1].replace(/,/g, ''), 10)
    const higher = Math.round(price * 1.25 / 5000) * 5000
    const lower = Math.round(price * 0.75 / 5000) * 5000
    if (higher > price) related.push(query.replace(priceMatch[0], `${higher}`))
    if (lower > 0) related.push(query.replace(priceMatch[0], `${lower}`))
  }

  // Category-specific variants
  if (/\bac\b|air condition/i.test(q)) {
    related.push('best AC for small room', 'best 5 star AC India', 'best inverter AC under 35000')
  } else if (/phone|mobile/i.test(q)) {
    related.push('best camera phone India', 'best battery phone India', 'best 5G phone under 20000')
  } else if (/laptop/i.test(q)) {
    related.push('best laptop for students India', 'best gaming laptop under 60000', 'best lightweight laptop India')
  } else if (/fridge|refrigerator/i.test(q)) {
    related.push('best double door fridge India', 'best fridge for family of 4', 'best energy efficient refrigerator')
  } else if (category) {
    related.push(`best ${category.toLowerCase()} under 10000`, `top rated ${category.toLowerCase()} India`)
  }

  return [...new Set(related)].slice(0, 5)
}
