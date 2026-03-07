// lib/wix.ts
// Fetches data from your Wix CMS collections via REST API
// Collections: Products, Reviews, Categories, QnA

const WIX_API_BASE = 'https://www.wixapis.com/wix-data/v2';
const SITE_ID = 'a7e8b2ff-2cba-4df7-a6c2-f802f17ddab1';

// ─── Put your Wix API key here ───
// Get it from: Wix Dashboard → Settings → Advanced → API Keys
const WIX_API_KEY = process.env.WIX_API_KEY || '';

const headers = {
  'Content-Type': 'application/json',
  'Authorization': WIX_API_KEY,
  'wix-site-id': SITE_ID,
};

// ─── Types ───────────────────────────────────────────────

export interface Product {
  _id: string;
  name: string;
  slug: string;
  category: string;
  brand: string;
  description: string;
  image: string;
  aggregatedScore: number;
  totalReviews: number;
  flipkartScore: number;
  amazonScore: number;
  meeshoScore: number;
  nykaaScore: number;
  priceMin: number;
  priceMax: number;
  tags: string[];
  aiSummary: string;
  pros: string[];
  cons: string[];
  verdictBadge: string; // 'Buy Now' | 'Consider' | 'Wait' | 'Must Watch'
  featured: boolean;
  lastScraped: string;
}

export interface Review {
  _id: string;
  productId: string;
  reviewerName: string;
  reviewerCity: string;
  rating: number;
  title: string;
  body: string;
  source: string;
  sourceUrl: string;
  verifiedBuyer: boolean;
  helpful: number;
  usageDuration: string;
  sentimentScore: number;
  language: string;
  approved: boolean;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description: string;
  totalProducts: number;
  featured: boolean;
}

export interface QnA {
  _id: string;
  productId: string;
  question: string;
  askedBy: string;
  askedByCity: string;
  answer: string;
  answeredBy: string;
  aiGenerated: boolean;
  upvotes: number;
  approved: boolean;
}

// ─── Helper ──────────────────────────────────────────────

async function wixQuery(collectionId: string, query: object = {}) {
  const res = await fetch(`${WIX_API_BASE}/items/query`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ dataCollectionId: collectionId, query }),
    next: { revalidate: 60 }, // ISR: revalidate every 60 seconds
  });

  if (!res.ok) {
    console.error(`Wix query failed for ${collectionId}:`, await res.text());
    return { dataItems: [] };
  }

  return res.json();
}

function extractData(items: any[]) {
  return items.map((item: any) => ({ _id: item.id, ...item.data }));
}

// ─── Products ────────────────────────────────────────────

export async function getProducts(limit = 20): Promise<Product[]> {
  const data = await wixQuery('Products', {
    sort: [{ fieldName: 'aggregatedScore', order: 'DESC' }],
    paging: { limit },
  });
  return extractData(data.dataItems || []);
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const data = await wixQuery('Products', {
    filter: { featured: true },
    sort: [{ fieldName: 'aggregatedScore', order: 'DESC' }],
    paging: { limit: 8 },
  });
  return extractData(data.dataItems || []);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const data = await wixQuery('Products', {
    filter: { slug },
    paging: { limit: 1 },
  });
  const items = extractData(data.dataItems || []);
  return items[0] || null;
}

export async function getProductsByCategory(category: string, limit = 20): Promise<Product[]> {
  const data = await wixQuery('Products', {
    filter: { category },
    sort: [{ fieldName: 'aggregatedScore', order: 'DESC' }],
    paging: { limit },
  });
  return extractData(data.dataItems || []);
}

export async function searchProducts(query: string): Promise<Product[]> {
  const data = await wixQuery('Products', {
    filter: { name: { $contains: query } },
    paging: { limit: 10 },
  });
  return extractData(data.dataItems || []);
}

// ─── Categories ──────────────────────────────────────────

export async function getCategories(): Promise<Category[]> {
  const data = await wixQuery('Categories', {
    sort: [{ fieldName: 'name', order: 'ASC' }],
    paging: { limit: 50 },
  });
  return extractData(data.dataItems || []);
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const data = await wixQuery('Categories', {
    filter: { slug },
    paging: { limit: 1 },
  });
  const items = extractData(data.dataItems || []);
  return items[0] || null;
}

// ─── Reviews ─────────────────────────────────────────────

export async function getReviewsByProduct(productId: string, limit = 20): Promise<Review[]> {
  const data = await wixQuery('Reviews', {
    filter: { $and: [{ productId }, { approved: true }] },
    sort: [{ fieldName: '_createdDate', order: 'DESC' }],
    paging: { limit },
  });
  return extractData(data.dataItems || []);
}

// ─── Q&A ─────────────────────────────────────────────────

export async function getQnAByProduct(productId: string): Promise<QnA[]> {
  const data = await wixQuery('QnA', {
    filter: { $and: [{ productId }, { approved: true }] },
    sort: [{ fieldName: 'upvotes', order: 'DESC' }],
    paging: { limit: 10 },
  });
  return extractData(data.dataItems || []);
}
