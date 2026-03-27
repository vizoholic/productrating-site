// src/lib/search.ts
// ProductRating.in — Electronics Category Only
// Algorithm: Multi-factor scoring (Relevance + Recency + Review Volume + Cross-platform Rating + India Fit)

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
  isOutOfScope?: boolean
}

const cache = new Map<string, { result: SearchResult; ts: number }>()
const CACHE_TTL = 30 * 60 * 1000

// ── ELECTRONICS DETECTION ──
// Sub-categories we cover
const ELECTRONICS_PATTERNS = [
  // Phones & Wearables
  /\b(phone|mobile|smartphone|5g phone|foldable|flip phone|smartwatch|smart watch|wearable|earbuds|earphone|headphone|tws|neckband|bluetooth speaker|portable speaker)\b/i,
  // Computers
  /\b(laptop|notebook|ultrabook|gaming laptop|chromebook|tablet|ipad|android tablet|computer|desktop|pc build|monitor|keyboard|mouse|webcam|printer|router|wifi|modem)\b/i,
  // TV & Audio
  /\b(tv|television|smart tv|oled|qled|4k tv|soundbar|home theatre|home theater|projector)\b/i,
  // Home Appliances (electronics)
  /\b(ac|air conditioner|inverter ac|split ac|window ac|refrigerator|fridge|washing machine|front load|top load|microwave|oven|air fryer|vacuum cleaner|robot vacuum|air purifier|water purifier|ro purifier|geyser|water heater|dishwasher|mixer grinder|juicer|induction cooktop|electric kettle|toaster|iron|trimmer|shaver|hair dryer|epilator)\b/i,
  // Cameras & Accessories
  /\b(camera|dslr|mirrorless|action camera|gopro|dashcam|security camera|cctv|power bank|charger|cable|adapter|memory card|ssd|hard disk|hdd|pendrive|usb hub)\b/i,
  // Gaming
  /\b(gaming|console|playstation|xbox|nintendo|controller|gamepad|gpu|graphics card|cpu|processor|ram|motherboard)\b/i,
]

const NON_ELECTRONICS_HINTS = [
  /\b(recipe|food|restaurant|hotel|travel|flight|visa|insurance|mutual fund|stock|loan|credit card|fashion|cloth|dress|shoe|bag|jewellery|jewelry|book|novel|fiction|medicine|doctor|hospital|school|college|career|job|salary)\b/i,
]

function isElectronicsQuery(q: string): boolean {
  if (NON_ELECTRONICS_HINTS.some(p => p.test(q))) return false
  return ELECTRONICS_PATTERNS.some(p => p.test(q))
}

// ── ELECTRONICS SUB-CATEGORY ──
type ElectronicsCategory =
  | 'smartphone' | 'laptop' | 'tv' | 'ac' | 'refrigerator'
  | 'washing_machine' | 'audio' | 'wearable' | 'tablet'
  | 'camera' | 'appliance' | 'accessory' | 'generic_electronics'

function detectSubCategory(q: string): ElectronicsCategory {
  if (/\b(phone|mobile|smartphone|5g phone|foldable)\b/i.test(q)) return 'smartphone'
  if (/\b(laptop|notebook|ultrabook|chromebook|gaming laptop)\b/i.test(q)) return 'laptop'
  if (/\b(tv|television|smart tv|oled|qled|4k)\b/i.test(q)) return 'tv'
  if (/\b(ac|air conditioner|inverter ac|split ac|window ac)\b/i.test(q)) return 'ac'
  if (/\b(refrigerator|fridge)\b/i.test(q)) return 'refrigerator'
  if (/\b(washing machine|front load|top load|washer)\b/i.test(q)) return 'washing_machine'
  if (/\b(earbuds|earphone|headphone|tws|speaker|soundbar|home theatre|neckband)\b/i.test(q)) return 'audio'
  if (/\b(smartwatch|wearable|fitness band|smart band)\b/i.test(q)) return 'wearable'
  if (/\b(tablet|ipad|android tablet)\b/i.test(q)) return 'tablet'
  if (/\b(camera|dslr|mirrorless|action cam)\b/i.test(q)) return 'camera'
  if (/\b(microwave|air fryer|mixer|grinder|kettle|iron|geyser|purifier|vacuum)\b/i.test(q)) return 'appliance'
  if (/\b(charger|cable|power bank|ssd|hard disk|memory card|adapter|hub)\b/i.test(q)) return 'accessory'
  return 'generic_electronics'
}

