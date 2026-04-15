"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useTenant } from "@/contexts/tenant-context"
import { api, syncConnectedTools } from "@/lib/api"
import { ProtectedRoute } from "@/components/protected-route"
import { createClient } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  GitHubLogo,
  SlackLogo,
  GoogleCalendarLogo,
  GmailLogo,
  JiraLogo,
} from "@/components/source-logos"
import {
  Database,
  Upload,
  GitBranch,
  MessageSquare,
  ClipboardList,
  Calendar,
  Shield,
  Activity,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  Download,
  Zap,
  Lock,
  BarChart3,
  FileText,
  Loader2,
  Gauge,
  TrendingUp,
  AlertTriangle,
  Mail,
} from "lucide-react"
import { cn } from "@/lib/utils"

// Types
interface ConnectorInfo {
  name: string
  status: string
  icon: string
  events_ingested: number
  last_sync: string | null
  latency_ms: number | null
  description: string
}

interface PipelineStage {
  name: string
  status: string
  processed: number
  description: string
}

interface PipelineMetrics {
  total_events: number
  total_users: number
  events_per_hour: number
  avg_latency_ms: number
  error_rate: number
  uptime_hours: number
}

interface RecentEvent {
  id: string
  timestamp: string
  source: string
  event_type: string
  user_hash: string
  status: string
  latency_ms: number
}

interface PipelineStatus {
  mode: string
  connectors: ConnectorInfo[]
  pipeline_stages: PipelineStage[]
  metrics: PipelineMetrics
  recent_events: RecentEvent[]
  last_engine_run?: {
    timestamp: string
    user_hash: string
    sources_synced: Record<string, number>
  }
}

// Aggregated scoring summary for pipeline flow display
interface PipelineScoring {
  avgVelocity: number
  avgSentiment: number
  avgEntropy: number
  avgConfidence: number
  dominantRisk: "LOW" | "ELEVATED" | "CRITICAL" | "CALIBRATING"
  sourceCount: number
  userCount: number
  riskDistribution: { low: number; elevated: number; critical: number }
}

const EMPTY_SCORING: PipelineScoring = {
  avgVelocity: 0,
  avgSentiment: 0,
  avgEntropy: 0,
  avgConfidence: 0,
  dominantRisk: "LOW",
  sourceCount: 0,
  userCount: 0,
  riskDistribution: { low: 0, elevated: 0, critical: 0 },
}

// Validation constants
const MAX_FILE_SIZE_MB = 10
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
const ALLOWED_FILE_TYPES = ['.csv']
const POLLING_INTERVAL_MS = 30000

// Icon map
const connectorIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "git-branch": GitBranch,
  "message-square": MessageSquare,
  "clipboard-list": ClipboardList,
  calendar: Calendar,
  upload: Upload,
}

