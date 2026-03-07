// lib/seo.ts
// Generates SEO metadata and JSON-LD structured data for Google Rich Results

import { Product, Category } from './wix';

export const SITE_NAME = 'ProductRating.in';
export const SITE_URL = 'https://productrating.in';
export const SITE_DESCRIPTION =
  "India's #1 AI-powered product intelligence platform. Get honest ratings and reviews aggregated from Flipkart, Amazon, Nykaa, Meesho & more — built for Indian buyers.";

// ─── Homepage metadata ────────────────────────────────────

export function getHomeMetadata() {
  return {
    title: `${SITE_NAME} — India's AI Product Intelligence Platform`,
    description: SITE_DESCRIPTION,
    keywords: [
      'product ratings India',
      'best products India',
      'Flipkart reviews',
      'Amazon India reviews',
      'AI product comparison India',
      'product buying guide India',
      'honest product reviews',
      'ProductRating',
    ].join(', '),
    openGraph: {
      title: `${SITE_NAME} — India's AI Product Intelligence Platform`,
      description: SITE_DESCRIPTION,
      url: SITE_URL,
      siteName: SITE_NAME,
      locale: 'en_IN',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${SITE_NAME} — India's AI Product Intelligence Platform`,
      description: SITE_DESCRIPTION,
    },
    alternates: { canonical: SITE_URL },
    robots: { index: true, follow: true },
  };
}

// ─── Product page metadata ────────────────────────────────

export function getProductMetadata(product: Product) {
  const title = `${product.name} Review & Rating — ${SITE_NAME}`;
  const description = `${product.name} gets a ${product.aggregatedScore}/5 ProductRating Score. Based on ${product.totalReviews?.toLocaleString('en-IN')} verified Indian reviews from Flipkart, Amazon & more. ${product.verdictBadge}.`;
  const url = `${SITE_URL}/products/${product.slug}`;

  return {
    title,
    description,
    keywords: `${product.name} review, ${product.brand} rating, ${product.category} India, best ${product.category} India`,
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      locale: 'en_IN',
      type: 'article',
    },
    twitter: { card: 'summary_large_image', title, description },
    alternates: { canonical: url },
    robots: { index: true, follow: true },
  };
}

// ─── Category page metadata ───────────────────────────────

export function getCategoryMetadata(category: Category) {
  const title = `Best ${category.name} in India — Ratings & Reviews | ${SITE_NAME}`;
  const description = `Compare the best ${category.name} in India. AI-powered ratings aggregated from Flipkart, Amazon, Nykaa & more. ${category.totalProducts}+ products rated.`;
  const url = `${SITE_URL}/categories/${category.slug}`;

  return {
    title,
    description,
    openGraph: { title, description, url, siteName: SITE_NAME, locale: 'en_IN', type: 'website' },
    twitter: { card: 'summary_large_image', title, description },
    alternates: { canonical: url },
    robots: { index: true, follow: true },
  };
}

// ─── JSON-LD Structured Data (Google Rich Results) ────────

// Product schema — shows star ratings directly in Google search results
export function getProductJsonLd(product: Product) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    brand: { '@type': 'Brand', name: product.brand },
    description: product.description?.replace(/<[^>]*>/g, '') || '',
    image: product.image,
    url: `${SITE_URL}/products/${product.slug}`,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: product.aggregatedScore,
      bestRating: '5',
      worstRating: '1',
      reviewCount: product.totalReviews || 1,
    },
    offers: product.priceMin
      ? {
          '@type': 'AggregateOffer',
          priceCurrency: 'INR',
          lowPrice: product.priceMin,
          highPrice: product.priceMax || product.priceMin,
          offerCount: 3,
          availability: 'https://schema.org/InStock',
        }
      : undefined,
  };
}

// Website + SearchAction schema — enables Google Sitelinks Search Box
export function getWebsiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    inLanguage: 'en-IN',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

// BreadcrumbList schema
export function getBreadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

// FAQPage schema for Q&A sections
export function getFaqJsonLd(qnas: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: qnas.map((q) => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: { '@type': 'Answer', text: q.answer },
    })),
  };
}
