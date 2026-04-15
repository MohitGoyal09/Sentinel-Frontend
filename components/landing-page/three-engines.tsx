"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Activity, Network, Thermometer, Shield } from "lucide-react"

function PressureGaugeVisualization() {
  const [mounted, setMounted] = useState(false)
  const [angle, setAngle] = useState(-75)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      setTimeout(() => setAngle(60), 500)
      setTimeout(() => setAngle(78), 2500)
    }
  }, [mounted])

  return (
    <div className="relative h-44 flex items-center justify-center">
      <svg viewBox="0 0 200 120" className="w-full h-full">
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="60%" stopColor="#10B981" />
            <stop offset="80%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#EF4444" />
          </linearGradient>
          <filter id="gaugeGlow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="url(#gaugeGrad)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray="251"
          strokeDashoffset="50"
          opacity="0.25"
        />

        {[-60, -30, 0, 30, 60, 90].map((tickAngle, i) => {
          const rad = ((tickAngle - 90) * Math.PI) / 180
          const x1 = 100 + 65 * Math.cos(rad)
          const y1 = 100 + 65 * Math.sin(rad)
          const x2 = 100 + 75 * Math.cos(rad)
          const y2 = 100 + 75 * Math.sin(rad)
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="1"
            />
          )
        })}

        <motion.g
          style={{
            rotate: angle,
            originX: 100,
            originY: 100,
          }}
          filter="url(#gaugeGlow)"
        >
          <line
            x1="100"
            y1="100"
            x2="100"
            y2="30"
            stroke="#10B981"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx="100" cy="100" r="6" fill="#10B981" />
        </motion.g>

        <text
          x="100"
          y="115"
          textAnchor="middle"
          fill="#10B981"
          fontSize="9"
          fontFamily="monospace"
          letterSpacing="0.1em"
        >
          CRITICAL
        </text>
      </svg>

      <div className="absolute bottom-2 left-0 right-0 flex justify-center">
        <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-wider">
            Velocity &gt; 2.5
          </span>
        </div>
      </div>
    </div>
  )
}

function NetworkVisualization() {
  const [mounted, setMounted] = useState(false)
  const [drawnConnections, setDrawnConnections] = useState<number[]>([])

  const nodes = [
    { id: 0, x: 100, y: 55, size: 12, label: "Core" },
    { id: 1, x: 50, y: 90, size: 7 },
    { id: 2, x: 100, y: 105, size: 9, label: "Bridge" },
    { id: 3, x: 150, y: 90, size: 7 },
    { id: 4, x: 25, y: 60, size: 5 },
    { id: 5, x: 175, y: 60, size: 5 },
    { id: 6, x: 65, y: 30, size: 6 },
    { id: 7, x: 135, y: 30, size: 6 },
    { id: 8, x: 100, y: 10, size: 4 },
  ]

  const connections = [
    { from: 0, to: 1 },
    { from: 0, to: 2 },
    { from: 0, to: 3 },
    { from: 0, to: 6 },
    { from: 0, to: 7 },
    { from: 1, to: 2 },
    { from: 2, to: 3 },
    { from: 1, to: 4 },
    { from: 3, to: 5 },
    { from: 6, to: 8 },
    { from: 7, to: 8 },
    { from: 4, to: 6 },
    { from: 5, to: 7 },
  ]

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      connections.forEach((_, i) => {
        setTimeout(() => {
          setDrawnConnections((prev) => [...prev, i])
        }, 300 + i * 80)
      })
    }
  }, [mounted])

  return (
    <div className="relative h-44 flex items-center justify-center">
      <svg viewBox="0 0 200 130" className="w-full h-full">
        <defs>
          <filter id="nodeGlow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {connections.map((conn, i) => {
          const fromNode = nodes[conn.from]
          const toNode = nodes[conn.to]
          const isHighlighted =
            drawnConnections.includes(i) &&
            (conn.from === 0 || conn.to === 0 || conn.from === 2 || conn.to === 2)

          return (
            <motion.line
              key={i}
              x1={fromNode.x}
              y1={fromNode.y}
              x2={toNode.x}
              y2={toNode.y}
              stroke={isHighlighted ? "#8B5CF6" : "rgba(255,255,255,0.08)"}
              strokeWidth={isHighlighted ? 2 : 1}
              initial={{ opacity: 0 }}
              animate={{ opacity: drawnConnections.includes(i) ? 1 : 0 }}
              transition={{ duration: 0.2 }}
            />
          )
        })}

        {nodes.map((node) => {
          const isCore = node.label === "Core"
          const isBridge = node.label === "Bridge"
          return (
            <motion.circle
              key={node.id}
              cx={node.x}
              cy={node.y}
              r={node.size}
              fill={isCore || isBridge ? "#8B5CF6" : "rgba(139,92,246,0.15)"}
              stroke={isCore || isBridge ? "#8B5CF6" : "rgba(139,92,246,0.3)"}
              strokeWidth={isCore || isBridge ? 2 : 1}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              filter={isCore || isBridge ? "url(#nodeGlow)" : undefined}
            />
          )
        })}

        <motion.circle
          cx="100"
          cy="55"
          r="18"
          fill="none"
          stroke="#8B5CF6"
          strokeWidth="1"
          strokeDasharray="3 3"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 0.4, scale: 1 }}
        >
          <animate attributeName="r" values="18;22;18" dur="2s" repeatCount="Infinity" />
          <animate
            attributeName="opacity"
            values="0.4;0.1;0.4"
            dur="2s"
            repeatCount="Infinity"
          />
        </motion.circle>
      </svg>

      <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-purple-500/10 border border-purple-500/20">
        <span className="text-[9px] font-mono text-purple-400">
          Betweenness: 0.72
        </span>
      </div>
    </div>
  )
}

