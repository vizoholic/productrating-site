import { NextResponse } from 'next/server'
import { searchProducts } from '@/lib/wix'

const SARVAM_KEY = process.env.SARVAM_API_KEY || ''

export async function POST(req: Request) {
  const contentType = req.headers.get('content-type') || ''

  // ── Speech-to-Text branch ──────────────────────────────────────────────────
  if (contentType.includes('multipart/form-data')) {
    try {
      if (!SARVAM_KEY) {
        return NextResponse.json({ error: 'SARVAM_API_KEY not set', transcript: '' }, { status: 500 })
      }

      const formData = await req.formData()
      const audioFile = formData.get('audio') as File | null
      if (!audioFile) {
        return NextResponse.json({ error: 'No audio file received', transcript: '' }, { status: 400 })
      }

      const arrayBuffer = await audioFile.arrayBuffer()
      const audioBuffer = Buffer.from(arrayBuffer)

      const sttForm = new FormData()
      const blob = new Blob([audioBuffer], { type: audioFile.type || 'audio/webm' })
      sttForm.append('file', blob, 'recording.webm')
      sttForm.append('model', 'saaras:v3')
      sttForm.append('mode', 'transcribe')

      // Correct endpoint: https://api.sarvam.ai/speech-to-text (no /v1/)
      const sttRes = await fetch('https://api.sarvam.ai/speech-to-text', {
        method: 'POST',
        headers: { 'api-subscription-key': SARVAM_KEY },
        body: sttForm,
      })

      const rawText = await sttRes.text()

      if (!sttRes.ok) {
        console.error('[STT] Sarvam error', sttRes.status, rawText)
        return NextResponse.json(
          { error: `Sarvam STT failed: ${sttRes.status}`, transcript: '' },
          { status: 500 }
        )
      }

      let sttData: { transcript?: string } = {}
      try { sttData = JSON.parse(rawText) } catch { /* not JSON */ }

      const transcript = sttData.transcript || ''
      return NextResponse.json({ transcript })
    } catch (err) {
      console.error('[STT] Unexpected error:', err)
      return NextResponse.json({ error: String(err), transcript: '' }, { status: 500 })
    }
  }

  // ── Chat Completion branch ─────────────────────────────────────────────────
  let question = ''
  try {
    const body = await req.json()
    question = body?.question || ''
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!question.trim()) {
    return NextResponse.json({ error: 'No question provided' }, { status: 400 })
  }

  if (!SARVAM_KEY) {
    return NextResponse.json({
      answer: '⚠️ SARVAM_API_KEY is not set in Vercel environment variables. Please add it in Vercel → Settings → Environment Variables.',
      products: [],
    })
  }

  const products = await searchProducts(question)

  const productContext = products.slice(0, 5).map(p =>
    `${p.name} (${p.brand}): PR Score ${p.aggregatedScore}/5 from ${p.totalReviews} reviews. Verdict: ${p.verdictBadge}. Price: ₹${p.priceMin}-₹${p.priceMax}. Flipkart: ${p.flipkartScore}, Amazon: ${p.amazonScore}. Pros: ${p.pros?.join(', ')}. Cons: ${p.cons?.join(', ')}.`
  ).join('\n')

  const systemPrompt = `You are ProductRating.in's AI assistant — India's most trusted product intelligence platform.
You help Indian consumers make smart buying decisions based on aggregated ratings from Flipkart, Amazon, Nykaa, Meesho and more.

Key rules:
- Always mention prices in Indian Rupees (₹)
- Reference specific Indian platforms (Flipkart, Amazon India, Nykaa, Meesho)
- Consider Indian context: regional climate, Indian usage patterns, service availability in India
- Be specific and honest — give a clear verdict (Buy Now / Consider / Wait)
- Keep answers concise (3-5 sentences max)
- If recommending a product, mention the PR Score
- You understand Hindi, Tamil, Telugu, Bengali and other Indian languages — respond in the same language the user uses

Product data from our database:
${productContext || 'No specific products found. Answer based on general knowledge of Indian market.'}`

  try {
    const response = await fetch('https://api.sarvam.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': SARVAM_KEY,
      },
      body: JSON.stringify({
        model: 'sarvam-m',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question },
        ],
        max_tokens: 400,
        temperature: 0.3,
      }),
    })

    const rawText = await response.text()

    if (!response.ok) {
      console.error('[Chat] Sarvam error', response.status, rawText)
      return NextResponse.json({
        answer: `⚠️ Sarvam API error (${response.status}). Check your SARVAM_API_KEY in Vercel → Settings → Environment Variables.`,
        products: products.slice(0, 3),
      })
    }

    let data: { choices?: Array<{ message?: { content?: string } }> } = {}
    try { data = JSON.parse(rawText) } catch { /* not JSON */ }

    const answer = data.choices?.[0]?.message?.content || 'Unable to generate answer.'
    return NextResponse.json({ answer, products: products.slice(0, 3) })
  } catch (err) {
    console.error('[Chat] Unexpected error:', err)
    return NextResponse.json({
      answer: `⚠️ Network error: ${String(err)}`,
      products: products.slice(0, 3),
    })
  }
}