// ── CATEGORY-SPECIFIC SCORING CONTEXT ──
function getCategoryIntelligence(cat: ElectronicsCategory, currentYear: number): string {
  const yr = currentYear
  const map: Record<ElectronicsCategory, string> = {
    smartphone: `
SMARTPHONE SCORING INTELLIGENCE (India ${yr}):
- Processor tiers: Snapdragon 8 Gen 3/4 > Dimensity 9300/9400 > SD 7s Gen 3 > SD 6 Gen 3 > Dimensity 7300 > Helio G99
- Minimum bar for ${yr}: 5G, 8GB RAM, 50MP main camera, 5000mAh, 33W+ charging
- India-loved features: Clean UI (Nothing OS, near-stock > MIUI/Realme UI bloatware), good service centres
- Fake review risk: HIGH — many brands buy reviews on Flipkart/Amazon launch week
- Strong India service networks: Samsung > Xiaomi > Motorola > Vivo > OPPO/Realme
- Brands to watch ${yr}: iQOO (best value processor), CMF by Nothing (clean OS), Moto G/Edge, Redmi 14/15, Samsung A55/A56, POCO X7`,

    laptop: `
LAPTOP SCORING INTELLIGENCE (India ${yr}):
- Processor tiers: Intel Core Ultra 7/9 > Ryzen 7 8000 series > Core Ultra 5 > Ryzen 5 8000 > older gen
- Minimum bar ${yr}: 16GB RAM (8GB now inadequate), 512GB SSD, Full HD IPS/OLED, backlit keyboard
- India priorities: service centre density, battery life (power cuts), keyboard quality for typing-heavy work
- Gaming laptops: GPU tier matters — RTX 4060 > RTX 4050 > Arc A770M
- Reliable India service: Dell > Lenovo > HP > Asus > Acer
- Strong value ${yr}: Lenovo IdeaPad 5, HP Victus (gaming), Asus VivoBook 16X, Dell Inspiron 15`,

    tv: `
TV SCORING INTELLIGENCE (India ${yr}):
- Panel tiers: OLED > QLED/Mini-LED > QLED > VA > IPS
- Minimum bar ${yr}: 4K, HDR10+/Dolby Vision, HDMI 2.1 for gaming, low input lag (<20ms)
- India priorities: good remote, Hindi/regional language UI, YouTube/Netflix pre-installed, warranty
- Power consumption important — India has voltage fluctuations, avoid cheap panels
- Reliable brands: Sony > Samsung > LG > TCL (value) > Xiaomi (budget)
- Fake review risk: MEDIUM — mostly genuine but check specifications carefully`,

    ac: `
AC SCORING INTELLIGENCE (India ${yr}):
- Inverter compressor is NON-NEGOTIABLE for India (power cuts, variable load, energy saving)
- Star ratings: 5-star > 4-star (5-star saves ~30% electricity over 3-star)
- Capacity: 1 ton (up to 120 sqft) | 1.5 ton (120-180 sqft) | 2 ton (180-240 sqft)
- India-critical features: PM 2.5 filter (Delhi/NCR), auto-restart (power cuts), hot+cold in northern India
- Compressor warranty is key: Voltas/Daikin/LG give 10yr, some brands only 5yr
- Service network: Voltas (pan-India best) > LG > Daikin > Samsung > Hitachi > Blue Star
- Humidity handling: Daikin/Hitachi better for coastal (Chennai, Mumbai, Kochi)`,

    refrigerator: `
REFRIGERATOR SCORING INTELLIGENCE (India ${yr}):
- Types: Double door frost-free > Single door direct cool (budget) > Side-by-side (premium)
- Inverter compressor mandatory for India — handles voltage fluctuations, saves electricity
- Capacity guide: 150-250L (1-2 people) | 250-350L (3-4 people) | 350L+ (5+ people)
- India-specific: separate vegetable crisper for Indian vegetables, large door storage for 1L bottles
- Hard water areas: check water dispenser quality
- Reliable brands: LG > Samsung > Whirlpool > Haier > Godrej`,

    washing_machine: `
WASHING MACHINE SCORING INTELLIGENCE (India ${yr}):
- Front load vs Top load: Front load (better wash, more water efficient) > Top load (easier to use, faster)
- CRITICAL India issue: Hard water compatibility — check if it handles TDS 300-500 PPM
- Tub material: Stainless steel drum only — never plastic for Indian conditions
- Capacity: 6kg (1-2 people) | 7-8kg (3-4 people) | 9-10kg (4-5 people)
- Service network matters enormously: LG/Samsung have best pan-India service for washing machines
- Fake review risk: HIGH on Amazon — many Chinese/unknown brands inflate ratings`,

    audio: `
AUDIO SCORING INTELLIGENCE (India ${yr}):
- TWS tiers: Sony/Bose (premium) > Samsung/Apple (eco) > Nothing/OnePlus (value) > boat/Noise (budget)
- Key specs: ANC quality (Sony WF-1000XM5 benchmark) > battery life > codec (LDAC > aptX > AAC > SBC)
- India-specific: call quality for noisy environments (auto-rickshaw, traffic), sweat resistance for monsoon
- Fake review risk: VERY HIGH for budget Indian brands (boat, Noise, Boult) — discount heavy reviews
- Reliable brands: Sony > Sennheiser > JBL > Samsung > Nothing > Apple
- Value picks: Nothing Ear 2, CMF Buds Pro 2, OnePlus Buds 3`,

    wearable: `
WEARABLE SCORING INTELLIGENCE (India ${yr}):
- Key metrics: GPS accuracy, heart rate accuracy (vs medical device), SpO2 reliability, battery life
- India use cases: cricket tracking, yoga mode, heat stress monitoring (summer)
- Fake review risk: HIGH for budget smartwatches — many show fake health metrics
- Reliable brands: Garmin (best accuracy) > Apple Watch > Samsung > Fitbit > Amazfit > Noise/boat (budget)
- Value tier: CMF Watch Pro 2, Amazfit Bip 5, Samsung Galaxy Watch FE`,

    tablet: `
TABLET SCORING INTELLIGENCE (India ${yr}):
- Use cases: content consumption | student work | creative (drawing) | productivity
- India priorities: good display for video streaming, long battery for travel, stylus support (students)
- Reliable brands: Samsung > Lenovo > Apple > Xiaomi
- Value: Samsung Galaxy Tab A9+ > Lenovo Tab P12 > Xiaomi Pad 6`,

    camera: `
CAMERA SCORING INTELLIGENCE (India ${yr}):
- Sensor size: Full Frame > APS-C > Micro 4/3 > 1-inch > phone sensor
- India use cases: weddings (low light critical), travel, content creation, wildlife (reach matters)
- Service centres: Sony > Canon > Nikon in India
- Value mirrorless ${yr}: Sony ZV-E10 II, Fujifilm X-S20, Canon EOS R50`,

    appliance: `
APPLIANCE SCORING INTELLIGENCE (India ${yr}):
- Energy rating: BEE 5-star is mandatory consideration (high electricity cost in India)
- Voltage protection: surge-protected models important for tier-2/3 cities with fluctuation
- Service centre availability crucial — prioritise brands with local service
- Reliable: LG > Samsung > Prestige > Bajaj (Indian brands have good service)`,

    accessory: `
ACCESSORY SCORING INTELLIGENCE (India ${yr}):
- BIS certification mandatory for chargers/cables sold in India — avoid non-BIS
- GaN chargers: more efficient, less heat — important for India summers
- For SSDs: read AND write speed matter, not just read
- Fake review risk: VERY HIGH for accessories — most cheap accessories have paid reviews`,

    generic_electronics: `
ELECTRONICS SCORING INTELLIGENCE (India ${yr}):
- Prioritise brands with strong India service networks
- Check BIS/ISI certification for safety-critical products
- India voltage: 230V 50Hz — ensure compatibility
- Monsoon/humidity resistance matters more than in Western markets`,
  }
  return map[cat] || map.generic_electronics
}

