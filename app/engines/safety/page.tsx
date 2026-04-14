"use client"

import { Suspense, useState, useMemo, useEffect, useCallback } from "react"

import { ProtectedRoute } from "@/components/protected-route"
import { RiskAssessment } from "@/components/risk-assessment"
import { AiInsightCard } from "@/components/ai/AiInsightCard"
import { StatCards } from "@/components/stat-cards"
import { NudgeCard } from "@/components/nudge-card"
import { VelocityChart } from "@/components/velocity-chart"
import { ScrollArea } from "@/components/ui/scroll-area"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Shield,
  Users,
  Heart,
  AlertTriangle,
  TrendingUp,
  Activity,
  Bell,
  BellOff,
  ChevronRight,
  RefreshCw,
  Zap,
  Clock,
  BarChart3,
  AlertCircle,
  CheckCircle2,
  Info,
  MessageSquare,
  Calendar,
  Eye,
  Gauge,
  Link2,
  Sparkles,
} from "lucide-react"

import { Employee, RiskLevel, TeamMetrics, toRiskLevel } from "@/types"
import { mapUsersToEmployees } from "@/lib/map-employees"
import { scheduleBreak } from "@/lib/api"
import { toast } from "sonner"

import { useRiskData } from "@/hooks/useRiskData"
import { useTeamData } from "@/hooks/useTeamData"
import { useRiskHistory } from "@/hooks/useRiskHistory"
import { useUsers } from "@/hooks/useUsers"
import { useNudge } from "@/hooks/useNudge"
import { useBenchmarks } from "@/hooks/useBenchmarks"
import { cn, getInitials } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Extracted sub-components
// ---------------------------------------------------------------------------

interface HeroSectionProps {
  teamRiskScore: number
  riskDistribution: {
    critical: number
    criticalPct: number
    elevated: number
    elevatedPct: number
    healthy: number
    healthyPct: number
  }
}

