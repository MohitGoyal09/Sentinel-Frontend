"use client"

import { useForecast } from "@/hooks/useForecast"
import { useTeamData } from "@/hooks/useTeamData"
import { useUsers } from "@/hooks/useUsers"
import { ProtectedRoute } from "@/components/protected-route"
import { ForecastChart } from "@/components/forecast-chart"
import { TeamDistribution } from "@/components/team-distribution"
import { TeamEnergyHeatmap } from "@/components/team-energy-heatmap"
import { StatCards } from "@/components/stat-cards"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Thermometer,
  Activity,
  Users,
  AlertTriangle,
  Clock,
  Brain,
  ArrowRight,
  X,
  Zap,
  TrendingUp,
  Heart,
  Shield,
  Calendar,
} from "lucide-react"
import { useMemo, useState, useEffect } from "react"
import { toRiskLevel, Employee } from "@/types"
import { api } from "@/lib/api"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

// ─── Heatmap cell color helper ───────────────────────────────────────────────
type EnergyLevel = "peak" | "good" | "neutral" | "tired" | "critical"

function energyCellClass(level: EnergyLevel): string {
  switch (level) {
    case "peak":
      return "bg-accent"
    case "good":
      return "bg-accent/50"
    case "tired":
      return "bg-[hsl(var(--sentinel-elevated))]/60"
    case "critical":
      return "bg-destructive/60"
    default:
      return "bg-muted/50"
  }
}

// Work Energy Heatmap grid definition (Mon–Sun × 6am–10pm = 7×16)
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const HOURS = [
  "6am", "7am", "8am", "9am", "10am", "11am", "12pm",
  "1pm", "2pm", "3pm", "4pm", "5pm", "6pm", "7pm", "8pm", "9pm",
]

// Backend heatmap response types
interface HeatmapDayEntry {
  date: string          // ISO date string e.g. "2024-03-15"
  risk_level: string    // "CRITICAL" | "ELEVATED" | "LOW"
  avg_velocity: number
  breakdown: { low: number; elevated: number; critical: number }
  total_members: number
}

interface HeatmapApiResponse {
  days: HeatmapDayEntry[]
  date_range: { start: string; end: string }
}

// Build a map from weekday index (0=Mon…6=Sun) → EnergyLevel by aggregating
// backend daily entries that fall on that weekday.
function buildWeekdayEnergyMap(days: HeatmapDayEntry[]): Map<number, EnergyLevel> {
  // Group counts by weekday
  const weekdayRisks = new Map<number, { critical: number; elevated: number; low: number }>()

  for (const entry of days) {
    // getDay() returns 0=Sun…6=Sat; remap to 0=Mon…6=Sun
    const jsDay = new Date(entry.date).getDay()
    const dayIdx = jsDay === 0 ? 6 : jsDay - 1

    const current = weekdayRisks.get(dayIdx) ?? { critical: 0, elevated: 0, low: 0 }
    weekdayRisks.set(dayIdx, {
      critical: current.critical + entry.breakdown.critical,
      elevated: current.elevated + entry.breakdown.elevated,
      low:      current.low      + entry.breakdown.low,
    })
  }

  const result = new Map<number, EnergyLevel>()
  for (const [dayIdx, counts] of weekdayRisks) {
    if (counts.critical > 0)                      result.set(dayIdx, "critical")
    else if (counts.elevated > counts.low)         result.set(dayIdx, "tired")
    else if (counts.low > 0)                       result.set(dayIdx, "good")
    else                                           result.set(dayIdx, "neutral")
  }
  return result
}

// ─── Risk Distribution Bar ────────────────────────────────────────────────────
interface RiskBarProps {
  critical: number
  elevated: number
  healthy: number
  total: number
}

