"use client"

import { useState, useEffect, useMemo } from "react"
import {
  Activity,
  Shield,
  AlertTriangle,
  Radio,
  PauseCircle,
  PlayCircle,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Zap,
  Brain,
  CheckCircle2,
  Users,
  Clock,
  Lock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ProtectedRoute } from "@/components/protected-route"
import { Separator } from "@/components/ui/separator"
import { VelocityChart } from "@/components/velocity-chart"
import { NudgeCard } from "@/components/nudge-card"
import { ProvideContextCard } from "@/components/provide-context-card"

import { useRiskHistory } from "@/hooks/useRiskHistory"
import { useNudge } from "@/hooks/useNudge"

import { api } from "@/lib/api"
import type { HistoryPoint } from "@/types"
// ─── Types ────────────────────────────────────────────

interface UserProfile {
  user_hash: string; role: string
  consent_share_with_manager: boolean; consent_share_anonymized: boolean
  monitoring_paused_until: string | null; created_at: string
}

interface RiskData {
  velocity: number | null; risk_level: string; confidence: number
  thwarted_belongingness: number | null; attrition_probability: number | null
  circadian_entropy: number | null; updated_at: string | null
}

interface AuditEntry { action: string; timestamp: string; details: unknown }

interface MeData {
  user: UserProfile
  risk: RiskData | null
  skills: {
    technical: number; communication: number; leadership: number
    collaboration: number; adaptability: number; creativity: number
    updated_at?: string
  } | null
  audit_trail: AuditEntry[]
  monitoring_status: { is_paused: boolean; paused_until: string | null }
}

// ─── Config & helpers ─────────────────────────────────

const RISK_CONFIG: Record<string, { label: string; badgeClass: string; colorVar: string }> = {
  CRITICAL: { label: "Critical", badgeClass: "risk-badge-critical", colorVar: "--sentinel-critical" },
  ELEVATED: { label: "Elevated", badgeClass: "risk-badge-elevated", colorVar: "--sentinel-elevated" },
  LOW:      { label: "Healthy",  badgeClass: "risk-badge-low",      colorVar: "--sentinel-healthy" },
}

function getRiskConfig(level: string | undefined) {
  return RISK_CONFIG[level || "LOW"] || RISK_CONFIG.LOW
}

function velocityDescription(v: number): string {
  if (v < 1.0) return "Below baseline"; if (v < 1.5) return "Normal range"
  return v < 2.0 ? "Elevated" : "Critical intensity"
}
function connectionDescription(c: number): string {
  if (c >= 0.7) return "Strong engagement"; return c >= 0.4 ? "Moderate" : "Low engagement"
}
function entropyDescription(e: number): string {
  if (e < 0.5) return "Consistent"; return e < 1.0 ? "Moderate variation" : "Irregular"
}

function generateSelfInsight(risk: RiskData): string {
  const v = risk.velocity ?? 0
  const b = risk.thwarted_belongingness ?? 0.5
  if (risk.risk_level === "CRITICAL") {
    const p = [v > 2.0
      ? `Your work intensity is at ${v.toFixed(1)}x baseline, significantly above the sustainable range.`
      : "Multiple signals indicate elevated burnout risk."]
    if (b < 0.3) p.push("Social engagement has dropped notably. Consider reconnecting with your team.")
    p.push("Take this seriously -- small adjustments now prevent bigger problems later.")
    return p.join(" ")
  }
  if (risk.risk_level === "ELEVATED") {
    return [
      v > 1.5 ? `Work velocity is trending up at ${v.toFixed(1)}x baseline.` : "Early warning patterns are appearing in your data.",
      "Consider reviewing your workload and building in recovery time this week.",
    ].join(" ")
  }
  return `Your signals are within healthy ranges. Work velocity is stable at ${v.toFixed(1)}x baseline and social engagement is at ${(b * 100).toFixed(0)}%. Keep it up.`
}

function velocityTrend(v: number): { delta: string; rising: boolean } {
  const delta = v - 1.0
  return {
    delta: `${delta >= 0 ? "+" : ""}${delta.toFixed(1)} vs baseline`,
    rising: delta > 0,
  }
}

function connectionTrend(c: number | null): string {
  if (c === null) return "no data"
  if (c >= 0.7) return "strong"
  if (c >= 0.4) return "stable"
  return "declining"
}

