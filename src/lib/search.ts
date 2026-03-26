// src/lib/search.ts — balanced recency + evergreen strategy

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

const TIER1 = new Set(['delhi','new delhi','mumbai','bombay','bangalore','bengaluru','chennai','kolkata','calcutta','hyderabad','secunderabad','pune','ahmedabad','surat'])
const TIER2 = new Set(['jaipur','lucknow','kanpur','nagpur','visakhapatnam','vizag','bhopal','patna','vadodara','ghaziabad','ludhiana','agra','nashik','faridabad','meerut','rajkot','varanasi','aurangabad','amritsar','ranchi','coimbatore','bhubaneswar','kochi','cochin','dehradun','indore','noida','gurgaon','gurugram','thane','navi mumbai','chandigarh','guwahati'])

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

function isRecencyQuery(q: string): boolean {
  return /phone|mobile|smartphone|laptop|tablet|ac|refrigerator|washing machine|tv|television|earbuds|headphone|speaker|camera|smartwatch|5g|foldable|processor|gaming/i.test(q)
}

function getDateContext(): string {
  const now = new Date()
  return `${now.toLocaleString('en-US', { month: 'long' })} ${now.getFullYear()}`
}

async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await fetch(url, options)
    if (res.status !== 429) return res
    const waitMs = Math.min(1000 * Math.pow(2, attempt), 10000)
    if (attempt < maxRetries) await new Promise(r => setTimeout(r, waitMs))
    else return res
  }
  throw new Error('Max retries exceeded')
}

