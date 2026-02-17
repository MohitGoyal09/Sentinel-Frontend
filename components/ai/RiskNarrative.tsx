"use client"

import { useState, useEffect, useCallback } from "react"
import { BarChart3, TrendingUp, TrendingDown, Minus, Lightbulb } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { getRiskNarrative, type RiskNarrativeData } from "@/lib/api"
import { cn } from "@/lib/utils"

interface RiskNarrativeProps {
  userHash: string
  timeRange?: number
  className?: string
}

export function RiskNarrative({ userHash, timeRange = 14, className }: RiskNarrativeProps) {
  const [data, setData] = useState<RiskNarrativeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchNarrative = useCallback(async () => {
    try {
      setLoading(true)
      const result = await getRiskNarrative(userHash, timeRange)
      setData(result)
      setError(null)
    } catch (err: unknown) {
      console.error("Failed to fetch risk narrative:", err)
      setError(err instanceof Error ? err.message : "Failed to load narrative")
    } finally {
      setLoading(false)
    }
  }, [userHash, timeRange])

  useEffect(() => {
    fetchNarrative()
  }, [fetchNarrative])

  if (loading) {
    return (
      <Card className={cn("glass-card rounded-xl", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-5 w-32" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
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
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardTitle className="text-sm font-semibold text-foreground">Risk Narrative</CardTitle>
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
    increasing: {
      label: "Increasing",
      color: "text-[hsl(var(--sentinel-critical))]",
      bgColor: "bg-[hsl(var(--sentinel-critical))/0.1]",
      borderColor: "border-[hsl(var(--sentinel-critical))/0.2]",
      icon: TrendingUp,
    },
    decreasing: {
      label: "Decreasing",
      color: "text-[hsl(var(--sentinel-healthy))]",
      bgColor: "bg-[hsl(var(--sentinel-healthy))/0.1]",
      borderColor: "border-[hsl(var(--sentinel-healthy))/0.2]",
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

  const trend = trendConfig[data.trend]
  const TrendIcon = trend.icon

  return (
    <Card className={cn("glass-card rounded-xl overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[hsl(var(--accent)/0.1)]">
              <BarChart3 className="h-4 w-4 text-[hsl(var(--accent))]" />
            </div>
            <CardTitle className="text-sm font-semibold text-foreground">Risk Narrative</CardTitle>
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
          <span className={cn("text-xs font-semibold", trend.color)}>Trend: {trend.label}</span>
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
      </CardContent>
    </Card>
  )
}
