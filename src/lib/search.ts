// src/lib/search.ts

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
  if (/\b(kaunsa|kaun sa|mein|ke andar|chahiye|konsa|wala)\b/i.test(q)) return 'Respond in Hinglish.'
  return ''
}

function getLocation(city: string, state: string): string {
  const CITIES = new Set(['delhi','new delhi','mumbai','bombay','bangalore','bengaluru','chennai','kolkata','hyderabad','pune','ahmedabad','surat','jaipur','lucknow','noida','gurgaon','gurugram','coimbatore','kochi','indore','chandigarh'])
  const c = city.toLowerCase().trim()
  if (c && CITIES.has(c)) return city
  if (c && c.length > 2) return city
  if (state && state.length > 2) return state
  return ''
}

// Strip <think> blocks AND reasoning preamble that Sarvam outputs without tags
function cleanResponse(text: string): string {
  // Remove <think>...</think> blocks
  let result = text
  let prev = ''
  while (prev !== result) {
    prev = result
    result = result.replace(/<think>[\s\S]*?<\/think>/gi, '')
  }
  result = result.replace(/<\/?think[^>]*>/gi, '').trim()

  // Strip reasoning preamble — Sarvam sometimes outputs raw chain-of-thought
  // before the actual answer without any tags
  const preamblePatterns = [
    /^(Okay|Alright|Sure|Right|Let me|I need to|I'll|I will|I should|I have to|Let's|Let us|First,|The user)[^]*?(?=(For |The best|Based on|Here are|I recommend|Top |Best |In India|Looking at|---PRODUCTS---|[\[{]))/i,
  ]
  for (const pattern of preamblePatterns) {
    result = result.replace(pattern, '').trim()
  }

  return result
}

// Extract valid JSON array from text using bracket matching
function extractJsonArray(text: string): unknown[] {
  const start = text.indexOf('[')
  if (start === -1) return []
  let depth = 0, end = -1
  for (let i = start; i < text.length; i++) {
    if (text[i] === '[') depth++
    else if (text[i] === ']') {
      depth--
      if (depth === 0) { end = i; break }
    }
  }
  if (end === -1) return []
  const jsonStr = text.slice(start, end + 1)
  try { return JSON.parse(jsonStr) } catch {
    // Try fixing common issues
    try {
      const fixed = jsonStr.replace(/,(\s*[}\]])/g, '$1')
      return JSON.parse(fixed)
    } catch { return [] }
  }
}

function sanitise(p: Record<string, unknown>, i: number): AiProduct {
  const r = Math.min(4.8, Math.max(3.5, Number(p.rating) || 4.0))
  return {
    name:            String(p.name || '').trim(),
    price:           String(p.price || '—'),
    seller:          String(p.seller || 'Amazon'),
    rating:          r,
    platform_rating: Math.min(5.0, Math.max(r + 0.2, Number(p.platform_rating) || r + 0.35)),
    reviews:         String(p.reviews || ''),
    badge:           String(p.badge || ['Best Pick','Best Value','Budget Pick'][i] || 'Top Rated'),
    reason:          String(p.reason || ''),
    pros:            Array.isArray(p.pros)  ? p.pros.slice(0, 2).map(String) : [],
    cons:            Array.isArray(p.cons)  ? p.cons.slice(0, 1).map(String) : [],
    avoid_if:        String(p.avoid_if || ''),
  }
}

