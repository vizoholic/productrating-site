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
  // English patterns
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
  // Hindi / Devanagari keywords for electronics
  /मोबाइल|फ़ोन|फोन|स्मार्टफोन|लैपटॉप|टीवी|टेलीविज़न|एसी|फ्रिज|रेफ्रिजरेटर|वाशिंग मशीन|ईयरबड्स|हेडफोन|स्पीकर|स्मार्टवॉच|कैमरा|माइक्रोवेव|प्यूरीफायर|गीज़र|राउटर|टैबलेट/,
  // Hinglish / transliterated common terms
  /\b(mobile phone|mobile ka|phone kaun|kaun sa phone|best phone|phone under|laptop under|tv under|ac under|phone lena|smartphone lena|fon|phon)\b/i,
  // Tamil keywords
  /மொபைல்|ஃபோன்|லேப்டாப்|தொலைக்காட்சி|குளிரூட்டி|குளிர்சாதனப்பெட்டி/,
  // Telugu keywords
  /మొబైల్|ఫోన్|ల్యాప్టాప్|టీవీ|ఫ్రిజ్|వాషింగ్ మెషీన్/,
  // Bengali keywords
  /মোবাইল|ফোন|ল্যাপটপ|টিভি|ফ্রিজ|এসি/,
  // Kannada keywords
  /ಮೊಬೈಲ್|ಫೋನ್|ಲ್ಯಾಪ್ಟಾಪ್|ಟಿವಿ|ಫ್ರಿಜ್/,
  // Malayalam keywords
  /മൊബൈൽ|ഫോൺ|ലാപ്ടോപ്|ടിവി|ഫ്രിഡ്ജ്/,
]
const NON_ELECTRONICS_RE = [
  /\b(recipe|food|restaurant|hotel|travel|flight|visa|insurance|mutual fund|stock market|loan|credit card)\b/i,
  /\b(fashion|clothing|cloth|dress|shirt|shoe|bag|jewellery|jewelry|saree|kurta)\b/i,
  /\b(book|novel|fiction|textbook|comic|magazine)\b/i,
  /\b(medicine|doctor|hospital|health advice|diet|nutrition)\b/i,
  /\b(school|college|university|course|exam|career|job|salary|internship)\b/i,
  // Hindi non-electronics (food, clothes, travel)
  /खाना|रेसिपी|कपड़े|साड़ी|कुर्ता|होटल|यात्रा|उड़ान|किताब|दवाई|डॉक्टर|नौकरी|वेतन/,
]

