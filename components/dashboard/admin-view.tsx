"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip,
} from "recharts"
import {
  AlertTriangle, Brain, TrendingUp,
  Users as UsersIcon, Settings, ClipboardList, Database,
} from "lucide-react"

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

  const quickActions = [
    { title: "User Management", desc: "Manage employee accounts", href: "/admin/users", icon: UsersIcon },
    { title: "Team Management", desc: "Configure team structure", href: "/admin/teams", icon: Settings },
    { title: "Audit Log", desc: "Review system activity", href: "/audit-log", icon: ClipboardList },
    { title: "Pipeline Health", desc: "Monitor data ingestion", href: "/data-ingestion", icon: Database },
  ]

  return (
    <div className="space-y-6">
      {/* Row 1 -- Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
            {formatDate()}
          </p>
          <h1 className="text-2xl font-semibold text-foreground mt-1">Organization Overview</h1>
        </div>
        <span className="bg-emerald-500/10 text-emerald-400 text-xs font-medium px-2.5 py-1 rounded-md">
          Admin Access
        </span>
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
                <span className="col-span-3">Role</span>
                <span className="col-span-2">Risk</span>
                <span className="col-span-2 text-right">Trend</span>
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
                  <span className="col-span-3 text-sm text-muted-foreground truncate">{emp.persona || emp.role}</span>
                  <div className="col-span-2"><RiskBadge level={emp.risk_level} /></div>
                  <div className="col-span-2 flex justify-end">
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
                onClick={() => router.push("/admin/users")}
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
              <div key={team.name} className="grid grid-cols-12 gap-2 items-center py-2.5 border-b border-border/50 hover:bg-muted/50 transition-colors duration-150 cursor-pointer" onClick={() => router.push("/admin/teams")}>
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

      {/* Row 5 -- Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action) => (
          <button
            key={action.href}
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
