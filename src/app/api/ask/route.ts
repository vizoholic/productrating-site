import { NextRequest, NextResponse } from 'next/server'
import { searchGoogleShopping, buildProductContext } from '@/lib/serpapi'
export const runtime = 'nodejs'

// Tier 1 cities — city-level personalization
const TIER1 = new Set([
  'delhi','new delhi','mumbai','bombay','bangalore','bengaluru','chennai',
  'kolkata','calcutta','hyderabad','secunderabad','pune','ahmedabad','surat'
])

// Tier 2 cities — city-level personalization  
const TIER2 = new Set([
  'jaipur','lucknow','kanpur','nagpur','visakhapatnam','vizag','bhopal','patna',
  'vadodara','baroda','ghaziabad','ludhiana','agra','nashik','faridabad',
  'meerut','rajkot','varanasi','srinagar','aurangabad','amritsar','ranchi',
  'coimbatore','jabalpur','gwalior','vijayawada','jodhpur','madurai','raipur',
  'kota','chandigarh','guwahati','solapur','hubli','dharwad','tiruchirappalli',
  'trichy','bareilly','aligarh','moradabad','mysuru','mysore','gorakhpur',
  'jalandhar','bhubaneswar','salem','warangal','guntur','bhiwandi','saharanpur',
  'dehradun','kochi','cochin','kozhikode','thiruvananthapuram','trivandrum',
  'indore','noida','gurgaon','gurugram','navi mumbai','thane'
])

function getLocationContext(city: string, state: string): { level: 'city'|'state'|'general'; label: string } {
  const c = city.toLowerCase().trim()
  const s = state.toLowerCase().trim()
  if (c && (TIER1.has(c) || TIER2.has(c))) return { level: 'city', label: city }
  if (c && c.length > 2) return { level: 'state', label: state || city }  // smaller city → use state
  if (s && s.length > 2) return { level: 'state', label: state }
  return { level: 'general', label: '' }
}

