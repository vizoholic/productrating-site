import { NextRequest, NextResponse } from 'next/server'
import { searchGoogleShopping, buildProductContext } from '@/lib/serpapi'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const ct = req.headers.get('content-type') || ''

  // ── Voice STT ──
  if (ct.includes('multipart/form-data')) {
    const apiKey = process.env.SARVAM_API_KEY
    if (!apiKey) {
      console.error('[STT] SARVAM_API_KEY not set')
      return NextResponse.json({ error: 'SARVAM_API_KEY not set', transcript: '' }, { status: 500 })
    }

    let formData: FormData
    try { formData = await req.formData() }
    catch (e) { return NextResponse.json({ error: 'Failed to parse form data', transcript: '' }, { status: 400 }) }

    // Accept both 'file' and 'audio' field names from frontend
    const audioFile = (formData.get('file') ?? formData.get('audio')) as File | null
    if (!audioFile) {
      console.error('[STT] No audio file in form data. Fields:', [...formData.keys()])
      return NextResponse.json({ error: 'No audio file received', transcript: '' }, { status: 400 })
    }

    console.log(`[STT] Received audio: size=${audioFile.size} bytes, type=${audioFile.type}, name=${audioFile.name}`)

    // Build Sarvam request
    // saaras:v3 endpoint: POST /speech-to-text
    // Required: file (audio), model, language_code
    // For saaras:v3: mode parameter required
    const sarvamForm = new FormData()
    sarvamForm.append('file', audioFile)
    sarvamForm.append('model', 'saaras:v3')
    sarvamForm.append('language_code', 'unknown')  // auto-detect language
    sarvamForm.append('mode', 'transcribe')         // required for saaras:v3

    let sttRes: Response
    try {
      sttRes = await fetch('https://api.sarvam.ai/speech-to-text', {
        method: 'POST',
        headers: { 'api-subscription-key': apiKey },
        body: sarvamForm,
      })
    } catch (e) {
      console.error('[STT] Network error calling Sarvam:', e)
      return NextResponse.json({ error: `Network error: ${String(e)}`, transcript: '' }, { status: 500 })
    }

    const rawText = await sttRes.text()
    console.log(`[STT] Sarvam response: status=${sttRes.status}, body=${rawText.slice(0, 500)}`)

    if (!sttRes.ok) {
      return NextResponse.json({ error: `STT failed (${sttRes.status}): ${rawText.slice(0, 200)}`, transcript: '' }, { status: 500 })
    }

    let sttData: { transcript?: string; language_code?: string } = {}
    try { sttData = JSON.parse(rawText) } catch {
      console.error('[STT] Failed to parse Sarvam JSON response:', rawText.slice(0, 200))
      return NextResponse.json({ error: 'Invalid response from Sarvam', transcript: '' }, { status: 500 })
    }

    const transcript = sttData.transcript || ''
    console.log(`[STT] Transcript: "${transcript}" | Language: ${sttData.language_code || 'unknown'}`)
    return NextResponse.json({ transcript, detectedLanguage: sttData.language_code || '' })
  }

  // ── Chat / Search ──
  let body: { question?: string } = {}
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }) }

  const question = body.question?.trim()
  if (!question) return NextResponse.json({ error: 'No question provided' }, { status: 400 })

  const apiKey = process.env.SARVAM_API_KEY
  if (!apiKey) {
    return NextResponse.json({ answer: '⚠️ SARVAM_API_KEY not set in Vercel env vars.', products: [], serpProducts: [], aiProducts: [] })
  }

  // Detect script/language from Unicode ranges
  const hasDevanagari = /[\u0900-\u097F]/.test(question)
  const hasTamil = /[\u0B80-\u0BFF]/.test(question)
  const hasTelugu = /[\u0C00-\u0C7F]/.test(question)
  const hasBengali = /[\u0980-\u09FF]/.test(question)
  const hasKannada = /[\u0C80-\u0CFF]/.test(question)
  const hasMalayalam = /[\u0D00-\u0D7F]/.test(question)
  const hasGujarati = /[\u0A80-\u0AFF]/.test(question)
  const hasPunjabi = /[\u0A00-\u0A7F]/.test(question)
  const isHinglish = /\b(kaunsa|kaun sa|mein|ke andar|kya hai|acha|sahi|lena|chahiye|konsa|wala|bahut|accha)\b/i.test(question)

  let langInstruction = ''
  if (hasDevanagari) langInstruction = 'IMPORTANT: Respond ENTIRELY in Hindi (Devanagari script). Product names and prices can stay in English.'
  else if (hasTamil) langInstruction = 'IMPORTANT: Respond ENTIRELY in Tamil.'
  else if (hasTelugu) langInstruction = 'IMPORTANT: Respond ENTIRELY in Telugu.'
  else if (hasBengali) langInstruction = 'IMPORTANT: Respond ENTIRELY in Bengali.'
  else if (hasKannada) langInstruction = 'IMPORTANT: Respond ENTIRELY in Kannada.'
  else if (hasMalayalam) langInstruction = 'IMPORTANT: Respond ENTIRELY in Malayalam.'
  else if (hasGujarati) langInstruction = 'IMPORTANT: Respond ENTIRELY in Gujarati.'
  else if (hasPunjabi) langInstruction = 'IMPORTANT: Respond ENTIRELY in Punjabi (Gurmukhi).'
  else if (isHinglish) langInstruction = 'IMPORTANT: Respond in natural Hinglish — mix Hindi and English as Indians speak in daily life.'

  // Fetch live prices
  const serpResult = await searchGoogleShopping(question).catch(() => ({ products: [], relatedSearches: [], query: question }))
  const serpContext = buildProductContext(serpResult)

  const systemPrompt = `You are ProductRating.in's AI assistant — India's smartest product advisor, powered by Sarvam AI.
${langInstruction}

INSTRUCTIONS:
1. Write a helpful 3-5 sentence recommendation in plain text. No markdown, no asterisks, no bullet points.
2. Then write exactly on a new line: ---PRODUCTS---
3. Then output a JSON array of 4-6 top products:
[{"name":"Product Name","price":"₹XX,XXX","seller":"Amazon","rating":4.2,"reviews":"2.3k","badge":"Best Pick","reason":"Why ideal for Indian buyers — mention city, climate, or Indian-specific reasons"}]
4. Use real product names with realistic Indian ₹ prices.
5. NEVER use <think> tags, **markdown**, or bullet points.`

  try {
    const response = await fetch('https://api.sarvam.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-subscription-key': apiKey },
      body: JSON.stringify({
        model: 'sarvam-m',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Question: ${question}\n${serpContext ? `\nLive market data:\n${serpContext}` : '\nUse your knowledge of the Indian market.'}` }
        ],
        max_tokens: 1400,
        temperature: 0.4,
      }),
    })

    const rawText = await response.text()
    if (!response.ok) return NextResponse.json({ answer: `⚠️ Sarvam error (${response.status}).`, products: [], serpProducts: [], aiProducts: [] })

    let data: { choices?: Array<{ message?: { content?: string } }> } = {}
    try { data = JSON.parse(rawText) } catch {}

    const raw = data.choices?.[0]?.message?.content || ''
    const clean = raw.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1').trim()

    const parts = clean.split(/---PRODUCTS---/i)
    const answerText = parts[0].trim() || 'Here are the best options for your query.'

    let aiProducts: Array<{name:string;price:string;seller:string;rating:number;reviews:string;badge:string;reason:string}> = []
    if (parts[1]) {
      try {
        const m = parts[1].match(/\[[\s\S]*\]/)
        if (m) aiProducts = JSON.parse(m[0])
      } catch (e) { console.warn('[Chat] Failed to parse AI products JSON') }
    }

    return NextResponse.json({ answer: answerText, products: [], serpProducts: serpResult.products, aiProducts, relatedSearches: serpResult.relatedSearches })

  } catch (err) {
    return NextResponse.json({ answer: `⚠️ Network error: ${String(err)}`, products: [], serpProducts: [], aiProducts: [] })
  }
}
