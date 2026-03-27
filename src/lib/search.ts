// src/lib/search.ts

import { searchGoogleShopping, buildProductContext } from './serpapi'

export type AiProduct = {
  name: string; price: string; seller: string
  rating: number; platform_rating: number
  reviews: string; badge: string; reason: string
  pros: string[]; cons: string[]; avoid_if: string
}

export type SearchResult = {
  answer: string
  aiProducts: AiProduct[]
  serpProducts: Array<{title:string;price:string;rating:number|null;source:string;link:string;thumbnail:string;delivery:string}>
  relatedSearches: string[]
}

const cache = new Map<string, { result: SearchResult; ts: number }>()
const CACHE_TTL = 30 * 60 * 1000

function getMonthYear() {
  const d = new Date()
  return `${d.toLocaleString('en-US',{month:'long'})} ${d.getFullYear()}`
}

function detectLang(q: string): string {
  if (/[\u0900-\u097F]/.test(q)) return 'Respond in Hindi. Product names in English ok.'
  if (/[\u0B80-\u0BFF]/.test(q)) return 'Respond in Tamil.'
  if (/[\u0C00-\u0C7F]/.test(q)) return 'Respond in Telugu.'
  if (/[\u0980-\u09FF]/.test(q)) return 'Respond in Bengali.'
  if (/\b(kaunsa|kaun sa|mein|ke andar|chahiye|konsa|wala)\b/i.test(q)) return 'Respond in Hinglish.'
  return ''
}

function getLocation(city: string, state: string) {
  const CITIES = new Set(['delhi','new delhi','mumbai','bombay','bangalore','bengaluru','chennai','kolkata','hyderabad','pune','ahmedabad','surat','jaipur','lucknow','noida','gurgaon','gurugram','coimbatore','kochi'])
  const c = city.toLowerCase().trim()
  if (c && CITIES.has(c)) return city
  if (c && c.length > 2) return city
  if (state && state.length > 2) return state
  return ''
}

// Strip <think> blocks — loop until all gone
function stripThink(text: string): string {
  let prev = ''
  while (prev !== text) {
    prev = text
    text = text.replace(/<think>[\s\S]*?<\/think>/gi, '')
  }
  return text.replace(/<\/?think[^>]*>/gi, '').trim()
}

// Walk brackets to extract valid JSON array
function extractJsonArray(text: string): unknown[] {
  const start = text.indexOf('[')
  if (start === -1) return []
  let depth = 0, end = -1
  for (let i = start; i < text.length; i++) {
    if (text[i] === '[') depth++
    else if (text[i] === ']') { depth--; if (depth === 0) { end = i; break } }
  }
  if (end === -1) return []
  try { return JSON.parse(text.slice(start, end + 1)) } catch { return [] }
}

function sanitise(p: Record<string, unknown>, i: number): AiProduct {
  const rating = Math.min(4.8, Math.max(3.5, Number(p.rating) || 4.0))
  return {
    name:            String(p.name || '').trim(),
    price:           String(p.price || '—'),
    seller:          String(p.seller || 'Amazon'),
    rating,
    platform_rating: Math.min(5.0, Math.max(rating + 0.2, Number(p.platform_rating) || rating + 0.35)),
    reviews:         String(p.reviews || ''),
    badge:           String(p.badge || ['Best Pick','Runner Up','Third Pick'][i] || 'Top Rated'),
    reason:          String(p.reason || ''),
    pros:            Array.isArray(p.pros)  ? p.pros.slice(0,2).map(String)  : [],
    cons:            Array.isArray(p.cons)  ? p.cons.slice(0,1).map(String)  : [],
    avoid_if:        String(p.avoid_if || ''),
  }
}

async function callSarvam(prompt: string, userMsg: string, apiKey: string): Promise<string> {
  for (let attempt = 0; attempt <= 3; attempt++) {
    const res = await fetch('https://api.sarvam.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-subscription-key': apiKey },
      body: JSON.stringify({
        model: 'sarvam-m',
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: userMsg },
        ],
        max_tokens: 2000,
        temperature: 0.3,
      }),
    })
    if (res.status === 429) {
      console.log(`[Sarvam] 429 attempt ${attempt+1}, waiting...`)
      if (attempt < 3) await new Promise(r => setTimeout(r, Math.min(1000 * Math.pow(2, attempt), 8000)))
      continue
    }
    const raw = await res.text()
    console.log(`[Sarvam] status=${res.status} length=${raw.length}`)
    if (!res.ok) { console.error('[Sarvam] Error:', raw.slice(0,200)); return '' }
    try {
      const d = JSON.parse(raw)
      return d?.choices?.[0]?.message?.content || ''
    } catch { return '' }
  }
  return ''
}

