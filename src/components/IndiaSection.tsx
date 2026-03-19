'use client'
import Link from 'next/link'

const LANGS = [
  { name:'हिंदी', romanized:'Hindi', flag:'🇮🇳' },
  { name:'தமிழ்', romanized:'Tamil', flag:'🇮🇳' },
  { name:'తెలుగు', romanized:'Telugu', flag:'🇮🇳' },
  { name:'বাংলা', romanized:'Bengali', flag:'🇮🇳' },
  { name:'मराठी', romanized:'Marathi', flag:'🇮🇳' },
  { name:'ગુજરાતી', romanized:'Gujarati', flag:'🇮🇳' },
  { name:'ਪੰਜਾਬੀ', romanized:'Punjabi', flag:'🇮🇳' },
  { name:'English', romanized:'English', flag:'🌐' },
]

export default function IndiaSection() {
  return (
    <section style={{ padding:'80px 40px', background:'#fff', borderTop:'1px solid #E5E7EB' }}>
      <div style={{ maxWidth:1100, margin:'0 auto' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:60, alignItems:'center' }}>
          {/* Left — copy */}
          <div>
            <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:100, padding:'5px 14px', marginBottom:20, fontSize:12, fontWeight:600, color:'#2563EB' }}>
              🇮🇳 Built for India
            </div>
            <h2 style={{ fontSize:'clamp(26px,3vw,38px)', fontWeight:800, letterSpacing:'-1px', color:'#111827', lineHeight:1.15, marginBottom:16 }}>
              The only product tool<br />that speaks your language.
            </h2>
            <p style={{ fontSize:16, color:'#6B7280', lineHeight:1.7, marginBottom:28 }}>
              We use Sarvam AI — India&apos;s own large language model — trained on Indian languages, culture, and context. Ask in Hindi, get answers that understand Delhi heat, Mumbai humidity, and Bangalore traffic.
            </p>

            <div style={{ display:'flex', flexDirection:'column', gap:14, marginBottom:32 }}>
              {[
                { icon:'🎙️', title:'Voice Search in Any Language', desc:'Tap mic, speak naturally — Hindi, Tamil, Telugu, or English. Sarvam AI understands.' },
                { icon:'🌡️', title:'City-Specific Intelligence', desc:'Delhi summer vs Chennai humidity — our recommendations know the difference.' },
                { icon:'🧠', title:'Indian Context, Always', desc:'Understands Indian budgets, voltage fluctuations, local brands, and after-sales service quality.' },
              ].map(f => (
                <div key={f.title} style={{ display:'flex', gap:14, alignItems:'flex-start' }}>
                  <div style={{ width:36, height:36, background:'#EFF6FF', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>{f.icon}</div>
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, color:'#111827', marginBottom:3 }}>{f.title}</div>
                    <div style={{ fontSize:13, color:'#6B7280', lineHeight:1.5 }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <Link href="/search" style={{ display:'inline-flex', alignItems:'center', gap:8, background:'#2563EB', color:'#fff', fontWeight:600, fontSize:14, padding:'11px 24px', borderRadius:10, transition:'background .15s' }}
              onMouseEnter={e => (e.currentTarget.style.background='#1D4ED8')}
              onMouseLeave={e => (e.currentTarget.style.background='#2563EB')}>
              Try Voice Search →
            </Link>
          </div>

          {/* Right — language grid */}
          <div>
            <div style={{ fontSize:13, fontWeight:600, color:'#6B7280', marginBottom:16, textTransform:'uppercase', letterSpacing:'1px' }}>Supported Languages</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
              {LANGS.map(l => (
                <div key={l.name} style={{ background:'#F9FAFB', border:'1px solid #E5E7EB', borderRadius:10, padding:'14px 10px', textAlign:'center' }}>
                  <div style={{ fontSize:20, marginBottom:6 }}>{l.flag}</div>
                  <div style={{ fontSize:15, fontWeight:700, color:'#111827', marginBottom:2 }}>{l.name}</div>
                  <div style={{ fontSize:11, color:'#9CA3AF' }}>{l.romanized}</div>
                </div>
              ))}
            </div>
            {/* Sarvam AI credit */}
            <div style={{ marginTop:20, padding:'14px 18px', background:'#F9FAFB', border:'1px solid #E5E7EB', borderRadius:10, display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:36, height:36, background:'#2563EB', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:16, flexShrink:0 }}>🤖</div>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:'#111827' }}>Powered by Sarvam AI</div>
                <div style={{ fontSize:12, color:'#6B7280' }}>India&apos;s leading multilingual LLM — built in Bengaluru</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
