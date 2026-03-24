// src/middleware.ts

import { NextRequest, NextResponse } from 'next/server'

const WINDOW_MS = 60_000
const MAX_REQUESTS = 20
const BLOCK_MS = 300_000

const ipStore = new Map<string, { count: number; windowStart: number }>()
const blockedIPs = new Map<string, number>()

// Known good bots — never rate limit these
const GOOD_BOTS = [
  'googlebot', 'bingbot', 'slurp', 'duckduckbot',
  'baiduspider', 'yandexbot', 'facebookexternalhit',
  'twitterbot', 'linkedinbot', 'whatsapp',
]

function isGoodBot(req: NextRequest): boolean {
  const ua = (req.headers.get('user-agent') || '').toLowerCase()
  return GOOD_BOTS.some(bot => ua.includes(bot))
}

function getIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '0.0.0.0'
  )
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Only rate-limit the AI API endpoint on POST
  if (!pathname.startsWith('/api/ask') || req.method !== 'POST') {
    return NextResponse.next()
  }

  // Never block search engines or good bots
  if (isGoodBot(req)) return NextResponse.next()

  const ip = getIP(req)
  const now = Date.now()

  // Blocked?
  const unblockAt = blockedIPs.get(ip)
  if (unblockAt && now < unblockAt) {
    const wait = Math.ceil((unblockAt - now) / 1000)
    return new NextResponse(
      JSON.stringify({ error: `Too many requests. Try again in ${wait}s.`, retryAfter: wait }),
      { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': String(wait) } }
    )
  }

  const entry = ipStore.get(ip)
  if (!entry || now - entry.windowStart > WINDOW_MS) {
    ipStore.set(ip, { count: 1, windowStart: now })
    return NextResponse.next()
  }

  entry.count++
  if (entry.count > MAX_REQUESTS) {
    blockedIPs.set(ip, now + BLOCK_MS)
    ipStore.delete(ip)
    return new NextResponse(
      JSON.stringify({ error: 'Rate limit exceeded. Blocked for 5 minutes.' }),
      { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': '300' } }
    )
  }

  const res = NextResponse.next()
  res.headers.set('X-RateLimit-Remaining', String(MAX_REQUESTS - entry.count))
  return res
}

export const config = {
  matcher: ['/api/ask'],
}
