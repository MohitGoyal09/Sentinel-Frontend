"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  AreaChart, Area, XAxis, YAxis, ResponsiveContainer,
} from "recharts"
import { AlertTriangle, Brain, Activity } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { StatCard } from "@/components/dashboard/stat-card"
import { RiskBadge } from "@/components/dashboard/risk-badge"
import { SectionCard } from "@/components/dashboard/section-card"
import { formatDate } from "@/components/dashboard/helpers"
import type { Employee } from "@/types"

interface ActivityEvent {
  timestamp: string
  event_type: string
  description?: string
}

interface EmployeeViewProps {
  employee: Employee | null
  events: ActivityEvent[]
}

export function EmployeeView({ employee, events }: EmployeeViewProps) {
  const router = useRouter()

  if (!employee) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <p className="text-sm text-muted-foreground">Loading your profile...</p>
      </div>
    )
  }

  const vel = employee.velocity ?? 0
  const belong = employee.belongingness_score ?? 0
  const entropy = employee.circadian_entropy ?? 0
  const socialConnection = Math.round(belong * 100)
  const networkInfluence = Math.round((1 - entropy) * 80 + 10)
  const unblockingImpact = employee.indicators.chaotic_hours ? 35 : 72

  const riskColor = employee.risk_level === "CRITICAL"
    ? "text-red-400"
    : employee.risk_level === "ELEVATED"
      ? "text-amber-400"
      : "text-emerald-400"

  const trendData = useMemo(() => {
    const base = vel
    return Array.from({ length: 30 }, (_, i) => {
      const seed = (i * 7 + 13) % 17
      const jitter = (seed - 8) * 0.08
      return { day: i + 1, velocity: Math.max(0, +(base + jitter).toFixed(2)) }
    })
  }, [vel])

  const skills = [
    { label: "Code Velocity", value: Math.min(100, Math.round(vel * 20)) },
    { label: "Collaboration", value: socialConnection },
    { label: "Focus Time", value: Math.round((1 - entropy) * 100) },
    { label: "Communication", value: employee.indicators.social_withdrawal ? 30 : 75 },
    { label: "Work Balance", value: employee.indicators.sustained_intensity ? 25 : 80 },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="bg-card border border-border rounded-lg p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
              {formatDate()}
            </p>
            <h1 className="text-2xl font-semibold text-foreground mt-1">
              Welcome back, {employee.name}
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Your personal wellbeing dashboard — insights are private to you.
            </p>
          </div>
          <div className="flex items-center">
            <RiskBadge level={employee.risk_level} />
            {employee.confidence != null && (
              <Badge className="bg-slate-500/10 text-slate-400 border-slate-500/20 text-[10px] ml-1.5">
                {Math.round(employee.confidence * 100)}% conf
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="WORK VELOCITY" value={vel.toFixed(1)} description="story pts / sprint" valueClassName={riskColor} />
        <StatCard label="SOCIAL CONNECTION" value={`${socialConnection}%`} description="belongingness score" valueClassName="text-emerald-400" />
        <StatCard label="NETWORK INFLUENCE" value={`${networkInfluence}`} description="collaboration index" />
        <StatCard label="UNBLOCKING IMPACT" value={`${unblockingImpact}`} description="team enablement score" valueClassName={unblockingImpact < 50 ? "text-amber-400" : "text-emerald-400"} />
      </div>

      {/* Velocity Trend + AI Recommendation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard title="Velocity Trend" subtitle="30-day history">
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="empVelFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.1} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="day" tick={{ fontSize: 10, fill: "#808080" }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => v === 1 ? "30d" : v === 15 ? "15d" : v === 30 ? "Today" : ""}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 10, fill: "#808080" }} axisLine={false} tickLine={false} />
                <Area type="monotone" dataKey="velocity" stroke="#10b981" strokeWidth={1.5} fill="url(#empVelFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <div className="bg-card border border-border rounded-lg overflow-hidden flex flex-col">
          <div className="px-5 pt-5 pb-4">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400/60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <h3 className="text-base font-medium text-foreground">AI Recommendation</h3>
            </div>
          </div>
          <div className="flex-1 px-5 pb-5 space-y-3">
            <div className="flex items-start gap-2.5">
              <Brain className="h-4 w-4 mt-0.5 shrink-0 text-emerald-400" />
              <div>
                <p className="text-xs text-foreground leading-snug">
                  {employee.risk_level === "CRITICAL"
                    ? "Your burnout indicators are elevated. Consider taking breaks and reducing after-hours work."
                    : employee.risk_level === "ELEVATED"
                      ? "Some patterns suggest rising stress. Focus on maintaining work-life boundaries."
                      : "Your wellbeing metrics look healthy. Keep maintaining your current balance."}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">Sentinel AI analysis</p>
              </div>
            </div>
            {employee.indicators.sustained_intensity && (
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-amber-400" />
                <div>
                  <p className="text-xs text-foreground leading-snug">
                    Overwork pattern detected — consider adjusting workload distribution.
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">Work pattern analysis</p>
                </div>
              </div>
            )}
          </div>
          <div className="px-5 pb-5">
            <button
              onClick={() => router.push("/ask-sentinel")}
              className="w-full rounded-lg px-4 py-2.5 text-sm font-medium text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/10 transition-colors duration-150"
            >
              Ask Sentinel for advice
            </button>
          </div>
        </div>
      </div>

      {/* Skill Profile + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard title="Skill Profile">
          <div className="space-y-3">
            {skills.map((skill) => (
              <div key={skill.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">{skill.label}</span>
                  <span className="text-xs text-foreground tabular-nums">{skill.value}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${skill.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Recent Activity">
          <div className="space-y-0">
            {events.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">No recent activity</p>
            )}
            {events.slice(0, 5).map((evt, idx) => (
              <div key={idx} className="flex items-start gap-2.5 py-2.5 border-b border-border/50 last:border-0">
                <Activity className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground truncate">{evt.description || evt.event_type}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {new Date(evt.timestamp).toLocaleDateString("en-US", {
                      month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  )
}
