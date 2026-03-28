// src/lib/search.ts
// ProductRating.in — World-Class Electronics Recommendation Engine v4
// Pipeline: Query Analysis → Candidate Pool → Multi-Factor Scoring → Successor Check → Location Filter → Top 3 → Price Enrichment

import { searchGoogleShopping, buildProductContext, type SerpSearchResult } from './serpapi'

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type PlatformPrice = {
  platform: string
  price: string
  price_numeric: number
  url: string
  availability: 'in_stock' | 'limited' | 'out_of_stock' | 'unknown'
  is_lowest: boolean
}

export type AiProduct = {
  name: string
  price: string
  seller: string
  rating: number            // PR Score (fake-adjusted)
  platform_rating: number   // Raw weighted platform avg
  reviews: string           // Combined cross-platform count
  badge: string
  reason: string
  pros: string[]
  cons: string[]
  avoid_if: string
  score?: number            // Algorithm score /100
  successor_of?: string     // If this is recommended over an older model
  platform_prices?: PlatformPrice[]
  best_price?: string
  best_price_platform?: string
  best_price_url?: string
}

export type SearchResult = {
  answer: string
  aiProducts: AiProduct[]
  serpProducts: SerpSearchResult['products']
  relatedSearches: string[]
  isOutOfScope?: boolean
  location_used?: string    // What location was applied
  algorithm_version: string
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS & CACHE
// ─────────────────────────────────────────────────────────────────────────────

const cache = new Map<string, { result: SearchResult; ts: number }>()
const CACHE_TTL = 20 * 60 * 1000  // 20 min — electronics prices change

const ALGORITHM_VERSION = 'PRv4.0-electronics'

// ─────────────────────────────────────────────────────────────────────────────
// SCOPE GATE — Electronics only
// ─────────────────────────────────────────────────────────────────────────────

const ELECTRONICS_RE = [
  /\b(phone|mobile|smartphone|5g|foldable|flip phone|iphone|android)\b/i,
  /\b(laptop|notebook|ultrabook|gaming laptop|chromebook|macbook)\b/i,
  /\b(tablet|ipad|android tablet|e-reader|kindle)\b/i,
  /\b(tv|television|smart tv|oled|qled|4k|8k|projector|monitor)\b/i,
  /\b(ac|air conditioner|inverter ac|split ac|window ac)\b/i,
  /\b(refrigerator|fridge|freezer)\b/i,
  /\b(washing machine|washer|dryer|front load|top load)\b/i,
  /\b(earbuds|earphone|headphone|tws|neckband|iem|in-ear)\b/i,
  /\b(speaker|soundbar|home theatre|subwoofer|bluetooth speaker)\b/i,
  /\b(smartwatch|smart watch|fitness band|wearable|fitness tracker)\b/i,
  /\b(camera|dslr|mirrorless|action cam|webcam|dashcam|cctv)\b/i,
  /\b(microwave|oven|air fryer|mixer grinder|induction|electric kettle|toaster)\b/i,
  /\b(vacuum cleaner|robot vacuum|air purifier|water purifier|ro|geyser|water heater|dishwasher)\b/i,
  /\b(trimmer|shaver|hair dryer|straightener|epilator)\b/i,
  /\b(power bank|charger|ssd|hard disk|hdd|pendrive|memory card|router|wifi)\b/i,
  /\b(gaming|console|playstation|xbox|nintendo|controller|gpu|graphics card|cpu|processor|ram|motherboard)\b/i,
  /\b(printer|scanner|ups|stabilizer|extension board|smart home|smart plug|smart bulb)\b/i,
]
const NON_ELECTRONICS_RE = [
  /\b(recipe|food|restaurant|hotel|travel|flight|visa|insurance|mutual fund|stock market|loan|credit card)\b/i,
  /\b(fashion|clothing|cloth|dress|shirt|shoe|bag|jewellery|jewelry|saree|kurta)\b/i,
  /\b(book|novel|fiction|textbook|comic|magazine)\b/i,
  /\b(medicine|doctor|hospital|health advice|diet|nutrition)\b/i,
  /\b(school|college|university|course|exam|career|job|salary|internship)\b/i,
]

function isElectronics(q: string): boolean {
  if (NON_ELECTRONICS_RE.some(p => p.test(q))) return false
  return ELECTRONICS_RE.some(p => p.test(q))
}

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY DETECTION
// ─────────────────────────────────────────────────────────────────────────────

type Cat =
  | 'smartphone' | 'laptop' | 'tablet' | 'tv'
  | 'ac' | 'refrigerator' | 'washing_machine'
  | 'audio_tws' | 'audio_headphone' | 'audio_speaker' | 'soundbar'
  | 'smartwatch' | 'camera' | 'kitchen_appliance'
  | 'personal_care' | 'air_purifier' | 'water_purifier'
  | 'accessory_storage' | 'accessory_power' | 'accessory_network'
  | 'gaming_console' | 'gaming_pc_component' | 'smart_home'
  | 'generic_electronics'

function detectCat(q: string): Cat {
  const t = q.toLowerCase()
  if (/\b(phone|mobile|smartphone|5g phone|foldable|iphone|pixel|galaxy s|oneplus|redmi|realme phone|poco phone|vivo|iqoo|nothing phone|cmf phone|motorola edge|moto g)\b/.test(t)) return 'smartphone'
  if (/\b(laptop|notebook|ultrabook|gaming laptop|chromebook|macbook|thinkpad|ideapad|vivobook|inspiron|pavilion|victus|rog|tuf gaming)\b/.test(t)) return 'laptop'
  if (/\b(tablet|ipad|tab|android tablet|e-reader|kindle|galaxy tab|redmi pad|realme pad)\b/.test(t)) return 'tablet'
  if (/\b(tv|television|smart tv|oled tv|qled tv|4k tv|8k tv|projector|monitor|display)\b/.test(t)) return 'tv'
  if (/\b(ac|air conditioner|inverter ac|split ac|window ac|cassette ac|portable ac)\b/.test(t)) return 'ac'
  if (/\b(refrigerator|fridge|freezer)\b/.test(t)) return 'refrigerator'
  if (/\b(washing machine|washer|front load|top load|semi-automatic|fully automatic)\b/.test(t)) return 'washing_machine'
  if (/\b(tws|true wireless|earbuds|in-ear|iem|wireless earphone)\b/.test(t)) return 'audio_tws'
  if (/\b(headphone|over ear|on ear|wired headphone|headset|neckband)\b/.test(t)) return 'audio_headphone'
  if (/\b(bluetooth speaker|portable speaker|wireless speaker|party speaker|speaker box)\b/.test(t)) return 'audio_speaker'
  if (/\b(soundbar|home theatre|home theater|subwoofer|surround sound)\b/.test(t)) return 'soundbar'
  if (/\b(smartwatch|smart watch|fitness band|fitness tracker|wearable|band)\b/.test(t)) return 'smartwatch'
  if (/\b(camera|dslr|mirrorless|action camera|gopro|dashcam|cctv|security camera|webcam)\b/.test(t)) return 'camera'
  if (/\b(microwave|oven|air fryer|mixer|grinder|food processor|induction|electric kettle|toaster|sandwich maker|juicer|blender)\b/.test(t)) return 'kitchen_appliance'
  if (/\b(trimmer|shaver|hair dryer|hair straightener|epilator|face wash|beard)\b/.test(t)) return 'personal_care'
  if (/\b(air purifier|hepa filter|pm2\.5)\b/.test(t)) return 'air_purifier'
  if (/\b(water purifier|ro|ro purifier|water filter|alkaline water)\b/.test(t)) return 'water_purifier'
  if (/\b(ssd|hard disk|hdd|pendrive|usb drive|memory card|sd card|storage)\b/.test(t)) return 'accessory_storage'
  if (/\b(power bank|charger|gan charger|wireless charger|cable|adapter|ups|stabilizer|extension|inverter)\b/.test(t)) return 'accessory_power'
  if (/\b(router|wifi|mesh|modem|network|extender|access point)\b/.test(t)) return 'accessory_network'
  if (/\b(console|playstation|ps5|xbox|nintendo|switch)\b/.test(t)) return 'gaming_console'
  if (/\b(gpu|graphics card|cpu|processor|ram|motherboard|cooler|cabinet|psu|power supply)\b/.test(t)) return 'gaming_pc_component'
  if (/\b(smart plug|smart bulb|smart switch|alexa|google home|smart home|robot vacuum|vacuum cleaner|robovac|geyser|water heater|dishwasher)\b/.test(t)) return 'smart_home'
  return 'generic_electronics'
}

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY-SPECIFIC SCORING WEIGHTS
// Different categories need different emphasis
// ─────────────────────────────────────────────────────────────────────────────

type ScoringWeights = {
  relevance: number      // /30
  recency: number        // /20
  review_volume: number  // /20
  pr_score: number       // /15 (fake-adjusted weighted rating)
  value_for_money: number // /10
  service_warranty: number // /5
}

function getCategoryWeights(cat: Cat): ScoringWeights {
  // Appliances: recency less important (they last 7-10 years, 2022 model still valid)
  // Audio accessories: review volume very important due to high fake review risk
  // Phones/Laptops: recency critical (tech moves fast)
  const weights: Record<string, ScoringWeights> = {
    smartphone:          { relevance:30, recency:22, review_volume:18, pr_score:15, value_for_money:10, service_warranty:5 },
    laptop:              { relevance:30, recency:20, review_volume:16, pr_score:16, value_for_money:12, service_warranty:6 },
    tablet:              { relevance:30, recency:18, review_volume:18, pr_score:16, value_for_money:12, service_warranty:6 },
    tv:                  { relevance:30, recency:16, review_volume:20, pr_score:16, value_for_money:12, service_warranty:6 },
    ac:                  { relevance:30, recency:12, review_volume:22, pr_score:16, value_for_money:10, service_warranty:10 },
    refrigerator:        { relevance:30, recency:10, review_volume:24, pr_score:16, value_for_money:10, service_warranty:10 },
    washing_machine:     { relevance:30, recency:10, review_volume:22, pr_score:16, value_for_money:10, service_warranty:12 },
    audio_tws:           { relevance:30, recency:20, review_volume:15, pr_score:18, value_for_money:12, service_warranty:5 },
    audio_headphone:     { relevance:30, recency:18, review_volume:17, pr_score:18, value_for_money:12, service_warranty:5 },
    audio_speaker:       { relevance:30, recency:16, review_volume:18, pr_score:18, value_for_money:12, service_warranty:6 },
    soundbar:            { relevance:30, recency:14, review_volume:20, pr_score:18, value_for_money:12, service_warranty:6 },
    smartwatch:          { relevance:30, recency:22, review_volume:16, pr_score:16, value_for_money:12, service_warranty:4 },
    camera:              { relevance:30, recency:16, review_volume:18, pr_score:18, value_for_money:10, service_warranty:8 },
    kitchen_appliance:   { relevance:30, recency:8,  review_volume:26, pr_score:16, value_for_money:10, service_warranty:10 },
    personal_care:       { relevance:30, recency:16, review_volume:20, pr_score:18, value_for_money:12, service_warranty:4 },
    air_purifier:        { relevance:30, recency:14, review_volume:22, pr_score:16, value_for_money:10, service_warranty:8 },
    water_purifier:      { relevance:30, recency:12, review_volume:22, pr_score:16, value_for_money:10, service_warranty:10 },
    accessory_storage:   { relevance:30, recency:18, review_volume:18, pr_score:18, value_for_money:14, service_warranty:2 },
    accessory_power:     { relevance:30, recency:16, review_volume:18, pr_score:18, value_for_money:14, service_warranty:4 },
    accessory_network:   { relevance:30, recency:18, review_volume:18, pr_score:16, value_for_money:14, service_warranty:4 },
    gaming_console:      { relevance:30, recency:20, review_volume:20, pr_score:16, value_for_money:8,  service_warranty:6 },
    gaming_pc_component: { relevance:30, recency:22, review_volume:16, pr_score:18, value_for_money:10, service_warranty:4 },
    smart_home:          { relevance:30, recency:14, review_volume:20, pr_score:16, value_for_money:12, service_warranty:8 },
  }
  return weights[cat] || { relevance:30, recency:16, review_volume:20, pr_score:16, value_for_money:12, service_warranty:6 }
}

// ─────────────────────────────────────────────────────────────────────────────
// FAKE REVIEW MULTIPLIERS (India-specific brand research)
// ─────────────────────────────────────────────────────────────────────────────

function getFakeMultiplier(brand: string, cat: Cat): number {
  const b = brand.toLowerCase()
  // Very high fake risk — primarily budget India brands with known paid review history
  const vhigh = ['boat','noise','boult','zebronics','ptron','wings','truke','hammer','mivi','crossbeats','digitek','f&d','fingers','portronics budget','amkette','intex','lava audio']
  // High fake risk — aggressive marketing, launch discounts tied to reviews
  const high = ['realme','iqoo launch','poco launch','infinix','tecno','lava phone','micromax','itel','symphony','gionee','yu']
  // Medium — some fake reviews especially during launches, mostly genuine
  const medium = ['redmi','xiaomi mi','vivo','oppo','oneplus budget','nothing cmf','motorola budget','jbl budget','philips budget','havells budget','orient','usha budget']
  // Low — established brands with review moderation, fewer incentivised reviews
  const low = ['samsung','sony','lg','apple','bose','sennheiser','jbl premium','motorola flagship','nokia','voltas','daikin','hitachi','whirlpool','godrej','bosch','siemens','panasonic','toshiba','haier premium','blue star','carrier','honeywell','dyson','philips premium','havells premium','bajaj electricals','crompton','orient premium']

  if (vhigh.some(r => b.includes(r))) return 0.68
  if (high.some(r => b.includes(r)))  return 0.79
  if (medium.some(r => b.includes(r))) return 0.87
  if (low.some(r => b.includes(r)))   return 0.94

  // Category defaults
  if (cat === 'audio_tws' || cat === 'audio_speaker') return 0.72  // Very high fake in budget audio
  if (cat === 'accessory_power' || cat === 'accessory_storage') return 0.74
  if (cat === 'smartphone') return 0.83
  if (cat === 'ac' || cat === 'refrigerator' || cat === 'washing_machine') return 0.91
  if (cat === 'kitchen_appliance') return 0.85
  return 0.84
}

// ─────────────────────────────────────────────────────────────────────────────
// LOCATION PROFILES — 20 cities + state fallbacks
// ─────────────────────────────────────────────────────────────────────────────

type CityProfile = {
  label: string; climate: string; peak_temp: number
  humidity: 'low'|'moderate'|'high'|'very_high'
  water_tds: 'soft'|'moderate'|'hard'|'very_hard'
  power: 'stable'|'moderate'|'frequent_cuts'
  service_hub: boolean; aqi: 'good'|'moderate'|'poor'|'very_poor'
  boost: string[]    // Feature keywords → +pts
  penalty: string[]  // Absence of these → -pts
  best_brands_service: string[]
}

const CITY_DB: Record<string, CityProfile> = {
  'chennai':    { label:'Chennai', climate:'Hot+humid coastal', peak_temp:40, humidity:'very_high', water_tds:'hard', power:'moderate', service_hub:true,  aqi:'moderate',   boost:['humidity resistant','5-star energy','anti-corrosion','IP53','coastal protection','efficient cooling'], penalty:['no humidity protection'], best_brands_service:['Samsung','LG','Voltas','Daikin','Hitachi'] },
  'mumbai':     { label:'Mumbai',  climate:'Hot+humid coastal', peak_temp:38, humidity:'very_high', water_tds:'moderate', power:'stable', service_hub:true, aqi:'moderate',   boost:['compact','humidity resistant','monsoon proof','IP rating','anti-rust'], penalty:['large footprint'], best_brands_service:['Samsung','LG','Sony','Voltas','Whirlpool'] },
  'delhi':      { label:'Delhi',   climate:'Extreme heat+cold+dusty', peak_temp:48, humidity:'low', water_tds:'very_hard', power:'frequent_cuts', service_hub:true,  aqi:'very_poor', boost:['hot+cold','PM2.5 filter','dust filter','hard water','inverter','auto-restart','voltage protection'], penalty:['single season','no dust filter','no hard water support'], best_brands_service:['Samsung','Voltas','LG','Daikin','Carrier'] },
  'bengaluru':  { label:'Bengaluru', climate:'Mild pleasant', peak_temp:35, humidity:'moderate', water_tds:'moderate', power:'stable', service_hub:true,  aqi:'moderate',   boost:['smart features','energy efficient','wifi enabled','warranty'], penalty:[], best_brands_service:['Samsung','Sony','LG','Apple','Voltas'] },
  'hyderabad':  { label:'Hyderabad', climate:'Hot+dry', peak_temp:43, humidity:'low', water_tds:'hard', power:'moderate', service_hub:true,  aqi:'moderate',   boost:['5-star energy','dust filter','hard water','powerful cooling'], penalty:['no energy rating'], best_brands_service:['LG','Samsung','Voltas','Daikin'] },
  'kolkata':    { label:'Kolkata', climate:'Hot+humid', peak_temp:40, humidity:'high', water_tds:'soft', power:'moderate', service_hub:true,  aqi:'poor',       boost:['humidity resistant','mosquito protection','efficient cooling'], penalty:[], best_brands_service:['Samsung','LG','Voltas','Hitachi'] },
  'pune':       { label:'Pune',    climate:'Moderate', peak_temp:38, humidity:'moderate', water_tds:'hard', power:'stable', service_hub:true,  aqi:'moderate',   boost:['energy efficient','hard water','value for money'], penalty:[], best_brands_service:['Samsung','LG','Sony','Voltas'] },
  'ahmedabad':  { label:'Ahmedabad', climate:'Extreme heat+dry', peak_temp:47, humidity:'low', water_tds:'very_hard', power:'frequent_cuts', service_hub:false, aqi:'poor',       boost:['inverter','5-star','hard water filter','voltage protection','auto-restart'], penalty:['no inverter','poor heat handling'], best_brands_service:['LG','Voltas','Samsung'] },
  'jaipur':     { label:'Jaipur',  climate:'Extreme heat+cold+dusty', peak_temp:46, humidity:'low', water_tds:'very_hard', power:'frequent_cuts', service_hub:false, aqi:'poor',  boost:['hot+cold','dust filter','inverter','hard water','auto-restart'], penalty:['cooling only','no dust filter'], best_brands_service:['Voltas','LG','Samsung'] },
  'lucknow':    { label:'Lucknow', climate:'Hot+humid summers + cold winters', peak_temp:44, humidity:'moderate', water_tds:'hard', power:'frequent_cuts', service_hub:false, aqi:'very_poor', boost:['hot+cold','inverter','hard water','power cut protection'], penalty:[], best_brands_service:['Samsung','LG','Voltas'] },
  'chandigarh': { label:'Chandigarh', climate:'Hot summers+cold winters', peak_temp:44, humidity:'moderate', water_tds:'hard', power:'stable', service_hub:false, aqi:'moderate',  boost:['hot+cold','inverter','energy efficient'], penalty:[], best_brands_service:['Samsung','LG','Voltas'] },
  'kochi':      { label:'Kochi',   climate:'Hot+humid tropical', peak_temp:36, humidity:'very_high', water_tds:'soft', power:'stable', service_hub:false, aqi:'good',      boost:['humidity resistant','IP rating','anti-salt','tropical performance'], penalty:['no coastal protection'], best_brands_service:['LG','Samsung','Daikin','Voltas'] },
  'indore':     { label:'Indore',  climate:'Hot dry+cold winters', peak_temp:43, humidity:'low', water_tds:'hard', power:'moderate', service_hub:false, aqi:'moderate',   boost:['inverter','5-star','hard water','hot+cold'], penalty:[], best_brands_service:['LG','Samsung','Voltas'] },
  'noida':      { label:'Noida/NCR', climate:'Extreme heat+cold+dusty', peak_temp:48, humidity:'low', water_tds:'very_hard', power:'moderate', service_hub:true,  aqi:'very_poor', boost:['PM2.5 filter','hot+cold','hard water','smart home','inverter'], penalty:['no AQI protection'], best_brands_service:['Samsung','LG','Voltas','Daikin'] },
  'gurgaon':    { label:'Gurgaon/NCR', climate:'Extreme heat+cold+dusty', peak_temp:48, humidity:'low', water_tds:'very_hard', power:'moderate', service_hub:true,  aqi:'very_poor', boost:['PM2.5 filter','hot+cold','smart features','inverter','app control'], penalty:[], best_brands_service:['Samsung','LG','Voltas','Daikin'] },
  'coimbatore': { label:'Coimbatore', climate:'Moderate+industrial', peak_temp:38, humidity:'moderate', water_tds:'moderate', power:'stable', service_hub:false, aqi:'moderate',  boost:['energy efficient','durable'], penalty:[], best_brands_service:['LG','Samsung','Voltas'] },
  'visakhapatnam': { label:'Visakhapatnam', climate:'Hot+humid coastal', peak_temp:38, humidity:'very_high', water_tds:'moderate', power:'moderate', service_hub:false, aqi:'moderate', boost:['humidity resistant','coastal protection','IP rating'], penalty:[], best_brands_service:['LG','Samsung','Voltas'] },
  'nagpur':     { label:'Nagpur',  climate:'Extreme heat', peak_temp:47, humidity:'low', water_tds:'hard', power:'moderate', service_hub:false, aqi:'moderate',   boost:['5-star energy','powerful cooling','hard water'], penalty:[], best_brands_service:['Voltas','LG','Samsung'] },
  'bhopal':     { label:'Bhopal',  climate:'Hot+moderate', peak_temp:43, humidity:'moderate', water_tds:'moderate', power:'moderate', service_hub:false, aqi:'moderate',   boost:['energy efficient','inverter'], penalty:[], best_brands_service:['LG','Samsung','Voltas'] },
  'patna':      { label:'Patna',   climate:'Hot+humid + cold winters', peak_temp:44, humidity:'high', water_tds:'hard', power:'frequent_cuts', service_hub:false, aqi:'very_poor', boost:['inverter','auto-restart','humidity','hard water'], penalty:[], best_brands_service:['Samsung','LG','Voltas'] },
}

function getCityProfile(loc: string): CityProfile | null {
  const l = loc.toLowerCase().trim()
  for (const [key, p] of Object.entries(CITY_DB)) {
    if (l.includes(key) || key.includes(l)) return p
  }
  // State fallbacks
  if (/rajasthan|gujarat|haryana north|up west/.test(l))
    return { label:loc, climate:'Hot dry+cold winters', peak_temp:46, humidity:'low', water_tds:'very_hard', power:'frequent_cuts', service_hub:false, aqi:'poor', boost:['inverter','hot+cold','hard water','voltage protection'], penalty:['no inverter'], best_brands_service:['Voltas','LG','Samsung'] }
  if (/kerala|goa|coastal karnataka|coastal andhra|coastal odisha/.test(l))
    return { label:loc, climate:'Hot+humid tropical', peak_temp:37, humidity:'very_high', water_tds:'soft', power:'stable', service_hub:false, aqi:'good', boost:['humidity resistant','IP rating','coastal'], penalty:[], best_brands_service:['LG','Samsung','Daikin'] }
  if (/himachal|uttarakhand|jammu|kashmir|northeast|sikkim/.test(l))
    return { label:loc, climate:'Cold mountain', peak_temp:28, humidity:'moderate', water_tds:'soft', power:'frequent_cuts', service_hub:false, aqi:'good', boost:['heating mode','all-weather','voltage protection'], penalty:['cooling only'], best_brands_service:['LG','Samsung'] }
  if (/up east|bihar|jharkhand|chhattisgarh|odisha/.test(l))
    return { label:loc, climate:'Hot humid+cold winters', peak_temp:44, humidity:'high', water_tds:'hard', power:'frequent_cuts', service_hub:false, aqi:'very_poor', boost:['inverter','auto-restart','humidity','hard water'], penalty:[], best_brands_service:['Samsung','LG','Voltas'] }
  if (/tamil nadu|andhra|telangana|karnataka/.test(l))
    return { label:loc, climate:'Hot+humid', peak_temp:40, humidity:'high', water_tds:'hard', power:'moderate', service_hub:false, aqi:'moderate', boost:['5-star energy','humidity','hard water'], penalty:[], best_brands_service:['LG','Samsung','Voltas','Daikin'] }
  return null
}

// ─────────────────────────────────────────────────────────────────────────────
// MARKETPLACE UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

const MARKETPLACES: Record<string, string> = {
  'amazon': 'Amazon', 'flipkart': 'Flipkart', 'croma': 'Croma',
  'reliance digital': 'Reliance Digital', 'reliance': 'Reliance Digital',
  'vijay sales': 'Vijay Sales', 'vijaysales': 'Vijay Sales',
  'tata cliq': 'Tata Cliq', 'tatacliq': 'Tata Cliq',
  'meesho': 'Meesho', 'jiomart': 'JioMart', 'jio mart': 'JioMart',
  'snapdeal': 'Snapdeal', 'paytm mall': 'Paytm Mall',
}

function isMarketplace(src: string): boolean {
  const s = src.toLowerCase()
  return Object.keys(MARKETPLACES).some(k => s.includes(k))
}

function normaliseMarketplace(src: string): string {
  const s = src.toLowerCase()
  for (const [k, v] of Object.entries(MARKETPLACES)) if (s.includes(k)) return v
  return 'Amazon'  // Default brand sites → Amazon
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
  if (m.includes('meesho'))   return `https://www.meesho.com/search?q=${q}`
  if (m.includes('jio'))      return `https://www.jiomart.com/search/${q}`
  return `https://www.amazon.in/s?k=${q}`
}

// ─────────────────────────────────────────────────────────────────────────────
// SUCCESSOR SERIES DATABASE — All electronics categories
// ─────────────────────────────────────────────────────────────────────────────

// Map: old model keywords → newer model to recommend
const SUCCESSOR_MAP: Array<{ old: RegExp; new_model: string; category: string }> = [
  // SMARTPHONES
  { old: /redmi note 1[23]\b/i, new_model: 'Redmi Note 14 5G', category: 'smartphone' },
  { old: /redmi 1[23]\b/i,      new_model: 'Redmi 15 5G',      category: 'smartphone' },
  { old: /samsung.?m3[34]\b/i,  new_model: 'Samsung Galaxy M35 5G', category: 'smartphone' },
  { old: /samsung.?m1[45]\b/i,  new_model: 'Samsung Galaxy M15 5G', category: 'smartphone' },
  { old: /narzo 60x?\b/i,       new_model: 'Realme Narzo 80 Pro 5G', category: 'smartphone' },
  { old: /narzo 6[0-9]\b/i,     new_model: 'Realme Narzo 80 5G', category: 'smartphone' },
  { old: /iqoo z7\b/i,          new_model: 'iQOO Z9x 5G',      category: 'smartphone' },
  { old: /iqoo z[0-6]\b/i,      new_model: 'iQOO Z9 5G',       category: 'smartphone' },
  { old: /nord ce 3\b/i,        new_model: 'OnePlus Nord CE 4', category: 'smartphone' },
  { old: /poco m[56]\b/i,       new_model: 'POCO M7 Pro 5G',   category: 'smartphone' },
  { old: /poco x[45]\b/i,       new_model: 'POCO X7 Pro',      category: 'smartphone' },
  { old: /galaxy a3[45]\b/i,    new_model: 'Samsung Galaxy A36 5G', category: 'smartphone' },
  { old: /galaxy a1[45]\b/i,    new_model: 'Samsung Galaxy A16 5G', category: 'smartphone' },
  { old: /moto g7[34]\b/i,      new_model: 'Motorola Moto G96 5G', category: 'smartphone' },
  { old: /moto g8[45]\b/i,      new_model: 'Motorola Edge 50 Neo', category: 'smartphone' },
  { old: /realme 1[123]\b/i,    new_model: 'Realme 14 Pro 5G', category: 'smartphone' },
  { old: /realme p[123]\b/i,    new_model: 'Realme P4 5G',     category: 'smartphone' },
  { old: /cmf phone 1\b/i,      new_model: 'CMF Phone 2 Pro',  category: 'smartphone' },
  { old: /vivo t[12]\b/i,       new_model: 'Vivo T4 5G',       category: 'smartphone' },
  // LAPTOPS
  { old: /i5.1[0-2]th|i7.1[0-2]th/i, new_model: 'Intel Core Ultra 5/7 (2024 gen)', category: 'laptop' },
  { old: /ryzen [57].5[0-9]{3}/i,     new_model: 'AMD Ryzen 5/7 8000 series (2024)', category: 'laptop' },
  // TVs
  { old: /samsung.?(crystal|bu|cu)8[0-9]{3}/i, new_model: 'Samsung Crystal 4K (2024 DU series)', category: 'tv' },
  { old: /lg.?nanocell.?202[12]/i,              new_model: 'LG NanoCell 4K (2024)',                category: 'tv' },
  { old: /sony.?x74k\b/i,                       new_model: 'Sony Bravia X75L (2024)',              category: 'tv' },
  // ACs
  { old: /lg.?dual.?inverter.?202[12]/i, new_model: 'LG DUAL Inverter (2024 AI+)',  category: 'ac' },
  { old: /daikin.?ftkf/i,                new_model: 'Daikin FTKP/FTKG (2024)',      category: 'ac' },
  // AUDIO
  { old: /wf.1000xm4\b/i,   new_model: 'Sony WF-1000XM5',    category: 'audio_tws' },
  { old: /galaxy buds 2\b/i, new_model: 'Samsung Galaxy Buds 3', category: 'audio_tws' },
  { old: /nothing ear [12]\b/i, new_model: 'Nothing Ear (a) 2024', category: 'audio_tws' },
  { old: /cmf buds pro\b/i,  new_model: 'CMF Buds Pro 2',    category: 'audio_tws' },
  { old: /oneplus buds 2\b/i, new_model: 'OnePlus Buds 3',   category: 'audio_tws' },
  { old: /buds air [123]\b/i, new_model: 'Realme Buds Air 5', category: 'audio_tws' },
  { old: /wh.1000xm[34]\b/i, new_model: 'Sony WH-1000XM5',  category: 'audio_headphone' },
  // SMARTWATCHES
  { old: /galaxy watch [45]\b/i, new_model: 'Samsung Galaxy Watch 7', category: 'smartwatch' },
  { old: /cmf watch pro\b(?! 2)/i, new_model: 'CMF Watch Pro 2',     category: 'smartwatch' },
  { old: /gtr [34]\b/i,           new_model: 'Amazfit GTR 4 Mini',   category: 'smartwatch' },
  { old: /colorfit pro [34]\b/i,  new_model: 'Noise ColorFit Pro 5', category: 'smartwatch' },
  // WASHING MACHINES
  { old: /samsung.?6\.5kg.?202[12]/i, new_model: 'Samsung 7kg Front Load (2024)', category: 'washing_machine' },
  { old: /ifb.?senator\b(?! plus)/i,  new_model: 'IFB Senator Plus 8kg (2024)',   category: 'washing_machine' },
  // REFRIGERATORS
  { old: /samsung.?rt[0-9]+k[0-9]{4}202[12]/i, new_model: 'Samsung Frost Free (2024 RT series)', category: 'refrigerator' },
]

function checkSuccessor(productName: string, cat: Cat): string | null {
  for (const { old, new_model, category } of SUCCESSOR_MAP) {
    if (category === cat && old.test(productName)) return new_model
  }
  return null
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
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
  if (/\b(kaunsa|kaun sa|mein|ke andar|chahiye|konsa|wala|kya)\b/i.test(q)) return 'Respond in Hinglish.'
  return ''
}

function getLocation(city: string, state: string): string {
  const TIER1 = new Set(['delhi','new delhi','mumbai','bombay','bangalore','bengaluru','chennai','kolkata','calcutta','hyderabad','pune','ahmedabad'])
  const TIER2 = new Set(['surat','jaipur','lucknow','kanpur','nagpur','noida','gurgaon','gurugram','coimbatore','kochi','cochin','indore','chandigarh','bhopal','visakhapatnam','vizag','patna','bhubaneswar','dehradun','agra','varanasi','amritsar','ludhiana','nashik','thane','navi mumbai','ghaziabad','faridabad','meerut','rajkot'])
  const c = city.toLowerCase().trim()
  if (c && (TIER1.has(c) || TIER2.has(c))) return city
  if (c && c.length > 2) return city
  if (state && state.length > 2) return state
  return ''
}

function selectModel(q: string): string {
  // gpt-5.3-chat-latest: fast, no chain-of-thought leak, ideal for product queries
  // gpt-5.4: deep reasoning, but outputs CoT into answer — only for explicit comparisons
  return /\bcompare\b|\bvs\b|difference between.*and/i.test(q)
    ? 'gpt-5.4' : 'gpt-5.3-chat-latest'
}

function sanitise(p: Record<string,unknown>, i: number): AiProduct {
  const r = Math.min(4.8, Math.max(3.0, Number(p.rating)||4.0))
  const seller = normaliseMarketplace(String(p.seller||'Amazon'))
  return {
    name:            String(p.name||'').trim(),
    price:           String(p.price||'—'),
    seller,
    rating:          r,
    platform_rating: Math.min(5.0, Math.max(r+0.15, Number(p.platform_rating)||r+0.3)),
    reviews:         String(p.reviews||'').replace(/\s*\([^)]*\)/g,'').trim(),
    badge:           String(p.badge||['Best Pick','Best Value','Budget Pick'][i]||'Top Rated'),
    reason:          String(p.reason||''),
    pros:            Array.isArray(p.pros)?p.pros.slice(0,2).map(String):[],
    cons:            Array.isArray(p.cons)?p.cons.slice(0,1).map(String):[],
    avoid_if:        String(p.avoid_if||''),
    score:           Number(p.score||0),
    successor_of:    p.successor_of ? String(p.successor_of) : undefined,
    platform_prices: [],
    best_price: '', best_price_platform: '', best_price_url: '',
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PRICE ENRICHMENT — Skyscanner-style lowest price finder
// ─────────────────────────────────────────────────────────────────────────────

function enrichPrices(aiProducts: AiProduct[], serpProducts: SerpSearchResult['products']): AiProduct[] {
  return aiProducts.map(ai => {
    const nameWords = ai.name.toLowerCase().split(/\s+/).filter(w=>w.length>2).slice(0,6)

    // Match SERP results to this product (fuzzy keyword match, marketplace only)
    const matched = serpProducts.filter(sp => {
      if (!sp.title || !sp.price || !isMarketplace(sp.source)) return false
      const t = sp.title.toLowerCase()
      const hits = nameWords.filter(w => t.includes(w)).length
      return hits >= Math.min(3, Math.max(2, nameWords.length - 2))
    })

    // Build per-platform prices (lowest per marketplace)
    const byPlatform = new Map<string, { price_str:string; price_num:number; url:string }>()
    for (const sp of matched) {
      const key = normaliseMarketplace(sp.source)
      const priceNum = parseInt(sp.price.replace(/[^\d]/g,'')) || 0
      const existing = byPlatform.get(key)
      if (!existing || priceNum < existing.price_num) {
        byPlatform.set(key, {
          price_str: sp.price,
          price_num: priceNum,
          url: (sp.link && isMarketplace(sp.source)) ? sp.link : buildSearchUrl(key, ai.name),
        })
      }
    }

    // Build platform_prices array, always include Amazon + Flipkart fallback
    const MUST_INCLUDE = ['Amazon','Flipkart']
    for (const m of MUST_INCLUDE) {
      if (!byPlatform.has(m)) {
        byPlatform.set(m, { price_str:'—', price_num:999999, url:buildSearchUrl(m, ai.name) })
      }
    }

    // Sort by price (lowest first, unknowns at end)
    const entries = Array.from(byPlatform.entries())
      .sort((a,b) => {
        if (a[1].price_num === 999999) return 1
        if (b[1].price_num === 999999) return -1
        return a[1].price_num - b[1].price_num
      })
      .slice(0,5)

    const platform_prices: PlatformPrice[] = entries.map(([platform, data], idx) => ({
      platform,
      price: data.price_str,
      price_numeric: data.price_num,
      url: data.url,
      availability: data.price_num === 999999 ? 'unknown' : 'in_stock',
      is_lowest: idx === 0 && data.price_num !== 999999,
    }))

    const best = platform_prices.find(p => p.is_lowest) || platform_prices[0]

    return {
      ...ai,
      platform_prices,
      best_price: best?.price_numeric !== 999999 ? best?.price || ai.price : ai.price,
      best_price_platform: best?.platform || ai.seller,
      best_price_url: best?.url || buildSearchUrl('amazon', ai.name),
      // Update displayed price/seller to cheapest found
      price: best?.price_numeric !== 999999 ? best?.price || ai.price : ai.price,
      seller: best?.platform || ai.seller,
    }
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// THE CORE AI CALL — OpenAI with full algorithm injected
// ─────────────────────────────────────────────────────────────────────────────

async function callOpenAI(
  question: string, serpContext: string, loc: string, lang: string,
  monthYear: string, currentYear: number, cat: Cat, weights: ScoringWeights,
  model: string, apiKey: string
): Promise<{ answer: string; products: unknown[] }> {

  const cityProfile = getCityProfile(loc)
  const yr = currentYear

  const cityBlock = cityProfile ? `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LOCATION: ${cityProfile.label.toUpperCase()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Climate: ${cityProfile.climate} (peak ${cityProfile.peak_temp}°C)
Humidity: ${cityProfile.humidity} | Water TDS: ${cityProfile.water_tds}
Power stability: ${cityProfile.power} | Air quality: ${cityProfile.aqi}
Service centre availability: ${cityProfile.service_hub ? 'Major hub — all brands present' : 'Limited — pan-India service network critical'}
Trusted service brands in ${cityProfile.label}: ${cityProfile.best_brands_service.join(', ')}

LOCATION SCORING ADJUSTMENTS:
+4 pts each if product has: ${cityProfile.boost.join(' | ')}
-4 pts each if product lacks: ${cityProfile.penalty.join(' | ')}
-5 pts if brand has NO authorised service centre in/near ${cityProfile.label}
` : (loc ? `Location: ${loc} — apply relevant India regional adjustments for climate, power, water quality.` : `No specific location — recommend for all-India use.`)

  const systemPrompt = `You are ProductRating.in — India's most trusted electronics scoring engine. Today: ${monthYear}.
${lang ? lang + '\n' : ''}

══════════════════════════════════════════════════════════════════
PRODUCTRATING ALGORITHM v4.0 — ${ALGORITHM_VERSION}
Target: Find the 3 BEST electronics products for this exact query
══════════════════════════════════════════════════════════════════

⚠️  CRITICAL OUTPUT RULES:
1. The "answer" field must be 2-3 sentences of DIRECT BUYING ADVICE — no thinking, no methodology explanation
2. Do NOT start answer with "Okay", "Let me", "I need to", "The user wants", "First I will" or any reasoning language
3. The answer should read like a confident expert recommendation, e.g.: "For under ₹20,000, the iQOO Z9x leads on performance while Redmi Note 14 Pro wins on camera. Both are 2025 models worth considering."
4. All reasoning happens internally — NEVER put it in the answer field

PHASE 1 — CANDIDATE GENERATION (8–15 products)
───────────────────────────────────────────────
Generate a candidate pool from:
  A) Live SERP data provided below (ground truth for current Indian prices)
  B) Your own knowledge of Indian electronics market as of ${monthYear}
Include DIVERSE candidates — different brands, price points, positioning.
Do NOT pre-select — generate broadly, let scoring pick the best.

PHASE 2 — MULTI-FACTOR SCORING (max 100 pts)
─────────────────────────────────────────────
Score each candidate. Weights tuned for this category (${cat}):

[F1] RELEVANCE: ${weights.relevance} pts max
  • Exact match (right category + budget + use case + specs): full score
  • Minor mismatch (<10% budget gap, minor spec gap): 70% of score
  • Partial match: 40% of score
  • Wrong category → EXCLUDE (0 pts, skip)

[F2] RECENCY: ${weights.recency} pts max
  • ${yr} launch = ${weights.recency} pts (current year = full)
  • ${yr-1} launch = ${Math.round(weights.recency*0.85)} pts
  • ${yr-2} launch = ${Math.round(weights.recency*0.55)} pts
  • ${yr-3} launch = ${Math.round(weights.recency*0.25)} pts
  • Older = 0 pts — UNLESS Evergreen Exception applies

  ▸ EVERGREEN EXCEPTION (max ${Math.round(weights.recency*0.65)} pts):
    Older product may score if ALL 3 true:
    ✓ Still sold NEW on Amazon.in/Flipkart (not just resellers)
    ✓ 30,000+ combined reviews across all platforms
    ✓ Specs still genuinely competitive at that price in ${yr}

  ▸ SUCCESSOR UPGRADE RULE (MANDATORY):
    If any candidate is from 2022–2023 AND its series has launched a ${yr}/${yr-1}
    successor → REPLACE it with the successor in your candidate list.
    Inherit the series popularity: give successor +5 pts recency bonus.
    In "successor_of" field: name the older model that was popular.
    This ensures we ALWAYS recommend current models, not outdated ones.

    VERIFIED SUCCESSOR PAIRS (apply across all categories):
    Phones: Redmi Note 12/13→Note 14/15 | M33/M34→M35/M55 | Narzo 60x→Narzo 80
            iQOO Z7→Z9/Z9x | Nord CE 3→CE 4 | POCO M5/M6→M7 | A34→A36 | Moto G73→G96
    Laptops: 12th gen i5/i7→Core Ultra 5/7 | Ryzen 5xxx→Ryzen 8000 series
    TVs: Samsung BU/CU 2022→DU 2024 | LG NanoCell 2022→2024 | Sony X74K→X75L
    ACs: LG Dual Inverter 2021/2022→2024 gen | Daikin FTKF→FTKP 2024
    Audio: WF-1000XM4→XM5 | Galaxy Buds 2→Buds 3 | Nothing Ear 2→Ear (a) | CMF Buds Pro→Pro 2
    Watches: Galaxy Watch 4/5→Watch 7 | CMF Watch Pro→Pro 2 | GTR 3→GTR 4

[F3] CROSS-PLATFORM REVIEW VOLUME: ${weights.review_volume} pts max
  Aggregate reviews from ALL Indian platforms (use estimates if exact unavailable):
    Amazon.in (weight ×1.00) + Flipkart (×0.90) + Croma (×0.95) +
    Reliance Digital (×0.95) + Vijay Sales (×0.95) + Tata Cliq (×0.90) +
    Meesho/JioMart (×0.60 — high fake risk)

  Combined weighted count → score:
    60,000+  → ${weights.review_volume} pts (very high confidence)
    30,000–59,999 → ${Math.round(weights.review_volume*0.82)} pts
    12,000–29,999 → ${Math.round(weights.review_volume*0.62)} pts
    4,000–11,999  → ${Math.round(weights.review_volume*0.40)} pts
    1,000–3,999   → ${Math.round(weights.review_volume*0.20)} pts
    <1,000        → 0 pts (insufficient India market data)

  FAKE REVIEW PENALTY (deduct from F3 score):
    -5 pts: >85% 5-star with almost no negative reviews (impossible pattern)
    -5 pts: Spike of 8,000+ reviews in launch week 1 (paid campaign)
    -4 pts: Brand known for aggressive paid review campaigns
    -3 pts: Single-review-account pattern detected in review breakdown

[F4] PR SCORE (Fake-Adjusted Weighted Rating): ${weights.pr_score} pts max
  Step A: Weighted avg rating = Σ(platform_rating × weight × review_count) ÷ Σ(weight × review_count)
          This is "platform_rating" — what Amazon/Flipkart show combined
  
  Step B: Subtract fake inflation → PR Score ("rating" field):
    • Samsung/Sony/LG/Apple/Motorola flagship/Bose/Sennheiser: subtract 0.10–0.15
    • Redmi/Vivo/OnePlus/Realme flagship/iQOO/Nothing: subtract 0.20–0.30
    • Budget Realme/Redmi/POCO/Infinix/Tecno: subtract 0.30–0.40
    • boat/Noise/Boult/Zebronics/PTron/Truke: subtract 0.45–0.65
    • Launch-week spike brands: additional −0.15
  
  PR Score → score:
    4.5+    → ${weights.pr_score} pts
    4.2–4.49 → ${Math.round(weights.pr_score*0.82)} pts
    4.0–4.19 → ${Math.round(weights.pr_score*0.60)} pts
    3.7–3.99 → ${Math.round(weights.pr_score*0.35)} pts
    <3.7     → 0 pts

[F5] VALUE FOR MONEY: ${weights.value_for_money} pts max
  Specs/features delivered per rupee vs category average in India:
    Exceptional value (specs >> peers at same price): ${weights.value_for_money} pts
    Good value (competitive specs for price): ${Math.round(weights.value_for_money*0.75)} pts
    Average (fair): ${Math.round(weights.value_for_money*0.45)} pts
    Poor (overpriced for specs): ${Math.round(weights.value_for_money*0.15)} pts

[F6] INDIA SERVICE & WARRANTY: ${weights.service_warranty} pts max
  After-sales for user's location (${loc || 'general India'}):
    Authorised service centre in/near user city + 2yr+ warranty: ${weights.service_warranty} pts
    Service in city + standard 1yr warranty: ${Math.round(weights.service_warranty*0.65)} pts
    Service requires travel/courier: ${Math.round(weights.service_warranty*0.3)} pts
    Poor India service network: 0 pts

${cityBlock}

TOTAL SCORE = F1+F2+F3+F4+F5+F6 (max 100).
Tiebreaker: higher F4 (PR Score) wins.
Select TOP 3 by score.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 3 — RESPONSE FORMAT (JSON ONLY, no other text)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{
  "answer": "2-3 sentences of BUYING ADVICE ONLY — no reasoning, no thinking, no methodology. Just: what to buy, why, and key tradeoff for the user. Example: For under ₹20k in India, the iQOO Z9x leads on raw performance while Redmi Note 14 wins on camera. Both are 2025 models with strong service networks.",
  "products": [
    {
      "name": "Full Product Name with variant/storage/colour",
      "price": "₹XX,XXX",
      "seller": "Amazon",
      "rating": 4.2,
      "platform_rating": 4.6,
      "reviews": "52k",
      "badge": "Best Pick",
      "score": 87,
      "reason": "Why #1 for this query in ${loc||'India'} — cite specific algorithm factors",
      "pros": ["Specific factual pro relevant to ${loc||'India'}", "Specific factual pro 2"],
      "cons": ["Main real complaint from Indian buyer reviews"],
      "avoid_if": "Specific type of buyer who should not buy this",
      "successor_of": null
    },
    { "name":"Second Product","price":"₹XX,XXX","seller":"Flipkart","rating":4.0,"platform_rating":4.4,"reviews":"31k","badge":"Best Value","score":79,"reason":"...","pros":["...","..."],"cons":["..."],"avoid_if":"...","successor_of":null },
    { "name":"Third Product","price":"₹XX,XXX","seller":"Amazon","rating":3.8,"platform_rating":4.2,"reviews":"18k","badge":"Budget Pick","score":71,"reason":"...","pros":["...","..."],"cons":["..."],"avoid_if":"...","successor_of":null }
  ]
}`

  const userMsg = `Question: ${question}` +
    (loc ? `\nUser location: ${loc}` : '\nNo location provided — recommend for all-India use') +
    (serpContext
      ? `\n\nLive data from Indian shopping platforms (use as ground truth for current pricing and availability):\n${serpContext}\n\nStep 1: Generate 8–15 candidates combining live data + your India market knowledge.\nStep 2: Score each using the full algorithm.\nStep 3: Apply successor upgrades.\nStep 4: Return top 3 as JSON.`
      : `\n\nNo live shopping data. Use your knowledge of Indian electronics market as of ${monthYear}.\nStep 1: Generate 8–15 candidates.\nStep 2: Score each. Step 3: Apply successor upgrades. Step 4: Return top 3 as JSON.`)

  for (let attempt = 0; attempt <= 2; attempt++) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method:'POST',
        headers:{ 'Content-Type':'application/json', 'Authorization':`Bearer ${apiKey}` },
        body: JSON.stringify({
          model,
          messages:[{role:'system',content:systemPrompt},{role:'user',content:userMsg}],
          max_tokens: 2500,
          temperature: 0.25,
          response_format: { type:'json_object' },
        }),
      })
      if (res.status===429) { if(attempt<2) await new Promise(r=>setTimeout(r,1000*(attempt+1))); continue }
      const raw = await res.text()
      console.log(`[OpenAI:${model}] status=${res.status} len=${raw.length}`)
      if (!res.ok) { console.error('[OpenAI]',raw.slice(0,300)); return {answer:'',products:[]} }
      const d = JSON.parse(raw)
      const content:string = d?.choices?.[0]?.message?.content||'{}'
      console.log(`[OpenAI] preview: ${content.slice(0,200)}`)
      const parsed = JSON.parse(content)
      const prods = Array.isArray(parsed.products)?parsed.products:[]
      console.log(`[OpenAI] products:${prods.length}`)

      // Strip reasoning/CoT that reasoning models sometimes put in answer field
      let answer = String(parsed.answer||'')
      // If answer starts with reasoning patterns, extract just the buying advice
      const reasoningPatterns = [
        /^(okay|alright|sure|let me|i need to|i'll|i will|i should|first,|the user|to answer|looking at|based on|analyzing|let's start|step [0-9])/i,
        /^(okay,? the user|let me start|i need to generate|i'll generate|let me analyze)/i,
      ]
      for (const pat of reasoningPatterns) {
        if (pat.test(answer.trim())) {
          // Try to find the actual advice after the reasoning
          // Look for sentences that sound like recommendations
          const adviceMatch = answer.match(/(?:for (?:under|around)|the (?:best|top)|(?:i )?recommend|in (?:india|this price)|all three|between these)[^.!?]*[.!?]/i)
          if (adviceMatch) {
            // Find where actual advice starts
            const adviceIdx = answer.toLowerCase().indexOf(adviceMatch[0].toLowerCase())
            if (adviceIdx > 0 && adviceIdx < answer.length * 0.7) {
              answer = answer.slice(adviceIdx).split('\n')[0].trim()
            }
          }
          // If still looks like reasoning, use a generic fallback
          if (reasoningPatterns.some(p => p.test(answer.trim()))) {
            answer = ''  // Will use fallback below
          }
          break
        }
      }

      return { answer, products: prods }
    } catch(e) {
      console.error(`[OpenAI] attempt ${attempt+1}:`,String(e))
      if(attempt<2) await new Promise(r=>setTimeout(r,1000))
    }
  }
  return {answer:'',products:[]}
}

// ─────────────────────────────────────────────────────────────────────────────
// SARVAM FALLBACK
// ─────────────────────────────────────────────────────────────────────────────

async function callSarvam(q:string, ctx:string, loc:string, lang:string, monthYear:string, apiKey:string): Promise<{answer:string;products:unknown[]}> {
  const sp = `You are ProductRating.in electronics advisor. Today: ${monthYear}.${lang?' '+lang:''}${loc?' Location: '+loc+'.':''}
Generate 8 candidate electronics products. Score each /100: Relevance(30)+Recency(20)+Cross-platform reviews across Amazon+Flipkart+Croma(20)+Fake-adjusted rating(15)+Value(10)+Service(5).
Replace any 2022/2023 product with its 2024/2025 successor if available.
Select top 3. Output: 2 sentences advice then ---PRODUCTS--- then JSON array of 3 with:
name, price, seller(marketplace only), rating(PR Score after fake removal), platform_rating(weighted avg), reviews(combined count), badge, score, reason, pros(2), cons(1), avoid_if, successor_of(null or old model name)`
  const um = `Q: ${q}${loc?' Location: '+loc:''}${ctx?'\n\nLive prices:\n'+ctx:''}`
  for (let a=0;a<=3;a++) {
    try {
      const res = await fetch('https://api.sarvam.ai/v1/chat/completions',{
        method:'POST',headers:{'Content-Type':'application/json','api-subscription-key':apiKey},
        body:JSON.stringify({model:'sarvam-m',messages:[{role:'system',content:sp},{role:'user',content:um}],max_tokens:2000,temperature:0.25}),
      })
      if (res.status===429){if(a<3) await new Promise(r=>setTimeout(r,Math.min(1000*Math.pow(2,a),8000)));continue}
      if (!res.ok) return {answer:'',products:[]}
      const d = JSON.parse(await res.text())
      let c:string=d?.choices?.[0]?.message?.content||''
      let prev=''
      while(prev!==c){prev=c;c=c.replace(/<think>[\s\S]*?<\/think>/gi,'')}
      c=c.replace(/<\/?think[^>]*>/gi,'').trim()
      const si=c.search(/---PRODUCTS---/i)
      const answer=(si!==-1?c.slice(0,si):c.slice(0,400)).replace(/\*\*(.*?)\*\*/g,'$1').trim()
      const jp=si!==-1?c.slice(si+15):c
      const st=jp.indexOf('[');if(st===-1)return{answer,products:[]}
      let depth=0,end=-1
      for(let i=st;i<jp.length;i++){if(jp[i]==='[')depth++;else if(jp[i]===']'){depth--;if(depth===0){end=i;break}}}
      if(end===-1)return{answer,products:[]}
      try{return{answer,products:JSON.parse(jp.slice(st,end+1))}}catch{return{answer,products:[]}}
    } catch(e){console.error(`[Sarvam] attempt ${a+1}:`,String(e));if(a<3) await new Promise(r=>setTimeout(r,1000))}
  }
  return{answer:'',products:[]}
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN ENTRY POINT
// ─────────────────────────────────────────────────────────────────────────────

export async function runSearch(
  question:string, city='', state='',
  sarvamKey:string, openaiKey?:string
): Promise<SearchResult> {

  // Scope gate
  if (!isElectronics(question)) {
    return { answer:'', aiProducts:[], serpProducts:[], relatedSearches:[], isOutOfScope:true, algorithm_version:ALGORITHM_VERSION }
  }

  const cacheKey = `${question.toLowerCase().trim()}|${city}|${state}`
  const hit = cache.get(cacheKey)
  if (hit && Date.now()-hit.ts<CACHE_TTL) { console.log('[Search] cache hit'); return hit.result }

  const monthYear=getMonthYear(), currentYear=getYear()
  const lang=detectLang(question)
  const loc=getLocation(city,state)
  const model=selectModel(question)
  const cat=detectCat(question)
  const weights=getCategoryWeights(cat)

  console.log(`[Search] cat=${cat} model=${model} loc="${loc||'India-wide'}"`)

  // SERP — live prices from Google Shopping
  let serpResult:SerpSearchResult={products:[],relatedSearches:[],query:question}
  try { serpResult=await searchGoogleShopping(question); console.log(`[SERP] ${serpResult.products.length}`) }
  catch(e){console.error('[SERP]:',String(e))}
  const serpContext=buildProductContext(serpResult)

  // AI recommendation engine
  let answer='', rawProducts:unknown[]=[]

  if (openaiKey) {
    const r=await callOpenAI(question,serpContext,loc,lang,monthYear,currentYear,cat,weights,model,openaiKey)
    answer=r.answer; rawProducts=r.products
    // Auto-upgrade: if fast model returned nothing, retry with deep model
    if((!answer||rawProducts.length===0)&&model!=='gpt-5.4'){
      console.log('[Search] upgrading to gpt-5.4')
      const r2=await callOpenAI(question,serpContext,loc,lang,monthYear,currentYear,cat,weights,'gpt-5.4',openaiKey)
      if(r2.answer||r2.products.length>0){answer=r2.answer;rawProducts=r2.products}
    }
  }
  if(!answer&&rawProducts.length===0&&sarvamKey){
    const r=await callSarvam(question,serpContext,loc,lang,monthYear,sarvamKey)
    answer=r.answer;rawProducts=r.products
  }

  if(!answer&&rawProducts.length===0){
    return{answer:'AI temporarily unavailable. Please try again.',aiProducts:[],serpProducts:serpResult.products,relatedSearches:serpResult.relatedSearches,algorithm_version:ALGORITHM_VERSION}
  }

  // Sanitise AI products
  let aiProducts:AiProduct[]=(rawProducts as Record<string,unknown>[])
    .filter(p=>p&&typeof p.name==='string'&&p.name.length>2)
    .slice(0,3).map(sanitise)

  // Run successor check on sanitised products
  aiProducts=aiProducts.map(p=>{
    const successor=checkSuccessor(p.name,cat)
    if(successor&&!p.successor_of){
      return{...p,successor_of:p.name,name:successor}
    }
    return p
  })

  // SERP fill if AI returned fewer than 3
  if(aiProducts.length<3&&serpResult.products.length>0){
    const used=new Set(aiProducts.map(p=>p.name.toLowerCase()))
    const fill=serpResult.products
      .filter(sp=>sp.title&&sp.price&&isMarketplace(sp.source)&&!used.has(sp.title.toLowerCase()))
      .slice(0,3-aiProducts.length)
      .map((sp,i):AiProduct=>({
        name:sp.title,price:sp.price||'—',seller:normaliseMarketplace(sp.source),
        rating:sp.rating?Math.min(4.8,Math.max(3.0,Number(sp.rating))):4.0,
        platform_rating:sp.rating?Math.min(5.0,Number(sp.rating)+0.3):4.3,
        reviews:'',badge:(['Best Pick','Best Value','Budget Pick'][aiProducts.length+i])||'Top Rated',
        reason:`Top marketplace result for this query.`,
        pros:['Competitive price in India','Available on verified platform'],
        cons:['Compare full specs before buying'],
        avoid_if:'If you need detailed AI analysis — try again shortly',
        score:0,platform_prices:[],best_price:'',best_price_platform:'',best_price_url:'',
      }))
    aiProducts=[...aiProducts,...fill]
  }

  // Price enrichment — Skyscanner-style cross-platform pricing
  aiProducts=enrichPrices(aiProducts,serpResult.products)

  const result:SearchResult={
    answer:answer||'Here are the top electronics options for India right now.',
    aiProducts:aiProducts.slice(0,3),
    serpProducts:serpResult.products,
    relatedSearches:serpResult.relatedSearches,
    location_used:loc||'India (no location)',
    algorithm_version:ALGORITHM_VERSION,
  }
  cache.set(cacheKey,{result,ts:Date.now()})
  return result
}