async function callSarvam(systemPrompt: string, userMsg: string, apiKey: string): Promise<string> {
  for (let attempt = 0; attempt <= 3; attempt++) {
    try {
      const res = await fetch('https://api.sarvam.ai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'api-subscription-key': apiKey },
        body: JSON.stringify({
          model: 'sarvam-m',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMsg },
          ],
          max_tokens: 2000,
          temperature: 0.25,
        }),
      })

      if (res.status === 429) {
        console.log(`[Sarvam] 429 attempt ${attempt + 1}`)
        if (attempt < 3) await new Promise(r => setTimeout(r, Math.min(1000 * Math.pow(2, attempt), 8000)))
        continue
      }

      const raw = await res.text()
      console.log(`[Sarvam] status=${res.status} len=${raw.length}`)
      if (!res.ok) { console.error('[Sarvam] error:', raw.slice(0, 300)); return '' }

      const d = JSON.parse(raw)
      const content = d?.choices?.[0]?.message?.content || ''
      console.log(`[Sarvam] preview: ${content.slice(0, 150)}`)
      return content
    } catch (e) {
      console.error(`[Sarvam] attempt ${attempt + 1} threw:`, String(e))
      if (attempt < 3) await new Promise(r => setTimeout(r, 1000))
    }
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
  const loc = getLocation(city, state)

  // SERP — run in parallel, don't let failures block AI
  let serpResult: SerpSearchResult = { products: [], relatedSearches: [], query: question }
  try {
    serpResult = await searchGoogleShopping(question)
    console.log(`[SERP] ${serpResult.products.length} products`)
  } catch (e) {
    console.error('[SERP] failed:', String(e))
  }
  const serpContext = buildProductContext(serpResult)

  // Clean, simple prompt with exact format example
  const systemPrompt = `You are ProductRating.in, India's AI product advisor. Today: ${monthYear}.
${lang ? lang + '\n' : ''}${loc ? `User location: ${loc}\n` : ''}
Recommend exactly 3 products for Indian buyers. Prefer 2024-2025 launches. Older products ok if actively sold with large review count.

RESPOND IN EXACTLY THIS FORMAT:

2-3 sentences of specific buying advice for India.
---PRODUCTS---
[{"name":"iQOO Z9x 5G","price":"₹12,999","seller":"Amazon","rating":4.3,"platform_rating":4.7,"reviews":"22k","badge":"Best Pick","reason":"Best processor at this price with reliable iQOO service centres","pros":["Snapdragon 6 Gen 1 — top gaming performance","5000mAh — all-day battery"],"cons":["Camera average in low light"],"avoid_if":"If camera quality is your top priority"},{"name":"Realme P4 5G","price":"₹15,999","seller":"Flipkart","rating":4.1,"platform_rating":4.5,"reviews":"15k","badge":"Best Value","reason":"Best display and battery combo at mid-range","pros":["120Hz AMOLED — smooth and vivid","45W charging — full in 1 hour"],"cons":["Bloatware on UI"],"avoid_if":"If you hate pre-installed apps"},{"name":"CMF Phone 2 Pro","price":"₹17,999","seller":"Amazon","rating":4.2,"platform_rating":4.4,"reviews":"8k","badge":"Premium Pick","reason":"Nothing's modular design with clean software","pros":["Clean Nothing OS — no bloatware","Unique design stands out"],"cons":["Fewer service centres than Xiaomi/Samsung"],"avoid_if":"If you live outside a major city and need local service"}]

Use real current Indian products for the actual query. Never output thinking/reasoning text.`

  const userMsg = `Find the best: ${question}${loc ? `\nLocation: ${loc}` : ''}${serpContext ? `\n\nLive prices:\n${serpContext}` : ''}`

  console.log(`[Search] query: "${question}"`)
  const rawContent = await callSarvam(systemPrompt, userMsg, apiKey)

  if (!rawContent) {
    return {
      answer: 'AI is temporarily unavailable. Please try again.',
      aiProducts: [],
      serpProducts: serpResult.products,
      relatedSearches: serpResult.relatedSearches,
    }
  }

  const content = cleanResponse(rawContent)
  console.log(`[Search] cleaned len=${content.length}, preview: ${content.slice(0, 100)}`)

  // Extract answer (before ---PRODUCTS---)
  const sepIdx = content.search(/---PRODUCTS---/i)
  const answerRaw = sepIdx !== -1 ? content.slice(0, sepIdx) : content.slice(0, 400)
  const answer = answerRaw.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1').trim()
    || 'Here are the top options for India right now.'

  // Extract JSON
  const jsonSection = sepIdx !== -1 ? content.slice(sepIdx + 15) : content
  let rawArr = extractJsonArray(jsonSection)
  if (rawArr.length === 0) rawArr = extractJsonArray(content) // fallback: search full content

  console.log(`[Search] parsed ${rawArr.length} products from AI`)

  let aiProducts: AiProduct[] = (rawArr as Record<string, unknown>[])
    .filter(p => p && typeof p.name === 'string' && p.name.length > 2)
    .slice(0, 3)
    .map(sanitise)

  // Fill gaps from SERP
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
        pros: ['Available at competitive price in India', 'Well-reviewed by buyers'],
        cons: ['Compare full specs before buying'],
        avoid_if: 'If you need AI-detailed analysis — try again shortly',
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
