"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, Play, Shield, Sparkles, Lock, Eye, Users, Zap, Heart, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export function LandingHero() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const stats = [
    { value: "94%", label: "Detection Accuracy", icon: BarChart3 },
    { value: "30d", label: "Early Warning", icon: Zap },
    { value: "100%", label: "Privacy First", icon: Lock },
    { value: "2x", label: "Talent Discovery", icon: Sparkles },
  ]

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-28 pb-20 overflow-hidden">
      {/* Layered ambient gradients */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[100px]" />
        <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] bg-sentinel-info/4 rounded-full blur-[80px]" />
      </div>

      <div className="container relative z-10 px-6">
        {/* Badge */}
        <div className={cn(
          "flex justify-center mb-8 opacity-0 translate-y-4 transition-all duration-500",
          mounted && "opacity-100 translate-y-0"
        )}>
          <Badge variant="outline" className="gap-2 px-4 py-1.5 rounded-full border-primary/20 bg-primary/8 text-primary text-sm font-medium">
            <span className="flex h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            AI-Powered Employee Insights
          </Badge>
        </div>

        {/* Headline */}
        <div className={cn(
          "text-center mb-6 opacity-0 translate-y-6 transition-all duration-700 delay-100",
          mounted && "opacity-100 translate-y-0"
        )}>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground max-w-4xl mx-auto leading-[1.1]">
            Predict Burnout.{" "}
            <span className="text-gradient-hero">
              Uncover Talent.
            </span>
          </h1>
        </div>

        {/* Subtitle */}
        <div className={cn(
          "text-center mb-12 opacity-0 translate-y-6 transition-all duration-700 delay-200",
          mounted && "opacity-100 translate-y-0"
        )}>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Metadata-only analysis that detects burnout 30 days early and finds hidden gems — without reading a single message.
          </p>
        </div>

        {/* CTAs */}
        <div className={cn(
          "flex flex-col sm:flex-row items-center justify-center gap-3 mb-20 opacity-0 translate-y-6 transition-all duration-700 delay-300",
          mounted && "opacity-100 translate-y-0"
        )}>
          <Link href="/login">
            <Button size="lg" className="h-12 px-7 rounded-xl font-medium text-base shadow-lg shadow-primary/20 group">
              Start Free Trial
              <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" />
            </Button>
          </Link>
          <Link href="/demo">
            <Button size="lg" variant="ghost" className="h-12 px-7 rounded-xl text-muted-foreground hover:text-foreground text-base">
              <Play className="mr-2 h-4 w-4" />
              Watch Demo
            </Button>
          </Link>
        </div>

        {/* Stats row */}
        <div className={cn(
          "grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto opacity-0 translate-y-6 transition-all duration-700 delay-400",
          mounted && "opacity-100 translate-y-0"
        )}>
          {stats.map((stat, i) => (
            <div key={i} className="metric-card text-center py-6">
              <stat.icon className="h-5 w-5 mx-auto mb-2 text-primary/60" />
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
