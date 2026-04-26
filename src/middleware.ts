// src/middleware.ts
//
// Edge middleware — runs at Vercel's edge BEFORE any function invocation.
// Cost: edge-middleware is ~10x cheaper than serverless function invocation.
//
// Purpose: catch the long tail of bot fuzzing patterns that slip past
// the static-route allowlist. Returns 403/404 in <1ms without invoking
// any expensive logic.

import { NextResponse, type NextRequest } from 'next/server'

// ─── BOT USER-AGENT BLOCKLIST ─────────────────────────────────────────────
// These bots either don't send real traffic or fuzz aggressively.
// If we recognise the UA, drop the request immediately.
const BLOCKED_BOT_UAS = [
  // AI training scrapers
  'GPTBot',
  'ClaudeBot',
  'anthropic-ai',
  'Claude-Web',
  'cohere-ai',
  'PerplexityBot',
  'CCBot',
  'Google-Extended',
  'Bytespider',
  'Amazonbot',
  'FacebookBot',
  'ImagesiftBot',
  // Aggressive SEO scrapers (use real ones via paid APIs if you need them)
  'AhrefsBot',
  'SemrushBot',
  'MJ12bot',
  'DotBot',
  'BLEXBot',
  'PetalBot',
  // Generic suspicious patterns
  'python-requests',
  'curl/',
  'wget/',
  'libwww-perl',
  'Go-http-client',
  'okhttp',
  'Apache-HttpClient',
]

// ─── PATH PATTERNS THAT SUGGEST FUZZING ───────────────────────────────────
// Even if the user-agent looks legitimate, certain paths obviously aren't:
// "/r/best-ac-under-815540915000" → impossible budget, fuzzing pattern.
// We block any /r/ slug that ends in a number > 1,000,000 (10 lakh) since
// real product budget queries don't exceed this.
function looksLikeFuzzedSlug(pathname: string): boolean {
  if (!pathname.startsWith('/r/')) return false
  // Match patterns ending with a long numeric suffix: best-X-under-NNNNNNN
  const numMatch = pathname.match(/-(\d{7,})$/)  // 7+ digits = 1 million+
  return !!numMatch
}

export function middleware(req: NextRequest) {
  const ua = req.headers.get('user-agent') || ''
  const pathname = req.nextUrl.pathname

  // Fast-path: real users on common routes — skip all checks
  if (pathname === '/' || pathname.startsWith('/_next/') || pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Check 1: Known bot UA → 403 Forbidden
  // Cheap edge response, no function invocation, no cache pollution.
  for (const blocked of BLOCKED_BOT_UAS) {
    if (ua.includes(blocked)) {
      return new NextResponse(`Bot blocked: ${blocked}`, {
        status: 403,
        headers: {
          'Cache-Control': 'public, max-age=86400',  // cache the 403 for 24h
          'X-Block-Reason': 'bot-ua',
        },
      })
    }
  }

  // Check 2: Fuzzed /r/ slug pattern → 410 Gone
  // 410 (vs 404) tells crawlers "this URL is permanently dead, stop checking."
  // Google de-indexes 410s much faster than 404s.
  if (looksLikeFuzzedSlug(pathname)) {
    return new NextResponse('Gone — invalid product slug pattern.', {
      status: 410,
      headers: {
        'Cache-Control': 'public, max-age=2592000',  // cache for 30 days
        'X-Block-Reason': 'fuzzed-slug',
      },
    })
  }

  return NextResponse.next()
}

// ─── MIDDLEWARE MATCHER ───────────────────────────────────────────────────
// Run on /r/* routes only. Skip everything else for performance.
export const config = {
  matcher: ['/r/:path*'],
}
