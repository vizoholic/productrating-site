import { NextRequest, NextResponse } from 'next/server'
import { searchGoogleShopping, buildProductContext } from '@/lib/serpapi'

export const runtime = 'nodejs'

// Max body size hint for Next.js
export const maxDuration = 30

export async function POST(req: NextRequest) {
  const ct = req.headers.get('content-type') || ''

  // ── Voice STT ──
  if (ct.includes('multipart/form-data')) {
    const apiKey = process.env.SARVAM_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'SARVAM_API_KEY not set', transcript: '' }, { status: 500 })

    let formData: FormData
    try {
      formData = await req.formData()
    } catch (e) {
      console.error('[STT] formData parse error:', e)
      return NextResponse.json({ error: `Form parse failed: ${String(e)}`, transcript: '' }, { status: 400 })
    }

    const audioFile = (formData.get('file') ?? formData.get('audio')) as File | null
    if (!audioFile) {
      console.error('[STT] No audio in form. Keys:', [...formData.keys()])
      return NextResponse.json({ error: 'No audio file in request', transcript: '' }, { status: 400 })
    }

    if (audioFile.size === 0) {
      console.error('[STT] Audio file is 0 bytes')
      return NextResponse.json({ error: 'Audio file is empty — try recording for longer', transcript: '' }, { status: 400 })
    }

    console.log(`[STT] Audio: ${audioFile.size}B, type=${audioFile.type}, name=${audioFile.name}`)

    // Use saarika:v2.5 — simpler, no mode param needed, auto-detects language
    const sarvamForm = new FormData()
    sarvamForm.append('file', audioFile)
    sarvamForm.append('model', 'saarika:v2.5')
    sarvamForm.append('language_code', 'unknown')  // auto-detect

    let sttRes: Response
    try {
      sttRes = await fetch('https://api.sarvam.ai/speech-to-text', {
        method: 'POST',
        headers: { 'api-subscription-key': apiKey },
        body: sarvamForm,
      })
    } catch (e) {
      console.error('[STT] Network error:', e)
      return NextResponse.json({ error: `Network error calling Sarvam: ${String(e)}`, transcript: '' }, { status: 500 })
    }

    const rawText = await sttRes.text()
    console.log(`[STT] Sarvam: status=${sttRes.status}, body=${rawText.slice(0, 300)}`)

    if (!sttRes.ok) {
      return NextResponse.json({
        error: `Sarvam STT error ${sttRes.status}: ${rawText.slice(0, 200)}`,
        transcript: ''
      }, { status: 500 })
    }

    let sttData: { transcript?: string; language_code?: string } = {}
    try { sttData = JSON.parse(rawText) } catch {}

    const transcript = sttData.transcript || ''
    if (!transcript) {
      console.warn('[STT] Got 200 but empty transcript. Raw:', rawText.slice(0, 200))
    }
    console.log(`[STT] Transcript: "${transcript}"`)
    return NextResponse.json({ transcript, detectedLanguage: sttData.language_code || '' })
  }

  // ── Chat / Search ──
  let body: { question?: string } = {}
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const question = body.question?.trim()
  if (!question) return NextResponse.json({ error: 'No question provided' }, { status: 400 })

  const apiKey = process.env.SARVAM_API_KEY
  if (!apiKey) {
    return NextResponse.json({ answer: '⚠️ SARVAM_API_KEY not set in Vercel.', products: [], serpProducts: [], aiProducts: [] })
  }

  // Language detection via Unicode ranges
  const langMap: [RegExp, string][] = [
    [/[\u0900-\u097F]/, 'Respond ENTIRELY in Hindi (Devanagari). Product names/prices can be in English.'],
    [/[\u0B80-\u0BFF]/, 'Respond ENTIRELY in Tamil.'],
    [/[\u0C00-\u0C7F]/, 'Respond ENTIRELY in Telugu.'],
    [/[\u0980-\u09FF]/, 'Respond ENTIRELY in Bengali.'],
    [/[\u0C80-\u0CFF]/, 'Respond ENTIRELY in Kannada.'],
    [/[\u0D00-\u0D7F]/, 'Respond ENTIRELY in Malayalam.'],
    [/[\u0A80-\u0AFF]/, 'Respond ENTIRELY in Gujarati.'],
    [/[\u0A00-\u0A7F]/, 'Respond ENTIRELY in Punjabi (Gurmukhi).'],
  ]
  const hinglishRe = /\b(kaunsa|kaun sa|mein|ke andar|kya hai|acha|sahi|lena|chahiye|konsa|wala|bahut)\b/i

  let langInstruction = ''
  for (const [re, inst] of langMap) {
    if (re.test(question)) { langInstruction = `IMPORTANT: ${inst}`; break }
  }
  if (!langInstruction && hinglishRe.test(question)) {
    langInstruction = 'IMPORTANT: Respond in natural Hinglish — mix Hindi and English as Indians speak daily.'
  }

  const serpResult = await searchGoogleShopping(question).catch(() => ({ products: [], relatedSearches: [], query: question }))
  const serpContext = buildProductContext(serpResult)

  const systemPrompt = `You are ProductRating.in's AI — India's smartest product advisor powered by Sarvam AI.
${langInstruction}

INSTRUCTIONS:
1. Write 3-5 sentences in plain text. No markdown, no asterisks, no bullets.
2. Then on a new line write exactly: ---PRODUCTS---
3. Then a JSON array of 4-6 products:
[{"name":"Product Name","price":"₹XX,XXX","seller":"Amazon","rating":4.2,"reviews":"2.3k","badge":"Best Pick","reason":"India-specific reason"}]
4. Use real product names, realistic Indian ₹ prices.
5. NEVER output <think> tags or **markdown**.`

  try {
    const res = await fetch('https://api.sarvam.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-subscription-key': apiKey },
      body: JSON.stringify({
        model: 'sarvam-m',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Question: ${question}\n${serpContext ? `\nLive data:\n${serpContext}` : '\nUse your Indian market knowledge.'}` }
        ],
        max_tokens: 1400, temperature: 0.4,
      }),
    })

    const raw = await res.text()
    if (!res.ok) return NextResponse.json({ answer: `⚠️ Sarvam error (${res.status}).`, products: [], serpProducts: [], aiProducts: [] })

    let data: { choices?: Array<{ message?: { content?: string } }> } = {}
    try { data = JSON.parse(raw) } catch {}

    const content = data.choices?.[0]?.message?.content || ''
    const clean = content.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1').trim()
    const parts = clean.split(/---PRODUCTS---/i)
    const answerText = parts[0].trim() || 'Here are the best options.'

    let aiProducts: Array<{name:string;price:string;seller:string;rating:number;reviews:string;badge:string;reason:string}> = []
    if (parts[1]) {
      try {
        const m = parts[1].match(/\[[\s\S]*\]/)
        if (m) aiProducts = JSON.parse(m[0])
      } catch {}
    }

    return NextResponse.json({ answer: answerText, products: [], serpProducts: serpResult.products, aiProducts, relatedSearches: serpResult.relatedSearches })
  } catch (err) {
    return NextResponse.json({ answer: `⚠️ Network error: ${String(err)}`, products: [], serpProducts: [], aiProducts: [] })
  }
}
