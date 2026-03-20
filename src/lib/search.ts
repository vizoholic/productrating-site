// src/lib/search.ts — shared search logic (used by API route + SSR pages)

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

const TIER1 = new Set(['delhi','new delhi','mumbai','bombay','bangalore','bengaluru','chennai','kolkata','calcutta','hyderabad','secunderabad','pune','ahmedabad','surat'])
const TIER2 = new Set(['jaipur','lucknow','kanpur','nagpur','visakhapatnam','vizag','bhopal','patna','vadodara','baroda','ghaziabad','ludhiana','agra','nashik','faridabad','meerut','rajkot','varanasi','srinagar','aurangabad','amritsar','ranchi','coimbatore','jabalpur','gwalior','vijayawada','jodhpur','madurai','raipur','kota','chandigarh','guwahati','solapur','bhubaneswar','tiruchirappalli','trichy','dehradun','kochi','cochin','kozhikode','thiruvananthapuram','indore','noida','gurgaon','gurugram','thane','navi mumbai'])

function getLocationContext(city: string, state: string): { level: 'city'|'state'|'general'; label: string } {
  const c = city.toLowerCase().trim()
  const s = state.toLowerCase().trim()
  if (c && (TIER1.has(c) || TIER2.has(c))) return { level: 'city', label: city }
  if (c && c.length > 2) return { level: 'state', label: state || city }
  if (s && s.length > 2) return { level: 'state', label: state }
  return { level: 'general', label: '' }
}

function detectLang(question: string): string {
  const langMap: [RegExp, string][] = [
    [/[\u0900-\u097F]/, 'Respond ENTIRELY in Hindi (Devanagari). Product names/prices in English is fine.'],
    [/[\u0B80-\u0BFF]/, 'Respond ENTIRELY in Tamil.'],
    [/[\u0C00-\u0C7F]/, 'Respond ENTIRELY in Telugu.'],
    [/[\u0980-\u09FF]/, 'Respond ENTIRELY in Bengali.'],
    [/[\u0C80-\u0CFF]/, 'Respond ENTIRELY in Kannada.'],
    [/[\u0D00-\u0D7F]/, 'Respond ENTIRELY in Malayalam.'],
    [/[\u0A80-\u0AFF]/, 'Respond ENTIRELY in Gujarati.'],
    [/[\u0A00-\u0A7F]/, 'Respond ENTIRELY in Punjabi (Gurmukhi).'],
  ]
  for (const [re, inst] of langMap) if (re.test(question)) return `IMPORTANT: ${inst}`
  if (/\b(kaunsa|kaun sa|mein|ke andar|kya hai|sahi|chahiye|konsa|wala|bahut)\b/i.test(question))
    return 'IMPORTANT: Respond in natural Hinglish — mix Hindi and English as Indians speak.'
  return ''
}

export async function runSearch(
  question: string,
  city = '', state = '',
  apiKey: string
): Promise<SearchResult> {
  const lang = detectLang(question)
  const loc = getLocationContext(city, state)

  let locationPrompt = ''
  if (loc.level === 'city') {
    locationPrompt = `USER CITY: ${loc.label} (Tier 1/2 Indian city)\nPersonalise ALL recommendations for ${loc.label}. Factor in its climate, infrastructure, and buying preferences naturally. Mention location ONLY in the opening summary — not in individual product fields.`
  } else if (loc.level === 'state') {
    locationPrompt = `USER STATE/REGION: ${loc.label}\nPersonalise recommendations for ${loc.label} as a region. Mention location ONLY in the opening summary.`
  } else {
    locationPrompt = `No location provided. Give general India-wide recommendations.`
  }

  const searchQuery = loc.label ? `${question} ${loc.label}` : question
  const serpResult = await searchGoogleShopping(searchQuery).catch(() => ({ products: [], relatedSearches: [], query: question }))
  const serpContext = buildProductContext(serpResult)

  const systemPrompt = `You are ProductRating.in's AI advisor — powered by Sarvam AI (India's own LLM).
${lang}
${locationPrompt}

CRITICAL JSON RULES:
- Return EXACTLY 3 products. No more, no less.
- "rating": AI-adjusted score OUT OF 5. Between 1.0–5.0 ONLY.
- "platform_rating": Raw platform score BEFORE fake review removal. Between 1.0–5.0. Slightly higher than rating.
- "pros": Array of exactly 2 short strings
- "cons": Array of exactly 1 short string
- "avoid_if": One short string — who should NOT buy this

INSTRUCTIONS:
1. Write 2-3 sentences of advice in plain text. Mention location ONCE if available. No markdown.
2. New line: ---PRODUCTS---
3. JSON array of EXACTLY 3 products:
[{"name":"Full Product Name","price":"₹XX,XXX","seller":"Amazon","rating":4.2,"platform_rating":4.6,"reviews":"2.3k","badge":"Best Pick","reason":"One punchy sentence why this wins","pros":["Advantage 1","Advantage 2"],"cons":["Main drawback"],"avoid_if":"Who should not buy this"}]
4. NEVER use <think> tags or **markdown**.`

  const res = await fetch('https://api.sarvam.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-subscription-key': apiKey },
    body: JSON.stringify({
      model: 'sarvam-m',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Question: ${question}\n${loc.label ? `Location: ${loc.label}\n` : ''}\n${serpContext || 'Use your Indian market knowledge.'}` }
      ],
      max_tokens: 1600, temperature: 0.4,
    }),
  })

  const raw = await res.text()
  if (!res.ok) return { answer: `⚠️ AI error (${res.status}).`, aiProducts: [], serpProducts: [], relatedSearches: [] }

  let data: { choices?: Array<{ message?: { content?: string } }> } = {}
  try { data = JSON.parse(raw) } catch {}

  const content = data.choices?.[0]?.message?.content || ''
  const clean = content.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1').trim()
  const parts = clean.split(/---PRODUCTS---/i)
  const answer = parts[0].trim() || 'Here are the top 3 options.'

  let aiProducts: AiProduct[] = []
  if (parts[1]) {
    try {
      const m = parts[1].match(/\[[\s\S]*\]/)
      if (m) {
        aiProducts = JSON.parse(m[0]).slice(0, 3).map((p: Record<string, unknown>) => ({
          ...p,
          rating: Math.min(5.0, Math.max(1.0, Number(p.rating) || 4.0)),
          platform_rating: Math.min(5.0, Math.max(1.0, Number(p.platform_rating) || Math.min(5.0, (Number(p.rating) || 4.0) + 0.3))),
          pros: Array.isArray(p.pros) ? p.pros.slice(0, 2) : [],
          cons: Array.isArray(p.cons) ? p.cons.slice(0, 1) : [],
          avoid_if: String(p.avoid_if || ''),
        }))
      }
    } catch {}
  }

  return { answer, aiProducts, serpProducts: serpResult.products, relatedSearches: serpResult.relatedSearches }
}