function daysSince(isoDate: string | null | undefined): number | null {
  if (!isoDate) return null
  const diff = Date.now() - new Date(isoDate).getTime()
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
}

function signalColor(level: "healthy" | "warning" | "critical"): string {
  const map = {
    healthy: "text-[hsl(var(--sentinel-healthy))]",
    warning: "text-[hsl(var(--sentinel-elevated))]",
    critical: "text-[hsl(var(--sentinel-critical))]",
  }
  return map[level]
}

function velocitySignalLevel(v: number): "healthy" | "warning" | "critical" {
  if (v < 1.5) return "healthy"
  if (v < 2.0) return "warning"
  return "critical"
}

function connectionSignalLevel(c: number | null): "healthy" | "warning" | "critical" {
  if (c === null) return "healthy"
  if (c >= 0.7) return "healthy"
  if (c >= 0.4) return "warning"
  return "critical"
}

function entropySignalLevel(e: number | null): "healthy" | "warning" | "critical" {
  if (e === null) return "healthy"
  if (e < 0.5) return "healthy"
  if (e < 1.0) return "warning"
  return "critical"
}

function formatAuditAction(action: string): string {
  return action.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

function extractErrorDetail(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "response" in err) {
    const d = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
    if (d) return d
  }
  return fallback
}

// ─── Page ─────────────────────────────────────────────

