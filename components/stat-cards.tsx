"use client"

import { Activity, AlertTriangle, Heart, Shield, TrendingUp, Users } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import type { TeamMetrics } from "@/types"
import { cn } from "@/lib/utils"

interface StatCardsProps {
  metrics: TeamMetrics
}

export function StatCards({ metrics }: StatCardsProps) {
  const stats = [
    {
      label: "Total Members",
      value: metrics.total_members,
      icon: Users,
      subtitle: "Active in system",
      color: "text-[hsl(var(--sentinel-info))]",
      iconBg: "bg-[hsl(var(--sentinel-info))]/8",
    },
    {
      label: "Healthy",
      value: metrics.healthy_count,
      icon: Heart,
      subtitle: `${Math.round((metrics.healthy_count / metrics.total_members) * 100)}% of team`,
      color: "text-[hsl(var(--sentinel-healthy))]",
      iconBg: "bg-[hsl(var(--sentinel-healthy))]/8",
    },
    {
      label: "Elevated",
      value: metrics.elevated_count,
      icon: TrendingUp,
      subtitle: "Monitoring closely",
      color: "text-[hsl(var(--sentinel-elevated))]",
      iconBg: "bg-[hsl(var(--sentinel-elevated))]/8",
    },
    {
      label: "Critical",
      value: metrics.critical_count,
      icon: AlertTriangle,
      subtitle: "Immediate attention",
      color: "text-[hsl(var(--sentinel-critical))]",
      iconBg: "bg-[hsl(var(--sentinel-critical))]/8",
    },
    {
      label: "Avg Velocity",
      value: metrics.avg_velocity.toFixed(2),
      icon: Activity,
      subtitle: metrics.avg_velocity > 1.5 ? "Above threshold" : "Normal range",
      color:
        metrics.avg_velocity > 1.5
          ? "text-[hsl(var(--sentinel-elevated))]"
          : "text-[hsl(var(--sentinel-healthy))]",
      iconBg:
        metrics.avg_velocity > 1.5
          ? "bg-[hsl(var(--sentinel-elevated))]/8"
          : "bg-[hsl(var(--sentinel-healthy))]/8",
    },
    {
      label: "Contagion Risk",
      value: metrics.contagion_risk,
      icon: Shield,
      subtitle: `Frag: ${(metrics.graph_fragmentation * 100).toFixed(0)}%`,
      color:
        metrics.contagion_risk === "CRITICAL"
          ? "text-[hsl(var(--sentinel-critical))]"
          : metrics.contagion_risk === "ELEVATED"
            ? "text-[hsl(var(--sentinel-elevated))]"
            : "text-[hsl(var(--sentinel-healthy))]",
      iconBg:
        metrics.contagion_risk === "CRITICAL"
          ? "bg-[hsl(var(--sentinel-critical))]/8"
          : metrics.contagion_risk === "ELEVATED"
            ? "bg-[hsl(var(--sentinel-elevated))]/8"
            : "bg-[hsl(var(--sentinel-healthy))]/8",
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
      {stats.map((stat) => (
        <Card key={stat.label} className="border-border bg-card shadow-sm">
          <CardContent className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-[12px] font-medium text-muted-foreground">{stat.label}</span>
              <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", stat.iconBg)}>
                <stat.icon className={cn("h-4 w-4", stat.color)} />
              </div>
            </div>
            <p className={cn("text-2xl font-bold tabular-nums tracking-tight text-foreground")}>{stat.value}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">{stat.subtitle}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
