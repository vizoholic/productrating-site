// src/lib/search.ts
// ProductRating.in — Multi-Provider AI Engine
// Voice: Sarvam AI | Search: Google SERP | Intelligence: OpenAI gpt-4.1 / Claude claude-sonnet-4-6
// Routing: Best model per query type, automatic fallback chain

import { searchGoogleShopping, buildProductContext, type SerpSearchResult } from './serpapi'

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type PlatformPrice = {
  platform: string; price: string; price_numeric: number
  url: string; availability: string; is_lowest: boolean
}

export type NewerVersion = {
  name: string         // Full name of newer model
  reason: string       // Why it's better / what's new
  price_approx: string // Approx India price
}

export type AiProduct = {
  name: string; price: string; seller: string
  rating: number; platform_rating: number
  reviews: string; badge: string; reason: string
  pros: string[]; cons: string[]; avoid_if: string
  score?: number; successor_of?: string
  launch_date_india?: string  // e.g. "March 2024" or "Q1 2025"
  newer_version?: NewerVersion | null  // If a newer model in same series exists
  platform_prices?: PlatformPrice[]
  best_price?: string; best_price_platform?: string; best_price_url?: string
}

export type SearchResult = {
  answer: string
  aiProducts: AiProduct[]
  serpProducts: SerpSearchResult['products']
  relatedSearches: string[]
  isOutOfScope?: boolean
  provider_used?: string    // Which AI provider answered
  algorithm_version: string
}

const ALGORITHM_VERSION = 'PRv5.0-multiprovider'
const cache = new Map<string, { result: SearchResult; ts: number }>()
const CACHE_TTL = 20 * 60 * 1000

// ─────────────────────────────────────────────────────────────────────────────
// SCOPE GATE — Electronics only
// ─────────────────────────────────────────────────────────────────────────────

const ELECTRONICS_RE = [
  /\b(phone|mobile|smartphone|5g|foldable|iphone|android|oneplus|redmi|realme|samsung|poco|iqoo|vivo|oppo|nokia|motorola|moto)\b/i,
  /\b(laptop|notebook|ultrabook|gaming laptop|chromebook|macbook|thinkpad|ideapad|vivobook|inspiron|pavilion|victus|rog)\b/i,
  /\b(tablet|ipad|android tablet|e-reader|kindle|galaxy tab)\b/i,
  /\b(tv|television|smart tv|oled|qled|4k|8k|projector|monitor)\b/i,
  /\b(ac|air conditioner|inverter ac|split ac|window ac)\b/i,
  /\b(refrigerator|fridge|freezer)\b/i,
  /\b(washing machine|washer|front load|top load)\b/i,
  /\b(earbuds|earphone|headphone|tws|neckband|bluetooth speaker|soundbar|home theatre)\b/i,
  /\b(smartwatch|smart watch|fitness band|wearable)\b/i,
  /\b(camera|dslr|mirrorless|action cam|dashcam|webcam)\b/i,
  /\b(microwave|oven|air fryer|mixer grinder|induction|electric kettle|vacuum cleaner|air purifier|water purifier|geyser|dishwasher)\b/i,
  /\b(trimmer|shaver|hair dryer|epilator)\b/i,
  /\b(power bank|charger|ssd|hard disk|hdd|pendrive|memory card|router|wifi)\b/i,
  /\b(gaming|console|playstation|xbox|nintendo|gpu|cpu|processor|ram)\b/i,
  /\b(printer|ups|smart home|smart plug|smart bulb)\b/i,
  // Hindi/regional
  /मोबाइल|फ़ोन|फोन|स्मार्टफोन|लैपटॉप|टीवी|एसी|फ्रिज|वाशिंग मशीन|ईयरबड्स|हेडफोन|स्पीकर|स्मार्टवॉच|कैमरा/,
  /மொபைல்|ஃபோன்|லேப்டாப்|தொலைக்காட்சி|குளிரூட்டி/,
  /మొబైల్|ఫోన్|ల్యాప్టాప్|టీవీ|ఫ్రిజ్/,
  /মোবাইল|ফোন|ল্যাপটপ|টিভি|ফ্রিজ/,
  /ಮೊಬೈಲ್|ಫೋನ್|ಲ್ಯಾಪ್ಟಾಪ್|ಟಿವಿ/,
  /മൊബൈൽ|ഫോൺ|ലാപ്ടോപ്|ടിവി/,
]
const NON_ELECTRONICS_RE = [
  /\b(recipe|food|restaurant|hotel|travel|flight|visa|insurance|mutual fund|stock|loan|credit card)\b/i,
  /\b(fashion|clothing|dress|shirt|shoe|bag|jewellery|saree|kurta)\b/i,
  /\b(book|novel|textbook|comic|magazine)\b/i,
  /\b(medicine|doctor|hospital|diet|nutrition)\b/i,
  /\b(school|college|exam|career|job|salary)\b/i,
  /खाना|रेसिपी|कपड़े|साड़ी|होटल|किताब|दवाई|नौकरी/,
]

