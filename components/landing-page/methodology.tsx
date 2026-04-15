"use client"

import { useEffect, useState, useRef } from "react"
import { motion, useInView } from "framer-motion"
import { Braces, FunctionSquare, FileText } from "lucide-react"

interface Particle {
  id: number
  x: number
  y: number
  color: string
  stage: number
}

function SandwichLayers() {
  const [particles, setParticles] = useState<Particle[]>([])
  const [activeLayer, setActiveLayer] = useState(0)

  const layers = [
    {
      id: "ingestion",
      icon: Braces,
      label: "Ingestion",
      sublabel: "Python",
      color: "#6366F1",
      description: "Raw metadata enters through strict validation",
      inputs: ["Timestamps", "Counts", "Network structure"],
    },
    {
      id: "analysis",
      icon: FunctionSquare,
      label: "Analysis",
      sublabel: "NumPy / SciPy",
      color: "#10B981",
      description: "Pure mathematical computation",
      inputs: ["Linear regression", "Entropy", "Network analysis"],
    },
    {
      id: "generation",
      icon: FileText,
      label: "Generation",
      sublabel: "LLM",
      color: "#8B5CF6",
      description: "AI writes text only",
      inputs: ["Report Generation", "Narrative", "Human reading"],
    },
  ]

  // Generate particles
  useEffect(() => {
    const interval = setInterval(() => {
      const colors = ["#10B981", "#6366F1", "#F59E0B", "#8B5CF6"]
      const newParticle = {
        id: Date.now() + Math.random(),
        x: 10 + Math.random() * 80,
        y: -10,
        color: colors[Math.floor(Math.random() * colors.length)],
        stage: 0,
      }
      setParticles((prev) => [...prev.slice(-15), newParticle])
    }, 500)

    return () => clearInterval(interval)
  }, [])

  // Move particles through layers
  useEffect(() => {
    const moveParticles = setInterval(() => {
      setParticles((prev) =>
        prev
          .map((p) => ({ ...p, y: p.y + 2 }))
          .filter((p) => p.y < 110)
      )
    }, 50)
    return () => clearInterval(moveParticles)
  }, [])

  // Cycle active layer
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveLayer((prev) => (prev + 1) % 3)
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative py-8 max-w-2xl mx-auto">
      {/* Flowing particles background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute w-1.5 h-1.5 rounded-full"
            style={{
              backgroundColor: particle.color,
              boxShadow: `0 0 6px ${particle.color}`,
              left: `${particle.x}%`,
              top: `${particle.y}%`,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 3 }}
          />
        ))}
      </div>

      {/* Stacked layers */}
      <div className="relative flex flex-col gap-6">
        {layers.map((layer, index) => {
          const IconComponent = layer.icon
          const isActive = activeLayer === index

          return (
            <motion.div
              key={layer.id}
              className="relative"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
            >
              {/* Connection line */}
              {index < layers.length - 1 && (
                <div className="absolute -bottom-3 left-1/2 w-px h-6 bg-gradient-to-b from-white/20 to-transparent" />
              )}

              <motion.div
                className="relative p-6 rounded-2xl border text-center overflow-hidden"
                style={{
                  background: isActive
                    ? `linear-gradient(180deg, ${layer.color}15 0%, rgba(255,255,255,0.02) 100%)`
                    : "rgba(255,255,255,0.02)",
                  borderColor: isActive
                    ? `${layer.color}50`
                    : "rgba(255,255,255,0.08)",
                  boxShadow: isActive
                    ? `0 10px 40px ${layer.color}20`
                    : "none",
                }}
                animate={{
                  scale: isActive ? 1.02 : 1,
                }}
                transition={{ duration: 0.3 }}
              >
                {/* Active glow */}
                {isActive && (
                  <motion.div
                    className="absolute inset-0 rounded-2xl pointer-events-none"
                    style={{
                      boxShadow: `inset 0 0 30px ${layer.color}15`,
                    }}
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}

                <div className="relative z-10">
                  {/* Icon and title row */}
                  <div className="flex items-center justify-center gap-4 mb-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{
                        background: `${layer.color}15`,
                        border: `1px solid ${layer.color}30`,
                      }}
                    >
                      <IconComponent
                        className="w-6 h-6"
                        style={{ color: layer.color }}
                      />
                    </div>
                    <div className="text-left">
                      <h4
                        className="text-lg font-semibold"
                        style={{
                          color: isActive ? layer.color : "rgba(255,255,255,0.7)",
                        }}
                      >
                        {layer.label}
                      </h4>
                      <p className="text-xs text-white/40">{layer.sublabel}</p>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-white/50 mb-3">{layer.description}</p>

                  {/* Inputs as tags */}
                  <div className="flex flex-wrap justify-center gap-2">
                    {layer.inputs.map((input) => (
                      <span
                        key={input}
                        className="px-2 py-1 text-[10px] rounded-md font-mono uppercase tracking-wider"
                        style={{
                          background: isActive ? `${layer.color}20` : "rgba(255,255,255,0.05)",
                          color: isActive ? layer.color : "rgba(255,255,255,0.4)",
                          border: `1px solid ${isActive ? layer.color + "30" : "rgba(255,255,255,0.1)"}`,
                        }}
                      >
                        {input}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Arrow between layers */}
              {index < layers.length - 1 && (
                <motion.div
                  className="absolute -bottom-6 left-1/2 -translate-x-1/2 z-10"
                  animate={{ opacity: isActive ? 1 : 0.3 }}
                >
                  <div
                    className="w-0 h-0 border-l-[8px] border-r-[8px] border-t-[10px] border-l-transparent border-r-transparent"
                    style={{ borderTopColor: layer.color }}
                  />
                </motion.div>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

function CorePrinciple() {
  return (
    <motion.div
      className="relative mt-12 p-8 md:p-10 rounded-2xl overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay: 0.4 }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-emerald-500/5" />
      <div className="absolute inset-0 border border-white/10 rounded-2xl" />

      {/* Animated border */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(16,185,129,0.2), transparent)",
          backgroundSize: "200% 100%",
          opacity: 0.5,
        }}
        animate={{ backgroundPosition: ["0% 0%", "200% 0%"] }}
        transition={{ duration: 3, repeat: Infinity }}
      />

      <div className="relative flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10">
        <div className="text-center md:text-left">
          <span className="text-2xl md:text-3xl font-bold text-purple-400">
            AI writes text.
          </span>
        </div>

        <div className="hidden md:block w-px h-10 bg-gradient-to-b from-transparent via-white/20 to-transparent" />

        <div className="flex items-center gap-3">
          <motion.div
            className="w-3 h-3 rounded-full bg-emerald-400"
            animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <span className="text-lg text-white/60">Math makes decisions.</span>
        </div>
      </div>

      <p className="relative text-center text-white/40 mt-6 text-sm max-w-lg mx-auto">
        No black-box AI making burnout decisions. Every finding traces back to
        deterministic algorithms with explainable outputs.
      </p>

      <div className="relative flex justify-center mt-6">
        <motion.div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20"
          animate={{ boxShadow: ["0 0 0 rgba(16,185,129,0)", "0 0 20px rgba(16,185,129,0.3)", "0 0 0 rgba(16,185,129,0)"] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <motion.div
            className="w-2 h-2 rounded-full bg-emerald-400"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <span className="text-xs uppercase tracking-wider text-emerald-400/80">
            Deterministic Mode Active
          </span>
        </motion.div>
      </div>
    </motion.div>
  )
}

export function Methodology() {
  const sectionRef = useRef<HTMLDivElement>(null)

  return (
    <section
      id="methodology"
      ref={sectionRef}
      className="relative py-24 md:py-32 overflow-hidden bg-black"
    >
      <div className="absolute inset-0">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[500px] opacity-50"
          style={{
            background:
              "radial-gradient(ellipse, rgba(99,102,241,0.08) 0%, transparent 70%)",
          }}
        />
      </div>

      <div className="max-w-[1000px] mx-auto px-[5vw] relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-px bg-emerald-500/60" />
            <span className="text-[10px] uppercase tracking-[0.25em] text-emerald-500/70">
              The Science
            </span>
            <div className="w-10 h-px bg-emerald-500/60" />
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-white mb-4 tracking-tight">
            The Science of{" "}
            <span className="text-emerald-400 font-serif italic">Signals</span>
          </h2>

          <p className="text-white/50 max-w-lg mx-auto">
            Deterministic sandwich architecture: math makes decisions, AI writes text.
          </p>
        </motion.div>

        <SandwichLayers />

        <CorePrinciple />
      </div>
    </section>
  )
}