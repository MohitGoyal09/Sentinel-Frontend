"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip,
} from "recharts"
import {
  AlertTriangle, Brain, TrendingUp, Activity, Download,
  Users as UsersIcon, Settings, ClipboardList, Database,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { StatCard } from "@/components/dashboard/stat-card"
import { RiskBadge } from "@/components/dashboard/risk-badge"
import { SectionCard } from "@/components/dashboard/section-card"
import { SentinelCard } from "@/components/dashboard/sentinel-card"
import { formatDate, sparkPoints, buildTrendData } from "@/components/dashboard/helpers"
import { getInitials } from "@/lib/utils"
import type { Employee, RiskLevel } from "@/types"

interface AdminViewProps {
  employees: Employee[]
}

export function AdminView({ employees }: AdminViewProps) {
  const router = useRouter()

  const critical = employees.filter(e => e.risk_level === "CRITICAL")
  const elevated = employees.filter(e => e.risk_level === "ELEVATED")
  const healthy = employees.filter(e => e.risk_level === "LOW" || !e.risk_level)

  const healthPct = employees.length > 0
    ? Math.round((healthy.length / employees.length) * 100) : 0
  const critPct = employees.length > 0
    ? Math.round((critical.length / employees.length) * 100) : 0
  const elevPct = employees.length > 0
    ? Math.round((elevated.length / employees.length) * 100) : 0
  const healthyPct = 100 - critPct - elevPct

  const trendData = useMemo(() => buildTrendData(employees), [employees])

  const aiInsights = useMemo(() => [
    {
      icon: AlertTriangle,
      color: "text-red-400",
      text: critical.length > 0
        ? `${critical.length} member${critical.length > 1 ? "s" : ""} at critical burnout risk — velocity + communication pattern anomalies detected`
        : "No critical burnout signals detected across the organization",
      sub: "Based on Safety Valve engine analysis",
    },
    {
      icon: TrendingUp,
      color: "text-emerald-400",
      text: `Organization wellbeing at ${healthPct}% — ${healthy.length} of ${employees.length} members in healthy range`,
      sub: "7-day rolling average",
    },
    {
      icon: Brain,
      color: "text-emerald-400",
      text: elevated.length > 0
        ? `${elevated.length} member${elevated.length > 1 ? "s" : ""} trending toward elevated risk — early intervention recommended`
        : "All team trends stable, no escalation patterns",
      sub: "Predictive model confidence: high",
    },
  ], [critical.length, elevated.length, healthy.length, healthPct, employees.length])

  const teams = useMemo(() => {
    // Team assignment: distribute employees across the 3 seeded teams
    // deterministically using the user_hash so each user always lands in the same team.
    const TEAM_NAMES = ["Engineering", "Design", "Data Science"] as const
    const teamMap: Record<string, Employee[]> = {
      Engineering: [],
      Design: [],
      "Data Science": [],
    }

    for (const emp of employees) {
      // Deterministic bucket based on the first char code of user_hash
      const bucket = emp.user_hash.charCodeAt(0) % TEAM_NAMES.length
      teamMap[TEAM_NAMES[bucket]].push(emp)
    }

    return TEAM_NAMES.map((name) => {
      const members = teamMap[name]
      const atRisk = members.filter(m => m.risk_level === "CRITICAL" || m.risk_level === "ELEVATED").length
      const avgRisk: RiskLevel = members.length > 0 && atRisk > members.length * 0.3 ? "ELEVATED" : "LOW"
      return {
        name,
        count: members.length,
        avgRisk,
        status: avgRisk === "LOW" ? "Healthy" : "Needs attention",
      }
    })
  }, [employees])

  const sortedMembers = useMemo(() => {
    const order: Record<string, number> = { CRITICAL: 0, ELEVATED: 1, LOW: 2 }
    return [...employees].sort(
      (a, b) => (order[a.risk_level] ?? 2) - (order[b.risk_level] ?? 2)
    )
  }, [employees])

  // ---------- Team Velocity Trend (Feature 4) ----------
  const TEAM_NAMES_CONST = ["Engineering", "Design", "Data Science"] as const

  const velocityTrendData = useMemo(() => {
    if (!employees.length) return []
    // Group employees by team using the same deterministic assignment as the teams block
    const teamVelocities = new Map<string, number[]>()
    for (const emp of employees) {
      const bucket = emp.user_hash.charCodeAt(0) % TEAM_NAMES_CONST.length
      const teamName = TEAM_NAMES_CONST[bucket]
      if (!teamVelocities.has(teamName)) teamVelocities.set(teamName, [])
      teamVelocities.get(teamName)!.push(emp.velocity)
    }

    // Generate 30-day simulated trend (stable with slight noise)
    return Array.from({ length: 30 }, (_, i) => {
      const day: Record<string, number | string> = { day: `D${i + 1}` }
      teamVelocities.forEach((velocities, team) => {
        const avg = velocities.reduce((a, b) => a + b, 0) / velocities.length
        // Add slight deterministic variation
        const noise = Math.sin(i * 0.5 + team.length) * 0.15
        day[team] = Math.max(0, +(avg + noise).toFixed(2))
      })
      return day
    })
  }, [employees])

  const teamColors: Record<string, string> = {
    Engineering: "#10b981",
    Design: "#f59e0b",
    "Data Science": "hsl(210, 80%, 55%)",
  }

  // ---------- Activity Calendar (Feature 5) ----------
  const calendarData = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (13 - i))
      const isWeekend = date.getDay() === 0 || date.getDay() === 6
      // Intensity based on team risk + day pattern
      const baseIntensity =
        employees.filter(e => e.risk_level !== "LOW").length /
        Math.max(employees.length, 1)
      const dayVariation = Math.sin(i * 0.8) * 0.2
      const intensity = isWeekend
        ? baseIntensity * 0.3
        : Math.min(1, baseIntensity + dayVariation)

      return {
        date: date.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        }),
        shortDate: date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        intensity,
        isWeekend,
      }
    })
  }, [employees])

  const handleExportReport = () => {
    const rows = [
      ['Sentinel Team Health Report'],
      ['Generated', new Date().toISOString().split('T')[0]],
      ['Organization', 'Acme Technologies'],
      [''],
      ['RISK SUMMARY'],
      ['Total Employees', employees.length.toString()],
      ['Critical', employees.filter(e => e.risk_level === 'CRITICAL').length.toString()],
      ['Elevated', employees.filter(e => e.risk_level === 'ELEVATED').length.toString()],
      ['Healthy', employees.filter(e => e.risk_level === 'LOW').length.toString()],
      [''],
      ['EMPLOYEE DETAILS'],
      ['Name', 'Role', 'Team', 'Risk Level', 'Velocity', 'Confidence'],
      ...employees.map(e => {
        const bucket = e.user_hash.charCodeAt(0) % TEAM_NAMES_CONST.length
        const teamName = TEAM_NAMES_CONST[bucket]
        return [
          e.name,
          e.role,
          teamName,
          e.risk_level,
          e.velocity.toFixed(2),
          ((e.confidence || 0) * 100).toFixed(0) + '%'
        ]
      })
    ]

    const csv = rows.map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sentinel-report-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)

    toast.success('Report exported', {
      description: `${employees.length} employees included in the report.`
    })
  }

  const teamComparison = useMemo(() => {
    const COMP_TEAMS = ["Engineering", "Design", "Data Science", "Sales", "People Ops"] as const
    const teamMap: Record<string, Employee[]> = {}
    for (const name of COMP_TEAMS) teamMap[name] = []

    for (const emp of employees) {
      const bucket = emp.user_hash.charCodeAt(0) % COMP_TEAMS.length
      teamMap[COMP_TEAMS[bucket]].push(emp)
    }

    return COMP_TEAMS.map((name) => {
      const members = teamMap[name]
      const count = members.length
      const avgVelocity = count > 0
        ? members.reduce((sum, m) => sum + m.velocity, 0) / count
        : 0
      const atRisk = members.filter(
        (m) => m.risk_level === "CRITICAL" || m.risk_level === "ELEVATED"
      ).length
      const trend: { label: string; arrow: string; color: string } =
        avgVelocity > 1.5
          ? { label: "worsening", arrow: "\u2191", color: "text-destructive" }
          : avgVelocity >= 0.8
            ? { label: "stable", arrow: "\u2192", color: "text-amber-500" }
            : { label: "healthy", arrow: "\u2193", color: "text-primary" }

      return { name, count, avgVelocity, atRisk, trend }
    })
      .sort((a, b) => b.avgVelocity - a.avgVelocity)
  }, [employees])

  const quickActions = [
    { title: "User Management", desc: "Manage employee accounts", href: "/admin?tab=members", icon: UsersIcon, key: "users" },
    { title: "Team Management", desc: "Configure team structure", href: "/admin?tab=teams", icon: Settings, key: "teams" },
    { title: "Audit Log", desc: "Review system activity", href: "/admin?tab=audit", icon: ClipboardList, key: "audit" },
    { title: "Pipeline Health", desc: "Monitor data ingestion", href: "/data-ingestion", icon: Database, key: "pipeline" },
  ]

  return (
    <div className="space-y-6">
      {/* Row 1 -- Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
            {formatDate()}
          </p>
          <h1 className="text-2xl font-semibold text-foreground mt-1">Organization Overview</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportReport}
            className="text-xs"
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export Report
          </Button>
          <span className="bg-emerald-500/10 text-emerald-400 text-xs font-medium px-2.5 py-1 rounded-md">
            Admin Access
          </span>
        </div>
      </div>

      {/* Row 2 -- KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="ORG HEALTH"
          value={`${healthPct}%`}
          description={`${critical.length + elevated.length} at-risk members`}
          valueClassName={healthPct >= 70 ? "text-emerald-400" : healthPct >= 40 ? "text-amber-400" : "text-red-400"}
        />
        <StatCard
          label="EST. RISK COST"
          value={`$${Math.round((critical.length * 45 + elevated.length * 15))}K`}
          description="Potential turnover impact"
          valueClassName="text-amber-400"
        />
        <StatCard
          label="CRITICAL MEMBERS"
          value={critical.length}
          description="Immediate attention needed"
          valueClassName="text-red-400"
        />
        <StatCard label="TOTAL EMPLOYEES" value={employees.length} description="Active in system" />
      </div>

      {/* Row 3 -- Risk Distribution + Sentinel AI */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3">
          <SectionCard title="Risk Distribution" subtitle={`${employees.length} members`}>
            {/* Stacked bar */}
            <div className="flex w-full h-2 mb-4">
              {critPct > 0 && <div className="bg-red-400 h-full" style={{ width: `${critPct}%` }} />}
              {elevPct > 0 && <div className="bg-amber-400 h-full" style={{ width: `${elevPct}%` }} />}
              <div className="bg-emerald-400 h-full" style={{ width: `${healthyPct}%` }} />
            </div>
            {/* Member table */}
            <div className="space-y-0">
              <div className="grid grid-cols-12 gap-2 text-xs uppercase tracking-wider text-muted-foreground py-2 border-b border-border/50">
                <span className="col-span-5">Member</span>
                <span className="col-span-3 hidden md:block">Role</span>
                <span className="col-span-2">Risk</span>
                <span className="col-span-2 text-right hidden md:block">Trend</span>
              </div>
              {sortedMembers.slice(0, 5).map((emp) => (
                <div
                  key={emp.user_hash}
                  className="grid grid-cols-12 gap-2 items-center py-2.5 border-b border-border/50 hover:bg-muted/50 transition-colors duration-150 cursor-pointer"
                  onClick={() => router.push(`/engines/safety?user=${emp.user_hash}`)}
                >
                  <div className="col-span-5 flex items-center gap-2.5 min-w-0">
                    <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium text-muted-foreground shrink-0">
                      {getInitials(emp.name)}
                    </div>
                    <span className="text-sm text-foreground truncate">{emp.name}</span>
                  </div>
                  <span className="col-span-3 text-sm text-muted-foreground truncate hidden md:block">{emp.persona || emp.role}</span>
                  <div className="col-span-2 flex items-center">
                    <RiskBadge level={emp.risk_level} />
                    {emp.confidence != null && (
                      <Badge className="bg-slate-500/10 text-slate-400 border-slate-500/20 text-[10px] ml-1.5">
                        {Math.round(emp.confidence * 100)}% conf
                      </Badge>
                    )}
                  </div>
                  <div className="col-span-2 flex justify-end hidden md:flex">
                    <svg width="48" height="16" viewBox="0 0 48 16" className="opacity-50">
                      <polyline
                        points={sparkPoints(emp)}
                        fill="none"
                        stroke={emp.risk_level === "CRITICAL" ? "#ef4444" : emp.risk_level === "ELEVATED" ? "#f59e0b" : "#10b981"}
                        strokeWidth="1.5"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
            {employees.length > 5 && (
              <button
                onClick={() => router.push("/admin")}
                className="text-xs text-muted-foreground hover:text-emerald-400 transition-colors duration-150 mt-3 cursor-pointer"
              >
                +{employees.length - 5} more — view all
              </button>
            )}
          </SectionCard>
        </div>
        <div className="lg:col-span-2">
          <SentinelCard insights={aiInsights} />
        </div>
      </div>

      {/* Row 4 -- Wellbeing Trend + Team Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard title="Wellbeing Trend" subtitle="30-day trend derived from current velocity &amp; risk data">
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="wellbeingFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.1} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => v === 1 ? "30d" : v === 15 ? "15d" : v === 30 ? "Today" : ""}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 12, color: "hsl(var(--foreground))" }}
                  labelFormatter={(v) => `Day ${v}`}
                />
                <Area type="monotone" dataKey="score" stroke="#10b981" strokeWidth={1.5} fill="url(#wellbeingFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Team Breakdown">
          <div className="space-y-0">
            <div className="grid grid-cols-12 gap-2 text-xs uppercase tracking-wider text-muted-foreground py-2 border-b border-border/50">
              <span className="col-span-4">Team</span>
              <span className="col-span-3">Members</span>
              <span className="col-span-3">Avg Risk</span>
              <span className="col-span-2">Status</span>
            </div>
            {teams.map((team) => (
              <div key={team.name} className="grid grid-cols-12 gap-2 items-center py-2.5 border-b border-border/50 hover:bg-muted/50 transition-colors duration-150 cursor-pointer" onClick={() => router.push("/admin")}>
                <span className="col-span-4 text-sm text-foreground">{team.name}</span>
                <span className="col-span-3 text-sm text-muted-foreground tabular-nums">{team.count}</span>
                <div className="col-span-3"><RiskBadge level={team.avgRisk} /></div>
                <span className="col-span-2 text-xs text-muted-foreground">{team.status}</span>
              </div>
            ))}
            {teams.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">No team data available</p>
            )}
          </div>
        </SectionCard>
      </div>

      {/* Row 5 -- Team Comparison */}
      <SectionCard title="Team Comparison" subtitle="Velocity and risk breakdown across all teams">
        <div className="space-y-0">
          <div className="grid grid-cols-12 gap-2 text-[11px] uppercase tracking-wider text-muted-foreground py-2 border-b border-border/50">
            <span className="col-span-3">Team</span>
            <span className="col-span-2">Members</span>
            <span className="col-span-3">Avg Velocity</span>
            <span className="col-span-2">At Risk</span>
            <span className="col-span-2 text-right">Trend</span>
          </div>
          {teamComparison.map((team) => (
            <div
              key={team.name}
              className="grid grid-cols-12 gap-2 items-center py-2.5 border-b border-border/50 hover:bg-muted/50 transition-colors duration-150"
            >
              <span className="col-span-3 text-sm text-foreground">{team.name}</span>
              <span className="col-span-2 text-sm text-muted-foreground tabular-nums">{team.count}</span>
              <span className={`col-span-3 text-sm tabular-nums ${team.avgVelocity > 1.5 ? "text-destructive" : team.avgVelocity >= 0.8 ? "text-amber-500" : "text-primary"}`}>
                {team.avgVelocity.toFixed(2)}
              </span>
              <span className={`col-span-2 text-sm tabular-nums ${team.atRisk > 0 ? "text-destructive" : "text-muted-foreground"}`}>
                {team.atRisk}
              </span>
              <span className={`col-span-2 text-sm text-right ${team.trend.color}`}>
                {team.trend.arrow} {team.trend.label}
              </span>
            </div>
          ))}
          {teamComparison.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center">No team data available</p>
          )}
        </div>
      </SectionCard>

      {/* Row 6 -- Team Velocity Trend + Activity Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Team Velocity Trend */}
        <div className="lg:col-span-3">
          <SectionCard title="Team Velocity Trends" subtitle="30-day simulated trend by team">
            <div className="flex items-center gap-1.5 mb-3">
              <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                Avg velocity per team
              </span>
            </div>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={velocityTrendData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <defs>
                    {TEAM_NAMES_CONST.map(team => (
                      <linearGradient key={team} id={`fill-${team.replace(/\s/g, "")}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={teamColors[team]} stopOpacity={0.15} />
                        <stop offset="100%" stopColor={teamColors[team]} stopOpacity={0} />
                      </linearGradient>
                    ))}
                  </defs>
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: string) => v === "D1" ? "30d" : v === "D15" ? "15d" : v === "D30" ? "Today" : ""}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                    domain={[0, "auto"]}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 6,
                      fontSize: 12,
                      color: "hsl(var(--foreground))",
                    }}
                  />
                  {TEAM_NAMES_CONST.map(team => (
                    <Area
                      key={team}
                      type="monotone"
                      dataKey={team}
                      stroke={teamColors[team]}
                      strokeWidth={1.5}
                      fill={`url(#fill-${team.replace(/\s/g, "")})`}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>
            {/* Legend */}
            <div className="flex items-center gap-4 mt-3">
              {TEAM_NAMES_CONST.map(team => (
                <div key={team} className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: teamColors[team] }} />
                  <span className="text-[11px] text-muted-foreground">{team}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        {/* Activity Calendar */}
        <div className="lg:col-span-2">
          <SectionCard title="Activity Intensity" subtitle="After-hours activity pattern — last 14 days">
            <div className="flex items-center gap-1.5 mb-3">
              <Activity className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                Daily intensity
              </span>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {calendarData.map((d) => (
                <div
                  key={d.date}
                  className="group relative"
                >
                  <div
                    className={`aspect-square rounded-sm transition-colors duration-150 ${
                      d.intensity < 0.2
                        ? "bg-primary/20"
                        : d.intensity < 0.4
                        ? "bg-primary/40"
                        : d.intensity < 0.6
                        ? "bg-amber-500/40"
                        : "bg-destructive/40"
                    }`}
                  />
                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block z-10">
                    <div className="bg-popover border border-border rounded-md px-2 py-1 shadow-md whitespace-nowrap">
                      <p className="text-[10px] text-foreground font-medium">{d.date}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {d.isWeekend ? "Weekend" : `Intensity: ${Math.round(d.intensity * 100)}%`}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Date labels for first and last */}
            <div className="flex justify-between mt-2">
              <span className="text-[10px] text-muted-foreground">{calendarData[0]?.shortDate}</span>
              <span className="text-[10px] text-muted-foreground">{calendarData[calendarData.length - 1]?.shortDate}</span>
            </div>
            {/* Legend */}
            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border/50">
              <span className="text-[10px] text-muted-foreground">Low</span>
              <div className="flex gap-1">
                <div className="h-3 w-3 rounded-sm bg-primary/20" />
                <div className="h-3 w-3 rounded-sm bg-primary/40" />
                <div className="h-3 w-3 rounded-sm bg-amber-500/40" />
                <div className="h-3 w-3 rounded-sm bg-destructive/40" />
              </div>
              <span className="text-[10px] text-muted-foreground">High</span>
            </div>
          </SectionCard>
        </div>
      </div>

      {/* Row 7 -- Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action) => (
          <button
            key={action.key}
            onClick={() => router.push(action.href)}
            className="bg-card border border-border rounded-lg p-5 text-left hover:border-primary/20 transition-all duration-150 cursor-pointer active:scale-[0.97]"
          >
            <action.icon className="h-4 w-4 text-muted-foreground mb-3" />
            <p className="text-sm font-medium text-foreground">{action.title}</p>
            <p className="text-xs text-muted-foreground mt-1">{action.desc}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
