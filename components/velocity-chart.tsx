"use client"

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { HistoryPoint } from "@/types"

interface VelocityChartProps {
  history: HistoryPoint[]
  title?: string
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ value: number; dataKey: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3 shadow-lg">
      <p className="mb-1.5 text-xs font-semibold text-foreground">{label}</p>
      {payload.map((item) => (
        <div key={item.dataKey} className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">
            {item.dataKey === "velocity" ? "Velocity" : "Belongingness"}:
          </span>
          <span className="font-mono font-semibold text-foreground">{item.value}</span>
        </div>
      ))}
    </div>
  )
}

export function VelocityChart({ history, title = "Risk Velocity (30 Days)" }: VelocityChartProps) {
  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                strokeOpacity={0.5}
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
                domain={[0, "auto"]}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                y={2.5}
                stroke="hsl(var(--sentinel-critical))"
                strokeDasharray="6 3"
                strokeOpacity={0.4}
                label={{
                  value: "Critical",
                  position: "right",
                  fill: "hsl(var(--sentinel-critical))",
                  fontSize: 10,
                }}
              />
              <ReferenceLine
                y={1.5}
                stroke="hsl(var(--sentinel-elevated))"
                strokeDasharray="6 3"
                strokeOpacity={0.35}
                label={{
                  value: "Elevated",
                  position: "right",
                  fill: "hsl(var(--sentinel-elevated))",
                  fontSize: 10,
                }}
              />
              <Area
                type="monotone"
                dataKey="velocity"
                stroke="hsl(var(--sentinel-critical))"
                strokeWidth={2}
                fill="hsl(var(--sentinel-critical))"
                fillOpacity={0.06}
              />
              <Area
                type="monotone"
                dataKey="belongingness_score"
                stroke="hsl(var(--sentinel-healthy))"
                strokeWidth={2}
                fill="hsl(var(--sentinel-healthy))"
                fillOpacity={0.06}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 flex items-center justify-center gap-6">
          <div className="flex items-center gap-2">
            <span className="h-0.5 w-4 rounded bg-[hsl(var(--sentinel-critical))]" />
            <span className="text-[11px] text-muted-foreground">Velocity</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-0.5 w-4 rounded bg-[hsl(var(--sentinel-healthy))]" />
            <span className="text-[11px] text-muted-foreground">Belongingness</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
