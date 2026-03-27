// src/lib/search.ts
// Sarvam AI = STT only | GPT-5.3 (fast) / GPT-5.4 (deep) = product intelligence | Google Shopping = live prices

import { searchGoogleShopping, buildProductContext, type SerpSearchResult } from './serpapi'

export type AiProduct = {
  name: string; price: string; seller: string
  rating: number; platform_rating: number
  reviews: string; badge: string; reason: string
  pros: string[]; cons: string[]; avoid_if: string
}

export type SearchResult = {
  answer: string
  aiProducts: AiProduct[]
  serpProducts: SerpSearchResult['products']
  relatedSearches: string[]
}

const cache = new Map<string, { result: SearchResult; ts: number }>()
const CACHE_TTL = 30 * 60 * 1000

function getMonthYear() {
  const d = new Date()
  return `${d.toLocaleString('en-US', { month: 'long' })} ${d.getFullYear()}`
}

function detectLang(q: string): string {
  if (/[\u0900-\u097F]/.test(q)) return 'Respond in Hindi. Product names in English ok.'
  if (/[\u0B80-\u0BFF]/.test(q)) return 'Respond in Tamil.'
  if (/[\u0C00-\u0C7F]/.test(q)) return 'Respond in Telugu.'
  if (/[\u0980-\u09FF]/.test(q)) return 'Respond in Bengali.'
  if (/[\u0C80-\u0CFF]/.test(q)) return 'Respond in Kannada.'
  if (/[\u0D00-\u0D7F]/.test(q)) return 'Respond in Malayalam.'
  if (/\b(kaunsa|kaun sa|mein|ke andar|chahiye|konsa|wala|kya hai)\b/i.test(q)) return 'Respond in Hinglish.'
  return ''
}

function getLocation(city: string, state: string): string {
  const CITIES = new Set(['delhi','new delhi','mumbai','bombay','bangalore','bengaluru','chennai','kolkata','hyderabad','pune','ahmedabad','surat','jaipur','lucknow','noida','gurgaon','gurugram','coimbatore','kochi','indore','chandigarh','nagpur','bhopal','visakhapatnam','vizag','patna','ranchi'])
  const c = city.toLowerCase().trim()
  if (c && CITIES.has(c)) return city
  if (c && c.length > 2) return city
  if (state && state.length > 2) return state
  return ''
}

// Queries needing deep reasoning → use gpt-5.4
// Fast everyday queries → use gpt-5.3-chat-latest
function selectModel(question: string): { model: string; label: string } {
  const deepKeywords = /compare|versus|vs\b|difference|which is better|recommend|expert|review analysis|under budget|best value|should i buy/i
  if (deepKeywords.test(question)) {
    return { model: 'gpt-5.4', label: 'GPT-5.4' }
  }
  return { model: 'gpt-5.3-chat-latest', label: 'GPT-5.3' }
}

function extractJsonArray(text: string): unknown[] {
  const start = text.indexOf('[')
  if (start === -1) return []
  let depth = 0, end = -1
  for (let i = start; i < text.length; i++) {
    if (text[i] === '[') depth++
    else if (text[i] === ']') { depth--; if (depth === 0) { end = i; break } }
  }
  if (end === -1) return []
  const s = text.slice(start, end + 1)
  try { return JSON.parse(s) } catch {
    try { return JSON.parse(s.replace(/,(\s*[}\]])/g, '$1')) } catch { return [] }
  }
}

function sanitise(p: Record<string, unknown>, i: number): AiProduct {
  const r = Math.min(4.8, Math.max(3.5, Number(p.rating) || 4.0))
  return {
    name:            String(p.name || '').trim(),
    price:           String(p.price || '—'),
    seller:          String(p.seller || 'Amazon'),
    rating:          r,
    platform_rating: Math.min(5.0, Math.max(r + 0.2, Number(p.platform_rating) || r + 0.3)),
    reviews:         String(p.reviews || ''),
    badge:           String(p.badge || ['Best Pick','Best Value','Budget Pick'][i] || 'Top Rated'),
    reason:          String(p.reason || ''),
    pros:            Array.isArray(p.pros) ? p.pros.slice(0, 2).map(String) : [],
    cons:            Array.isArray(p.cons) ? p.cons.slice(0, 1).map(String) : [],
    avoid_if:        String(p.avoid_if || ''),
  }
}

async function callOpenAI(model: string, systemPrompt: string, userMsg: string, apiKey: string): Promise<string> {
  for (let attempt = 0; attempt <= 2; attempt++) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMsg },
          ],
          max_tokens: 2000,
          temperature: 0.3,
        }),
      })
      if (res.status === 429) {
        console.log(`[OpenAI] 429 attempt ${attempt + 1}`)
        if (attempt < 2) await new Promise(r => setTimeout(r, 1000 * (attempt + 1)))
        continue
      }
      const raw = await res.text()
      console.log(`[OpenAI:${model}] status=${res.status} len=${raw.length}`)
      if (!res.ok) { console.error('[OpenAI] error:', raw.slice(0, 300)); return '' }
      const d = JSON.parse(raw)
      const content = d?.choices?.[0]?.message?.content || ''
      console.log(`[OpenAI] preview: ${content.slice(0, 120)}`)
      return content
    } catch (e) {
      console.error(`[OpenAI] attempt ${attempt + 1} threw:`, String(e))
      if (attempt < 2) await new Promise(r => setTimeout(r, 1000))
    }
  }
  return ''
}

