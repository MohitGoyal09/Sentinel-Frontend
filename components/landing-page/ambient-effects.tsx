"use client"

import { useEffect, useState } from "react"

export function AmbientEffects() {
  const [scrollVelocity, setScrollVelocity] = useState(0)
  const [lastScrollY, setLastScrollY] = useState(0)

  useEffect(() => {
    let rafId: number
    let timeoutId: NodeJS.Timeout

    const handleScroll = () => {
      if (rafId) return
      
      rafId = requestAnimationFrame(() => {
        const currentScrollY = window.scrollY
        const velocity = Math.abs(currentScrollY - lastScrollY)
        setScrollVelocity(Math.min(velocity / 10, 2)) // Cap at 2deg
        setLastScrollY(currentScrollY)
        
        // Reset velocity after scroll stops
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => {
          setScrollVelocity(0)
        }, 150)
        
        rafId = 0
      })
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", handleScroll)
      clearTimeout(timeoutId)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [lastScrollY])

  return (
    <>
      {/* Global scan lines - CRT aesthetic */}
      <div 
        className="fixed inset-0 pointer-events-none z-[100] opacity-[0.02]"
        style={{
          background: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(255,255,255,0.03) 2px,
            rgba(255,255,255,0.03) 4px
          )`,
        }}
      />

      {/* Grain texture - breathing opacity */}
      <div 
        className="fixed inset-0 pointer-events-none z-[99] mix-blend-overlay animate-[grain_8s_ease-in-out_infinite]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          opacity: 0.015,
        }}
      />

      {/* Light leak vignette - shifting subtly */}
      <div 
        className="fixed inset-0 pointer-events-none z-[98] animate-[lightLeak_12s_ease-in-out_infinite]"
        style={{
          background: `radial-gradient(ellipse at 30% 20%, rgba(255,107,43,0.03) 0%, transparent 50%),
                       radial-gradient(ellipse at 70% 80%, rgba(16,185,129,0.02) 0%, transparent 50%)`,
        }}
      />

      {/* Scroll velocity skew overlay */}
      <div 
        className="fixed inset-0 pointer-events-none z-[97] transition-transform duration-100 ease-out"
        style={{
          transform: `skewY(${scrollVelocity * 0.3}deg)`,
        }}
      />

      {/* Holographic grid overlay */}
      <div 
        className="fixed inset-0 pointer-events-none z-[96] opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '100px 100px',
        }}
      />

      {/* Global cursor glow - follows mouse */}
      <CursorGlow />

      <style jsx global>{`
        @keyframes grain {
          0%, 100% { opacity: 0.015; }
          50% { opacity: 0.025; }
        }
        @keyframes lightLeak {
          0%, 100% { 
            background: radial-gradient(ellipse at 30% 20%, rgba(255,107,43,0.03) 0%, transparent 50%),
                        radial-gradient(ellipse at 70% 80%, rgba(16,185,129,0.02) 0%, transparent 50%);
          }
          50% { 
            background: radial-gradient(ellipse at 70% 30%, rgba(255,107,43,0.04) 0%, transparent 50%),
                        radial-gradient(ellipse at 30% 70%, rgba(16,185,129,0.03) 0%, transparent 50%);
          }
        }
      `}</style>
    </>
  )
}

function CursorGlow() {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY })
      if (!isVisible) setIsVisible(true)
    }

    const handleMouseLeave = () => {
      setIsVisible(false)
    }

    window.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseleave", handleMouseLeave)
    
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseleave", handleMouseLeave)
    }
  }, [isVisible])

  return (
    <div
      className="fixed w-[400px] h-[400px] rounded-full pointer-events-none z-[95] transition-opacity duration-300"
      style={{
        left: position.x - 200,
        top: position.y - 200,
        background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)',
        opacity: isVisible ? 1 : 0,
        filter: 'blur(60px)',
      }}
    />
  )
}
