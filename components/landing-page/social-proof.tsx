"use client"

import { useEffect, useState, useRef } from "react"
import { motion, useInView } from "framer-motion"

const companies = [
  { name: "Stripe", symbol: "$" },
  { name: "Vercel", symbol: "▲" },
  { name: "Linear", symbol: "◯" },
  { name: "Notion", symbol: "◉" },
  { name: "Figma", symbol: "◎" },
  { name: "GitHub", symbol: "●" },
  { name: "Slack", symbol: "#" },
  { name: "Discord", symbol: "◆" },
]

const stats = [
  { value: 94, suffix: "%", label: "Accuracy" },
  { value: 2, suffix: "-4", label: "Weeks Early" },
  { value: 18, suffix: "", label: "Days Average" },
  { value: 0, suffix: "", label: "Content Read" },
]

function AnimatedCounter({
  value,
  suffix,
  duration = 2000,
}: {
  value: number
  suffix: string
  duration?: number
}) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (!isInView) return
    let startTime: number
    let animationFrame: number
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const easeOut = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(easeOut * value))
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }
    animationFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrame)
  }, [isInView, value, duration])

  return (
    <span ref={ref} className="tabular-nums">
      {count}
      {suffix}
    </span>
  )
}

// Flowing river of brands
function FlowingRiver() {
  const [items] = useState([...companies, ...companies, ...companies])

  return (
    <div className="relative overflow-hidden py-8">
      {/* Gradient masks */}
      <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />

      {/* First river */}
      <motion.div
        className="flex gap-8"
        animate={{ x: [0, -50 * companies.length] }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        {items.map((company, i) => (
          <div
            key={`row1-${i}`}
            className="flex-shrink-0 px-6 py-4 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-emerald-500/30 transition-all duration-300 group cursor-default"
          >
            <span className="text-xl md:text-2xl font-semibold text-white/30 group-hover:text-emerald-400 transition-colors duration-300">
              {company.name}
            </span>
          </div>
        ))}
      </motion.div>

      {/* Second river (reverse direction) */}
      <motion.div
        className="flex gap-8 mt-6"
        animate={{ x: [-50 * companies.length, 0] }}
        transition={{
          duration: 35,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        {[...companies, ...companies, ...companies].map((company, i) => (
          <div
            key={`row2-${i}`}
            className="flex-shrink-0 px-6 py-4 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-purple-500/30 transition-all duration-300 group cursor-default"
          >
            <span className="text-xl md:text-2xl font-semibold text-white/30 group-hover:text-purple-400 transition-colors duration-300">
              {company.name}
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  )
}

export function SocialProof() {
  return (
    <section id="proof" className="relative py-24 md:py-32 overflow-hidden bg-black">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-emerald-500/[0.04] via-transparent to-transparent" />
      </div>

      <div className="max-w-[1400px] mx-auto px-[5vw] relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-px bg-emerald-500/60" />
            <span className="text-[10px] uppercase tracking-[0.3em] text-emerald-500/70">
              Trusted By
            </span>
            <div className="w-10 h-px bg-emerald-500/60" />
          </div>

          <h2 className="text-2xl md:text-3xl text-white/50 mb-2">
            Engineering teams at leading companies
          </h2>
        </motion.div>

        {/* Flowing river of brands */}
        <FlowingRiver />

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 my-16 max-w-4xl mx-auto">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="relative p-6 md:p-8 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.03] to-transparent group hover:border-emerald-500/30 transition-all duration-300"
            >
              <div className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-3 text-emerald-400">
                <AnimatedCounter
                  value={stat.value}
                  suffix={stat.suffix}
                  duration={2000 + index * 200}
                />
              </div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">
                {stat.label}
              </p>

              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </motion.div>
          ))}
        </div>

        {/* Testimonial */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="relative max-w-2xl mx-auto p-10 md:p-12 rounded-3xl overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-purple-500/5" />
          <div className="absolute inset-0 border border-white/10 rounded-3xl" />

          <div className="relative">
            <div className="absolute -left-4 -top-4 text-7xl text-emerald-500/20 font-serif leading-none">
              "
            </div>

            <blockquote className="relative z-10 text-xl md:text-2xl lg:text-3xl text-white/80 leading-relaxed mb-8 pl-8">
              Sentinel caught burnout signs I would have missed. Saved us from losing
              a key engineer.
            </blockquote>

            <div className="flex items-center justify-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500/30 to-emerald-600/10 border border-emerald-500/30 flex items-center justify-center">
                <span className="text-xl font-bold text-emerald-400">SC</span>
              </div>
              <div className="text-left">
                <p className="font-semibold text-white">Sarah Chen</p>
                <p className="text-sm text-white/40">VP Engineering, Stripe</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}