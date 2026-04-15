"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface PreloaderProps {
  onComplete: () => void
}

// Sentinel-themed preloader - signal analysis
export function Preloader({ onComplete }: PreloaderProps) {
  const [phase, setPhase] = useState(0)
  const [progress, setProgress] = useState(0)
  
  const phases = [
    { label: "INITIALIZING", sub: "Setting up neural pathways" },
    { label: "CALIBRATING", sub: "Baseline velocity patterns" },
    { label: "ANALYZING", sub: "Entropy coefficients" },
    { label: "SYSTEM READY", sub: "Sentinel is live" },
  ]

  useEffect(() => {
    // Progress animation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 100
        return prev + (100 - prev) * 0.03
      })
    }, 30)

    // Phase transitions
    const phaseTimers = [
      setTimeout(() => setPhase(1), 600),
      setTimeout(() => setPhase(2), 1400),
      setTimeout(() => setPhase(3), 2200),
      setTimeout(() => {
        setTimeout(onComplete, 500)
      }, 2800),
    ]

    return () => {
      clearInterval(progressInterval)
      phaseTimers.forEach(clearTimeout)
    }
  }, [onComplete])

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[9999] bg-[#050505] flex flex-col justify-between p-[5vw]"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
      >
        {/* Top bar */}
        <div className="flex justify-between items-start">
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">
            Sentinel Intelligence
          </div>
          <div className="text-[10px] font-mono text-emerald-400/60">
            {progress.toFixed(0)}%
          </div>
        </div>

        {/* Center content */}
        <div className="flex-1 flex flex-col justify-center">
          {/* Main visualization */}
          <div className="relative max-w-[500px] mx-auto w-full">
            {/* Signal wave animation */}
            <svg viewBox="0 0 400 100" className="w-full h-20 mb-8">
              <defs>
                <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0" />
                  <stop offset="50%" stopColor="#10B981" stopOpacity="1" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                </linearGradient>
              </defs>
              
              <motion.path
                d="M 0 50 L 100 50 L 120 30 L 140 70 L 160 50 L 400 50"
                fill="none"
                stroke="url(#waveGrad)"
                strokeWidth="2"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              
              <motion.path
                d="M 0 50 L 80 50 L 100 20 L 120 80 L 140 50 L 400 50"
                fill="none"
                stroke="#10B981"
                strokeWidth="1"
                opacity="0.3"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
              />
            </svg>

            {/* Phase text */}
            <motion.div
              key={phase}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-center"
            >
              <div className="text-[11px] uppercase tracking-[0.3em] text-emerald-400 mb-2">
                {phases[phase].label}
              </div>
              <div className="text-sm text-white/40">
                {phases[phase].sub}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex justify-between items-end">
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/20">
            Behavioral Signal Intelligence
          </div>
          
          {/* Progress bar */}
          <div className="w-32">
            <div className="h-0.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-emerald-400"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
