'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function Nav() {
  const [scrolled,setScrolled]=useState(false)
  useEffect(()=>{ const fn=()=>setScrolled(window.scrollY>28); window.addEventListener('scroll',fn); return()=>window.removeEventListener('scroll',fn) },[])
  return(
    <nav style={{
      position:'fixed',top:0,left:0,right:0,zIndex:90,height:62,
      background:scrolled?'rgba(255,255,255,0.97)':'transparent',
      backdropFilter:scrolled?'blur(24px)':'none',
      borderBottom:scrolled?'1px solid rgba(0,0,0,0.07)':'1px solid transparent',
      transition:`all var(--t-slow) var(--ease)`,
      /* #1 Nav has own shadow when scrolled */
      boxShadow:scrolled?'0 4px 24px rgba(0,0,0,0.06)':'none',
      display:'flex',alignItems:'center',justifyContent:'space-between',
      padding:'0 clamp(24px,5vw,48px)',
    }}>
      <Link href="/" style={{display:'flex',alignItems:'center',gap:10}}>
        <div style={{width:32,height:32,borderRadius:9,background:'var(--ink)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 2px 8px rgba(0,0,0,0.15)'}}>
          <span style={{color:'var(--bg)',fontSize:12,fontWeight:800}}>PR</span>
        </div>
        <span style={{fontWeight:600,fontSize:15,color:'var(--ink)',letterSpacing:'-0.3px'}}>ProductRating<span style={{color:'var(--accent)' }}>.in</span></span>
      </Link>
      <div style={{display:'flex',alignItems:'center',gap:4}}>
        {[['About','/about'],['Contact','/contact']].map(([l,h])=>(
          <Link key={l} href={h} style={{fontSize:13,fontWeight:400,color:'var(--ink-3)',padding:'7px 14px',borderRadius:'var(--r-sm)',transition:`color var(--t-fast) var(--ease)`,letterSpacing:'0.02em'}}
            onMouseEnter={e=>(e.currentTarget.style.color='var(--ink)')}
            onMouseLeave={e=>(e.currentTarget.style.color='var(--ink-3)')}>
            {l}
          </Link>
        ))}
        {/* #4 premium button */}
        <Link href="/search" style={{fontSize:13,fontWeight:500,color:'#fff',padding:'9px 20px',borderRadius:10,background:'var(--accent)',boxShadow:'var(--shadow-btn)',transition:`all var(--t-mid) var(--ease)`,marginLeft:6,letterSpacing:'0.02em'}}
          onMouseEnter={e=>{e.currentTarget.style.background='#4A3FBF';e.currentTarget.style.transform='translateY(-1px) scale(1.02)';e.currentTarget.style.boxShadow='var(--shadow-btn-hv)'}}
          onMouseLeave={e=>{e.currentTarget.style.background='var(--accent)';e.currentTarget.style.transform='translateY(0) scale(1)';e.currentTarget.style.boxShadow='var(--shadow-btn)'}}>
          Ask AI
        </Link>
      </div>
    </nav>
  )
}