function getMonthYear() {
  const d = new Date()
  return `${d.toLocaleString('en-US', { month: 'long' })} ${d.getFullYear()}`
}
function getYear() { return new Date().getFullYear() }

function detectLang(q: string): string {
  if (/[\u0900-\u097F]/.test(q)) return 'Respond in Hindi. Technical terms and product names in English.'
  if (/[\u0B80-\u0BFF]/.test(q)) return 'Respond in Tamil.'
  if (/[\u0C00-\u0C7F]/.test(q)) return 'Respond in Telugu.'
  if (/[\u0980-\u09FF]/.test(q)) return 'Respond in Bengali.'
  if (/[\u0C80-\u0CFF]/.test(q)) return 'Respond in Kannada.'
  if (/[\u0D00-\u0D7F]/.test(q)) return 'Respond in Malayalam.'
  if (/\b(kaunsa|kaun sa|mein|ke andar|chahiye|konsa|wala|kya hai)\b/i.test(q)) return 'Respond in Hinglish.'
  return ''
}

function getLocation(city: string, state: string): string {
  const CITIES = new Set(['delhi','new delhi','mumbai','bombay','bangalore','bengaluru','chennai','kolkata','hyderabad','pune','ahmedabad','surat','jaipur','lucknow','noida','gurgaon','gurugram','coimbatore','kochi','indore','chandigarh','nagpur','bhopal','visakhapatnam','vizag','patna','ranchi','bhubaneswar','dehradun','agra','varanasi','amritsar','ludhiana','nashik','aurangabad','thane','navi mumbai'])
  const c = city.toLowerCase().trim()
  if (c && CITIES.has(c)) return city
  if (c && c.length > 2) return city
  if (state && state.length > 2) return state
  return ''
}

