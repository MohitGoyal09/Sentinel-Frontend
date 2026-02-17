"use client"

import { useState, useEffect, useCallback } from "react"
import { Users, TrendingUp, TrendingDown, Minus, Lightbulb, Shield, ShieldAlert, ShieldCheck } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { getTeamNarrative, type TeamNarrativeData } from "@/lib/api"
import { cn } from "@/lib/utils"

interface TeamNarrativeProps {
  teamHash: string
  days?: number
  className?: string
}

export function TeamNarrative({ teamHash, days = 30, className }: TeamNarrativeProps) {
  const [data, setData] = useState<TeamNarrativeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchNarrative = useCallback(async () => {
    try {
      setLoading(true)
      const result = await getTeamNarrative(teamHash, days)
      setData(result)
      setError(null)
    } catch (err: unknown) {
      console.error("Failed to fetch team narrative:", err)
      setError(err instanceof Error ? err.message : "Failed to load narrative")
    } finally {
      setLoading(false)
    }
  }, [teamHash, days])

  useEffect(() => {
    fetchNarrative()
  }, [fetchNarrative])

  if (loading) {
    return (
      <Card className={cn("glass-card rounded-xl", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-5 w-40" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <div className="grid grid-cols-4 gap-2">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !data) {
    return (
      <Card className={cn("glass-card rounded-xl border-muted", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardTitle className="text-sm font-semibold text-foreground">Team Health Narrative</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Narrative unavailable at this time
          </p>
        </CardContent>
      </Card>
    )
  }

  const trendConfig = {
    improving: {
      label: "Improving",
      color: "text-[hsl(var(--sentinel-healthy))]",
      bgColor: "bg-[hsl(var(--sentinel-healthy))/0.1]",
      borderColor: "border-[hsl(var(--sentinel-healthy))/0.2]",
      icon: TrendingUp,
    },
    declining: {
      label: "Declining",
      color: "text-[hsl(var(--sentinel-critical))]",
      bgColor: "bg-[hsl(var(--sentinel-critical))/0.1]",
      borderColor: "border-[hsl(var(--sentinel-critical))/0.2]",
      icon: TrendingDown,
    },
    stable: {
      label: "Stable",
      color: "text-[hsl(var(--sentinel-info))]",
      bgColor: "bg-[hsl(var(--sentinel-info))/0.1]",
      borderColor: "border-[hsl(var(--sentinel-info))/0.2]",
      icon: Minus,
    },
  }

  const trend = trendConfig[data.health_trend]
  const TrendIcon = trend.icon
  const total = data.risk_distribution.critical + data.risk_distribution.elevated + data.risk_distribution.low + data.risk_distribution.calibrating

  const riskBars = [
    { key: 'critical', label: 'Critical', count: data.risk_distribution.critical, color: 'bg-red-500' },
    { key: 'elevated', label: 'Elevated', count: data.risk_distribution.elevated, color: 'bg-amber-500' },
    { key: 'low', label: 'Healthy', count: data.risk_distribution.low, color: 'bg-emerald-500' },
    { key: 'calibrating', label: 'Calibrating', count: data.risk_distribution.calibrating, color: 'bg-muted-foreground' },
  ]

  return (
    <Card className={cn("glass-card rounded-xl overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[hsl(var(--accent)/0.1)]">
              <Users className="h-4 w-4 text-[hsl(var(--accent))]" />
            </div>
            <CardTitle className="text-sm font-semibold text-foreground">Team Health Narrative</CardTitle>
          </div>
          <span className="text-[10px] text-muted-foreground">{data.time_period}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-sm leading-relaxed text-foreground/80">{data.narrative}</p>

        <div
          className={cn(
            "flex items-center gap-2 rounded-lg border px-3 py-2",
            trend.bgColor,
            trend.borderColor
          )}
        >
          <TrendIcon className={cn("h-4 w-4", trend.color)} />
          <span className={cn("text-xs font-semibold", trend.color)}>Team Health: {trend.label}</span>
        </div>

        <div className="space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Risk Distribution
          </div>
          <div className="grid grid-cols-4 gap-2">
            {riskBars.map((item) => (
              <div
                key={item.key}
                className="flex flex-col items-center rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] p-2"
              >
                <div className="flex items-center gap-1 mb-1">
                  {item.key === 'critical' && <ShieldAlert className="h-3 w-3 text-red-500" />}
                  {item.key === 'elevated' && <ShieldAlert className="h-3 w-3 text-amber-500" />}
                  {item.key === 'low' && <ShieldCheck className="h-3 w-3 text-emerald-500" />}
                  {item.key === 'calibrating' && <Shield className="h-3 w-3 text-muted-foreground" />}
                  <span className="text-[10px] font-medium text-muted-foreground">{item.label}</span>
                </div>
                <div className="text-lg font-bold text-foreground">
                  {total > 0 ? Math.round((item.count / total) * 100) : 0}%
                </div>
                <div className="text-[10px] text-muted-foreground/70">
                  {item.count} {item.count === 1 ? 'person' : 'people'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {data.key_insights && data.key_insights.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Lightbulb className="h-3.5 w-3.5" />
              Key Insights
            </div>
            <ul className="space-y-1.5">
              {data.key_insights.map((insight, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-xs text-foreground/70"
                >
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[hsl(var(--accent))]" />
                  {insight}
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="text-[10px] italic text-muted-foreground/60">
          Privacy-safe: Individual identities are protected. Only aggregated, anonymized data is shown.
        </p>
      </CardContent>
    </Card>
  )
}
