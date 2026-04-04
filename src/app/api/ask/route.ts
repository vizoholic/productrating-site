// src/app/api/ask/route.ts
// Sarvam = voice STT | OpenAI = product intelligence | Google Shopping = prices

import { NextRequest, NextResponse } from 'next/server'
import { runSearch } from '@/lib/search'

export const runtime = 'nodejs'
export const maxDuration = 60  // Allow up to 60s for OpenAI calls (default 10s too short)

const ALLOWED_ORIGINS = [
  'https://www.productrating.in',
  'https://productrating.in',
  'http://localhost:3000',
  'http://localhost:3001',
]

function isOriginAllowed(req: NextRequest): boolean {
  const origin = req.headers.get('origin')
  if (!origin) return true
  return ALLOWED_ORIGINS.some(o => origin.startsWith(o))
}

function sanitise(str: string, maxLen = 500): string {
  return str.trim().slice(0, maxLen).replace(/[<>]/g, '')
}

export async function POST(req: NextRequest) {
  if (!isOriginAllowed(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const ct = req.headers.get('content-type') || ''

  // ── VOICE STT — Sarvam AI (best for Indian languages) ──
  if (ct.includes('multipart/form-data')) {
    const sarvamKey = process.env.SARVAM_API_KEY
    if (!sarvamKey) return NextResponse.json({ error: 'STT not configured', transcript: '' }, { status: 500 })

    let fd: FormData
    try { fd = await req.formData() } catch {
      return NextResponse.json({ error: 'Invalid form data', transcript: '' }, { status: 400 })
    }
    const f = (fd.get('file') ?? fd.get('audio')) as File | null
    if (!f) return NextResponse.json({ error: 'No audio', transcript: '' }, { status: 400 })
    if (f.size === 0) return NextResponse.json({ error: 'Empty audio', transcript: '' }, { status: 400 })
    if (f.size > 5 * 1024 * 1024) return NextResponse.json({ error: 'Audio too large', transcript: '' }, { status: 413 })

    const sf = new FormData()
    sf.append('file', f)
    sf.append('model', 'saarika:v2.5')
    sf.append('language_code', 'unknown')

    try {
      const sr = await fetch('https://api.sarvam.ai/speech-to-text', {
        method: 'POST',
        headers: { 'api-subscription-key': sarvamKey },
        body: sf,
      })
      const rt = await sr.text()
      if (!sr.ok) {
        console.error('[STT] Sarvam error:', rt.slice(0, 200))
        return NextResponse.json({ error: 'STT failed', transcript: '' }, { status: 500 })
      }
      let d: { transcript?: string; language_code?: string } = {}
      try { d = JSON.parse(rt) } catch { /* ignore */ }
      return NextResponse.json({
        transcript: d.transcript || '',
        detectedLanguage: d.language_code || '',
      })
    } catch {
      return NextResponse.json({ error: 'STT network error', transcript: '' }, { status: 500 })
    }
  }

  // ── PRODUCT SEARCH — OpenAI primary + Sarvam fallback + Google Shopping ──
  if (ct.includes('application/json')) {
    const sarvamKey = process.env.SARVAM_API_KEY || ''
    const openaiKey = process.env.OPENAI_API_KEY || ''

    if (!sarvamKey && !openaiKey) {
      return NextResponse.json({ error: 'No AI key configured' }, { status: 500 })
    }

    let body: { question?: string; city?: string; state?: string } = {}
    try { body = await req.json() } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const question = sanitise(body.question || '', 500)
    if (!question) return NextResponse.json({ error: 'No question provided' }, { status: 400 })

    const city  = sanitise(body.city  || '', 100)
    const state = sanitise(body.state || '', 100)

    console.log(`[Route] question="${question}" city="${city}" state="${state}"`)
    console.log(`[Route] openaiKey=${openaiKey ? 'SET' : 'MISSING'} sarvamKey=${sarvamKey ? 'SET' : 'MISSING'}`)

    try {
      const result = await runSearch(
        question, city, state,
        sarvamKey,
        openaiKey || undefined  // Pass OpenAI key — this is the primary AI engine
      )
      return NextResponse.json(result)
    } catch (e) {
      console.error('[Route] runSearch error:', String(e))
      return NextResponse.json({
        error: 'Search failed',
        answer: 'Something went wrong. Please try again.',
        aiProducts: [], serpProducts: [], relatedSearches: [],
        algorithm_version: 'error',
      }, { status: 500 })
    }
  }

  return NextResponse.json({ error: 'Unsupported content type' }, { status: 415 })
}
