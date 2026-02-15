"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Shield,
  Activity,
  Users,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Database,
  Lock,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  LayoutDashboard,
  TrendingUp,
  Gauge,
  Radio,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ProtectedRoute } from "@/components/protected-route"
import { api } from "@/lib/api"

interface SystemHealth {
  status: string
  timestamp: string
  database: {
    total_users: number
    total_events: number
    total_audit_logs: number
    total_risk_scores: number
  }
  users: {
    by_role: Record<string, number>
    consent_rate: {
      consented: number
      total: number
      percentage: number
    }
  }
  risk_summary: {
    distribution: Record<string, number>
    critical_count: number
    elevated_count: number
    at_risk_total: number
  }
  activity_24h: {
    events: number
    audit_logs: number
  }
}

interface AuditLog {
  id: number
  user_hash: string
  action: string
  details: any
  timestamp: string
}

interface User {
  user_hash: string
  role: string
  consent_share_with_manager: boolean
  consent_share_anonymized: boolean
  monitoring_paused: boolean
  risk_level: string
  velocity: number | null
  has_manager: boolean
}

function AdminPageContent() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("health")
  const [health, setHealth] = useState<SystemHealth | null>(null)
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [auditDays, setAuditDays] = useState("7")
  const [auditAction, setAuditAction] = useState("")
  const [userRole, setUserRole] = useState("")
  const [auditOffset, setAuditOffset] = useState(0)

  useEffect(() => {
    fetchHealthData()
  }, [])

  const fetchHealthData = async () => {
    try {
      setLoading(true)
      const response = await api.get("/admin/health")
      setHealth(response.data)
      setError(null)
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load system health")
    } finally {
      setLoading(false)
    }
  }

  const fetchAuditLogs = async () => {
    try {
      setLoading(true)
      let url = `/admin/audit-logs?days=${auditDays}&limit=50&offset=${auditOffset}`
      if (auditAction) url += `&action_type=${auditAction}`

      const response = await api.get(url)
      setAuditLogs(response.data.logs)
      setError(null)
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load audit logs")
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      setLoading(true)
      let url = "/admin/users?limit=100"
      if (userRole) url += `&role=${userRole}`

      const response = await api.get(url)
      setUsers(response.data.users)
      setError(null)
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load users")
    } finally {
      setLoading(false)
    }
  }

  const getRiskBadge = (level: string) => {
    switch (level) {
      case "CRITICAL": return "bg-red-500/15 text-[hsl(var(--sentinel-critical))] border-red-500/20"
      case "ELEVATED": return "bg-amber-500/15 text-[hsl(var(--sentinel-elevated))] border-amber-500/20"
      case "LOW": return "bg-emerald-500/15 text-[hsl(var(--sentinel-healthy))] border-emerald-500/20"
      default: return "bg-muted/30 text-muted-foreground border-[var(--glass-border)]"
    }
  }

  const formatAction = (action: string) => {
    return action.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  }

  // ─── Loading ─────────────────────────────────────────
  if (loading && !health) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-3 h-10 w-10 rounded-full border-2 border-[hsl(var(--sentinel-healthy))] border-t-transparent animate-spin" />
          <p className="text-sm font-medium text-muted-foreground">Loading admin dashboard…</p>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: "health", label: "System Health", icon: <Gauge className="h-3.5 w-3.5" /> },
    { id: "users", label: "Users", icon: <Users className="h-3.5 w-3.5" /> },
    { id: "audit", label: "Audit Logs", icon: <FileText className="h-3.5 w-3.5" /> },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* ═══════════ HEADER ═══════════ */}
      <header
        className="sticky top-0 z-40 border-b border-[var(--glass-border)]"
        style={{ background: "var(--glass-bg)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}
      >
        <div className="container mx-auto flex h-16 items-center justify-between px-5">
          <div className="flex items-center gap-3.5">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-[hsl(var(--sentinel-gem))]"
              style={{ boxShadow: "var(--glow-gem)" }}
            >
              <Shield className="h-[18px] w-[18px] text-white" />
            </div>
            <div>
              <h1 className="text-[15px] font-semibold tracking-tight text-foreground">Admin Dashboard</h1>
              <p className="text-[10px] text-muted-foreground leading-none mt-0.5">System administration and monitoring</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              className="text-[10px] bg-[hsl(var(--sentinel-gem)/0.15)] text-[hsl(var(--sentinel-gem))] border-[hsl(var(--sentinel-gem)/0.3)]"
            >
              Admin
            </Badge>
            <button
              onClick={() => router.push("/dashboard")}
              className="flex items-center gap-1.5 rounded-lg bg-[hsl(var(--primary))] px-3 py-2 text-[12px] font-medium text-[hsl(var(--primary-foreground))] transition-all hover:opacity-90"
              style={{ boxShadow: "0 0 12px hsl(152 55% 48% / 0.15)" }}
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              Dashboard
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-5 py-8 view-transition-enter">
        {/* Error */}
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-[hsl(var(--sentinel-critical)/0.3)] bg-[hsl(var(--sentinel-critical)/0.06)] px-5 py-3.5">
            <AlertTriangle className="h-4 w-4 shrink-0 text-[hsl(var(--sentinel-critical))]" />
            <p className="text-sm text-[hsl(var(--sentinel-critical))]">{error}</p>
            <button onClick={() => setError(null)} className="ml-auto text-xs text-muted-foreground hover:text-foreground">
              Dismiss
            </button>
          </div>
        )}

        {/* ═══════════ TAB NAVIGATION ═══════════ */}
        <div className="flex items-center gap-1 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-1 mb-6 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id)
                if (tab.id === "users" && users.length === 0) fetchUsers()
                if (tab.id === "audit" && auditLogs.length === 0) fetchAuditLogs()
              }}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-[12px] font-medium transition-all ${activeTab === tab.id
                  ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-[var(--glass-bg-hover)]"
                }`}
              style={activeTab === tab.id ? { boxShadow: "0 0 12px hsl(152 55% 48% / 0.15)" } : undefined}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* ═══════════ SYSTEM HEALTH ═══════════ */}
        {activeTab === "health" && health && (
          <div className="space-y-5">
            {/* System Status Banner */}
            <div
              className="glass-card glass-card-accent glass-card-accent--healthy rounded-xl p-5"
              style={{ boxShadow: "var(--glow-healthy)" }}
            >
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500/10">
                  <CheckCircle2 className="h-5 w-5 text-[hsl(var(--sentinel-healthy))]" />
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold text-foreground">System Healthy</h3>
                  <p className="text-[11px] font-mono text-muted-foreground">
                    Last updated: {new Date(health.timestamp).toLocaleString()}
                  </p>
                </div>
                <div className="ml-auto">
                  <span className="relative flex h-3 w-3">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-[hsl(var(--sentinel-healthy))] opacity-75 animate-ping" />
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-[hsl(var(--sentinel-healthy))]" />
                  </span>
                </div>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Total Users"
                value={health.database.total_users.toString()}
                subtitle="Registered accounts"
                icon={<Users className="h-4 w-4 text-muted-foreground" />}
              />
              <StatCard
                title="Total Events"
                value={health.database.total_events.toLocaleString()}
                subtitle="Tracked activities"
                icon={<Database className="h-4 w-4 text-muted-foreground" />}
              />
              <StatCard
                title="At Risk"
                value={health.risk_summary.at_risk_total.toString()}
                subtitle={`${health.risk_summary.critical_count} critical, ${health.risk_summary.elevated_count} elevated`}
                icon={<AlertTriangle className="h-4 w-4 text-[hsl(var(--sentinel-critical))]" />}
                valueColor="text-[hsl(var(--sentinel-critical))]"
              />
              <StatCard
                title="Consent Rate"
                value={`${health.users.consent_rate.percentage}%`}
                subtitle={`${health.users.consent_rate.consented}/${health.users.consent_rate.total} users`}
                icon={<Lock className="h-4 w-4 text-muted-foreground" />}
              />
            </div>

            {/* Role Distribution */}
            <div className="glass-card rounded-xl p-6">
              <div className="flex items-center gap-2.5 mb-5">
                <Users className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-[13px] font-semibold text-foreground">User Distribution by Role</h3>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {Object.entries(health.users.by_role).map(([role, count]) => (
                  <div key={role} className="flex items-center justify-between rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] p-4 transition-colors hover:bg-[var(--glass-bg-hover)]">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${role === "admin" ? "bg-[hsl(var(--sentinel-gem)/0.1)]" :
                          role === "manager" ? "bg-[hsl(var(--sentinel-info)/0.1)]" :
                            "bg-muted/30"
                        }`}>
                        {role === "admin" ? <Shield className="h-4 w-4 text-[hsl(var(--sentinel-gem))]" /> :
                          role === "manager" ? <Users className="h-4 w-4 text-[hsl(var(--sentinel-info))]" /> :
                            <Activity className="h-4 w-4 text-muted-foreground" />}
                      </div>
                      <div>
                        <p className="text-[13px] font-medium text-foreground capitalize">{role}s</p>
                        <p className="text-[10px] font-mono text-muted-foreground">{count} users</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Activity 24h */}
            <div className="glass-card rounded-xl p-6">
              <div className="flex items-center gap-2.5 mb-5">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-[13px] font-semibold text-foreground">Activity (Last 24 Hours)</h3>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="flex items-center justify-between rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] p-4">
                  <div className="flex items-center gap-3">
                    <Database className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-[13px] font-medium text-foreground">New Events</p>
                      <p className="text-[10px] text-muted-foreground">Tracked in last 24h</p>
                    </div>
                  </div>
                  <span className="text-xl font-bold font-mono text-foreground">{health.activity_24h.events}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] p-4">
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-[13px] font-medium text-foreground">Audit Logs</p>
                      <p className="text-[10px] text-muted-foreground">Created in last 24h</p>
                    </div>
                  </div>
                  <span className="text-xl font-bold font-mono text-foreground">{health.activity_24h.audit_logs}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════ USERS TAB ═══════════ */}
        {activeTab === "users" && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <Select value={userRole} onValueChange={setUserRole}>
                <SelectTrigger className="w-[160px] border-[var(--glass-border)] bg-[var(--glass-bg)] text-[12px]">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roles</SelectItem>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={fetchUsers}
                size="sm"
                className="text-[12px]"
              >
                <RefreshCw className="mr-2 h-3.5 w-3.5" />
                Load Users
              </Button>
            </div>

            {users.length > 0 && (
              <div className="glass-card rounded-xl overflow-hidden">
                <ScrollArea className="h-[600px]">
                  <table className="w-full">
                    <thead className="sticky top-0 border-b border-[var(--glass-border)]" style={{ background: "hsl(var(--card))" }}>
                      <tr>
                        <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">User Hash</th>
                        <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Role</th>
                        <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Risk Level</th>
                        <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Consent</th>
                        <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Manager</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--glass-border)]">
                      {users.map((user) => (
                        <tr key={user.user_hash} className="transition-colors hover:bg-[var(--glass-bg-hover)]">
                          <td className="px-5 py-3.5 font-mono text-[11px] text-muted-foreground">{user.user_hash.slice(0, 16)}…</td>
                          <td className="px-5 py-3.5">
                            <Badge variant="outline" className="capitalize text-[10px] border-[var(--glass-border)]">
                              {user.role}
                            </Badge>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-semibold ${getRiskBadge(user.risk_level)}`}>
                              {user.risk_level}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            {user.consent_share_with_manager ? (
                              <CheckCircle2 className="h-4 w-4 text-[hsl(var(--sentinel-healthy))]" />
                            ) : (
                              <span className="text-muted-foreground/40">—</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            {user.has_manager ? (
                              <CheckCircle2 className="h-4 w-4 text-[hsl(var(--sentinel-info))]" />
                            ) : (
                              <span className="text-muted-foreground/40">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </ScrollArea>
              </div>
            )}

            {users.length === 0 && !loading && (
              <div className="glass-card rounded-xl p-12 text-center">
                <Users className="mx-auto mb-3 h-8 w-8 text-muted-foreground/30" />
                <p className="text-sm font-medium text-muted-foreground">Click "Load Users" to view the user list</p>
              </div>
            )}
          </div>
        )}

        {/* ═══════════ AUDIT LOGS TAB ═══════════ */}
        {activeTab === "audit" && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <Select value={auditDays} onValueChange={setAuditDays}>
                <SelectTrigger className="w-[140px] border-[var(--glass-border)] bg-[var(--glass-bg)] text-[12px]">
                  <SelectValue placeholder="Time period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Last 24 hours</SelectItem>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                </SelectContent>
              </Select>

              <Select value={auditAction} onValueChange={setAuditAction}>
                <SelectTrigger className="w-[160px] border-[var(--glass-border)] bg-[var(--glass-bg)] text-[12px]">
                  <SelectValue placeholder="Filter by action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All actions</SelectItem>
                  <SelectItem value="data_access">Data Access</SelectItem>
                  <SelectItem value="consent">Consent Changes</SelectItem>
                  <SelectItem value="login">Login/Auth</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={fetchAuditLogs} size="sm" className="text-[12px]">
                <RefreshCw className="mr-2 h-3.5 w-3.5" />
                Load Logs
              </Button>
            </div>

            {auditLogs.length > 0 && (
              <div className="glass-card rounded-xl p-5">
                <ScrollArea className="h-[600px]">
                  <div className="space-y-3">
                    {auditLogs.map((log) => (
                      <div
                        key={log.id}
                        className="rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] p-4 transition-colors hover:bg-[var(--glass-bg-hover)]"
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex rounded-md border border-[var(--glass-border)] bg-[var(--glass-bg)] px-2 py-0.5 text-[10px] font-semibold text-foreground">
                                {formatAction(log.action)}
                              </span>
                              <span className="text-[10px] font-mono text-muted-foreground">
                                {new Date(log.timestamp).toLocaleString()}
                              </span>
                            </div>
                            <p className="font-mono text-[10px] text-muted-foreground">
                              User: {log.user_hash.slice(0, 16)}…
                            </p>
                          </div>
                        </div>
                        {log.details && Object.keys(log.details).length > 0 && (
                          <div className="mt-2.5 rounded-lg bg-muted/30 p-2.5">
                            <pre className="text-[10px] font-mono text-muted-foreground overflow-x-auto">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {/* Pagination */}
                <div className="mt-4 flex items-center justify-between border-t border-[var(--glass-border)] pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-[12px] border-[var(--glass-border)]"
                    onClick={() => {
                      setAuditOffset(Math.max(0, auditOffset - 50))
                      fetchAuditLogs()
                    }}
                    disabled={auditOffset === 0}
                  >
                    <ChevronLeft className="mr-1 h-3.5 w-3.5" />
                    Previous
                  </Button>
                  <span className="text-[11px] font-mono text-muted-foreground">
                    Offset: {auditOffset}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-[12px] border-[var(--glass-border)]"
                    onClick={() => {
                      setAuditOffset(auditOffset + 50)
                      fetchAuditLogs()
                    }}
                  >
                    Next
                    <ChevronRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}

            {auditLogs.length === 0 && !loading && (
              <div className="glass-card rounded-xl p-12 text-center">
                <FileText className="mx-auto mb-3 h-8 w-8 text-muted-foreground/30" />
                <p className="text-sm font-medium text-muted-foreground">Click "Load Logs" to view audit history</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────

function StatCard({
  title,
  value,
  subtitle,
  icon,
  valueColor = "text-foreground",
}: {
  title: string
  value: string
  subtitle: string
  icon: React.ReactNode
  valueColor?: string
}) {
  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
        {icon}
      </div>
      <p className={`text-2xl font-bold font-mono ${valueColor}`}>{value}</p>
      <p className="text-[10px] text-muted-foreground mt-1">{subtitle}</p>
    </div>
  )
}

export default function AdminPage() {
  return (
    <ProtectedRoute>
      <AdminPageContent />
    </ProtectedRoute>
  )
}
