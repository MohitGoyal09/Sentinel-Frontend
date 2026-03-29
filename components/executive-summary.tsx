"use client"

import { useMemo } from "react"
import { Sparkles, AlertTriangle, TrendingUp, Heart, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { TeamMetrics } from "@/types"

interface ExecutiveSummaryProps {
  metrics?: TeamMetrics
  className?: string
}

export function ExecutiveSummary({ metrics, className }: ExecutiveSummaryProps) {
  const insights = useMemo(() => {
    if (!metrics) return []

    const items: Array<{ text: string; type: "critical" | "warning" | "positive" | "info" }> = []

    if (metrics.critical_count > 0) {
      items.push({
        text: `${metrics.critical_count} team member${metrics.critical_count > 1 ? "s" : ""} showing critical burnout signals — immediate attention recommended.`,
        type: "critical",
      })
    }

    if (metrics.elevated_count > 0) {
      items.push({
        text: `${metrics.elevated_count} member${metrics.elevated_count > 1 ? "s" : ""} at elevated risk — Safety Valve monitoring closely.`,
        type: "warning",
      })
    }

    if (metrics.healthy_count > 0 && metrics.total_members > 0) {
      const pct = Math.round((metrics.healthy_count / metrics.total_members) * 100)
      if (pct >= 70) {
        items.push({
          text: `${pct}% of your team is in the healthy zone — strong overall wellbeing.`,
          type: "positive",
        })
      }
    }

    const velocity = metrics.avg_velocity || 0
    if (velocity > 2.0) {
      items.push({
        text: `Average velocity is ${velocity.toFixed(1)} — above normal threshold. Possible overwork pattern.`,
        type: "warning",
      })
    } else if (velocity > 0) {
      items.push({
        text: `Team velocity at ${velocity.toFixed(1)} — within healthy range.`,
        type: "positive",
      })
    }

    if (items.length === 0) {
      items.push({
        text: "All systems nominal. No immediate risks detected.",
        type: "info",
      })
    }

    return items
  }, [metrics])

  if (!metrics) return null

  const typeConfig = {
    critical: { icon: AlertTriangle, border: "border-red-500/20", bg: "bg-red-500/5", text: "", iconColor: "", iconStyle: {color: 'hsl(var(--sentinel-critical))'}, textStyle: {color: 'hsl(var(--sentinel-critical))'} },
    warning: { icon: AlertTriangle, border: "border-amber-500/20", bg: "bg-amber-500/5", text: "", iconColor: "", iconStyle: {color: 'hsl(var(--sentinel-elevated))'}, textStyle: {color: 'hsl(var(--sentinel-elevated))'} },
    positive: { icon: Heart, border: "border-emerald-500/20", bg: "bg-emerald-500/5", text: "", iconColor: "", iconStyle: {color: 'hsl(var(--sentinel-healthy))'}, textStyle: {color: 'hsl(var(--sentinel-healthy))'} },
    info: { icon: TrendingUp, border: "border-blue-500/20", bg: "bg-blue-500/5", text: "", iconColor: "", iconStyle: {color: 'hsl(var(--sentinel-info))'}, textStyle: {color: 'hsl(var(--sentinel-info))'} },
  }

  const primary = insights[0]
  const config = typeConfig[primary?.type || "info"]
  const PrimaryIcon = config.icon

  return (
    <div className={cn(
      "rounded-xl border p-4 backdrop-blur-sm",
      config.border,
      config.bg,
      className,
    )}>
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5">
          <Sparkles className="h-4 w-4" style={{color: 'hsl(var(--sentinel-healthy))'}} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold text-white">AI Executive Summary</h3>
            <span className="text-[10px] text-muted-foreground/70">Auto-generated</span>
          </div>
          <div className="space-y-1.5">
            {insights.map((insight, i) => {
              const Icon = typeConfig[insight.type].icon
              return (
                <div key={i} className="flex items-start gap-2">
                  <Icon className={cn("h-3.5 w-3.5 mt-0.5 shrink-0", typeConfig[insight.type].iconColor)} style={typeConfig[insight.type].iconStyle} />
                  <p className={cn("text-xs leading-relaxed", typeConfig[insight.type].text)} style={typeConfig[insight.type].textStyle}>
                    {insight.text}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
