'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function Nav() {
  const [scrolled,setScrolled]=useState(false)
  useEffect(()=>{ const fn=()=>setScrolled(window.scrollY>24); window.addEventListener('scroll',fn); return()=>window.removeEventListener('scroll',fn) },[])
  return(
    <nav style={{position:'fixed',top:0,left:0,right:0,zIndex:90,height:60,background:scrolled?'rgba(255,255,255,0.96)':'transparent',backdropFilter:scrolled?'blur(20px)':'none',borderBottom:scrolled?'1px solid var(--border)':'1px solid transparent',transition:'all 0.3s cubic-bezier(0.22,1,0.36,1)',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 clamp(20px,5vw,40px)'}}>
      <Link href="/" style={{display:'flex',alignItems:'center',gap:10}}>
        <div style={{width:30,height:30,borderRadius:8,background:'var(--ink)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 2px 8px rgba(0,0,0,0.15)'}}>
          <span style={{color:'var(--bg)',fontSize:12,fontWeight:800,fontFamily:'var(--font-sans)'}}>PR</span>
        </div>
        <span style={{fontWeight:700,fontSize:15,color:'var(--ink)',letterSpacing:'-0.3px'}}>ProductRating<span style={{color:'var(--accent)' }}>.in</span></span>
      </Link>
      <div style={{display:'flex',alignItems:'center',gap:4}}>
        {[['About','/about'],['Contact','/contact']].map(([l,h])=>(
          <Link key={l} href={h} style={{fontSize:13,fontWeight:400,color:'var(--ink-3)',padding:'7px 14px',borderRadius:'var(--radius-sm)',transition:'color .15s',letterSpacing:'0.02em'}}
            onMouseEnter={e=>(e.currentTarget.style.color='var(--ink)')}
            onMouseLeave={e=>(e.currentTarget.style.color='var(--ink-3)')}>
            {l}
          </Link>
        ))}
        <Link href="/search" style={{fontSize:13,fontWeight:600,color:'#fff',padding:'8px 20px',borderRadius:'var(--radius-sm)',background:'var(--accent)',boxShadow:'0 2px 8px rgba(91,79,207,0.3)',transition:'all .2s',marginLeft:6}}
          onMouseEnter={e=>{e.currentTarget.style.background='#4A3FBF';e.currentTarget.style.transform='translateY(-1px)'}}
          onMouseLeave={e=>{e.currentTarget.style.background='var(--accent)';e.currentTarget.style.transform='translateY(0)'}}>
          Ask AI
        </Link>
      </div>
    </nav>
  )
}