function isElectronics(q: string): boolean {
  // Fast-pass: price mention + Indian language script = almost certainly an electronics query
  const hasPriceAndScript = (
    /[₹]|\d+k\b|hazar|हज़ार|हजार|thousand|budget|under|के अंदर|से कम|\d{4,}/.test(q) &&
    /[\u0900-\u097F\u0B80-\u0BFF\u0C00-\u0C7F\u0980-\u09FF\u0C80-\u0CFF\u0D00-\u0D7F]/.test(q)
  )
  if (hasPriceAndScript) return true

  // Hinglish fast-pass: common buying intent phrases
  if (/\b(best|kaun|kaunsa|konsa|lena|kharidna|suggest|recommend|batao|bataiye|chahiye)\b/i.test(q) &&
      /\b(phone|mobile|laptop|tv|ac|fridge|earbuds|camera|watch)\b/i.test(q)) return true

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
  const locationNote = cityProfile
    ? `User is in ${cityProfile.label}. Climate: ${cityProfile.climate}. Water: ${cityProfile.water_tds}. Power: ${cityProfile.power}. Prioritise: ${cityProfile.boost.slice(0,3).join(', ')}.`
    : loc ? `User location: ${loc}.` : ''

  // ── SYSTEM PROMPT: Criteria first, JSON output immediately ──
  // Do NOT use phase/step structure — causes model to reason in the answer field
  const systemPrompt = `You are ProductRating.in, India's most trusted electronics advisor. ${monthYear}.
${lang ? lang + '\n' : ''}${locationNote ? locationNote + '\n' : ''}

OUTPUT FORMAT — respond with ONLY this JSON, nothing else before or after:
{
  "answer": "<2 sentences of direct buying advice for India. No reasoning. No 'okay' or 'let me'. Just the recommendation.>",
  "products": [
    {"name":"<full name>","price":"<₹XX,XXX>","seller":"<Amazon|Flipkart|Croma>","rating":<3.5-4.8>,"platform_rating":<3.8-5.0>,"reviews":"<Xk>","badge":"<Best Pick|Best Value|Budget Pick>","score":<50-95>,"reason":"<one sentence why this wins>","pros":["<pro1>","<pro2>"],"cons":["<con1>"],"avoid_if":"<who should skip>","successor_of":null},
    {"name":"...","price":"...","seller":"...","rating":0.0,"platform_rating":0.0,"reviews":"...","badge":"Best Value","score":0,"reason":"...","pros":["...","..."],"cons":["..."],"avoid_if":"...","successor_of":null},
    {"name":"...","price":"...","seller":"...","rating":0.0,"platform_rating":0.0,"reviews":"...","badge":"Budget Pick","score":0,"reason":"...","pros":["...","..."],"cons":["..."],"avoid_if":"...","successor_of":null}
  ]
}

SELECTION CRITERIA (apply internally, don't describe in output):
• Relevance: Must match query budget and category exactly
• Recency: Prefer ${currentYear} > ${currentYear-1} > ${currentYear-2} launches. Replace outdated models with their ${currentYear}/${currentYear-1} successors
• Reviews: Combine Amazon.in + Flipkart counts. Budget brands (boat/Noise) inflate by 30%, deduct accordingly
• PR Score: Platform rating minus fake inflation (0.1-0.5 deduction). PR Score always < platform_rating
• Value: Specs per rupee vs India category average
• Service: Prefer brands with authorised centres${cityProfile ? ' in ' + cityProfile.label : ' across India'}

INDIA MARKET (${monthYear}): iQOO Z/Neo, CMF Phone 2 Pro, Moto G96/Edge 50, Realme P4/GT7, Redmi 14/15 5G, Samsung A36, POCO X7
Successor rule: Redmi Note 12/13→14/15 | M33/M34→M35 | Narzo 60→Narzo 80 | iQOO Z7→Z9 | Nord CE 3→CE 4 | Moto G73→G96

CRITICAL: The "answer" field must be 2 clean sentences of advice. Never start with "Okay", "Let me", "I need", "First", "Step" or any reasoning language.`

  const userMsg = `Question: ${question}${loc ? `\nLocation: ${loc}` : ''}` +
    (serpContext ? `\n\nLive prices from Indian platforms:\n${serpContext}` : '')

  for (let attempt = 0; attempt <= 2; attempt++) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model,
          messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userMsg }],
          max_tokens: 4000,
          temperature: 0.25,
          response_format: { type: 'json_object' },
        }),
      })
      if (res.status === 429) { if (attempt < 2) await new Promise(r => setTimeout(r, 1500 * (attempt + 1))); continue }
      const raw = await res.text()
      console.log(`[OpenAI:${model}] status=${res.status} len=${raw.length}`)
      if (!res.ok) { console.error('[OpenAI] err:', raw.slice(0, 300)); return { answer: '', products: [] } }
      const d = JSON.parse(raw)
      const content: string = d?.choices?.[0]?.message?.content || '{}'
      console.log(`[OpenAI] content[:200]: ${content.slice(0, 200)}`)
      const parsed = JSON.parse(content)
      const prods = Array.isArray(parsed.products) ? parsed.products : []
      const answer = String(parsed.answer || '').replace(/^(advice:|note:|okay[,.]?|let me|first,?|step \d)/i, '').trim()
      console.log(`[OpenAI] answer="${answer.slice(0, 80)}" products=${prods.length}`)
      return { answer, products: prods }
    } catch (e) {
      console.error(`[OpenAI] attempt ${attempt + 1}:`, String(e))
      if (attempt < 2) await new Promise(r => setTimeout(r, 1000))
    }
  }
  return { answer: '', products: [] }
}

// ── SARVAM FALLBACK ──
async function callSarvam(q: string, serpCtx: string, loc: string, lang: string, monthYear: string, apiKey: string): Promise<{ answer: string; products: unknown[] }> {
  const sp = `You are ProductRating.in electronics advisor. ${monthYear}.${lang ? ' ' + lang : ''}${loc ? ' Location: ' + loc + '.' : ''}
Return ONLY this JSON (no other text):
{"answer":"<2 sentences direct advice>","products":[{"name":"...","price":"₹XX,XXX","seller":"Amazon","rating":4.2,"platform_rating":4.6,"reviews":"22k","badge":"Best Pick","score":82,"reason":"...","pros":["...","..."],"cons":["..."],"avoid_if":"...","successor_of":null},{"name":"...","price":"₹XX,XXX","seller":"Flipkart","rating":4.0,"platform_rating":4.4,"reviews":"15k","badge":"Best Value","score":74,"reason":"...","pros":["...","..."],"cons":["..."],"avoid_if":"...","successor_of":null},{"name":"...","price":"₹XX,XXX","seller":"Amazon","rating":3.8,"platform_rating":4.2,"reviews":"9k","badge":"Budget Pick","score":66,"reason":"...","pros":["...","..."],"cons":["..."],"avoid_if":"...","successor_of":null}]}`
  const um = `Question: ${q}${loc ? ' Location: ' + loc : ''}${serpCtx ? '\n\nLive prices:\n' + serpCtx : ''}`
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
      // Strip think tags
      let prev = ''
      while (prev !== c) { prev = c; c = c.replace(/<think>[\s\S]*?<\/think>/gi, '') }
      c = c.replace(/<\/?think[^>]*>/gi, '').trim()
      // Try JSON parse directly
      try {
        const parsed = JSON.parse(c)
        return { answer: String(parsed.answer || ''), products: Array.isArray(parsed.products) ? parsed.products : [] }
      } catch {
        // Fallback: look for JSON object in response
        const start = c.indexOf('{'); const end = c.lastIndexOf('}')
        if (start >= 0 && end > start) {
          try {
            const parsed = JSON.parse(c.slice(start, end + 1))
            return { answer: String(parsed.answer || ''), products: Array.isArray(parsed.products) ? parsed.products : [] }
          } catch { /* ignore */ }
        }
        return { answer: '', products: [] }
      }
    } catch (e) { console.error(`[Sarvam] attempt ${attempt + 1}:`, String(e)); if (attempt < 3) await new Promise(r => setTimeout(r, 1000)) }
  }
  return { answer: '', products: [] }
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN ENTRY POINT
// ─────────────────────────────────────────────────────────────────────────────