function selectModel(q: string): string {
  return /compare|versus|\bvs\b|difference|which is better|should i buy|worth it|recommend/i.test(q)
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

// ── OPENAI: JSON mode — guaranteed structured output ──
async function callOpenAI(
  question: string, serpContext: string, loc: string, lang: string,
  monthYear: string, currentYear: number, subCat: ElectronicsCategory,
  model: string, apiKey: string
): Promise<{ answer: string; products: unknown[] }> {

  const catIntel = getCategoryIntelligence(subCat, currentYear)

  const systemPrompt = [
    `You are ProductRating.in, India's most trusted electronics advisor. Today: ${monthYear}.`,
    lang || null,
    loc ? `User location: ${loc}. Factor in their region's specific needs (climate, voltage, service availability).` : null,
    ``,
    `FOCUS: Electronics products for Indian buyers ONLY.`,
    ``,
    `═══════════════════════════════════════════════════`,
    `PRODUCTRATING SCORING ALGORITHM — score each candidate /100`,
    `═══════════════════════════════════════════════════`,
    ``,
    `[A] RELEVANCE SCORE (35 pts)`,
    `  +35 — Exactly matches query (right category, right budget, right use case)`,
    `  +20 — Close match (right category, slightly outside budget or minor spec mismatch)`,
    `  +10 — Partial match (related category, different spec tier)`,
    `  +0  — Wrong category or far outside query intent`,
    ``,
    `[B] RECENCY SCORE (25 pts)`,
    `  +25 — Launched in ${currentYear} (current year)`,
    `  +20 — Launched in ${currentYear - 1}`,
    `  +12 — Launched in ${currentYear - 2}`,
    `  +5  — Launched in ${currentYear - 3}`,
    `  +0  — Older than ${currentYear - 3} years (SKIP unless Evergreen Exception applies)`,
    ``,
    `  ► EVERGREEN EXCEPTION: A product older than ${currentYear - 2} may score up to +15 recency IF:`,
    `    ✓ Still listed as NEW on Amazon.in or Flipkart (not just 3rd party sellers)`,
    `    ✓ 30,000+ cumulative reviews across Amazon + Flipkart + other Indian platforms`,
    `    ✓ Specs still genuinely competitive vs current alternatives at that price`,
    `    Example OK: Redmi Note 13 (massive reviews, active stock, competitive specs)`,
    `    Example SKIP: Samsung M33 (replaced by M34/M35), Realme Narzo 60x (replaced by 80 series)`,
    ``,
    `[C] INDIA REVIEW VOLUME SCORE (20 pts)`,
    `  This measures GENUINE Indian buyer confidence across ALL Indian platforms:`,
    `  Amazon.in + Flipkart + Croma + Reliance Digital + Vijay Sales combined:`,
    `  +20 — 50,000+ total reviews across platforms`,
    `  +16 — 25,000–50,000 reviews`,
    `  +12 — 10,000–25,000 reviews`,
    `  +7  — 3,000–10,000 reviews`,
    `  +3  — 500–3,000 reviews`,
    `  +0  — <500 reviews (insufficient data for India market)`,
    ``,
    `  ► FAKE REVIEW PENALTY: If a product has suspicious review patterns:`,
    `    (a) Spike of 10,000+ reviews in first 2 weeks of launch`,
    `    (b) >80% 5-star with no negative reviews (statistically impossible)`,
    `    (c) Reviews mostly from accounts with only 1-2 total reviews`,
    `    → Deduct 8 pts from review score and flag in PR Score`,
    ``,
    `[D] CROSS-PLATFORM RATING SCORE (20 pts)`,
    `  Use the AVERAGE rating across ALL Indian platforms, not just one:`,
    `  4.5+ average = 20 | 4.2–4.4 = 15 | 4.0–4.1 = 10 | 3.7–3.9 = 5 | <3.7 = 0`,
    ``,
    `  ► PR SCORE ADJUSTMENT (your unique differentiator):`,
    `    Raw platform average → subtract fake review inflation:`,
    `    - Well-established brand (Samsung/Sony/LG): subtract 0.1–0.2`,
    `    - Mid-tier brand (Redmi/Realme/Motorola): subtract 0.2–0.35`,
    `    - Budget/aggressive marketing brand (boat, Noise, iQOO launch deals): subtract 0.3–0.5`,
    `    Result = PR Score (always lower than what Amazon shows)`,
    ``,
    `  The "rating" field = PR Score (honest). The "platform_rating" = what Amazon/Flipkart shows.`,
    ``,
    `═══════════════════════════════════════════════════`,
    `TOTAL = A + B + C + D (max 100). Pick the 3 highest-scoring products.`,
    `═══════════════════════════════════════════════════`,
    ``,
    catIntel,
    ``,
    `INDIA-SPECIFIC MANDATORY CHECKS:`,
    `  • Service centre density: Samsung > Xiaomi > LG > Motorola > Realme > iQOO > CMF/Nothing`,
    `  • BIS/ISI certification for safety-critical electronics (chargers, appliances)`,
    `  • Warranty: 2yr minimum for phones/laptops, 5yr+ compressor warranty for AC/fridge`,
    `  • Voltage compatibility: 230V 50Hz India standard`,
    `  • Summer heat performance: phones/laptops that throttle in 40°C+ heat are penalised`,
    ``,
    `RESPOND WITH VALID JSON ONLY — no other text, no markdown, no preamble.`,
    `{`,
    `  "answer": "2-3 sentences of specific India buying advice — mention the key tradeoff and what matters most for this query",`,
    `  "products": [`,
    `    {"name":"Full Product Name with variant/storage","price":"₹XX,XXX","seller":"Amazon","rating":4.2,"platform_rating":4.6,"reviews":"22k","badge":"Best Pick","reason":"Exactly why this ranks #1 for this specific query","pros":["Specific factual pro 1","Specific factual pro 2"],"cons":["Main real buyer complaint from reviews"],"avoid_if":"Specific person who should not buy this"},`,
    `    {"name":"Second Product","price":"₹XX,XXX","seller":"Flipkart","rating":4.0,"platform_rating":4.4,"reviews":"15k","badge":"Best Value","reason":"Why #2","pros":["...","..."],"cons":["..."],"avoid_if":"..."},`,
    `    {"name":"Third Product","price":"₹XX,XXX","seller":"Amazon","rating":3.9,"platform_rating":4.3,"reviews":"9k","badge":"Budget Pick","reason":"Why #3","pros":["...","..."],"cons":["..."],"avoid_if":"..."}`,
    `  ]`,
    `}`,
  ].filter(Boolean).join('\n')

  const userMsg = `Question: ${question}` +
    (loc ? `\nLocation: ${loc}` : '') +
    (serpContext
      ? `\n\nLive data from Indian platforms (use as ground truth for current prices and availability):\n${serpContext}\n\nApply the scoring algorithm to rank these results plus any better alternatives from your knowledge.`
      : `\n\nUse your knowledge of the Indian electronics market as of ${monthYear}. Apply the full scoring algorithm.`)

  for (let attempt = 0; attempt <= 2; attempt++) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model,
          messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userMsg }],
          max_tokens: 2000,
          temperature: 0.3,
          response_format: { type: 'json_object' },
        }),
      })
      if (res.status === 429) {
        if (attempt < 2) await new Promise(r => setTimeout(r, 1000 * (attempt + 1)))
        continue
      }
      const raw = await res.text()
      console.log(`[OpenAI:${model}] status=${res.status} len=${raw.length}`)
      if (!res.ok) { console.error('[OpenAI] err:', raw.slice(0, 300)); return { answer: '', products: [] } }
      const d = JSON.parse(raw)
      const content: string = d?.choices?.[0]?.message?.content || '{}'
      console.log(`[OpenAI] preview: ${content.slice(0, 200)}`)
      const parsed = JSON.parse(content)
      const prods = Array.isArray(parsed.products) ? parsed.products : []
      console.log(`[OpenAI] products: ${prods.length}`)
      return { answer: String(parsed.answer || ''), products: prods }
    } catch (e) {
      console.error(`[OpenAI] attempt ${attempt + 1}:`, String(e))
      if (attempt < 2) await new Promise(r => setTimeout(r, 1000))
    }
  }
  return { answer: '', products: [] }
}