export default function MePage() {
  return <ProtectedRoute><MePageContent /></ProtectedRoute>
}
function MePageContent() {
  const [data, setData] = useState<MeData | null>(null)
  const [isDataLoading, setIsDataLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)

  const { history, isLoading: isHistoryLoading } = useRiskHistory(data?.user?.user_hash || null)
  const { data: nudgeData } = useNudge(data?.user?.user_hash || null)

  useEffect(() => {
    fetchMeData()
  }, [])

  const fetchMeData = async () => {
    try {
      setIsDataLoading(true)
      const result = await api.get<MeData>("/me")
      if (result?.user) { setData(result); setError(null) }
      else { setError("Failed to load your data") }
    } catch (err: unknown) {
      setError(extractErrorDetail(err, "Failed to load your data"))
    } finally { setIsDataLoading(false) }
  }

  const pauseMonitoring = async (hours: number) => {
    try {
      setUpdating(true)
      await api.post(`/me/pause-monitoring?hours=${hours}`, {})
      await fetchMeData()
      setError(null)
    } catch (err: unknown) {
      setError(extractErrorDetail(err, "Failed to pause monitoring"))
    } finally { setUpdating(false) }
  }

  const resumeMonitoring = async () => {
    try {
      setUpdating(true)
      await api.post("/me/resume-monitoring", {})
      await fetchMeData()
      setError(null)
    } catch (err: unknown) {
      setError(extractErrorDetail(err, "Failed to resume monitoring"))
    } finally { setUpdating(false) }
  }

  const selfInsight = useMemo(
    () => data?.risk ? generateSelfInsight(data.risk) : null,
    [data?.risk],
  )

  if (isDataLoading) return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-3 h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-sm text-muted-foreground">Loading your wellbeing data...</p>
      </div>
    </div>
  )

  if (!data) return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="bg-card border border-border rounded-xl p-6 text-center max-w-sm">
        <AlertTriangle className="mx-auto mb-3 h-6 w-6 text-destructive" />
        <h3 className="text-base font-semibold text-foreground mb-1">Something went wrong</h3>
        <p className="text-sm text-muted-foreground">{error || "Failed to load data"}</p>
      </div>
    </div>
  )

  const riskCfg = getRiskConfig(data.risk?.risk_level)
  const velocity = data.risk?.velocity ?? 0
  const connection = data.risk?.thwarted_belongingness ?? null
  const confidence = data.risk?.confidence ?? 0
  const entropy = data.risk?.circadian_entropy ?? null
  const connectionPct = connection !== null ? Math.round(connection * 100) : null
  const confidencePct = Math.round(confidence * 100)

  return (
    <main className="container mx-auto max-w-6xl px-6 py-10 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">My Wellbeing</h1>
        <p className="text-sm text-muted-foreground/80 mt-1.5 flex items-center gap-1.5">
          <Lock className="h-3 w-3" />
          Your personal signals and controls. Only you can see this page.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Risk Level */}
        <div className="bg-card border border-border rounded-xl p-6">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-4">
            Risk Level
          </p>
          <Badge className={`${riskCfg.badgeClass} text-sm font-semibold px-3 py-1`}>
            {riskCfg.label}
          </Badge>
          <p className="text-[10px] text-muted-foreground/60 mt-3 flex items-center gap-1">
            {(() => {
              const d = daysSince(data.risk?.updated_at)
              return d !== null ? `at this level for ${d === 0 ? "<1" : d} day${d !== 1 ? "s" : ""}` : "no history"
            })()}
          </p>
        </div>

        {/* Velocity */}
        <div className="bg-card border border-border rounded-xl p-6">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-4">
            Velocity
          </p>
          <p className="text-3xl font-semibold text-foreground font-mono tabular-nums leading-none">
            {velocity.toFixed(2)}
          </p>
          <div className="flex items-center gap-1 mt-2">
            {velocityTrend(velocity).rising ? (
              <TrendingUp className="h-3 w-3 text-[hsl(var(--sentinel-critical))]" />
            ) : (
              <TrendingDown className="h-3 w-3 text-[hsl(var(--sentinel-healthy))]" />
            )}
            <span className={`text-[10px] ${velocityTrend(velocity).rising ? "text-[hsl(var(--sentinel-critical))]" : "text-[hsl(var(--sentinel-healthy))]"}`}>
              {velocityTrend(velocity).delta}
            </span>
          </div>
          <div className="mt-3 h-1 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(velocity / 3, 1) * 100}%`,
                background: velocity < 1.5
                  ? "hsl(var(--sentinel-healthy))"
                  : velocity <= 2.5
                    ? "hsl(var(--sentinel-elevated))"
                    : "hsl(var(--sentinel-critical))",
              }}
            />
          </div>
        </div>

        {/* Connection */}
        <div className="bg-card border border-border rounded-xl p-6">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-4">
            Connection
          </p>
          <p className="text-3xl font-semibold text-foreground font-mono tabular-nums leading-none">
            {connectionPct !== null ? connectionPct : "\u2014"}
            {connectionPct !== null && (
              <span className="text-base text-muted-foreground ml-0.5">%</span>
            )}
          </p>
          <p className="text-[10px] text-muted-foreground/60 mt-2">
            {connectionTrend(connection)}
          </p>
          {connectionPct !== null && (
            <div className="mt-3 h-1 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${connectionPct}%`,
                  background: connectionPct >= 60
                    ? "hsl(var(--sentinel-healthy))"
                    : connectionPct >= 35
                      ? "hsl(var(--sentinel-elevated))"
                      : "hsl(var(--sentinel-critical))",
                }}
              />
            </div>
          )}
        </div>

        {/* Confidence */}
        <div className="bg-card border border-border rounded-xl p-6">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-4">
            Confidence
          </p>
          <p className="text-3xl font-semibold text-foreground font-mono tabular-nums leading-none">
            {confidencePct}
            <span className="text-base text-muted-foreground ml-0.5">%</span>
          </p>
          <p className="text-[10px] text-muted-foreground/60 mt-2">
            {confidencePct > 70 ? "3 sources" : confidencePct >= 40 ? "2 sources" : "1 source"}
          </p>
          <div className="mt-3 h-1 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${confidencePct}%`,
                background: confidencePct > 70
                  ? "hsl(var(--sentinel-healthy))"
                  : confidencePct >= 40
                    ? "hsl(var(--sentinel-elevated))"
                    : "hsl(var(--muted-foreground))",
              }}
            />
          </div>
        </div>
      </div>

      <Separator className="opacity-20" />

      {/* ─── Main Grid ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Risk Trend Chart */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Risk Trend
            </h2>
            {isHistoryLoading ? (
              <div className="bg-card border border-border rounded-xl">
                <div className="flex h-48 items-center justify-center">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              </div>
            ) : (
              <VelocityChart
                history={history as HistoryPoint[]}
                title="Work Velocity vs. Connection Index (30 Days)"
              />
            )}
          </section>

          {/* Your Signals */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              Your Signals
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Velocity Signal */}
              <div className="bg-card border border-border rounded-xl p-5">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  Work Velocity
                </p>
                <p className={`text-2xl font-semibold font-mono tabular-nums leading-none ${signalColor(velocitySignalLevel(velocity))}`}>
                  {velocity.toFixed(2)}
                  <span className="text-xs text-muted-foreground ml-1 font-sans font-normal">x</span>
                </p>
                <p className="text-[11px] text-muted-foreground mt-2">
                  {velocityDescription(velocity)}
                </p>
              </div>

              {/* Connection Signal */}
              <div className="bg-card border border-border rounded-xl p-5">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  Connection Index
                </p>
                <p className={`text-2xl font-semibold font-mono tabular-nums leading-none ${signalColor(connectionSignalLevel(connection))}`}>
                  {connectionPct !== null ? `${connectionPct}%` : "\u2014"}
                </p>
                <p className="text-[11px] text-muted-foreground mt-2">
                  {connection !== null
                    ? connectionDescription(connection)
                    : "Not enough data yet"
                  }
                </p>
              </div>

              {/* Entropy Signal */}
              <div className="bg-card border border-border rounded-xl p-5">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  Schedule Regularity
                </p>
                {entropy !== null ? (
                  <>
                    <p className={`text-2xl font-semibold font-mono tabular-nums leading-none ${signalColor(entropySignalLevel(entropy))}`}>
                      {entropy.toFixed(2)}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-2">
                      {entropyDescription(entropy)}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-semibold font-mono tabular-nums leading-none text-muted-foreground/40">
                      --
                    </p>
                    <p className="text-[11px] text-muted-foreground/50 mt-2">
                      Connect more tools for schedule data
                    </p>
                  </>
                )}
              </div>
            </div>
          </section>

        </div>

        {/* Right Column (1/3) */}
        <div className="space-y-6">
          {/* Wellbeing Status */}
          <Card className="bg-card border border-border rounded-xl">
            <CardHeader className="pb-2 px-5 pt-4">
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Wellbeing Status
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5 space-y-4">
              {nudgeData ? (
                <NudgeCard nudge={nudgeData} />
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[hsl(var(--sentinel-healthy))]/10 mb-3">
                    <CheckCircle2 className="h-4 w-4 text-[hsl(var(--sentinel-healthy))]" />
                  </div>
                  <p className="text-xs font-medium text-foreground/80">All clear</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">No active suggestions right now</p>
                </div>
              )}
              {selfInsight && (
                <>
                  <Separator className="opacity-30" />
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      Your Assessment
                    </p>
                    <p className="text-xs leading-relaxed text-foreground/80">
                      {selfInsight}
                    </p>
                    <p className="text-[10px] text-muted-foreground/40 italic">
                      Generated from behavioral metadata. No personal content analyzed.
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Monitoring */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border/40">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Radio className="h-3.5 w-3.5 text-[hsl(var(--sentinel-gem))]" />
                Monitoring
              </div>
            </div>
            <div className="p-4 space-y-4">
              {data.monitoring_status.is_paused ? (
                <div className="rounded-lg px-3 py-2.5 bg-[hsl(var(--sentinel-elevated))]/8 border border-[hsl(var(--sentinel-elevated))]/15">
                  <div className="flex items-center gap-1.5 mb-1 text-[hsl(var(--sentinel-elevated))]">
                    <PauseCircle className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Paused</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Resumes: {new Date(data.monitoring_status.paused_until!).toLocaleString()}
                  </p>
                </div>
              ) : (
                <div className="rounded-lg px-3 py-2.5 bg-[hsl(var(--sentinel-healthy))]/8 border border-[hsl(var(--sentinel-healthy))]/15">
                  <div className="flex items-center gap-1.5 mb-1 text-[hsl(var(--sentinel-healthy))]">
                    <PlayCircle className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Active</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Analyzing work patterns
                  </p>
                  {data.risk?.updated_at && (
                    <p className="text-[10px] text-muted-foreground/50 mt-1">
                      Last analyzed: {(() => {
                        const mins = Math.floor((Date.now() - new Date(data.risk.updated_at).getTime()) / 60000)
                        if (mins < 1) return "just now"
                        if (mins < 60) return `${mins} min ago`
                        const hrs = Math.floor(mins / 60)
                        return `${hrs}h ago`
                      })()}
                    </p>
                  )}
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
                      className="text-xs h-7 font-mono"
                    >
                      {hours}h
                    </Button>
                  ))}
                </div>
              </div>

              {data.monitoring_status.is_paused && (
                <Button
                  onClick={resumeMonitoring}
                  className="w-full h-7 text-xs"
                  variant="secondary"
                >
                  Resume Now
                </Button>
              )}
            </div>
          </div>

          {/* Provide Context / Appeal */}
          <ProvideContextCard onContextProvided={fetchMeData} />

        </div>
      </div>
    </main>
  )
}
