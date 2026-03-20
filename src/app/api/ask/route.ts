import { NextRequest, NextResponse } from 'next/server'
import { searchGoogleShopping, buildProductContext } from '@/lib/serpapi'
export const runtime = 'nodejs'

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
    sf.append('file', f); sf.append('model', 'saarika:v2.5'); sf.append('language_code', 'unknown')
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
  let body: { question?:string } = {}
  try { body = await req.json() } catch { return NextResponse.json({ error:'Invalid JSON' }, { status:400 }) }
  const question = body.question?.trim()
  if (!question) return NextResponse.json({ error:'No question' }, { status:400 })
  const apiKey = process.env.SARVAM_API_KEY
  if (!apiKey) return NextResponse.json({ answer:'⚠️ SARVAM_API_KEY not set.', products:[], serpProducts:[], aiProducts:[] })

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
  if (!lang && hinglishRe.test(question)) lang='IMPORTANT: Respond in natural Hinglish — mix Hindi and English as Indians speak.'

  const serpResult = await searchGoogleShopping(question).catch(() => ({ products:[], relatedSearches:[], query:question }))
  const serpContext = buildProductContext(serpResult)

  const systemPrompt = `You are ProductRating.in's AI advisor — powered by Sarvam AI (India's own LLM).
${lang}

CRITICAL RULES:
- "rating": AI-adjusted score OUT OF 5. Between 1.0–5.0 ONLY. Example: 4.2
- "platform_rating": Raw Amazon/Flipkart rating BEFORE fake review removal. Between 1.0–5.0. Slightly HIGHER than rating. Example: 4.6
- NEVER output any number above 5.0 for ratings.
- "pros": Array of 2-3 short strings (genuine advantages for Indian buyers)
- "cons": Array of 1-2 short strings (real drawbacks)
- "avoid_if": One short string (who should NOT buy this)

INSTRUCTIONS:
1. Write 2-4 sentences of advice in plain text. No markdown, no asterisks, no bullets.
2. New line: ---PRODUCTS---
3. JSON array of 4-6 products:
[{
  "name": "Product Name",
  "price": "₹XX,XXX",
  "seller": "Amazon",
  "rating": 4.2,
  "platform_rating": 4.6,
  "reviews": "2.3k",
  "badge": "Best Pick",
  "reason": "One line India-specific reason",
  "pros": ["Great battery life", "Good camera in low light"],
  "cons": ["Heating issue in summer"],
  "avoid_if": "You need a very compact phone"
}]
4. NEVER use <think> tags or **markdown**.`

  try {
    const res = await fetch('https://api.sarvam.ai/v1/chat/completions', {
      method:'POST',
      headers:{'Content-Type':'application/json','api-subscription-key':apiKey},
      body:JSON.stringify({ model:'sarvam-m', messages:[{role:'system',content:systemPrompt},{role:'user',content:`Question: ${question}\n${serpContext?`\nLive data:\n${serpContext}`:'\nUse your Indian market knowledge.'}`}], max_tokens:1600, temperature:0.4 }),
    })
    const raw = await res.text()
    if (!res.ok) return NextResponse.json({ answer:`⚠️ Sarvam error (${res.status}).`, products:[], serpProducts:[], aiProducts:[] })
    let data: { choices?:Array<{message?:{content?:string}}>} = {}
    try { data = JSON.parse(raw) } catch {}
    const content = data.choices?.[0]?.message?.content || ''
    const clean = content.replace(/<think>[\s\S]*?<\/think>/gi,'').replace(/\*\*(.*?)\*\*/g,'$1').replace(/\*(.*?)\*/g,'$1').trim()
    const parts = clean.split(/---PRODUCTS---/i)
    const answerText = parts[0].trim() || 'Here are the best options.'
    type AiP = {name:string;price:string;seller:string;rating:number;platform_rating:number;reviews:string;badge:string;reason:string;pros:string[];cons:string[];avoid_if:string}
    let aiProducts: AiP[] = []
    if (parts[1]) {
      try {
        const m = parts[1].match(/\[[\s\S]*\]/)
        if (m) {
          aiProducts = JSON.parse(m[0]).map((p: Record<string,unknown>) => ({
            ...p,
            rating: Math.min(5.0, Math.max(1.0, Number(p.rating)||4.0)),
            platform_rating: Math.min(5.0, Math.max(1.0, Number(p.platform_rating)||Math.min(5.0,(Number(p.rating)||4.0)+0.3))),
            pros: Array.isArray(p.pros) ? p.pros : [],
            cons: Array.isArray(p.cons) ? p.cons : [],
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
