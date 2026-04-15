"use client"

import { useRef, useState, useEffect } from "react"
import { motion, useScroll, useTransform } from "framer-motion"

const timelineEvents = [
  {
    day: -18,
    label: "Signal",
    title: "First Anomalous Pattern",
    description:
      "AI detected subtle deviation from work patterns. Response time increased by 23%. First statistical signal in the noise.",
    risk: "low",
    color: "#10B981",
    detail: "Velocity baseline deviation detected",
  },
  {
    day: -14,
    label: "Entropy",
    title: "Behavioral Entropy Rising",
    description:
      "Collaboration graph shows 31% reduction in spontaneous interactions. Digital footprint becoming increasingly irregular.",
    risk: "medium",
    color: "#10B981",
    detail: "Shannon entropy increase: 0.4 → 0.7",
  },
  {
    day: -7,
    label: "Belongingness",
    title: "Connection Atrophy",
    description:
      "Team sync participation dropped to 40%. Internal messages decreased 67%. The invisible thread of belonging is fraying.",
    risk: "medium-high",
    color: "#F59E0B",
    detail: "Eigenvector centrality declining",
  },
  {
    day: -3,
    label: "Critical",
    title: "Pre-Resignation Signature",
    description:
      "Pattern matches historical burnout cases with 94% accuracy. Document access patterns shifted. Recovery probability: low without intervention.",
    risk: "high",
    color: "#EF4444",
    detail: "94% match probability",
  },
  {
    day: -1,
    label: "Manager Review",
    title: "Human Intervention Attempt",
    description:
      "Manager notified. Check-in scheduled. Employee expressed 'everything is fine.' SENTINEL confidence: intervention will fail.",
    risk: "critical",
    color: "#DC2626",
    detail: "Confidence: 87% failure",
  },
  {
    day: 0,
    label: "Resignation",
    title: "Talent Departure",
    description:
      "Resignation letter submitted. SENTINEL prediction confirmed. Cost to organization: 150% of annual salary in replacement costs.",
    risk: "critical",
    color: "#991B1B",
    detail: "Cost impact: $150K",
  },
]

// Hover Reveal Card Component
function HoverRevealCard({
  event,
  index,
  isActive,
  position,
}: {
  event: (typeof timelineEvents)[0]
  index: number
  isActive: boolean
  position: number // 0 = left hidden, 1 = center active, 2 = right visible
}) {
  const [isHovered, setIsHovered] = useState(false)

  // Bento-style card positioning
  const getCardStyles = () => {
    switch (position) {
      case 0: // Left, inactive
        return {
          x: -150,
          scale: 0.7,
          opacity: 0.3,
          zIndex: 1,
        }
      case 1: // Center, active
        return {
          x: 0,
          scale: 1,
          opacity: 1,
          zIndex: 10,
        }
      case 2: // Right, upcoming
        return {
          x: 150,
          scale: 0.85,
          opacity: 0.6,
          zIndex: 5,
        }
      default:
        return { x: 300, scale: 0.7, opacity: 0, zIndex: 1 }
    }
  }

  const styles = getCardStyles()

  return (
    <motion.div
      className="absolute left-1/2 top-1/2 w-[380px] md:w-[440px]"
      initial={{ x: -200, y: "-50%", scale: 0.8, opacity: 0 }}
      animate={{
        x: `calc(-50% + ${styles.x}px)`,
        y: "-50%",
        scale: styles.scale,
        opacity: styles.opacity,
      }}
      transition={{
        type: "spring",
        stiffness: 80,
        damping: 20,
      }}
      style={{ zIndex: styles.zIndex }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className="relative overflow-hidden rounded-2xl border transition-all duration-500 cursor-pointer"
        style={{
          background: `linear-gradient(145deg, ${event.color}05 0%, #0a0a0a 50%, ${event.color}05 100%)`,
          borderColor: isHovered || isActive ? `${event.color}60` : `${event.color}20`,
          boxShadow:
            isHovered || isActive
              ? `0 0 60px ${event.color}30, 0 20px 40px rgba(0,0,0,0.5)`
              : "0 10px 30px rgba(0,0,0,0.3)",
        }}
      >
        {/* Hover reveal background */}
        <motion.div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at 50% 0%, ${event.color}20 0%, transparent 60%)`,
          }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />

        {/* Pulsing glow for critical */}
        {isActive && (event.risk === "high" || event.risk === "critical") && (
          <motion.div
            className="absolute inset-0 rounded-2xl pointer-events-none"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{
              boxShadow: `inset 0 0 30px ${event.color}30`,
            }}
          />
        )}

        <div className="relative z-10 p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <motion.div
              className="px-4 py-1.5 rounded-full text-[10px] font-mono font-semibold tracking-widest uppercase"
              style={{
                background: isHovered ? `${event.color}30` : `${event.color}15`,
                color: event.color,
                border: `1px solid ${event.color}40`,
              }}
              animate={{
                scale: isHovered ? 1.05 : 1,
              }}
              transition={{ duration: 0.2 }}
            >
              Day {event.day}
            </motion.div>

            <div className="flex items-center gap-2">
              <span
                className="text-[10px] font-mono tracking-widest uppercase"
                style={{ color: event.color }}
              >
                {event.label}
              </span>
              <motion.div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: event.color }}
                animate={
                  isActive && event.risk === "critical"
                    ? { scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }
                    : {}
                }
                transition={{ duration: 1.2, repeat: Infinity }}
              />
            </div>
          </div>

          {/* Title */}
          <h3 className="text-2xl font-semibold text-white mb-4 tracking-tight leading-tight">
            {event.title}
          </h3>

          {/* Description - always visible */}
          <p className="text-sm leading-relaxed text-white/50 mb-6">
            {event.description}
          </p>

          {/* Hover reveal detail */}
          <motion.div
            className="overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{
              height: isHovered ? "auto" : 0,
              opacity: isHovered ? 1 : 0,
            }}
            transition={{ duration: 0.3 }}
          >
            <div
              className="pt-4 border-t border-white/10 flex items-center gap-3"
              style={{ borderColor: `${event.color}30` }}
            >
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: event.color }}
              />
              <span className="text-xs font-mono" style={{ color: event.color }}>
                {event.detail}
              </span>
            </div>
          </motion.div>

          {/* Progress bar */}
          <div className="pt-4 border-t border-white/5">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-[3px] rounded-full overflow-hidden bg-white/5">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: event.color }}
                  animate={
                    isActive
                      ? { width: ["0%", "100%"] }
                      : { width: "0%" }
                  }
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
              <span
                className="text-[10px] font-mono uppercase tracking-wider"
                style={{ color: event.color }}
              >
                {index * 20}%
              </span>
            </div>
          </div>
        </div>

        {/* Bottom accent line */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-[2px]"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${event.color}80 50%, transparent 100%)`,
          }}
          animate={{ opacity: isHovered ? 1 : 0.5 }}
        />
      </div>
    </motion.div>
  )
}