// ── SARVAM: fallback ──
async function callSarvam(q: string, serpContext: string, loc: string, lang: string, monthYear: string, apiKey: string): Promise<{ answer: string; products: unknown[] }> {
  const sp = `You are ProductRating.in — India electronics advisor. Today: ${monthYear}.${lang ? ' ' + lang : ''}${loc ? ' Location: ' + loc + '.' : ''}
Recommend exactly 3 electronics products for Indian buyers. Prefer recent launches. Apply: Relevance(35) + Recency(25) + Reviews(20) + Rating(20) scoring.
Write 2 sentences of advice then ---PRODUCTS--- then JSON array of 3 products with: name,price,seller,rating,platform_rating,reviews,badge,reason,pros(2),cons(1),avoid_if`
  const um = `Question: ${q}${loc ? ' Location: ' + loc : ''}${serpContext ? '\n\nLive prices:\n' + serpContext : ''}`
  for (let attempt = 0; attempt <= 3; attempt++) {
    try {
      const res = await fetch('https://api.sarvam.ai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'api-subscription-key': apiKey },
        body: JSON.stringify({ model: 'sarvam-m', messages: [{ role: 'system', content: sp }, { role: 'user', content: um }], max_tokens: 2000, temperature: 0.25 }),
      })
      if (res.status === 429) { if (attempt < 3) await new Promise(r => setTimeout(r, Math.min(1000 * Math.pow(2, attempt), 8000))); continue }
      if (!res.ok) return { answer: '', products: [] }
      const d = JSON.parse(await res.text())
      let c: string = d?.choices?.[0]?.message?.content || ''
      let prev = ''
      while (prev !== c) { prev = c; c = c.replace(/<think>[\s\S]*?<\/think>/gi, '') }
      c = c.replace(/<\/?think[^>]*>/gi, '').trim()
      const sepIdx = c.search(/---PRODUCTS---/i)
      const answer = (sepIdx !== -1 ? c.slice(0, sepIdx) : c.slice(0, 400)).replace(/\*\*(.*?)\*\*/g, '$1').trim()
      const jp = sepIdx !== -1 ? c.slice(sepIdx + 15) : c
      const st = jp.indexOf('['); if (st === -1) return { answer, products: [] }
      let depth = 0, end = -1
      for (let i = st; i < jp.length; i++) { if (jp[i] === '[') depth++; else if (jp[i] === ']') { depth--; if (depth === 0) { end = i; break } } }
      if (end === -1) return { answer, products: [] }
      try { return { answer, products: JSON.parse(jp.slice(st, end + 1)) } } catch { return { answer, products: [] } }
    } catch (e) { console.error(`[Sarvam] attempt ${attempt + 1}:`, String(e)); if (attempt < 3) await new Promise(r => setTimeout(r, 1000)) }
  }
  return { answer: '', products: [] }
}

