"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  AreaChart, Area, XAxis, YAxis, ResponsiveContainer,
} from "recharts"
import {
  AlertTriangle, Brain, TrendingUp,
  Clock, CalendarCheck, MessageSquare, Eye,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { StatCard } from "@/components/dashboard/stat-card"
import { RiskBadge } from "@/components/dashboard/risk-badge"
import { SectionCard } from "@/components/dashboard/section-card"
import { SentinelCard } from "@/components/dashboard/sentinel-card"
import { SkillsRadar } from "@/components/skills-radar"
import { formatDate, sparkPoints, buildTrendData } from "@/components/dashboard/helpers"
import { scheduleBreak } from "@/lib/api"
import { getInitials } from "@/lib/utils"
import type { Employee } from "@/types"

interface ManagerViewProps {
  employees: Employee[]
  userName: string
}

export function ManagerView({ employees, userName }: ManagerViewProps) {
  const router = useRouter()
  const [isAnonymized, setIsAnonymized] = useState(true)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [isScheduling, setIsScheduling] = useState(false)

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

  const hasCritical = critical.length > 0
  const showNames = !isAnonymized

  const displayName = (emp: Employee): string => {
    // CRITICAL employees: always show real name (safety override)
    if (emp.risk_level === "CRITICAL" && emp.name) {
      return emp.name
    }
    // Toggle ON: show all names (manager chose to reveal)
    if (showNames && emp.name) {
      return emp.name
    }
    // Default: anonymized hash
    return `Employee-${emp.user_hash.substring(0, 4).toUpperCase()}`
  }

  const isCriticalReveal = (emp: Employee): boolean =>
    emp.risk_level === "CRITICAL" && isAnonymized

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
      urgency: critical.length > 0 ? "critical" as const : "neutral" as const,
    },
    {
      icon: TrendingUp,
      color: "text-emerald-400",
      text: `Team velocity is ${avgVelocity > 3 ? "above" : "below"} baseline at ${avgVelocity.toFixed(1)} pts/sprint`,
      sub: "7-day rolling average",
      urgency: "neutral" as const,
    },
    {
      icon: Brain,
      color: "text-emerald-400",
      text: `${healthy.length} member${healthy.length !== 1 ? "s" : ""} in the healthy zone`,
      sub: "Connection index & circadian entropy nominal",
      urgency: "healthy" as const,
    },
  ], [critical.length, avgVelocity, healthy.length])

  const activeIndicators = (emp: Employee): string[] => {
    const labels: string[] = []
    if (emp.indicators?.chaotic_hours) labels.push("Chaotic Schedule")
    if (emp.indicators?.social_withdrawal) labels.push("Social Withdrawal")
    if (emp.indicators?.sustained_intensity) labels.push("Sustained Intensity")
    return labels
  }

  const handleScheduleOneOnOne = async (emp: Employee) => {
    setIsScheduling(true)
    // Open window synchronously in click handler (before async gap)
    const calendarWindow = window.open("about:blank", "_blank")
    try {
      const result = await scheduleBreak(emp.user_hash)
      if (result?.calendar_link && calendarWindow) {
        calendarWindow.location.href = result.calendar_link
      } else if (calendarWindow) {
        calendarWindow.close()
      }
      toast.success(`1:1 scheduled with ${displayName(emp)}`, {
        description: result.message || "Calendar invite sent",
      })
    } catch {
      calendarWindow?.close()
      toast.error("Could not schedule 1:1", {
        description: "Please try again or use your calendar directly",
      })
    } finally {
      setIsScheduling(false)
    }
  }

  const handleAskSentinel = (emp: Employee) => {
    setSelectedEmployee(null)
    router.push(`/ask-sentinel?q=${encodeURIComponent(`How is ${displayName(emp)} doing?`)}`)
  }

  const riskBadgeStyle = (level: string) => {
    switch (level) {
      case "CRITICAL": return "bg-[hsl(var(--sentinel-critical))]/10 text-[hsl(var(--sentinel-critical))] border-[hsl(var(--sentinel-critical))]/20"
      case "ELEVATED": return "bg-[hsl(var(--sentinel-elevated))]/10 text-[hsl(var(--sentinel-elevated))] border-[hsl(var(--sentinel-elevated))]/20"
      default: return "bg-[hsl(var(--sentinel-healthy))]/10 text-[hsl(var(--sentinel-healthy))] border-[hsl(var(--sentinel-healthy))]/20"
    }
  }

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
          {hasCritical && (
            <div className="flex flex-col items-end gap-0.5">
              <button
                onClick={() => setIsAnonymized(!isAnonymized)}
                className="text-xs text-muted-foreground hover:text-foreground border border-border rounded-md px-2.5 py-1 transition-colors duration-150"
                title="Required for critical risk intervention"
              >
                {isAnonymized ? "Reveal Names" : "Anonymize"}
              </button>
              <span className="text-[9px] text-muted-foreground/70">
                Names revealed for critical risk cases
              </span>
            </div>
          )}
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
            <div className="divide-y divide-border/40">
              {sortedMembers.slice(0, 6).map((emp) => (
                <div
                  key={emp.user_hash}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedEmployee(emp)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedEmployee(emp) } }}
                  className="flex items-center gap-4 py-4 px-2 -mx-2 rounded-md hover:bg-muted/30 cursor-pointer transition-colors duration-150"
                >
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground shrink-0">
                    {(emp.risk_level === "CRITICAL" || !isAnonymized) ? getInitials(emp.name) : "??"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {displayName(emp)}
                      {isCriticalReveal(emp) && (
                        <Eye className="inline h-3 w-3 ml-1 text-red-400/70" aria-label="Identity revealed for safety" />
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {(emp.risk_level === "CRITICAL" || !isAnonymized) ? emp.role : "Engineer"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <RiskBadge level={emp.risk_level} />
                    {emp.confidence != null && (
                      <span className="text-[10px] tabular-nums text-muted-foreground">
                        {Math.round(emp.confidence * 100)}%
                      </span>
                    )}
                  </div>
                  <div className="shrink-0">
                    <svg width="48" height="16" viewBox="0 0 48 16" className="opacity-60">
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
          <SentinelCard
            insights={aiInsights}
            onScheduleCheckin={() => router.push("/ask-sentinel?q=Schedule+a+team+check-in+for+this+week")}
          />
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

      {/* Employee Profile Dialog */}
      <Dialog open={selectedEmployee !== null} onOpenChange={(open) => { if (!open) setSelectedEmployee(null) }}>
        <DialogContent className="max-w-5xl gap-0 p-0 overflow-hidden">
          {selectedEmployee && (() => {
            const emp = selectedEmployee
            const velocityStatus = emp.velocity > 3 ? "High output" : emp.velocity > 2 ? "Steady" : "Below baseline"
            const velocityColor = emp.velocity > 3.5 ? "text-red-400" : emp.velocity > 2.5 ? "text-amber-400" : "text-emerald-400"
            const connectionPct = Math.round(emp.belongingness_score * 100)
            const connectionStatus = connectionPct >= 70 ? "Healthy" : connectionPct >= 40 ? "Low engagement" : "Isolated"
            const connectionColor = connectionPct >= 70 ? "text-emerald-400" : connectionPct >= 40 ? "text-amber-400" : "text-red-400"
            const confidencePct = Math.round(emp.confidence * 100)
            const confidenceStatus = confidencePct >= 80 ? "High" : confidencePct >= 50 ? "Moderate" : "Low"
            const confidenceColor = confidencePct >= 80 ? "text-emerald-400" : confidencePct >= 50 ? "text-amber-400" : "text-red-400"
            const entropyVal = emp.circadian_entropy
            const entropyStatus = entropyVal > 1.5 ? "Irregular" : entropyVal > 0.8 ? "Variable" : "Stable"
            const entropyColor = entropyVal > 1.5 ? "text-red-400" : entropyVal > 0.8 ? "text-amber-400" : "text-emerald-400"
            const indicators = activeIndicators(emp)

            const generateAssessment = (): string => {
              if (emp.risk_level === "CRITICAL") {
                const sentences: string[] = []
                if (emp.velocity > 2.5) {
                  sentences.push(`Work velocity has reached ${emp.velocity.toFixed(1)}x baseline, well above the 2.5 critical threshold.`)
                }
                if (emp.belongingness_score < 0.4) {
                  sentences.push(`Social connection has dropped to ${connectionPct}%, falling below the 40% isolation threshold and indicating team withdrawal.`)
                } else if (connectionPct < 70) {
                  sentences.push(`Social connection at ${connectionPct}% is below the 70% healthy benchmark.`)
                }
                if (entropyVal > 1.5) {
                  sentences.push(`Schedule entropy is elevated at ${entropyVal.toFixed(2)}, pointing to irregular and potentially chaotic work hours.`)
                }
                if (sentences.length === 0) {
                  sentences.push("Multiple risk signals detected across behavioral dimensions.")
                }
                sentences.push("Schedule an immediate 1:1 to discuss workload, check for deadline pressure, and explore schedule flexibility.")
                return sentences.join(" ")
              }
              if (emp.risk_level === "ELEVATED") {
                return `Early warning signals present. Connection index at ${connectionPct}% and velocity trending ${emp.velocity > 3 ? "above" : "at"} baseline. Proactive check-in advised.`
              }
              return `All indicators within healthy range. Velocity at ${emp.velocity.toFixed(1)}, connection at ${connectionPct}%, schedule entropy stable. No intervention needed.`
            }

            const skillsData = {
              technical: 70,
              communication: 50,
              leadership: 40,
              collaboration: 80,
              adaptability: 60,
              creativity: 50,
            }

            return (
              <div className="p-10">
                <DialogHeader className="pb-0">
                  <div className="flex items-start gap-5">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-xl font-semibold text-foreground shrink-0">
                      {(emp.risk_level === "CRITICAL" || !isAnonymized) ? getInitials(emp.name) : "??"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <DialogTitle className="text-2xl font-semibold">
                        {displayName(emp)}
                        {isCriticalReveal(emp) && (
                          <Eye className="inline h-4 w-4 ml-2 text-red-400/70" aria-label="Identity revealed for safety" />
                        )}
                      </DialogTitle>
                      <div className="flex items-center gap-2.5 mt-1.5">
                        <p className="text-sm text-muted-foreground">
                          {(emp.risk_level === "CRITICAL" || !isAnonymized) ? emp.role : "Engineer"}
                        </p>
                        <Badge variant="outline" className={`text-[10px] ${riskBadgeStyle(emp.risk_level)}`}>
                          {emp.risk_level}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        disabled={isScheduling}
                        onClick={() => handleScheduleOneOnOne(emp)}
                      >
                        <CalendarCheck className="h-3.5 w-3.5 mr-1.5" />
                        {isScheduling ? "Scheduling..." : "Schedule 1:1"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                        onClick={() => handleAskSentinel(emp)}
                      >
                        <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                        Ask Sentinel
                      </Button>
                    </div>
                  </div>
                </DialogHeader>

                <div className="mt-10">
                  <div className="bg-muted/30 rounded-xl p-6">
                    <div className="grid grid-cols-4 gap-8">
                      {[
                        { label: "Velocity", value: emp.velocity.toFixed(1), status: velocityStatus, color: velocityColor },
                        { label: "Connection", value: `${connectionPct}%`, status: connectionStatus, color: connectionColor },
                        { label: "Confidence", value: `${confidencePct}%`, status: confidenceStatus, color: confidenceColor },
                        { label: "Entropy", value: entropyVal.toFixed(1), status: entropyStatus, color: entropyColor },
                      ].map((m) => (
                        <div key={m.label} className="p-5">
                          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{m.label}</p>
                          <p className="text-3xl font-mono font-semibold tabular-nums text-foreground mt-1.5 mb-1">{m.value}</p>
                          <p className={`text-xs ${m.color}`}>{m.status}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {indicators.length > 0 && (
                  <div className="mt-8">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-3">Active Indicators</p>
                    <div className="flex flex-wrap gap-2">
                      {indicators.map((label) => (
                        <span
                          key={label}
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            label === "Sustained Intensity"
                              ? "bg-[hsl(var(--sentinel-elevated))]/10 text-[hsl(var(--sentinel-elevated))]"
                              : "bg-[hsl(var(--sentinel-critical))]/10 text-[hsl(var(--sentinel-critical))]"
                          }`}
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <Separator className="opacity-10 mt-8" />

                <div className="mt-8">
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-3">Skills Radar</p>
                      <SkillsRadar data={skillsData} height={180} />
                    </div>

                    <div className="space-y-5">
                      <div className="bg-muted/20 rounded-xl p-4">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Brain className="h-3.5 w-3.5 text-muted-foreground" />
                          <p className="text-xs font-medium text-muted-foreground">AI Assessment</p>
                        </div>
                        <p className="text-sm leading-relaxed text-foreground/80">
                          {generateAssessment()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="opacity-10 mt-8" />

                <div className="mt-8">
                  <p className="text-[10px] text-muted-foreground/40 italic">
                    Analysis based on behavioral metadata only. No personal content accessed.
                  </p>
                </div>
              </div>
            )
          })()}
        </DialogContent>
      </Dialog>
    </div>
  )
}
