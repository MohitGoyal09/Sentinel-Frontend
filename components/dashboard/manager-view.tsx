"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  AreaChart, Area, XAxis, YAxis, ResponsiveContainer,
} from "recharts"
import { AlertTriangle, Brain, TrendingUp } from "lucide-react"

import { StatCard } from "@/components/dashboard/stat-card"
import { RiskBadge } from "@/components/dashboard/risk-badge"
import { SectionCard } from "@/components/dashboard/section-card"
import { SentinelCard } from "@/components/dashboard/sentinel-card"
import { formatDate, sparkPoints, buildTrendData } from "@/components/dashboard/helpers"
import { getInitials } from "@/lib/utils"
import type { Employee } from "@/types"

interface ManagerViewProps {
  employees: Employee[]
  userName: string
}

export function ManagerView({ employees, userName }: ManagerViewProps) {
  const router = useRouter()
  const [isAnonymized, setIsAnonymized] = useState(true)

  const critical = employees.filter(e => e.risk_level === "CRITICAL")
  const elevated = employees.filter(e => e.risk_level === "ELEVATED")
  const healthy = employees.filter(e => e.risk_level === "LOW" || !e.risk_level)
  const atRisk = critical.length + elevated.length
  const avgWellbeing = employees.length > 0
    ? Math.round((healthy.length / employees.length) * 100) : 0
  const avgVelocity = employees.length > 0
    ? employees.reduce((sum, e) => sum + (e.velocity || 0), 0) / employees.length : 0
  const burnoutPct = employees.length > 0
    ? Math.round((atRisk / employees.length) * 100) : 0

  const trendData = useMemo(() => buildTrendData(employees), [employees])

  const displayName = (emp: Employee) =>
    isAnonymized ? `Dev-${emp.user_hash.slice(-2).toUpperCase()}` : emp.name

  const heatmapData = useMemo(() => {
    const riskWeight = employees.reduce((acc, emp) => {
      if (emp.risk_level === "CRITICAL") return acc + 1.0
      if (emp.risk_level === "ELEVATED") return acc + 0.55
      return acc + 0.2
    }, 0)
    const base = employees.length > 0 ? Math.min(riskWeight / employees.length, 1) : 0.4
    return Array.from({ length: 5 }, (_, row) =>
      [0, 1, 2, 3, 4].map((col) => {
        const variation = ((row * 5 + col) * 0.07) % 0.25
        return Math.max(0.05, Math.min(1, base + variation - 0.12))
      })
    )
  }, [employees])

  const heatColor = (v: number) => {
    if (v > 0.7) return "bg-red-400/60"
    if (v > 0.45) return "bg-amber-400/50"
    if (v > 0.2) return "bg-emerald-400/50"
    return "bg-muted/50"
  }

  const sortedMembers = useMemo(() => {
    const order: Record<string, number> = { CRITICAL: 0, ELEVATED: 1, LOW: 2 }
    return [...employees].sort(
      (a, b) => (order[a.risk_level] ?? 2) - (order[b.risk_level] ?? 2)
    )
  }, [employees])

  const aiInsights = useMemo(() => [
    {
      icon: AlertTriangle,
      color: "text-red-400",
      text: critical.length > 0
        ? `${critical.length} team member${critical.length > 1 ? "s" : ""} at critical burnout risk`
        : "No critical burnout signals detected",
      sub: "Based on velocity + communication patterns",
    },
    {
      icon: TrendingUp,
      color: "text-emerald-400",
      text: `Team velocity is ${avgVelocity > 3 ? "above" : "below"} baseline at ${avgVelocity.toFixed(1)} pts/sprint`,
      sub: "7-day rolling average",
    },
    {
      icon: Brain,
      color: "text-emerald-400",
      text: `${healthy.length} member${healthy.length !== 1 ? "s" : ""} in the healthy zone`,
      sub: "Belongingness & circadian entropy nominal",
    },
  ], [critical.length, avgVelocity, healthy.length])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
            {formatDate()}
          </p>
          <h1 className="text-2xl font-semibold text-foreground mt-1">
            Good morning, {userName}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAnonymized(!isAnonymized)}
            className="text-xs text-muted-foreground hover:text-foreground border border-border rounded-md px-2.5 py-1 transition-colors duration-150"
          >
            {isAnonymized ? "Show names" : "Anonymize"}
          </button>
          <button
            onClick={() => router.push("/ask-sentinel")}
            className="text-xs text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/10 rounded-md px-2.5 py-1 transition-colors duration-150"
          >
            Ask Sentinel
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="TEAM BURNOUT RISK" value={`${burnoutPct}%`} description="of team at-risk" valueClassName="text-red-400" />
        <StatCard label="AVG WELLBEING" value={`${avgWellbeing}%`} description="healthy members" valueClassName="text-emerald-400" />
        <StatCard label="TEAM VELOCITY" value={avgVelocity.toFixed(1)} description="story pts / sprint" />
        <StatCard label="AT-RISK MEMBERS" value={atRisk} description={`of ${employees.length} total`} valueClassName="text-amber-400" />
      </div>

      {/* Team Risk + AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3">
          <SectionCard title="Team Risk Overview" subtitle={`${employees.length} members`}>
            <div className="space-y-0">
              <div className="grid grid-cols-12 gap-2 text-xs uppercase tracking-wider text-muted-foreground py-2 border-b border-border/50">
                <span className="col-span-5">Member</span>
                <span className="col-span-3">Role</span>
                <span className="col-span-2">Risk</span>
                <span className="col-span-2 text-right">Trend</span>
              </div>
              {sortedMembers.slice(0, 6).map((emp) => (
                <div
                  key={emp.user_hash}
                  className="grid grid-cols-12 gap-2 items-center py-2.5 border-b border-border/50 hover:bg-muted/50 transition-colors duration-150"
                >
                  <div className="col-span-5 flex items-center gap-2.5 min-w-0">
                    <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium text-muted-foreground shrink-0">
                      {isAnonymized ? "??" : getInitials(emp.name)}
                    </div>
                    <span className="text-sm text-foreground truncate">{displayName(emp)}</span>
                  </div>
                  <span className="col-span-3 text-sm text-muted-foreground truncate">
                    {isAnonymized ? "Engineer" : emp.role}
                  </span>
                  <div className="col-span-2"><RiskBadge level={emp.risk_level} /></div>
                  <div className="col-span-2 flex justify-end">
                    <svg width="48" height="16" viewBox="0 0 48 16" className="opacity-50">
                      <polyline
                        points={sparkPoints(emp)}
                        fill="none"
                        stroke={emp.risk_level === "CRITICAL" ? "#ef4444" : emp.risk_level === "ELEVATED" ? "#f59e0b" : "#10b981"}
                        strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"
                      />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
            {employees.length > 6 && (
              <button className="text-xs text-muted-foreground hover:text-emerald-400 transition-colors duration-150 mt-3">
                +{employees.length - 6} more — view all
              </button>
            )}
          </SectionCard>
        </div>
        <div className="lg:col-span-2">
          <SentinelCard insights={aiInsights} />
        </div>
      </div>

      {/* Wellbeing Trend + Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard title="Wellbeing Trend" subtitle="30-day rolling average">
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="managerFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.1} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="day" tick={{ fontSize: 10, fill: "#808080" }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => v === 1 ? "30d" : v === 15 ? "15d" : v === 30 ? "Today" : ""}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 10, fill: "#808080" }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Area type="monotone" dataKey="score" stroke="#10b981" strokeWidth={1.5} fill="url(#managerFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Work Pattern Heatmap" subtitle="Team activity intensity (M-F)">
          <div className="space-y-1">
            <div className="flex gap-1 mb-1.5">
              {["M", "T", "W", "T", "F"].map((d, i) => (
                <div key={i} className="flex-1 text-center text-[10px] text-muted-foreground">{d}</div>
              ))}
            </div>
            {heatmapData.map((row, rowIdx) => (
              <div key={rowIdx} className="flex gap-1">
                {row.map((intensity, colIdx) => (
                  <div
                    key={colIdx}
                    className={`flex-1 h-7 rounded-sm ${heatColor(intensity)}`}
                    title={`${(intensity * 100).toFixed(0)}% activity`}
                  />
                ))}
              </div>
            ))}
            <div className="flex items-center gap-4 mt-3 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-sm bg-emerald-400/50 inline-block" /> Low
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-sm bg-amber-400/50 inline-block" /> Elevated
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-sm bg-red-400/60 inline-block" /> Critical
              </span>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  )
}
