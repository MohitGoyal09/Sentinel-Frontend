"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Activity,
  Shield,
  Trash2,
  AlertTriangle,
  EyeOff,
  History,
  Radio,
  PauseCircle,
  PlayCircle,
  TrendingUp,
  ShieldCheck,
  Zap,
  Brain,
  Target,
  LogOut,
  LayoutDashboard,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/contexts/auth-context"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"

// AI & Charts
import { RiskNarrative } from "@/components/ai/RiskNarrative"
import { SkillsRadar } from "@/components/skills-radar"
import { VelocityChart } from "@/components/velocity-chart"
import { NudgeCard } from "@/components/nudge-card"

// Hooks
import { useRiskHistory } from "@/hooks/useRiskHistory"
import { useNudge } from "@/hooks/useNudge"

// API client
import { api } from "@/lib/api"
import { HistoryPoint } from "@/types"

interface UserProfile {
  user_hash: string
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

interface AuditEntry {
  action: string
  timestamp: string
  details: any
}

interface MeData {
  user: UserProfile
  risk: RiskData | null
  audit_trail: AuditEntry[]
  monitoring_status: MonitoringStatus
}

// ─── Risk level config ─────────────────────────────────
const riskConfig: Record<string, {
  label: string
  color: string
  badgeClass: string
}> = {
  CRITICAL: {
    label: "Critical",
    color: "hsl(var(--sentinel-critical))",
    badgeClass: "risk-badge-critical",
  },
  ELEVATED: {
    label: "Elevated",
    color: "hsl(var(--sentinel-elevated))",
    badgeClass: "risk-badge-elevated",
  },
  LOW: {
    label: "Healthy",
    color: "hsl(var(--sentinel-healthy))",
    badgeClass: "risk-badge-low",
  },
}

function getRisk(level: string | undefined) {
  return riskConfig[level || "LOW"] || riskConfig.LOW
}

export default function MePage() {
  return (
    <ProtectedRoute>
      <MePageContent />
    </ProtectedRoute>
  )
}

function MePageContent() {
  const router = useRouter()
  const { signOut } = useAuth()
  const [data, setData] = useState<MeData | null>(null)
  const [isDataLoading, setIsDataLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState("")

  const { history, isLoading: isHistoryLoading } = useRiskHistory(data?.user?.user_hash || null)
  const { data: nudgeData } = useNudge(data?.user?.user_hash || null)

  useEffect(() => {
    fetchMeData()
  }, [])

  const fetchMeData = async () => {
    try {
      setIsDataLoading(true)
      const data = await api.get<MeData>('/me')
      if (data && data.user) {
        setData(data)
        setError(null)
      } else {
        setError("Failed to load your data")
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load your data")
    } finally {
      setIsDataLoading(false)
    }
  }

  const updateConsent = async (type: "manager" | "anonymized", value: boolean) => {
    try {
      setUpdating(true)
      const payload = type === "manager"
        ? { consent_share_with_manager: value }
        : { consent_share_anonymized: value }

      await api.put("/me/consent", payload)
      await fetchMeData()
      setError(null)
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to update consent")
    } finally {
      setUpdating(false)
    }
  }

  const pauseMonitoring = async (hours: number) => {
    try {
      setUpdating(true)
      await api.post(`/me/pause-monitoring?hours=${hours}`, {})
      await fetchMeData()
      setError(null)
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to pause monitoring")
    } finally {
      setUpdating(false)
    }
  }

  const resumeMonitoring = async () => {
    try {
      setUpdating(true)
      await api.post("/me/resume-monitoring", {})
      await fetchMeData()
      setError(null)
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to resume monitoring")
    } finally {
      setUpdating(false)
    }
  }

  const deleteAllData = async () => {
    if (deleteConfirmText !== "DELETE") {
      setError("Please type DELETE to confirm")
      return
    }
    try {
      setUpdating(true)
      await api.delete("/me/data?confirm=true")
      await signOut()
      router.push("/login")
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to delete data")
      setUpdating(false)
    }
  }

  const mockSkillsData = {
    technical: 85,
    communication: 72,
    leadership: 65,
    collaboration: 90,
    adaptability: 80,
    creativity: 75,
    updated_at: new Date().toISOString()
  }

  // ─── Loading State ──────────────────────────────────────
  if (isDataLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div
            className="mx-auto mb-3 h-8 w-8 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: "hsl(var(--sentinel-healthy))", borderTopColor: "transparent" }}
          />
          <p className="text-sm text-muted-foreground">Loading your wellbeing data...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="glass-card rounded-xl p-6 text-center max-w-sm">
          <AlertTriangle className="mx-auto mb-3 h-6 w-6" style={{ color: "hsl(var(--sentinel-critical))" }} />
          <h3 className="text-base font-semibold text-foreground mb-1">Something went wrong</h3>
          <p className="text-sm text-muted-foreground">{error || "Failed to load data"}</p>
        </div>
      </div>
    )
  }

  const risk = getRisk(data.risk?.risk_level)

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-14 items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{
                background: "hsl(var(--primary) / 0.1)",
                border: "1px solid hsl(var(--primary) / 0.2)",
              }}
            >
              <Shield className="h-4 w-4" style={{ color: "hsl(var(--primary))" }} />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-foreground leading-tight">My Wellbeing</h1>
              <div className="flex items-center gap-1.5">
                <span
                  className="h-1.5 w-1.5 rounded-full animate-pulse"
                  style={{ background: "hsl(var(--sentinel-healthy))" }}
                />
                <p className="text-[10px] font-mono text-muted-foreground leading-none">
                  Live
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="hidden md:inline-flex text-[10px] h-5 capitalize font-mono"
              style={{ borderColor: "hsl(var(--border))" }}
            >
              {data.user.role}
            </Badge>

            <Separator orientation="vertical" className="h-5" />

            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/engines")}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              <LayoutDashboard className="h-3.5 w-3.5 mr-1.5" />
              Dashboard
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              <LogOut className="h-3.5 w-3.5 mr-1.5" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

        {/* Error Alert */}
        {error && (
          <div
            className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm"
            style={{
              border: "1px solid hsl(var(--destructive) / 0.2)",
              background: "hsl(var(--destructive) / 0.08)",
              color: "hsl(var(--destructive))",
            }}
          >
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <p className="font-medium flex-1">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-xs hover:underline opacity-70 hover:opacity-100 transition-opacity duration-200"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ─── Metric Cards ─── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Risk */}
          <div className="metric-card">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Risk Level</p>
              <Activity className="h-3.5 w-3.5 text-muted-foreground/50" />
            </div>
            <div
              className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${risk.badgeClass}`}
            >
              {data.risk?.risk_level || "CALCULATING"}
            </div>
          </div>

          {/* Velocity */}
          <div className="metric-card">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Velocity</p>
              <Zap className="h-3.5 w-3.5" style={{ color: "hsl(var(--primary) / 0.5)" }} />
            </div>
            <p className="text-xl font-semibold text-foreground font-mono tabular-nums">
              {data.risk?.velocity?.toFixed(2) || "0.00"}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              pts / week
            </p>
          </div>

          {/* Belongingness */}
          <div className="metric-card">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Belonging</p>
              <ShieldCheck className="h-3.5 w-3.5" style={{ color: "hsl(var(--sentinel-healthy) / 0.5)" }} />
            </div>
            <p className="text-xl font-semibold text-foreground font-mono tabular-nums">
              {data.risk?.thwarted_belongingness
                ? ((1 - data.risk.thwarted_belongingness) * 100).toFixed(0)
                : "\u2014"}
              <span className="text-sm text-muted-foreground ml-0.5">%</span>
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              team integration
            </p>
          </div>

          {/* Confidence */}
          <div className="metric-card">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Confidence</p>
              <Brain className="h-3.5 w-3.5" style={{ color: "hsl(var(--sentinel-info) / 0.5)" }} />
            </div>
            <p className="text-xl font-semibold text-foreground font-mono tabular-nums">
              {((data.risk?.confidence || 0) * 100).toFixed(0)}
              <span className="text-sm text-muted-foreground ml-0.5">%</span>
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              model certainty
            </p>
          </div>
        </div>

        {/* ─── Main Grid ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">

            {/* Risk History Chart */}
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" style={{ color: "hsl(var(--primary))" }} />
                Burnout Risk History
              </h2>
              {isHistoryLoading ? (
                <div className="glass-card rounded-xl">
                  <div className="flex h-48 items-center justify-center">
                    <div
                      className="h-5 w-5 animate-spin rounded-full border-2 border-t-transparent"
                      style={{ borderColor: "hsl(var(--primary))", borderTopColor: "transparent" }}
                    />
                  </div>
                </div>
              ) : (
                <VelocityChart history={history as HistoryPoint[]} title="Work Velocity vs. Belongingness (30 Days)" />
              )}
            </section>

            {/* Skills & Narrative */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <section className="space-y-3">
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Target className="h-4 w-4" style={{ color: "hsl(var(--sentinel-info))" }} />
                  Skill Topology
                </h2>
                <div className="glass-card rounded-xl p-4">
                  <SkillsRadar data={mockSkillsData} height={240} />
                </div>
              </section>

              <section className="space-y-3">
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Brain className="h-4 w-4" style={{ color: "hsl(var(--primary))" }} />
                  Risk Analysis
                </h2>
                {data.user && (
                  <RiskNarrative
                    userHash={data.user.user_hash}
                    timeRange={14}
                    className="h-full"
                  />
                )}
              </section>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-5">

            {/* Suggestions */}
            <section className="space-y-3">
              <h2
                className="text-sm font-semibold flex items-center gap-2"
                style={{ color: "hsl(var(--sentinel-elevated))" }}
              >
                <Zap className="h-4 w-4" />
                Suggestions
              </h2>
              {nudgeData ? (
                <NudgeCard nudge={nudgeData} />
              ) : (
                <div className="glass-card rounded-xl">
                  <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
                    <Brain className="h-6 w-6 mb-2 opacity-20" />
                    <p className="text-xs">No active suggestions.</p>
                  </div>
                </div>
              )}
            </section>

            {/* Monitoring */}
            <div className="glass-card rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b" style={{ borderColor: "hsl(var(--border) / 0.4)" }}>
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Radio className="h-3.5 w-3.5" style={{ color: "hsl(var(--sentinel-gem))" }} />
                  Monitoring
                </div>
              </div>
              <div className="p-4 space-y-4">
                {data.monitoring_status.is_paused ? (
                  <div
                    className="rounded-lg px-3 py-2.5"
                    style={{
                      background: "hsl(var(--sentinel-elevated) / 0.08)",
                      border: "1px solid hsl(var(--sentinel-elevated) / 0.15)",
                    }}
                  >
                    <div className="flex items-center gap-1.5 mb-1" style={{ color: "hsl(var(--sentinel-elevated))" }}>
                      <PauseCircle className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Paused</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Resumes: {new Date(data.monitoring_status.paused_until!).toLocaleString()}
                    </p>
                  </div>
                ) : (
                  <div
                    className="rounded-lg px-3 py-2.5"
                    style={{
                      background: "hsl(var(--sentinel-healthy) / 0.08)",
                      border: "1px solid hsl(var(--sentinel-healthy) / 0.15)",
                    }}
                  >
                    <div className="flex items-center gap-1.5 mb-1" style={{ color: "hsl(var(--sentinel-healthy))" }}>
                      <PlayCircle className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Active</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Analyzing work patterns.
                    </p>
                  </div>
                )}

                <div>
                  <Label className="text-[10px] uppercase font-medium text-muted-foreground mb-2 block">
                    Quick Pause
                  </Label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[8, 24, 72].map((hours) => (
                      <Button
                        key={hours}
                        variant="outline"
                        size="sm"
                        disabled={updating || data.monitoring_status.is_paused}
                        onClick={() => pauseMonitoring(hours)}
                        className="text-xs h-7 font-mono transition-all duration-200"
                      >
                        {hours}h
                      </Button>
                    ))}
                  </div>
                </div>

                {data.monitoring_status.is_paused && (
                  <Button
                    onClick={resumeMonitoring}
                    className="w-full h-7 text-xs transition-all duration-200"
                    variant="secondary"
                  >
                    Resume Now
                  </Button>
                )}
              </div>
            </div>

            {/* Privacy */}
            <div className="glass-card rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b" style={{ borderColor: "hsl(var(--border) / 0.4)" }}>
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <ShieldCheck className="h-3.5 w-3.5" style={{ color: "hsl(var(--sentinel-info))" }} />
                  Privacy
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-medium">Manager Access</Label>
                    <p className="text-[10px] text-muted-foreground">Allow detailed view</p>
                  </div>
                  <Switch
                    checked={data.user.consent_share_with_manager}
                    onCheckedChange={(c) => updateConsent("manager", c)}
                    disabled={updating}
                  />
                </div>
                <Separator className="opacity-40" />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-medium">Team Analytics</Label>
                    <p className="text-[10px] text-muted-foreground">Include anonymized data</p>
                  </div>
                  <Switch
                    checked={data.user.consent_share_anonymized}
                    onCheckedChange={(c) => updateConsent("anonymized", c)}
                    disabled={updating}
                  />
                </div>
              </div>
            </div>

            {/* Delete Data */}
            <div className="pt-2">
              <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs transition-all duration-200"
                    style={{ color: "hsl(var(--destructive) / 0.7)" }}
                  >
                    <Trash2 className="h-3 w-3 mr-2" />
                    Delete all personal data
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle style={{ color: "hsl(var(--destructive))" }}>
                      Irreversible Action
                    </DialogTitle>
                    <DialogDescription>
                      This will permanently delete your identity, risk scores, and history.
                      Type <strong>DELETE</strong> to confirm.
                    </DialogDescription>
                  </DialogHeader>
                  <input
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow duration-200"
                    placeholder="Type DELETE"
                  />
                  <DialogFooter>
                    <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
                    <Button variant="destructive" onClick={deleteAllData} disabled={updating || deleteConfirmText !== "DELETE"}>
                      {updating ? "Deleting..." : "Confirm Delete"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

          </div>
        </div>

        {/* Audit Trail */}
        <section className="mt-6">
          <Separator className="mb-6 opacity-20" />
          <div className="flex items-center gap-2 text-muted-foreground mb-4">
            <History className="h-3.5 w-3.5" />
            <h3 className="text-xs font-medium uppercase tracking-wider">Access Audit Trail</h3>
          </div>
          <ScrollArea className="h-[180px] rounded-xl glass-subtle p-3">
            {data.audit_trail.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground/40">
                <EyeOff className="h-6 w-6 mb-2" />
                <p className="text-xs">No recent access logs.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {data.audit_trail.map((log, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg transition-all duration-200 hover:bg-white/[0.03]"
                  >
                    <div className="flex items-center gap-3">
                      <Badge
                        variant="outline"
                        className="text-[10px] font-mono opacity-60 h-4 px-1.5"
                      >
                        {new Date(log.timestamp).toLocaleDateString()}
                      </Badge>
                      <span className="font-medium text-foreground/90">
                        {log.action.replace(/_/g, " ")}
                      </span>
                    </div>
                    <span className="font-mono text-muted-foreground text-[10px] truncate max-w-[240px] opacity-60">
                      {JSON.stringify(log.details)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </section>

      </main>
    </div>
  )
}
