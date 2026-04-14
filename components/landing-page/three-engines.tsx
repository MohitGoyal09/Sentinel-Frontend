"use client"

import { motion } from "framer-motion"
import { Activity, Network, Thermometer } from "lucide-react"
import { TiltCard } from "./tilt-card"

const customEase = [0.32, 0.72, 0, 1] as [number, number, number, number]

// ─── Living ECG Waveform ───
function LivingECG({ isCritical = true }: { isCritical?: boolean }) {
  // Generate ECG path with realistic P-QRS-T waves
  const generateECGPath = () => {
    const points = []
    for (let i = 0; i <= 100; i++) {
      const x = i
      const cycle = i % 20
      let y = 50
      
      if (cycle === 2) y = 35 // P wave
      else if (cycle === 5) y = 80 // Q
      else if (cycle === 6) y = 5 // R spike (critical high)
      else if (cycle === 7) y = 70 // S
      else if (cycle === 12) y = 40 // T wave
      
      points.push(`${x},${y}`)
    }
    return points.join(' ')
  }

  return (
    <div className="relative w-full h-[180px] overflow-hidden">
      {/* Grid background */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(244,63,94,0.3) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(244,63,94,0.3) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
        }}
      />

      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
        <defs>
          <linearGradient id="ecgGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.2" />
            <stop offset="50%" stopColor="#f43f5e" stopOpacity="1" />
            <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.2" />
          </linearGradient>
          <filter id="ecgGlow">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Multiple waveforms with offset */}
        {[0, 1, 2].map((offset) => (
          <motion.polyline
            key={offset}
            points={generateECGPath()}
            fill="none"
            stroke="url(#ecgGrad)"
            strokeWidth={offset === 1 ? 1.5 : 0.8}
            filter={offset === 1 ? "url(#ecgGlow)" : undefined}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ 
              pathLength: [0, 1, 1],
              opacity: [0, 1, 0],
              x: [-20 + offset * 5, 0 + offset * 5],
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              delay: offset * 0.3,
              ease: "linear"
            }}
          />
        ))}

        {/* Critical threshold line */}
        <line x1="0" y1="20" x2="100" y2="20" stroke="#f43f5e" strokeWidth="0.5" strokeDasharray="2,2" opacity="0.6">
          <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2s" repeatCount="indefinite" />
        </line>
      </svg>

      {/* Beating heart indicator */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <motion.div
          className="w-3 h-3 rounded-full bg-rose-400"
          animate={{ 
            scale: [1, 1.3, 1],
            boxShadow: [
              "0 0 0 0 rgba(244,63,94,0.4)",
              "0 0 0 8px rgba(244,63,94,0)",
              "0 0 0 0 rgba(244,63,94,0)",
            ]
          }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
        />
        <span className="text-[10px] font-bold tracking-wider text-rose-400 uppercase">
          {isCritical ? 'CRITICAL' : 'ELEVATED'}
        </span>
      </div>

      {/* Real-time metrics */}
      <div className="absolute bottom-4 left-4 space-y-1">
        <div className="flex items-baseline gap-2">
          <span className="text-[24px] font-bold text-rose-400 tabular-nums">3.2</span>
          <span className="text-[11px] text-white/30">velocity</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
          <span className="text-[10px] text-white/40">94% confidence</span>
        </div>
      </div>
    </div>
  )
}