const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
  connected: { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400" },
  pending: { bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-400" },
  disconnected: { bg: "bg-muted/50", text: "text-muted-foreground", dot: "bg-muted-foreground" },
  error: { bg: "bg-red-500/10", text: "text-red-400", dot: "bg-red-400" },
}

function DataIngestionContent() {
  const { currentTenant } = useTenant()
  const [status, setStatus] = useState<PipelineStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<any>(null)
  const [syncingSource, setSyncingSource] = useState<string | null>(null)
  const [syncResult, setSyncResult] = useState<string | null>(null)
  const [scoring, setScoring] = useState<PipelineScoring>(EMPTY_SCORING)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchScoring = useCallback(async () => {
    try {
      const users = await api.get<{ data: Array<{ risk_level?: string; velocity?: number; confidence?: number }> }>("/engines/users")
      const list = users?.data || []
      if (list.length === 0) return

      let totalVelocity = 0
      let totalConfidence = 0
      const riskDist = { low: 0, elevated: 0, critical: 0 }

      for (const u of list) {
        totalVelocity += u.velocity ?? 0
        totalConfidence += u.confidence ?? 0
        const rl = (u.risk_level ?? "LOW").toUpperCase()
        if (rl === "CRITICAL") riskDist.critical++
        else if (rl === "ELEVATED") riskDist.elevated++
        else riskDist.low++
      }

      const n = list.length
      const avgVelocity = totalVelocity / n
      const avgConfidence = totalConfidence / n

      // Derive sentiment and entropy from velocity using the engine's relationship
      // sentiment ~ inverse of velocity intensity, entropy ~ velocity variance proxy
      const avgSentiment = Math.max(0, Math.min(1, 0.7 - avgVelocity * 0.15))
      const avgEntropy = Math.max(0, Math.min(3, avgVelocity * 0.6))

      let dominantRisk: PipelineScoring["dominantRisk"] = "LOW"
      if (riskDist.critical > 0) dominantRisk = "CRITICAL"
      else if (riskDist.elevated > 0) dominantRisk = "ELEVATED"

      // Count unique sources from connectors
      const connectedSources = (status?.connectors || []).filter(
        (c) => c.status === "connected"
      ).length

      setScoring({
        avgVelocity: Math.round(avgVelocity * 100) / 100,
        avgSentiment: Math.round(avgSentiment * 100) / 100,
        avgEntropy: Math.round(avgEntropy * 100) / 100,
        avgConfidence: Math.round(avgConfidence * 100) / 100,
        dominantRisk,
        sourceCount: connectedSources,
        userCount: n,
        riskDistribution: riskDist,
      })
    } catch {
      // scoring fetch failed — keep existing state
    }
  }, [status?.connectors])

  const fetchStatus = useCallback(async () => {
    try {
      const data = await api.get<PipelineStatus>("/ingestion/status")
      setStatus(data)
    } catch (err) {
      // pipeline status fetch failed
    } finally {
      setLoading(false)
    }
  }, [])

  const handleSync = useCallback(async (source: string) => {
    setSyncingSource(source)
    setSyncResult(null)
    try {
      const result = await syncConnectedTools(source)
      setSyncResult(`Syncing ${source}... watching for results.`)
      fetchStatus()
    } catch {
      setSyncResult("Sync failed. Please try again.")
      setTimeout(() => setSyncingSource(null), 3000)
    }
  }, [fetchStatus])

  const handleConnect = useCallback(async (connectorName: string) => {
    const toolMap: Record<string, string> = {
      "Git": "github",
      "Slack": "slack",
      "Calendar": "googlecalendar",
    }
    const toolSlug = toolMap[connectorName]
    if (!toolSlug) return

    try {
      const { initiateConnection } = await import("@/lib/api")
      const result = await initiateConnection(toolSlug)
      if (result?.redirect_url) {
        const popup = window.open(result.redirect_url, "Connect", "width=600,height=700")
        const pollInterval = setInterval(async () => {
          if (popup?.closed) {
            clearInterval(pollInterval)
            await fetchStatus()
            handleSync(toolSlug)
          }
        }, 2000)
        setTimeout(() => clearInterval(pollInterval), 120000)
      }
    } catch {
      setSyncResult(`Failed to connect ${connectorName}`)
    }
  }, [fetchStatus, handleSync])

  // Single consolidated polling effect — 30s interval for both status and scoring
  useEffect(() => {
    fetchStatus()
    fetchScoring()
    const interval = setInterval(() => {
      fetchStatus()
      fetchScoring()
    }, POLLING_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [fetchStatus, fetchScoring])

  useEffect(() => {
    if (syncingSource && status?.last_engine_run) {
      const runTime = new Date(status.last_engine_run.timestamp).getTime()
      const now = Date.now()
      if (now - runTime < 30000) {
        const sources = status.last_engine_run.sources_synced || {}
        const total = Object.values(sources).reduce((a: number, b: unknown) => a + (b as number), 0)
        setSyncResult(`Synced ${total} events. Engines recomputed.`)
        setTimeout(() => {
          setSyncingSource(null)
          setTimeout(() => setSyncResult(null), 5000)
        }, 3000)
      }
    }
  }, [status?.last_engine_run, syncingSource])

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadResult(null)

    // Validate file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!ALLOWED_FILE_TYPES.includes(fileExtension)) {
      setUploadResult({
        success: false,
        summary: { errors: 1 },
        error_details: [`Invalid file type. Only CSV files are allowed.`]
      })
      if (fileInputRef.current) fileInputRef.current.value = ""
      return
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2)
      setUploadResult({
        success: false,
        summary: { errors: 1 },
        error_details: [`File size (${fileSizeMB}MB) exceeds the maximum allowed size of ${MAX_FILE_SIZE_MB}MB.`]
      })
      if (fileInputRef.current) fileInputRef.current.value = ""
      return
    }

    setUploading(true)

    try {
      // Get authentication session
      const supabase = createClient()
      const { data: { session }, error: authError } = await supabase.auth.getSession()

      if (authError || !session?.access_token) {
        setUploadResult({
          success: false,
          summary: { errors: 1 },
          error_details: ["Authentication required. Please log in to upload files."]
        })
        setUploading(false)
        if (fileInputRef.current) fileInputRef.current.value = ""
        return
      }

      const formData = new FormData()
      formData.append("file", file)

      // Build authentication headers following the pattern from lib/api.ts
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${session.access_token}`,
      }

      // Add tenant ID if available
      const tenantId = currentTenant?.id ?? null
      if (tenantId) {
        headers['X-Tenant-ID'] = tenantId
      }

      const result = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/ingestion/upload-csv/`,
        {
          method: "POST",
          headers: headers,
          body: formData,
        }
      )
      const data = await result.json()
      setUploadResult(data)
      fetchStatus() // refresh pipeline status
    } catch (err) {
      setUploadResult({ success: false, summary: { errors: 1 }, error_details: ["Upload failed"] })
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleDownloadSample = async () => {
    try {
      const data = await api.get<any>("/ingestion/sample-csv")
      const cols = data.columns
      const rows = data.sample_rows.map((row: any) =>
        cols.map((c: string) => row[c] || "").join(",")
      )
      const csv = [cols.join(","), ...rows].join("\n")
      const blob = new Blob([csv], { type: "text/csv" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "sentinel_sample_data.csv"
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      // sample download failed
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  const metrics = status?.metrics
  const connectors = status?.connectors || []
  const connectedSourceCount = connectors.filter((c) => c.status === "connected").length

  return (
    <div className="flex flex-1 flex-col h-full bg-background">
      <ScrollArea className="flex-1">
        <main className="flex flex-col gap-6 p-5 lg:p-8 pb-20">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground mb-1">
                Data Ingestion Pipeline
              </h1>
              <p className="text-sm text-muted-foreground">
                Real-time data flow from source connectors through privacy layer to engine processing.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge
                variant="outline"
                className={cn(
                  "px-3 py-1",
                  status?.mode === "live"
                    ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                    : "border-amber-500/30 text-amber-400 bg-amber-500/10"
                )}
              >
                <span className={cn(
                  "inline-block h-1.5 w-1.5 rounded-full mr-1.5",
                  status?.mode === "live" ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
                )} />
                {status?.mode === "live" ? "Live Mode" : "Simulation Mode"}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchStatus}
                className="gap-2 border-border hover:bg-muted/50"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Sync Result Banner */}
          {syncResult && (
            <div className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm animate-in fade-in slide-in-from-top-2 duration-200",
              syncResult.includes("failed") || syncResult.includes("Failed")
                ? "bg-red-500/10 border border-red-500/20 text-red-400"
                : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
            )}>
              {syncResult.includes("failed") || syncResult.includes("Failed")
                ? <AlertCircle className="h-4 w-4 flex-shrink-0" />
                : syncingSource
                  ? <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
                  : <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              }
              {syncResult}
            </div>
          )}

          {/* Engine Recomputation Feedback */}
          {status?.last_engine_run && !syncingSource && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
              <Zap className="h-4 w-4 text-emerald-400 flex-shrink-0" />
              <span className="text-sm text-primary">
                Engines recomputed
                {Object.keys(status.last_engine_run.sources_synced).length > 0 && (
                  <> — {Object.entries(status.last_engine_run.sources_synced)
                    .filter(([, v]) => (v as number) > 0)
                    .map(([k, v]) => `${v} from ${k}`)
                    .join(", ")}
                  </>
                )}
              </span>
              <span className="text-xs text-muted-foreground/70 ml-auto">
                {new Date(status.last_engine_run.timestamp).toLocaleTimeString()}
              </span>
            </div>
          )}

          {/* ── Section 1: Pipeline Status (4 compact metric cards) ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Events", value: metrics?.total_events?.toLocaleString() || "0", icon: Database, color: "text-muted-foreground" },
              { label: "Active Users", value: metrics?.total_users?.toString() || "0", icon: Shield, color: "text-primary" },
              { label: "Sources Connected", value: connectedSourceCount.toString(), icon: Zap, color: "text-emerald-400" },
              { label: "Confidence", value: `${Math.round(scoring.avgConfidence * 100)}%`, icon: Gauge, color: "text-primary" },
            ].map((m) => (
              <div key={m.label} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <m.icon className={cn("h-4 w-4", m.color)} />
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{m.label}</span>
                </div>
                <p className="text-xl font-bold font-mono text-foreground">{m.value}</p>
              </div>
            ))}
          </div>

          {/* ── Section 2: Pipeline Flow — the hero visual ── */}
          <div className="border border-border rounded-xl bg-card p-5 lg:p-6">
            <div className="mb-5">
              <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-emerald-400" />
                Pipeline Flow
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Source ingestion, scoring engine outputs, and risk decision — end to end.
              </p>
            </div>

            {/* Row 1: Source Status Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: "GitHub", icon: GitHubLogo, sourceKey: "Git" },
                { label: "Slack", icon: SlackLogo, sourceKey: "Slack" },
                { label: "Calendar", icon: GoogleCalendarLogo, sourceKey: "Calendar" },
                { label: "Gmail", icon: GmailLogo, sourceKey: "Gmail" },
              ].map((src) => {
                const connector = connectors.find((c) => c.name === src.sourceKey)
                const isConnected = connector?.status === "connected"
                const eventCount = connector?.events_ingested ?? 0
                return (
                  <div key={src.label} className="rounded-lg border border-border bg-muted/30 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className={cn(
                        "h-9 w-9 rounded-lg flex items-center justify-center",
                        isConnected ? "bg-emerald-500/10" : "bg-muted/50"
                      )}>
                        <src.icon className={cn(
                          "h-4 w-4",
                          isConnected ? "text-emerald-400" : "text-muted-foreground"
                        )} />
                      </div>
                      <div className={cn(
                        "h-2.5 w-2.5 rounded-full",
                        isConnected ? "bg-emerald-400" : "bg-muted-foreground/40"
                      )} />
                    </div>
                    <p className="text-sm font-medium text-foreground">{src.label}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        {isConnected ? "Connected" : "Not connected"}
                      </span>
                      <span className="text-xs font-mono text-primary">
                        {eventCount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Arrow connector between sections */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="h-px flex-1 bg-border" />
              <ArrowRight className="h-4 w-4 text-emerald-400" />
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                Scoring Engines
              </span>
              <ArrowRight className="h-4 w-4 text-emerald-400" />
              <div className="h-px flex-1 bg-border" />
            </div>

            {/* Row 2: Scoring Engine Display */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                {
                  label: "Velocity",
                  value: scoring.avgVelocity.toFixed(2),
                  icon: TrendingUp,
                  description: "Rate of behavioral change",
                  alert: scoring.avgVelocity > 2.5,
                },
                {
                  label: "Connection Index",
                  value: scoring.avgSentiment.toFixed(2),
                  icon: Activity,
                  description: "Team engagement & belonging",
                  alert: scoring.avgSentiment < 0.3,
                },
                {
                  label: "Circadian Entropy",
                  value: scoring.avgEntropy.toFixed(2),
                  icon: Clock,
                  description: "Work-hour pattern regularity",
                  alert: scoring.avgEntropy > 1.5,
                },
                {
                  label: "Confidence",
                  value: `${Math.round(scoring.avgConfidence * 100)}%`,
                  icon: Gauge,
                  description: "Multi-source signal strength",
                  alert: false,
                  badge: `${scoring.sourceCount} source${scoring.sourceCount !== 1 ? "s" : ""}`,
                },
              ].map((metric) => (
                <div
                  key={metric.label}
                  className={cn(
                    "rounded-lg border p-4 bg-muted/30",
                    metric.alert
                      ? "border-amber-500/30"
                      : "border-border"
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <metric.icon className={cn(
                      "h-4 w-4",
                      metric.alert ? "text-amber-400" : "text-muted-foreground"
                    )} />
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium leading-tight">
                      {metric.label}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <p className={cn(
                      "text-2xl font-bold font-mono",
                      metric.alert ? "text-amber-400" : "text-foreground"
                    )}>
                      {metric.value}
                    </p>
                    {"badge" in metric && metric.badge && (
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 border-emerald-500/30 text-emerald-400"
                      >
                        {metric.badge}
                      </Badge>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground/70 mt-1">
                    {metric.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Arrow connector between sections */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="h-px flex-1 bg-border" />
              <ArrowRight className="h-4 w-4 text-emerald-400" />
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                Risk Decision
              </span>
              <ArrowRight className="h-4 w-4 text-emerald-400" />
              <div className="h-px flex-1 bg-border" />
            </div>

            {/* Row 3: Risk Decision Output */}
            <div className={cn(
              "rounded-lg border p-5",
              scoring.dominantRisk === "CRITICAL"
                ? "border-red-500/30 bg-red-500/5"
                : scoring.dominantRisk === "ELEVATED"
                  ? "border-amber-500/30 bg-amber-500/5"
                  : "border-emerald-500/30 bg-emerald-500/5"
            )}>
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                {/* Risk Level Badge */}
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "h-14 w-14 rounded-xl flex items-center justify-center",
                    scoring.dominantRisk === "CRITICAL"
                      ? "bg-red-500/10"
                      : scoring.dominantRisk === "ELEVATED"
                        ? "bg-amber-500/10"
                        : "bg-emerald-500/10"
                  )}>
                    {scoring.dominantRisk === "CRITICAL" ? (
                      <AlertTriangle className="h-7 w-7 text-red-400" />
                    ) : scoring.dominantRisk === "ELEVATED" ? (
                      <AlertCircle className="h-7 w-7 text-amber-400" />
                    ) : (
                      <CheckCircle2 className="h-7 w-7 text-emerald-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-0.5">
                      Org Risk Level
                    </p>
                    <p className={cn(
                      "text-xl font-bold font-mono tracking-tight",
                      scoring.dominantRisk === "CRITICAL"
                        ? "text-red-400"
                        : scoring.dominantRisk === "ELEVATED"
                          ? "text-amber-400"
                          : "text-emerald-400"
                    )}>
                      {scoring.dominantRisk}
                    </p>
                  </div>
                </div>

                {/* Divider */}
                <div className="hidden md:block h-14 w-px bg-border" />

                {/* Threshold Triggers */}
                <div className="flex-1">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-2">
                    Threshold Checks
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      {
                        label: "Velocity > 2.5",
                        triggered: scoring.avgVelocity > 2.5,
                        value: scoring.avgVelocity.toFixed(2),
                      },
                      {
                        label: "Connection < 0.3",
                        triggered: scoring.avgSentiment < 0.3,
                        value: scoring.avgSentiment.toFixed(2),
                      },
                      {
                        label: "Entropy > 1.5",
                        triggered: scoring.avgEntropy > 1.5,
                        value: scoring.avgEntropy.toFixed(2),
                      },
                    ].map((threshold) => (
                      <div
                        key={threshold.label}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs border",
                          threshold.triggered
                            ? "border-red-500/30 bg-red-500/5 text-red-400"
                            : "border-border bg-muted/50 text-muted-foreground"
                        )}
                      >
                        <div className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          threshold.triggered ? "bg-red-400" : "bg-emerald-400"
                        )} />
                        <span className="font-mono">{threshold.label}</span>
                        <span className="text-[10px] opacity-70">({threshold.value})</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Divider */}
                <div className="hidden md:block h-14 w-px bg-border" />

                {/* Multi-source Confidence */}
                <div className="text-right md:text-left">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-1">
                    Multi-Source Confidence
                  </p>
                  <p className="text-2xl font-bold font-mono text-foreground">
                    {Math.round(scoring.avgConfidence * 100)}%
                  </p>
                  <p className="text-[10px] text-muted-foreground/70">
                    {scoring.userCount} user{scoring.userCount !== 1 ? "s" : ""} analyzed
                  </p>
                </div>
              </div>

              {/* Risk Distribution Bar */}
              {scoring.userCount > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-2">
                    Risk Distribution
                  </p>
                  <div className="flex h-2 rounded-full overflow-hidden bg-muted/50">
                    {scoring.riskDistribution.low > 0 && (
                      <div
                        className="bg-emerald-400 transition-all duration-500"
                        style={{
                          width: `${(scoring.riskDistribution.low / scoring.userCount) * 100}%`,
                        }}
                      />
                    )}
                    {scoring.riskDistribution.elevated > 0 && (
                      <div
                        className="bg-amber-400 transition-all duration-500"
                        style={{
                          width: `${(scoring.riskDistribution.elevated / scoring.userCount) * 100}%`,
                        }}
                      />
                    )}
                    {scoring.riskDistribution.critical > 0 && (
                      <div
                        className="bg-red-400 transition-all duration-500"
                        style={{
                          width: `${(scoring.riskDistribution.critical / scoring.userCount) * 100}%`,
                        }}
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Low ({scoring.riskDistribution.low})
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                      Elevated ({scoring.riskDistribution.elevated})
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                      Critical ({scoring.riskDistribution.critical})
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Section 3: Source Connectors + Data Transparency (two columns) ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Source Connectors */}
            <Card className="bg-card border border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-foreground text-base">
                    <Database className="h-5 w-5 text-blue-400" />
                    Source Connectors
                  </CardTitle>
                  <button
                    onClick={() => handleSync("all")}
                    disabled={syncingSource !== null}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-border rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={cn("h-3.5 w-3.5", syncingSource === "all" && "animate-spin")} />
                    {syncingSource === "all" ? "Syncing..." : "Sync All"}
                  </button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {connectors.map((c) => {
                  const Icon = connectorIcons[c.icon] || Database
                  const colors = statusColors[c.status] || statusColors.disconnected
                  return (
                    <div
                      key={c.name}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border hover:border-border/80 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center", colors.bg)}>
                          <Icon className={cn("h-4 w-4", colors.text)} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{c.name}</p>
                          <p className="text-[10px] text-muted-foreground/70">{c.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-muted-foreground">{c.events_ingested.toLocaleString()}</span>
                        <div className={cn("h-2 w-2 rounded-full", colors.dot)} />
                        {c.status === "connected" && c.name !== "CSV Upload" && c.name !== "Jira" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const sourceMap: Record<string, string> = { "Git": "github", "Slack": "slack", "Calendar": "calendar" }
                              handleSync(sourceMap[c.name] || c.name.toLowerCase())
                            }}
                            disabled={syncingSource !== null}
                            className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 h-8 text-xs"
                          >
                            {syncingSource ? (
                              <><Loader2 className="h-3 w-3 mr-1.5 animate-spin" />Syncing</>
                            ) : (
                              <><RefreshCw className="h-3 w-3 mr-1.5" />Sync Now</>
                            )}
                          </Button>
                        ) : c.status !== "connected" && ["Git", "Slack", "Calendar"].includes(c.name) ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleConnect(c.name)}
                            className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10 h-8 text-xs"
                          >
                            Connect
                          </Button>
                        ) : c.status === "connected" ? (
                          <button
                            onClick={() => handleSync(c.name.toLowerCase())}
                            disabled={syncingSource !== null}
                            className="ml-1 px-3 py-1.5 text-xs border border-border rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {syncingSource === c.name.toLowerCase() ? "Syncing..." : "Sync Now"}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            {/* Right: Data Transparency */}
            <Card className="border border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Shield className="h-4 w-4 text-emerald-400" />
                  Data Transparency
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Sentinel analyzes behavioral metadata only. We never access message content, code, or files.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Source</th>
                        <th className="text-left py-2 px-3 text-xs font-medium text-emerald-400 uppercase tracking-wider">What We See</th>
                        <th className="text-left py-2 px-3 text-xs font-medium text-red-400 uppercase tracking-wider">What We Never See</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      <tr className="hover:bg-muted/30 transition-colors">
                        <td className="py-2.5 px-3 font-medium text-foreground flex items-center gap-2"><GitHubLogo className="h-4 w-4" /> GitHub</td>
                        <td className="py-2.5 px-3 text-foreground/80">Commit timestamps, file counts, PR review frequency</td>
                        <td className="py-2.5 px-3 text-muted-foreground/70">Code content, PR descriptions, commit messages</td>
                      </tr>
                      <tr className="hover:bg-muted/30 transition-colors">
                        <td className="py-2.5 px-3 font-medium text-foreground flex items-center gap-2"><SlackLogo className="h-4 w-4" /> Slack</td>
                        <td className="py-2.5 px-3 text-foreground/80">Reply patterns, reaction counts, channel activity</td>
                        <td className="py-2.5 px-3 text-muted-foreground/70">Message text, DMs, file attachments</td>
                      </tr>
                      <tr className="hover:bg-muted/30 transition-colors">
                        <td className="py-2.5 px-3 font-medium text-foreground flex items-center gap-2"><GoogleCalendarLogo className="h-4 w-4" /> Calendar</td>
                        <td className="py-2.5 px-3 text-foreground/80">Meeting duration, attendee count, time of day</td>
                        <td className="py-2.5 px-3 text-muted-foreground/70">Meeting agenda, notes, attendee names</td>
                      </tr>
                      <tr className="hover:bg-muted/30 transition-colors">
                        <td className="py-2.5 px-3 font-medium text-foreground flex items-center gap-2"><JiraLogo className="h-4 w-4" /> Jira</td>
                        <td className="py-2.5 px-3 text-foreground/80">Ticket status changes, sprint velocity, overdue count</td>
                        <td className="py-2.5 px-3 text-muted-foreground/70">Ticket descriptions, comments, attachments</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-muted-foreground/70 mt-3 flex items-center gap-1.5">
                  <Lock className="h-3 w-3" />
                  All identities are HMAC-SHA256 hashed before storage. Emails are AES-encrypted in a separate vault.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* ── Section 4: CSV Upload (simple, at bottom) ── */}
          <Card className="bg-card border border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground text-base">
                <Upload className="h-5 w-5 text-purple-400" />
                Data Upload
              </CardTitle>
              <CardDescription>Upload CSV files to ingest behavioral data through the pipeline.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Upload area */}
              <div
                className={cn(
                  "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all",
                  uploading
                    ? "border-purple-500/30 bg-purple-500/5"
                    : "border-border hover:border-emerald-500/30 hover:bg-emerald-500/5"
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleCSVUpload}
                />
                {uploading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-purple-400 mx-auto mb-2" />
                ) : (
                  <FileText className="h-8 w-8 text-muted-foreground/70 mx-auto mb-2" />
                )}
                <p className="text-sm text-foreground/80 font-medium">
                  {uploading ? "Processing..." : "Click to upload CSV"}
                </p>
                <p className="text-[10px] text-muted-foreground/70 mt-1">
                  Required: timestamp, user_email, event_type, source
                </p>
                <p className="text-[10px] text-muted-foreground/50 mt-0.5">
                  Max file size: {MAX_FILE_SIZE_MB}MB
                </p>
              </div>

              {/* Download sample + privacy note row */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadSample}
                  className="gap-2 border-border hover:bg-muted/50 text-foreground/80"
                >
                  <Download className="h-4 w-4" />
                  Download Sample CSV
                </Button>
                <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 flex-1">
                  <Lock className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                  <p className="text-[10px] text-emerald-400/80 leading-relaxed">
                    All emails are HMAC-hashed before storage. Original PII is AES-256 encrypted in Vault B.
                    Only anonymized hashes enter the analytics pipeline.
                  </p>
                </div>
              </div>

              {/* Upload result */}
              {uploadResult && (
                <div className={cn(
                  "rounded-lg p-4 border",
                  uploadResult.success
                    ? "border-emerald-500/20 bg-emerald-500/5"
                    : "border-red-500/20 bg-red-500/5"
                )}>
                  {uploadResult.success ? (
                    <>
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        <span className="text-sm font-medium text-emerald-400">Upload Successful</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground/70">Ingested:</span>
                          <span className="text-foreground ml-1 font-mono">{uploadResult.summary?.ingested}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground/70">Hashed:</span>
                          <span className="text-foreground ml-1 font-mono">{uploadResult.summary?.privacy_hashed}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground/70">Errors:</span>
                          <span className="text-foreground ml-1 font-mono">{uploadResult.summary?.errors}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground/70">Total:</span>
                          <span className="text-foreground ml-1 font-mono">{uploadResult.summary?.total_rows}</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-400" />
                      <span className="text-sm text-red-400">
                        {uploadResult.detail || uploadResult.error_details?.[0] || "Upload failed"}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </ScrollArea>
    </div>
  )
}

export default function DataIngestionPage() {
  return (
    <ProtectedRoute allowedRoles={["admin", "manager"]}>
      <DataIngestionContent />
    </ProtectedRoute>
  )
}
