"use client"

import { useMemo, useEffect, useState } from "react"
import { Thermometer, RefreshCw, TrendingDown, TrendingUp, MessageSquare, Users, Activity, AlertTriangle } from "lucide-react"
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts"

import { ProtectedRoute } from "@/components/protected-route"
import { ScrollArea } from "@/components/ui/scroll-area"
import { StatCard } from "@/components/dashboard/stat-card"
import { RiskBadge } from "@/components/dashboard/risk-badge"
import { SectionCard } from "@/components/dashboard/section-card"
import { useTeamData } from "@/hooks/useTeamData"
import { useUsers } from "@/hooks/useUsers"
import { useForecast } from "@/hooks/useForecast"
import { getTeamEnergyHeatmap } from "@/lib/api"
import { toRiskLevel, type RiskLevel, type UserSummary } from "@/types"
import { cn } from "@/lib/utils"

// ─── Constants ────────────────────────────────────────────────────────────────

const RISK_ORDER: Record<string, number> = { CRITICAL: 0, ELEVATED: 1, LOW: 2 }
const HEATMAP_LABELS = ["M", "T", "W", "T", "F", "S", "S"]
type HeatLevel = "low" | "elevated" | "critical"
const HEAT_STYLES: Record<HeatLevel, string> = {
  low: "bg-emerald-500/30",
  elevated: "bg-amber-500/40",
  critical: "bg-red-500/30",
}