// ─── Living Constellation Network ───
function LivingConstellation() {
  const nodes = [
    { id: 1, x: 50, y: 50, r: 10, type: 'center', label: 'Emma' },
    { id: 2, x: 25, y: 30, r: 6, type: 'bridge', label: 'Eng' },
    { id: 3, x: 75, y: 35, r: 5, type: 'normal', label: 'Design' },
    { id: 4, x: 30, y: 70, r: 5, type: 'normal' },
    { id: 5, x: 70, y: 65, r: 6, type: 'bridge', label: 'Data' },
    { id: 6, x: 50, y: 20, r: 4, type: 'normal' },
    { id: 7, x: 20, y: 50, r: 4, type: 'normal' },
    { id: 8, x: 80, y: 50, r: 5, type: 'normal' },
  ]

  const connections = [
    [1, 2], [1, 3], [1, 4], [1, 5], [1, 6], [1, 7], [1, 8],
    [2, 7], [2, 6], [3, 5], [3, 8], [4, 7], [5, 8], [5, 4]
  ]

  return (
    <div className="relative w-full h-[180px]">
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
        <defs>
          <radialGradient id="centerGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="1" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.2" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Connection lines with data flow animation */}
        {connections.map(([from, to], i) => {
          const fromNode = nodes.find(n => n.id === from)
          const toNode = nodes.find(n => n.id === to)
          if (!fromNode || !toNode) return null
          
          return (
            <g key={i}>
              <line
                x1={fromNode.x}
                y1={fromNode.y}
                x2={toNode.x}
                y2={toNode.y}
                stroke="rgba(251,191,36,0.15)"
                strokeWidth="0.5"
              />
              {/* Animated data packet */}
              <motion.circle
                r="1.5"
                fill="#fbbf24"
                filter="url(#glow)"
                initial={{ 
                  cx: fromNode.x, 
                  cy: fromNode.y,
                  opacity: 0
                }}
                animate={{ 
                  cx: [fromNode.x, toNode.x, fromNode.x],
                  cy: [fromNode.y, toNode.y, fromNode.y],
                  opacity: [0, 1, 0]
                }}
                transition={{ 
                  duration: 3, 
                  repeat: Infinity, 
                  delay: i * 0.2,
                  ease: "easeInOut"
                }}
              />
            </g>
          )
        })}

        {/* Nodes with gentle floating */}
        {nodes.map((node, i) => (
          <motion.g key={node.id}>
            <motion.circle
              cx={node.x}
              cy={node.y}
              r={node.r}
              fill={node.type === 'center' ? 'url(#centerGrad)' : 'rgba(251,191,36,0.6)'}
              filter={node.type === 'center' ? 'url(#glow)' : undefined}
              animate={{
                cx: [node.x, node.x + (Math.random() - 0.5) * 3, node.x],
                cy: [node.y, node.y + (Math.random() - 0.5) * 3, node.y],
              }}
              transition={{
                duration: 4 + Math.random() * 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            {node.label && (
              <text
                x={node.x}
                y={node.y + node.r + 8}
                textAnchor="middle"
                fill="rgba(251,191,36,0.8)"
                fontSize="4"
                fontWeight="500"
              >
                {node.label}
              </text>
            )}
          </motion.g>
        ))}
      </svg>

      {/* Bridge indicator */}
      <motion.div 
        className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 1 }}
      >
        <motion.div
          className="w-2 h-2 rounded-full bg-amber-400"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <span className="text-[10px] font-bold tracking-wider text-amber-400 uppercase">Bridge: 0.85</span>
      </motion.div>

      {/* Metrics */}
      <div className="absolute bottom-4 right-4 space-y-1 text-right">
        <div className="text-[20px] font-bold text-amber-400 tabular-nums">0.85</div>
        <div className="text-[10px] text-white/30 tracking-wider uppercase">Betweenness</div>
        <div className="text-[14px] text-amber-400/60">22 unblocks</div>
      </div>
    </div>
  )
}

// ─── Living Heat Diffusion ───
function LivingHeatGrid() {
  const gridSize = 10
  const centerRow = 4
  const centerCol = 6

  return (
    <div className="relative w-full h-[180px] flex items-center justify-center">
      <div className="grid grid-cols-10 gap-1 p-4">
        {Array.from({ length: gridSize * gridSize }).map((_, i) => {
          const row = Math.floor(i / gridSize)
          const col = i % gridSize
          const distance = Math.sqrt((row - centerRow) ** 2 + (col - centerCol) ** 2)
          const baseIntensity = Math.max(0, 1 - distance / 4)
          
          return (
            <motion.div
              key={i}
              className="w-4 h-4 rounded-sm"
              initial={{ 
                backgroundColor: `rgba(16, 185, 129, ${0.1 + baseIntensity * 0.2})`,
                scale: 1
              }}
              animate={{ 
                backgroundColor: [
                  `rgba(16, 185, 129, ${0.1 + baseIntensity * 0.2})`,
                  distance < 2 
                    ? `rgba(244, 63, 94, ${0.4 + Math.random() * 0.4})` 
                    : `rgba(251, 191, 36, ${0.2 + baseIntensity * 0.3})`,
                  `rgba(16, 185, 129, ${0.1 + baseIntensity * 0.2})`,
                ],
                scale: distance < 2 ? [1, 1.1, 1] : 1
              }}
              transition={{
                duration: 2 + Math.random(),
                repeat: Infinity,
                delay: distance * 0.1,
                ease: "easeInOut"
              }}
            />
          )
        })}
      </div>

      {/* Organic pulse rings from center */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full border border-rose-500/30"
            style={{
              width: `${60 + i * 30}px`,
              height: `${60 + i * 30}px`,
            }}
            initial={{ scale: 0.5, opacity: 0.6 }}
            animate={{ 
              scale: [0.5, 1.5, 2],
              opacity: [0.6, 0.3, 0],
              borderColor: [
                'rgba(244,63,94,0.3)',
                'rgba(251,191,36,0.2)',
                'rgba(244,63,94,0)',
              ]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 0.7,
              ease: "easeOut"
            }}
          />
        ))}
      </div>

      {/* Risk indicator */}
      <motion.div 
        className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20"
        animate={{ 
          borderColor: ['rgba(244,63,94,0.2)', 'rgba(244,63,94,0.5)', 'rgba(244,63,94,0.2)'],
        }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <motion.div
          className="w-2 h-2 rounded-full bg-rose-400"
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
        <span className="text-[10px] font-bold tracking-wider text-rose-400 uppercase">Contagion Risk</span>
      </motion.div>

      {/* Metrics */}
      <div className="absolute bottom-4 left-4 space-y-1">
        <div className="flex items-baseline gap-2">
          <span className="text-[20px] font-bold text-rose-400">Elevated</span>
          <span className="text-[11px] text-white/30">team risk</span>
        </div>
        <div className="text-[12px] text-rose-400/60">Correlation: 0.73</div>
      </div>
    </div>
  )
}

