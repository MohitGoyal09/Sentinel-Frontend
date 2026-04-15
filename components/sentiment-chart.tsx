"use client"

import { useEffect, useState } from "react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
} from "recharts"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"

interface SentimentPoint {
  date: string
  score: number
  count: number
}

interface SentimentChartProps {
  userHash: string
  height?: number
  className?: string
}

export function SentimentChart({
  userHash,
  height = 120,
  className,
}: SentimentChartProps) {
  const [data, setData] = useState<SentimentPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userHash) return

    let cancelled = false
    setLoading(true)

    api
      .get<{ success: boolean; data: SentimentPoint[] }>(
        `/engines/users/${userHash}/sentiment-history?days=21`,
      )
      .then((res) => {
        if (!cancelled) {
          setData(res.data ?? [])
        }
      })
      .catch(() => {
        if (!cancelled) setData([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [userHash])

  if (loading) {
    return (
      <div
        className={cn(
          "bg-card border border-border rounded-xl flex items-center justify-center",
          className,
        )}
        style={{ height }}
      >
        <div className="h-4 w-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div
        className={cn(
          "bg-card border border-border rounded-xl flex items-center justify-center",
          className,
        )}
        style={{ height }}
      >
        <p className="text-[11px] text-muted-foreground">
          No sentiment data yet
        </p>
      </div>
    )
  }

  const formatDateTick = (dateStr: string): string => {
    const d = new Date(dateStr + "T00:00:00")
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" })
  }

  return (
    <div
      className={cn(
        "bg-card border border-border rounded-xl px-3 pt-3 pb-1",
        className,
      )}
      style={{ height }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 4, right: 4, bottom: 0, left: -24 }}
        >
          <defs>
            <linearGradient id="sentimentFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
              <stop offset="50%" stopColor="#10b981" stopOpacity={0.02} />
              <stop offset="50%" stopColor="#ef4444" stopOpacity={0.02} />
              <stop offset="100%" stopColor="#ef4444" stopOpacity={0.25} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 9, fill: "#808080" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={formatDateTick}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[-1, 1]}
            tick={{ fontSize: 9, fill: "#808080" }}
            axisLine={false}
            tickLine={false}
            ticks={[-1, 0, 1]}
          />
          <ReferenceLine
            y={0}
            stroke="#808080"
            strokeDasharray="3 3"
            strokeOpacity={0.4}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              borderColor: "hsl(var(--border))",
              borderRadius: 8,
              fontSize: 11,
              padding: "6px 10px",
            }}
            labelFormatter={formatDateTick}
            formatter={(value: number) => [value.toFixed(2), "Score"]}
          />
          <Area
            type="monotone"
            dataKey="score"
            stroke="#10b981"
            strokeWidth={1.5}
            fill="url(#sentimentFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
