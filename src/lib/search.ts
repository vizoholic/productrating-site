// src/lib/search.ts
// Sarvam = STT only | OpenAI GPT-5.3/5.4 JSON mode = products | Google Shopping = live prices

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

function getYear() { return new Date().getFullYear() }

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

function selectModel(q: string): string {
  return /compare|versus|\bvs\b|difference|which is better|recommend|expert|best value|should i buy/i.test(q)
    ? 'gpt-5.4'
    : 'gpt-5.3-chat-latest'
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

// ── OpenAI: JSON mode guarantees structured output every time ──
async function callOpenAI(
  question: string, serpContext: string, loc: string,
  lang: string, monthYear: string, currentYear: number,
  model: string, apiKey: string
): Promise<{ answer: string; products: unknown[] }> {

  const systemPrompt = [
    `You are ProductRating.in, India's most trusted AI product advisor. Today: ${monthYear}.`,
    lang || null,
    loc ? `User location: ${loc}. Personalise for local climate and service availability.` : null,
    ``,
    `SCORING (rank candidates out of 100, pick best 3):`,
    `  RELEVANCE  40pts — matches query specs/budget/use case?`,
    `  RECENCY    30pts — ${currentYear} launch=30 | ${currentYear-1}=22 | ${currentYear-2}=12 | older=0`,
    `  REVIEWS    20pts — 50k+=20 | 20k-50k=15 | 5k-20k=10 | <5k=5`,
    `  RATING     10pts — 4.5+=10 | 4.2-4.4=7 | 4.0-4.1=5 | <4.0=0`,
    ``,
    `EVERGREEN: older product OK only if still sold NEW + 25k+ reviews + specs still competitive.`,
    ``,
    `PR SCORE = platform rating minus fake review removal (0.2-0.5 lower). Be honest about this.`,
    ``,
    `India service reliability: Samsung > Xiaomi/Redmi > Realme > iQOO > CMF/Nothing`,
    `Top brands ${currentYear}: iQOO Z/Neo series, CMF Phone 2 Pro, Moto G96/Edge 50, Realme P4/GT7, Redmi 14/15 5G, Samsung A55/A56, POCO X7, Vivo T5.`,
    ``,
    `RESPOND WITH VALID JSON ONLY — this is enforced. Use exactly this shape:`,
    `{`,
    `  "answer": "2-3 sentences of specific buying advice for India mentioning key tradeoff",`,
    `  "products": [`,
    `    {"name":"Full Name","price":"₹XX,XXX","seller":"Amazon","rating":4.2,"platform_rating":4.6,"reviews":"18k","badge":"Best Pick","reason":"Why this wins for this query","pros":["Specific pro 1","Specific pro 2"],"cons":["Main real complaint"],"avoid_if":"Who should skip"},`,
    `    {"name":"Second","price":"₹XX,XXX","seller":"Flipkart","rating":4.0,"platform_rating":4.4,"reviews":"12k","badge":"Best Value","reason":"...","pros":["...","..."],"cons":["..."],"avoid_if":"..."},`,
    `    {"name":"Third","price":"₹XX,XXX","seller":"Amazon","rating":3.9,"platform_rating":4.3,"reviews":"9k","badge":"Budget Pick","reason":"...","pros":["...","..."],"cons":["..."],"avoid_if":"..."}`,
    `  ]`,
    `}`,
  ].filter(Boolean).join('\n')

  const userMsg = `Question: ${question}${loc ? `\nLocation: ${loc}` : ''}` +
    (serpContext ? `\n\nLive prices from Indian platforms (use for real availability and price):\n${serpContext}` : `\n\nUse your knowledge of Indian market as of ${monthYear}.`)

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
          response_format: { type: 'json_object' }, // Forces valid JSON — no text-only responses
        }),
      })
      if (res.status === 429) {
        console.log(`[OpenAI] 429 attempt ${attempt + 1}`)
        if (attempt < 2) await new Promise(r => setTimeout(r, 1000 * (attempt + 1)))
        continue
      }
      const raw = await res.text()
      console.log(`[OpenAI:${model}] status=${res.status} len=${raw.length}`)
      if (!res.ok) { console.error('[OpenAI] error body:', raw.slice(0, 400)); return { answer: '', products: [] } }

      const d = JSON.parse(raw)
      const content: string = d?.choices?.[0]?.message?.content || '{}'
      console.log(`[OpenAI] content preview: ${content.slice(0, 200)}`)

      const parsed = JSON.parse(content)
      const prods = Array.isArray(parsed.products) ? parsed.products : []
      console.log(`[OpenAI] products parsed: ${prods.length}`)
      return { answer: String(parsed.answer || ''), products: prods }
    } catch (e) {
      console.error(`[OpenAI] attempt ${attempt + 1}:`, String(e))
      if (attempt < 2) await new Promise(r => setTimeout(r, 1000))
    }
  }
  return { answer: '', products: [] }
}