function isElectronics(q: string): boolean {
  // Fast-pass: price + Indian script = electronics intent
  if (/[₹]|\d+k\b|hazar|हज़ार|हजार|\d{4,}/.test(q) &&
      /[\u0900-\u097F\u0B80-\u0BFF\u0C00-\u0C7F\u0980-\u09FF\u0C80-\u0CFF\u0D00-\u0D7F]/.test(q)) return true
  if (/\b(best|kaun|kaunsa|chahiye|batao|recommend)\b/i.test(q) &&
      /\b(phone|mobile|laptop|tv|ac|fridge|earbuds|camera|watch)\b/i.test(q)) return true
  if (NON_ELECTRONICS_RE.some(p => p.test(q))) return false
  return ELECTRONICS_RE.some(p => p.test(q))
}

// ─────────────────────────────────────────────────────────────────────────────
// QUERY ROUTER — picks best provider + model
// ─────────────────────────────────────────────────────────────────────────────

type QueryType = 'simple' | 'compare' | 'complex'

type ProviderPlan = {
  type: QueryType
  primary: { provider: 'openai'|'claude'|'sarvam'; model: string }
  fallbacks: Array<{ provider: 'openai'|'claude'|'sarvam'; model: string }>
}

function routeQuery(question: string, keys: {
  openai?: string; claude?: string; sarvam?: string
}): ProviderPlan {
  const isCompare = /\bcompare\b|\bvs\b|versus|difference between|which is better|should i buy|worth it/i.test(question)
  const isComplex = /expert|detailed analysis|pros and cons of all|comprehensive|in-depth/i.test(question)
  const type: QueryType = (isCompare || isComplex) ? 'compare' : 'simple'

  // Build available providers in preference order
  const available = {
    openai_41:  keys.openai  ? { provider: 'openai'  as const, model: 'gpt-4.1'          } : null,
    openai_52:  keys.openai  ? { provider: 'openai'  as const, model: 'gpt-5.2'           } : null,
    claude:     keys.claude  ? { provider: 'claude'  as const, model: 'claude-sonnet-4-6' } : null,
    sarvam:     keys.sarvam  ? { provider: 'sarvam'  as const, model: 'sarvam-m'          } : null,
  }

  if (type === 'compare') {
    // Compare: Claude (best analysis) → OpenAI gpt-5.2 → gpt-4.1 → Sarvammini
    // Compare: Claude best for analysis, OpenAI gpt-5.2 next, gpt-4.1 fallback, Sarvam last
    const primary = available.claude || available.openai_52 || available.openai_41 || available.sarvam
    const fallbacks = [available.openai_52, available.openai_41, available.sarvam]
      .filter((p): p is NonNullable<typeof p> => p !== null && p !== primary)
    return { type, primary: primary!, fallbacks }
  } else {
    // Simple: gpt-4.1 ideal (non-reasoning, clean JSON, fast), then Claude, then gpt-5.2, then Sarvam
    const primary = available.openai_41 || available.claude || available.openai_52 || available.sarvam
    const fallbacks = [available.claude, available.openai_52, available.sarvam]
      .filter((p): p is NonNullable<typeof p> => p !== null && p !== primary)
    return { type, primary: primary!, fallbacks }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED PROMPT BUILDER
// ─────────────────────────────────────────────────────────────────────────────

function getMonthYear() { const d=new Date(); return `${d.toLocaleString('en-US',{month:'long'})} ${d.getFullYear()}` }
function getYear() { return new Date().getFullYear() }

function detectLang(q: string): string {
  if (/[\u0900-\u097F]/.test(q)) return 'Respond in Hindi. Technical terms in English.'
  if (/[\u0B80-\u0BFF]/.test(q)) return 'Respond in Tamil.'
  if (/[\u0C00-\u0C7F]/.test(q)) return 'Respond in Telugu.'
  if (/[\u0980-\u09FF]/.test(q)) return 'Respond in Bengali.'
  if (/[\u0C80-\u0CFF]/.test(q)) return 'Respond in Kannada.'
  if (/[\u0D00-\u0D7F]/.test(q)) return 'Respond in Malayalam.'
  if (/\b(kaunsa|kaun sa|mein|ke andar|chahiye|konsa|wala)\b/i.test(q)) return 'Respond in Hinglish.'
  return ''
}

function getLocation(city: string, state: string): string {
  const CITIES = new Set(['delhi','new delhi','mumbai','bombay','bangalore','bengaluru','chennai','kolkata','hyderabad','pune','ahmedabad','surat','jaipur','lucknow','noida','gurgaon','gurugram','coimbatore','kochi','indore','chandigarh','nagpur','bhopal','visakhapatnam','patna'])
  const c = city.toLowerCase().trim()
  if (c && CITIES.has(c)) return city
  if (c && c.length > 2) return city
  if (state && state.length > 2) return state
  return ''
}

function sanitise(p: Record<string,unknown>, i: number): AiProduct {
  const r = Math.min(4.8, Math.max(3.0, Number(p.rating)||4.0))
  return {
    name: String(p.name||'').trim(),
    price: String(p.price||'—'),
    seller: normaliseMarketplace(String(p.seller||'Amazon')),
    rating: r,
    platform_rating: Math.min(5.0, Math.max(r+0.15, Number(p.platform_rating)||r+0.3)),
    reviews: String(p.reviews||'').replace(/\s*\([^)]*\)/g,'').trim(),
    badge: String(p.badge||['Best Pick','Best Value','Budget Pick'][i]||'Top Rated'),
    reason: String(p.reason||''),
    pros: Array.isArray(p.pros)?p.pros.slice(0,2).map(String):[],
    cons: Array.isArray(p.cons)?p.cons.slice(0,1).map(String):[],
    avoid_if: String(p.avoid_if||''),
    score: Number(p.score||0),
    successor_of: p.successor_of ? String(p.successor_of) : undefined,
    launch_date_india: p.launch_date_india ? String(p.launch_date_india) : undefined,
    newer_version: p.newer_version && typeof p.newer_version === 'object'
      ? {
          name: String((p.newer_version as Record<string,unknown>).name || ''),
          reason: String((p.newer_version as Record<string,unknown>).reason || ''),
          price_approx: String((p.newer_version as Record<string,unknown>).price_approx || ''),
        }
      : null,
    platform_prices: [], best_price: '', best_price_platform: '', best_price_url: '',
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MARKETPLACES
// ─────────────────────────────────────────────────────────────────────────────

const MARKETPLACES: Record<string, string> = {
  'amazon':'Amazon','flipkart':'Flipkart','croma':'Croma',
  'reliance':'Reliance Digital','vijay':'Vijay Sales',
  'tata cliq':'Tata Cliq','tatacliq':'Tata Cliq',
  'meesho':'Meesho','jiomart':'JioMart','jio mart':'JioMart',
}
function isMarketplace(src: string): boolean {
  const s = src.toLowerCase()
  return Object.keys(MARKETPLACES).some(k => s.includes(k))
}
function normaliseMarketplace(src: string): string {
  const s = src.toLowerCase()
  for (const [k,v] of Object.entries(MARKETPLACES)) if (s.includes(k)) return v
  return 'Amazon'
}
function buildSearchUrl(marketplace: string, productName: string): string {
  const q = encodeURIComponent(productName)
  const m = marketplace.toLowerCase()
  if (m.includes('amazon'))   return `https://www.amazon.in/s?k=${q}`
  if (m.includes('flipkart')) return `https://www.flipkart.com/search?q=${q}`
  if (m.includes('croma'))    return `https://www.croma.com/searchB?q=${q}`
  if (m.includes('reliance')) return `https://www.reliancedigital.in/search?q=${q}`
  if (m.includes('vijay'))    return `https://www.vijaysales.com/search/${q}`
  if (m.includes('tata'))     return `https://www.tatacliq.com/search/?text=${q}`
  return `https://www.amazon.in/s?k=${q}`
}

// ─────────────────────────────────────────────────────────────────────────────
// PRICE ENRICHMENT — Skyscanner style
// ─────────────────────────────────────────────────────────────────────────────

function enrichPrices(aiProducts: AiProduct[], serpProducts: SerpSearchResult['products']): AiProduct[] {
  return aiProducts.map(ai => {
    const nameWords = ai.name.toLowerCase().split(/\s+/).filter(w=>w.length>2).slice(0,6)
    const matched = serpProducts.filter(sp => {
      if (!sp.title || !sp.price || !isMarketplace(sp.source)) return false
      const t = sp.title.toLowerCase()
      return nameWords.filter(w => t.includes(w)).length >= Math.min(3, Math.max(2, nameWords.length-2))
    })
    const byPlatform = new Map<string, {price_str:string;price_num:number;url:string}>()
    for (const sp of matched) {
      const key = normaliseMarketplace(sp.source)
      const priceNum = parseInt(sp.price.replace(/[^\d]/g,'')) || 0
      const existing = byPlatform.get(key)
      if (!existing || priceNum < existing.price_num) {
        byPlatform.set(key, { price_str:sp.price, price_num:priceNum, url:(sp.link && isMarketplace(sp.source))?sp.link:buildSearchUrl(key,ai.name) })
      }
    }
    for (const m of ['Amazon','Flipkart']) {
      if (!byPlatform.has(m)) byPlatform.set(m, { price_str:'—', price_num:999999, url:buildSearchUrl(m,ai.name) })
    }
    const entries = Array.from(byPlatform.entries())
      .sort((a,b) => { if(a[1].price_num===999999)return 1; if(b[1].price_num===999999)return -1; return a[1].price_num-b[1].price_num })
      .slice(0,5)
    const platform_prices: PlatformPrice[] = entries.map(([platform,data],idx) => ({
      platform, price:data.price_str, price_numeric:data.price_num,
      url:data.url, availability:data.price_num===999999?'unknown':'in_stock', is_lowest:idx===0&&data.price_num!==999999
    }))
    const best = platform_prices.find(p=>p.is_lowest) || platform_prices[0]
    return {
      ...ai, platform_prices,
      best_price: best?.price_numeric!==999999 ? best?.price||ai.price : ai.price,
      best_price_platform: best?.platform||ai.seller,
      best_price_url: best?.url||buildSearchUrl('amazon',ai.name),
      price: best?.price_numeric!==999999 ? best?.price||ai.price : ai.price,
      seller: best?.platform||ai.seller,
    }
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED SYSTEM PROMPT
// ─────────────────────────────────────────────────────────────────────────────

function buildSystemPrompt(lang: string, loc: string, monthYear: string, currentYear: number): string {
  const locationNote = loc ? `User location: ${loc}.` : ''
  return `You are ProductRating.in, India's most trusted electronics advisor. ${monthYear}.
${lang ? lang + '\n' : ''}${locationNote ? locationNote + '\n' : ''}
Return ONLY valid JSON matching this exact structure — no text before or after:
{
  "answer": "<2 sentences of direct buying advice. No reasoning. No 'Okay' or 'Let me'. Start with the recommendation.>",
  "products": [
    {"name":"<full name with variant>","price":"<₹XX,XXX>","seller":"<Amazon|Flipkart|Croma>","rating":<3.5-4.8>,"platform_rating":<3.8-5.0>,"reviews":"<Xk>","badge":"Best Pick","score":<50-95>,"reason":"<one sentence why #1>","pros":["<pro1>","<pro2>"],"cons":["<con1>"],"avoid_if":"<who should skip>","successor_of":null,"launch_date_india":"<e.g. Jan 2025 or Q3 2024>","newer_version":{"name":"<newer model name if exists, else null>","reason":"<what is new/better>","price_approx":"<₹XX,XXX>"}},
    {"name":"...","price":"...","seller":"...","rating":0.0,"platform_rating":0.0,"reviews":"...","badge":"Best Value","score":0,"reason":"...","pros":["...","..."],"cons":["..."],"avoid_if":"...","successor_of":null,"launch_date_india":"...","newer_version":null},
    {"name":"...","price":"...","seller":"...","rating":0.0,"platform_rating":0.0,"reviews":"...","badge":"Budget Pick","score":0,"reason":"...","pros":["...","..."],"cons":["..."],"avoid_if":"...","successor_of":null,"launch_date_india":"...","newer_version":null}
  ]
}

SELECTION CRITERIA (apply internally, never describe in output):
• Relevance: Exact match to query budget/category
• Recency: ${currentYear} > ${currentYear-1} > ${currentYear-2}. Replace outdated models with ${currentYear}/${currentYear-1} successors
• Reviews: Amazon.in + Flipkart combined. Deduct 30% for budget brands (boat/Noise/Zebronics)
• PR Score = platform rating minus fake inflation (subtract 0.1-0.5). PR Score always < platform_rating
• Value: Specs per rupee vs India average
• Service: Brands with India service centres${loc ? ' near ' + loc : ''}

India ${monthYear}: iQOO Z9x, CMF Phone 2 Pro, Moto G96, Realme P4, Redmi 15 5G, Samsung A36, POCO X7
Successor rule: Note 12/13→14/15 | M33/M34→M35 | Narzo 60→80 | iQOO Z7→Z9 | Nord CE 3→CE 4
• launch_date_india: Month+Year of India launch (e.g. "January 2025", "Q3 2024"). Be accurate.
• newer_version: If a newer model in the SAME series launched after this product, populate it. If this IS the newest, set to null.
  Example: iQOO Z9x launched Jan 2025 → newer_version null (it IS newest). Redmi Note 13 → newer_version: {name:"Redmi Note 14 Pro 5G", reason:"Upgraded Snapdragon 7s Gen 3, better 50MP camera", price_approx:"₹22,999"}`
}

// ─────────────────────────────────────────────────────────────────────────────
// PROVIDER CALLERS
// ─────────────────────────────────────────────────────────────────────────────

async function callOpenAI(
  systemPrompt: string, userMsg: string, model: string, apiKey: string
): Promise<{ answer: string; products: unknown[] }> {
  for (let attempt = 0; attempt <= 1; attempt++) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':`Bearer ${apiKey}`},
        body: JSON.stringify({
          model, max_tokens:4000, temperature:0.25,
          response_format:{ type:'json_object' },
          messages:[{role:'system',content:systemPrompt},{role:'user',content:userMsg}],
        }),
      })
      if (res.status===429) { await new Promise(r=>setTimeout(r,2000)); continue }
      const raw = await res.text()
      console.log(`[OpenAI:${model}] status=${res.status} len=${raw.length}`)
      if (!res.ok) {
        console.error(`[OpenAI:${model}] HTTP ${res.status}: ${raw.slice(0,200)}`)
        return { answer:'', products:[] }
      }
      const d = JSON.parse(raw)
      const content: string = d?.choices?.[0]?.message?.content||'{}'
      const parsed = JSON.parse(content)
      console.log(`[OpenAI:${model}] answer="${String(parsed.answer||'').slice(0,60)}" products=${Array.isArray(parsed.products)?parsed.products.length:0}`)
      return { answer: String(parsed.answer||''), products: Array.isArray(parsed.products)?parsed.products:[] }
    } catch(e) { console.error(`[OpenAI:${model}] attempt ${attempt+1}:`,String(e)) }
  }
  return { answer:'', products:[] }
}

async function callClaude(
  systemPrompt: string, userMsg: string, model: string, apiKey: string
): Promise<{ answer: string; products: unknown[] }> {
  for (let attempt = 0; attempt <= 1; attempt++) {
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST',
        headers:{
          'Content-Type':'application/json',
          'x-api-key':apiKey,
          'anthropic-version':'2023-06-01',
        },
        body: JSON.stringify({
          model, max_tokens:4000,
          system: systemPrompt + '\n\nCRITICAL: Return ONLY the JSON object. No text before or after.',
          messages:[{role:'user',content:userMsg}],
        }),
      })
      if (res.status===429) { await new Promise(r=>setTimeout(r,2000)); continue }
      const raw = await res.text()
      console.log(`[Claude:${model}] status=${res.status} len=${raw.length}`)
      if (!res.ok) {
        console.error(`[Claude:${model}] HTTP ${res.status}: ${raw.slice(0,200)}`)
        return { answer:'', products:[] }
      }
      const d = JSON.parse(raw)
      const content: string = d?.content?.[0]?.text||''
      // Claude may wrap JSON in markdown — strip it
      const jsonStr = content.replace(/^```(?:json)?\s*/,'').replace(/\s*```$/,'').trim()
      const start = jsonStr.indexOf('{'); const end = jsonStr.lastIndexOf('}')
      if (start<0||end<0) { console.error('[Claude] no JSON found'); return { answer:'', products:[] } }
      const parsed = JSON.parse(jsonStr.slice(start, end+1))
      console.log(`[Claude:${model}] answer="${String(parsed.answer||'').slice(0,60)}" products=${Array.isArray(parsed.products)?parsed.products.length:0}`)
      return { answer: String(parsed.answer||''), products: Array.isArray(parsed.products)?parsed.products:[] }
    } catch(e) { console.error(`[Claude:${model}] attempt ${attempt+1}:`,String(e)) }
  }
  return { answer:'', products:[] }
}