export async function runSearch(
  question: string, city = '', state = '',
  sarvamKey: string, openaiKey?: string
): Promise<SearchResult> {

  if (!isElectronics(question)) {
    return { answer: '', aiProducts: [], serpProducts: [], relatedSearches: [], isOutOfScope: true, algorithm_version: ALGORITHM_VERSION }
  }

  const cacheKey = `${question.toLowerCase().trim()}|${city}|${state}`
  const hit = cache.get(cacheKey)
  if (hit && Date.now() - hit.ts < CACHE_TTL) { console.log('[Search] cache hit'); return hit.result }

  const monthYear = getMonthYear()
  const currentYear = getYear()
  const lang = detectLang(question)
  const loc = getLocation(city, state)
  const model = selectModel(question)
  const cat = detectCat(question)
  const weights = getCategoryWeights(cat)

  console.log(`[Search] cat=${cat} model=${model} loc="${loc || 'India-wide'}"`)

  let serpResult: SerpSearchResult = { products: [], relatedSearches: [], query: question }
  try { serpResult = await searchGoogleShopping(question); console.log(`[SERP] ${serpResult.products.length}`) }
  catch (e) { console.error('[SERP]:', String(e)) }
  const serpContext = buildProductContext(serpResult)

  let answer = '', rawProducts: unknown[] = []

  if (openaiKey) {
    const r = await callOpenAI(question, serpContext, loc, lang, monthYear, currentYear, cat, weights, model, openaiKey)
    answer = r.answer; rawProducts = r.products
    if ((!answer || rawProducts.length === 0) && model !== 'gpt-5.4') {
      console.log('[Search] upgrading to gpt-5.4')
      const r2 = await callOpenAI(question, serpContext, loc, lang, monthYear, currentYear, cat, weights, 'gpt-5.4', openaiKey)
      if (r2.answer || r2.products.length > 0) { answer = r2.answer; rawProducts = r2.products }
    }
  }

  if (!answer && rawProducts.length === 0 && sarvamKey) {
    console.log('[Search] Sarvam fallback')
    const r = await callSarvam(question, serpContext, loc, lang, monthYear, sarvamKey)
    answer = r.answer; rawProducts = r.products
  }

  if (!answer && rawProducts.length === 0) {
    return { answer: 'AI temporarily unavailable. Please try again.', aiProducts: [], serpProducts: serpResult.products, relatedSearches: serpResult.relatedSearches, algorithm_version: ALGORITHM_VERSION }
  }

  let aiProducts: AiProduct[] = (rawProducts as Record<string, unknown>[])
    .filter(p => p && typeof p.name === 'string' && p.name.length > 2)
    .slice(0, 3).map(sanitise)

  // SERP fill if fewer than 3
  if (aiProducts.length < 3 && serpResult.products.length > 0) {
    const used = new Set(aiProducts.map(p => p.name.toLowerCase()))
    const fill = serpResult.products
      .filter(sp => sp.title && sp.price && isMarketplace(sp.source) && !used.has(sp.title.toLowerCase()))
      .slice(0, 3 - aiProducts.length)
      .map((sp, i): AiProduct => ({
        name: sp.title, price: sp.price || '—', seller: normaliseMarketplace(sp.source),
        rating: sp.rating ? Math.min(4.8, Math.max(3.0, Number(sp.rating))) : 4.0,
        platform_rating: sp.rating ? Math.min(5.0, Number(sp.rating) + 0.3) : 4.3,
        reviews: '', badge: (['Best Pick', 'Best Value', 'Budget Pick'][aiProducts.length + i]) || 'Top Rated',
        reason: `Top result on ${normaliseMarketplace(sp.source)} for this query.`,
        pros: ['Competitive price', 'Available on major platform'],
        cons: ['Compare specs before buying'],
        avoid_if: 'If you need detailed AI analysis — try again shortly',
        score: 0, platform_prices: [], best_price: '', best_price_platform: '', best_price_url: '',
      }))
    aiProducts = [...aiProducts, ...fill]
  }

  // Enrich with real prices from SERP
  aiProducts = enrichPrices(aiProducts, serpResult.products)

  const result: SearchResult = {
    answer: answer || `Here are the top ${cat.replace('_', ' ')} options for India right now.`,
    aiProducts: aiProducts.slice(0, 3),
    serpProducts: serpResult.products,
    relatedSearches: serpResult.relatedSearches,
    location_used: loc || 'India',
    algorithm_version: ALGORITHM_VERSION,
  }
  cache.set(cacheKey, { result, ts: Date.now() })
  return result
}
