// src/lib/search.ts — ProductRating.in Electronics
// FULL SCORING ENGINE: Candidates → Multi-factor Score → Ranked Top 3

import { searchGoogleShopping, buildProductContext, type SerpSearchResult } from './serpapi'

export type PlatformPrice = {
  platform: string   // "Amazon" | "Flipkart" | "Croma" | "Reliance Digital" etc
  price: string      // "₹38,990"
  url: string        // direct buy link
  availability: 'in_stock' | 'limited' | 'out_of_stock'
}

export type AiProduct = {
  name: string; price: string; seller: string
  rating: number; platform_rating: number
  reviews: string; badge: string; reason: string
  pros: string[]; cons: string[]; avoid_if: string
  score?: number
  platform_prices?: PlatformPrice[]   // multi-platform price comparison
  best_price?: string                 // lowest price across all platforms
  best_price_platform?: string        // platform with lowest price
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

// ─────────────────────────────────────────────
// ELECTRONICS SCOPE GATE
// ─────────────────────────────────────────────
const ELECTRONICS_RE = [
  /\b(phone|mobile|smartphone|5g phone|foldable|flip phone)\b/i,
  /\b(smartwatch|smart watch|wearable|fitness band|earbuds|earphone|headphone|tws|neckband|bluetooth speaker|portable speaker|soundbar|home theatre)\b/i,
  /\b(laptop|notebook|ultrabook|gaming laptop|chromebook|tablet|computer|desktop|monitor|keyboard|mouse|webcam|printer|router|wifi|modem)\b/i,
  /\b(tv|television|smart tv|oled|qled|4k tv|projector)\b/i,
  /\b(ac|air conditioner|inverter ac|split ac|window ac|refrigerator|fridge|washing machine|front load|top load|microwave|oven|air fryer|vacuum cleaner|air purifier|water purifier|ro purifier|geyser|water heater|dishwasher|mixer grinder|induction|electric kettle|trimmer|shaver|hair dryer)\b/i,
  /\b(camera|dslr|mirrorless|action camera|dashcam|power bank|charger|ssd|hard disk|hdd|pendrive|memory card)\b/i,
  /\b(gaming|console|playstation|xbox|nintendo|gpu|graphics card|cpu|processor|ram)\b/i,
]
const NON_ELECTRONICS_RE = [
  /\b(recipe|food|restaurant|hotel|travel|flight|visa|insurance|mutual fund|stock|loan|credit card|fashion|cloth|dress|shoe|bag|jewellery|book|novel|medicine|doctor|school|college|job|salary)\b/i,
]
function isElectronics(q: string): boolean {
  if (NON_ELECTRONICS_RE.some(p => p.test(q))) return false
  return ELECTRONICS_RE.some(p => p.test(q))
}

type Cat = 'smartphone'|'laptop'|'tv'|'ac'|'refrigerator'|'washing_machine'|'audio'|'wearable'|'tablet'|'camera'|'appliance'|'accessory'|'generic'
function detectCat(q: string): Cat {
  if (/\b(phone|mobile|smartphone|5g phone|foldable)\b/i.test(q)) return 'smartphone'
  if (/\b(laptop|notebook|ultrabook|chromebook|gaming laptop)\b/i.test(q)) return 'laptop'
  if (/\b(tv|television|smart tv|oled|qled|4k)\b/i.test(q)) return 'tv'
  if (/\b(ac|air conditioner|inverter ac|split ac)\b/i.test(q)) return 'ac'
  if (/\b(refrigerator|fridge)\b/i.test(q)) return 'refrigerator'
  if (/\b(washing machine|washer)\b/i.test(q)) return 'washing_machine'
  if (/\b(earbuds|earphone|headphone|tws|speaker|soundbar|neckband)\b/i.test(q)) return 'audio'
  if (/\b(smartwatch|wearable|fitness band)\b/i.test(q)) return 'wearable'
  if (/\b(tablet|ipad|android tablet)\b/i.test(q)) return 'tablet'
  if (/\b(camera|dslr|mirrorless)\b/i.test(q)) return 'camera'
  if (/\b(microwave|air fryer|mixer|kettle|iron|geyser|purifier|vacuum)\b/i.test(q)) return 'appliance'
  if (/\b(charger|cable|power bank|ssd|hard disk|memory card|adapter)\b/i.test(q)) return 'accessory'
  return 'generic'
}

// ─────────────────────────────────────────────
// CITY / STATE PROFILES
// ─────────────────────────────────────────────
type CityProfile = {
  label: string
  climate: string
  summer_peak_temp: number    // °C
  humidity: 'low'|'moderate'|'high'|'very_high'
  water_hardness: 'soft'|'moderate'|'hard'|'very_hard'  // TDS ppm
  power_stability: 'stable'|'moderate'|'frequent_cuts'
  service_hub: boolean
  air_quality: 'good'|'moderate'|'poor'|'very_poor'     // AQI typical
  boost_features: string[]    // Features to score higher for this city
  penalise_features: string[] // Features to score lower (missing for this city)
  service_brands: string[]    // Best after-sales in this city
}

const CITY_PROFILES: Record<string, CityProfile> = {
  // ── Metro cities ──
  'chennai':    { label:'Chennai', climate:'Hot+humid coastal', summer_peak_temp:40, humidity:'very_high', water_hardness:'hard', power_stability:'moderate', service_hub:true,  air_quality:'moderate', boost_features:['humidity resistance','salt air protection','5-star energy','efficient cooling','IP rating'], penalise_features:['no humidity resistance','poor coastal performance'], service_brands:['Samsung','LG','Voltas','Daikin','Hitachi'] },
  'mumbai':     { label:'Mumbai', climate:'Hot+humid coastal', summer_peak_temp:38, humidity:'very_high', water_hardness:'moderate', power_stability:'stable', service_hub:true, air_quality:'moderate', boost_features:['compact design','humidity resistance','monsoon proofing','rust protection'], penalise_features:['large footprint'], service_brands:['Samsung','LG','Sony','Voltas'] },
  'delhi':      { label:'Delhi', climate:'Extreme heat+cold+dusty', summer_peak_temp:48, humidity:'low', water_hardness:'very_hard', power_stability:'frequent_cuts', service_hub:true, air_quality:'very_poor', boost_features:['hot+cold AC','PM2.5 filter','dust filter','hard water compatibility','inverter tech','UPS support','voltage protection'], penalise_features:['single season AC','no dust protection','no hard water support'], service_brands:['Samsung','Voltas','LG','Daikin'] },
  'bengaluru':  { label:'Bengaluru', climate:'Mild pleasant', summer_peak_temp:35, humidity:'moderate', water_hardness:'moderate', power_stability:'stable', service_hub:true, air_quality:'moderate', boost_features:['smart features','energy efficiency','warranty','software support'], penalise_features:[], service_brands:['Samsung','Sony','LG','Apple'] },
  'kolkata':    { label:'Kolkata', climate:'Hot+humid', summer_peak_temp:40, humidity:'high', water_hardness:'soft', power_stability:'moderate', service_hub:true, air_quality:'poor', boost_features:['humidity resistance','cooling efficiency','mosquito protection'], penalise_features:[], service_brands:['Samsung','LG','Voltas','Hitachi'] },
  'hyderabad':  { label:'Hyderabad', climate:'Hot+dry', summer_peak_temp:43, humidity:'low', water_hardness:'hard', power_stability:'moderate', service_hub:true, air_quality:'moderate', boost_features:['5-star energy','dust filter','hard water compatibility','cooling power'], penalise_features:['no energy rating'], service_brands:['Samsung','LG','Voltas','Daikin'] },
  'pune':       { label:'Pune', climate:'Moderate', summer_peak_temp:38, humidity:'moderate', water_hardness:'hard', power_stability:'stable', service_hub:true, air_quality:'moderate', boost_features:['energy efficiency','hard water compatibility','value for money'], penalise_features:[], service_brands:['Samsung','LG','Sony','Voltas'] },
  'ahmedabad':  { label:'Ahmedabad', climate:'Extreme heat+dry', summer_peak_temp:47, humidity:'low', water_hardness:'very_hard', power_stability:'frequent_cuts', service_hub:false, air_quality:'poor', boost_features:['inverter compressor','5-star energy','hard water filter','voltage stabiliser','UPS support'], penalise_features:['no inverter','poor heat handling'], service_brands:['LG','Voltas','Samsung'] },
  'jaipur':     { label:'Jaipur', climate:'Extreme heat+dust, cold winters', summer_peak_temp:46, humidity:'low', water_hardness:'very_hard', power_stability:'frequent_cuts', service_hub:false, air_quality:'poor', boost_features:['hot+cold AC','dust filter','inverter','hard water','UPS support'], penalise_features:['single season','no dust filter'], service_brands:['Voltas','LG','Samsung'] },
  'lucknow':    { label:'Lucknow', climate:'Hot humid+cold winters', summer_peak_temp:44, humidity:'moderate', water_hardness:'hard', power_stability:'frequent_cuts', service_hub:false, air_quality:'very_poor', boost_features:['hot+cold AC','power cut protection','hard water','inverter'], penalise_features:[], service_brands:['Samsung','LG','Voltas'] },
  // ── Tier 2 cities ──
  'coimbatore': { label:'Coimbatore', climate:'Moderate+industrial', summer_peak_temp:38, humidity:'moderate', water_hardness:'moderate', power_stability:'stable', service_hub:false, air_quality:'moderate', boost_features:['energy efficiency','durability'], penalise_features:[], service_brands:['LG','Samsung','Voltas'] },
  'chandigarh': { label:'Chandigarh', climate:'Hot summers+cold winters', summer_peak_temp:44, humidity:'moderate', water_hardness:'hard', power_stability:'stable', service_hub:false, air_quality:'moderate', boost_features:['hot+cold AC','inverter','energy efficiency'], penalise_features:[], service_brands:['Samsung','LG','Voltas'] },
  'indore':     { label:'Indore', climate:'Hot dry+cold winters', summer_peak_temp:43, humidity:'low', water_hardness:'hard', power_stability:'moderate', service_hub:false, air_quality:'moderate', boost_features:['inverter','5-star energy','hard water','hot+cold'], penalise_features:[], service_brands:['LG','Samsung','Voltas'] },
  'kochi':      { label:'Kochi', climate:'Hot+humid coastal', summer_peak_temp:36, humidity:'very_high', water_hardness:'soft', power_stability:'stable', service_hub:false, air_quality:'good', boost_features:['humidity resistance','salt air','monsoon proofing','IP rating'], penalise_features:['no humidity protection'], service_brands:['LG','Samsung','Daikin'] },
  'noida':      { label:'Noida/NCR', climate:'Extreme heat+cold+dusty', summer_peak_temp:48, humidity:'low', water_hardness:'very_hard', power_stability:'moderate', service_hub:true, air_quality:'very_poor', boost_features:['PM2.5 filter','dust filter','hot+cold','hard water','inverter'], penalise_features:['no dust filter','no AQI protection'], service_brands:['Samsung','LG','Voltas','Daikin'] },
  'gurgaon':    { label:'Gurgaon/NCR', climate:'Extreme heat+cold+dusty', summer_peak_temp:48, humidity:'low', water_hardness:'very_hard', power_stability:'moderate', service_hub:true, air_quality:'very_poor', boost_features:['PM2.5 filter','dust filter','hot+cold','smart home','inverter'], penalise_features:[], service_brands:['Samsung','LG','Voltas','Daikin'] },
}

function getCityProfile(loc: string): CityProfile | null {
  const l = loc.toLowerCase().trim()
  for (const [key, profile] of Object.entries(CITY_PROFILES)) {
    if (l.includes(key) || key.includes(l)) return profile
  }
  // State-level fallbacks
  if (/rajasthan|haryana|up|uttarakhand|bihar|mp|chhattisgarh/.test(l))
    return { label:loc, climate:'Hot+dry, cold winters', summer_peak_temp:45, humidity:'low', water_hardness:'very_hard', power_stability:'frequent_cuts', service_hub:false, air_quality:'poor', boost_features:['inverter','5-star energy','hot+cold','hard water','voltage protection'], penalise_features:['no inverter','no energy rating'], service_brands:['Voltas','LG','Samsung'] }
  if (/kerala|goa|karnataka|tamil nadu|andhra/.test(l))
    return { label:loc, climate:'Hot+humid', summer_peak_temp:38, humidity:'high', water_hardness:'moderate', power_stability:'moderate', service_hub:false, air_quality:'moderate', boost_features:['humidity resistance','5-star energy','IP rating'], penalise_features:['no humidity protection'], service_brands:['LG','Samsung','Daikin'] }
  if (/himachal|jammu|kashmir|northeast|sikkim|arunachal/.test(l))
    return { label:loc, climate:'Cold mountain', summer_peak_temp:28, humidity:'moderate', water_hardness:'soft', power_stability:'frequent_cuts', service_hub:false, air_quality:'good', boost_features:['heating mode','voltage protection','all-weather performance'], penalise_features:['cooling only'], service_brands:['LG','Samsung'] }
  return null
}

// ─────────────────────────────────────────────
// BRAND TRUST SCORES (India-specific)
// ─────────────────────────────────────────────
function getBrandFakeMultiplier(brand: string, cat: Cat): number {
  const b = brand.toLowerCase()
  const veryHighFake = ['boat','noise','boult','zebronics','ptron','wings','truke','hammer','mivi','crossbeats','digitek','blaupunkt budget']
  const highFake     = ['realme','iqoo','poco','infinix','tecno','lava','micromax','vu','kodak tv','thomson']
  const medFake      = ['redmi','xiaomi','vivo','oppo','oneplus','nothing','cmf']
  const lowFake      = ['samsung','sony','lg','apple','bose','sennheiser','jbl premium','motorola','nokia','voltas','daikin','hitachi','whirlpool','godrej','bosch','siemens']

  if (veryHighFake.some(r => b.includes(r))) return 0.70  // Remove 30%
  if (highFake.some(r => b.includes(r)))     return 0.80  // Remove 20%
  if (medFake.some(r => b.includes(r)))      return 0.87  // Remove 13%
  if (lowFake.some(r => b.includes(r)))      return 0.94  // Remove 6%
  // Category default
  if (cat === 'audio' || cat === 'accessory') return 0.72
  if (cat === 'smartphone')    return 0.83
  if (cat === 'ac' || cat === 'refrigerator' || cat === 'washing_machine') return 0.91
  return 0.85
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
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
  const CITIES = new Set(['delhi','new delhi','mumbai','bombay','bangalore','bengaluru','chennai','kolkata','hyderabad','pune','ahmedabad','surat','jaipur','lucknow','noida','gurgaon','gurugram','coimbatore','kochi','indore','chandigarh','nagpur','bhopal','visakhapatnam','vizag','patna','ranchi','bhubaneswar','dehradun','agra','varanasi','amritsar','ludhiana','nashik','thane','navi mumbai'])
  const c = city.toLowerCase().trim()
  if (c && CITIES.has(c)) return city
  if (c && c.length > 2) return city
  if (state && state.length > 2) return state
  return ''
}
function selectModel(q: string): string {
  return /compare|versus|\bvs\b|difference|which is better|should i buy|worth it|recommend/i.test(q) ? 'gpt-5.4' : 'gpt-5.3-chat-latest'
}
function sanitise(p: Record<string, unknown>, i: number): AiProduct {
  const r = Math.min(4.8, Math.max(3.0, Number(p.rating) || 4.0))
  return {
    name:            String(p.name||'').trim(),
    price:           String(p.price||'—'),
    seller:          normaliseSeller(String(p.seller||'Amazon')),
    rating:          r,
    platform_rating: Math.min(5.0, Math.max(r+0.15, Number(p.platform_rating)||r+0.3)),
    reviews:         String(p.reviews||''),
    badge:           String(p.badge||['Best Pick','Best Value','Budget Pick'][i]||'Top Rated'),
    reason:          String(p.reason||''),
    pros:            Array.isArray(p.pros)?p.pros.slice(0,2).map(String):[],
    cons:            Array.isArray(p.cons)?p.cons.slice(0,1).map(String):[],
    avoid_if:        String(p.avoid_if||''),
    score:           Number(p.score||0),
    platform_prices: Array.isArray(p.platform_prices) ? p.platform_prices : [],
    best_price:      String(p.best_price||''),
    best_price_platform: String(p.best_price_platform||''),
  }
}

// Ensure seller field is always a known marketplace, never a brand site
function normaliseSeller(seller: string): string {
  const s = seller.toLowerCase()
  // Known marketplaces — pass through with clean name
  if (s.includes('amazon'))    return 'Amazon'
  if (s.includes('flipkart'))  return 'Flipkart'
  if (s.includes('croma'))     return 'Croma'
  if (s.includes('reliance'))  return 'Reliance Digital'
  if (s.includes('vijay'))     return 'Vijay Sales'
  if (s.includes('tata'))      return 'Tata Cliq'
  if (s.includes('meesho'))    return 'Meesho'
  if (s.includes('jio'))       return 'JioMart'
  // Everything else is a brand/manufacturer site → default to Amazon
  return 'Amazon'
}

// ─────────────────────────────────────────────
// OPENAI — JSON mode with full scoring prompt
// ─────────────────────────────────────────────
// ─────────────────────────────────────────────
// ENRICH platform_prices FROM LIVE SERP DATA
// Skyscanner-style: show each platform's price + direct buy link
// ─────────────────────────────────────────────
// Known Indian marketplaces — direct product search URLs
const MARKETPLACE_MAP: Record<string, (q: string) => string> = {
  'amazon':          q => `https://www.amazon.in/s?k=${q}`,
  'flipkart':        q => `https://www.flipkart.com/search?q=${q}`,
  'croma':           q => `https://www.croma.com/searchB?q=${q}`,
  'reliance digital':q => `https://www.reliancedigital.in/search?q=${q}`,
  'vijay sales':     q => `https://www.vijaysales.com/search/${q}`,
  'vijaysales':      q => `https://www.vijaysales.com/search/${q}`,
  'tata cliq':       q => `https://www.tatacliq.com/search/?text=${q}`,
  'tatacliq':        q => `https://www.tatacliq.com/search/?text=${q}`,
  'meesho':          q => `https://www.meesho.com/search?q=${q}`,
  'jiomart':         q => `https://www.jiomart.com/search/${q}`,
  'nykaa':           q => `https://www.nykaa.com/search/result/?q=${q}`,
  'snapdeal':        q => `https://www.snapdeal.com/search?keyword=${q}`,
}

// Known brand/manufacturer sites — NOT marketplaces, redirect to Amazon search instead
const BRAND_SITES = [
  'xiaomi','mi.com','realme','oneplus','samsung india','apple india',
  'nokia','motorola','lenovo','hp india','dell india','asus','lg india',
  'sony india','bosch','voltas','daikin','hitachi','whirlpool','godrej',
  'boat-lifestyle','boat','noise','official','store','brand'
]

function isMarketplace(source: string): boolean {
  const s = source.toLowerCase()
  return Object.keys(MARKETPLACE_MAP).some(k => s.includes(k))
}

function buildDirectUrl(platform: string, productName: string): string {
  const q = encodeURIComponent(productName)
  const p = platform.toLowerCase()
  for (const [key, fn] of Object.entries(MARKETPLACE_MAP)) {
    if (p.includes(key)) return fn(q)
  }
  // It's a brand site — send to Amazon search instead
  return `https://www.amazon.in/s?k=${q}`
}

function platformDisplayName(source: string): string {
  const s = source.toLowerCase()
  if (s.includes('amazon'))    return 'Amazon'
  if (s.includes('flipkart'))  return 'Flipkart'
  if (s.includes('croma'))     return 'Croma'
  if (s.includes('reliance'))  return 'Reliance Digital'
  if (s.includes('vijay'))     return 'Vijay Sales'
  if (s.includes('tata'))      return 'Tata Cliq'
  if (s.includes('meesho'))    return 'Meesho'
  if (s.includes('jio'))       return 'JioMart'
  return source  // fallback
}

type SerpProd = SerpSearchResult['products'][0]

function enrichWithSerpPrices(
  aiProducts: AiProduct[],
  serpProducts: SerpSearchResult['products']
): AiProduct[] {
  if (!serpProducts.length) return aiProducts

  return aiProducts.map(ai => {
    // If AI gave us platform_prices — filter brand sites, keep only marketplaces
    if (ai.platform_prices && ai.platform_prices.length > 0) {
      const enriched = ai.platform_prices
        .filter(pp => isMarketplace(pp.platform))  // Drop brand sites completely
        .map(pp => ({
          ...pp,
          platform: platformDisplayName(pp.platform),  // Normalise name
          url: pp.url && pp.url.startsWith('http') && isMarketplace(pp.platform)
            ? pp.url
            : buildDirectUrl(pp.platform, ai.name),   // Replace brand URLs with marketplace search
        }))

      // If AI's platform_prices were all brand sites (enriched is empty), use marketplace fallbacks
      if (enriched.length === 0) {
        const fallbacks: PlatformPrice[] = [
          { platform:'Amazon',  price:ai.price, url:buildDirectUrl('amazon', ai.name),   availability:'in_stock' },
          { platform:'Flipkart',price:'—',      url:buildDirectUrl('flipkart', ai.name), availability:'in_stock' },
        ]
        return { ...ai, seller:'Amazon', platform_prices:fallbacks, best_price:ai.price, best_price_platform:'Amazon' }
      }

      enriched.sort((a, b) => {
        const pa = parseInt(a.price.replace(/[^\d]/g, '')) || 999999
        const pb = parseInt(b.price.replace(/[^\d]/g, '')) || 999999
        return pa - pb
      })
      const best = enriched[0]
      return {
        ...ai,
        platform_prices: enriched,
        best_price: best?.price || ai.price,
        best_price_platform: best?.platform || ai.seller,
      }
    }

    // Build platform_prices from SERP results by fuzzy-matching product name
    const aiName = ai.name.toLowerCase()
    // Extract key words (brand + model number)
    const keywords = aiName.split(/\s+/).filter(w => w.length > 2).slice(0, 5)

    const matched = serpProducts.filter(sp => {
      if (!sp.title || !sp.price) return false
      const t = sp.title.toLowerCase()
      const matchCount = keywords.filter(kw => t.includes(kw)).length
      return matchCount >= Math.min(3, keywords.length - 1) // at least 3 keyword matches
    })

    if (matched.length === 0) {
      // No SERP marketplace match — always use known marketplaces, NEVER brand sites
      // Even if AI said "Xiaomi Store" or "Samsung India", we redirect to Amazon/Flipkart
      const marketplaceFallbacks: PlatformPrice[] = [
        { platform:'Amazon',  price:ai.price, url:buildDirectUrl('amazon', ai.name),   availability:'in_stock' },
        { platform:'Flipkart',price:'—',      url:buildDirectUrl('flipkart', ai.name), availability:'in_stock' },
        { platform:'Croma',   price:'—',      url:buildDirectUrl('croma', ai.name),    availability:'in_stock' },
      ]
      return {
        ...ai,
        seller: 'Amazon',  // Override any brand site seller with a real marketplace
        platform_prices: marketplaceFallbacks,
        best_price: ai.price,
        best_price_platform: 'Amazon',
      }
    }

    // Group by MARKETPLACE platform only — skip brand/manufacturer sites
    const byPlatform = new Map<string, SerpProd>()
    for (const sp of matched) {
      // Skip brand sites (Xiaomi India, Realme, Samsung Official etc.)
      if (!isMarketplace(sp.source)) {
        console.log(`[Prices] skipping brand site: ${sp.source}`)
        continue
      }
      const key = platformDisplayName(sp.source)  // normalise key
      const existing = byPlatform.get(key)
      if (!existing) {
        byPlatform.set(key, sp)
      } else {
        const ep = parseInt(existing.price?.replace(/[^\d]/g,'') || '999999')
        const sp2 = parseInt(sp.price?.replace(/[^\d]/g,'') || '999999')
        if (sp2 < ep) byPlatform.set(key, sp)
      }
    }

    let platform_prices: PlatformPrice[] = Array.from(byPlatform.entries()).map(([name, sp]) => ({
      platform: name,  // use normalised display name
      price: sp.price || '—',
      url: sp.link && sp.link.startsWith('http') && isMarketplace(sp.source)
        ? sp.link
        : buildDirectUrl(name, ai.name),  // always link to marketplace, never brand site
      availability: 'in_stock' as const,
    }))

    // Sort lowest price first (Skyscanner style)
    platform_prices.sort((a,b) => {
      const pa = parseInt(a.price.replace(/[^\d]/g,'')) || 999999
      const pb = parseInt(b.price.replace(/[^\d]/g,'')) || 999999
      return pa - pb
    })

    // Cap at 4 platforms
    platform_prices = platform_prices.slice(0, 4)

    // If we have no SERP matches for a platform, ensure at least the AI seller is included
    const hasSeller = platform_prices.some(p => p.platform.toLowerCase().includes(ai.seller.toLowerCase()))
    if (!hasSeller) {
      platform_prices.unshift({ platform:'Amazon', price:ai.price, url:buildDirectUrl('amazon',ai.name), availability:'in_stock' })
      platform_prices = platform_prices.slice(0,4)
      platform_prices.sort((a,b)=>{
        const pa=parseInt(a.price.replace(/[^\d]/g,''))||999999
        const pb=parseInt(b.price.replace(/[^\d]/g,''))||999999
        return pa-pb
      })
    }

    const best = platform_prices[0]
    return {
      ...ai,
      platform_prices,
      price: best?.price || ai.price,           // update displayed price to lowest found
      seller: best?.platform || ai.seller,       // update seller to cheapest
      best_price: best?.price || ai.price,
      best_price_platform: best?.platform || ai.seller,
    }
  })
}

async function callOpenAI(
  question: string, serpContext: string, loc: string, lang: string,
  monthYear: string, currentYear: number, cat: Cat,
  model: string, apiKey: string
): Promise<{ answer: string; products: unknown[] }> {

  const cityProfile = getCityProfile(loc)
  const yr = currentYear

  // ── Build city context block ──
  const cityBlock = cityProfile ? `
═══════════════════════════════════════════
LOCATION PROFILE: ${cityProfile.label.toUpperCase()}
═══════════════════════════════════════════
Climate: ${cityProfile.climate}
Peak summer temp: ${cityProfile.summer_peak_temp}°C
Humidity: ${cityProfile.humidity}
Water hardness: ${cityProfile.water_hardness} (TDS matters for AC/washing machine/purifier)
Power stability: ${cityProfile.power_stability}
Service hub: ${cityProfile.service_hub ? 'Yes — major service centres present' : 'No — limited centres, pan-India service critical'}
Air quality: ${cityProfile.air_quality}

CITY SCORING BONUS (+3 to +8 pts each):
  Boost products that have: ${cityProfile.boost_features.join(' | ')}
CITY SCORING PENALTY (-3 to -8 pts each):
  Penalise products missing: ${cityProfile.penalise_features.join(' | ')}
Best after-sales brands in ${cityProfile.label}: ${cityProfile.service_brands.join(', ')}

If product DOES NOT have service centre in ${cityProfile.label} area → -5 pts on service score.
` : (loc ? `Location: ${loc} — apply best-fit regional adjustments for Indian climate/power/water.` : '')

  const systemPrompt = `You are ProductRating.in, India's most trusted electronics scoring engine. Today: ${monthYear}.
${lang ? lang + '\n' : ''}

YOUR TASK:
1. Generate a candidate list of 8–12 relevant electronics products for this query
2. Score EACH candidate using the full algorithm below
3. Select the TOP 3 by score
4. Return the result as JSON

${cityBlock}

══════════════════════════════════════════════════════════
PRODUCTRATING SCORING ALGORITHM v3  (max 100 points)
══════════════════════════════════════════════════════════

─── FACTOR 1: RELEVANCE (0–30 pts) ───────────────────
Score how well the product matches the EXACT query:
  30 pts — Perfect match: right category, right budget range, right use case, right specs for query
  22 pts — Strong match: right category, slightly outside budget (<10%) or minor spec gap
  14 pts — Partial match: right category, significant spec/budget mismatch
   6 pts — Weak match: adjacent category (e.g. washing machine when asked AC)
   0 pts — Wrong category entirely → EXCLUDE from results

─── FACTOR 2: RECENCY (0–20 pts) ─────────────────────
Based on launch year in India:
  20 pts — Launched in ${yr} (this year) — cutting-edge
  16 pts — Launched in ${yr-1} — current gen
  10 pts — Launched in ${yr-2} — one gen behind
   5 pts — Launched in ${yr-3} — two gens behind
   0 pts — Launched ${yr-4} or earlier → SKIP unless EVERGREEN EXCEPTION

EVERGREEN EXCEPTION (score up to 12 pts recency):
  A product older than ${yr-2} MAY be included ONLY if ALL 3 conditions met:
  ✓ Still listed as NEW on Amazon.in or Flipkart (first-party, not grey market)
  ✓ 35,000+ combined reviews across Amazon + Flipkart + Croma
  ✓ Specifications still genuinely competitive vs ${yr} alternatives at its price
  Examples that qualify: Redmi Note 13, Samsung Galaxy A34 (large review base, active stock)
  Examples to SKIP: Samsung M33 (M35 replaced it), Narzo 60x (80 series out), Redmi Note 12

SUCCESSOR UPGRADE RULE (CRITICAL — prevents stale outdated recommendations):
  When a candidate product from 2022-2023 has high reviews but a NEWER model in the same
  series has launched — ALWAYS recommend the newer successor, NOT the old one.

  Algorithm:
    1. Identify the series (e.g. "Redmi Note", "Samsung Galaxy A", "Narzo")
    2. Check: has a newer model in this series launched in ${yr} or ${yr-1}?
    3. If YES → recommend the newer model instead
    4. In "reason" mention: "Upgraded from the popular [older model] (Xk reviews)"
    5. Award +5 POPULARITY INHERITANCE BONUS to successor if older sibling had 30k+ reviews

  Required upgrades for ${yr} — ALL ELECTRONICS CATEGORIES:

  SMARTPHONES:
    Redmi Note 12/13 → Redmi Note 14/15 5G
    Samsung Galaxy M33/M34 → Samsung Galaxy M35/M55 5G
    Narzo 60x/60 → Narzo 80/80 Pro 5G
    iQOO Z7/Z7 Pro → iQOO Z9/Z9x/Z10
    OnePlus Nord CE 3 → Nord CE 4/4 Lite
    Redmi 12/12C → Redmi 14/15 5G
    Galaxy A34/A14 → Galaxy A35/A36 5G
    Moto G73/G84 → Moto G96/G85 5G
    POCO M5/M6 → POCO M7/X7
    Realme 11/11x → Realme 13/13x 5G
    Vivo T2/T2x → Vivo T3/T3x 5G
    CMF Phone 1 → CMF Phone 2 Pro

  LAPTOPS:
    Intel 12th gen laptops → Intel Core Ultra (Meteor Lake/Arrow Lake) or AMD Ryzen 8000 series
    Lenovo IdeaPad 3 (older) → Lenovo IdeaPad Slim 3/5 (2024/2025 gen)
    HP Pavilion 15 (older i5-12th) → HP Pavilion 15 (Core Ultra 5/7 2024)
    Dell Inspiron 15 (older) → Dell Inspiron 15 (2024 gen Core Ultra)
    ASUS VivoBook 15 (older) → ASUS VivoBook 16X (2024 gen)
    HP Victus 15 (RTX 3050) → HP Victus 15 (RTX 4060 2024)
    Acer Aspire 7 (older) → Acer Aspire 7/Swift (2024 gen)

  TVs:
    Samsung Crystal 4K (2022) → Samsung Crystal 4K (2024 BU/CU series)
    LG NanoCell 2022 → LG NanoCell/QNED 2024
    Sony Bravia X74K → Sony Bravia X74L/X75L (2024)
    Mi/Xiaomi TV 5X → Xiaomi TV A2/X Pro (2024)
    OnePlus TV Y1S → OnePlus TV 43/50/55 Y3 (2024)
    Realme SLED/4K → Realme Smart TV 4K 2024

  AIR CONDITIONERS:
    LG Dual Inverter (2021/2022 models) → LG DUAL Inverter (2024 gen with AI+)
    Daikin FTKF (2022) → Daikin FTKP/FTKG (2024)
    Voltas 183V (older) → Voltas Inverter (2024 5-star series)
    Samsung WindFree (2022) → Samsung WindFree (2024 AI series)
    Hitachi Kaze (older) → Hitachi Frost Wash (2024)
    Blue Star (older 3-star) → Blue Star 5-star inverter (2024)

  REFRIGERATORS:
    Samsung 3-door (2022 RT models) → Samsung Frost Free (2024 RT/RF series)
    LG Single/Double door (2021) → LG (2024 gen with Wi-Fi/AI)
    Whirlpool Intellifresh (older) → Whirlpool Intellifresh (2024 gen)
    Haier (2022 models) → Haier (2024 HRB series)

  WASHING MACHINES:
    Samsung 6.5kg front load (2022) → Samsung 7kg/8kg (2024 AI wash series)
    LG FHM (older) → LG FHP/AI Direct Drive (2024)
    IFB 6kg (older Senator) → IFB 7kg/8kg (2024 Executive/Senator Plus)
    Bosch 6kg (2022) → Bosch 7kg/8kg (2024 Series 4/6)

  AUDIO (Earbuds/Headphones):
    Sony WF-1000XM4 → Sony WF-1000XM5
    Samsung Galaxy Buds 2 → Galaxy Buds 2 Pro / Galaxy Buds 3
    Nothing Ear 1/2 → Nothing Ear (a)/Ear 2 (2024)
    CMF Buds/Buds Pro → CMF Buds Pro 2 (2024)
    OnePlus Buds 2 → OnePlus Buds 3/Pro 2
    boat Airdopes 141 (older) → boat Airdopes 141 (2024 gen v2)
    Realme Buds Air 3 → Realme Buds Air 5/6

  SMARTWATCHES:
    Samsung Galaxy Watch 4/5 → Galaxy Watch 6/7/FE
    Nothing Watch 1 → Nothing Watch Pro (2024)
    CMF Watch Pro → CMF Watch Pro 2 (2024)
    Amazfit GTR 3/GTS 3 → Amazfit GTR 4/GTR Mini (2024)
    Noise ColorFit Pro 4 → Noise ColorFit Caliber/Pro 5 (2024)
    boAt Wave (older) → boAt Wave Sigma/Ripple (2024)

  GENERAL RULE FOR ALL CATEGORIES:
    Any product with "2022" or "2023" model year where brand has released 2024/2025 version → upgrade
    Key signal: model number increment (X → X+1), gen indicator, or year in model name

  NEVER recommend a product when its direct successor exists at the same price bracket.
  If the newer model has fewer reviews, mention this: "New model with fewer reviews but better specs"

─── FACTOR 3: CROSS-PLATFORM REVIEW VOLUME (0–20 pts) ──
AGGREGATE total reviews from ALL Indian platforms:
  Amazon.in       × 1.00 weight
  Flipkart        × 0.90 weight
  Croma           × 0.95 weight
  Reliance Digital × 0.95 weight
  Vijay Sales     × 0.95 weight
  Tata Cliq       × 0.90 weight
  Meesho / JioMart × 0.60 weight (high fake risk)

Report combined total as: "48k" or "1.2L" (lakh) — NEVER mention platform names in the reviews field. Just the number.

Combined weighted review count:
  50,000+ → 20 pts
  25,000–49,999 → 16 pts
  10,000–24,999 → 12 pts
   3,000–9,999 →  8 pts
     500–2,999 →  4 pts
        <500   →  0 pts

FAKE REVIEW PENALTY (deduct from review pts):
  Pattern A: >85% 5-star ratings, almost no 1-2 star → -4 pts (statistically impossible)
  Pattern B: Sudden spike of 10,000+ reviews in launch week 1 → -4 pts
  Pattern C: Reviewer accounts with only 1 total review across Amazon/Flipkart → -3 pts
  Pattern D: "Received product for free/discount in exchange for review" >15% → -4 pts
  Pattern E: Brand known for aggressive paid review campaigns (boat/Noise/Zebronics/PTron) → -3 pts

─── FACTOR 4: WEIGHTED PLATFORM RATING → PR SCORE (0–15 pts) ──
Step A — Compute weighted average:
  Σ(platform_rating × platform_weight × platform_review_count) ÷ Σ(platform_weight × platform_review_count)
  This is the "platform_rating" you report.

Step B — Subtract fake inflation to get PR Score:
  Established brands (Samsung/Sony/LG/Apple/Motorola/Voltas/LG): subtract 0.10–0.20
  Mid-tier (Redmi/Realme/iQOO/Vivo/OnePlus/Nothing/CMF):        subtract 0.25–0.35
  High-risk (boat/Noise/Boult/Zebronics/PTron/Truke/Wings):      subtract 0.45–0.65
  Additional: launch-week spike brands get extra -0.15

  PR Score = weighted avg − fake adjustments (this is "rating" field, always < platform_rating)

Score from PR Score:
  4.5+ → 15 pts
  4.2–4.49 → 12 pts
  4.0–4.19 →  8 pts
  3.7–3.99 →  5 pts
  <3.7 → 0 pts

─── FACTOR 5: VALUE FOR MONEY (0–10 pts) ─────────────
Compare specs delivered per rupee vs category average in India:
  10 pts — Exceptional value: specs significantly better than peers at same price
   7 pts — Good value: competitive specs for the price
   4 pts — Average: fair but not outstanding
   1 pt  — Poor value: clearly overpriced for specs offered
   0 pts — Premium priced but specs don't justify it for Indian budget segment

─── FACTOR 6: INDIA SERVICE & WARRANTY (0–5 pts) ──────
After-sales reliability for the specific city/region:
  5 pts — Authorised service centre within 10km in user's city/region, 2yr+ warranty
  3 pts — Service centre in same city, standard 1yr warranty
  1 pt  — Limited service, must courier device (common in Tier-2/3)
  0 pts — No reliable India service network
  Note: For ${loc || 'general India'}, adjust based on city profile above.

══════════════════════════════════════════════════════════
TOTAL SCORE = F1+F2+F3+F4+F5+F6 (max 100)
Select TOP 3 by score. Tiebreaker: higher F4 (PR Score) wins.
══════════════════════════════════════════════════════════

RESPOND WITH VALID JSON ONLY — absolutely no text outside JSON.
Schema:
{
  "answer": "2-3 sentences: specific buying advice for ${loc || 'India'}. Mention key tradeoff and why #1 wins.",
  "scoring_summary": "One sentence describing how you applied the algorithm (for transparency)",
  "products": [
    {
      "name": "Full Product Name with storage/variant/colour",
      "price": "₹XX,XXX",
      "seller": "Amazon",
      "rating": 4.2,
      "platform_rating": 4.6,
      "reviews": "48k",
      "badge": "Best Pick",
      "score": 84,
      "reason": "Why this ranks #1 for this exact query in ${loc || 'India'} — mention algorithm factors",
      "platform_prices": [
        {"platform":"Amazon","price":"₹38,990","url":"https://www.amazon.in/s?k=LG+1.5+Ton+5+Star+AI+Dual+Inverter+AC","availability":"in_stock"},
        {"platform":"Flipkart","price":"₹36,490","url":"https://www.flipkart.com/search?q=LG+1.5+Ton+5+Star+AI+Dual+Inverter+AC","availability":"in_stock"},
        {"platform":"Croma","price":"₹39,990","url":"https://www.croma.com/searchB?q=LG+AC","availability":"in_stock"}
      ],
      "best_price": "₹36,490",
      "best_price_platform": "Flipkart",
      "pros": ["Specific factual pro 1 relevant to ${loc || 'India'}", "Specific factual pro 2"],
      "cons": ["Main real complaint from actual buyer reviews"],
      "avoid_if": "Specific type of buyer who should not choose this"
    },
    { "name": "...", "price": "...", "seller": "...", "rating": 4.0, "platform_rating": 4.4, "reviews": "...", "badge": "Best Value", "score": 76, "reason": "...", "pros": ["...","..."], "cons": ["..."], "avoid_if": "..." },
    { "name": "...", "price": "...", "seller": "...", "rating": 3.8, "platform_rating": 4.2, "reviews": "...", "badge": "Budget Pick", "score": 68, "reason": "...", "pros": ["...","..."], "cons": ["..."], "avoid_if": "..." }
  ]
}`

  const userMsg = `Question: ${question}` +
    (loc ? `\nUser location: ${loc}` : '') +
    (serpContext
      ? `\n\nLive product data from Indian platforms (ground truth for current price and availability):\n${serpContext}\n\nStep 1: Generate 8-12 candidate products for this query (combine live data + your knowledge of Indian electronics market as of ${monthYear}).\nStep 2: Score EACH candidate using the full algorithm.\nStep 3: Return top 3 by score.`
      : `\n\nNo live data. Use your knowledge of Indian electronics market as of ${monthYear}.\nStep 1: Generate 8-12 candidate products.\nStep 2: Score each using the full algorithm.\nStep 3: Return top 3.`)

  for (let attempt = 0; attempt <= 2; attempt++) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model,
          messages: [{ role:'system', content:systemPrompt }, { role:'user', content:userMsg }],
          max_tokens: 2500,
          temperature: 0.25,
          response_format: { type: 'json_object' },
        }),
      })
      if (res.status === 429) { if (attempt<2) await new Promise(r=>setTimeout(r,1000*(attempt+1))); continue }
      const raw = await res.text()
      console.log(`[OpenAI:${model}] status=${res.status} len=${raw.length}`)
      if (!res.ok) { console.error('[OpenAI] err:', raw.slice(0,300)); return { answer:'', products:[] } }
      const d = JSON.parse(raw)
      const content: string = d?.choices?.[0]?.message?.content||'{}'
      console.log(`[OpenAI] preview: ${content.slice(0,250)}`)
      const parsed = JSON.parse(content)
      const prods = Array.isArray(parsed.products) ? parsed.products : []
      console.log(`[OpenAI] products: ${prods.length}, scoring_summary: ${parsed.scoring_summary||'n/a'}`)
      return { answer: String(parsed.answer||''), products: prods }
    } catch(e) {
      console.error(`[OpenAI] attempt ${attempt+1}:`, String(e))
      if (attempt<2) await new Promise(r=>setTimeout(r,1000))
    }
  }
  return { answer:'', products:[] }
}

