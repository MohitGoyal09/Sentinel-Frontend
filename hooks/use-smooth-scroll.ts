"use client"

import { useEffect, useRef } from "react"
import Lenis from "lenis"

export function useSmoothScroll() {
  const lenisRef = useRef<Lenis | null>(null)

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.5,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 2,
    })

    lenisRef.current = lenis

    function raf(time: number) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }

    requestAnimationFrame(raf)

    // Expose lenis to window for GSAP ScrollTrigger integration
    ;(window as any).lenis = lenis

    return () => {
      lenis.destroy()
    }
  }, [])

  return lenisRef
}
