"use client"

import { useRef, useState, useEffect } from "react"
import { motion, useScroll, useTransform } from "framer-motion"

interface DataPacket {
  id: number
  delay: number
  x: number
  color: string
}

function VaultPrivacyVisualization() {
  const [packets, setPackets] = useState<DataPacket[]>([])
  const [activePhase, setActivePhase] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      const colors = ["#10B981", "#8B5CF6", "#F59E0B"]
      const newPacket = {
        id: Date.now() + Math.random(),
        delay: Math.random() * 0.3,
        x: 0,
        color: colors[Math.floor(Math.random() * colors.length)],
      }
      setPackets((prev) => [...prev.slice(-10), newPacket])
    }, 600)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setActivePhase((prev) => (prev + 1) % 3)
    }, 1500)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const movePackets = setInterval(() => {
      setPackets((prev) =>
        prev
          .map((p) => ({ ...p, x: p.x + 2 }))
          .filter((p) => p.x < 100)
      )
    }, 50)
    return () => clearInterval(movePackets)
  }, [])

  return (
    <div className="relative h-32 my-8">
      <div className="absolute inset-0 flex items-center">
        {/* Input zone */}
        <div className="w-24 h-full flex flex-col justify-center gap-3">
          {["A", "B", "C"].map((label, i) => (
            <motion.div
              key={label}
              className="h-3 rounded-full"
              style={{
                background: `linear-gradient(90deg, ${
                  ["#10B981", "#8B5CF6", "#F59E0B"][i]
                }40, transparent)`,
              }}
              animate={{ opacity: activePhase === i ? [0.4, 0.8, 0.4] : 0.3 }}
              transition={{ duration: 1 }}
            />
          ))}
        </div>

        {/* Flow zone */}
        <div className="flex-1 relative h-full flex items-center">
          {/* Gradient barrier */}
          <div className="absolute left-1/3 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-purple-500/50 to-transparent" />
          <div className="absolute left-2/3 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-amber-500/50 to-transparent" />

          {/* Barrier labels */}
          <div className="absolute left-1/3 -top-6 -translate-x-1/2 px-2 py-1 rounded bg-black/80 border border-purple-500/30">
            <span className="text-[8px] font-mono text-purple-400 uppercase tracking-wider">
              HMAC-SHA256
            </span>
          </div>

          {/* Data packets */}
          {packets.map((packet) => {
            const getY = (id: number) => {
              const remainder = id % 3
              return 25 + remainder * 25
            }

            return (
              <motion.div
                key={packet.id}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  backgroundColor: packet.color,
                  boxShadow: `0 0 8px ${packet.color}`,
                  left: `${packet.x}%`,
                  top: `${getY(packet.id)}%`,
                }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
              />
            )
          })}

          {/* Animated flow line */}
          <motion.div
            className="absolute left-1/3 right-1/3 top-1/2 h-[2px] -translate-y-1/2"
            style={{
              background:
                "linear-gradient(90deg, #10B981, #8B5CF6, #F59E0B)",
            }}
            animate={{ opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>

        {/* Output zones */}
        <div className="w-28 h-full flex flex-col justify-center gap-3">
          <div className="flex items-center gap-2">
            <motion.div
              className="h-3 flex-1 rounded-full"
              style={{
                background: activePhase === 0 ? "#10B98140" : "#10B98120",
              }}
            />
            <span className="text-[8px] font-mono text-emerald-400">VAULT A</span>
          </div>
          <div className="flex items-center gap-2">
            <motion.div
              className="h-3 flex-1 rounded-full"
              style={{
                background: activePhase === 1 ? "#8B5CF640" : "#8B5CF620",
              }}
            />
            <span className="text-[8px] font-mono text-purple-400">VAULT B</span>
          </div>
        </div>
      </div>

      {/* Labels */}
      <div className="absolute -bottom-6 left-0 right-0 flex justify-between text-[9px] font-mono text-white/30">
        <span>Raw Input</span>
        <span>Privacy Boundary</span>
        <span>Anonymized Output</span>
      </div>
    </div>
  )
}

