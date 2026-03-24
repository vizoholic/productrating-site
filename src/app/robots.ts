// src/app/robots.ts
import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',        // never index API endpoints
        ],
      },
      // Let Googlebot specifically crawl everything else
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/api/'],
      },
    ],
    sitemap: 'https://www.productrating.in/sitemap.xml',
    host: 'https://www.productrating.in',
  }
}
