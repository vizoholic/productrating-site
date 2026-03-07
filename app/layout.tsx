// app/layout.tsx
import type { Metadata } from 'next';
import { Syne, DM_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { getHomeMetadata, getWebsiteJsonLd, SITE_URL } from '@/lib/seo';

const syne = Syne({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-syne',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-dm',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  ...getHomeMetadata(),
  metadataBase: new URL(SITE_URL),
  verification: {
    google: 'ADD_YOUR_GOOGLE_SEARCH_CONSOLE_VERIFICATION_CODE_HERE',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const websiteJsonLd = getWebsiteJsonLd();

  return (
    <html lang="en-IN" className={`${syne.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <link rel="icon" href="/favicon.ico" />
        <meta name="geo.region" content="IN" />
        <meta name="geo.country" content="India" />
        <meta name="language" content="English" />
      </head>
      <body className="bg-bg text-white font-dm antialiased">
        <Nav />
        {children}
        <Footer />
      </body>
    </html>
  );
}

// ─── Nav ─────────────────────────────────────────────────

function Nav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-12 py-4 bg-bg/85 backdrop-blur-xl border-b border-white/5">
      <a href="/" className="font-syne font-black text-xl tracking-tight">
        Product<span className="text-saffron">Rating</span>.in
      </a>
      <ul className="hidden md:flex items-center gap-9 list-none">
        <li><a href="/categories" className="text-sm text-white/50 hover:text-white transition-colors">Categories</a></li>
        <li><a href="/search" className="text-sm text-white/50 hover:text-white transition-colors">Search</a></li>
        <li>
          <a href="/search" className="text-sm font-semibold bg-saffron text-black px-5 py-2 rounded-md hover:bg-saffron-glow transition-colors">
            Ask AI →
          </a>
        </li>
      </ul>
    </nav>
  );
}

// ─── Footer ───────────────────────────────────────────────

function Footer() {
  const categories = [
    { name: 'Smartphones & Electronics', slug: 'smartphones-electronics' },
    { name: 'Home Appliances', slug: 'home-appliances' },
    { name: 'Personal Care & Beauty', slug: 'personal-care-beauty' },
    { name: 'Kitchen & Cookware', slug: 'kitchen-cookware' },
    { name: 'Movies', slug: 'movies' },
  ];

  return (
    <footer className="border-t border-white/5 px-12 py-16 bg-bg2">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        <div>
          <a href="/" className="font-syne font-black text-xl">
            Product<span className="text-saffron">Rating</span>.in
          </a>
          <p className="mt-4 text-sm text-white/40 leading-relaxed">
            India's AI-powered product intelligence platform. Honest ratings for every Indian buyer.
          </p>
          <p className="mt-4 text-xs text-white/25 font-mono">🇮🇳 Made for Bharat</p>
        </div>
        <div>
          <h4 className="font-syne font-bold text-sm mb-4">Categories</h4>
          <ul className="space-y-2">
            {categories.map((c) => (
              <li key={c.slug}>
                <a href={`/categories/${c.slug}`} className="text-sm text-white/40 hover:text-white transition-colors">
                  {c.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-syne font-bold text-sm mb-4">Platform</h4>
          <ul className="space-y-2">
            {['About Us', 'How It Works', 'API for Brands', 'Submit a Review'].map((item) => (
              <li key={item}>
                <a href="#" className="text-sm text-white/40 hover:text-white transition-colors">{item}</a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-syne font-bold text-sm mb-4">Legal</h4>
          <ul className="space-y-2">
            {['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Contact'].map((item) => (
              <li key={item}>
                <a href="#" className="text-sm text-white/40 hover:text-white transition-colors">{item}</a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="max-w-6xl mx-auto mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-xs text-white/25 font-mono">© 2025 ProductRating.in · All rights reserved</p>
        <p className="text-xs text-white/25">
          Ratings aggregated from Flipkart, Amazon, Nykaa, Meesho & more
        </p>
      </div>
    </footer>
  );
}
