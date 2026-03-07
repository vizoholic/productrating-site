import { NextResponse } from 'next/server'
import { searchProducts } from '@/lib/wix'

export async function POST(req: Request) {
  const contentType = req.headers.get('content-type') || ''

  // --- Speech-to-Text branch (audio upload) ---
  if (contentType.includes('multipart/form-data')) {
    try {
      const formData = await req.formData()
      const audioFile = formData.get('audio') as File
      if (!audioFile) return NextResponse.json({ error: 'No audio file' }, { status: 400 })

      const sttForm = new FormData()
      sttForm.append('file', audioFile, audioFile.name || 'audio.webm')
      sttForm.append('model', 'saaras:v3')
      sttForm.append('mode', 'transcribe')

      const sttRes = await fetch('https://api.sarvam.ai/v1/speech-to-text', {
        method: 'POST',
        headers: { 'api-subscription-key': process.env.SARVAM_API_KEY || '' },
        body: sttForm,
      })

      const sttData = await sttRes.json()
      const transcript = sttData.transcript || ''
      return NextResponse.json({ transcript })
    } catch {
      return NextResponse.json({ error: 'STT failed' }, { status: 500 })
    }
  }

  // --- Chat Completion branch ---
  const { question } = await req.json()
  if (!question) return NextResponse.json({ error: 'No question' }, { status: 400 })

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
        'api-subscription-key': process.env.SARVAM_API_KEY || '',
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

    const data = await response.json()
    const answer = data.choices?.[0]?.message?.content || 'Unable to generate answer.'
    return NextResponse.json({ answer, products: products.slice(0, 3) })
  } catch {
    return NextResponse.json({
      answer: 'AI is being set up. Add your SARVAM_API_KEY to environment variables to enable live answers.',
      products: products.slice(0, 3),
    })
  }
}