function HeatMapVisualization() {
  const [mounted, setMounted] = useState(false)
  const [cells, setCells] = useState<
    { x: number; y: number; intensity: number; delay: number }[]
  >([])

  useEffect(() => {
    setMounted(true)
    const gridSize = 7
    const newCells: { x: number; y: number; intensity: number; delay: number }[] = []
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const distFromCenter = Math.sqrt(Math.pow(x - 3, 2) + Math.pow(y - 3, 2))
        const baseIntensity = Math.max(0, 1 - distFromCenter / 4)
        const randomFactor = 0.5 + Math.random() * 0.5
        newCells.push({
          x,
          y,
          intensity: baseIntensity * randomFactor,
          delay: distFromCenter * 0.1 + Math.random() * 0.3,
        })
      }
    }
    setCells(newCells)
  }, [])

  const cellSize = 100 / 7

  return (
    <div className="relative h-44 overflow-hidden rounded-lg">
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        preserveAspectRatio="none"
      >
        <defs>
          <filter id="heatGlow">
            <feGaussianBlur stdDeviation="1" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {cells.map((cell, i) => {
          const heatColor =
            cell.intensity > 0.7
              ? "#EF4444"
              : cell.intensity > 0.4
                ? "#F59E0B"
                : cell.intensity > 0.2
                  ? "#84CC16"
                  : "rgba(255,255,255,0.02)"

          return (
            <motion.rect
              key={i}
              x={cell.x * cellSize + 0.5}
              y={cell.y * cellSize + 0.5}
              width={cellSize - 1}
              height={cellSize - 1}
              fill={heatColor}
              initial={{ opacity: 0 }}
              animate={{
                opacity: [0.3, 0.8, 0.3],
                scale: [1, 1.08, 1],
              }}
              transition={{
                delay: cell.delay,
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              filter={cell.intensity > 0.5 ? "url(#heatGlow)" : undefined}
            />
          )
        })}
      </svg>

      <div className="absolute bottom-2 left-0 right-0 flex justify-center items-center gap-2">
        <span className="text-[8px] font-mono text-white/30">LOW</span>
        <div className="w-16 h-1.5 rounded-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500" />
        <span className="text-[8px] font-mono text-white/30">HIGH</span>
      </div>

      <div className="absolute top-2 right-2 px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20">
        <span className="text-[9px] font-mono text-amber-400">SIR: 0.83</span>
      </div>
    </div>
  )
}

const engines = [
  {
    name: "Safety Valve",
    tagline: "Burnout Prevention",
    icon: Activity,
    color: "#10B981",
    signals: ["Velocity", "Belongingness", "Circadian Entropy"],
    threshold: "velocity > 2.5 AND belongingness < 0.3 AND entropy > 1.5",
    result: "→ CRITICAL",
    visualization: <PressureGaugeVisualization />,
  },
  {
    name: "Talent Scout",
    tagline: "Hidden Gem Discovery",
    icon: Network,
    color: "#8B5CF6",
    signals: ["Betweenness Centrality", "Eigenvector Centrality", "Unblocking Score"],
    threshold: "betweenness > 0.4 AND eigenvector > 0.6",
    result: "→ HIDDEN GEM",
    visualization: <NetworkVisualization />,
  },
  {
    name: "Culture Thermometer",
    tagline: "Team Health",
    icon: Thermometer,
    color: "#F59E0B",
    signals: ["SIR Contagion Model", "Fragmentation Index", "Communication Decay"],
    threshold: "sir > 0.7 AND fragmentation < 0.3",
    result: "→ HEALTHY",
    visualization: <HeatMapVisualization />,
  },
]

export default function ThreeEngines() {
  return (
    <section id="engines" className="relative py-24 md:py-32 overflow-hidden bg-black">
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-gradient-to-b from-emerald-500/[0.03] via-transparent to-transparent" />
      </div>

      <div className="max-w-[1200px] mx-auto px-[5vw] relative z-10">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-px bg-emerald-500/60" />
            <span className="text-[10px] uppercase tracking-[0.25em] text-emerald-500/70">
              Three Specialized Engines
            </span>
            <div className="w-10 h-px bg-emerald-500/60" />
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-white mb-4 tracking-tight">
            The <span className="text-emerald-400 font-serif italic">math</span> that
            sees.
          </h2>

          <p className="text-white/50 max-w-lg mx-auto">
            Three engines analyze metadata from your tools. Each focuses on a different
            signal of organizational health.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {engines.map((engine, index) => {
            const IconComponent = engine.icon
            return (
              <motion.div
                key={engine.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group"
              >
                <div
                  className="relative h-full rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.03] to-transparent overflow-hidden transition-all duration-500 hover:border-white/20"
                  style={{
                    borderColor: `${engine.color}20`,
                  }}
                >
                  <div className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{
                          background: `${engine.color}15`,
                          border: `1px solid ${engine.color}30`,
                        }}
                      >
                        <IconComponent
                          className="w-6 h-6"
                          style={{ color: engine.color }}
                        />
                      </div>
                      <div>
                        <h3
                          className="text-xl font-semibold text-white tracking-tight"
                          style={{ color: engine.color }}
                        >
                          {engine.name}
                        </h3>
                        <p className="text-xs text-white/40">{engine.tagline}</p>
                      </div>
                    </div>

                    <div className="mb-5">{engine.visualization}</div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {engine.signals.map((signal) => (
                        <span
                          key={signal}
                          className="px-2.5 py-1 text-[10px] rounded-md font-mono uppercase tracking-wider"
                          style={{
                            background: `${engine.color}10`,
                            color: engine.color,
                            border: `1px solid ${engine.color}25`,
                          }}
                        >
                          {signal}
                        </span>
                      ))}
                    </div>

                    <div className="p-3 rounded-lg bg-black/40">
                      <div className="flex items-center gap-2 mb-1">
                        <Shield className="w-3 h-3 text-white/30" />
                        <span className="text-[10px] text-white/40 uppercase tracking-wider">
                          Threshold
                        </span>
                      </div>
                      <code className="text-xs font-mono text-white/60 block">
                        {engine.threshold}
                      </code>
                      <span className="text-xs font-mono mt-1 block" style={{ color: engine.color }}>
                        {engine.result}
                      </span>
                    </div>
                  </div>

                  <div
                    className="absolute top-0 right-0 w-32 h-32 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      background: `radial-gradient(circle at 100% 0%, ${engine.color}10 0%, transparent 70%)`,
                    }}
                  />
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}