async function callSarvamChat(
  systemPrompt: string, userMsg: string, apiKey: string
): Promise<{ answer: string; products: unknown[] }> {
  try {
    const res = await fetch('https://api.sarvam.ai/v1/chat/completions', {
      method:'POST',
      headers:{'Content-Type':'application/json','api-subscription-key':apiKey},
      body: JSON.stringify({ model:'sarvam-m', max_tokens:2000, temperature:0.25,
        messages:[{role:'system',content:systemPrompt},{role:'user',content:userMsg}] }),
    })
    if (!res.ok) return { answer:'', products:[] }
    const d = JSON.parse(await res.text())
    let c: string = d?.choices?.[0]?.message?.content||''
    let prev=''
    while(prev!==c){prev=c;c=c.replace(/<think>[\s\S]*?<\/think>/gi,'')}
    c = c.replace(/<\/?think[^>]*>/gi,'').trim()
    const start=c.indexOf('{'); const end=c.lastIndexOf('}')
    if (start<0||end<0) return { answer:'', products:[] }
    const parsed = JSON.parse(c.slice(start,end+1))
    return { answer: String(parsed.answer||''), products: Array.isArray(parsed.products)?parsed.products:[] }
  } catch(e) { console.error('[Sarvam chat]',String(e)); return { answer:'', products:[] } }
}

