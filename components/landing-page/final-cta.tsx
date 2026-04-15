"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowRight, Play, Shield } from "lucide-react"
import { MagneticButton } from "@/components/ui/magnetic-button"

export function FinalCTA() {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden bg-black">
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px]">
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="absolute inset-0 rounded-full border border-white/5"
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
        </div>
      </div>

      <div className="max-w-[800px] mx-auto px-[5vw] relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-8">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span className="text-[11px] uppercase tracking-wider text-emerald-400/80">
              Privacy-First Burnout Detection
            </span>
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl leading-[1.1] text-white mb-6 tracking-tight">
            <span className="text-white/50">Ready to see what</span>
            <br />
            <span className="text-emerald-400 font-serif italic">your data</span>
            <span className="text-white/50"> is telling you?</span>
          </h2>

          <p className="text-lg text-white/50 max-w-lg mx-auto mb-10">
            Join engineering leaders using Sentinel to build healthier, more resilient
            teams — without surveillance.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/demo">
              <MagneticButton
                className="group flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium hover:from-emerald-400 hover:to-emerald-500 transition-all duration-300"
                strength={0.2}
              >
                <Play className="w-5 h-5" />
                <span>Try Interactive Demo</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </MagneticButton>
            </Link>

            <Link href="/methodology">
              <MagneticButton
                className="px-8 py-4 rounded-xl border border-white/20 text-white/70 hover:text-white hover:border-white/40 transition-colors duration-300"
                strength={0.15}
              >
                <span>Read Methodology</span>
              </MagneticButton>
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 mt-12 text-sm text-white/40">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>94% Detection Accuracy</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>2-4 Weeks Early</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
              <span>Zero Content Reading</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}