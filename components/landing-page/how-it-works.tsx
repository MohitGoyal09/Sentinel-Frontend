"use client"

import { useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import { Hash, Calculator, Sparkles, Bell, ArrowRight } from "lucide-react"

const customEase = [0.32, 0.72, 0, 1] as [number, number, number, number]

const steps = [
  {
    number: "01",
    title: "Ingest Metadata",
    description: "Connect GitHub, Slack, Jira, Calendar. Capture timestamps, event counts, response latencies. Immediate HMAC-SHA256 hashing.",
    icon: Hash,
    color: "emerald",
    detail: "Never message content"
  },
  {
    number: "02",
    title: "Math Decides",
    description: "NumPy/SciPy computes velocity (linregress), circadian entropy (Shannon), belongingness (reply rates). Deterministic. 94% confidence gates.",
    icon: Calculator,
    color: "amber",
    detail: "Zero AI in decisions"
  },
  {
    number: "03",
    title: "AI Writes",
    description: "LLM generates human-readable narratives and 1:1 talking points from math output. AI sees only aggregated scores.",
    icon: Sparkles,
    color: "blue",
    detail: "Never raw data"
  },
  {
    number: "04",
    title: "Early Warning",
    description: "Risk scores surface 2-4 weeks early. Employees see own dashboard first. Managers see anonymized aggregates only.",
    icon: Bell,
    color: "rose",
    detail: "Intervention window"
  }
]

export function HowItWorksSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  })

  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-50%"])

  return (
    <section id="how-it-works" ref={containerRef} className="relative bg-[#050505] py-32 md:py-40 overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-emerald-500/[0.03] blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-amber-500/[0.02] blur-[120px]" />
      </div>

      <div className="max-w-[1400px] mx-auto px-6 md:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 40, filter: "blur(4px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1, ease: customEase }}
          className="flex flex-col items-center text-center mb-16 md:mb-24"
        >
          <div className="mb-6 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08]">
            <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-white/40">
              How It Works
            </span>
          </div>
          
          <h2 className="text-[36px] md:text-[56px] font-bold text-white leading-[1.05] tracking-[-0.03em]">
            From signal to insight.
          </h2>
          
          <p className="mt-6 text-[18px] text-white/40 max-w-2xl leading-relaxed">
            Four stages. Three are pure math. One is AI narration. Zero surveillance.
          </p>
        </motion.div>

        {/* Horizontal scroll container for desktop */}
        <div className="hidden md:block">
          <motion.div 
            style={{ x }}
            className="flex gap-8"
          >
            {steps.map((step, i) => {
              const IconComponent = step.icon
              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 60, rotate: i % 2 === 0 ? -3 : 3 }}
                  whileInView={{ opacity: 1, y: 0, rotate: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 1, delay: i * 0.15, ease: customEase }}
                  className="group flex-shrink-0 w-[400px]"
                  style={{ zIndex: steps.length - i }}
                >
                  {/* Double-bezel card with Z-depth */}
                  <div className={`p-[2px] rounded-[2rem] bg-gradient-to-br from-${step.color}-500/20 via-${step.color}-500/5 to-transparent h-full`}>
                    <div className="relative h-full rounded-[calc(2rem-2px)] bg-[#0a0a0a]/90 border border-white/[0.06] p-8 overflow-hidden">
                      {/* Large background number */}
                      <div className="absolute top-4 right-4 text-[120px] font-bold text-white/[0.02] leading-none select-none">
                        {step.number}
                      </div>

                      {/* Content */}
                      <div className="relative z-10">
                        {/* Icon and step number */}
                        <div className="flex items-center justify-between mb-8">
                          <div className={`w-14 h-14 rounded-2xl bg-${step.color}-500/10 border border-${step.color}-500/20 flex items-center justify-center`}>
                            <IconComponent className={`w-7 h-7 text-${step.color}-400`} />
                          </div>
                          <span className={`text-[12px] font-mono font-bold tracking-wider text-${step.color}-400/60`}>
                            {step.number}
                          </span>
                        </div>

                        {/* Title and description */}
                        <h3 className="text-[24px] font-bold text-white/90 mb-4">{step.title}</h3>
                        <p className="text-[15px] text-white/40 leading-relaxed mb-6">{step.description}</p>

                        {/* Detail pill */}
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-${step.color}-500/10 border border-${step.color}-500/20`}>
                          <span className={`w-1.5 h-1.5 rounded-full bg-${step.color}-400`} />
                          <span className={`text-[11px] font-medium text-${step.color}-400/80`}>{step.detail}</span>
                        </div>
                      </div>

                      {/* Connection arrow (except last) */}
                      {i < steps.length - 1 && (
                        <div className="absolute -right-12 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-white/[0.03] border border-white/[0.08] flex items-center justify-center opacity-50 group-hover:opacity-100 transition-opacity">
                          <ArrowRight className="w-5 h-5 text-white/30" />
                        </div>
                      )}

                      {/* Hover glow */}
                      <div className={`absolute inset-0 bg-gradient-to-t from-${step.color}-500/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none`} />
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        </div>

        {/* Vertical stack for mobile */}
        <div className="md:hidden space-y-6">
          {steps.map((step, i) => {
            const IconComponent = step.icon
            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: i * 0.1, ease: customEase }}
                className="p-6 rounded-2xl bg-[#0a0a0a] border border-white/[0.06]"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-${step.color}-500/10 border border-${step.color}-500/20 flex items-center justify-center`}>
                    <IconComponent className={`w-6 h-6 text-${step.color}-400`} />
                  </div>
                  <span className={`text-[11px] font-mono font-bold text-${step.color}-400/60`}>{step.number}</span>
                </div>
                <h3 className="text-[20px] font-bold text-white/90 mb-2">{step.title}</h3>
                <p className="text-[14px] text-white/40 leading-relaxed">{step.description}</p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
