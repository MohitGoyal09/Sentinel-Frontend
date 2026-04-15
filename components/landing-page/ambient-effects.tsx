"use client"

import { useEffect, useRef } from "react"
import { motion, useMotionValue, useSpring } from "framer-motion"

export function AmbientEffects() {
  const scrollVelocity = useMotionValue(0)
  const lastScrollY = useRef(0)
  const rafId = useRef<number>(0)

  useEffect(() => {
    const handleScroll = () => {
      if (rafId.current) return

      rafId.current = requestAnimationFrame(() => {
        const velocity = Math.abs(window.scrollY - lastScrollY.current)
        scrollVelocity.set(Math.min(velocity / 10, 2))
        lastScrollY.current = window.scrollY
        rafId.current = 0
      })
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [scrollVelocity])

  return (
    <>
      {/* Gradient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full opacity-[0.07]"
          style={{
            background: "radial-gradient(circle, #10B981 0%, transparent 70%)",
            left: "5%",
            top: "10%",
          }}
          animate={{
            x: [0, 80, 0],
            y: [0, -50, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.div
          className="absolute w-[400px] h-[400px] rounded-full opacity-[0.05]"
          style={{
            background: "radial-gradient(circle, #8B5CF6 0%, transparent 70%)",
            right: "10%",
            top: "30%",
          }}
          animate={{
            x: [0, -60, 0],
            y: [0, 40, 0],
            scale: [1, 0.9, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 5 }}
        />

        <motion.div
          className="absolute w-[350px] h-[350px] rounded-full opacity-[0.04]"
          style={{
            background: "radial-gradient(circle, #F59E0B 0%, transparent 70%)",
            left: "40%",
            bottom: "5%",
          }}
          animate={{
            y: [0, -100, 0],
            scale: [1, 1.1, 1],
            opacity: [0.04, 0.06, 0.04],
          }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 8 }}
        />
      </div>

      {/* Vignette */}
      <div
        className="fixed inset-0 pointer-events-none z-[99]"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.3) 100%)",
        }}
      />

      {/* Subtle grid */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.015] z-[98]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px",
        }}
      />
    </>
  )
}