function RiskProgressBar({ progress }: { progress: number }) {
  const getColor = (p: number) => {
    if (p < 0.2) return "#10B981"
    if (p < 0.5) return "#10B981"
    if (p < 0.7) return "#F59E0B"
    return "#EF4444"
  }

  return (
    <div className="relative max-w-md mx-auto">
      <div className="flex h-3 rounded-full overflow-hidden bg-white/5 backdrop-blur-sm">
        {timelineEvents.map((event, i) => {
          const segmentStart = i / timelineEvents.length
          const isActive = progress >= segmentStart

          return (
            <div
              key={i}
              className="flex-1 relative"
              style={{
                backgroundColor: isActive ? event.color : "transparent",
                opacity: isActive ? 1 : 0.15,
              }}
            />
          )
        })}
      </div>

      <div className="flex justify-between mt-3 px-1">
        <span className="text-[10px] font-mono text-emerald-500/60 tracking-widest uppercase">
          Stable
        </span>
        <motion.span
          className="text-[10px] font-mono tracking-widest uppercase"
          style={{ color: getColor(progress) }}
        >
          {Math.round(progress * 100)}% Risk
        </motion.span>
        <span className="text-[10px] font-mono text-red-500/60 tracking-widest uppercase">
          Critical
        </span>
      </div>
    </div>
  )
}

export function SignalTimeline() {
  const containerRef = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  })

  const [scrollProgress, setScrollProgress] = useState(0)

  useEffect(() => {
    return scrollYProgress.on("change", (v) => {
      setScrollProgress(v)
    })
  }, [scrollYProgress])

  const activeIndex = Math.min(
    Math.floor(scrollProgress * timelineEvents.length),
    timelineEvents.length - 1
  )

  // Get position for each card (0 = left hidden, 1 = center active, 2 = right upcoming)
  const getCardPosition = (index: number) => {
    if (index === activeIndex) return 1
    if (index < activeIndex) return 0
    return 2
  }

  return (
    <section
      ref={containerRef}
      className="relative bg-black"
      style={{ height: `${timelineEvents.length * 100}vh` }}
    >
      <div className="sticky top-0 h-screen flex flex-col justify-center overflow-hidden">
        <div className="px-6 md:px-12 lg:px-16 py-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <motion.div
                className="w-10 h-px bg-emerald-500/60"
                initial={{ width: 0 }}
                whileInView={{ width: 40 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              />
              <span className="text-[10px] font-mono tracking-[0.3em] text-emerald-500/70 uppercase">
                Early Detection
              </span>
              <div className="w-10 h-px bg-emerald-500/60" />
            </div>

            <h2 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-white tracking-tight mb-3">
              18 Days Before
              <span className="block text-emerald-400 font-serif italic">
                Resignation
              </span>
            </h2>

            <p className="text-base text-white/50 max-w-lg mx-auto">
              Sentinel detected burnout 18 days before the employee submitted their
              resignation. Each signal, invisible alone, told a story.
            </p>
          </motion.div>

          {/* Bento-style cards container */}
          <div className="relative h-[400px] mb-10">
            {timelineEvents.map((event, index) => (
              <HoverRevealCard
                key={event.day}
                event={event}
                index={index}
                isActive={index === activeIndex}
                position={getCardPosition(index)}
              />
            ))}
          </div>

          <div className="mt-8">
            <RiskProgressBar progress={scrollProgress} />
          </div>
        </div>

        <div className="mt-auto px-6 md:px-12 lg:px-16 pb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-mono text-white/40 tracking-widest">
                SENTINEL ACTIVE
              </span>
            </div>
            <div className="text-[10px] font-mono text-white/30 tracking-wider">
              SCROLL TO EXPLORE
              <span className="ml-2 text-white/50">→</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}