// ── SARVAM FALLBACK ──
async function callSarvam(q: string, serpCtx: string, loc: string, lang: string, monthYear: string, apiKey: string): Promise<{ answer: string; products: unknown[] }> {
  const sp = `You are ProductRating.in electronics advisor. Today: ${monthYear}.${lang?' '+lang:''}${loc?' Location: '+loc+'.':''}
Generate 6-8 candidate electronics products for this query. Score each:
  Relevance(30) + Recency(20) + Reviews across Amazon+Flipkart+Croma combined(20) + Weighted rating minus fake removal(15) + Value for money(10) + India service(5) = 100pts
Select top 3 by score. Write 2 sentences advice then ---PRODUCTS--- then JSON array of 3 with: name,price,seller,rating(fake-removed),platform_rating(weighted avg),reviews(combined),badge,score,reason,pros(2),cons(1),avoid_if`
  const um = `Question: ${q}${loc?' Location: '+loc:''}${serpCtx?'\n\nLive prices:\n'+serpCtx:''}`
  for (let attempt=0;attempt<=3;attempt++) {
    try {
      const res = await fetch('https://api.sarvam.ai/v1/chat/completions', {
        method:'POST', headers:{'Content-Type':'application/json','api-subscription-key':apiKey},
        body:JSON.stringify({ model:'sarvam-m', messages:[{role:'system',content:sp},{role:'user',content:um}], max_tokens:2000, temperature:0.25 }),
      })
      if (res.status===429) { if(attempt<3) await new Promise(r=>setTimeout(r,Math.min(1000*Math.pow(2,attempt),8000))); continue }
      if (!res.ok) return { answer:'', products:[] }
      const d = JSON.parse(await res.text())
      let c: string = d?.choices?.[0]?.message?.content||''
      let prev=''
      while (prev!==c) { prev=c; c=c.replace(/<think>[\s\S]*?<\/think>/gi,'') }
      c = c.replace(/<\/?think[^>]*>/gi,'').trim()
      const si=c.search(/---PRODUCTS---/i)
      const answer=(si!==-1?c.slice(0,si):c.slice(0,400)).replace(/\*\*(.*?)\*\*/g,'$1').trim()
      const jp=si!==-1?c.slice(si+15):c
      const st=jp.indexOf('['); if(st===-1) return { answer, products:[] }
      let depth=0,end=-1
      for(let i=st;i<jp.length;i++){if(jp[i]==='[')depth++;else if(jp[i]===']'){depth--;if(depth===0){end=i;break}}}
      if(end===-1) return { answer, products:[] }
      try { return { answer, products:JSON.parse(jp.slice(st,end+1)) } } catch { return { answer, products:[] } }
    } catch(e) { console.error(`[Sarvam] attempt ${attempt+1}:`,String(e)); if(attempt<3) await new Promise(r=>setTimeout(r,1000)) }
  }
  return { answer:'', products:[] }
}

