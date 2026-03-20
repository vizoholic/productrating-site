// src/app/api/ask/route.ts — thin wrapper around shared search logic
import { NextRequest, NextResponse } from 'next/server'
import { runSearch } from '@/lib/search'
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const ct = req.headers.get('content-type') || ''

  // ── Voice STT ──
  if (ct.includes('multipart/form-data')) {
    const apiKey = process.env.SARVAM_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'SARVAM_API_KEY not set', transcript: '' }, { status: 500 })
    let fd: FormData
    try { fd = await req.formData() } catch (e) { return NextResponse.json({ error: `Form error: ${e}`, transcript: '' }, { status: 400 }) }
    const f = (fd.get('file') ?? fd.get('audio')) as File | null
    if (!f) return NextResponse.json({ error: 'No audio', transcript: '' }, { status: 400 })
    if (f.size === 0) return NextResponse.json({ error: 'Empty audio — record for longer', transcript: '' }, { status: 400 })
    const sf = new FormData()
    sf.append('file', f); sf.append('model', 'saarika:v2.5'); sf.append('language_code', 'unknown')
    try {
      const sr = await fetch('https://api.sarvam.ai/speech-to-text', { method: 'POST', headers: { 'api-subscription-key': apiKey }, body: sf })
      const rt = await sr.text()
      if (!sr.ok) return NextResponse.json({ error: `STT ${sr.status}`, transcript: '' }, { status: 500 })
      let d: { transcript?: string; language_code?: string } = {}
      try { d = JSON.parse(rt) } catch {}
      return NextResponse.json({ transcript: d.transcript || '', detectedLanguage: d.language_code || '' })
    } catch (e) { return NextResponse.json({ error: `Network: ${e}`, transcript: '' }, { status: 500 }) }
  }

  // ── Chat / Search ──
  let body: { question?: string; city?: string; state?: string } = {}
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const question = body.question?.trim()
  if (!question) return NextResponse.json({ error: 'No question' }, { status: 400 })
  const apiKey = process.env.SARVAM_API_KEY
  if (!apiKey) return NextResponse.json({ answer: '⚠️ SARVAM_API_KEY not set.', products: [], serpProducts: [], aiProducts: [] })

  try {
    const result = await runSearch(question, body.city || '', body.state || '', apiKey)
    return NextResponse.json({ ...result, products: [] })
  } catch (err) {
    return NextResponse.json({ answer: `⚠️ Error: ${String(err)}`, products: [], serpProducts: [], aiProducts: [] })
  }
}