// ── Sarvam: fallback text-based parsing ──
async function callSarvam(systemPrompt: string, userMsg: string, apiKey: string): Promise<{ answer: string; products: unknown[] }> {
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
      if (!res.ok) return { answer: '', products: [] }
      const d = JSON.parse(await res.text())
      let c: string = d?.choices?.[0]?.message?.content || ''
      let prev = ''
      while (prev !== c) { prev = c; c = c.replace(/<think>[\s\S]*?<\/think>/gi, '') }
      c = c.replace(/<\/?think[^>]*>/gi, '').trim()
      console.log(`[Sarvam] content preview: ${c.slice(0, 150)}`)

      const sepIdx = c.search(/---PRODUCTS---/i)
      const answer = (sepIdx !== -1 ? c.slice(0, sepIdx) : c.slice(0, 400)).replace(/\*\*(.*?)\*\*/g, '$1').trim()
      const jsonPart = sepIdx !== -1 ? c.slice(sepIdx + 15) : c
      const start = jsonPart.indexOf('[')
      if (start === -1) return { answer, products: [] }
      let depth = 0, end = -1
      for (let i = start; i < jsonPart.length; i++) {
        if (jsonPart[i] === '[') depth++
        else if (jsonPart[i] === ']') { depth--; if (depth === 0) { end = i; break } }
      }
      if (end === -1) return { answer, products: [] }
      try {
        const prods = JSON.parse(jsonPart.slice(start, end + 1))
        return { answer, products: Array.isArray(prods) ? prods : [] }
      } catch { return { answer, products: [] } }
    } catch (e) {
      console.error(`[Sarvam] attempt ${attempt + 1}:`, String(e))
      if (attempt < 3) await new Promise(r => setTimeout(r, 1000))
    }
  }
  return { answer: '', products: [] }
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
  const currentYear = getYear()
  const lang = detectLang(question)
  const loc = getLocation(city, state)
  const model = selectModel(question)

  // Google Shopping — live prices
  let serpResult: SerpSearchResult = { products: [], relatedSearches: [], query: question }
  try {
    serpResult = await searchGoogleShopping(question)
    console.log(`[SERP] ${serpResult.products.length} products`)
  } catch (e) { console.error('[SERP]:', String(e)) }
  const serpContext = buildProductContext(serpResult)

  // Call AI
  let answer = '', rawProducts: unknown[] = []

  if (openaiKey) {
    console.log(`[Search] OpenAI ${model} JSON mode`)
    const r = await callOpenAI(question, serpContext, loc, lang, monthYear, currentYear, model, openaiKey)
    answer = r.answer; rawProducts = r.products

    // Auto-upgrade to gpt-5.4 if 5.3 returned nothing
    if ((!answer || rawProducts.length === 0) && model !== 'gpt-5.4') {
      console.log('[Search] retrying with gpt-5.4')
      const r2 = await callOpenAI(question, serpContext, loc, lang, monthYear, currentYear, 'gpt-5.4', openaiKey)
      if (r2.answer || r2.products.length > 0) { answer = r2.answer; rawProducts = r2.products }
    }
  }

  if (!answer && rawProducts.length === 0 && sarvamKey) {
    console.log('[Search] Sarvam fallback')
    const sp = `You are ProductRating.in. Today: ${monthYear}.${lang ? ' ' + lang : ''}${loc ? ' Location: ' + loc + '.' : ''}
Recommend 3 products for Indian buyers. Prefer ${currentYear} launches. Older ok if 25k+ reviews and still sold.
Write 2 sentences of advice then ---PRODUCTS--- then JSON array of 3 products with: name,price,seller,rating,platform_rating,reviews,badge,reason,pros,cons,avoid_if`
    const um = `Question: ${question}${loc ? ' Location: ' + loc : ''}${serpContext ? '\n\nLive prices:\n' + serpContext : ''}`
    const r = await callSarvam(sp, um, sarvamKey)
    answer = r.answer; rawProducts = r.products
  }

  if (!answer && rawProducts.length === 0) {
    return { answer: 'AI is temporarily unavailable. Please try again.', aiProducts: [], serpProducts: serpResult.products, relatedSearches: serpResult.relatedSearches }
  }

  let aiProducts: AiProduct[] = (rawProducts as Record<string, unknown>[])
    .filter(p => p && typeof p.name === 'string' && p.name.length > 2)
    .slice(0, 3)
    .map(sanitise)

  // Fill from SERP if fewer than 3
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
        pros: ['Competitive price in India', 'Well-reviewed by buyers'],
        cons: ['Compare full specs before buying'],
        avoid_if: 'If you need detailed AI analysis — try again shortly',
      }))
    aiProducts = [...aiProducts, ...fill]
  }

  const result: SearchResult = {
    answer: answer || 'Here are the top options for India right now.',
    aiProducts: aiProducts.slice(0, 3),
    serpProducts: serpResult.products,
    relatedSearches: serpResult.relatedSearches,
  }
  cache.set(cacheKey, { result, ts: Date.now() })
  return result
}