// Sarvam fallback if OpenAI not configured
async function callSarvam(systemPrompt: string, userMsg: string, apiKey: string): Promise<string> {
  for (let attempt = 0; attempt <= 3; attempt++) {
    try {
      const res = await fetch('https://api.sarvam.ai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'api-subscription-key': apiKey },
        body: JSON.stringify({
          model: 'sarvam-m',
          messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userMsg }],
          max_tokens: 2000, temperature: 0.25,
        }),
      })
      if (res.status === 429) {
        if (attempt < 3) await new Promise(r => setTimeout(r, Math.min(1000 * Math.pow(2, attempt), 8000)))
        continue
      }
      const raw = await res.text()
      if (!res.ok) return ''
      const d = JSON.parse(raw)
      let c = d?.choices?.[0]?.message?.content || ''
      let prev = ''
      while (prev !== c) { prev = c; c = c.replace(/<think>[\s\S]*?<\/think>/gi, '') }
      return c.replace(/<\/?think[^>]*>/gi, '').trim()
    } catch (e) {
      console.error(`[Sarvam] attempt ${attempt + 1}:`, String(e))
      if (attempt < 3) await new Promise(r => setTimeout(r, 1000))
    }
  }
  return ''
}

export async function runSearch(
  question: string,
  city = '', state = '',
  sarvamKey: string,
  openaiKey?: string
): Promise<SearchResult> {
  const cacheKey = `${question.toLowerCase().trim()}|${city}|${state}`
  const hit = cache.get(cacheKey)
  if (hit && Date.now() - hit.ts < CACHE_TTL) { console.log('[Search] cache hit'); return hit.result }

  const monthYear = getMonthYear()
  const currentYear = new Date().getFullYear()
  const lang = detectLang(question)
  const loc = getLocation(city, state)
  const { model, label } = selectModel(question)

  // SERP — live prices from Google Shopping
  let serpResult: SerpSearchResult = { products: [], relatedSearches: [], query: question }
  try {
    serpResult = await searchGoogleShopping(question)
    console.log(`[SERP] ${serpResult.products.length} products`)
  } catch (e) { console.error('[SERP]:', String(e)) }
  const serpContext = buildProductContext(serpResult)

  // ── SCORING FRAMEWORK (restored from previous design) ──
  const scoringFramework = `
PRODUCT SCORING MODEL — score each candidate out of 100 to pick top 3:

  RELEVANCE  (40 pts) — Matches query specs/budget? Right category? Right use case?
  RECENCY    (30 pts) — ${currentYear} launch = 30 | ${currentYear-1} = 22 | ${currentYear-2} = 12 | Older = 0
  REVIEWS    (20 pts) — 50k+ = 20 | 20k-50k = 15 | 5k-20k = 10 | <5k = 5
  RATING     (10 pts) — Platform 4.5+ = 10 | 4.2-4.4 = 7 | 4.0-4.1 = 5 | <4.0 = 0

EVERGREEN EXCEPTION — older product (${currentYear-2}+) may appear if ALL 3 true:
  ✓ Still sold NEW on Amazon.in / Flipkart at current market price (not discontinued)
  ✓ 25,000+ genuine reviews with ongoing buyer activity
  ✓ Specs still competitive vs current alternatives at its price

EXAMPLES — good evergreen: Redmi Note 13 (massive reviews, active stock, competitive)
EXAMPLES — avoid: Redmi Note 12 (replaced), Samsung M33 (M35 released), Narzo 60x (replaced)`

  const systemPrompt = `You are ProductRating.in, India's most trusted AI product advisor. Today: ${monthYear}.
${lang ? lang + '\n' : ''}${loc ? `User location: ${loc}. Personalise for their climate and service availability.\n` : ''}

YOUR DIFFERENTIATOR — FAKE REVIEW REMOVAL:
Your PR Score is ALWAYS lower than platform ratings because you remove:
- Incentivised/paid reviews · Bot-generated verified reviews · Sudden rating spikes · Seller promotions
This is why you show 4.2 when Amazon shows 4.7. Be honest — that's your brand.

${scoringFramework}

INDIA MARKET INTELLIGENCE:
- Service density: Samsung > Xiaomi/Redmi > Realme > iQOO > CMF/Nothing (newer brand)
- Hard water (most of India): flag washing machine motor compatibility
- Power fluctuation cities: inverter AC/compressor is non-negotiable
- Monsoon / high-humidity areas (coastal): check IP rating for electronics
- Strong brands for India ${currentYear}: iQOO Z/Neo, CMF Phone 2 Pro, Moto G96/Edge 50, Realme P4/GT 7, Redmi 14/15, Samsung A55/A56, POCO X7, Vivo T5

RESPONSE FORMAT — follow exactly, no preamble, no markdown:

[2-3 sentences of specific buying advice mentioning key tradeoff]
---PRODUCTS---
[{"name":"Full Product Name","price":"₹XX,XXX","seller":"Amazon","rating":4.2,"platform_rating":4.6,"reviews":"18k","badge":"Best Pick","reason":"One sentence why this wins for THIS specific query","pros":["Specific factual pro 1","Specific factual pro 2"],"cons":["Main real buyer complaint"],"avoid_if":"Specific who should not buy"},{"name":"Second Product","price":"₹XX,XXX","seller":"Flipkart","rating":4.0,"platform_rating":4.4,"reviews":"12k","badge":"Best Value","reason":"Why second","pros":["Pro 1","Pro 2"],"cons":["Con"],"avoid_if":"Skip if"},{"name":"Third Product","price":"₹XX,XXX","seller":"Amazon","rating":3.9,"platform_rating":4.3,"reviews":"9k","badge":"Budget Pick","reason":"Why third","pros":["Pro 1","Pro 2"],"cons":["Con"],"avoid_if":"Skip if"}]`

  const userMsg = `Question: ${question}${loc ? `\nLocation: ${loc}` : ''}
Current date: ${monthYear}

${serpContext
    ? `Live data from Indian shopping platforms (ground truth for price and availability):\n${serpContext}\n\nApply the scoring framework to rank these + add any better alternatives from your knowledge.`
    : `Use your knowledge of the Indian market as of ${monthYear}. Apply the scoring framework carefully.`}`

  // Call OpenAI (primary) or Sarvam (fallback)
  let rawContent = ''
  if (openaiKey) {
    console.log(`[Search] using ${label}`)
    rawContent = await callOpenAI(model, systemPrompt, userMsg, openaiKey)
    // If gpt-5.3 fails or returns nothing, retry with gpt-5.4
    if (!rawContent && model !== 'gpt-5.4') {
      console.log('[Search] retrying with gpt-5.4')
      rawContent = await callOpenAI('gpt-5.4', systemPrompt, userMsg, openaiKey)
    }
  }
  if (!rawContent && sarvamKey) {
    console.log('[Search] falling back to Sarvam')
    rawContent = await callSarvam(systemPrompt, userMsg, sarvamKey)
  }

  if (!rawContent) {
    return { answer: 'AI is temporarily unavailable. Please try again.', aiProducts: [], serpProducts: serpResult.products, relatedSearches: serpResult.relatedSearches }
  }

  // Parse response
  const sepIdx = rawContent.search(/---PRODUCTS---/i)
  const answer = (sepIdx !== -1 ? rawContent.slice(0, sepIdx) : rawContent.slice(0, 500))
    .replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1').trim()
    || 'Here are the top options for India right now.'

  const jsonSection = sepIdx !== -1 ? rawContent.slice(sepIdx + 15) : rawContent
  let rawArr = extractJsonArray(jsonSection)
  if (rawArr.length === 0) rawArr = extractJsonArray(rawContent)

  console.log(`[Search] parsed ${rawArr.length} products via ${label}`)

  let aiProducts: AiProduct[] = (rawArr as Record<string, unknown>[])
    .filter(p => p && typeof p.name === 'string' && p.name.length > 2)
    .slice(0, 3)
    .map(sanitise)

  // Fill from SERP if AI returned fewer than 3
  if (aiProducts.length < 3 && serpResult.products.length > 0) {
    const used = new Set(aiProducts.map(p => p.name.toLowerCase()))
    const fill = serpResult.products
      .filter(sp => sp.title && sp.price && !used.has(sp.title.toLowerCase()))
      .slice(0, 3 - aiProducts.length)
      .map((sp, i): AiProduct => ({
        name: sp.title, price: sp.price || '—', seller: sp.source || 'Amazon',
        rating: sp.rating ? Math.min(4.8, Math.max(3.5, Number(sp.rating))) : 4.0,
        platform_rating: sp.rating ? Math.min(5.0, Number(sp.rating) + 0.3) : 4.3,
        reviews: '', badge: (['Best Pick','Best Value','Budget Pick'][aiProducts.length + i]) || 'Top Rated',
        reason: `Top result on ${sp.source || 'Amazon'} for this query.`,
        pros: ['Competitive price in India', 'Well-reviewed by Indian buyers'],
        cons: ['Compare specs before buying'],
        avoid_if: 'If you need detailed AI analysis — try again shortly',
      }))
    aiProducts = [...aiProducts, ...fill]
  }

  const result: SearchResult = {
    answer,
    aiProducts: aiProducts.slice(0, 3),
    serpProducts: serpResult.products,
    relatedSearches: serpResult.relatedSearches,
  }
  cache.set(cacheKey, { result, ts: Date.now() })
  return result
}