function HeroSection({ teamRiskScore, riskDistribution }: HeroSectionProps) {
  return (
    <div className="bg-card border border-border rounded-lg relative overflow-hidden">
      <div className="absolute inset-0 bg-[hsl(var(--sentinel-critical))]/3" />

      <div className="relative grid gap-10 p-8 md:grid-cols-2 lg:gap-14">
        {/* Score Display */}
        <div className="flex flex-col items-center justify-center gap-5">
          <div className="relative">
            <div className="relative flex h-40 w-40 items-center justify-center rounded-full border border-border bg-background">
              <div className="flex flex-col items-center">
                <span className="text-4xl font-bold tracking-tight text-foreground font-mono tabular-nums">
                  {teamRiskScore}
                </span>
                <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mt-1">
                  Risk Score
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {teamRiskScore >= 60 ? (
              <>
                <AlertCircle className="h-4 w-4 text-sentinel-critical" />
                <span className="text-sm font-medium text-sentinel-critical">High team risk — Immediate action needed</span>
              </>
            ) : teamRiskScore >= 30 ? (
              <>
                <AlertTriangle className="h-4 w-4 text-sentinel-elevated" />
                <span className="text-sm font-medium text-[hsl(var(--sentinel-elevated))]">Elevated risk — Monitor closely</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 text-sentinel-healthy" />
                <span className="text-sm font-medium text-sentinel-healthy">Team health is good</span>
              </>
            )}
          </div>
        </div>

        {/* Risk Distribution */}
        <div className="flex flex-col justify-center gap-4">
          {/* Critical */}
          <div className="bg-muted/20 rounded-lg flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[hsl(var(--sentinel-critical))]/10">
                <AlertTriangle className="h-4 w-4 text-sentinel-critical" />
              </div>
              <div>
                <p className="text-sm font-medium text-sentinel-critical">Critical</p>
                <p className="text-[11px] text-muted-foreground">Immediate attention required</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold font-mono tabular-nums text-sentinel-critical">{riskDistribution.critical}</p>
              <p className="text-[10px] text-muted-foreground">{riskDistribution.criticalPct}%</p>
            </div>
          </div>

          {/* Elevated */}
          <div className="bg-muted/20 rounded-lg flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[hsl(var(--sentinel-elevated))]/10">
                <TrendingUp className="h-4 w-4 text-sentinel-elevated" />
              </div>
              <div>
                <p className="text-sm font-medium text-sentinel-elevated">Elevated</p>
                <p className="text-[11px] text-muted-foreground">Monitoring closely</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold font-mono tabular-nums text-sentinel-elevated">{riskDistribution.elevated}</p>
              <p className="text-[10px] text-muted-foreground">{riskDistribution.elevatedPct}%</p>
            </div>
          </div>

          {/* Healthy */}
          <div className="bg-muted/20 rounded-lg flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[hsl(var(--sentinel-healthy))]/10">
                <Heart className="h-4 w-4 text-sentinel-healthy" />
              </div>
              <div>
                <p className="text-sm font-medium text-sentinel-healthy">Healthy</p>
                <p className="text-[11px] text-muted-foreground">Within normal range</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold font-mono tabular-nums text-sentinel-healthy">{riskDistribution.healthy}</p>
              <p className="text-[10px] text-muted-foreground">{riskDistribution.healthyPct}%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------

interface PreventionTipsSectionProps {
  employees: Employee[]
}

function PreventionTipsSection({ employees }: PreventionTipsSectionProps) {
  const preventionTips = useMemo(() => {
    const tips: { icon: typeof Zap; text: string; action?: string }[] = []
    const criticalCount = employees.filter(e => e.risk_level === "CRITICAL").length
    const elevatedCount = employees.filter(e => e.risk_level === "ELEVATED").length
    const highVelocity = employees.filter(e => e.velocity > 2.0).length
    const criticalNames = employees.filter(e => e.risk_level === "CRITICAL").slice(0, 2).map(e => e.name || `Employee-${e.user_hash.substring(0, 4).toUpperCase()}`).join(", ")

    if (criticalCount > 0) {
      tips.push({ icon: Zap, text: `${criticalCount} employee(s) at critical risk — schedule immediate 1:1 check-ins`, action: `/ask-sentinel?q=${encodeURIComponent(`Schedule 1:1 check-in with ${criticalNames} to discuss wellbeing`)}` })
    }
    if (highVelocity > 0) {
      tips.push({ icon: Clock, text: `${highVelocity} employee(s) showing high velocity — review workload distribution`, action: `/ask-sentinel?q=${encodeURIComponent("Review workload distribution for my team and suggest rebalancing")}` })
    }
    if (elevatedCount > 0) {
      tips.push({ icon: MessageSquare, text: `${elevatedCount} employee(s) at elevated risk — consider preventive interventions`, action: `/ask-sentinel?q=${encodeURIComponent("What preventive actions should I take for elevated risk team members")}` })
    }
    if (tips.length === 0) {
      tips.push({ icon: Heart, text: "Team health looks good — maintain current support practices" })
    }
    return tips.slice(0, 3)
  }, [employees])

  return (
    <div className="bg-muted/20 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-sentinel-healthy">Prevention Actions</span>
        <CheckCircle2 className="h-4 w-4 text-sentinel-healthy" />
      </div>
      <p className="text-[11px] text-muted-foreground mb-3">
        Recommended interventions based on current patterns
      </p>
      <div className="space-y-2 text-[11px]">
        {preventionTips.map((tip, idx) => {
          const TipIcon = tip.icon
          return (
            <div key={idx} className="flex items-start gap-2">
              <TipIcon className="h-3 w-3 text-sentinel-healthy mt-0.5 shrink-0" />
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground">{tip.text}</span>
                {tip.action && (
                  <a href={tip.action} className="text-sentinel-healthy hover:underline cursor-pointer">
                    Ask Copilot →
                  </a>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main content
// ---------------------------------------------------------------------------

function SafetyContent() {
  const [selectedUserHash, setSelectedUserHash] = useState<string | null>(null)
  const [showAlertsOnly, setShowAlertsOnly] = useState(false)
  const [profileDialogEmployee, setProfileDialogEmployee] = useState<Employee | null>(null)
  const [isScheduling, setIsScheduling] = useState(false)
  const [isAnonymized, setIsAnonymized] = useState(true)

  const { users, isLoading: usersLoading, refetch: refetchUsers } = useUsers()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refetchUsers()
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleScheduleBreak = useCallback(async (userHash: string) => {
    setIsScheduling(true)
    // Open window synchronously in click handler (before async gap)
    const calendarWindow = window.open("about:blank", "_blank")
    try {
      const res = await scheduleBreak(userHash)
      if (res?.calendar_link && calendarWindow) {
        calendarWindow.location.href = res.calendar_link
      } else if (calendarWindow) {
        calendarWindow.close()
      }
      toast.success("1:1 scheduled successfully")
    } catch {
      calendarWindow?.close()
      toast.error("Failed to schedule 1:1. Please try again.")
    } finally {
      setIsScheduling(false)
    }
  }, [])

  useEffect(() => {
    if (!selectedUserHash && users.length > 0) {
      setSelectedUserHash(users[0].user_hash)
    }
  }, [users, selectedUserHash])

  const employees = useMemo(() => mapUsersToEmployees(users), [users])

  const showNames = !isAnonymized

  const displayName = useCallback((emp: Employee): string => {
    if (emp.risk_level === "CRITICAL" && emp.name) return emp.name
    if (showNames && emp.name) return emp.name
    return `Employee-${emp.user_hash.substring(0, 4).toUpperCase()}`
  }, [showNames])

  const isCriticalReveal = useCallback((emp: Employee): boolean =>
    emp.risk_level === "CRITICAL" && isAnonymized
  , [isAnonymized])

  const hasCriticalEmployees = useMemo(() =>
    employees.some(e => e.risk_level === "CRITICAL")
  , [employees])

  const selectedBaseEmployee = useMemo(() =>
    employees.find(e => e.user_hash === selectedUserHash) || employees[0] || null
  , [employees, selectedUserHash])

  const { data: riskData } = useRiskData(selectedUserHash)
  const { data: nudgeData } = useNudge(selectedUserHash)
  const { data: teamData } = useTeamData()
  const { history: riskHistory } = useRiskHistory(selectedUserHash)
  const { data: benchmarkData } = useBenchmarks()

  const currentEmployee = useMemo(() => {
    if (!selectedBaseEmployee) return null
    if (!riskData) return selectedBaseEmployee
    return {
      ...selectedBaseEmployee,
      risk_level: riskData.risk_level,
      velocity: riskData.velocity,
      confidence: riskData.confidence,
      belongingness_score: riskData.belongingness_score,
      circadian_entropy: riskData.circadian_entropy,
      attrition_probability: riskData.attrition_probability ?? 0,
      indicators: {
        chaotic_hours: riskData.indicators?.chaotic_hours || false,
        social_withdrawal: riskData.indicators?.social_withdrawal || false,
        sustained_intensity: riskData.indicators?.sustained_intensity || false,
        has_explained_context: riskData.indicators?.has_explained_context || false,
      }
    } as Employee
  }, [selectedBaseEmployee, riskData])

  const mappedTeamMetrics: TeamMetrics = useMemo(() => {
    if (!teamData) {
      const total = employees.length
      const healthy = employees.filter(e => e.risk_level === "LOW").length
      const elevated = employees.filter(e => e.risk_level === "ELEVATED").length
      const critical = employees.filter(e => e.risk_level === "CRITICAL").length
      const avgVel = employees.reduce((sum, e) => sum + e.velocity, 0) / (total || 1)

      return {
        total_members: total,
        healthy_count: healthy,
        elevated_count: elevated,
        critical_count: critical,
        avg_velocity: avgVel,
        contagion_risk: critical > 2 ? "CRITICAL" as const : elevated > 4 ? "ELEVATED" as const : "LOW" as const,
        graph_fragmentation: null,
        comm_decay_rate: null,
      }
    }

    const total = employees.length
    const healthy = employees.filter(e => e.risk_level === "LOW").length
    const elevated = employees.filter(e => e.risk_level === "ELEVATED").length
    const critical = employees.filter(e => e.risk_level === "CRITICAL").length

    return {
      total_members: total,
      healthy_count: healthy,
      elevated_count: elevated,
      critical_count: critical,
      avg_velocity: teamData.metrics?.avg_velocity || employees.reduce((sum, e) => sum + e.velocity, 0) / (total || 1),
      contagion_risk: teamData.contagion_risk || (critical > 2 ? "CRITICAL" as const : elevated > 4 ? "ELEVATED" as const : "LOW" as const),
      graph_fragmentation: teamData.graph_fragmentation ?? null,
      comm_decay_rate: teamData.metrics?.comm_decay_rate ?? null,
    }
  }, [teamData, employees])

  const teamRiskScore = useMemo(() => {
    if (mappedTeamMetrics.total_members === 0) return 0
    const weightedScore = (
      (mappedTeamMetrics.critical_count * 100) +
      (mappedTeamMetrics.elevated_count * 50) +
      (mappedTeamMetrics.healthy_count * 10)
    ) / mappedTeamMetrics.total_members
    return Math.min(Math.round(weightedScore), 100)
  }, [mappedTeamMetrics])

  const riskDistribution = useMemo(() => {
    const total = employees.length || 1
    return {
      critical: mappedTeamMetrics.critical_count,
      criticalPct: Math.round((mappedTeamMetrics.critical_count / total) * 100),
      elevated: mappedTeamMetrics.elevated_count,
      elevatedPct: Math.round((mappedTeamMetrics.elevated_count / total) * 100),
      healthy: mappedTeamMetrics.healthy_count,
      healthyPct: Math.round((mappedTeamMetrics.healthy_count / total) * 100),
    }
  }, [employees, mappedTeamMetrics])

  const weekOverWeek = useMemo(() => {
    if (!riskHistory || riskHistory.length < 7) return null

    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

    const thisWeek = riskHistory.filter((r: any) => new Date(r.timestamp) >= oneWeekAgo)
    const lastWeek = riskHistory.filter((r: any) => {
      const d = new Date(r.timestamp)
      return d >= twoWeeksAgo && d < oneWeekAgo
    })

    if (thisWeek.length === 0 || lastWeek.length === 0) return null

    const avgVelThis = thisWeek.reduce((s: number, r: any) => s + (r.velocity || 0), 0) / thisWeek.length
    const avgVelLast = lastWeek.reduce((s: number, r: any) => s + (r.velocity || 0), 0) / lastWeek.length
    const avgBelongThis = thisWeek.reduce((s: number, r: any) => s + (r.belongingness_score || 0), 0) / thisWeek.length
    const avgBelongLast = lastWeek.reduce((s: number, r: any) => s + (r.belongingness_score || 0), 0) / lastWeek.length

    return {
      velocityDelta: avgVelThis - avgVelLast,
      belongingnessDelta: avgBelongThis - avgBelongLast,
      velocityDirection: avgVelThis > avgVelLast ? "up" as const : "down" as const,
      belongingnessDirection: avgBelongThis > avgBelongLast ? "up" as const : "down" as const,
    }
  }, [riskHistory])

  const highRiskEmployees = useMemo(() => {
    return employees
      .filter(e => e.risk_level === "CRITICAL" || e.risk_level === "ELEVATED")
      .sort((a, b) => {
        const order = { CRITICAL: 0, ELEVATED: 1, LOW: 2 }
        return order[a.risk_level] - order[b.risk_level]
      })
  }, [employees])

  const filteredEmployees = showAlertsOnly
    ? highRiskEmployees
    : employees

  const chartData = riskHistory && riskHistory.length > 0 ? riskHistory : []

  const handleUserSelect = (emp: Employee) => {
    setSelectedUserHash(emp.user_hash)
  }

  const getRiskColor = (level: RiskLevel) => {
    switch (level) {
      case "CRITICAL":
        return "text-[hsl(var(--sentinel-critical))]"
      case "ELEVATED":
        return "text-[hsl(var(--sentinel-elevated))]"
      case "LOW":
        return "text-[hsl(var(--sentinel-healthy))]"
      default:
        return "text-muted-foreground"
    }
  }

  const getRiskBg = (level: RiskLevel) => {
    switch (level) {
      case "CRITICAL":
        return "bg-[hsl(var(--sentinel-critical))]/10 border-[hsl(var(--sentinel-critical))]/20"
      case "ELEVATED":
        return "bg-[hsl(var(--sentinel-elevated))]/10 border-[hsl(var(--sentinel-elevated))]/20"
      case "LOW":
        return "bg-[hsl(var(--sentinel-healthy))]/10 border-[hsl(var(--sentinel-healthy))]/20"
      default:
        return "bg-muted/50"
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <ScrollArea className="flex-1">
        <main className="flex flex-col gap-8 p-6 lg:p-10">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[hsl(var(--sentinel-critical))]/15 border border-[hsl(var(--sentinel-critical))]/20">
                <Shield className="h-6 w-6 text-[hsl(var(--sentinel-critical))]" />
              </div>
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-foreground">Safety Valve</h2>
                <p className="text-sm text-muted-foreground">Burnout detection & risk analysis</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {hasCriticalEmployees && (
                <div className="flex flex-col items-end gap-0.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAnonymized(!isAnonymized)}
                    title="Required for critical risk intervention"
                  >
                    <Eye className="h-4 w-4 mr-1.5" />
                    {isAnonymized ? "Reveal Names" : "Anonymize"}
                  </Button>
                  <span className="text-[9px] text-muted-foreground/70">
                    Names revealed for critical risk cases
                  </span>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                disabled={isRefreshing}
                onClick={handleRefresh}
              >
                <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                {isRefreshing ? "Refreshing..." : "Refresh"}
              </Button>
            </div>
          </div>

          {/* Hero Section */}
          <HeroSection teamRiskScore={teamRiskScore} riskDistribution={riskDistribution} />

          {/* Burnout Prediction */}
          <div className="bg-card border border-border rounded-lg p-6 border-[hsl(var(--sentinel-critical))]/15">
            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[hsl(var(--sentinel-critical))]/10">
                <AlertTriangle className="h-4 w-4 text-[hsl(var(--sentinel-critical))]" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">Burnout Prediction</h3>
                <p className="text-xs text-muted-foreground">AI-powered risk forecasting based on behavioral patterns</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {/* High Risk */}
              <div className="bg-muted/20 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-[hsl(var(--sentinel-critical))]">High Risk</span>
                  <Badge className="text-[10px] bg-[hsl(var(--sentinel-critical))]/15 text-[hsl(var(--sentinel-critical))] border-[hsl(var(--sentinel-critical))]/20">
                    {employees.filter(e => e.risk_level === "CRITICAL").length}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground mb-3">
                  Employees showing signs of potential burnout
                </p>
                <div className="space-y-2">
                  {employees.filter(e => e.risk_level === "CRITICAL").slice(0, 3).map(emp => (
                    <div key={emp.user_hash} className="flex items-center gap-2 text-xs">
                      <div className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--sentinel-critical))]" />
                      <span className="text-foreground">
                        {displayName(emp)}
                        {isCriticalReveal(emp) && (
                          <Eye className="inline h-2.5 w-2.5 ml-1 text-red-400/70" aria-label="Identity revealed" />
                        )}
                      </span>
                    </div>
                  ))}
                  {employees.filter(e => e.risk_level === "CRITICAL").length === 0 && (
                    <p className="text-[11px] text-muted-foreground">No high-risk predictions</p>
                  )}
                </div>
              </div>

              {/* Elevated Risk */}
              <div className="bg-muted/20 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-[hsl(var(--sentinel-elevated))]">Elevated Risk</span>
                  <Badge className="text-[10px] bg-[hsl(var(--sentinel-elevated))]/15 text-[hsl(var(--sentinel-elevated))] border-[hsl(var(--sentinel-elevated))]/20">
                    {employees.filter(e => e.risk_level === "ELEVATED").length}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground mb-3">
                  Employees who may become at-risk without intervention
                </p>
                <div className="space-y-2">
                  {employees.filter(e => e.risk_level === "ELEVATED").slice(0, 3).map(emp => (
                    <div key={emp.user_hash} className="flex items-center gap-2 text-xs">
                      <div className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--sentinel-elevated))]" />
                      <span className="text-foreground">{displayName(emp)}</span>
                    </div>
                  ))}
                  {employees.filter(e => e.risk_level === "ELEVATED").length === 0 && (
                    <p className="text-[11px] text-muted-foreground">No elevated-risk predictions</p>
                  )}
                </div>
              </div>

              {/* Prevention Tips */}
              <PreventionTipsSection employees={employees} />
            </div>
          </div>

          {/* Stat Cards */}
          {mappedTeamMetrics && <StatCards metrics={mappedTeamMetrics} />}

          {/* Industry Benchmark Comparison */}
          {benchmarkData && (
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
                <div>
                  <h3 className="text-base font-semibold text-foreground">Industry Comparison</h3>
                  <p className="text-xs text-muted-foreground">Your team vs {benchmarkData.industry} industry average (Source: {benchmarkData.source})</p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  {
                    label: "Burnout Rate",
                    team: `${(benchmarkData.team_burnout_rate * 100).toFixed(0)}%`,
                    industry: `${(benchmarkData.burnout_rate * 100).toFixed(0)}%`,
                    worse: benchmarkData.team_burnout_rate > benchmarkData.burnout_rate,
                  },
                  {
                    label: "Avg Velocity",
                    team: benchmarkData.team_avg_velocity.toFixed(1),
                    industry: benchmarkData.avg_velocity.toFixed(1),
                    worse: benchmarkData.team_avg_velocity > benchmarkData.avg_velocity,
                  },
                  {
                    label: "Avg Connection Index",
                    team: benchmarkData.team_avg_belongingness.toFixed(2),
                    industry: benchmarkData.avg_belongingness.toFixed(2),
                    worse: benchmarkData.team_avg_belongingness < benchmarkData.avg_belongingness,
                  },
                ].map((metric) => (
                  <div key={metric.label} className="bg-muted/20 rounded-lg p-4">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">{metric.label}</p>
                    <div className="flex items-end gap-3">
                      <div>
                        <p className={cn("text-2xl font-bold tabular-nums", metric.worse ? "text-[hsl(var(--sentinel-critical))]" : "text-[hsl(var(--sentinel-healthy))]")}>
                          {metric.team}
                        </p>
                        <p className="text-[10px] text-muted-foreground">Your team</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold tabular-nums text-muted-foreground">{metric.industry}</p>
                        <p className="text-[10px] text-muted-foreground">Industry avg</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Main Content Grid */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Employee Cards */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <h3 className="text-base font-semibold text-foreground">Team Members</h3>
                  <Badge variant="secondary" className="ml-1 text-[10px]">
                    {filteredEmployees.length}
                  </Badge>
                </div>
                <Button
                  variant={showAlertsOnly ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowAlertsOnly(!showAlertsOnly)}
                  className={showAlertsOnly ? "bg-[hsl(var(--sentinel-critical))] hover:bg-[hsl(var(--sentinel-critical))]/90 text-white" : ""}
                >
                  {showAlertsOnly ? <Bell className="h-4 w-4 mr-2" /> : <BellOff className="h-4 w-4 mr-2" />}
                  {showAlertsOnly ? "Showing Alerts" : "Show Alerts Only"}
                </Button>
              </div>

              <div className="grid gap-2.5 sm:grid-cols-2">
                {filteredEmployees.map((emp) => (
                  <button
                    key={emp.user_hash}
                    onClick={() => handleUserSelect(emp)}
                    className={`relative flex items-center gap-3 rounded-lg border p-3.5 text-left transition-all ${
                      selectedUserHash === emp.user_hash
                        ? `${getRiskBg(emp.risk_level)} border-current`
                        : 'border-border bg-card hover:bg-accent/50'
                    }`}
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage src="" alt={displayName(emp)} />
                      <AvatarFallback className={`text-[10px] ${getRiskBg(emp.risk_level)}`}>
                        {(emp.risk_level === "CRITICAL" || !isAnonymized) ? getInitials(emp.name) : "??"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground truncate">
                          {displayName(emp)}
                          {isCriticalReveal(emp) && (
                            <Eye className="inline h-3 w-3 ml-1 text-red-400/70" aria-label="Identity revealed" />
                          )}
                        </p>
                        <Badge
                          variant="outline"
                          className={`ml-2 text-[9px] px-1.5 py-0 ${getRiskBg(emp.risk_level)}`}
                        >
                          {emp.risk_level}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-muted-foreground">
                          {(emp.risk_level === "CRITICAL" || !isAnonymized) ? emp.role : "Engineer"}
                        </span>
                        <span className="text-muted-foreground/30">·</span>
                        <span className={`text-[11px] font-mono tabular-nums font-medium ${getRiskColor(emp.risk_level)}`}>
                          {emp.velocity.toFixed(1)} vel
                        </span>
                      </div>
                    </div>
                    <div
                      role="button"
                      tabIndex={0}
                      aria-label={`View profile for ${displayName(emp)}`}
                      className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-accent shrink-0 transition-colors cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation()
                        setProfileDialogEmployee(emp)
                      }}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); setProfileDialogEmployee(emp) } }}
                    >
                      <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                  </button>
                ))}
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-base font-semibold text-foreground">Selected Employee</h3>
              </div>

              {currentEmployee ? (
                <div className="space-y-4">
                  <RiskAssessment employee={currentEmployee} />

                  {/* Schedule 1:1 */}
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    disabled={isScheduling}
                    onClick={() => handleScheduleBreak(currentEmployee.user_hash)}
                  >
                    <Calendar className="h-4 w-4" />
                    {isScheduling ? "Scheduling..." : "Schedule 1:1"}
                  </Button>

                  {/* AI Insight + Manager Action Plan */}
                  <AiInsightCard employee={currentEmployee} />

                  <NudgeCard nudge={nudgeData ?? undefined} />
                </div>
              ) : (
                <div className="bg-card border border-border rounded-lg flex flex-col items-center justify-center py-16">
                  <Users className="h-10 w-10 text-muted-foreground/20 mb-3" />
                  <p className="text-sm text-muted-foreground">Select an employee to view details</p>
                </div>
              )}
            </div>
          </div>

          {/* High Risk Alerts */}
          {highRiskEmployees.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-[hsl(var(--sentinel-critical))]" />
                <h3 className="text-base font-semibold text-foreground">High Risk Alerts</h3>
                <Badge className="ml-1 text-[10px] bg-[hsl(var(--sentinel-critical))]/15 text-[hsl(var(--sentinel-critical))] border-[hsl(var(--sentinel-critical))]/20">
                  {highRiskEmployees.length}
                </Badge>
              </div>

              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {highRiskEmployees.slice(0, 6).map((emp) => (
                  <button
                    key={emp.user_hash}
                    onClick={() => handleUserSelect(emp)}
                    className={`bg-card border rounded-lg p-4 text-left transition-all cursor-pointer ${
                      emp.risk_level === "CRITICAL"
                        ? "border-[hsl(var(--sentinel-critical))]/25"
                        : "border-[hsl(var(--sentinel-elevated))]/25"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className={
                          emp.risk_level === "CRITICAL"
                            ? "bg-[hsl(var(--sentinel-critical))]/15 text-[hsl(var(--sentinel-critical))]"
                            : "bg-[hsl(var(--sentinel-elevated))]/15 text-[hsl(var(--sentinel-elevated))]"
                        }>
                          {(emp.risk_level === "CRITICAL" || !isAnonymized) ? getInitials(emp.name) : "??"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {displayName(emp)}
                          {isCriticalReveal(emp) && (
                            <Eye className="inline h-3 w-3 ml-1 text-red-400/70" aria-label="Identity revealed" />
                          )}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {(emp.risk_level === "CRITICAL" || !isAnonymized) ? emp.role : "Engineer"}
                        </p>
                      </div>
                      <Badge
                        className={
                          emp.risk_level === "CRITICAL"
                            ? "text-[9px] bg-[hsl(var(--sentinel-critical))]/15 text-[hsl(var(--sentinel-critical))] border-[hsl(var(--sentinel-critical))]/20"
                            : "text-[9px] bg-[hsl(var(--sentinel-elevated))]/15 text-[hsl(var(--sentinel-elevated))] border-[hsl(var(--sentinel-elevated))]/20"
                        }
                      >
                        {emp.risk_level}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Velocity Trends */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-base font-semibold text-foreground">Velocity Trends</h3>
              </div>
              <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[hsl(var(--sentinel-critical))]" />
                  <span>Velocity</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[hsl(var(--sentinel-healthy))]" />
                  <span>Connection Index</span>
                </div>
              </div>
            </div>

            {weekOverWeek && (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-card border border-border rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Velocity</p>
                    <p className="text-xs text-muted-foreground">vs last week</p>
                  </div>
                  <div className={cn("flex items-center gap-1 text-sm font-semibold tabular-nums",
                    weekOverWeek.velocityDirection === "up" ? "text-[hsl(var(--sentinel-critical))]" : "text-[hsl(var(--sentinel-healthy))]"
                  )}>
                    {weekOverWeek.velocityDirection === "up" ? (
                      <TrendingUp className="h-3.5 w-3.5" />
                    ) : (
                      <TrendingUp className="h-3.5 w-3.5 rotate-180" />
                    )}
                    {weekOverWeek.velocityDelta > 0 ? "+" : ""}{weekOverWeek.velocityDelta.toFixed(2)}
                  </div>
                </div>
                <div className="bg-card border border-border rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Connection Index</p>
                    <p className="text-xs text-muted-foreground">vs last week</p>
                  </div>
                  <div className={cn("flex items-center gap-1 text-sm font-semibold tabular-nums",
                    weekOverWeek.belongingnessDirection === "up" ? "text-[hsl(var(--sentinel-healthy))]" : "text-[hsl(var(--sentinel-critical))]"
                  )}>
                    {weekOverWeek.belongingnessDirection === "up" ? (
                      <TrendingUp className="h-3.5 w-3.5" />
                    ) : (
                      <TrendingUp className="h-3.5 w-3.5 rotate-180" />
                    )}
                    {weekOverWeek.belongingnessDelta > 0 ? "+" : ""}{(weekOverWeek.belongingnessDelta * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
            )}

            <div className="bg-card border border-border rounded-lg p-6">
              <VelocityChart history={chartData} title="" />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-center gap-6 py-3 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-2">
              <Info className="h-3.5 w-3.5" />
              <span>Data refreshed every 5 minutes</span>
            </div>
            <Separator orientation="vertical" className="h-3" />
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5" />
              <span>Last updated: {new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </main>
      </ScrollArea>

      {/* Employee Profile Dialog */}
      <Dialog
        open={profileDialogEmployee !== null}
        onOpenChange={(open) => {
          if (!open) setProfileDialogEmployee(null)
        }}
      >
        {profileDialogEmployee && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className={getRiskBg(profileDialogEmployee.risk_level)}>
                    {(profileDialogEmployee.risk_level === "CRITICAL" || !isAnonymized) ? getInitials(profileDialogEmployee.name) : "??"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <DialogTitle className="text-base">
                    {displayName(profileDialogEmployee)}
                    {isCriticalReveal(profileDialogEmployee) && (
                      <Eye className="inline h-3.5 w-3.5 ml-1.5 text-red-400/70" aria-label="Identity revealed for safety" />
                    )}
                  </DialogTitle>
                  <DialogDescription className="text-xs">
                    {(profileDialogEmployee.risk_level === "CRITICAL" || !isAnonymized) ? profileDialogEmployee.role : "Engineer"}
                  </DialogDescription>
                </div>
                <Badge
                  variant="outline"
                  className={cn("ml-auto text-[9px] px-1.5 py-0 shrink-0", getRiskBg(profileDialogEmployee.risk_level))}
                >
                  {profileDialogEmployee.risk_level}
                </Badge>
              </div>
            </DialogHeader>

            <div className="flex flex-col gap-4 pt-2">
              {/* Key Metrics */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-muted/30 rounded-lg p-3 text-center">
                  <Gauge className="h-3.5 w-3.5 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-lg font-bold tabular-nums font-mono">{profileDialogEmployee.velocity.toFixed(1)}</p>
                  <p className="text-[10px] text-muted-foreground">Velocity</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3 text-center">
                  <Link2 className="h-3.5 w-3.5 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-lg font-bold tabular-nums font-mono">{(profileDialogEmployee.belongingness_score * 100).toFixed(0)}%</p>
                  <p className="text-[10px] text-muted-foreground">Connection</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3 text-center">
                  <Sparkles className="h-3.5 w-3.5 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-lg font-bold tabular-nums font-mono">{(profileDialogEmployee.confidence * 100).toFixed(0)}%</p>
                  <p className="text-[10px] text-muted-foreground">Confidence</p>
                </div>
              </div>

              {/* Active Indicators */}
              {profileDialogEmployee.indicators && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Active Indicators</p>
                  <div className="flex flex-wrap gap-1.5">
                    {profileDialogEmployee.indicators.chaotic_hours && (
                      <Badge variant="outline" className="text-[10px] bg-[hsl(var(--sentinel-elevated))]/10 text-[hsl(var(--sentinel-elevated))] border-[hsl(var(--sentinel-elevated))]/20">
                        <Clock className="h-3 w-3 mr-1" />Chaotic Schedule
                      </Badge>
                    )}
                    {profileDialogEmployee.indicators.social_withdrawal && (
                      <Badge variant="outline" className="text-[10px] bg-[hsl(var(--sentinel-critical))]/10 text-[hsl(var(--sentinel-critical))] border-[hsl(var(--sentinel-critical))]/20">
                        <Users className="h-3 w-3 mr-1" />Social Withdrawal
                      </Badge>
                    )}
                    {profileDialogEmployee.indicators.sustained_intensity && (
                      <Badge variant="outline" className="text-[10px] bg-[hsl(var(--sentinel-elevated))]/10 text-[hsl(var(--sentinel-elevated))] border-[hsl(var(--sentinel-elevated))]/20">
                        <Zap className="h-3 w-3 mr-1" />Sustained Intensity
                      </Badge>
                    )}
                    {!profileDialogEmployee.indicators.chaotic_hours &&
                      !profileDialogEmployee.indicators.social_withdrawal &&
                      !profileDialogEmployee.indicators.sustained_intensity && (
                        <span className="text-[11px] text-muted-foreground">No active indicators</span>
                      )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col gap-2 pt-1">
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  disabled={isScheduling}
                  onClick={() => handleScheduleBreak(profileDialogEmployee.user_hash)}
                >
                  <Calendar className="h-4 w-4" />
                  {isScheduling ? "Scheduling..." : "Schedule 1:1"}
                </Button>
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => {
                    setProfileDialogEmployee(null)
                    window.location.href = `/ask-sentinel?q=${encodeURIComponent(`Tell me about ${displayName(profileDialogEmployee)}'s wellbeing`)}`
                  }}
                >
                  <MessageSquare className="h-4 w-4" />
                  Ask Sentinel
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}

export default function SafetyValvePage() {
  return (
    <ProtectedRoute allowedRoles={["manager", "admin"]}>
      <SafetyContent />
    </ProtectedRoute>
  )
}