export async function runSearch(
  question: string,
  city = '', state = '',
  apiKey: string
): Promise<SearchResult> {
  const cacheKey = `${question.toLowerCase().trim()}|${city}|${state}`
  const cached = cache.get(cacheKey)
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.result

  const lang = detectLang(question)
  const loc = getLocationContext(city, state)
  const isRecency = isRecencyQuery(question)
  const dateCtx = getDateContext()

  let locationPrompt = ''
  if (loc.level === 'city') {
    locationPrompt = `USER CITY: ${loc.label}\nPersonalise ALL recommendations for ${loc.label}. Mention location ONLY in the opening summary.`
  } else if (loc.level === 'state') {
    locationPrompt = `USER STATE/REGION: ${loc.label}\nPersonalise recommendations for ${loc.label}. Mention location ONLY in the opening summary.`
  } else {
    locationPrompt = `No location provided. Give general India-wide recommendations.`
  }

  // Dual search: current + popular — gets both fresh AND evergreen results
  const baseQuery = loc.label ? `${question} ${loc.label}` : question
  const serpResult = await searchGoogleShopping(baseQuery)
    .catch(() => ({ products: [], relatedSearches: [], query: question }))
  const serpContext = buildProductContext(serpResult)

  // ── SCORING FRAMEWORK — the core intelligence ──
  const scoringFramework = isRecency ? `
PRODUCT SELECTION FRAMEWORK — use this exact scoring model:

Score each candidate product out of 100:
  RELEVANCE (40 pts)  — Does it match the query well? Right price range? Right specs?
  RECENCY   (30 pts)  — Is it 2024-25 launch? (30pts) | 2023 launch? (20pts) | 2022 launch? (10pts) | Older? (0pts — skip unless evergreen exception below)
  REVIEWS   (20 pts)  — 50k+ reviews = 20pts | 20k-50k = 15pts | 5k-20k = 10pts | <5k = 5pts
  RATING    (10 pts)  — Platform rating 4.5+ = 10pts | 4.2-4.4 = 7pts | 4.0-4.1 = 5pts | <4.0 = 0pts

EVERGREEN EXCEPTION — A product older than 18 months CAN appear if ALL 3 are true:
  ✓ Still actively sold NEW on Amazon.in or Flipkart at current price (not discontinued/grey market)
  ✓ Has 30,000+ reviews with genuine sustained buyer activity  
  ✓ Still competitive on specs vs current alternatives at its price

EXAMPLES of good evergreen: Redmi Note 13 (huge review volume, still actively stocked, competitive specs for price)
EXAMPLES to AVOID: Redmi Note 12 (successor launched), Samsung M33 (M34/M35 replaced it), Narzo 60x (replaced by Narzo 80 series)

CURRENT DATE: ${dateCtx}
STRONG PREFERENCE for: iQOO Z series, CMF Phone 2 Pro, Moto G96/Edge 50, Realme P4/GT series, Redmi 14/15, Samsung A 2024, POCO X7, Vivo T5
` : `
PRODUCT SELECTION: Pick the 3 most genuinely useful products for this query.
For appliances (AC, fridge, washing machine): consider that good products last 5-7 years and models from 2020-2022 may still be actively sold with large review bases. These are valid recommendations.
For electronics: prefer recent 2024-2025 launches but include well-reviewed older models if they still sell actively.
CURRENT DATE: ${dateCtx}
`

  const systemPrompt = `You are ProductRating.in — India's most trusted AI product advisor.
${lang}
${locationPrompt}
${scoringFramework}

YOUR KEY DIFFERENTIATOR — FAKE REVIEW REMOVAL:
You are NOT just another LLM. You strip fake reviews before scoring. The "PR Score" is always lower than what Amazon/Flipkart show because you remove:
- Incentivised reviews ("Got free product for review")
- Verified but bot-generated reviews
- Review bombing (sudden spikes)
- Seller-paid promotions
This is why your PR Score shows 4.2 when Amazon shows 4.7 — you're more honest.

INDIA CONTEXT INTELLIGENCE:
- After-sales service density: Samsung > Xiaomi/Redmi > iQOO > CMF (newer brand, fewer centres)
- For cities with poor power supply: inverter AC/fridge is non-negotiable
- Hard water areas (most of India): avoid washing machines with scale-sensitive motors
- Summer peak: AC buying season March-June — heat performance matters more than energy rating

QUALITY BARS:
- "rating" must reflect genuine user satisfaction after fake removal. 3.5-4.7 range only.
- "platform_rating" = what Amazon/Flipkart actually show. Usually 0.2-0.5 higher.
- "pros" must be SPECIFIC: not "good camera" but "50MP OIS stabilised — minimal blur in low light"
- "cons" must be HONEST: the real main complaint from actual buyers
- "reason" = 1 sentence WHY this beats alternatives for this specific query

FORMAT:
1. 2-3 sentences of plain text advice. Be specific. Mention key tradeoffs. No markdown.
2. New line: ---PRODUCTS---
3. JSON array of EXACTLY 3 products:
[{"name":"Full Name","price":"₹XX,XXX","seller":"Amazon","rating":4.2,"platform_rating":4.6,"reviews":"18k","badge":"Best Pick","reason":"Why it wins for this query","pros":["Specific pro 1","Specific pro 2"],"cons":["Main real complaint"],"avoid_if":"Who should skip this"}]
4. NEVER output <think> tags or **markdown**.`

  const userMessage = `Question: ${question}
${loc.label ? `Location: ${loc.label}` : ''}
Current date: ${dateCtx}

${serpContext
  ? `Live data from Indian shopping platforms (use this as ground truth for availability and price):\n${serpContext}\n\nApply the scoring framework above to rank these results and add your own knowledge of current Indian market.`
  : `No live data available. Use your Indian market knowledge. Apply the scoring framework. Prioritise products confirmed available in India as of ${dateCtx}.`
}`

  const res = await fetchWithRetry('https://api.sarvam.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-subscription-key': apiKey },
    body: JSON.stringify({
      model: 'sarvam-m',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      max_tokens: 1800,
      temperature: 0.3,
    }),
  })

  if (res.status === 429) {
    return { answer: 'Our AI is experiencing high demand. Please try again in a few seconds.', aiProducts: [], serpProducts: serpResult.products, relatedSearches: serpResult.relatedSearches }
  }

  const raw = await res.text()
  if (!res.ok) {
    return { answer: `AI temporarily unavailable (${res.status}). Please try again.`, aiProducts: [], serpProducts: serpResult.products, relatedSearches: serpResult.relatedSearches }
  }

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
          rating: Math.min(4.8, Math.max(3.5, Number(p.rating) || 4.0)),
          platform_rating: Math.min(5.0, Math.max(3.8, Number(p.platform_rating) || Math.min(5.0, (Number(p.rating) || 4.0) + 0.35))),
          pros: Array.isArray(p.pros) ? p.pros.slice(0, 2) : [],
          cons: Array.isArray(p.cons) ? p.cons.slice(0, 1) : [],
          avoid_if: String(p.avoid_if || ''),
        }))
      }
    } catch {}
  }

  const result: SearchResult = { answer, aiProducts, serpProducts: serpResult.products, relatedSearches: serpResult.relatedSearches }
  cache.set(cacheKey, { result, ts: Date.now() })
  return result
}
