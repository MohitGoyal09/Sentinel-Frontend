"use client"

import { Shield, Activity, Sparkles, Thermometer, ArrowRight, Lock } from "lucide-react"
import Link from "next/link"
import { useRef, useEffect } from "react"

const pillars = [
  {
    title: "Safety Valve",
    description: "Predict burnout before it strikes. SIR-model contagion forecasting protects your people.",
    icon: Shield,
    color: "var(--sentinel-healthy)",
    metric: "R₀ Index",
    metricDesc: "Contagion prediction",
  },
  {
    title: "Talent Scout",
    description: "Discover hidden gems through network analysis. Find the connectors who hold teams together.",
    icon: Sparkles,
    color: "var(--sentinel-gem)",
    metric: "Betweenness",
    metricDesc: "Network centrality",
  },
  {
    title: "Culture Thermometer",
    description: "Real-time team health monitoring with anomaly detection and sentiment insights.",
    icon: Thermometer,
    color: "var(--sentinel-elevated)",
    metric: "Pulse Score",
    metricDesc: "Team wellness",
  },
]

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null)
  const pillarsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Animate hero elements with GSAP
    import("gsap").then(({ default: gsap }) => {
      const mm = gsap.matchMedia()
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // Hero text stagger
        if (heroRef.current) {
          gsap.context(() => {
            const tl = gsap.timeline({ defaults: { ease: "power2.out" } })
            tl.from(".hero-badge", { opacity: 0, y: 12, duration: 0.4 })
              .from(".hero-title", { opacity: 0, y: 16, duration: 0.5 }, "-=0.2")
              .from(".hero-subtitle", { opacity: 0, y: 12, duration: 0.4 }, "-=0.2")
              .from(".hero-cta", { opacity: 0, y: 10, duration: 0.3 }, "-=0.1")
              .from(".hero-privacy", { opacity: 0, duration: 0.3 }, "-=0.1")
          }, heroRef.current)
        }

        // Pillar cards stagger
        if (pillarsRef.current) {
          gsap.context(() => {
            gsap.from(".pillar-card", {
              opacity: 0,
              y: 20,
              duration: 0.4,
              stagger: 0.1,
              ease: "power2.out",
              delay: 0.6,
              clearProps: "all",
            })
          }, pillarsRef.current)
        }

        return () => mm.revert()
      })
    })
  }, [])

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6">
      {/* Hero */}
      <div ref={heroRef} className="relative z-10 mx-auto max-w-3xl text-center">
        {/* Badge */}
        <div className="hero-badge mb-8 inline-flex items-center gap-2 rounded-full border border-[var(--glass-border)] bg-[var(--glass-bg)] px-4 py-1.5">
          <Activity className="h-3.5 w-3.5 text-[hsl(var(--primary))]" />
          <span className="text-[12px] font-medium text-muted-foreground">
            AI-Powered Employee Insights
          </span>
        </div>

        {/* Title */}
        <h1 className="hero-title text-5xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
          <span className="inline-block">Sentinel</span>
        </h1>

        {/* Subtitle */}
        <p className="hero-subtitle mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
          Predict burnout. Discover hidden talent. Monitor team health.{" "}
          <span className="text-foreground/80">All privacy-first.</span>
        </p>

        {/* CTA */}
        <div className="hero-cta mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/login"
            className="group inline-flex items-center gap-2.5 rounded-xl bg-[hsl(var(--primary))] px-7 py-3.5 text-[14px] font-semibold text-[hsl(var(--primary-foreground))] transition-all duration-200 hover:shadow-lg active:scale-[0.98]"
            style={{ boxShadow: "0 0 24px hsl(152 55% 48% / 0.2)" }}
          >
            Enter Dashboard
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Privacy badge */}
        <div className="hero-privacy mt-8 flex items-center justify-center gap-2 text-muted-foreground/60">
          <Lock className="h-3.5 w-3.5" />
          <span className="text-[12px]">Two-vault architecture. Your data never leaves your custody.</span>
        </div>
      </div>

      {/* Pillar Cards */}
      <div ref={pillarsRef} className="relative z-10 mx-auto mt-20 grid max-w-4xl grid-cols-1 gap-5 sm:grid-cols-3">
        {pillars.map((pillar) => (
          <div
            key={pillar.title}
            className="pillar-card glass-card glass-card-accent rounded-xl p-6"
            style={{
              borderLeftColor: `hsl(${pillar.color})`,
              boxShadow: `0 0 20px hsl(${pillar.color} / 0.08)`,
            }}
          >
            <div
              className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg"
              style={{ backgroundColor: `hsl(${pillar.color} / 0.1)` }}
            >
              <pillar.icon
                className="h-5 w-5"
                style={{ color: `hsl(${pillar.color})` }}
              />
            </div>
            <h3 className="text-[15px] font-semibold text-foreground">{pillar.title}</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{pillar.description}</p>
            <div className="mt-4 flex items-center gap-2 border-t border-[var(--glass-border)] pt-3">
              <span className="font-mono text-[12px] font-semibold text-foreground">{pillar.metric}</span>
              <span className="text-[11px] text-muted-foreground/60">— {pillar.metricDesc}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <footer className="relative z-10 mt-20 pb-8 text-center">
        <p className="font-mono text-[11px] text-muted-foreground/40">
          v0.1.0 · Privacy-first by design
        </p>
      </footer>
    </div>
  )
}