// ─────────────────────────────────────────────
// MAIN ENTRY POINT
// ─────────────────────────────────────────────
export async function runSearch(
  question: string, city='', state='',
  sarvamKey: string, openaiKey?: string
): Promise<SearchResult> {

  if (!isElectronics(question)) return { answer:'', aiProducts:[], serpProducts:[], relatedSearches:[], isOutOfScope:true }

  const cacheKey = `${question.toLowerCase().trim()}|${city}|${state}`
  const hit = cache.get(cacheKey)
  if (hit && Date.now()-hit.ts<CACHE_TTL) { console.log('[Search] cache hit'); return hit.result }

  const monthYear = getMonthYear()
  const currentYear = getYear()
  const lang = detectLang(question)
  const loc = getLocation(city, state)
  const model = selectModel(question)
  const cat = detectCat(question)

  console.log(`[Search] cat=${cat} model=${model} loc=${loc||'none'}`)

  let serpResult: SerpSearchResult = { products:[], relatedSearches:[], query:question }
  try { serpResult = await searchGoogleShopping(question); console.log(`[SERP] ${serpResult.products.length}`) }
  catch(e) { console.error('[SERP]:',String(e)) }
  const serpContext = buildProductContext(serpResult)

  let answer='', rawProducts: unknown[]=[]

  if (openaiKey) {
    const r = await callOpenAI(question, serpContext, loc, lang, monthYear, currentYear, cat, model, openaiKey)
    answer=r.answer; rawProducts=r.products
    if ((!answer||rawProducts.length===0) && model!=='gpt-5.4') {
      console.log('[Search] upgrading to gpt-5.4')
      const r2 = await callOpenAI(question, serpContext, loc, lang, monthYear, currentYear, cat, 'gpt-5.4', openaiKey)
      if (r2.answer||r2.products.length>0) { answer=r2.answer; rawProducts=r2.products }
    }
  }

  if (!answer && rawProducts.length===0 && sarvamKey) {
    const r = await callSarvam(question, serpContext, loc, lang, monthYear, sarvamKey)
    answer=r.answer; rawProducts=r.products
  }

  if (!answer && rawProducts.length===0) {
    return { answer:'AI is temporarily unavailable. Please try again.', aiProducts:[], serpProducts:serpResult.products, relatedSearches:serpResult.relatedSearches }
  }

  let aiProducts: AiProduct[] = (rawProducts as Record<string,unknown>[])
    .filter(p => p && typeof p.name==='string' && p.name.length>2)
    .slice(0,3).map(sanitise)

  if (aiProducts.length<3 && serpResult.products.length>0) {
    const used = new Set(aiProducts.map(p=>p.name.toLowerCase()))
    const fill = serpResult.products
      .filter(sp=>sp.title&&sp.price&&!used.has(sp.title.toLowerCase()))
      .slice(0,3-aiProducts.length)
      .map((sp,i): AiProduct => ({
        name:sp.title, price:sp.price||'—', seller:sp.source||'Amazon',
        rating:sp.rating?Math.min(4.8,Math.max(3.0,Number(sp.rating))):4.0,
        platform_rating:sp.rating?Math.min(5.0,Number(sp.rating)+0.3):4.3,
        reviews:'', badge:(['Best Pick','Best Value','Budget Pick'][aiProducts.length+i])||'Top Rated',
        reason:`Top result on ${sp.source||'Amazon'} for this query.`,
        pros:['Competitive price in India','Available on major platform'],
        cons:['Compare full specs before buying'],
        avoid_if:'If you need detailed AI analysis — try again shortly',
        score:0,
      }))
    aiProducts=[...aiProducts,...fill]
  }

  // Enrich with Skyscanner-style cross-platform prices from live SERP data
  aiProducts = enrichWithSerpPrices(aiProducts, serpResult.products)

  const result: SearchResult = {
    answer: answer||'Here are the top electronics options for India right now.',
    aiProducts: aiProducts.slice(0,3),
    serpProducts: serpResult.products,
    relatedSearches: serpResult.relatedSearches,
  }
  cache.set(cacheKey, { result, ts:Date.now() })
  return result
}
