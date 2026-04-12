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
  Server,
  BarChart3,
  FileText,
  Loader2,
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

// Validation constants
const MAX_FILE_SIZE_MB = 10
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
const ALLOWED_FILE_TYPES = ['.csv']

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
  disconnected: { bg: "bg-slate-500/10", text: "text-slate-400", dot: "bg-slate-500" },
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
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, syncingSource ? 2000 : 10000)
    return () => clearInterval(interval)
  }, [fetchStatus, syncingSource])

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
  const stages = status?.pipeline_stages || []
  const recentEvents = status?.recent_events || []

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
              <p className="text-sm text-slate-400">
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
                className="gap-2 border-white/10 hover:bg-white/5"
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
              <span className="text-sm text-emerald-300">
                Engines recomputed
                {Object.keys(status.last_engine_run.sources_synced).length > 0 && (
                  <> — {Object.entries(status.last_engine_run.sources_synced)
                    .filter(([, v]) => (v as number) > 0)
                    .map(([k, v]) => `${v} from ${k}`)
                    .join(", ")}
                  </>
                )}
              </span>
              <span className="text-xs text-slate-500 ml-auto">
                {new Date(status.last_engine_run.timestamp).toLocaleTimeString()}
              </span>
            </div>
          )}

          {/* Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: "Total Events", value: metrics?.total_events?.toLocaleString() || "0", icon: Database, color: "text-blue-400" },
              { label: "Active Users", value: metrics?.total_users?.toString() || "0", icon: Shield, color: "text-emerald-400" },
              { label: "Events/hr", value: metrics?.events_per_hour?.toString() || "0", icon: Zap, color: "text-purple-400" },
              { label: "Avg Latency", value: `${metrics?.avg_latency_ms || 0}ms`, icon: Clock, color: "text-cyan-400" },
              { label: "Error Rate", value: `${metrics?.error_rate || 0}%`, icon: AlertCircle, color: "text-amber-400" },
              { label: "Uptime", value: `${metrics?.uptime_hours || 0}h`, icon: Activity, color: "text-emerald-400" },
            ].map((m) => (
              <div key={m.label} className="bg-[#111827]/60 border border-white/5 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <m.icon className={cn("h-4 w-4", m.color)} />
                  <span className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">{m.label}</span>
                </div>
                <p className="text-xl font-bold font-mono text-foreground">{m.value}</p>
              </div>
            ))}
          </div>

          {/* Visual Pipeline Flow */}
          <Card className="bg-[#111827]/50 border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Server className="h-5 w-5 text-emerald-400" />
                Pipeline Architecture
              </CardTitle>
              <CardDescription>
                Data flows left-to-right: Source Connectors → Validation → Privacy Layer → Storage → Engine Analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {stages.map((stage, i) => (
                  <div key={stage.name} className="flex items-center">
                    <div className={cn(
                      "min-w-[160px] rounded-lg border p-4 transition-all",
                      stage.status === "active"
                        ? "border-emerald-500/30 bg-emerald-500/5"
                        : stage.status === "error"
                          ? "border-red-500/30 bg-red-500/5"
                          : "border-white/10 bg-white/5"
                    )}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className={cn(
                          "h-2 w-2 rounded-full",
                          stage.status === "active" ? "bg-emerald-400 animate-pulse" : "bg-slate-500"
                        )} />
                        <span className="text-xs font-semibold text-foreground">{stage.name}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-relaxed mb-2">{stage.description}</p>
                      <p className="text-xs font-mono text-emerald-400">{stage.processed.toLocaleString()} processed</p>
                    </div>
                    {i < stages.length - 1 && (
                      <ArrowRight className="h-4 w-4 text-slate-600 mx-1 shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Connectors + Upload + Live Feed */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Source Connectors */}
            <Card className="bg-[#111827]/50 border-white/10">
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
                    {syncingSource === "all" ? "Syncing..." : "Sync All Connected"}
                  </button>
                </div>
                {syncResult && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded-lg p-3 mt-3">
                    {syncResult}
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {connectors.map((c) => {
                  const Icon = connectorIcons[c.icon] || Database
                  const colors = statusColors[c.status] || statusColors.disconnected
                  return (
                    <div
                      key={c.name}
                      className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center", colors.bg)}>
                          <Icon className={cn("h-4 w-4", colors.text)} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{c.name}</p>
                          <p className="text-[10px] text-slate-500">{c.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-slate-400">{c.events_ingested.toLocaleString()}</span>
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

            {/* CSV Upload */}
            <Card className="bg-[#111827]/50 border-white/10">
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
                      : "border-white/10 hover:border-emerald-500/30 hover:bg-emerald-500/5"
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
                    <FileText className="h-8 w-8 text-slate-500 mx-auto mb-2" />
                  )}
                  <p className="text-sm text-slate-300 font-medium">
                    {uploading ? "Processing..." : "Click to upload CSV"}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Required: timestamp, user_email, event_type, source
                  </p>
                  <p className="text-[10px] text-slate-600 mt-0.5">
                    Max file size: {MAX_FILE_SIZE_MB}MB
                  </p>
                </div>

                {/* Download sample */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadSample}
                  className="w-full gap-2 border-white/10 hover:bg-white/5 text-slate-300"
                >
                  <Download className="h-4 w-4" />
                  Download Sample CSV
                </Button>

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
                            <span className="text-slate-500">Ingested:</span>
                            <span className="text-foreground ml-1 font-mono">{uploadResult.summary?.ingested}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Hashed:</span>
                            <span className="text-foreground ml-1 font-mono">{uploadResult.summary?.privacy_hashed}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Errors:</span>
                            <span className="text-foreground ml-1 font-mono">{uploadResult.summary?.errors}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Total:</span>
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

                {/* Privacy note */}
                <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                  <Lock className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                  <p className="text-[10px] text-emerald-400/80 leading-relaxed">
                    All emails are HMAC-hashed before storage. Original PII is AES-256 encrypted in Vault B.
                    Only anonymized hashes enter the analytics pipeline.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Live Ingestion Feed */}
            <Card className="bg-[#111827]/50 border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground text-base">
                  <Activity className="h-5 w-5 text-cyan-400" />
                  Live Ingestion Feed
                  <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse ml-auto" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[360px]">
                  <div className="space-y-2">
                    {recentEvents.length === 0 ? (
                      <div className="text-center py-8 text-slate-500">
                        <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No recent events</p>
                        <p className="text-xs mt-1">Upload a CSV to see data flow through the pipeline</p>
                      </div>
                    ) : (
                      recentEvents.slice().reverse().map((event) => (
                        <div
                          key={event.id}
                          className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.02] border border-white/5 animate-in fade-in duration-300"
                        >
                          <div className={cn(
                            "h-2 w-2 rounded-full shrink-0",
                            event.status === "ingested" ? "bg-emerald-400" : event.status === "hashed" ? "bg-blue-400" : "bg-red-400"
                          )} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-white/10 text-slate-400">
                                {event.source}
                              </Badge>
                              <span className="text-xs text-foreground truncate">{event.event_type}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-slate-500 font-mono">{event.user_hash}</span>
                              <span className="text-[10px] text-slate-600">
                                {new Date(event.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono text-emerald-400/70 shrink-0">
                            {event.latency_ms}ms
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Data Transparency — What We Collect */}
          <Card className="border-border/50 bg-card/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-400" />
                Data Transparency — What Sentinel Sees
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Sentinel analyzes behavioral metadata only. We never access message content, code, or files.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left py-2 px-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Source</th>
                      <th className="text-left py-2 px-3 text-xs font-medium text-emerald-400 uppercase tracking-wider">What We See</th>
                      <th className="text-left py-2 px-3 text-xs font-medium text-red-400 uppercase tracking-wider">What We Never See</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    <tr className="hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 px-3 font-medium text-foreground flex items-center gap-2"><GitBranch className="h-3.5 w-3.5 text-slate-400" /> GitHub</td>
                      <td className="py-2.5 px-3 text-slate-300">Commit timestamps, file counts, PR review frequency</td>
                      <td className="py-2.5 px-3 text-slate-500">Code content, PR descriptions, commit messages</td>
                    </tr>
                    <tr className="hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 px-3 font-medium text-foreground flex items-center gap-2"><MessageSquare className="h-3.5 w-3.5 text-slate-400" /> Slack</td>
                      <td className="py-2.5 px-3 text-slate-300">Reply patterns, reaction counts, channel activity</td>
                      <td className="py-2.5 px-3 text-slate-500">Message text, DMs, file attachments</td>
                    </tr>
                    <tr className="hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 px-3 font-medium text-foreground flex items-center gap-2"><Calendar className="h-3.5 w-3.5 text-slate-400" /> Calendar</td>
                      <td className="py-2.5 px-3 text-slate-300">Meeting duration, attendee count, time of day</td>
                      <td className="py-2.5 px-3 text-slate-500">Meeting agenda, notes, attendee names</td>
                    </tr>
                    <tr className="hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 px-3 font-medium text-foreground flex items-center gap-2"><ClipboardList className="h-3.5 w-3.5 text-slate-400" /> Jira</td>
                      <td className="py-2.5 px-3 text-slate-300">Ticket status changes, sprint velocity, overdue count</td>
                      <td className="py-2.5 px-3 text-slate-500">Ticket descriptions, comments, attachments</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-slate-500 mt-3 flex items-center gap-1.5">
                <Lock className="h-3 w-3" />
                All identities are HMAC-SHA256 hashed before storage. Emails are AES-encrypted in a separate vault.
              </p>
            </CardContent>
          </Card>

          {/* Privacy Architecture */}
          <Card className="bg-[#111827]/50 border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Lock className="h-5 w-5 text-emerald-400" />
                Privacy Architecture
              </CardTitle>
              <CardDescription>
                Dual-vault system ensuring employee data is never stored in plaintext.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/10">
                  <h4 className="text-sm font-semibold text-blue-400 mb-2">1. Identity Hashing</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Emails are HMAC-SHA256 hashed with a secure salt. The hash becomes the
                    user identifier throughout the entire analytics pipeline.
                  </p>
                  <code className="block mt-2 text-[10px] text-blue-400/60 font-mono bg-blue-500/5 rounded p-2">
                    alex@co.com → a7f3b2c1...
                  </code>
                </div>
                <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/10">
                  <h4 className="text-sm font-semibold text-purple-400 mb-2">2. Vault A: Analytics</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Stores behavioral events, risk scores, and engine outputs.
                    Contains only hashed identifiers — no PII.
                  </p>
                  <code className="block mt-2 text-[10px] text-purple-400/60 font-mono bg-purple-500/5 rounded p-2">
                    {"{"} user_hash, event_type, timestamp {"}"}
                  </code>
                </div>
                <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                  <h4 className="text-sm font-semibold text-emerald-400 mb-2">3. Vault B: Identity</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Maps hashes back to encrypted emails for authorized personnel.
                    AES-256-Fernet encryption at rest.
                  </p>
                  <code className="block mt-2 text-[10px] text-emerald-400/60 font-mono bg-emerald-500/5 rounded p-2">
                    {"{"} hash → AES(email) {"}"}
                  </code>
                </div>
              </div>
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
