"use client"

import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { motion, useScroll, useTransform } from "framer-motion"
import { ArrowRight, Activity, Shield, Zap, Network } from "lucide-react"
import { MagneticButton } from "@/components/ui/magnetic-button"

const customEase = [0.32, 0.72, 0, 1] as [number, number, number, number]

interface HeroProps {
  isLoaded: boolean
}

// The story: "The signals you miss"
export function LandingHeroV4({ isLoaded }: HeroProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  })

  // Parallax layers
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "25%"])
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0])

  // Signal line animation
  const [lineOffset, setLineOffset] = useState(0)
  
  useEffect(() => {
    if (!isLoaded) return
    const interval = setInterval(() => {
      setLineOffset(prev => (prev + 1) % 100)
    }, 50)
    return () => clearInterval(interval)
  }, [isLoaded])

  return (
    <section 
      ref={containerRef} 
      className="relative min-h-screen flex overflow-hidden bg-[#050505]"
    >
      {/* LAYER 1: Deep background - subtle grid */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div 
          className="w-full h-full"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(255,255,255,0.5) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255,255,255,0.5) 1px, transparent 1px)
            `,
            backgroundSize: '80px 80px',
          }}
        />
      </div>

      {/* LAYER 2: Animated signal lines - ECG style */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="signalGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0" />
              <stop offset="30%" stopColor="#10B981" stopOpacity="0.6" />
              <stop offset="70%" stopColor="#10B981" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
            </linearGradient>
          </defs>
          
          {/* Multiple signal lines at different heights */}
          {[200, 350, 500, 650].map((y, i) => (
            <motion.path
              key={i}
              d={`M 0 ${y} L ${300 + i * 50} ${y} L ${350 + i * 50} ${y - 30} L ${400 + i * 50} ${y + 50} L ${450 + i * 50} ${y} L 1440 ${y}`}
              fill="none"
              stroke="url(#signalGrad)"
              strokeWidth="1"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: [0, 1, 1] }}
              transition={{ 
                duration: 3, 
                repeat: Infinity,
                delay: i * 0.5,
                ease: "linear"
              }}
            />
          ))}
        </svg>
      </div>

      {/* LAYER 3: Content */}
      <div className="relative z-20 flex flex-col justify-center w-full px-[5vw] pt-32 pb-20">
        <motion.div 
          className="max-w-[900px]"
          style={{ y: textY, opacity }}
        >
          {/* Eyebrow with pulse */}
          <motion.div 
            className="flex items-center gap-3 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={isLoaded ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="relative">
              <Activity className="w-5 h-5 text-emerald-400" />
              <motion.div 
                className="absolute inset-0"
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Activity className="w-5 h-5 text-emerald-400" />
              </motion.div>
            </div>
            <span className="text-[11px] uppercase tracking-[0.25em] text-white/50 font-medium">
              Behavioral Signal Intelligence
            </span>
          </motion.div>

          {/* Main headline - the story hook */}
          <h1 className="text-[clamp(3rem,8vw,7rem)] leading-[0.9] tracking-tight mb-8">
            <motion.div
              className="overflow-hidden mb-2"
              initial={{ y: 80, opacity: 0 }}
              animate={isLoaded ? { y: 0, opacity: 1 } : {}}
              transition={{ duration: 1, delay: 0.3, ease: customEase }}
            >
              <span className="block text-white">By the time you see</span>
            </motion.div>
            
            <motion.div
              className="overflow-hidden"
              initial={{ y: 80, opacity: 0 }}
              animate={isLoaded ? { y: 0, opacity: 1 } : {}}
              transition={{ duration: 1, delay: 0.45, ease: customEase }}
            >
              <span className="block text-white">the resignation </span>
            </motion.div>
            
            <motion.div
              className="overflow-hidden"
              initial={{ y: 80, opacity: 0 }}
              animate={isLoaded ? { y: 0, opacity: 1 } : {}}
              transition={{ duration: 1, delay: 0.6, ease: customEase }}
            >
              <span className="block font-serif italic text-emerald-400">email...</span>
            </motion.div>
          </h1>

          {/* The hook */}
          <motion.p 
            className="text-xl md:text-2xl text-white/60 leading-relaxed mb-4 max-w-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={isLoaded ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.9 }}
          >
            <span className="text-white/80 font-medium">the damage was done</span> weeks ago.
          </motion.p>

          <motion.p 
            className="text-lg text-white/40 mb-12 max-w-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={isLoaded ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 1.0 }}
          >
            Sentinel detects the velocity of behavioral change 2-4 weeks before burnout becomes visible. No message content. No surveillance. Just signals.
          </motion.p>

          {/* CTAs */}
          <motion.div 
            className="flex flex-wrap items-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={isLoaded ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 1.2 }}
          >
            <Link href="/demo" data-cursor="OPEN">
              <MagneticButton 
                className="group flex items-center gap-3 px-8 py-4 rounded-full bg-emerald-500 text-white font-medium hover:bg-emerald-400 transition-colors"
                strength={0.2}
              >
                <span>See What We Detect</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </MagneticButton>
            </Link>
            
            <Link href="/methodology" data-cursor="VIEW">
              <MagneticButton 
                className="px-8 py-4 rounded-full border border-white/20 text-white/70 hover:text-white hover:border-white/40 transition-colors"
                strength={0.15}
              >
                <span>How It Works</span>
              </MagneticButton>
            </Link>
          </motion.div>

          {/* Stats row */}
          <motion.div 
            className="flex flex-wrap gap-8 mt-16 pt-8 border-t border-white/10"
            initial={{ opacity: 0 }}
            animate={isLoaded ? { opacity: 1 } : {}}
            transition={{ duration: 0.8, delay: 1.4 }}
          >
            {[
              { value: "18", label: "Days Early", icon: Zap },
              { value: "94%", label: "Accuracy", icon: Shield },
              { value: "0", label: "Content Read", icon: Network },
            ].map((stat, i) => (
              <div key={i} className="flex items-center gap-3">
                <stat.icon className="w-5 h-5 text-emerald-400/60" />
                <div>
                  <div className="text-2xl font-semibold text-white tabular-nums">{stat.value}</div>
                  <div className="text-[11px] uppercase tracking-wider text-white/40">{stat.label}</div>
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* RIGHT SIDE: Abstract visualization */}
      <motion.div 
        className="hidden lg:block absolute right-0 top-0 w-[40%] h-full"
        initial={{ opacity: 0 }}
        animate={isLoaded ? { opacity: 1 } : {}}
        transition={{ duration: 1.5, delay: 0.5 }}
      >
        {/* Dashboard preview silhouette */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-[80%] h-[60%]">
            {/* Main card */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent border border-white/10 backdrop-blur-sm">
              {/* Fake chart lines */}
              <svg className="absolute inset-4 w-[calc(100%-2rem)] h-[calc(100%-2rem)]" viewBox="0 0 300 150">
                <defs>
                  <linearGradient id="chartGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                  </linearGradient>
                </defs>
                
                {/* Area fill */}
                <motion.path
                  d="M 0 150 L 0 100 Q 75 80 150 90 T 300 70 L 300 150 Z"
                  fill="url(#chartGrad)"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1, delay: 1 }}
                />
                
                {/* Line */}
                <motion.path
                  d="M 0 100 Q 75 80 150 90 T 300 70"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="2"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 2, delay: 0.5 }}
                />
                
                {/* Critical point - animated */}
                <motion.circle
                  cx="150"
                  cy="90"
                  r="4"
                  fill="#EF4444"
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 1] }}
                  transition={{ duration: 0.5, delay: 1.5 }}
                />
                <motion.circle
                  cx="150"
                  cy="90"
                  r="8"
                  fill="none"
                  stroke="#EF4444"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                  transition={{ duration: 1.5, delay: 2, repeat: Infinity }}
                />
              </svg>
              
              {/* Metric badges */}
              <div className="absolute top-4 left-4 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                <div className="text-[10px] uppercase tracking-wider text-white/40">Risk Score</div>
                <div className="text-sm font-semibold text-amber-400">Elevated</div>
              </div>
              
              <div className="absolute bottom-4 right-4 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                <div className="text-[10px] uppercase tracking-wider text-white/40">Velocity</div>
                <div className="text-sm font-semibold text-emerald-400">↓ 23%</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-transparent to-transparent" />
      </motion.div>

      {/* Bottom gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#050505] to-transparent" />
    </section>
  )
}
