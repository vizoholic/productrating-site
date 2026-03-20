// src/app/robots.ts
import { MetadataRoute } from 'next'
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/api/', '/search?q='] },
    ],
    sitemap: 'https://www.productrating.in/sitemap.xml',
    host: 'https://www.productrating.in',
  }
}
