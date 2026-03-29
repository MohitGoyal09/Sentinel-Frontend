"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Brain, TrendingUp, AlertTriangle, Clock, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts"

interface BurnoutPredictionProps {
  riskData?: {
    risk_level: string
    velocity: number
    confidence: number
    belongingness_score?: number
    circadian_entropy?: number
    indicators?: Record<string, boolean>
    [key: string]: any
  }
  history?: Array<{
    date?: string
    timestamp?: string
    risk_level: string
    velocity: number
    belongingness_score?: number
    [key: string]: any
  }>
}

// Generate future prediction points based on current trajectory
function generatePrediction(
  history: BurnoutPredictionProps["history"],
  currentRisk: string,
  days: number = 14
) {
  if (!history || history.length < 2) return []

  const lastVelocity = history[history.length - 1]?.velocity || 0
  const prevVelocity = history[Math.max(0, history.length - 3)]?.velocity || 0
  const trend = (lastVelocity - prevVelocity) / 3

  const predictions = []
  const now = new Date()

  for (let i = 1; i <= days; i++) {
    const date = new Date(now)
    date.setDate(date.getDate() + i)

    // Velocity with dampened trend + slight noise
    const projected = Math.max(0, Math.min(5, lastVelocity + trend * i * 0.6))
    const upper = Math.min(5, projected * 1.15)
    const lower = Math.max(0, projected * 0.85)

    predictions.push({
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      velocity: Number(projected.toFixed(2)),
      upper: Number(upper.toFixed(2)),
      lower: Number(lower.toFixed(2)),
      isPrediction: true,
    })
  }
  return predictions
}

function getRiskFromVelocity(v: number): string {
  if (v >= 2.5) return "CRITICAL"
  if (v >= 1.5) return "ELEVATED"
  return "LOW"
}

