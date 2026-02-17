"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Activity,
  Shield,
  Clock,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  EyeOff,
  Eye,
  History,
  LayoutDashboard,
  Gauge,
  Radio,
  PauseCircle,
  PlayCircle,
  TrendingUp,
  ShieldCheck,
  Fingerprint,
  Timer,
  Waves,
  LogOut,
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
import { RiskNarrative } from "@/components/ai/RiskNarrative"

// API client
import { api } from "@/lib/api"
import { APIResponse } from "@/types"

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

// ─── Utility: Risk level colors + glow ────────────────────────
const riskConfig: Record<string, { label: string; color: string; glow: string; bgClass: string; accentClass: string }> = {
  CRITICAL: {
    label: "Critical",
    color: "hsl(var(--sentinel-critical))",
    glow: "var(--glow-critical)",
    bgClass: "bg-red-500/10",
    accentClass: "glass-card-accent--critical",
  },
  ELEVATED: {
    label: "Elevated",
    color: "hsl(var(--sentinel-elevated))",
    glow: "var(--glow-elevated)",
    bgClass: "bg-amber-500/10",
    accentClass: "glass-card-accent--elevated",
  },
  LOW: {
    label: "Healthy",
    color: "hsl(var(--sentinel-healthy))",
    glow: "var(--glow-healthy)",
    bgClass: "bg-emerald-500/10",
    accentClass: "glass-card-accent--healthy",
  },
  CALIBRATING: {
    label: "Calibrating",
    color: "hsl(var(--muted-foreground))",
    glow: "none",
    bgClass: "bg-muted/30",
    accentClass: "",
  },
}

function getRisk(level: string | undefined) {
  return riskConfig[level || "CALIBRATING"] || riskConfig.CALIBRATING
}

