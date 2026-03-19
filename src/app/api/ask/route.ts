import { NextRequest, NextResponse } from 'next/server'
import { searchGoogleShopping, buildProductContext } from '@/lib/serpapi'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const ct = req.headers.get('content-type') || ''

  // ── Voice STT ──
  if (ct.includes('multipart/form-data')) {
    const apiKey = process.env.SARVAM_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'SARVAM_API_KEY not set', transcript: '' }, { status: 500 })
    const formData = await req.formData()
    // Accept both 'file' and 'audio' field names
    const audioFile = (formData.get('file') ?? formData.get('audio')) as File | null
    if (!audioFile) return NextResponse.json({ error: 'No audio file received', transcript: '' }, { status: 400 })

    const sarvamForm = new FormData()
    sarvamForm.append('file', audioFile)
    sarvamForm.append('model', 'saaras:v3')
    // Auto-detect language — Saaras v3 supports 22 Indian languages
    sarvamForm.append('language_code', 'unknown')

    const sttRes = await fetch('https://api.sarvam.ai/speech-to-text', {
      method: 'POST',
      headers: { 'api-subscription-key': apiKey },
      body: sarvamForm,
    })
    const rawText = await sttRes.text()
    if (!sttRes.ok) {
      console.error('[STT] Sarvam error', sttRes.status, rawText.slice(0, 200))
      return NextResponse.json({ error: `STT failed: ${sttRes.status}`, transcript: '' }, { status: 500 })
    }
    let sttData: { transcript?: string; language_code?: string } = {}
    try { sttData = JSON.parse(rawText) } catch {}
    return NextResponse.json({ transcript: sttData.transcript || '', detectedLanguage: sttData.language_code || '' })
  }

  // ── Chat / Search ──
  let body: { question?: string } = {}
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }) }
  const question = body.question?.trim()
  if (!question) return NextResponse.json({ error: 'No question provided' }, { status: 400 })

  const apiKey = process.env.SARVAM_API_KEY
  if (!apiKey) {
    return NextResponse.json({ answer: '⚠️ SARVAM_API_KEY not set.', products: [], serpProducts: [], aiProducts: [] })
  }

  // Detect if query is in a non-English Indian language
  const hasDevanagari = /[\u0900-\u097F]/.test(question)
  const hasTamil = /[\u0B80-\u0BFF]/.test(question)
  const hasTelugu = /[\u0C00-\u0C7F]/.test(question)
  const hasBengali = /[\u0980-\u09FF]/.test(question)
  const hasKannada = /[\u0C80-\u0CFF]/.test(question)
  const hasMalayalam = /[\u0D00-\u0D7F]/.test(question)
  const hasGujarati = /[\u0A80-\u0AFF]/.test(question)
  const hasPunjabi = /[\u0A00-\u0A7F]/.test(question)
  const isIndianLang = hasDevanagari || hasTamil || hasTelugu || hasBengali || hasKannada || hasMalayalam || hasGujarati || hasPunjabi

  // Detect Hindi-English mix (Hinglish)
  const isHinglish = !isIndianLang && /\b(kaunsa|kaun sa|best|mein|ke andar|kya|hai|acha|sahi|lena|chahiye|konsa|wala)\b/i.test(question)

  let languageInstruction = ''
  if (hasDevanagari) languageInstruction = 'IMPORTANT: The user asked in Hindi. Respond ENTIRELY in Hindi (Devanagari script). Product names and prices can be in English.'
  else if (hasTamil) languageInstruction = 'IMPORTANT: The user asked in Tamil. Respond ENTIRELY in Tamil script.'
  else if (hasTelugu) languageInstruction = 'IMPORTANT: The user asked in Telugu. Respond ENTIRELY in Telugu script.'
  else if (hasBengali) languageInstruction = 'IMPORTANT: The user asked in Bengali. Respond ENTIRELY in Bengali script.'
  else if (hasKannada) languageInstruction = 'IMPORTANT: The user asked in Kannada. Respond ENTIRELY in Kannada script.'
  else if (hasMalayalam) languageInstruction = 'IMPORTANT: The user asked in Malayalam. Respond ENTIRELY in Malayalam script.'
  else if (hasGujarati) languageInstruction = 'IMPORTANT: The user asked in Gujarati. Respond ENTIRELY in Gujarati script.'
  else if (hasPunjabi) languageInstruction = 'IMPORTANT: The user asked in Punjabi. Respond ENTIRELY in Punjabi (Gurmukhi script).'
  else if (isHinglish) languageInstruction = 'IMPORTANT: The user asked in Hinglish (Hindi-English mix). Respond in a natural Hinglish style — mix Hindi and English naturally as Indians speak.'

  // Fetch live prices in parallel
  const serpResult = await searchGoogleShopping(question).catch(() => ({ products: [], relatedSearches: [], query: question }))
  const serpContext = buildProductContext(serpResult)

  const systemPrompt = `You are ProductRating.in's AI assistant — India's smartest product advisor powered by Sarvam AI.
${languageInstruction}

INSTRUCTIONS:
1. Write a helpful 3-5 sentence recommendation in plain text. No markdown, no asterisks, no bullet points.
2. Then write exactly: ---PRODUCTS---
3. Then output a JSON array of top 4-6 products:
[{"name":"Product Name","price":"₹XX,XXX","seller":"Amazon/Flipkart","rating":4.2,"reviews":"2.3k","badge":"Best Pick","reason":"Why this is the best choice for Indian buyers"}]
4. Use real product names with realistic Indian ₹ prices.
5. The "reason" field should mention Indian-specific factors (city, climate, voltage, service quality).
6. NEVER use <think> tags or **markdown** in the text section.`

  const userMessage = `Question: ${question}
${serpContext ? `\nLive market data:\n${serpContext}` : '\nUse your knowledge of the Indian market.'}`

  try {
    const response = await fetch('https://api.sarvam.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-subscription-key': apiKey },
      body: JSON.stringify({
        model: 'sarvam-m',
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userMessage }],
        max_tokens: 1400,
        temperature: 0.4,
      }),
    })

    const rawText = await response.text()
    if (!response.ok) return NextResponse.json({ answer: `⚠️ Sarvam API error (${response.status}).`, products: [], serpProducts: [], aiProducts: [] })

    let data: { choices?: Array<{ message?: { content?: string } }> } = {}
    try { data = JSON.parse(rawText) } catch {}

    const raw = data.choices?.[0]?.message?.content || ''
    const noThink = raw.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1').trim()

    const parts = noThink.split(/---PRODUCTS---/i)
    const answerText = parts[0].trim() || 'Here are the best options for your query.'

    let aiProducts: Array<{name:string;price:string;seller:string;rating:number;reviews:string;badge:string;reason:string}> = []
    if (parts[1]) {
      try {
        const jsonMatch = parts[1].match(/\[[\s\S]*\]/)
        if (jsonMatch) aiProducts = JSON.parse(jsonMatch[0])
      } catch {}
    }

    return NextResponse.json({ answer: answerText, products: [], serpProducts: serpResult.products, aiProducts, relatedSearches: serpResult.relatedSearches })

  } catch (err) {
    return NextResponse.json({ answer: `⚠️ Network error: ${String(err)}`, products: [], serpProducts: [], aiProducts: [] })
  }
}
