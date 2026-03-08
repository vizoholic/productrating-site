import { NextRequest, NextResponse } from 'next/server'
import { searchGoogleShopping, buildProductContext } from '@/lib/serpapi'
import { fetchWixProducts } from '@/lib/wix'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const ct = req.headers.get('content-type') || ''

  // --- Voice STT mode ---
  if (ct.includes('multipart/form-data')) {
    const apiKey = process.env.SARVAM_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'SARVAM_API_KEY not set', transcript: '' }, { status: 500 })
    const formData = await req.formData()
    const audioFile = formData.get('file') as File | null
    if (!audioFile) return NextResponse.json({ error: 'No audio file received', transcript: '' }, { status: 400 })
    const sarvamForm = new FormData()
    sarvamForm.append('file', audioFile)
    sarvamForm.append('model', 'saaras:v3')
    sarvamForm.append('language_code', 'en-IN')
    const sttRes = await fetch('https://api.sarvam.ai/speech-to-text', {
      method: 'POST',
      headers: { 'api-subscription-key': apiKey },
      body: sarvamForm,
    })
    const rawText = await sttRes.text()
    if (!sttRes.ok) {
      console.error('[STT] Sarvam error', sttRes.status, rawText)
      return NextResponse.json({ error: `STT failed: ${sttRes.status}`, transcript: '' }, { status: 500 })
    }
    let sttData: { transcript?: string } = {}
    try { sttData = JSON.parse(rawText) } catch { /* not JSON */ }
    return NextResponse.json({ transcript: sttData.transcript || '' })
  }

  // --- Chat / Search mode ---
  let body: { question?: string } = {}
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }) }
  const question = body.question?.trim()
  if (!question) return NextResponse.json({ error: 'No question provided' }, { status: 400 })

  const apiKey = process.env.SARVAM_API_KEY
  if (!apiKey) {
    return NextResponse.json({
      answer: '⚠️ SARVAM_API_KEY is not set. Add it in Vercel → Settings → Environment Variables.',
      products: [],
      serpProducts: [],
    })
  }

  // Fetch SerpApi + Wix in parallel
  const [wixProducts, serpResult] = await Promise.all([
    fetchWixProducts(question).catch(() => []),
    searchGoogleShopping(question).catch(() => ({ products: [], relatedSearches: [], query: question })),
  ])

  const wixContext = wixProducts.length
    ? `ProductRating.in database:\n${wixProducts.map(p => `• ${p.name} — ₹${p.price}`).join('\n')}`
    : ''
  const serpContext = buildProductContext(serpResult)

  // Build prompt — ask AI to return BOTH a text answer AND structured JSON product list
  const systemPrompt = `You are ProductRating.in's AI assistant — India's smartest product advisor.
Your job: help Indian consumers find the best products with honest, data-driven advice.

CRITICAL INSTRUCTIONS:
1. First write a helpful 3-5 sentence recommendation in plain text (no markdown, no asterisks, no bullet points)
2. Then on a NEW LINE write exactly: ---PRODUCTS---
3. Then output a JSON array of the top 4-6 products you recommend, like this:
[
  {"name":"Product Name","price":"₹XX,XXX","seller":"Amazon/Flipkart","rating":4.3,"reviews":"1.2k","badge":"Best Pick","reason":"Why this is great"},
  ...
]
4. Use real product names and realistic Indian market prices in ₹
5. NEVER use <think> tags, markdown bold (**), or bullet points in the text section`

  const userMessage = `Question: ${question}

${serpContext || wixContext ? `Live market data:\n${serpContext}\n${wixContext}` : 'Use your knowledge of the Indian market.'}

Remember: plain text answer first, then ---PRODUCTS--- marker, then JSON array.`

  try {
    const response = await fetch('https://api.sarvam.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': apiKey,
      },
      body: JSON.stringify({
        model: 'sarvam-m',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        max_tokens: 1200,
        temperature: 0.3,
      }),
    })

    const rawText = await response.text()
    if (!response.ok) {
      console.error('[Chat] Sarvam error', response.status, rawText)
      return NextResponse.json({ answer: `⚠️ Sarvam API error (${response.status}).`, products: [], serpProducts: [] })
    }

    let data: { choices?: Array<{ message?: { content?: string } }> } = {}
    try { data = JSON.parse(rawText) } catch { /* not JSON */ }

    const raw = data.choices?.[0]?.message?.content || ''

    // Strip <think>...</think> blocks first
    const noThink = raw
      .replace(/<think>[\s\S]*?<\/think>/gi, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .trim()

    // Split on ---PRODUCTS--- marker
    const parts = noThink.split(/---PRODUCTS---/i)
    const answerText = parts[0].trim() || 'Here are the best options for your query.'

    // Parse product JSON from second part
    let aiProducts: Array<{name:string;price:string;seller:string;rating:number;reviews:string;badge:string;reason:string}> = []
    if (parts[1]) {
      try {
        const jsonMatch = parts[1].match(/\[[\s\S]*\]/)
        if (jsonMatch) aiProducts = JSON.parse(jsonMatch[0])
      } catch (e) {
        console.warn('[Route] Failed to parse AI products JSON:', e)
      }
    }

    console.log(`[Route] AI products parsed: ${aiProducts.length}, SerpApi products: ${serpResult.products.length}`)

    return NextResponse.json({
      answer: answerText,
      products: wixProducts,
      serpProducts: serpResult.products,
      aiProducts,
      relatedSearches: serpResult.relatedSearches,
    })

  } catch (err) {
    return NextResponse.json({ answer: `⚠️ Network error: ${String(err)}`, products: [], serpProducts: [], aiProducts: [] })
  }
}