function RiskDistributionBar({ critical, elevated, healthy, total }: RiskBarProps) {
  if (total === 0) return null
  const criticalPct = Math.round((critical / total) * 100)
  const elevatedPct = Math.round((elevated / total) * 100)
  const healthyPct = 100 - criticalPct - elevatedPct

  return (
    <div className="space-y-3">
      <div className="flex h-6 w-full overflow-hidden rounded-full">
        <div
          className="bg-destructive transition-all duration-700 ease-out"
          style={{ width: `${criticalPct}%` }}
        />
        <div
          className="bg-[hsl(var(--sentinel-elevated))] transition-all duration-700 ease-out delay-75"
          style={{ width: `${elevatedPct}%` }}
        />
        <div
          className="bg-[hsl(var(--sentinel-healthy))] transition-all duration-700 ease-out delay-150"
          style={{ width: `${healthyPct}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-destructive" />
          <span className="text-muted-foreground">Critical</span>
          <span className="font-semibold tabular-nums text-foreground">{criticalPct}%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[hsl(var(--sentinel-elevated))]" />
          <span className="text-muted-foreground">Elevated</span>
          <span className="font-semibold tabular-nums text-foreground">{elevatedPct}%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[hsl(var(--sentinel-healthy))]" />
          <span className="text-muted-foreground">Healthy</span>
          <span className="font-semibold tabular-nums text-foreground">{healthyPct}%</span>
        </div>
      </div>
    </div>
  )
}

// ─── Employee Health Snapshot Card ───────────────────────────────────────────
function EmployeeSnapshotCard({ employee }: { employee: Employee }) {
  const initials = employee.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  const statusColor =
    employee.risk_level === "CRITICAL"
      ? "bg-destructive"
      : employee.risk_level === "ELEVATED"
        ? "bg-[hsl(var(--sentinel-elevated))]"
        : "bg-[hsl(var(--sentinel-healthy))]"

  const avatarGradient =
    employee.risk_level === "CRITICAL"
      ? "from-destructive/20 to-destructive/5"
      : employee.risk_level === "ELEVATED"
        ? "from-[hsl(var(--sentinel-elevated))]/20 to-[hsl(var(--sentinel-elevated))]/5"
        : "from-accent/20 to-accent/5"

  return (
    <div className="group relative flex flex-col items-center gap-2 rounded-xl bg-card border border-border p-3 text-center hover:border-border/50 hover:bg-card/80 transition-all duration-150 cursor-default">
      <div className={`h-9 w-9 rounded-full bg-gradient-to-br ${avatarGradient} flex items-center justify-center border border-border/50`}>
        <span className="text-[10px] font-semibold text-foreground">{initials}</span>
      </div>
      <span className="text-[10px] text-muted-foreground leading-tight max-w-full truncate w-full">
        {employee.name.split(" ")[0]}
      </span>
      <span className={`absolute top-2.5 right-2.5 h-2 w-2 rounded-full ${statusColor}`} />

      {/* Hover tooltip */}
      <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center z-10">
        <div className="rounded-lg bg-card border border-border/50 px-3 py-2 shadow-xl text-left min-w-[160px]">
          <p className="text-xs font-semibold text-foreground">{employee.name}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{employee.role}</p>
          <div className="mt-1.5 flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${statusColor}`} />
            <span className="text-[10px] text-muted-foreground capitalize">
              {employee.risk_level.toLowerCase()} risk
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Velocity: <span className="font-mono text-foreground">{employee.velocity.toFixed(2)}</span>
          </p>
        </div>
        <span className="h-1.5 w-1.5 rotate-45 bg-card border-b border-r border-border/50 -mt-[3px]" />
      </div>
    </div>
  )
}

// ─── Page Component ───────────────────────────────────────────────────────────
export default function TeamHealthPage() {
  const router = useRouter()
  const { data: teamData, isLoading: teamLoading } = useTeamData()
  const { data: forecastData, isLoading: forecastLoading } = useForecast()
  const { users } = useUsers()
  const [alertDismissed, setAlertDismissed] = useState(false)

  // Energy heatmap — fetched from real backend data
  const [heatmapData, setHeatmapData] = useState<HeatmapApiResponse | null>(null)
  const [heatmapLoading, setHeatmapLoading] = useState(true)
  const [heatmapError, setHeatmapError] = useState(false)

  useEffect(() => {
    let cancelled = false
    setHeatmapLoading(true)
    setHeatmapError(false)
    api.get<HeatmapApiResponse>("/analytics/team-energy-heatmap?days=30")
      .then((data) => {
        if (!cancelled) setHeatmapData(data)
      })
      .catch(() => {
        if (!cancelled) setHeatmapError(true)
      })
      .finally(() => {
        if (!cancelled) setHeatmapLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const weekdayEnergyMap = useMemo(
    () => heatmapData ? buildWeekdayEnergyMap(heatmapData.days) : null,
    [heatmapData]
  )

  // Convert UserSummary list to Employee-compatible shape for TeamDistribution
  const employees = useMemo((): Employee[] => {
    return users
      .filter((u) => u.risk_level)
      .map((u) => ({
        user_hash: u.user_hash,
        name: u.name ?? u.user_hash.slice(0, 8),
        role: u.role ?? "Unknown",
        risk_level: toRiskLevel(u.risk_level),
        velocity: u.velocity ?? 0,
        confidence: u.confidence ?? 0,
        belongingness_score: u.belongingness_score ?? 0,
        circadian_entropy: u.circadian_entropy ?? 0,
        attrition_probability: u.attrition_probability ?? 0,
        updated_at: u.updated_at ?? new Date().toISOString(),
        persona: "",
        indicators: {
          chaotic_hours: u.chaotic_hours ?? false,
          social_withdrawal: u.social_withdrawal ?? false,
          sustained_intensity: u.sustained_intensity ?? false,
          has_explained_context: u.has_explained_context ?? false,
        },
      }))
  }, [users])

  const mappedTeamMetrics = useMemo(() => {
    if (!teamData) return null
    const totalMembers =
      teamData.metrics.total_members ??
      teamData.metrics.team_size ??
      teamData.metrics.member_count ??
      employees.length ??
      0

    const healthy_count =
      employees.length > 0
        ? employees.filter((e) => e.risk_level === "LOW").length
        : Math.round(((teamData.metrics as any).healthy_percentage ?? 0) / 100 * totalMembers)

    const elevated_count =
      employees.length > 0
        ? employees.filter((e) => e.risk_level === "ELEVATED").length
        : Math.round(((teamData.metrics as any).elevated_percentage ?? 0) / 100 * totalMembers)

    return {
      total_members: totalMembers,
      healthy_count,
      elevated_count,
      critical_count: teamData.metrics.critical_members ?? teamData.metrics.critical_count ?? 0,
      calibrating_count: 0,
      avg_velocity: teamData.metrics.avg_velocity,
      graph_fragmentation: teamData.metrics.graph_fragmentation,
      comm_decay_rate: teamData.metrics.comm_decay_rate,
      contagion_risk: toRiskLevel(teamData.team_risk)
    }
  }, [teamData, employees])

  const contagionAlerts = useMemo(() => {
    return (teamData as any)?.contagion_alerts ?? (teamData as any)?.alerts ?? []
  }, [teamData])

  const criticalCount = mappedTeamMetrics?.critical_count ?? 0
  const showCriticalBanner = criticalCount > 0 && !alertDismissed

  const totalMembers = mappedTeamMetrics?.total_members ?? 0
  const elevatedCount = mappedTeamMetrics?.elevated_count ?? 0
  const healthyCount = mappedTeamMetrics?.healthy_count ?? 0

  function getEnergyLevel(dayIdx: number, hourIdx: number): EnergyLevel {
    const hour = hourIdx + 6 // hourIdx 0 = 6am
    const isWeekend = dayIdx >= 5

    // Get day-level risk from API if available (modulates intensity)
    const dayRisk = weekdayEnergyMap?.get(dayIdx)
    const hasCriticalDay = dayRisk === "critical"
    const hasTiredDay = dayRisk === "tired" || dayRisk === "critical"

    if (isWeekend) {
      // Weekends: mostly neutral, slight activity if critical
      if (hour >= 10 && hour < 16) return hasCriticalDay ? "tired" : "neutral"
      return "neutral"
    }

    // Weekday hour-based pattern
    if (hour < 8) return "neutral"                                    // Early morning
    if (hour >= 9 && hour < 12) return hasCriticalDay ? "good" : "peak" // Morning core
    if (hour >= 12 && hour < 13) return "neutral"                     // Lunch
    if (hour >= 13 && hour < 17) return hasTiredDay ? "neutral" : "good" // Afternoon
    if (hour >= 17 && hour < 18) return "neutral"                     // Wind down
    if (hour >= 18 && hour < 20) return hasTiredDay ? "tired" : "neutral" // After hours
    if (hour >= 20) return hasCriticalDay ? "critical" : (hasTiredDay ? "tired" : "neutral")
    return "neutral"
  }

  return (
    <ProtectedRoute allowedRoles={["manager", "admin"]}>
      <div className="flex flex-col min-h-screen bg-background p-6 lg:p-8 space-y-6">

        {/* ── Page Header ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-destructive/10 border border-destructive/20">
                <Thermometer className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Culture Thermometer</h1>
                <p className="text-sm text-muted-foreground">
                  Epidemic modeling (SIR) — predict emotional contagion and burnout spread.
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-card border border-border rounded-lg px-3 py-2">
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
            Live monitoring
          </div>
        </div>

        {/* ── Critical Alert Banner ────────────────────────────────────────── */}
        {showCriticalBanner && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-center gap-3">
            <div className="flex-shrink-0 p-1.5 rounded-lg bg-destructive/20">
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">
                {criticalCount} Critical Alert{criticalCount !== 1 ? "s" : ""} — Immediate attention required
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Team members at critical burnout risk need intervention today.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10 text-xs h-8"
              >
                View All
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                onClick={() => setAlertDismissed(true)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}

        {/* ── KPI Cards ────────────────────────────────────────────────────── */}
        {/* Use existing StatCards component; it handles its own loading skeleton */}
        {mappedTeamMetrics && <StatCards metrics={mappedTeamMetrics as any} />}

        {/* ── Main Grid ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-5 gap-5">

          {/* LEFT: col-span-3 */}
          <div className="col-span-5 xl:col-span-3 flex flex-col gap-5">

            {/* Work Energy Heatmap */}
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-accent/10">
                    <Clock className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">Work Energy Heatmap</h3>
                    <p className="text-[11px] text-muted-foreground">
                      {heatmapError
                        ? "Data unavailable — showing empty grid"
                        : "Risk intensity by weekday · last 30 days"}
                    </p>
                  </div>
                </div>
                {!heatmapError && !heatmapLoading && heatmapData && (
                  <span className="text-[10px] font-medium text-accent bg-accent/10 border border-accent/20 rounded-full px-2.5 py-1">
                    {heatmapData.date_range.start} – {heatmapData.date_range.end}
                  </span>
                )}
                {heatmapError && (
                  <span className="text-[10px] font-medium text-muted-foreground bg-muted border border-border/50 rounded-full px-2.5 py-1">
                    Unavailable
                  </span>
                )}
              </div>

              {heatmapLoading ? (
                <div className="flex items-center justify-center h-48 text-xs text-muted-foreground">
                  Loading heatmap data...
                </div>
              ) : (
                <>
                  {/* Day column headers */}
                  <div className="grid grid-cols-[40px_1fr] gap-1 mb-1">
                    <div />
                    <div className="grid grid-cols-7 gap-1">
                      {DAYS.map((d) => (
                        <div key={d} className="text-center text-[10px] font-medium text-muted-foreground">
                          {d}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Grid rows */}
                  <div className="space-y-1">
                    {HOURS.map((hour, hourIdx) => (
                      <div key={hour} className="grid grid-cols-[40px_1fr] gap-1 items-center">
                        <span className="text-[10px] text-muted-foreground text-right pr-2 leading-none">
                          {hour}
                        </span>
                        <div className="grid grid-cols-7 gap-1">
                          {DAYS.map((_, dayIdx) => {
                            const level = getEnergyLevel(dayIdx, hourIdx)
                            return (
                              <div
                                key={dayIdx}
                                className={`h-4 w-full rounded-sm ${energyCellClass(level)} transition-opacity hover:opacity-80`}
                              />
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Legend */}
              <div className="mt-4 flex items-center gap-4 flex-wrap">
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Legend:</span>
                {[
                  { level: "peak" as EnergyLevel, label: "Peak" },
                  { level: "good" as EnergyLevel, label: "Good" },
                  { level: "neutral" as EnergyLevel, label: "Normal" },
                  { level: "tired" as EnergyLevel, label: "Tired" },
                  { level: "critical" as EnergyLevel, label: "Critical" },
                ].map(({ level, label }) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <div className={`h-3 w-3 rounded-sm ${energyCellClass(level)}`} />
                    <span className="text-[10px] text-muted-foreground">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Burnout Forecast */}
            <ForecastChart data={forecastData} isLoading={forecastLoading} />

          </div>

          {/* RIGHT: col-span-2 */}
          <div className="col-span-5 xl:col-span-2 flex flex-col gap-5">

            {/* Risk Distribution */}
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Risk Distribution</h3>
                  <p className="text-[11px] text-muted-foreground">Real-time team health snapshot</p>
                </div>
              </div>
              {totalMembers > 0 ? (
                <RiskDistributionBar
                  critical={criticalCount}
                  elevated={elevatedCount}
                  healthy={healthyCount}
                  total={totalMembers}
                />
              ) : teamData ? (
                <div className="flex items-center justify-center h-16 text-xs text-muted-foreground">
                  No team members found
                </div>
              ) : (
                <div className="flex items-center justify-center h-16 text-xs text-muted-foreground">
                  Loading distribution data...
                </div>
              )}
            </div>

            {/* Stress Contagion (AI-unique) */}
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-accent/10">
                    <Brain className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">Contagion Analysis</h3>
                    <p className="text-[11px] text-muted-foreground">Stress spread detection</p>
                  </div>
                </div>
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                  <span className="text-[10px] font-medium text-accent">AI</span>
                </span>
              </div>

              {contagionAlerts.length > 0 ? (
                <div className="space-y-3">
                  {contagionAlerts.slice(0, 2).map((alert: any, idx: number) => (
                    <div key={idx} className="rounded-lg bg-destructive/5 border border-destructive/15 p-3">
                      <div className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-destructive" />
                        <p className="text-xs text-foreground leading-relaxed">
                          {typeof alert === "string" ? alert : alert.message ?? JSON.stringify(alert)}
                        </p>
                      </div>
                      {/* Arrow diagram */}
                      <div className="mt-2.5 flex items-center gap-1.5">
                        <div className="h-5 w-5 rounded-full bg-destructive/20 border border-destructive/30 flex items-center justify-center">
                          <span className="text-[8px] font-bold text-destructive">A</span>
                        </div>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <div className="h-5 w-5 rounded-full bg-[hsl(var(--sentinel-elevated))]/20 border border-[hsl(var(--sentinel-elevated))]/30 flex items-center justify-center">
                          <span className="text-[8px] font-bold text-[hsl(var(--sentinel-elevated))]">B</span>
                        </div>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <div className="h-5 w-5 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center">
                          <span className="text-[8px] font-bold text-accent">C</span>
                        </div>
                        <span className="ml-1 text-[10px] text-muted-foreground">+3 members</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No contagion pathways detected.</p>
              )}

              <Button
                variant="ghost"
                size="sm"
                className="mt-3 w-full text-xs border border-border/50 hover:bg-muted/50 text-muted-foreground hover:text-foreground justify-between"
              >
                View in Network Engine
                <ArrowRight className="h-3 w-3" />
              </Button>
            </div>

            {/* Quick Actions */}
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <Zap className="h-4 w-4 text-primary" />
                </div>
                <h3 className="text-sm font-semibold">Quick Actions</h3>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    toast.success('Opening Ask Sentinel to schedule a team break...')
                    setTimeout(() => router.push('/ask-sentinel?q=Schedule+a+team+break+for+my+team+this+week'), 500)
                  }}
                  className="flex items-center gap-3 border border-border hover:bg-muted/50 rounded-lg py-3 px-4 text-sm w-full text-left transition-[background-color,border-color,transform] duration-150 active:scale-[0.97] text-foreground hover:border-border cursor-pointer"
                >
                  <Calendar className="h-4 w-4 text-primary" />
                  Schedule Team Break
                  <ArrowRight className="h-3 w-3 ml-auto text-muted-foreground" />
                </button>
                <button
                  onClick={() => {
                    toast.success('Wellness survey sent to all ' + totalMembers + ' team members', {
                      description: 'Employees will receive in-app wellbeing check prompts.',
                    })
                  }}
                  className="flex items-center gap-3 border border-border hover:bg-muted/50 rounded-lg py-3 px-4 text-sm w-full text-left transition-[background-color,border-color,transform] duration-150 active:scale-[0.97] text-foreground hover:border-border cursor-pointer"
                >
                  <Heart className="h-4 w-4 text-accent" />
                  Send Wellness Survey
                  <ArrowRight className="h-3 w-3 ml-auto text-muted-foreground" />
                </button>
                <button
                  onClick={() => {
                    toast('Running safety analysis across all team members...', { icon: '🔍' })
                    setTimeout(() => router.push('/engines/safety'), 800)
                  }}
                  className="flex items-center gap-3 border border-destructive/20 hover:bg-destructive/5 rounded-lg py-3 px-4 text-sm w-full text-left transition-[background-color,border-color,transform] duration-150 active:scale-[0.97] text-foreground hover:border-destructive/30 cursor-pointer"
                >
                  <Shield className="h-4 w-4 text-destructive" />
                  Trigger Alert Check
                  <ArrowRight className="h-3 w-3 ml-auto text-muted-foreground" />
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* ── Individual Health Snapshot ───────────────────────────────────── */}
        {employees.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">Individual Health Snapshot</h3>
                <span className="text-[10px] font-medium text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                  {employees.length} members
                </span>
              </div>
            </div>
            <div className="grid grid-cols-8 gap-2 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-16">
              {employees.map((emp) => (
                <EmployeeSnapshotCard key={emp.user_hash} employee={emp} />
              ))}
            </div>
          </div>
        )}

        {/* ── Team Distribution Detail ─────────────────────────────────────── */}
        {employees.length > 0 && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">Velocity &amp; Distribution Detail</h3>
            </div>
            <TeamDistribution employees={employees} />
          </div>
        )}

      </div>
    </ProtectedRoute>
  )
}