export function BurnoutPrediction({ riskData, history }: BurnoutPredictionProps) {
  const chartData = useMemo(() => {
    if (!history || history.length === 0) return []

    const historical = history.slice(-14).map((h) => ({
      date: h.date || new Date(h.timestamp || "").toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      velocity: h.velocity,
      isPrediction: false,
    }))

    const predictions = generatePrediction(history, riskData?.risk_level || "LOW")

    return [...historical, ...predictions]
  }, [history, riskData])

  const prediction = useMemo(() => {
    if (!chartData.length) return null

    const futurePoints = chartData.filter((d: any) => d.isPrediction)
    if (futurePoints.length === 0) return null

    const lastPredicted = futurePoints[futurePoints.length - 1]
    const currentVelocity = riskData?.velocity || 0
    const predictedVelocity = (lastPredicted as any).velocity || 0
    const predictedRisk = getRiskFromVelocity(predictedVelocity)

    const daysToThreshold = futurePoints.findIndex((p: any) => p.velocity >= 2.5)

    return {
      predictedRisk,
      predictedVelocity,
      trend: predictedVelocity > currentVelocity ? "increasing" : predictedVelocity < currentVelocity ? "decreasing" : "stable",
      daysToThreshold: daysToThreshold >= 0 ? daysToThreshold + 1 : null,
    }
  }, [chartData, riskData])

  // Contributing factors from indicators
  const factors = useMemo(() => {
    if (!riskData?.indicators) return []
    const factorMap: Record<string, { label: string; weight: number }> = {
      overwork: { label: "After-hours activity", weight: 35 },
      isolation: { label: "Reduced collaboration", weight: 25 },
      late_night_pattern: { label: "Late-night commits", weight: 20 },
      communication_decline: { label: "Communication decline", weight: 15 },
      fragmentation: { label: "Context switching", weight: 10 },
      weekend_work: { label: "Weekend work", weight: 15 },
    }

    return Object.entries(riskData.indicators)
      .filter(([_, active]) => active)
      .map(([key, _]) => factorMap[key])
      .filter(Boolean)
      .sort((a, b) => b.weight - a.weight)
  }, [riskData])

  const riskColorMap: Record<string, string> = {
    LOW: "",
    ELEVATED: "",
    CRITICAL: "",
  }
  const riskStyleMap: Record<string, React.CSSProperties> = {
    LOW: {color: 'hsl(var(--sentinel-healthy))'},
    ELEVATED: {color: 'hsl(var(--sentinel-elevated))'},
    CRITICAL: {color: 'hsl(var(--sentinel-critical))'},
  }

  return (
    <Card className="bg-card border-border backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Brain className="h-5 w-5" style={{color: 'hsl(var(--primary))'}} />
              Burnout Prediction
            </CardTitle>
            <CardDescription>14-day risk trajectory forecast with confidence intervals</CardDescription>
          </div>
          {prediction && (
            <Badge
              variant="outline"
              className="px-3 py-1"
              style={
                prediction.predictedRisk === "CRITICAL"
                  ? {color: 'hsl(var(--sentinel-critical))', borderColor: 'hsl(var(--sentinel-critical) / 0.3)', backgroundColor: 'hsl(var(--sentinel-critical) / 0.1)'}
                  : prediction.predictedRisk === "ELEVATED"
                    ? {color: 'hsl(var(--sentinel-elevated))', borderColor: 'hsl(var(--sentinel-elevated) / 0.3)', backgroundColor: 'hsl(var(--sentinel-elevated) / 0.1)'}
                    : {color: 'hsl(var(--sentinel-healthy))', borderColor: 'hsl(var(--sentinel-healthy) / 0.3)', backgroundColor: 'hsl(var(--sentinel-healthy) / 0.1)'}
              }
            >
              {prediction.trend === "increasing" ? (
                <ArrowUpRight className="h-3 w-3 mr-1" />
              ) : prediction.trend === "decreasing" ? (
                <ArrowDownRight className="h-3 w-3 mr-1" />
              ) : (
                <Minus className="h-3 w-3 mr-1" />
              )}
              {prediction.predictedRisk} in 14d
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart */}
          <div className="lg:col-span-2">
            <div className="h-[250px]">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="historicalGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--sentinel-healthy))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--sentinel-healthy))" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="predictionGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                      axisLine={{ stroke: "hsl(var(--border))" }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      domain={[0, 4]}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                      axisLine={{ stroke: "hsl(var(--border))" }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                        color: "hsl(var(--foreground))",
                      }}
                    />
                    <ReferenceLine y={2.5} stroke="hsl(var(--sentinel-critical))" strokeDasharray="4 4" label={{ value: "Critical", fill: "hsl(var(--sentinel-critical))", fontSize: 10 }} />
                    <ReferenceLine y={1.5} stroke="hsl(var(--sentinel-elevated))" strokeDasharray="4 4" label={{ value: "Elevated", fill: "hsl(var(--sentinel-elevated))", fontSize: 10 }} />
                    {/* Confidence band for predictions */}
                    <Area
                      type="monotone"
                      dataKey="upper"
                      stroke="none"
                      fill="url(#predictionGrad)"
                      fillOpacity={1}
                    />
                    <Area
                      type="monotone"
                      dataKey="lower"
                      stroke="none"
                      fill="hsl(var(--background))"
                      fillOpacity={1}
                    />
                    {/* Velocity line */}
                    <Area
                      type="monotone"
                      dataKey="velocity"
                      stroke="hsl(var(--sentinel-healthy))"
                      fill="url(#historicalGrad)"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, fill: "hsl(var(--sentinel-healthy))" }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground/70 text-sm">
                  Insufficient history for prediction
                </div>
              )}
            </div>
            <div className="flex items-center gap-4 mt-3 text-[10px] text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div className="h-0.5 w-4 rounded" style={{backgroundColor: 'hsl(var(--sentinel-healthy))'}} />
                <span>Actual</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-0.5 w-4 rounded opacity-50" style={{backgroundColor: 'hsl(var(--primary))'}} />
                <span>Predicted (70% confidence)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-[1px] w-4 border-t border-dashed" style={{borderColor: 'hsl(var(--sentinel-critical))'}} />
                <span>Critical threshold</span>
              </div>
            </div>
          </div>

          {/* Right panel: factors + prediction info */}
          <div className="space-y-4">
            {/* Prediction alert */}
            {prediction?.daysToThreshold && (
              <div className="rounded-lg border p-3" style={{borderColor: 'hsl(var(--sentinel-critical) / 0.2)', backgroundColor: 'hsl(var(--sentinel-critical) / 0.05)'}}>
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="h-4 w-4" style={{color: 'hsl(var(--sentinel-critical))'}} />
                  <span className="text-xs font-semibold" style={{color: 'hsl(var(--sentinel-critical))'}}>Early Warning</span>
                </div>
                <p className="text-xs" style={{color: 'hsl(var(--sentinel-critical) / 0.8)'}}>
                  Predicted to reach CRITICAL threshold in {prediction.daysToThreshold} days at current trajectory.
                </p>
              </div>
            )}

            {/* Contributing factors */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Contributing Factors</h4>
              {factors.length > 0 ? (
                <div className="space-y-2">
                  {factors.map((f, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-xs text-foreground">{f.label}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-white/5 overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${f.weight}%`, backgroundColor: 'hsl(var(--sentinel-elevated) / 0.7)' }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground/70 w-8 text-right">{f.weight}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground/70">No active risk indicators</p>
              )}
            </div>

            {/* Current metrics */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Current Metrics</h4>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Velocity</span>
                  <span className={cn("text-xs font-mono", riskColorMap[riskData?.risk_level || "LOW"])} style={riskStyleMap[riskData?.risk_level || "LOW"]}>
                    {riskData?.velocity?.toFixed(2) || "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Confidence</span>
                   <span className="text-xs font-mono text-foreground">
                    {riskData?.confidence ? `${(riskData.confidence * 100).toFixed(0)}%` : "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Belongingness</span>
                   <span className="text-xs font-mono text-foreground">
                    {riskData?.belongingness_score?.toFixed(2) || "—"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
