import type { Metadata } from 'next'
import '../styles/globals.css'
import { Analytics } from '@vercel/analytics/next'

export const metadata: Metadata = {
  title: {
    default: 'ProductRating.in — AI-Powered Product Intelligence for India',
    template: '%s | ProductRating.in',
  },
  description: 'Find the best products in India with AI-adjusted ratings. We remove fake reviews from Amazon, Flipkart, Nykaa and 6+ platforms. Ask in Hindi, Tamil, Telugu or any Indian language.',
  keywords: ['product ratings India', 'AI product reviews', 'best products India', 'fake review detector', 'product comparison India'],
  authors: [{ name: 'ProductRating.in' }],
  creator: 'ProductRating.in',
  metadataBase: new URL('https://www.productrating.in'),
  alternates: { canonical: 'https://www.productrating.in' },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://www.productrating.in',
    siteName: 'ProductRating.in',
    title: 'ProductRating.in — AI Product Intelligence for India',
    description: 'AI-adjusted product ratings aggregated from Amazon, Flipkart, Nykaa & more. Fake reviews removed. Ask in any Indian language.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ProductRating.in — AI Product Intelligence for India',
    description: 'AI-adjusted product ratings. Fake reviews removed. Ask in Hindi, Tamil, Telugu & more.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  // ADD YOUR GOOGLE SEARCH CONSOLE VERIFICATION CODE BELOW:
  // verification: { google: 'YOUR_CODE_FROM_SEARCH_CONSOLE' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