function VaultCard({
  title,
  subtitle,
  items,
  color,
  borderColor,
  delay,
}: {
  title: string
  subtitle: string
  items: { label: string; type: "hash" | "data" | "encrypted" }[]
  color: string
  borderColor: string
  delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      className="relative"
    >
      <div
        className="relative p-6 rounded-2xl overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${color}08 0%, transparent 50%)`,
          border: `1px solid ${borderColor}`,
        }}
      >
        <div
          className="absolute -inset-px rounded-2xl opacity-30"
          style={{
            background: `radial-gradient(ellipse at 50% 0%, ${color}20 0%, transparent 70%)`,
          }}
        />

        <div className="relative">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4"
            style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30` }}
          >
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color }}>
              {title}
            </span>
          </div>

          <div className="text-white/40 text-xs mb-4">{subtitle}</div>

          <div className="space-y-2.5">
            {items.map((item, i) => (
              <motion.div
                key={item.label}
                className="flex items-center gap-3 font-mono text-xs"
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: delay + i * 0.1 }}
              >
                <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: `${color}60` }} />
                <span className="text-white/50">{item.label}</span>
                <span className="text-white/20">:</span>
                <span className="text-white/40">
                  {item.type === "hash" && "a7b3c9..."}
                  {item.type === "data" && "[...]"}
                  {item.type === "encrypted" && "AES-256"}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export function VaultPrivacy() {
  const containerRef = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 0.8", "end 0.3"],
  })

  return (
    <section ref={containerRef} className="relative py-24 md:py-32 overflow-hidden bg-black">
      <div className="absolute inset-0 opacity-[0.02]">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="max-w-[1000px] mx-auto px-[5vw]">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-px bg-emerald-500/60" />
            <span className="text-[10px] uppercase tracking-[0.25em] text-emerald-500/70">
              Privacy Architecture
            </span>
            <div className="w-10 h-px bg-emerald-500/60" />
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-white mb-4 tracking-tight">
            Mathematically{" "}
            <span className="text-white/40">impossible</span>
            <br />
            <span className="text-purple-400 font-serif italic">to identify</span> people.
          </h2>

          <p className="text-white/50 max-w-lg mx-auto">
            Even a full database breach yields only anonymous hashes and encrypted blobs.
            Privacy by physics, not policy.
          </p>
        </motion.div>

        {/* Data Flow Visualization */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative max-w-[800px] mx-auto mb-16"
        >
          <div className="p-8 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.02] to-transparent">
            <VaultPrivacyVisualization />
          </div>
        </motion.div>

        {/* Two vaults */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <VaultCard
            title="Vault A"
            subtitle="Analytics Vault - No PII"
            color="#10B981"
            borderColor="rgba(16,185,129,0.3)"
            delay={0}
            items={[
              { label: "user_hash", type: "hash" },
              { label: "events", type: "data" },
              { label: "scores", type: "data" },
            ]}
          />
          <VaultCard
            title="Vault B"
            subtitle="Identity Vault - Encrypted at Rest"
            color="#F59E0B"
            borderColor="rgba(245,158,11,0.3)"
            delay={0.15}
            items={[
              { label: "user_hash", type: "hash" },
              { label: "email_enc", type: "encrypted" },
              { label: "RBAC_data", type: "encrypted" },
            ]}
          />
        </div>

        {/* Key insight */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div
            className="inline-flex items-center gap-4 px-6 py-4 rounded-2xl"
            style={{
              background: "rgba(239,68,68,0.05)",
              border: "1px solid rgba(239,68,68,0.2)",
            }}
          >
            <motion.div
              className="w-3 h-3 rounded-full bg-red-400"
              animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="text-sm text-white/70">
              No foreign key between schemas. Attacker needs{" "}
              <span className="text-white font-medium">vault key</span> to connect them.
            </span>
          </div>
        </motion.div>

        {/* Deterministic Sandwich */}
        <motion.div
          className="mt-20 max-w-[600px] mx-auto"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <div className="text-center mb-8">
            <div className="text-[10px] uppercase tracking-[0.25em] text-white/40 mb-4">
              The Deterministic Sandwich
            </div>
            <h3 className="text-xl text-white mb-2">
              AI does <span className="text-white/40">NOT</span> make decisions.
            </h3>
            <p className="text-white/50 text-sm">Math makes decisions. AI writes text.</p>
          </div>

          <div className="flex flex-col md:flex-row items-stretch gap-4">
            {[
              { layer: 1, title: "Ingestion", desc: "Python validation", color: "#6366F1" },
              { layer: 2, title: "Analysis", desc: "NumPy/SciPy (pure math)", color: "#10B981" },
              { layer: 3, title: "Generation", desc: "LLM text only", color: "#8B5CF6" },
            ].map((item, i) => (
              <motion.div
                key={item.layer}
                className="flex-1 p-4 rounded-xl border border-white/10 bg-white/5 text-center"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <div
                  className="inline-block px-2 py-0.5 rounded text-[10px] uppercase tracking-wider mb-2"
                  style={{ backgroundColor: `${item.color}20`, color: item.color }}
                >
                  Layer {item.layer}
                </div>
                <div className="text-white font-medium text-sm mb-1">{item.title}</div>
                <div className="text-white/40 text-xs">{item.desc}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}