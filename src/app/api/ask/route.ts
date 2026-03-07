import { NextResponse } from 'next/server'
import { searchProducts } from '@/lib/wix'

export async function POST(req: Request) {
  const { question } = await req.json()
  if (!question) return NextResponse.json({ error: 'No question' }, { status: 400 })

  // Search Wix CMS for relevant products
  const products = await searchProducts(question)

  // Build context from products
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

Product data from our database:
${productContext || 'No specific products found. Answer based on general knowledge of Indian market.'}
`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 400,
        system: systemPrompt,
        messages: [{ role: 'user', content: question }],
      }),
    })

    const data = await response.json()
    const answer = data.content?.[0]?.text || 'Unable to generate answer.'

    return NextResponse.json({ answer, products: products.slice(0, 3) })
  } catch (error) {
    return NextResponse.json({
      answer: 'AI is being set up. Add your ANTHROPIC_API_KEY to .env.local to enable live AI answers.',
      products: products.slice(0, 3),
    })
  }
}
