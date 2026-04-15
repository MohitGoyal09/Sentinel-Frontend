"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Activity,
  Shield,
  Clock,
  Coffee,
  Settings,
  TrendingUp,
  TrendingDown,
  Minus,
  Lightbulb,
  MessageSquare,
  Target,
  Award,
  Zap,
  PauseCircle,
  PlayCircle,
  CheckCircle2,
  AlertCircle,
  Heart,
  Brain,
  Battery,
  Moon,
  Users,
  Flame,
  Sparkles,
  GitPullRequest,
  Video,
  Code2,
  Clock3,
  Network,
  CalendarDays,
  BarChart3,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { SkillsRadar } from "@/components/skills-radar"
import { AskSentinelWidget } from "@/components/ask-sentinel-widget"
import { api, getRiskHistory, getNetworkAnalysis, scheduleBreak } from "@/lib/api"
import { toast } from "sonner"
import { toRiskLevel, type RiskLevel, type TalentScoutData } from "@/types"
import { cn, getInitials } from "@/lib/utils"
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts"

// ─── Types ─────────────────────────────────────────────────────────────────

interface UserProfile {
  user_hash: string
  name?: string
  role: string
  consent_share_with_manager: boolean
  consent_share_anonymized: boolean
  monitoring_paused_until: string | null
  created_at: string
}

interface RiskData {
  velocity: number | null
  risk_level: string
  confidence: number
  thwarted_belongingness: number | null
  updated_at: string | null
}

interface MonitoringStatus {
  is_paused: boolean
  paused_until: string | null
}

interface MeData {
  user: UserProfile
  risk: RiskData | null
  audit_trail: any[]
  monitoring_status: MonitoringStatus
}

interface RiskHistoryPoint {
  timestamp: string
  risk_level: RiskLevel
  velocity: number
  confidence: number
  belongingness_score: number
}

// ─── Risk Config ────────────────────────────────────────────────────────────

const riskConfig: Record<RiskLevel, {
  label: string
  color: string
  bgClass: string
  borderClass: string
  icon: React.ReactNode
  description: string
  pillClass: string
}> = {
  CRITICAL: {
    label: "Critical",
    color: "text-destructive",
    bgClass: "bg-destructive/10",
    borderClass: "border-destructive/20",
    pillClass: "bg-destructive/15 text-destructive border border-destructive/20",
    icon: <AlertCircle className="h-4 w-4" />,
    description: "Your wellbeing signals suggest taking a break",
  },
  ELEVATED: {
    label: "At-Risk",
    color: "text-[hsl(var(--sentinel-elevated))]",
    bgClass: "bg-[hsl(var(--sentinel-elevated))]/10",
    borderClass: "border-[hsl(var(--sentinel-elevated))]/20",
    pillClass: "bg-[hsl(var(--sentinel-elevated))]/15 text-[hsl(var(--sentinel-elevated))] border border-[hsl(var(--sentinel-elevated))]/20",
    icon: <Activity className="h-4 w-4" />,
    description: "Some signals detected — consider a wellness check",
  },
  LOW: {
    label: "Healthy",
    color: "text-accent",
    bgClass: "bg-accent/10",
    borderClass: "border-accent/20",
    pillClass: "bg-accent/15 text-accent border border-accent/20",
    icon: <CheckCircle2 className="h-4 w-4" />,
    description: "Your work patterns look healthy",
  },
}

// ─── Static suggestion data ──────────────────────────────────────────────────

const aiSuggestions = [
  { type: "break", title: "Take a break", description: "You've been focused for 2+ hours. A short break could boost productivity.", icon: Coffee },
  { type: "meeting", title: "Block focus time", description: "Consider blocking 2 hours tomorrow for deep work.", icon: Clock3 },
  { type: "wellness", title: "Wellness check", description: "Your energy patterns suggest prioritizing rest this week.", icon: Flame },
]

const getDynamicSuggestions = (riskLevel: string, vel: number) => {
  const suggestions = []
  if (vel > 60) {
    suggestions.push({ type: "break", title: "High velocity detected", description: "Consider taking a break to prevent burnout.", icon: Coffee })
  }
  if (riskLevel === "CRITICAL") {
    suggestions.push({ type: "wellness", title: "Priority: Wellness", description: "Your risk level is elevated. Consider speaking with your manager.", icon: Flame })
  }
  if (suggestions.length === 0) {
    suggestions.push({ type: "good", title: "Great progress", description: "Your work patterns look healthy. Keep it up!", icon: CheckCircle2 })
  }
  return suggestions
}

