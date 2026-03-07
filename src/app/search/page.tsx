'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import Link from 'next/link'

function SearchResults() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [results, setResults] = useState<any[]>([])
  const [aiAnswer, setAiAnswer] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const q = searchParams.get('q')
    if (q) { setQuery(q); runSearch(q) }
  }, [searchParams])

  const runSearch = async (q: string) => {
    setLoading(true)
    setAiAnswer('')
    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
      })
      const data = await res.json()
      setAiAnswer(data.answer || '')
      setResults(data.products || [])
    } catch {
      setAiAnswer('Unable to connect to AI. Please try again.')
    }
    setLoading(false)
  }

  const handleSearch = () => {
    if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`)
  }

  return (
    <>
      <Nav />
      <main style={{ paddingTop: 100, minHeight: '100vh', padding: '100px 48px 60px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h1 style={{ fontFamily: 'Syne,sans-serif', fontSize: 'clamp(28px,4vw,48px)', fontWeight: 800, letterSpacing: '-1.5px', marginBottom: 32 }}>
            Ask <span style={{ color: 'var(--saffron)' }}>anything.</span>
          </h1>

          <div style={{ display: 'flex', gap: 12, marginBottom: 40 }}>
            <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Is the Samsung Galaxy S24 FE worth buying in India?"
              style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--border-accent)', borderRadius: 12, padding: '14px 20px', fontFamily: 'DM Sans,sans-serif', fontSize: 16, color: 'var(--text)', outline: 'none' }} />
            <button onClick={handleSearch} style={{ background: 'var(--saffron)', color: '#000', border: 'none', borderRadius: 12, padding: '14px 28px', fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
              Ask AI →
            </button>
          </div>

          {loading && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: 28, marginBottom: 24 }}>
              <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: 'var(--saffron)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>⚡ ProductRating AI</div>
              <div style={{ color: 'var(--text-dim)', fontSize: 14 }}>Analysing lakhs of Indian reviews...</div>
            </div>
          )}

          {aiAnswer && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border-accent)', borderRadius: 20, padding: 28, marginBottom: 32 }}>
              <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: 'var(--saffron)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>⚡ ProductRating AI Answer</div>
              <p style={{ fontSize: 15, color: 'var(--text)', lineHeight: 1.8 }}>{aiAnswer}</p>
            </div>
          )}

          {results.length > 0 && (
            <div>
              <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Related Products</h2>
              {results.map((p: any) => (
                <Link key={p._id} href={`/products/${p.slug}`} style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '16px 20px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, marginBottom: 10, textDecoration: 'none', transition: 'border-color .2s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-accent)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 15 }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono,monospace', marginTop: 2 }}>{p.category}</div>
                  </div>
                  <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 24, fontWeight: 800, color: 'var(--green)' }}>{p.aggregatedScore?.toFixed(1)}</div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}

export default function SearchPage() {
  return <Suspense fallback={<div style={{ color: 'var(--text)', padding: 80 }}>Loading...</div>}><SearchResults /></Suspense>
}