export async function runSearch(
  question: string,
  city = '', state = '',
  sarvamKey: string,
  openaiKey?: string
): Promise<SearchResult> {
  // ── SCOPE GATE: Electronics only ──
  if (!isElectronicsQuery(question)) {
    return {
      answer: '',
      aiProducts: [],
      serpProducts: [],
      relatedSearches: [],
      isOutOfScope: true,
    }
  }

  const cacheKey = `${question.toLowerCase().trim()}|${city}|${state}`
  const hit = cache.get(cacheKey)
  if (hit && Date.now() - hit.ts < CACHE_TTL) { console.log('[Search] cache hit'); return hit.result }

  const monthYear = getMonthYear()
  const currentYear = getYear()
  const lang = detectLang(question)
  const loc = getLocation(city, state)
  const model = selectModel(question)
  const subCat = detectSubCategory(question)

  console.log(`[Search] subCat=${subCat} model=${model} loc=${loc || 'none'}`)

  let serpResult: SerpSearchResult = { products: [], relatedSearches: [], query: question }
  try {
    serpResult = await searchGoogleShopping(question)
    console.log(`[SERP] ${serpResult.products.length} products`)
  } catch (e) { console.error('[SERP]:', String(e)) }
  const serpContext = buildProductContext(serpResult)

  let answer = '', rawProducts: unknown[] = []

  if (openaiKey) {
    const r = await callOpenAI(question, serpContext, loc, lang, monthYear, currentYear, subCat, model, openaiKey)
    answer = r.answer; rawProducts = r.products
    if ((!answer || rawProducts.length === 0) && model !== 'gpt-5.4') {
      console.log('[Search] retrying with gpt-5.4')
      const r2 = await callOpenAI(question, serpContext, loc, lang, monthYear, currentYear, subCat, 'gpt-5.4', openaiKey)
      if (r2.answer || r2.products.length > 0) { answer = r2.answer; rawProducts = r2.products }
    }
  }

  if (!answer && rawProducts.length === 0 && sarvamKey) {
    const r = await callSarvam(question, serpContext, loc, lang, monthYear, sarvamKey)
    answer = r.answer; rawProducts = r.products
  }

  if (!answer && rawProducts.length === 0) {
    return { answer: 'AI is temporarily unavailable. Please try again.', aiProducts: [], serpProducts: serpResult.products, relatedSearches: serpResult.relatedSearches }
  }

  let aiProducts: AiProduct[] = (rawProducts as Record<string, unknown>[])
    .filter(p => p && typeof p.name === 'string' && p.name.length > 2)
    .slice(0, 3).map(sanitise)

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
        reason: `Top result on ${sp.source || 'Amazon'} for this electronics query.`,
        pros: ['Competitive price in India', 'Available on major Indian platform'],
        cons: ['Compare full specs before buying'],
        avoid_if: 'If you need detailed AI analysis — try again shortly',
      }))
    aiProducts = [...aiProducts, ...fill]
  }

  const result: SearchResult = {
    answer: answer || 'Here are the top electronics options for India right now.',
    aiProducts: aiProducts.slice(0, 3),
    serpProducts: serpResult.products,
    relatedSearches: serpResult.relatedSearches,
  }
  cache.set(cacheKey, { result, ts: Date.now() })
  return result
}