const engines = [
  {
    id: 'safety',
    title: 'Safety Valve',
    subtitle: 'Burnout Detection',
    description: 'Velocity (linear regression), Belongingness (reply rate), Circadian Entropy (Shannon). Three signals. One risk score.',
    icon: Activity,
    color: 'rose',
    viz: LivingECG,
  },
  {
    id: 'talent',
    title: 'Talent Scout',
    subtitle: 'Network Analysis',
    description: 'Betweenness centrality finds bridges. Eigenvector spots influencers. Unblocking count reveals force multipliers.',
    icon: Network,
    color: 'amber',
    viz: LivingConstellation,
  },
  {
    id: 'culture',
    title: 'Culture Thermometer',
    subtitle: 'Contagion Monitor',
    description: 'SIR epidemiological model for burnout spread. Detects correlated velocity spikes before resignation cascade.',
    icon: Thermometer,
    color: 'emerald',
    viz: LivingHeatGrid,
  }
]

export function ThreeEnginesSection() {
  return (
    <section id="features" className="relative bg-[#050505] py-32 md:py-40 overflow-hidden">
      {/* Ambient grid overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.5) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.5) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      <div className="max-w-[1400px] mx-auto px-6 md:px-8">
        {/* Section header with text scramble effect */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: customEase }}
          className="flex flex-col items-center text-center mb-16 md:mb-24"
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="mb-6 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08]"
          >
            <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-white/40">
              Three Engines
            </span>
          </motion.div>
          
          <h2 className="text-[36px] md:text-[56px] font-bold leading-[1.05] tracking-[-0.03em]">
            <span className="text-white">Deterministic </span>
            <span className="text-emerald-400">math</span>
            <span className="text-white">.</span>
            <br />
            <span className="text-white/60">Not AI opinions.</span>
          </h2>
        </motion.div>

        {/* Engines Bento Grid with 3D tilt */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {engines.map((engine, i) => {
            const VizComponent = engine.viz
            const IconComponent = engine.icon
            
            return (
              <motion.div
                key={engine.id}
                initial={{ opacity: 0, y: 60, rotateX: -10 }}
                whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 1, delay: i * 0.15, ease: customEase }}
                style={{ perspective: "1000px" }}
              >
                <TiltCard intensity={8} className="h-full">
                  <div className={`h-full p-[2px] rounded-[2rem] bg-gradient-to-br from-${engine.color}-500/20 via-${engine.color}-500/5 to-transparent group`}>
                    <div className="relative h-full rounded-[calc(2rem-2px)] bg-[#0a0a0a] border border-white/[0.06] overflow-hidden">
                      {/* Header */}
                      <div className="p-6 md:p-8 border-b border-white/[0.04]">
                        <div className="flex items-start justify-between mb-4">
                          <motion.div 
                            className={`w-14 h-14 rounded-2xl bg-${engine.color}-500/10 border border-${engine.color}-500/20 flex items-center justify-center`}
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            transition={{ type: "spring", stiffness: 400 }}
                          >
                            <IconComponent className={`w-7 h-7 text-${engine.color}-400`} />
                          </motion.div>
                          <div className={`px-3 py-1.5 rounded-full bg-${engine.color}-500/10 border border-${engine.color}-500/20`}>
                            <span className={`text-[10px] font-semibold tracking-wider text-${engine.color}-400 uppercase`}>
                              {engine.subtitle}
                            </span>
                          </div>
                        </div>
                        
                        <h3 className="text-[24px] font-bold text-white/90 mb-3">{engine.title}</h3>
                        <p className="text-[14px] text-white/40 leading-relaxed">{engine.description}</p>
                      </div>

                      {/* Living visualization */}
                      <div className="relative border-b border-white/[0.04]">
                        <VizComponent />
                      </div>

                      {/* Data processing indicator */}
                      <div className="p-4 flex items-center justify-between border-t border-white/[0.04]">
                        <div className="flex items-center gap-2">
                          <motion.div
                            className={`w-2 h-2 rounded-full bg-${engine.color}-400`}
                            animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          />
                          <span className="text-[11px] text-white/40 tracking-wider uppercase">Live</span>
                        </div>
                        <div className="text-[11px] text-white/30 font-mono">{Math.floor(Math.random() * 50 + 150)}ms</div>
                      </div>

                      {/* Hover glow */}
                      <div className={`absolute inset-0 bg-gradient-to-t from-${engine.color}-500/[0.08] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none`} />
                    </div>
                  </div>
                </TiltCard>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