export async function POST(req: NextRequest) {
  const ct = req.headers.get('content-type') || ''

  // ── Voice STT ──
  if (ct.includes('multipart/form-data')) {
    const apiKey = process.env.SARVAM_API_KEY
    if (!apiKey) return NextResponse.json({ error:'SARVAM_API_KEY not set', transcript:'' }, { status:500 })
    let fd: FormData
    try { fd = await req.formData() } catch(e) { return NextResponse.json({ error:`Form error: ${e}`, transcript:'' }, { status:400 }) }
    const f = (fd.get('file') ?? fd.get('audio')) as File|null
    if (!f) return NextResponse.json({ error:'No audio', transcript:'' }, { status:400 })
    if (f.size === 0) return NextResponse.json({ error:'Empty audio — record for longer', transcript:'' }, { status:400 })
    const sf = new FormData()
    sf.append('file', f); sf.append('model','saarika:v2.5'); sf.append('language_code','unknown')
    try {
      const sr = await fetch('https://api.sarvam.ai/speech-to-text', { method:'POST', headers:{'api-subscription-key':apiKey}, body:sf })
      const rt = await sr.text()
      if (!sr.ok) return NextResponse.json({ error:`STT ${sr.status}`, transcript:'' }, { status:500 })
      let d: { transcript?:string; language_code?:string } = {}
      try { d = JSON.parse(rt) } catch {}
      return NextResponse.json({ transcript: d.transcript || '', detectedLanguage: d.language_code || '' })
    } catch(e) { return NextResponse.json({ error:`Network: ${e}`, transcript:'' }, { status:500 }) }
  }

  // ── Chat / Search ──
  let body: { question?:string; city?:string; state?:string } = {}
  try { body = await req.json() } catch { return NextResponse.json({ error:'Invalid JSON' }, { status:400 }) }
  const question = body.question?.trim()
  if (!question) return NextResponse.json({ error:'No question' }, { status:400 })

  const city = body.city?.trim() || ''
  const state = body.state?.trim() || ''
  const loc = getLocationContext(city, state)

  const apiKey = process.env.SARVAM_API_KEY
  if (!apiKey) return NextResponse.json({ answer:'⚠️ SARVAM_API_KEY not set.', products:[], serpProducts:[], aiProducts:[] })

  // Language detection
  const langMap: [RegExp,string][] = [
    [/[\u0900-\u097F]/,'Respond ENTIRELY in Hindi (Devanagari). Product names/prices in English is fine.'],
    [/[\u0B80-\u0BFF]/,'Respond ENTIRELY in Tamil.'],
    [/[\u0C00-\u0C7F]/,'Respond ENTIRELY in Telugu.'],
    [/[\u0980-\u09FF]/,'Respond ENTIRELY in Bengali.'],
    [/[\u0C80-\u0CFF]/,'Respond ENTIRELY in Kannada.'],
    [/[\u0D00-\u0D7F]/,'Respond ENTIRELY in Malayalam.'],
    [/[\u0A80-\u0AFF]/,'Respond ENTIRELY in Gujarati.'],
    [/[\u0A00-\u0A7F]/,'Respond ENTIRELY in Punjabi (Gurmukhi).'],
  ]
  const hinglishRe = /\b(kaunsa|kaun sa|mein|ke andar|kya hai|acha|sahi|lena|chahiye|konsa|wala|bahut)\b/i
  let lang = ''
  for (const [re,inst] of langMap) { if (re.test(question)) { lang=`IMPORTANT: ${inst}`; break } }
  if (!lang && hinglishRe.test(question)) lang = 'IMPORTANT: Respond in natural Hinglish — mix Hindi and English as Indians speak.'

  // Google Shopping — include location in query for local results
  const searchQuery = loc.label ? `${question} ${loc.label}` : question
  const serpResult = await searchGoogleShopping(searchQuery).catch(() => ({ products:[], relatedSearches:[], query:question }))
  const serpContext = buildProductContext(serpResult)

  // Location context for AI — fully dynamic, AI decides what's relevant
  let locationPrompt = ''
  if (loc.level === 'city') {
    locationPrompt = `
USER CITY: ${loc.label} (Tier 1/2 Indian city)
Personalise ALL recommendations for ${loc.label}. You know this city well — its climate, infrastructure, common issues, popular brands, and local buying preferences. Factor these in naturally without being repetitive. Do NOT mention the city in every product card — mention it only in the opening summary.`
  } else if (loc.level === 'state') {
    locationPrompt = `
USER STATE/REGION: ${loc.label}
Personalise recommendations for ${loc.label} as a region. Consider regional climate, infrastructure, and buying patterns typical of this state. Do NOT mention the location in every product card — mention it only in the opening summary.`
  } else {
    locationPrompt = `No location provided. Give general India-wide recommendations. Suggest the user share their city for better personalisation.`
  }

  const systemPrompt = `You are ProductRating.in's AI advisor — powered by Sarvam AI (India's own LLM).
${lang}
${locationPrompt}

CRITICAL JSON RULES:
- Return EXACTLY 3 products. No more, no less.
- "rating": AI-adjusted score OUT OF 5. Between 1.0–5.0 ONLY.
- "platform_rating": Raw platform score BEFORE fake review removal. Between 1.0–5.0. Slightly higher than rating.
- "pros": Array of exactly 2 short strings (key advantages)
- "cons": Array of exactly 1 short string (main drawback)
- "avoid_if": One short string describing who should NOT buy this
- Do NOT include any location/city reference inside individual product fields — only in the opening text.

INSTRUCTIONS:
1. Write 2-3 sentences of advice in plain text. Mention location context ONCE here if available. No markdown.
2. New line: ---PRODUCTS---
3. JSON array of EXACTLY 3 products:
[{
  "name": "Full Product Name with variant",
  "price": "₹XX,XXX",
  "seller": "Amazon",
  "rating": 4.2,
  "platform_rating": 4.6,
  "reviews": "2.3k",
  "badge": "Best Pick",
  "reason": "One punchy sentence — why this wins overall",
  "pros": ["Key advantage 1", "Key advantage 2"],
  "cons": ["Main drawback"],
  "avoid_if": "You need X or Y"
}]
4. NEVER use <think> tags or **markdown** formatting.`

  try {
    const res = await fetch('https://api.sarvam.ai/v1/chat/completions', {
      method:'POST',
      headers:{'Content-Type':'application/json','api-subscription-key':apiKey},
      body:JSON.stringify({
        model:'sarvam-m',
        messages:[
          {role:'system', content:systemPrompt},
          {role:'user', content:`Question: ${question}\n${loc.label?`User location: ${loc.label}\n`:''}\n${serpContext?`Live market data:\n${serpContext}`:'\nUse your Indian market knowledge.'}`}
        ],
        max_tokens:1600, temperature:0.4
      }),
    })
    const raw = await res.text()
    if (!res.ok) return NextResponse.json({ answer:`⚠️ Sarvam error (${res.status}).`, products:[], serpProducts:[], aiProducts:[] })
    let data: { choices?:Array<{message?:{content?:string}}>} = {}
    try { data = JSON.parse(raw) } catch {}
    const content = data.choices?.[0]?.message?.content || ''
    const clean = content.replace(/<think>[\s\S]*?<\/think>/gi,'').replace(/\*\*(.*?)\*\*/g,'$1').replace(/\*(.*?)\*/g,'$1').trim()
    const parts = clean.split(/---PRODUCTS---/i)
    const answerText = parts[0].trim() || 'Here are the top 3 options.'
    type AiP = {name:string;price:string;seller:string;rating:number;platform_rating:number;reviews:string;badge:string;reason:string;pros:string[];cons:string[];avoid_if:string}
    let aiProducts: AiP[] = []
    if (parts[1]) {
      try {
        const m = parts[1].match(/\[[\s\S]*\]/)
        if (m) {
          const parsed = JSON.parse(m[0]).slice(0, 3)  // enforce max 3
          aiProducts = parsed.map((p: Record<string,unknown>) => ({
            ...p,
            rating: Math.min(5.0, Math.max(1.0, Number(p.rating)||4.0)),
            platform_rating: Math.min(5.0, Math.max(1.0, Number(p.platform_rating)||Math.min(5.0,(Number(p.rating)||4.0)+0.3))),
            pros: Array.isArray(p.pros) ? p.pros.slice(0,2) : [],
            cons: Array.isArray(p.cons) ? p.cons.slice(0,1) : [],
            avoid_if: String(p.avoid_if || ''),
          }))
        }
      } catch {}
    }
    return NextResponse.json({ answer:answerText, products:[], serpProducts:serpResult.products, aiProducts, relatedSearches:serpResult.relatedSearches })
  } catch(err) {
    return NextResponse.json({ answer:`⚠️ Network error: ${String(err)}`, products:[], serpProducts:[], aiProducts:[] })
  }
}