export async function runSearch(
  question: string,
  city = '', state = '',
  apiKey: string
): Promise<SearchResult> {
  const cacheKey = `${question.toLowerCase().trim()}|${city}|${state}`
  const hit = cache.get(cacheKey)
  if (hit && Date.now() - hit.ts < CACHE_TTL) { console.log('[Search] cache hit'); return hit.result }

  const monthYear = getMonthYear()
  const lang = detectLang(question)
  const loc  = getLocation(city, state)

  // SERP — don't let 429 block everything
  let serpResult = { products: [] as SearchResult['serpProducts'], relatedSearches: [] as string[], query: question }
  try {
    serpResult = await searchGoogleShopping(question)
    console.log(`[SERP] ok: ${serpResult.products.length} products`)
  } catch (e) {
    console.error('[SERP] failed:', String(e))
  }
  const serpContext = buildProductContext(serpResult)

  // ── PROMPT — simple, explicit, proven format ──
  const systemPrompt = `You are ProductRating.in, India's AI product advisor. Today: ${monthYear}.
${lang ? lang + '\n' : ''}${loc ? `User location: ${loc}\n` : ''}
Recommend 3 products for Indian buyers. Prefer 2024-2025 launches. Older products ok if still actively sold with many reviews.

RESPOND IN EXACTLY THIS FORMAT — nothing else:

[2-3 sentences of buying advice for India]
---PRODUCTS---
[
  {"name":"Full Product Name","price":"₹XX,XXX","seller":"Amazon","rating":4.2,"platform_rating":4.6,"reviews":"18k","badge":"Best Pick","reason":"Why this wins","pros":["Pro 1","Pro 2"],"cons":["Main con"],"avoid_if":"Who to skip"},
  {"name":"Second Product","price":"₹XX,XXX","seller":"Flipkart","rating":4.0,"platform_rating":4.4,"reviews":"12k","badge":"Best Value","reason":"Why second","pros":["Pro 1","Pro 2"],"cons":["Main con"],"avoid_if":"Who to skip"},
  {"name":"Third Product","price":"₹XX,XXX","seller":"Amazon","rating":3.8,"platform_rating":4.2,"reviews":"8k","badge":"Budget Pick","reason":"Why third","pros":["Pro 1","Pro 2"],"cons":["Main con"],"avoid_if":"Who to skip"}
]`

  const userMsg = question + (loc ? `\nLocation: ${loc}` : '') +
    (serpContext ? `\n\nLive prices from Indian platforms:\n${serpContext}` : '\n\nUse your knowledge of Indian market.')

  console.log(`[Search] calling Sarvam for: ${question}`)
  const rawContent = await callSarvam(systemPrompt, userMsg, apiKey)
  console.log(`[Search] Sarvam raw length: ${rawContent.length}`)
  console.log(`[Search] Sarvam preview: ${rawContent.slice(0, 200)}`)

  const content = stripThink(rawContent)
  console.log(`[Search] after stripThink length: ${content.length}`)

  // Extract answer text
  const sepIdx = content.search(/---PRODUCTS---/i)
  const answer = (sepIdx !== -1 ? content.slice(0, sepIdx) : content.slice(0, 500))
    .replace(/\*\*(.*?)\*\*/g, '$1').trim()
    || 'Here are the top options for India right now.'

  // Extract JSON
  const jsonSection = sepIdx !== -1 ? content.slice(sepIdx + 15) : content
  let rawArr = extractJsonArray(jsonSection)

  // Fallback: search full content if nothing found in jsonSection
  if (rawArr.length === 0) {
    console.log('[Search] No JSON in section, trying full content')
    rawArr = extractJsonArray(content)
  }

  console.log(`[Search] parsed ${rawArr.length} products`)

  let aiProducts: AiProduct[] = (rawArr as Record<string, unknown>[])
    .filter(p => p && typeof p.name === 'string' && p.name.length > 2)
    .slice(0, 3)
    .map(sanitise)

  // Fill from SERP if AI returned fewer than 3
  if (aiProducts.length < 3 && serpResult.products.length > 0) {
    console.log(`[Search] filling ${3 - aiProducts.length} slots from SERP`)
    const used = new Set(aiProducts.map(p => p.name.toLowerCase()))
    const fill = serpResult.products
      .filter(sp => sp.title && sp.price && !used.has(sp.title.toLowerCase()))
      .slice(0, 3 - aiProducts.length)
      .map((sp, i): AiProduct => ({
        name: sp.title, price: sp.price || '—', seller: sp.source || 'Amazon',
        rating: sp.rating ? Math.min(4.8, Math.max(3.5, Number(sp.rating))) : 4.0,
        platform_rating: sp.rating ? Math.min(5.0, Number(sp.rating) + 0.3) : 4.3,
        reviews: '', badge: ['Best Pick','Best Value','Budget Pick'][aiProducts.length + i] || 'Top Rated',
        reason: `Top result on ${sp.source || 'Amazon'} for this query.`,
        pros: ['Available at competitive price', 'Well-reviewed by Indian buyers'],
        cons: ['Compare full specs before buying'],
        avoid_if: 'If you need AI-detailed analysis',
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
