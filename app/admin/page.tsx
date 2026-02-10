"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Shield,
  Activity,
  Users,
  FileText,
  Settings,
  AlertTriangle,
  CheckCircle2,
  Database,
  Lock,
  TrendingUp,
  Calendar,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  RefreshCw
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
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

  const getRiskColor = (level: string) => {
    switch (level) {
      case "CRITICAL": return "bg-red-100 text-red-800 border-red-200"
      case "ELEVATED": return "bg-amber-100 text-amber-800 border-amber-200"
      case "LOW": return "bg-green-100 text-green-800 border-green-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const formatAction = (action: string) => {
    return action.replace(/_/g, " ").toUpperCase()
  }

  if (loading && !health) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Activity className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-sm text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Admin Dashboard</h1>
              <p className="text-xs text-muted-foreground">System administration and monitoring</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-primary text-primary-foreground">
              Admin
            </Badge>
            <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 lg:p-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
            <TabsTrigger value="health">System Health</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          </TabsList>

          {/* SYSTEM HEALTH TAB */}
          <TabsContent value="health" className="space-y-6">
            {health && (
              <>
                {/* Status Card */}
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-green-800">System Healthy</h3>
                        <p className="text-sm text-green-700">
                          Last updated: {new Date(health.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Key Metrics */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{health.database.total_users}</div>
                      <p className="text-xs text-muted-foreground">Registered accounts</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                      <Database className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{health.database.total_events.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground">Tracked activities</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">At Risk</CardTitle>
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600">
                        {health.risk_summary.at_risk_total}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {health.risk_summary.critical_count} critical, {health.risk_summary.elevated_count} elevated
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Consent Rate</CardTitle>
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{health.users.consent_rate.percentage}%</div>
                      <p className="text-xs text-muted-foreground">
                        {health.users.consent_rate.consented}/{health.users.consent_rate.total} users
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Role Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      User Distribution by Role
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                      {Object.entries(health.users.by_role).map(([role, count]) => (
                        <div key={role} className="flex items-center justify-between rounded-lg border p-4">
                          <div className="flex items-center gap-3">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                              role === "admin" ? "bg-purple-100 text-purple-600" :
                              role === "manager" ? "bg-blue-100 text-blue-600" :
                              "bg-gray-100 text-gray-600"
                            }`}>
                              {role === "admin" ? <Shield className="h-5 w-5" /> :
                               role === "manager" ? <Users className="h-5 w-5" /> :
                               <Activity className="h-5 w-5" />}
                            </div>
                            <div>
                              <p className="font-medium capitalize">{role}s</p>
                              <p className="text-sm text-muted-foreground">{count} users</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Activity (Last 24 Hours)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="flex items-center gap-3">
                          <Database className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">New Events</p>
                            <p className="text-sm text-muted-foreground">Tracked in last 24h</p>
                          </div>
                        </div>
                        <span className="text-2xl font-bold">{health.activity_24h.events}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Audit Logs</p>
                            <p className="text-sm text-muted-foreground">Created in last 24h</p>
                          </div>
                        </div>
                        <span className="text-2xl font-bold">{health.activity_24h.audit_logs}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* USERS TAB */}
          <TabsContent value="users" className="space-y-6">
            <div className="flex items-center gap-4">
              <Select value={userRole} onValueChange={setUserRole}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All roles</SelectItem>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={fetchUsers}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Load Users
              </Button>
            </div>

            {users.length > 0 && (
              <Card>
                <CardContent className="pt-6">
                  <ScrollArea className="h-[600px]">
                    <table className="w-full">
                      <thead className="sticky top-0 bg-background">
                        <tr className="border-b">
                          <th className="pb-2 text-left text-sm font-medium">User Hash</th>
                          <th className="pb-2 text-left text-sm font-medium">Role</th>
                          <th className="pb-2 text-left text-sm font-medium">Risk Level</th>
                          <th className="pb-2 text-left text-sm font-medium">Consent</th>
                          <th className="pb-2 text-left text-sm font-medium">Manager</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {users.map((user) => (
                          <tr key={user.user_hash} className="py-2">
                            <td className="py-3 font-mono text-xs">{user.user_hash.slice(0, 16)}...</td>
                            <td className="py-3">
                              <Badge variant="outline" className="capitalize">
                                {user.role}
                              </Badge>
                            </td>
                            <td className="py-3">
                              <Badge className={getRiskColor(user.risk_level)}>
                                {user.risk_level}
                              </Badge>
                            </td>
                            <td className="py-3">
                              {user.consent_share_with_manager ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                            <td className="py-3">
                              {user.has_manager ? (
                                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* AUDIT LOGS TAB */}
          <TabsContent value="audit" className="space-y-6">
            <div className="flex flex-wrap items-center gap-4">
              <Select value={auditDays} onValueChange={setAuditDays}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Time period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Last 24 hours</SelectItem>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={auditAction} onValueChange={setAuditAction}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All actions</SelectItem>
                  <SelectItem value="data_access">Data Access</SelectItem>
                  <SelectItem value="consent">Consent Changes</SelectItem>
                  <SelectItem value="login">Login/Auth</SelectItem>
                </SelectContent>
              </Select>
              
              <Button onClick={fetchAuditLogs}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Load Logs
              </Button>
            </div>

            {auditLogs.length > 0 && (
              <Card>
                <CardContent className="pt-6">
                  <ScrollArea className="h-[600px]">
                    <div className="space-y-4">
                      {auditLogs.map((log) => (
                        <div key={log.id} className="rounded-lg border p-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {formatAction(log.action)}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(log.timestamp).toLocaleString()}
                                </span>
                              </div>
                              <p className="font-mono text-xs text-muted-foreground">
                                User: {log.user_hash.slice(0, 16)}...
                              </p>
                            </div>
                          </div>
                          {log.details && Object.keys(log.details).length > 0 && (
                            <div className="mt-2 rounded bg-muted p-2">
                              <pre className="text-xs overflow-x-auto">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  
                  {/* Pagination */}
                  <div className="mt-4 flex items-center justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setAuditOffset(Math.max(0, auditOffset - 50))
                        fetchAuditLogs()
                      }}
                      disabled={auditOffset === 0}
                    >
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Offset: {auditOffset}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setAuditOffset(auditOffset + 50)
                        fetchAuditLogs()
                      }}
                    >
                      Next
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
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