function MePageContent() {
  const router = useRouter()
  const { signOut } = useAuth()
  const [data, setData] = useState<MeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState("")

  useEffect(() => {
    fetchMeData()
  }, [])

  const fetchMeData = async () => {
    try {
      setLoading(true)
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
      setLoading(false)
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

  // ─── Loading State ──────────────────────────────────────
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-3 h-10 w-10 rounded-full border-2 border-[hsl(var(--sentinel-healthy))] border-t-transparent animate-spin" />
          <p className="text-sm font-medium text-muted-foreground">Loading your wellbeing data…</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="glass-card rounded-xl p-8 text-center max-w-md">
          <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-[hsl(var(--sentinel-critical))]" />
          <h3 className="text-lg font-semibold text-foreground mb-1">Something went wrong</h3>
          <p className="text-sm text-muted-foreground">{error || "Failed to load data"}</p>
        </div>
      </div>
    )
  }

  const risk = getRisk(data.risk?.risk_level)
  const memberSince = data.user.created_at
    ? new Date(data.user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "Unknown"

  return (
    <div className="flex flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-[15px] font-semibold tracking-tight text-foreground">My Wellbeing</h1>
              <p className="text-[10px] font-mono text-muted-foreground leading-none mt-0.5">
                ID: {data.user.user_hash.slice(0, 8)}… · Member since {memberSince}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="capitalize text-[10px] border-[var(--glass-border)] bg-[var(--glass-bg)]"
            >
              {data.user.role}
            </Badge>
            <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
              Dashboard
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-1" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* ═══════════ MAIN ═══════════ */}
      <main className="container mx-auto px-5 py-8 view-transition-enter">
        {/* Error alert */}
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-[hsl(var(--sentinel-critical)/0.3)] bg-[hsl(var(--sentinel-critical)/0.06)] px-5 py-3.5">
            <AlertTriangle className="h-4 w-4 shrink-0 text-[hsl(var(--sentinel-critical))]" />
            <p className="text-sm text-[hsl(var(--sentinel-critical))]">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-xs text-muted-foreground hover:text-foreground"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ─── Top Row: 4 Cards ─── */}
        <div className="grid gap-5 lg:grid-cols-4">

          {/* ══════ RISK LEVEL ══════ */}
          <div
            className={`glass-card glass-card-accent ${risk.accentClass} rounded-xl p-6`}
            style={{ boxShadow: risk.glow }}
          >
            <div className="flex items-center gap-2.5 mb-5">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-lg ${risk.bgClass}`}
              >
                <Gauge className="h-4 w-4" style={{ color: risk.color }} />
              </div>
              <div>
                <h2 className="text-[13px] font-semibold text-foreground">Current Risk Level</h2>
                <p className="text-[10px] text-muted-foreground">Based on your work patterns</p>
              </div>
            </div>

            <div
              className="text-3xl font-bold tracking-tight font-mono breathe"
              style={{ color: risk.color }}
            >
              {data.risk?.risk_level || "CALIBRATING"}
            </div>

            {data.risk && (
              <div className="mt-5 space-y-3">
                <MetricRow label="Velocity" value={data.risk.velocity?.toFixed(2) || "N/A"} />
                <MetricRow label="Confidence" value={`${(data.risk.confidence * 100).toFixed(0)}%`} />
                <MetricRow label="Belongingness" value={data.risk.thwarted_belongingness?.toFixed(2) || "N/A"} />
                {data.risk.updated_at && (
                  <p className="text-[10px] text-muted-foreground pt-1">
                    Last updated: {new Date(data.risk.updated_at).toLocaleString()}
                  </p>
                )}
              </div>
            )}

            {!data.risk && (
              <p className="mt-4 text-xs text-muted-foreground">
                We're gathering enough data to calculate your risk score. This usually takes a few days of activity.
              </p>
            )}
          </div>

          {/* ══════ RISK NARRATIVE ══════ */}
          {data.user && (
            <RiskNarrative 
              userHash={data.user.user_hash} 
              timeRange={14} 
              className="lg:col-span-1"
            />
          )}

          {/* ══════ PRIVACY CONTROLS ══════ */}
          <div className="glass-card rounded-xl p-6 flex flex-col">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[hsl(var(--sentinel-info)/0.1)]">
                <ShieldCheck className="h-4 w-4 text-[hsl(var(--sentinel-info))]" />
              </div>
              <div>
                <h2 className="text-[13px] font-semibold text-foreground">Privacy Controls</h2>
                <p className="text-[10px] text-muted-foreground">Manage who can see your data</p>
              </div>
            </div>

            <div className="space-y-5 flex-1">
              {/* Share with Manager */}
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <Label htmlFor="share-manager" className="text-[13px] font-medium text-foreground">
                    Share with Manager
                  </Label>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    Allow your manager to see your detailed metrics
                  </p>
                </div>
                <Switch
                  id="share-manager"
                  checked={data.user.consent_share_with_manager}
                  onCheckedChange={(checked) => updateConsent("manager", checked)}
                  disabled={updating}
                />
              </div>

              {/* Gradient divider */}
              <div className="h-px bg-gradient-to-r from-transparent via-[var(--glass-border)] to-transparent" />

              {/* Share Anonymized */}
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <Label htmlFor="share-anon" className="text-[13px] font-medium text-foreground">
                    Include in Team Analytics
                  </Label>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    Allow anonymized data in team metrics
                  </p>
                </div>
                <Switch
                  id="share-anon"
                  checked={data.user.consent_share_anonymized}
                  onCheckedChange={(checked) => updateConsent("anonymized", checked)}
                  disabled={updating}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="mt-5 flex items-start gap-2 rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3.5 py-2.5">
              <EyeOff className="h-3.5 w-3.5 shrink-0 text-muted-foreground mt-0.5" />
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Your privacy is our priority. No data is shared without your explicit consent.
              </p>
            </div>
          </div>

          {/* ══════ MONITORING ══════ */}
          <div className="glass-card rounded-xl p-6 flex flex-col">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[hsl(var(--sentinel-gem)/0.1)]">
                <Radio className="h-4 w-4 text-[hsl(var(--sentinel-gem))]" />
              </div>
              <div>
                <h2 className="text-[13px] font-semibold text-foreground">Monitoring</h2>
                <p className="text-[10px] text-muted-foreground">Control when you're being monitored</p>
              </div>
            </div>

            {/* Status Indicator */}
            {data.monitoring_status.is_paused ? (
              <div
                className="rounded-lg border border-[hsl(var(--sentinel-elevated)/0.2)] bg-[hsl(var(--sentinel-elevated)/0.06)] p-4 mb-4"
                style={{ boxShadow: "var(--glow-elevated)" }}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <PauseCircle className="h-4 w-4 text-[hsl(var(--sentinel-elevated))]" />
                  <span className="text-[13px] font-semibold text-[hsl(var(--sentinel-elevated))]">Monitoring Paused</span>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Resumes at{" "}
                  <span className="font-mono font-medium text-foreground">
                    {data.monitoring_status.paused_until &&
                      new Date(data.monitoring_status.paused_until).toLocaleString()}
                  </span>
                </p>
              </div>
            ) : (
              <div
                className="rounded-lg border border-[hsl(var(--sentinel-healthy)/0.2)] bg-[hsl(var(--sentinel-healthy)/0.06)] p-4 mb-4"
                style={{ boxShadow: "var(--glow-healthy)" }}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-[hsl(var(--sentinel-healthy))] opacity-75 animate-ping" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[hsl(var(--sentinel-healthy))]" />
                  </span>
                  <span className="text-[13px] font-semibold text-[hsl(var(--sentinel-healthy))]">Monitoring Active</span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Your work patterns are being analyzed for wellbeing insights. All data is encrypted and privacy-first.
                </p>
              </div>
            )}

            {/* What we monitor */}
            <div className="space-y-2 mb-4 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">What we track</p>
              <div className="grid grid-cols-2 gap-2">
                <MonitoringItem icon={<TrendingUp className="h-3 w-3" />} label="Work velocity" />
                <MonitoringItem icon={<Waves className="h-3 w-3" />} label="Communication flow" />
                <MonitoringItem icon={<Timer className="h-3 w-3" />} label="Work hours pattern" />
                <MonitoringItem icon={<Fingerprint className="h-3 w-3" />} label="Isolation signals" />
              </div>
            </div>

            {/* Quick Pause */}
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Quick Pause</p>
              <div className="flex gap-2">
                {[8, 24, 72].map((hours) => (
                  <button
                    key={hours}
                    onClick={() => pauseMonitoring(hours)}
                    disabled={updating || data.monitoring_status.is_paused}
                    className="flex-1 rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] py-2 text-[12px] font-medium text-muted-foreground transition-all hover:bg-[var(--glass-bg-hover)] hover:text-foreground hover:border-[var(--glass-border-hover)] disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {hours}h
                  </button>
                ))}
              </div>
            </div>

            {data.monitoring_status.is_paused && (
              <Button
                onClick={resumeMonitoring}
                disabled={updating}
                className="mt-3 w-full"
                size="sm"
              >
                <PlayCircle className="mr-2 h-4 w-4" />
                Resume Now
              </Button>
            )}
          </div>
        </div>

        {/* ─── Bottom Row: 2 Cards ─── */}
        <div className="mt-5 grid gap-5 lg:grid-cols-2">

          {/* ══════ AUDIT TRAIL ══════ */}
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="flex items-center gap-2.5 px-6 pt-6 pb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[hsl(var(--accent)/0.1)]">
                <History className="h-4 w-4 text-[hsl(var(--accent))]" />
              </div>
              <div>
                <h2 className="text-[13px] font-semibold text-foreground">Data Access History</h2>
                <p className="text-[10px] text-muted-foreground">See who accessed your data — last 30 days</p>
              </div>
            </div>
            <div className="px-6 pb-6">
              <ScrollArea className="h-[280px]">
                <div className="space-y-2.5">
                  {data.audit_trail.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <EyeOff className="h-8 w-8 text-muted-foreground/30 mb-3" />
                      <p className="text-sm font-medium text-muted-foreground">No access recorded</p>
                      <p className="text-[10px] text-muted-foreground/70 mt-1">
                        Your data hasn't been accessed in the last 30 days
                      </p>
                    </div>
                  ) : (
                    data.audit_trail.map((entry, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] p-3.5 transition-colors hover:bg-[var(--glass-bg-hover)]"
                      >
                        <div className="mt-0.5">
                          {entry.action.includes("data_access") ? (
                            <Eye className="h-3.5 w-3.5 text-[hsl(var(--sentinel-info))]" />
                          ) : entry.action.includes("consent") ? (
                            <ShieldCheck className="h-3.5 w-3.5 text-[hsl(var(--sentinel-healthy))]" />
                          ) : entry.action.includes("monitoring") ? (
                            <Radio className="h-3.5 w-3.5 text-[hsl(var(--sentinel-gem))]" />
                          ) : (
                            <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-medium text-foreground">
                            {entry.action.replace("data_access:", "").replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                          </p>
                          <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
                            {new Date(entry.timestamp).toLocaleString()}
                          </p>
                          {entry.details && (
                            <p className="text-[10px] text-muted-foreground/70 mt-1 truncate">
                              {JSON.stringify(entry.details)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* ══════ DANGER ZONE ══════ */}
          <div
            className="glass-card glass-card-accent glass-card-accent--critical rounded-xl overflow-hidden"
            style={{ boxShadow: "var(--glow-critical)" }}
          >
            <div className="flex items-center gap-2.5 px-6 pt-6 pb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10">
                <Trash2 className="h-4 w-4 text-[hsl(var(--sentinel-critical))]" />
              </div>
              <div>
                <h2 className="text-[13px] font-semibold text-[hsl(var(--sentinel-critical))]">Delete My Data</h2>
                <p className="text-[10px] text-[hsl(var(--sentinel-critical)/0.7)]">Permanently delete all your personal data</p>
              </div>
            </div>
            <div className="px-6 pb-6">
              <div className="rounded-lg border border-[hsl(var(--sentinel-critical)/0.2)] bg-[hsl(var(--sentinel-critical)/0.06)] p-4 mb-4">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-[hsl(var(--sentinel-critical))] mt-0.5" />
                  <div>
                    <p className="text-[12px] font-semibold text-[hsl(var(--sentinel-critical))]">This action is irreversible</p>
                    <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
                      All your data will be permanently deleted including your identity record, risk scores, risk history, audit logs, and all tracked events.
                    </p>
                  </div>
                </div>
              </div>

              <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <DialogTrigger asChild>
                  <Button variant="destructive" className="w-full" size="sm">
                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                    Delete All My Data
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="text-[hsl(var(--sentinel-critical))]">Are you absolutely sure?</DialogTitle>
                    <DialogDescription>
                      This will permanently delete your account and all associated data.
                      Type <span className="font-mono font-bold text-foreground">DELETE</span> to confirm.
                    </DialogDescription>
                  </DialogHeader>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="Type DELETE to confirm"
                    className="mt-2 w-full rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[hsl(var(--sentinel-critical)/0.5)]"
                  />
                  <DialogFooter className="mt-3">
                    <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
                    <Button
                      variant="destructive"
                      onClick={deleteAllData}
                      disabled={updating || deleteConfirmText !== "DELETE"}
                    >
                      {updating ? "Deleting…" : "Delete Permanently"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span className="text-[12px] font-mono font-semibold text-foreground">{value}</span>
    </div>
  )
}

function MonitoringItem({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] px-2.5 py-1.5">
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  )
}

export default function MePage() {
  return (
    <ProtectedRoute>
      <MePageContent />
    </ProtectedRoute>
  )
}
