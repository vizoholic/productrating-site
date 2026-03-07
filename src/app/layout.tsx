import type { Metadata } from 'next'
import '../styles/globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://productrating.in'),
  title: {
    default: 'ProductRating.in — India\'s AI Product Intelligence Platform',
    template: '%s | ProductRating.in',
  },
  description: 'AI-powered product ratings and reviews aggregated from Flipkart, Amazon, Nykaa, Meesho & more. India\'s most trusted product intelligence platform. Ask anything, get honest answers.',
  keywords: ['product rating india', 'flipkart reviews', 'amazon india reviews', 'best products india', 'product comparison india', 'AI product review'],
  authors: [{ name: 'ProductRating.in' }],
  creator: 'ProductRating.in',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://productrating.in',
    siteName: 'ProductRating.in',
    title: 'ProductRating.in — India\'s AI Product Intelligence Platform',
    description: 'Ask anything about any product. Get AI-powered ratings from every Indian platform.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'ProductRating.in' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ProductRating.in — India\'s AI Product Intelligence',
    description: 'AI-powered product ratings for Indian consumers',
    images: ['/og-image.png'],
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large' } },
  alternates: { canonical: 'https://productrating.in' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#080A0F" />
      </head>
      <body>{children}</body>
    </html>
  )
}
