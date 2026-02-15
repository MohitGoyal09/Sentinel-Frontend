"use client"

import { Activity, AlertTriangle, Heart, Shield, TrendingUp, Users } from "lucide-react"
import type { TeamMetrics } from "@/types"
import { cn } from "@/lib/utils"
import { useStaggerMount } from "@/hooks/useStaggerMount"
import { useCountUp } from "@/hooks/useCountUp"
import { Sparkline } from "@/components/sparkline"

interface StatCardsProps {
  metrics: TeamMetrics
}

/** Single metric card with CountUp animation, glow border, and sparkline */
function MetricCard({
  label,
  value,
  icon: Icon,
  subtitle,
  riskLevel,
  trend,
}: {
  label: string
  value: number | string
  icon: React.ComponentType<{ className?: string }>
  subtitle: string
  riskLevel: "healthy" | "elevated" | "critical" | "info"
  trend?: number[]
}) {
  const numericValue = typeof value === "number" ? value : parseFloat(value)
  const isNumeric = !isNaN(numericValue)
  const countRef = useCountUp(
    isNumeric ? numericValue : 0,
    0.4,
    typeof value === "string" && value.includes(".") ? 2 : 0
  )

  const riskColorMap: Record<string, string> = {
    healthy: "hsl(var(--sentinel-healthy))",
    elevated: "hsl(var(--sentinel-elevated))",
    critical: "hsl(var(--sentinel-critical))",
    info: "hsl(var(--sentinel-info))",
  }

  const colorMap = {
    healthy: {
      text: "text-[hsl(var(--sentinel-healthy))]",
      bg: "bg-[hsl(var(--sentinel-healthy))]/8",
      accent: "glass-card-accent--healthy",
    },
    elevated: {
      text: "text-[hsl(var(--sentinel-elevated))]",
      bg: "bg-[hsl(var(--sentinel-elevated))]/8",
      accent: "glass-card-accent--elevated",
    },
    critical: {
      text: "text-[hsl(var(--sentinel-critical))]",
      bg: "bg-[hsl(var(--sentinel-critical))]/8",
      accent: "glass-card-accent--critical",
    },
    info: {
      text: "text-[hsl(var(--sentinel-info))]",
      bg: "bg-[hsl(var(--sentinel-info))]/8",
      accent: "",
    },
  }

  const colors = colorMap[riskLevel]

  return (
    <div
      className={cn(
        "stat-card glass-card glass-card-accent rounded-xl p-5",
        colors.accent
      )}
    >
      <div className="mb-4 flex items-center justify-between">
        <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          {label}
        </span>
        <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", colors.bg)}>
          <Icon className={cn("h-4 w-4", colors.text)} />
        </div>
      </div>
      <div className="flex items-end justify-between gap-2">
        <p className="text-2xl font-bold tabular-nums tracking-tight text-foreground font-mono">
          {isNumeric ? (
            <span ref={countRef} />
          ) : (
            value
          )}
        </p>
        {trend && trend.length > 1 && (
          <Sparkline
            data={trend}
            width={56}
            height={20}
            color={riskColorMap[riskLevel]}
          />
        )}
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">{subtitle}</p>
    </div>
  )
}

export function StatCards({ metrics }: StatCardsProps) {
  const containerRef = useStaggerMount(".stat-card", [
    metrics.total_members,
    metrics.healthy_count,
    metrics.elevated_count,
    metrics.critical_count,
  ])

  const stats: Array<{
    label: string
    value: number | string
    icon: React.ComponentType<{ className?: string }>
    subtitle: string
    riskLevel: "healthy" | "elevated" | "critical" | "info"
    trend?: number[]
  }> = [
      {
        label: "Total Members",
        value: metrics.total_members,
        icon: Users,
        subtitle: "Active in system",
        riskLevel: "info",
        trend: [8, 9, 9, 10, 10, 11, metrics.total_members],
      },
      {
        label: "Healthy",
        value: metrics.healthy_count,
        icon: Heart,
        subtitle: `${Math.round((metrics.healthy_count / metrics.total_members) * 100)}% of team`,
        riskLevel: "healthy",
        trend: [5, 6, 5, 7, 6, 7, metrics.healthy_count],
      },
      {
        label: "Elevated",
        value: metrics.elevated_count,
        icon: TrendingUp,
        subtitle: "Monitoring closely",
        riskLevel: "elevated",
        trend: [1, 2, 2, 3, 2, 3, metrics.elevated_count],
      },
      {
        label: "Critical",
        value: metrics.critical_count,
        icon: AlertTriangle,
        subtitle: "Immediate attention",
        riskLevel: "critical",
        trend: [0, 0, 1, 0, 1, 1, metrics.critical_count],
      },
      {
        label: "Avg Velocity",
        value: metrics.avg_velocity.toFixed(2),
        icon: Activity,
        subtitle: metrics.avg_velocity > 1.5 ? "Above threshold" : "Normal range",
        riskLevel: metrics.avg_velocity > 1.5 ? "elevated" : "healthy",
      },
      {
        label: "Contagion Risk",
        value: metrics.contagion_risk,
        icon: Shield,
        subtitle: `Frag: ${(metrics.graph_fragmentation * 100).toFixed(0)}%`,
        riskLevel:
          metrics.contagion_risk === "CRITICAL"
            ? "critical"
            : metrics.contagion_risk === "ELEVATED"
              ? "elevated"
              : "healthy",
      },
    ]

  return (
    <div ref={containerRef} className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
      {stats.map((stat) => (
        <MetricCard key={stat.label} {...stat} />
      ))}
    </div>
  )
}