// ─── Timeline events ─────────────────────────────────────────────────────────

const timelineEvents = [
  { icon: GitPullRequest, label: "PR #142 merged into main", time: "2h ago", color: "text-accent" },
  { icon: MessageSquare, label: "Responded to 3 Slack threads", time: "4h ago", color: "text-primary" },
  { icon: Video, label: "Team standup attended", time: "6h ago", color: "text-[hsl(var(--sentinel-info))]" },
  { icon: Code2, label: "Committed to feature/auth-flow", time: "Yesterday", color: "text-[hsl(var(--sentinel-gem))]" },
  { icon: Clock, label: "Focus session: 2h 15min", time: "Yesterday", color: "text-muted-foreground" },
]

// ─── Heatmap helpers ──────────────────────────────────────────────────────────

const DAYS = ["M", "T", "W", "T", "F", "S", "S"]
const HOURS = Array.from({ length: 12 }, (_, i) => `${9 + i}`)

const cellType = (day: number, hour: number): "peak" | "extended" | "off" => {
  if (day >= 5) return "off"
  if (hour >= 0 && hour <= 7 && day <= 4) {
    if ([1, 3, 4].includes(hour) && day <= 3) return "peak"
    if (hour >= 6) return "extended"
  }
  return "off"
}

// ─── Circular progress ring ──────────────────────────────────────────────────