// ─────────────────────────────────────────────────────────────────────────────
// UNIFIED PROVIDER DISPATCHER
// ─────────────────────────────────────────────────────────────────────────────

type ProviderKeys = { openai?:string; claude?:string; sarvam?:string }

async function callProvider(
  provider: 'openai'|'claude'|'sarvam',
  model: string,
  systemPrompt: string,
  userMsg: string,
  keys: ProviderKeys
): Promise<{ answer: string; products: unknown[] }> {
  if (provider==='openai'  && keys.openai)  return callOpenAI(systemPrompt, userMsg, model, keys.openai)
  if (provider==='claude'  && keys.claude)  return callClaude(systemPrompt, userMsg, model, keys.claude)
  if (provider==='sarvam'  && keys.sarvam)  return callSarvamChat(systemPrompt, userMsg, keys.sarvam)
  return { answer:'', products:[] }
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN ENTRY POINT
// ─────────────────────────────────────────────────────────────────────────────

export async function runSearch(
  question: string, city='', state='',
  sarvamKey: string,
  openaiKey?: string,
  claudeKey?: string,
): Promise<SearchResult> {

  if (!isElectronics(question)) {
    return { answer:'', aiProducts:[], serpProducts:[], relatedSearches:[], isOutOfScope:true, algorithm_version:ALGORITHM_VERSION }
  }

  const cacheKey = `${question.toLowerCase().trim()}|${city}|${state}`
  const hit = cache.get(cacheKey)
  if (hit && Date.now()-hit.ts<CACHE_TTL) { console.log('[Search] cache hit'); return hit.result }

  const monthYear = getMonthYear()
  const currentYear = getYear()
  const lang = detectLang(question)
  const loc = getLocation(city, state)

  const keys: ProviderKeys = { openai:openaiKey, claude:claudeKey, sarvam:sarvamKey }
  const plan = routeQuery(question, keys)

  console.log(`[Search] type=${plan.type} primary=${plan.primary?.provider}:${plan.primary?.model} loc="${loc||'India'}"`)
  console.log(`[Search] keys: openai=${!!openaiKey} claude=${!!claudeKey} sarvam=${!!sarvamKey}`)

  // SERP — live prices from Google Shopping
  let serpResult: SerpSearchResult = { products:[], relatedSearches:[], query:question }
  try { serpResult = await searchGoogleShopping(question); console.log(`[SERP] ${serpResult.products.length} results`) }
  catch(e) { console.error('[SERP]:', String(e)) }
  const serpContext = buildProductContext(serpResult)

  const systemPrompt = buildSystemPrompt(lang, loc, monthYear, currentYear)
  const userMsg = `Question: ${question}${loc?`\nLocation: ${loc}`:''}` +
    (serpContext ? `\n\nLive prices from Indian platforms (use for real availability):\n${serpContext}` : '')

  // Try primary provider
  let answer='', rawProducts: unknown[]=[], providerUsed=''

  if (!plan.primary) {
    console.error('[Search] No AI provider configured!')
    return { answer:'No AI provider configured. Please add API keys in settings.', aiProducts:[], serpProducts:serpResult.products, relatedSearches:serpResult.relatedSearches, algorithm_version:ALGORITHM_VERSION }
  }

  console.log(`[Search] Trying ${plan.primary.provider}:${plan.primary.model}`)
  const r = await callProvider(plan.primary.provider, plan.primary.model, systemPrompt, userMsg, keys)
  if (r.answer || r.products.length>0) {
    answer=r.answer; rawProducts=r.products
    providerUsed=`${plan.primary.provider}:${plan.primary.model}`
  }

  // Try fallbacks if primary failed
  for (const fb of plan.fallbacks) {
    if (answer && rawProducts.length>0) break
    console.log(`[Search] Fallback → ${fb.provider}:${fb.model}`)
    const r2 = await callProvider(fb.provider, fb.model, systemPrompt, userMsg, keys)
    if (r2.answer || r2.products.length>0) {
      answer=r2.answer; rawProducts=r2.products
      providerUsed=`${fb.provider}:${fb.model}`
    }
  }

  if (!answer && rawProducts.length===0) {
    return {
      answer:'AI temporarily unavailable. Please try again.',
      aiProducts:[], serpProducts:serpResult.products, relatedSearches:serpResult.relatedSearches,
      provider_used:'none', algorithm_version:ALGORITHM_VERSION
    }
  }

  // Sanitise + enrich
  let aiProducts: AiProduct[] = (rawProducts as Record<string,unknown>[])
    .filter(p => p && typeof p.name==='string' && p.name.length>2)
    .slice(0,3).map(sanitise)

  // Fill from SERP if < 3
  if (aiProducts.length<3 && serpResult.products.length>0) {
    const used = new Set(aiProducts.map(p=>p.name.toLowerCase()))
    const fill = serpResult.products
      .filter(sp=>sp.title&&sp.price&&isMarketplace(sp.source)&&!used.has(sp.title.toLowerCase()))
      .slice(0, 3-aiProducts.length)
      .map((sp,i): AiProduct => ({
        name:sp.title, price:sp.price||'—', seller:normaliseMarketplace(sp.source),
        rating:sp.rating?Math.min(4.8,Math.max(3.0,Number(sp.rating))):4.0,
        platform_rating:sp.rating?Math.min(5.0,Number(sp.rating)+0.3):4.3,
        reviews:'', badge:(['Best Pick','Best Value','Budget Pick'][aiProducts.length+i])||'Top Rated',
        reason:`Top result on ${normaliseMarketplace(sp.source)}.`,
        pros:['Competitive price','Available on major platform'],
        cons:['Compare specs before buying'],
        avoid_if:'If you need detailed AI analysis — try again shortly',
        score:0, platform_prices:[], best_price:'', best_price_platform:'', best_price_url:'',
      }))
    aiProducts=[...aiProducts,...fill]
  }

  aiProducts = enrichPrices(aiProducts, serpResult.products)

  const result: SearchResult = {
    answer: answer||'Here are the top electronics options for India right now.',
    aiProducts: aiProducts.slice(0,3),
    serpProducts: serpResult.products,
    relatedSearches: serpResult.relatedSearches,
    provider_used: providerUsed,
    algorithm_version: ALGORITHM_VERSION,
  }
  cache.set(cacheKey, { result, ts:Date.now() })
  console.log(`[Search] Done — provider=${providerUsed} products=${aiProducts.length}`)
  return result
}
