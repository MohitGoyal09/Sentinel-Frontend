"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import { X, Check, Clock, Zap, Shield, Database, User } from "lucide-react"
import { TiltCard } from "./tilt-card"

const customEase = [0.32, 0.72, 0, 1] as [number, number, number, number]

interface ComparisonItem {
  icon: React.ComponentType<{ className?: string }>
  problem: { title: string; desc: string; detail: string }
  solution: { title: string; desc: string; detail: string }
}

const comparisonData: ComparisonItem[] = [
  {
    icon: Clock,
    problem: { title: "Exit Interview", desc: "6 months too late", detail: "They've already resigned" },
    solution: { title: "Early Warning", desc: "2-4 weeks ahead", detail: "Intervention window open" }
  },
  {
    icon: Zap,
    problem: { title: "Annual Survey", desc: "Stale in 2 weeks", detail: "Snapshot decays immediately" },
    solution: { title: "Continuous Signals", desc: "Real-time patterns", detail: "Always-on velocity tracking" }
  },
  {
    icon: Shield,
    problem: { title: "Reads Content", desc: "Surveillance risk", detail: "Message content visible" },
    solution: { title: "Metadata Only", desc: "Timestamps only", detail: "Never what you write" }
  },
  {
    icon: Database,
    problem: { title: "Same Database", desc: "Employer sees all", detail: "Names + behavior linked" },
    solution: { title: "Two Vaults", desc: "Math-separated", detail: "No JOIN possible" }
  },
  {
    icon: User,
    problem: { title: "Absolute Hours", desc: "Punishes night owls", detail: "50hr workers flagged" },
    solution: { title: "Personal Delta", desc: "Your baseline", detail: "Only sudden shifts trigger" }
  }
]

// Glitch text effect
function GlitchText({ text }: { text: string }) {
  return (
    <span className="relative inline-block">
      <span className="relative z-10">{text}</span>
      <span 
        className="absolute top-0 left-0 -ml-[2px] text-rose-400/50 animate-pulse"
        aria-hidden="true"
      >
        {text}
      </span>
    </span>
  )
}

// 3D Flip Card - FIXED: Removed fixed heights
function FlipCard({ 
  data, 
  isFlipped,
  onFlip 
}: { 
  data: ComparisonItem
  isFlipped: boolean
  onFlip: () => void
}) {
  const IconComponent = data.icon
  
  return (
    <div className="relative h-full" onClick={onFlip}>
      <motion.div
        className="relative w-full h-full cursor-pointer"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: customEase }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* FRONT: Problem Side */}
        <div 
          className="absolute inset-0 backface-hidden rounded-2xl"
          style={{ backfaceVisibility: "hidden" }}
        >
          <TiltCard intensity={5} className="h-full">
            <div className="h-full p-6 bg-[#0a0a0a] border border-rose-500/20 rounded-2xl relative overflow-hidden">
              {/* Scan lines */}
              <div 
                className="absolute inset-0 opacity-5 pointer-events-none"
                style={{
                  background: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(244,63,94,0.1) 2px, rgba(244,63,94,0.1) 4px)`
                }}
              />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                    <IconComponent className="w-5 h-5 text-rose-400" />
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-rose-500/10 border border-rose-500/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                    <span className="text-[10px] font-bold tracking-wider text-rose-400 uppercase">Broken</span>
                  </div>
                </div>

                <h3 className="text-[18px] font-semibold text-white/80 mb-2">
                  <GlitchText text={data.problem.title} />
                </h3>
                <p className="text-[14px] text-rose-400/80 mb-1">{data.problem.desc}</p>
                <p className="text-[12px] text-white/30">{data.problem.detail}</p>

                <div className="mt-4 pt-4 border-t border-white/[0.06]">
                  <span className="text-[11px] text-white/20">Click to transform →</span>
                </div>
              </div>
            </div>
          </TiltCard>
        </div>

        {/* BACK: Solution Side */}
        <div 
          className="absolute inset-0 backface-hidden rounded-2xl"
          style={{ 
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)"
          }}
        >
          <TiltCard intensity={5} className="h-full">
            <div className="h-full p-6 bg-[#0a0a0a] border border-emerald-500/30 rounded-2xl relative overflow-hidden shadow-[0_0_30px_rgba(16,185,129,0.1)]">
              {/* Success particles */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 rounded-full bg-emerald-400/40"
                    style={{ left: `${20 + i * 30}%`, top: `${30 + i * 20}%` }}
                    animate={{ y: [0, -10, 0], opacity: [0.2, 0.6, 0.2] }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                  />
                ))}
              </div>

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                    <IconComponent className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="text-[10px] font-bold tracking-wider text-emerald-400 uppercase">Fixed</span>
                  </div>
                </div>

                <h3 className="text-[18px] font-semibold text-white mb-2">{data.solution.title}</h3>
                <p className="text-[14px] text-emerald-400 mb-1">{data.solution.desc}</p>
                <p className="text-[12px] text-emerald-400/60">{data.solution.detail}</p>

                <div className="mt-4 pt-4 border-t border-white/[0.06]">
                  <span className="text-[11px] text-white/30">← Click to compare</span>
                </div>
              </div>
            </div>
          </TiltCard>
        </div>
      </motion.div>
    </div>
  )
}

export function ProblemSolutionSection() {
  const [flippedCards, setFlippedCards] = useState<number[]>([])

  const toggleFlip = (index: number) => {
    setFlippedCards(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    )
  }

  return (
    <section id="comparison" className="relative bg-[#050505] py-24 md:py-32 overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-6 md:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: customEase }}
          className="text-center mb-12 md:mb-16"
        >
          <div className="inline-block px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] mb-4">
            <span className="text-[10px] font-semibold tracking-wider text-white/40 uppercase">Why Sentinel</span>
          </div>
          <h2 className="text-[32px] md:text-[48px] font-bold leading-[1.1] tracking-tight">
            <span className="text-white">From </span>
            <span className="text-rose-400">broken</span>
            <span className="text-white"> to </span>
            <span className="text-emerald-400">fixed</span>
          </h2>
          <p className="mt-4 text-[16px] text-white/40 max-w-lg mx-auto">
            Click each card to see the transformation
          </p>
        </motion.div>

        {/* Cards Grid - FIXED: Proper spacing, no overlap */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {comparisonData.map((data, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: customEase }}
              className="aspect-[4/5] md:aspect-auto md:min-h-[280px]"
            >
              <FlipCard 
                data={data}
                isFlipped={flippedCards.includes(i)}
                onFlip={() => toggleFlip(i)}
              />
            </motion.div>
          ))}
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4, ease: customEase }}
          className="mt-16 md:mt-20"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
            {[
              { val: "$150K–$300K", label: "Cost per resignation" },
              { val: "$4–$15", label: "Per employee / month", accent: true },
              { val: "10x+", label: "ROI on prevention" }
            ].map((stat, i) => (
              <div 
                key={i} 
                className={`p-6 rounded-2xl border text-center ${
                  stat.accent 
                    ? 'bg-emerald-500/5 border-emerald-500/20' 
                    : 'bg-white/[0.02] border-white/[0.06]'
                }`}
              >
                <div className={`text-[32px] md:text-[40px] font-bold tracking-tight ${stat.accent ? 'text-emerald-400' : 'text-white/80'}`}>
                  {stat.val}
                </div>
                <div className="text-[12px] text-white/40 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
