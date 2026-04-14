"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowUpRight, Play, Shield } from "lucide-react"

const customEase = [0.32, 0.72, 0, 1] as [number, number, number, number]

export function ImmersiveCTA() {
  return (
    <section className="relative bg-[#050505] min-h-[100dvh] flex items-center justify-center overflow-hidden">
      {/* ── Immersive background ── */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Radial gradient center */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] rounded-full bg-[radial-gradient(circle,_rgba(16,185,129,0.08)_0%,_transparent_70%)]" />
        
        {/* Animated pulse rings */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-500/20"
              style={{
                width: `${300 + i * 200}px`,
                height: `${300 + i * 200}px`,
              }}
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.3 - i * 0.05, 0.1, 0.3 - i * 0.05],
              }}
              transition={{
                duration: 4 + i,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.5,
              }}
            />
          ))}
        </motion.div>

        {/* Floating particles */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-emerald-400/30"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.2, 0.5, 0.2],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>

        {/* Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(5,5,5,0.8)_100%)]" />
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 max-w-[900px] mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 60, filter: "blur(10px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: customEase }}
          className="space-y-8"
        >
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.08]">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span className="text-[11px] font-medium tracking-wider text-white/50 uppercase">
              Privacy-First Burnout Detection
            </span>
          </div>

          {/* Main headline */}
          <h2 className="text-[48px] md:text-[72px] font-bold text-white leading-[1.0] tracking-[-0.03em]">
            Ready to see what{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              your data
            </span>
            <br />is telling you?
          </h2>

          {/* Subtext */}
          <p className="text-[18px] md:text-[20px] text-white/40 max-w-xl mx-auto leading-relaxed">
            Join engineering leaders using Sentinel to build healthier, 
            more resilient teams — without surveillance.
          </p>

          {/* CTA Buttons with extreme hover physics */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            {/* Primary CTA - Double-bezel with magnetic hover */}
            <Link href="/demo">
              <motion.button
                className="group relative p-[2px] rounded-full"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Outer gradient ring */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-400 opacity-80 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Inner button */}
                <div className="relative flex items-center gap-3 px-10 py-5 rounded-full bg-[#050505] text-[17px] font-semibold text-white border border-emerald-500/30 overflow-hidden">
                  {/* Hover fill */}
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <span className="relative z-10">Try Interactive Demo</span>
                  
                  {/* Magnetic icon container */}
                  <div className="relative z-10 w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500/30 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
                    <Play className="w-5 h-5 text-emerald-400 fill-emerald-400" />
                  </div>
                </div>
              </motion.button>
            </Link>

            {/* Secondary CTA */}
            <Link href="/login">
              <motion.button
                className="group flex items-center gap-3 px-8 py-5 rounded-full text-[16px] font-medium text-white/70 hover:text-white border border-white/[0.12] hover:border-white/[0.25] bg-white/[0.03] hover:bg-white/[0.06] transition-all duration-500"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span>Start Free Trial</span>
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-500">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </motion.button>
            </Link>
          </div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.5, ease: customEase }}
            className="pt-12 flex flex-wrap items-center justify-center gap-6 text-[13px] text-white/30"
          >
            {[
              { label: "Starter", value: "$4/mo" },
              { label: "Pro", value: "$8/mo" },
              { label: "Enterprise", value: "$15/mo" }
            ].map((tier, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/50" />
                <span className="text-white/40">{tier.label}:</span>
                <span className="text-white/60 font-medium">{tier.value}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#050505] to-transparent pointer-events-none" />
    </section>
  )
}
