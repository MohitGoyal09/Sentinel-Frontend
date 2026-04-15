"use client"

import { useEffect, useState, useRef } from "react"
import { motion, useMotionValue, useSpring } from "framer-motion"

interface Node {
  id: number
  x: number
  y: number
  size: number
  vx: number
  vy: number
  connection: number[]
}

interface ConstellationProps {
  width?: number
  height?: number
  nodeCount?: number
  color?: string
  label?: string
  value?: string
}

function NetworkConstellation({
  width = 600,
  height = 300,
  nodeCount = 25,
  color = "#8B5CF6",
  label,
  value,
}: ConstellationProps) {
  const [nodes, setNodes] = useState<Node[]>([])
  const [connections, setConnections] = useState<{ from: number; to: number }[]>([])
  const [mouseX, setMouseX] = useState(0)
  const [mouseY, setMouseY] = useState(0)
  const svgRef = useRef<SVGSVGElement>(null)
  const frameRef = useRef<number>(0)

  useEffect(() => {
    const newNodes: Node[] = []
    for (let i = 0; i < nodeCount; i++) {
      const angle = Math.random() * Math.PI * 2
      const radius = Math.random() * Math.min(width, height) * 0.35
      newNodes.push({
        id: i,
        x: width / 2 + Math.cos(angle) * radius,
        y: height / 2 + Math.sin(angle) * radius,
        size: Math.random() * 3 + 1,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        connection: [],
      })
    }

    const newConnections: { from: number; to: number }[] = []
    newNodes.forEach((node, i) => {
      const connectionCount = Math.floor(Math.random() * 3) + 1
      for (let j = 0; j < connectionCount; j++) {
        const targetIndex = Math.floor(Math.random() * nodeCount)
        if (targetIndex !== i) {
          const exists = newConnections.some(
            (c) =>
              (c.from === i && c.to === targetIndex) ||
              (c.from === targetIndex && c.to === i)
          )
          if (!exists) {
            newConnections.push({ from: i, to: targetIndex })
            node.connection.push(targetIndex)
          }
        }
      }
    })

    setNodes(newNodes)
    setConnections(newConnections)
  }, [width, height, nodeCount])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect()
        setMouseX(e.clientX - rect.left)
        setMouseY(e.clientY - rect.top)
      }
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  useEffect(() => {
    const animate = () => {
      setNodes((prevNodes) =>
        prevNodes.map((node) => {
          let newX = node.x + node.vx
          let newY = node.y + node.vy
          let newVx = node.vx
          let newVy = node.vy

          const mouseInfluence = 50
          const dx = mouseX - newX
          const dy = mouseY - newY
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < mouseInfluence) {
            const force = (mouseInfluence - dist) / mouseInfluence
            newVx -= (dx / dist) * force * 0.02
            newVy -= (dy / dist) * force * 0.02
          }

          if (newX < 20 || newX > width - 20) newVx = -newVx
          if (newY < 20 || newY > height - 20) newVy = -newVy

          return { ...node, x: newX, y: newY, vx: newVx, vy: newVy }
        })
      )

      frameRef.current = requestAnimationFrame(animate)
    }

    frameRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frameRef.current)
  }, [mouseX, mouseY, width, height])

  return (
    <div className="relative">
      <svg ref={svgRef} width={width} height={height} className="w-full h-auto">
        <defs>
          <filter id={`glow-${color.replace("#", "")}`}>
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Connection lines */}
        {connections.map((conn, i) => {
          const fromNode = nodes[conn.from]
          const toNode = nodes[conn.to]
          if (!fromNode || !toNode) return null

          const midX = (fromNode.x + toNode.x) / 2
          const midY = (fromNode.y + toNode.y) / 2

          return (
            <motion.line
              key={i}
              x1={fromNode.x}
              y1={fromNode.y}
              x2={toNode.x}
              y2={toNode.y}
              stroke={color}
              strokeWidth="0.5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              transition={{ duration: 1 }}
            />
          )
        })}

        {/* Nodes */}
        {nodes.map((node) => {
          const isLarge = node.size > 2.5
          return (
            <motion.circle
              key={node.id}
              cx={node.x}
              cy={node.y}
              r={node.size}
              fill={color}
              filter={isLarge ? `url(#glow-${color.replace("#", "")})` : undefined}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            />
          )
        })}

        {/* Highlighted path */}
        <motion.circle
          cx={width / 2}
          cy={height / 2}
          r="40"
          fill="none"
          stroke={color}
          strokeWidth="1"
          strokeDasharray="4 4"
          filter={`url(#glow-${color.replace("#", "")})`}
        >
          <animate
            attributeName="r"
            values="35;45;35"
            dur="3s"
            repeatCount="Infinity"
          />
          <animate
            attributeName="opacity"
            values="0.5;0.2;0.5"
            dur="3s"
            repeatCount="Infinity"
          />
        </motion.circle>
      </svg>

      {label && (
        <div className="absolute bottom-2 right-2 px-3 py-1.5 rounded-lg bg-black/60 border border-white/10">
          <div className="text-[10px] font-mono text-white/40 uppercase">{label}</div>
          <div className="text-sm font-mono font-semibold" style={{ color }}>
            {value}
          </div>
        </div>
      )}
    </div>
  )
}

export function NetworkConstellationSection() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <section className="relative py-24 md:py-32 overflow-hidden bg-black">
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-gradient-to-b from-purple-500/[0.05] via-transparent to-transparent" />
      </div>

      <div className="max-w-[1200px] mx-auto px-[5vw] relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-px bg-purple-500/60" />
            <span className="text-[10px] uppercase tracking-[0.25em] text-purple-500/70">
              Organizational Network Analysis
            </span>
            <div className="w-10 h-px bg-purple-500/60" />
          </div>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-white mb-4 tracking-tight">
            See the{" "}
            <span className="text-purple-400 font-serif italic">hidden structure</span>
          </h2>

          <p className="text-white/50 max-w-lg mx-auto">
            Talent Scout maps communication patterns to find structurally critical people
            invisible to traditional metrics.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative p-8 rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.02] to-transparent overflow-hidden"
        >
          <NetworkConstellation
            width={900}
            height={400}
            nodeCount={30}
            color="#8B5CF6"
            label="Betweenness"
            value="0.72"
          />

          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
          {[
            {
              metric: "Bridge Nodes",
              value: "12",
              desc: "People connecting teams",
              color: "#8B5CF6",
            },
            {
              metric: "Eigenvector",
              value: "0.84",
              desc: "Influence score",
              color: "#10B981",
            },
            {
              metric: "Unblocking",
              value: "7",
              desc: "S bottlenecks resolved",
              color: "#F59E0B",
            },
          ].map((item, i) => (
            <motion.div
              key={item.metric}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="relative p-6 rounded-2xl border border-white/10 bg-white/[0.02] text-center"
            >
              <div className="text-3xl font-bold mb-1" style={{ color: item.color }}>
                {item.value}
              </div>
              <div className="text-sm font-medium text-white mb-1">{item.metric}</div>
              <div className="text-xs text-white/40">{item.desc}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}