function RiskRing({ value, color }: { value: number; color: string }) {
  const radius = 52
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference
  return (
    <svg width="128" height="128" viewBox="0 0 128 128" className="rotate-[-90deg]">
      <circle cx="64" cy="64" r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth="10" />
      <circle
        cx="64" cy="64" r={radius} fill="none"
        stroke={color} strokeWidth="10"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
    </svg>
  )
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────

function GlassTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-white/10 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-foreground">{entry.name}:</span>
          <span className="font-mono text-foreground">{typeof entry.value === "number" ? entry.value.toFixed(1) : entry.value}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Main content ─────────────────────────────────────────────────────────────

function EmployeeDashboardContent() {
  const router = useRouter()
  const { signOut, userRole } = useAuth()

  const [data, setData] = useState<MeData | null>(null)
  const [riskHistory, setRiskHistory] = useState<RiskHistoryPoint[]>([])
  const [skillsData, setSkillsData] = useState<TalentScoutData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const meData = await api.get<MeData>("/me")
      setData(meData)

      if (meData?.user?.user_hash) {
        try {
          const historyResponse = await api.get<any>(`/me/risk-history`)
          const historyData = Array.isArray(historyResponse) ? historyResponse : (historyResponse?.history || [])
          setRiskHistory(historyData.map((p: any) => ({ ...p, risk_level: toRiskLevel(p.risk_level) })))
        } catch {
          const fallbackHistory = await getRiskHistory(meData.user.user_hash, 14)
          setRiskHistory(fallbackHistory.map((p: any) => ({ ...p, risk_level: toRiskLevel(p.risk_level) })))
        }

        try {
          const talentData = await getNetworkAnalysis(meData.user.user_hash)
          setSkillsData(talentData)
        } catch {
          // talent data fetch failed
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load your dashboard")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const updateConsent = async (type: "manager" | "anonymized", value: boolean) => {
    if (!data) return
    try {
      setUpdating(true)
      const payload = type === "manager"
        ? { consent_share_with_manager: value }
        : { consent_share_anonymized: value }
      await api.put("/me/consent", payload)
      await fetchData()
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to update consent")
    } finally {
      setUpdating(false)
    }
  }

  const pauseMonitoring = async (hours: number) => {
    if (!data) return
    try {
      setUpdating(true)
      await api.post(`/me/pause-monitoring?hours=${hours}`, {})
      await fetchData()
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to pause monitoring")
    } finally {
      setUpdating(false)
    }
  }

  const resumeMonitoring = async () => {
    if (!data) return
    try {
      setUpdating(true)
      await api.post("/me/resume-monitoring", {})
      await fetchData()
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to resume monitoring")
    } finally {
      setUpdating(false)
    }
  }

  // ── Derived values ──────────────────────────────────────────────────────────

  const currentRisk = data?.risk?.risk_level
    ? riskConfig[toRiskLevel(data.risk.risk_level)]
    : riskConfig.LOW

  const velocity = data?.risk?.velocity ?? null
  const confidence = data?.risk?.confidence ?? null
  const belongingness = data?.risk?.thwarted_belongingness != null
    ? Math.round(data.risk.thwarted_belongingness * 100)
    : null

  const burnoutPercent = data?.risk?.risk_level === "CRITICAL"
    ? 82
    : data?.risk?.risk_level === "ELEVATED"
    ? 54
    : 22

  // Chart data
  let chartData = riskHistory.map((p, i) => ({
    day: `D${i + 1}`,
    velocity: p.velocity || 0,
    risk: p.risk_level === "CRITICAL" ? 100 : p.risk_level === "ELEVATED" ? 60 : 30,
    belonging: p.belongingness_score ? p.belongingness_score * 100 : 50,
  })).reverse()

  if (chartData.length === 0) {
    const dv = [42, 55, 48, 63, 51, 44, 58, 67, 53, 46, 61, 49, 57, 52]
    const dr = [30, 30, 60, 60, 30, 30, 60, 100, 60, 30, 60, 30, 60, 30]
    const db = [72, 68, 65, 61, 58, 62, 55, 50, 53, 57, 52, 56, 54, 58]
    chartData = Array.from({ length: 14 }, (_, i) => ({
      day: `D${i + 1}`,
      velocity: dv[i],
      risk: dr[i],
      belonging: db[i],
    }))
  }

  // Derived skills from network data
  const clamp = (v: number) => Math.max(0, Math.min(100, v))
  const userNode = skillsData?.nodes?.find(n => n.id === data?.user?.user_hash)
  const maxUnblocking = Math.max(1, ...(skillsData?.nodes ?? []).map(n => n.unblocking_count ?? 0))
  const derivedSkills = {
    technical: userNode ? clamp((userNode.betweenness ?? 0) * 100) : 0,
    leadership: userNode ? clamp((userNode.eigenvector ?? 0) * 100) : 0,
    collaboration: userNode ? clamp(((userNode.unblocking_count ?? 0) / maxUnblocking) * 100) : 0,
    communication: 0,
    adaptability: 0,
    creativity: 0,
  }

  const displayName = data?.user?.name || "My Dashboard"
  const displayRole = data?.user?.role || "Employee"

  // ── Loading ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 border-4 border-accent/30 border-t-accent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground text-sm">Loading your dashboard…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card border border-destructive/20 rounded-xl p-6 max-w-md w-full">
          <div className="flex items-center gap-3 mb-3">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <h2 className="font-semibold text-foreground">Error Loading Dashboard</h2>
          </div>
          <p className="text-muted-foreground text-sm mb-4">{error}</p>
          <Button onClick={fetchData} variant="outline" size="sm">Try Again</Button>
        </div>
      </div>
    )
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <ScrollArea className="flex-1">
      <div className="min-h-screen bg-background text-foreground p-4 lg:p-6">
        <div className="max-w-[1400px] mx-auto space-y-5">

          {/* ── Hero Card ────────────────────────────────────────────────── */}
          <div className="bg-card border border-white/5 rounded-xl p-6">
            <div className="flex flex-col lg:flex-row lg:items-center gap-6">

              {/* Avatar + Identity */}
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="relative shrink-0">
                  <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xl font-bold font-['Manrope',sans-serif] shadow-lg">
                    {data?.user?.name ? getInitials(data.user.name) : "ME"}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-accent border-2 border-card animate-pulse" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-2xl font-bold font-['Manrope',sans-serif] text-foreground truncate">{displayName}</h1>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-sm text-muted-foreground">{displayRole}</span>
                    <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                    <span className="text-xs bg-primary/10 text-primary border border-primary/20 rounded-full px-2 py-0.5 font-medium">
                      Engineering
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="flex items-center gap-1.5 text-xs text-accent font-medium">
                      <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                      Monitoring Active
                    </span>
                    <span className={cn("text-xs font-medium rounded-full px-2 py-0.5", currentRisk.pillClass)}>
                      {currentRisk.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick-stat pills */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:shrink-0">
                {[
                  { label: "Wellbeing", value: velocity != null ? velocity.toFixed(0) : "--", color: currentRisk.color },
                  { label: "Velocity", value: velocity != null ? velocity.toFixed(1) : "--", color: "text-primary" },
                  { label: "Network", value: userNode ? `${((userNode.betweenness ?? 0) * 100).toFixed(0)}%` : "--", color: "text-[hsl(var(--sentinel-info))]" },
                  { label: "Collaboration", value: derivedSkills.collaboration > 0 ? `${derivedSkills.collaboration.toFixed(0)}%` : "--", color: "text-accent" },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-center">
                    <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                    <p className={cn("text-lg font-bold", stat.color)}>{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Monitoring toggle */}
              <div className="shrink-0">
                {data?.monitoring_status?.is_paused ? (
                  <Button
                    onClick={resumeMonitoring}
                    size="sm"
                    variant="outline"
                    disabled={updating}
                    className="border-accent/30 text-accent hover:bg-accent/10 transition-[color,background-color,border-color,transform] duration-150 active:scale-[0.97]"
                  >
                    <PlayCircle className="h-4 w-4 mr-2" />
                    Resume
                  </Button>
                ) : (
                  <Button
                    onClick={() => pauseMonitoring(24)}
                    size="sm"
                    variant="outline"
                    disabled={updating}
                    className="border-white/10 text-muted-foreground hover:bg-white/5 transition-[color,background-color,border-color,transform] duration-150 active:scale-[0.97]"
                  >
                    <PauseCircle className="h-4 w-4 mr-2" />
                    Pause 24h
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* ── Main 3-column grid ──────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_340px] gap-5">

            {/* ─ Col 1 ─────────────────────────────────────────────────── */}
            <div className="space-y-5">

              {/* Burnout Analysis */}
              <div className="bg-[hsl(var(--sentinel-elevated))]/10 border border-[hsl(var(--sentinel-elevated))]/20 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Flame className="h-4 w-4 text-[hsl(var(--sentinel-elevated))]" />
                  Burnout Analysis
                </h3>
                <div className="flex items-center gap-5">
                  <div className="relative shrink-0">
                    <RiskRing
                      value={burnoutPercent}
                      color={
                        burnoutPercent > 70
                          ? "hsl(var(--destructive))"
                          : burnoutPercent > 40
                          ? "hsl(var(--sentinel-elevated))"
                          : "hsl(var(--accent))"
                      }
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className={cn(
                        "text-2xl font-bold font-mono",
                        burnoutPercent > 70 ? "text-destructive" : burnoutPercent > 40 ? "text-[hsl(var(--sentinel-elevated))]" : "text-accent"
                      )}>
                        {burnoutPercent}%
                      </span>
                      <span className="text-[10px] text-muted-foreground">Risk</span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-3">
                    {[
                      { label: "Work velocity", severity: Math.min(velocity ?? 50, 100), color: velocity && velocity > 60 ? "bg-[hsl(var(--sentinel-elevated))]" : "bg-accent" },
                      { label: "Connection gap", severity: belongingness ?? 50, color: "bg-primary" },
                      { label: "Recovery time", severity: 30, color: "bg-accent" },
                    ].map((factor) => (
                      <div key={factor.label}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <span className={cn("h-1.5 w-1.5 rounded-full", factor.color)} />
                            {factor.label}
                          </span>
                          <span className="text-xs font-mono text-foreground">{factor.severity.toFixed(0)}</span>
                        </div>
                        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                          <div className={cn("h-full rounded-full transition-all duration-500", factor.color)} style={{ width: `${factor.severity}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-4 flex items-center gap-1.5">
                  {currentRisk.icon}
                  <span className={currentRisk.color}>{currentRisk.description}</span>
                </p>
              </div>

              {/* AI Recommendation */}
              <div className="bg-card border border-white/5 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-7 w-7 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center text-white text-xs font-bold">
                    S
                  </div>
                  <span className="text-sm font-medium text-foreground">Sentinel Insight</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse ml-auto" />
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed mb-4">
                  {getDynamicSuggestions(data?.risk?.risk_level || "LOW", velocity ?? 0)[0]?.description ||
                    "Your patterns look good today. Consider sharing your knowledge in today's standup."}
                </p>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    size="sm"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground transition-[color,background-color,border-color,transform] duration-150 active:scale-[0.97]"
                    onClick={async () => {
                      if (!data?.user?.user_hash) return
                      // Open window synchronously in click handler (before async gap)
                      const calendarWindow = window.open("about:blank", "_blank")
                      try {
                        const result = await scheduleBreak(data.user.user_hash)
                        if (result?.calendar_link && calendarWindow) {
                          calendarWindow.location.href = result.calendar_link
                        } else if (calendarWindow) {
                          calendarWindow.close()
                        }
                        toast.success("Check-in scheduled!")
                      } catch {
                        calendarWindow?.close()
                        toast.error("Failed to schedule check-in")
                      }
                    }}
                  >
                    Schedule Check-in
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border border-white/10 hover:border-primary/30 text-muted-foreground hover:text-foreground transition-[color,background-color,border-color,transform] duration-150 active:scale-[0.97]"
                  >
                    <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                    Ask Copilot
                  </Button>
                </div>
              </div>

              {/* Privacy Controls */}
              <div className="bg-card border border-white/5 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-accent" />
                  Privacy Controls
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                    <div>
                      <p className="text-sm font-medium text-foreground">Share with Manager</p>
                      <p className="text-xs text-muted-foreground">Allow manager to see your insights</p>
                    </div>
                    <Switch
                      checked={data?.user?.consent_share_with_manager || false}
                      onCheckedChange={(v) => updateConsent("manager", v)}
                      disabled={updating}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                    <div>
                      <p className="text-sm font-medium text-foreground">Anonymous Data</p>
                      <p className="text-xs text-muted-foreground">Include in team aggregates</p>
                    </div>
                    <Switch
                      checked={data?.user?.consent_share_anonymized || false}
                      onCheckedChange={(v) => updateConsent("anonymized", v)}
                      disabled={updating}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ─ Col 2 ─────────────────────────────────────────────────── */}
            <div className="space-y-5">

              {/* Skills Assessment */}
              <div className="bg-card border border-white/5 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Brain className="h-4 w-4 text-primary" />
                  Skills Assessment
                </h3>
                {skillsData ? (
                  <div className="flex justify-center mb-4">
                    <SkillsRadar data={derivedSkills} height={220} />
                  </div>
                ) : null}
                <div className="space-y-3">
                  {[
                    { label: "Technical", value: derivedSkills.technical, color: "bg-primary" },
                    { label: "Leadership", value: derivedSkills.leadership, color: "bg-accent" },
                    { label: "Collaboration", value: derivedSkills.collaboration, color: "bg-[hsl(var(--sentinel-info))]" },
                    { label: "Communication", value: derivedSkills.communication, color: "bg-[hsl(var(--sentinel-gem))]" },
                    { label: "Innovation", value: derivedSkills.creativity, color: "bg-[hsl(var(--sentinel-elevated))]" },
                  ].map((skill) => (
                    <div key={skill.label} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-24 shrink-0">{skill.label}</span>
                      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all duration-500", skill.color)}
                          style={{ width: `${skill.value || 20}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono text-foreground w-8 text-right">{skill.value > 0 ? `${skill.value.toFixed(0)}%` : "--"}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Work Patterns Heatmap */}
              <div className="bg-card border border-white/5 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-[hsl(var(--sentinel-info))]" />
                  Work Patterns
                </h3>
                <div className="overflow-x-auto">
                  <div className="flex gap-0.5 mb-1">
                    {DAYS.map((d, i) => (
                      <div key={i} className="w-6 text-center text-[10px] text-muted-foreground">{d}</div>
                    ))}
                  </div>
                  {Array.from({ length: 12 }, (_, hourIdx) => (
                    <div key={hourIdx} className="flex items-center gap-0.5 mb-0.5">
                      {DAYS.map((_, dayIdx) => {
                        const type = cellType(dayIdx, hourIdx)
                        return (
                          <div
                            key={dayIdx}
                            className={cn(
                              "h-3 w-6 rounded-sm transition-colors",
                              type === "peak" ? "bg-accent/70" :
                              type === "extended" ? "bg-[hsl(var(--sentinel-elevated))]/60" :
                              "bg-white/5"
                            )}
                            title={`${DAYS[dayIdx]} ${9 + hourIdx}:00`}
                          />
                        )
                      })}
                      <span className="text-[9px] text-muted-foreground ml-1">{9 + hourIdx}h</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-3 mt-3">
                    {[
                      { color: "bg-accent/70", label: "Peak" },
                      { color: "bg-[hsl(var(--sentinel-elevated))]/60", label: "Extended" },
                      { color: "bg-white/5", label: "Off" },
                    ].map((l) => (
                      <span key={l.label} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <span className={cn("h-2 w-2 rounded-sm", l.color)} />
                        {l.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Burnout Trend Chart */}
              <div className="bg-card border border-white/5 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-[hsl(var(--sentinel-elevated))]" />
                    14-Day Trend
                  </h3>
                  <div className="flex gap-2">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-destructive" /> Risk
                    </span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Velocity
                    </span>
                  </div>
                </div>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="velGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis dataKey="day" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} stroke="transparent" tickLine={false} />
                      <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} stroke="transparent" tickLine={false} axisLine={false} />
                      <Tooltip content={<GlassTooltip />} />
                      <Area type="monotone" dataKey="risk" stroke="hsl(var(--destructive))" fill="url(#riskGrad)" strokeWidth={2} name="Risk" />
                      <Area type="monotone" dataKey="velocity" stroke="hsl(var(--accent))" fill="url(#velGrad)" strokeWidth={2} name="Velocity" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* ─ Col 3 ─────────────────────────────────────────────────── */}
            <div className="space-y-5">

              {/* Network Position */}
              <div className="bg-card border border-white/5 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Network className="h-4 w-4 text-[hsl(var(--sentinel-info))]" />
                  Network Position
                </h3>
                {/* Simple SVG node diagram */}
                <div className="flex justify-center mb-3">
                  <svg width="160" height="120" viewBox="0 0 160 120">
                    {/* Edges */}
                    <line x1="80" y1="60" x2="30" y2="30" stroke="hsl(var(--border))" strokeWidth="1.5" />
                    <line x1="80" y1="60" x2="130" y2="30" stroke="hsl(var(--border))" strokeWidth="1.5" />
                    <line x1="80" y1="60" x2="20" y2="85" stroke="hsl(var(--border))" strokeWidth="1.5" />
                    <line x1="80" y1="60" x2="140" y2="85" stroke="hsl(var(--border))" strokeWidth="1.5" />
                    <line x1="80" y1="60" x2="80" y2="105" stroke="hsl(var(--border))" strokeWidth="1.5" />
                    {/* Peer nodes */}
                    {[[30, 30], [130, 30], [20, 85], [140, 85], [80, 105]].map(([cx, cy], i) => (
                      <circle key={i} cx={cx} cy={cy} r="8" fill="hsl(var(--muted))" stroke="hsl(var(--border))" strokeWidth="1.5" />
                    ))}
                    {/* Self node */}
                    <circle cx="80" cy="60" r="14" fill="hsl(var(--primary)/0.2)" stroke="hsl(var(--primary))" strokeWidth="2" />
                    <text x="80" y="64" textAnchor="middle" fontSize="8" fill="hsl(var(--primary))" fontWeight="bold">YOU</text>
                  </svg>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/5">
                  <span className="text-xs text-muted-foreground">Centrality Score</span>
                  <span className="text-sm font-bold text-[hsl(var(--sentinel-info))] font-mono">
                    {userNode ? `${((userNode.betweenness ?? 0) * 100).toFixed(1)}%` : "--"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                  You act as a bridge between {userNode?.unblocking_count ?? 0} team sub-groups,
                  increasing information flow across the organization.
                </p>
              </div>

              {/* Activity Timeline */}
              <div className="bg-card border border-white/5 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Activity Timeline
                </h3>
                <div className="relative pl-4">
                  <div className="absolute left-0 top-0 bottom-0 border-l border-white/5" />
                  <div className="space-y-4">
                    {timelineEvents.map((event, idx) => (
                      <div key={idx} className="relative flex items-start gap-3">
                        <div className="absolute -left-[21px] h-3 w-3 rounded-full bg-card border border-white/10 flex items-center justify-center">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                        </div>
                        <div className={cn("p-1.5 rounded-md bg-white/5 shrink-0", event.color)}>
                          <event.icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-foreground leading-snug">{event.label}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{event.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Ask Sentinel */}
              <div className="bg-card border border-white/5 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-accent" />
                  Ask Sentinel
                </h3>
                <AskSentinelWidget />
              </div>
            </div>
          </div>
        </div>
      </div>
    </ScrollArea>
  )
}

export default function EmployeePage() {
  return (
    <ProtectedRoute allowedRoles={["employee", "manager", "admin"]}>
      <EmployeeDashboardContent />
    </ProtectedRoute>
  )
}