const TOOLTIP_STYLE = {
  contentStyle: { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 12 },
  labelStyle: { color: "hsl(var(--muted-foreground))" },
  itemStyle: { color: "hsl(var(--foreground))" },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sortByRisk(a: UserSummary, b: UserSummary) {
  return (RISK_ORDER[a.risk_level ?? "LOW"] ?? 2) - (RISK_ORDER[b.risk_level ?? "LOW"] ?? 2)
}

function riskDot(level: string | undefined) {
  if (level === "CRITICAL") return "bg-red-400"
  if (level === "ELEVATED") return "bg-amber-400"
  return "bg-emerald-400"
}

/** Clamp comm_decay_rate (decimal) to [-100, 100] percent display value. */
function clampDecayPercent(rate: number): number {
  return Math.max(-100, Math.min(100, Math.round(rate * 100)))
}

/**
 * Returns `{ data, simulated }`. When the API forecast is available the SIR
 * arrays are used directly (simulated = false). When no forecast data exists
 * we fall back to a sine-curve shape so the chart is never blank, and mark it
 * as simulated so the UI can render a "Simulated" badge.
 */
function buildSIRData(days?: number[], S?: number[], I?: number[], R?: number[]): {
  data: Array<{ day: number; susceptible: number; infected: number; recovered: number }>
  simulated: boolean
} {
  if (days?.length && S && I && R) {
    return {
      simulated: false,
      data: days.map((day, i) => ({
        day,
        susceptible: Math.round((S[i] ?? 1) * 100),
        infected: Math.round((I[i] ?? 0) * 100),
        recovered: Math.round((R[i] ?? 0) * 100),
      })),
    }
  }
  return {
    simulated: true,
    data: Array.from({ length: 30 }, (_, i) => {
      const t = i / 29
      const infected = Math.round(Math.sin(t * Math.PI) * 35)
      const recovered = Math.round(t * t * 45)
      return { day: i + 1, susceptible: 100 - infected - recovered, infected, recovered }
    }),
  }
}

/**
 * Build 14-day communication trend bars. When decayRate is negative the bars
 * trend downward; when positive they trend upward. Both have mild variance so
 * the chart doesn't look perfectly linear.
 */
function buildCommTrend(decayRate: number): Array<{ day: string; interactions: number }> {
  const clamped = Math.max(-1, Math.min(1, decayRate))
  const base = 60
  return Array.from({ length: 14 }, (_, i) => {
    // Linear drift: negative decay → lower later bars, positive → higher later bars
    const drift = clamped * (i / 13) * 30
    // Mild pseudo-random variance derived from index
    const noise = ((i * 7 + i * i) % 11) - 5
    // Weekends (day 5=Sat, day 6=Sun in first week; 12/13 in second) get less traffic
    const dayOfWeek = i % 7
    const weekendPenalty = dayOfWeek >= 5 ? -15 : 0
    const value = Math.max(0, Math.round(base + drift + noise + weekendPenalty))
    return { day: `D${i + 1}`, interactions: value }
  })
}

/** Map API dominant_risk_level string to HeatLevel. */
function riskToHeatLevel(risk: string | undefined): HeatLevel {
  if (risk === "CRITICAL") return "critical"
  if (risk === "ELEVATED") return "elevated"
  return "low"
}

/**
 * Build heatmap grid (4 weeks × 7 days) from API daily entries.
 * Falls back to a realistic static pattern weighted towards weekday activity.
 */
function buildHeatmapData(
  apiDays: Array<{ date: string; risk_level?: string }> | null,
  decayRate: number,
): HeatLevel[][] {
  if (apiDays && apiDays.length > 0) {
    // Use up to the last 28 days from the API, pad the front with "low" if needed
    const tail = apiDays.slice(-28)
    const padded = Array.from({ length: 28 - tail.length }, (): HeatLevel => "low").concat(
      tail.map((d) => riskToHeatLevel(d.risk_level)),
    )
    return Array.from({ length: 4 }, (_, w) =>
      padded.slice(w * 7, w * 7 + 7) as HeatLevel[],
    )
  }

  // Fallback: realistic pattern — weekends quieter, slight upward pressure on
  // risk when decay is negative, calmer when positive
  const isDecaying = decayRate < -0.05
  return Array.from({ length: 4 }, (_, week) =>
    Array.from({ length: 7 }, (_, day): HeatLevel => {
      const isWeekend = day >= 5
      if (isWeekend) return "low"
      const v = (week * 2 + day) % 5
      if (isDecaying && v >= 3) return "critical"
      if (v >= 3) return "elevated"
      return "low"
    }),
  )
}

function buildInsights(critical: number, decay: number, teamRisk: string) {
  const items: Array<{ icon: React.ElementType; title: string; body: string }> = []
  if (critical > 0) {
    items.push({
      icon: Users,
      title: "Isolation Warning",
      body: `${critical} member${critical > 1 ? "s" : ""} show critical isolation patterns. Schedule 1:1s within 48 hours.`,
    })
  }
  if (decay < -0.1) {
    items.push({
      icon: MessageSquare,
      title: "Communication Drop",
      body: `Interaction rate declined ${Math.abs(decay * 100).toFixed(0)}% week-over-week. Review async channels and meeting cadence.`,
    })
  }
  items.push({
    icon: Activity,
    title: "Contagion Forecast",
    body:
      teamRisk === "HIGH_CONTAGION_RISK"
        ? "Stress contagion spreading. Immediate intervention recommended."
        : teamRisk === "ELEVATED"
          ? "Early-stage contagion detected. Monitor closely over next 7 days."
          : "Team risk remains stable. Continue current wellbeing practices.",
  })
  return items.slice(0, 3)
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function CultureContent() {
  const { data: teamData, isLoading: teamLoading, error: teamError, refetch } = useTeamData()
  const { users, isLoading: usersLoading } = useUsers()
  const { data: forecast, isLoading: forecastLoading } = useForecast()

  // Heatmap data from the energy endpoint (best-effort; falls back to derived mock)
  const [heatmapApiData, setHeatmapApiData] = useState<Array<{ date: string; risk_level?: string }> | null>(null)

  useEffect(() => {
    getTeamEnergyHeatmap(30)
      .then((resp: any) => {
        if (Array.isArray(resp)) setHeatmapApiData(resp)
        else if (resp?.days && Array.isArray(resp.days)) setHeatmapApiData(resp.days)
      })
      .catch(() => {
        // Endpoint not yet deployed — silently fall back to derived mock
      })
  }, [])

  const isLoading = teamLoading || usersLoading || forecastLoading
  const metrics = teamData?.metrics
  const teamRisk = teamData?.team_risk ?? "STABLE"

  const cultureScore = useMemo(() => {
    if (!metrics) return null
    return Math.round(Math.max(0, Math.min(100,
      100 - (metrics.graph_fragmentation ?? 0) * 30 - Math.abs(metrics.comm_decay_rate ?? 0) * 20,
    )))
  }, [metrics])

  const fragPercent = useMemo(
    () => (metrics?.graph_fragmentation != null ? Math.round(metrics.graph_fragmentation * 100) : null),
    [metrics],
  )

  // Fix 1: clamp comm decay to [-100, 100]
  const rawDecay = metrics?.comm_decay_rate ?? 0
  const decayPercent = useMemo(
    () => (metrics?.comm_decay_rate != null ? clampDecayPercent(metrics.comm_decay_rate) : null),
    [metrics],
  )

  const { data: sirData, simulated: sirSimulated } = useMemo(
    () => buildSIRData(forecast?.forecast?.days, forecast?.forecast?.susceptible, forecast?.forecast?.infected, forecast?.forecast?.recovered),
    [forecast],
  )

  // Fix 4: comm trend bars reflect actual decay direction
  const commTrend = useMemo(() => buildCommTrend(rawDecay), [rawDecay])

  // Fix 3: heatmap data driven by API or realistic fallback; track which path was taken
  const { grid: heatmapData, simulated: heatmapSimulated } = useMemo(() => {
    const grid = buildHeatmapData(heatmapApiData, rawDecay)
    return { grid, simulated: heatmapApiData === null || heatmapApiData.length === 0 }
  }, [heatmapApiData, rawDecay])

  // Comm trend bars are always marked simulated: direction/slope comes from real
  // comm_decay_rate but per-day interaction counts have no API source yet.

  const sortedUsers = useMemo(() => [...users].sort(sortByRisk), [users])
  const tableRows = sortedUsers.slice(0, 5)
  const extraCount = Math.max(0, sortedUsers.length - 5)

  const insights = useMemo(
    () => buildInsights(metrics?.critical_members ?? 0, metrics?.comm_decay_rate ?? 0, teamRisk),
    [metrics, teamRisk],
  )

  const teamRiskLevel: RiskLevel =
    teamRisk === "HIGH_CONTAGION_RISK" ? "CRITICAL" : teamRisk === "ELEVATED" ? "ELEVATED" : "LOW"

  const scoreColor =
    cultureScore == null ? "text-muted-foreground"
    : cultureScore >= 70 ? "text-emerald-400"
    : cultureScore >= 45 ? "text-amber-400"
    : "text-red-400"

  return (
    <ScrollArea className="flex-1">
      <main className="flex flex-col gap-6 p-4 lg:p-6 max-w-[1400px] mx-auto">

        {/* Row 1: Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Thermometer className="h-6 w-6 text-emerald-400 shrink-0" />
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Culture Thermometer</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Team dynamics, communication patterns, and contagion risk
              </p>
            </div>
          </div>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-border rounded-md text-muted-foreground hover:text-foreground hover:border-border hover:bg-muted/50 transition-colors duration-150 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="h-7 w-7 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          </div>
        )}

        {!isLoading && teamError && (
          <div className="bg-card border border-border rounded-lg p-5 text-sm text-muted-foreground">
            Failed to load culture data. Check backend connection.
          </div>
        )}

        {!isLoading && !teamError && (
          <>
            {/* Row 2: KPI cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <StatCard
                label="Culture Score"
                value={cultureScore ?? "--"}
                description="Derived from fragmentation and comm velocity"
                valueClassName={scoreColor}
              />

              <div className="bg-card border border-border rounded-lg p-5">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Contagion Risk</p>
                <div className="mt-2"><RiskBadge level={teamRiskLevel} /></div>
                <p className="text-xs text-muted-foreground mt-2">
                  {teamRisk === "HIGH_CONTAGION_RISK" ? "Immediate intervention needed"
                    : teamRisk === "ELEVATED" ? "Monitor closely"
                    : "Team is stable"}
                </p>
              </div>

              <StatCard
                label="Fragmentation"
                value={fragPercent != null ? `${fragPercent}%` : "--"}
                description="Graph connectivity loss"
                valueClassName={fragPercent != null && fragPercent > 40 ? "text-amber-400" : "text-foreground"}
              />

              <div className="bg-card border border-border rounded-lg p-5">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Comm Decay</p>
                <div className="flex items-center gap-2 mt-2">
                  {/* Fix 1: display clamped value */}
                  <span className={cn("text-2xl font-semibold tabular-nums", decayPercent != null && decayPercent < 0 ? "text-red-400" : "text-foreground")}>
                    {decayPercent != null ? `${decayPercent > 0 ? "+" : ""}${decayPercent}%` : "--"}
                  </span>
                  {decayPercent != null && (decayPercent < 0
                    ? <TrendingDown className="h-4 w-4 text-red-400" />
                    : <TrendingUp className="h-4 w-4 text-emerald-400" />)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Week-over-week change</p>
              </div>

              <div className="bg-card border border-border rounded-lg p-5">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Flight Risk (30d)</p>
                <div className="flex items-baseline gap-1.5 mt-2">
                  <span className={cn("text-2xl font-semibold tabular-nums",
                    (teamData?.attrition_forecast?.high_risk_30d ?? 0) > 0 ? "text-red-400" : "text-foreground"
                  )}>
                    {teamData?.attrition_forecast?.high_risk_30d ?? 0}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    / {teamData?.attrition_forecast?.total_members ?? users.length}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Members with &gt;60% attrition probability
                </p>
              </div>
            </div>

            {/* Recommendation card -- always visible */}
            <div className="bg-card border border-border rounded-lg p-4 flex items-start gap-3">
              {teamRiskLevel === "CRITICAL" ? (
                <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
              ) : teamRiskLevel === "ELEVATED" ? (
                <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
              ) : (
                <Activity className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
              )}
              <div className="flex-1">
                <p className="text-sm text-foreground">
                  {teamData?.recommendation || "Team dynamics healthy. Continue current wellbeing practices."}
                </p>
                {teamRiskLevel !== "LOW" && (
                  <a href="/ask-sentinel?q=What%20actions%20should%20I%20take%20for%20team%20culture%20risk" className="inline-block mt-2 text-xs text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer">
                    Ask Copilot for action plan
                  </a>
                )}
              </div>
            </div>

            {/* Row 3: Contagion Forecast + Team Connectivity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <SectionCard
                title="Contagion Forecast"
                subtitle="SIR model — Susceptible, Infected, Recovered"
                action={sirSimulated ? (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                    Simulated
                  </span>
                ) : undefined}
              >
                <div className="mt-2 h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={sirData} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
                      <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} interval={4} />
                      <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                      <Tooltip {...TOOLTIP_STYLE} />
                      <Area type="monotone" dataKey="susceptible" stackId="s" stroke="#10b981" fill="rgba(16,185,129,0.15)" name="Susceptible" strokeWidth={1.5} />
                      <Area type="monotone" dataKey="infected" stackId="s" stroke="#f59e0b" fill="rgba(245,158,11,0.15)" name="Infected" strokeWidth={1.5} />
                      <Area type="monotone" dataKey="recovered" stackId="s" stroke="#3b82f6" fill="rgba(59,130,246,0.15)" name="Recovered" strokeWidth={1.5} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center gap-4 mt-3">
                  {[["#10b981", "Susceptible"], ["#f59e0b", "Infected"], ["#3b82f6", "Recovered"]].map(([color, label]) => (
                    <span key={label} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
                      {label}
                    </span>
                  ))}
                </div>
              </SectionCard>

              <SectionCard title="Team Connectivity" subtitle="Member risk distribution">
                <div className="mt-2 grid grid-cols-3 gap-3 mb-4">
                  {[
                    { val: users.length, label: "Members", cls: "text-foreground" },
                    { val: metrics?.critical_members ?? 0, label: "Critical", cls: "text-red-400" },
                    { val: fragPercent != null ? `${100 - fragPercent}%` : "--", label: "Connected", cls: "text-foreground" },
                  ].map(({ val, label, cls }) => (
                    <div key={label} className="bg-muted rounded-md p-3 text-center">
                      <p className={cn("text-xl font-semibold tabular-nums", cls)}>{val}</p>
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>
                {teamData?.attrition_forecast && teamData.attrition_forecast.avg_probability > 0 && (
                  <div className="mb-4">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Team Attrition Risk</p>
                    <div className="flex items-baseline gap-2">
                      <span className={cn("text-xl font-semibold tabular-nums",
                        teamData.attrition_forecast.avg_probability >= 0.4 ? "text-red-400"
                        : teamData.attrition_forecast.avg_probability >= 0.2 ? "text-amber-400"
                        : "text-foreground"
                      )}>
                        {(teamData.attrition_forecast.avg_probability * 100).toFixed(0)}%
                      </span>
                      <span className="text-xs text-muted-foreground">avg attrition probability</span>
                    </div>
                  </div>
                )}
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Member Risk Map</p>
                <div className="flex flex-wrap gap-2">
                  {users.slice(0, 20).map((u) => (
                    <div key={u.user_hash} className={cn("h-3 w-3 rounded-full", riskDot(u.risk_level))} title={`${u.name ?? u.user_hash} — ${u.risk_level ?? "LOW"}`} />
                  ))}
                  {users.length === 0 && <p className="text-xs text-muted-foreground">No user data available</p>}
                </div>
                {sortedUsers.filter((u) => u.social_withdrawal || u.risk_level === "ELEVATED").length > 0 && (
                  <div className="mt-4">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">At-Risk Members</p>
                    <div className="space-y-1.5">
                      {sortedUsers.filter((u) => u.social_withdrawal || u.risk_level === "ELEVATED").slice(0, 5).map((u) => (
                        <div key={u.user_hash} className="flex items-center gap-2">
                          <span className={cn("h-2 w-2 rounded-full shrink-0", riskDot(u.risk_level))} />
                          <span className="text-xs text-foreground truncate">{u.name ?? u.user_hash}</span>
                          <span className="ml-auto text-[11px] text-muted-foreground">{u.risk_level ?? "LOW"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </SectionCard>
            </div>

            {/* Row 4: Communication Trend + Work Pattern Heatmap */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/*
                Communication Trend: bar heights are derived from real comm_decay_rate
                (direction and slope are real) but per-day interaction counts are
                synthetic — no per-day API endpoint exists yet.
              */}
              <SectionCard
                title="Communication Trend"
                subtitle="14-day projection based on communication patterns"
                action={
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
                    Projected
                  </span>
                }
              >
                <div className="mt-2 h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={commTrend} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
                      <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                      <Tooltip {...TOOLTIP_STYLE} itemStyle={{ color: "#10b981" }} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                      <Bar dataKey="interactions" fill="#10b981" radius={[2, 2, 0, 0]} name="Interactions" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </SectionCard>

              {/*
                Work Pattern Heatmap: uses real API data from getTeamEnergyHeatmap when
                available; falls back to a weekday-weighted pattern derived from
                comm_decay_rate when the endpoint is not yet deployed.
              */}
              <SectionCard
                title="Work Pattern Heatmap"
                subtitle="Activity intensity by day and week"
                action={heatmapSimulated ? (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                    Simulated
                  </span>
                ) : undefined}
              >
                <div className="mt-3">
                  <div className="grid grid-cols-7 gap-1 mb-1">
                    {HEATMAP_LABELS.map((d, i) => (
                      <div key={i} className="text-[11px] uppercase tracking-wider text-muted-foreground text-center">{d}</div>
                    ))}
                  </div>
                  <div className="space-y-1">
                    {heatmapData.map((week, wi) => (
                      <div key={wi} className="grid grid-cols-7 gap-1">
                        {week.map((level, di) => (
                          <div key={di} className={cn("h-7 rounded-sm", HEAT_STYLES[level])} />
                        ))}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-4 mt-3">
                    {(["low", "elevated", "critical"] as HeatLevel[]).map((level) => (
                      <span key={level} className="flex items-center gap-1.5 text-[11px] text-muted-foreground capitalize">
                        <span className={cn("h-2.5 w-2.5 rounded-sm", HEAT_STYLES[level])} />
                        {level}
                      </span>
                    ))}
                  </div>
                </div>
              </SectionCard>
            </div>

            {/* Row 5: Team Health Table */}
            <SectionCard title="Team Health" subtitle={`${sortedUsers.length} members — sorted by risk`}>
              {sortedUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No member data available.</p>
              ) : (
                <>
                  <div className="grid grid-cols-5 gap-2 pb-2 border-b border-border/50 mt-1">
                    {["Member", "Risk", "Belongingness", "Velocity", "Confidence"].map((h) => (
                      <span key={h} className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{h}</span>
                    ))}
                  </div>
                  <div className="divide-y divide-border/50">
                    {tableRows.map((u) => (
                      <div key={u.user_hash} className="grid grid-cols-5 gap-2 py-2.5 hover:bg-muted/50 transition-colors duration-100 cursor-pointer">
                        <span className="text-sm text-foreground truncate">{u.name ?? u.user_hash.slice(0, 12)}</span>
                        <span><RiskBadge level={toRiskLevel(u.risk_level)} /></span>
                        {/* Belongingness: use real belongingness_score from API */}
                        <span className="text-sm tabular-nums text-foreground">
                          {u.belongingness_score != null && u.belongingness_score > 0
                            ? `${(u.belongingness_score * 100).toFixed(0)}%`
                            : "--"}
                        </span>
                        {/* Velocity: real value from API */}
                        <span className="text-sm tabular-nums text-foreground">{u.velocity != null ? u.velocity.toFixed(1) : "--"}</span>
                        {/* Confidence: real value from API */}
                        <span className="text-sm tabular-nums text-foreground">
                          {u.confidence != null ? `${(u.confidence * 100).toFixed(0)}%` : "--"}
                        </span>
                      </div>
                    ))}
                  </div>
                  {/* Fix 6: cursor-pointer on "+N more" link */}
                  {extraCount > 0 && (
                    <p className="text-xs text-muted-foreground pt-3 cursor-pointer hover:text-foreground transition-colors duration-150">
                      +{extraCount} more members
                    </p>
                  )}
                </>
              )}
            </SectionCard>

            {/* Row 6: AI Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {insights.map((insight, i) => {
                const Icon = insight.icon
                return (
                  <div key={i} className="bg-card border border-border rounded-lg p-5 bg-primary/5 hover:bg-muted/30 transition-colors duration-150">
                    <div className="flex items-center gap-2 mb-3">
                      <Icon className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span className="text-sm font-medium text-foreground">{insight.title}</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{insight.body}</p>
                    {/* Fix 6: cursor-pointer on Ask Copilot links */}
                    <a href="/ask-sentinel" className="inline-block mt-3 text-xs text-emerald-400 hover:text-emerald-300 transition-colors duration-150 cursor-pointer">
                      Ask Copilot
                    </a>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </main>
    </ScrollArea>
  )
}

export default function CultureEnginePage() {
  return (
    <ProtectedRoute allowedRoles={["manager", "admin"]}>
      <CultureContent />
    </ProtectedRoute>
  )
}
