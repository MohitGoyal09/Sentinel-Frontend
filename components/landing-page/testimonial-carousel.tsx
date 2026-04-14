"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

const testimonials = [
  {
    quote: "Sentinel's Talent Scout found Emma — a mid-level dev with modest output but the highest betweenness centrality. She bridges Engineering and Design. If she left, four people lose their unblocker. We promoted her before she even thought about leaving.",
    author: "Sarah Chen",
    role: "VP Engineering @ TechFlow",
  },
  {
    quote: "Jordan was our infrastructure lead — single point of failure for the whole platform. Sentinel flagged his velocity spike 3 weeks before he crashed. That early warning gave us time to redistribute knowledge and keep him. We avoided a 6-month replacement nightmare.",
    author: "Marcus T.",
    role: "Director of Engineering @ Nexus",
  },
  {
    quote: "The two-vault architecture was the selling point. I could look the CEO in the eye and say: even a full database breach yields nothing. Employees see their own data. Managers see only aggregates. Zero pushback on rollout.",
    author: "Emily R.",
    role: "CTO @ ScaleUp Inc.",
  },
  {
    quote: "Culture Thermometer flagged correlated burnout across our consulting team before the resignation cascade hit. Four of six members showed velocity spikes simultaneously. We rebalanced client assignments and retained the whole team.",
    author: "Arpit R.",
    role: "CIO @ Grant Thornton Bharat",
  },
]

// Custom easing for buttery agency transitions
const customEase = [0.16, 1, 0.3, 1] as [number, number, number, number]

export function TestimonialCarousel() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % testimonials.length), 7000)
    return () => clearInterval(t)
  }, [])

  const t = testimonials[index]

  return (
    <section id="testimonials" className="relative w-full bg-[#080808] overflow-hidden py-32">
      {/* ── Perspective grid floor ── */}
      <div
        className="absolute inset-x-0 bottom-0 h-[55%] pointer-events-none"
        style={{ perspective: '600px' }}
      >
        <div
          className="absolute inset-x-[-30%] bottom-0 h-[180%] origin-bottom"
          style={{
            transform: 'rotateX(68deg)',
            backgroundImage: `
              linear-gradient(to right, rgba(200, 100, 40, 0.18) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(200, 100, 40, 0.18) 1px, transparent 1px)
            `,
            backgroundSize: '80px 80px',
            maskImage: 'linear-gradient(to top, black 10%, transparent 80%)',
            WebkitMaskImage: 'linear-gradient(to top, black 10%, transparent 80%)',
          }}
        />
      </div>

      {/* ── Floor glow ── */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-[800px] h-[300px] rounded-full bg-[#ff5500]/25 blur-[90px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-[300px] h-[140px] rounded-full bg-[#ffaa00]/30 blur-[50px] pointer-events-none" />

      {/* ── Quote container ── */}
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 1.2, ease: customEase }}
        className="relative z-10 max-w-[900px] mx-auto px-8 flex flex-col items-center text-center"
      >
        <div className="min-h-[160px] md:min-h-[140px] flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.blockquote
              key={`quote-${index}`}
              initial={{ opacity: 0, y: 15, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -15, filter: "blur(4px)" }}
              transition={{ duration: 0.6, ease: customEase }}
              className="text-[22px] md:text-[28px] font-light text-white/75 leading-[1.55] tracking-[-0.01em] max-w-[820px]"
            >
              &ldquo;{t.quote}&rdquo;
            </motion.blockquote>
          </AnimatePresence>
        </div>

        <div className="mt-8 flex flex-col items-center gap-1 min-h-[48px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={`author-${index}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5, ease: customEase }}
              className="flex flex-col items-center gap-1"
            >
              <span className="text-[15px] font-medium text-white/50">{t.author}</span>
              <span className="text-[13px] text-white/25">{t.role}</span>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dots */}
        <div className="flex gap-2.5 mt-16">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={cn(
                "rounded-full transition-all duration-500",
                i === index
                  ? "w-6 h-1.5 bg-white/60 shadow-[0_0_8px_rgba(255,255,255,0.3)]"
                  : "w-1.5 h-1.5 bg-white/15 hover:bg-white/40"
              )}
              aria-label={`Testimonial ${i + 1}`}
            />
          ))}
        </div>
      </motion.div>
    </section>
  )
}
