"use client"

import { useState, useEffect, useMemo } from "react"
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
  Gauge,
  Server,
  Zap,
  Search,
  Download,
  Trash2,
  Edit,
  MoreHorizontal,
  UserCog,
  Loader2,
  X,
  Save
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProtectedRoute } from "@/components/protected-route"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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
  email: string | null
  name: string | null
  role: string
  consent_share_with_manager: boolean
  consent_share_anonymized: boolean
  monitoring_paused: boolean
  risk_level: string
  velocity: number | null
  has_manager: boolean
}

interface Manager {
  user_hash: string
  role: string
}

const MOCK_SERVICES = [
  { name: "API Gateway", status: "operational" as const, latency: "24ms", uptime: "99.99%" },
  { name: "PostgreSQL Database", status: "operational" as const, latency: "12ms", uptime: "99.95%" },
  { name: "Redis Cache", status: "operational" as const, latency: "2ms", uptime: "100%" },
  { name: "AI Insight Engine", status: "degraded" as const, latency: "450ms", uptime: "98.50%" },
  { name: "Celery Workers", status: "operational" as const, latency: "N/A", uptime: "99.90%" },
]

const getRiskBadge = (level: string) => {
  switch (level) {
    case "CRITICAL": return "bg-red-500/15 text-red-500 border-red-500/20"
    case "ELEVATED": return "bg-amber-500/15 text-amber-500 border-amber-500/20"
    case "LOW": return "bg-emerald-500/15 text-emerald-500 border-emerald-500/20"
    default: return "bg-slate-500/15 text-slate-400 border-slate-500/20"
  }
}

const formatAction = (action: string) => {
  return action.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
}

function AdminPageContent() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("health")
  const [health, setHealth] = useState<SystemHealth | null>(null)
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [managers, setManagers] = useState<Manager[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date())

  const [auditDays, setAuditDays] = useState("7")
  const [auditAction, setAuditAction] = useState("all")
  const [auditOffset, setAuditOffset] = useState(0)
  const [userRole, setUserRole] = useState("all")
  const [userSearch, setUserSearch] = useState("")

  const [editUser, setEditUser] = useState<User | null>(null)
  const [editEmail, setEditEmail] = useState("")
  const [roleUser, setRoleUser] = useState<User | null>(null)
  const [newRole, setNewRole] = useState("")
  const [deleteUser, setDeleteUser] = useState<User | null>(null)
  const [assignManagerUser, setAssignManagerUser] = useState<User | null>(null)
  const [selectedManager, setSelectedManager] = useState("")

  useEffect(() => {
    fetchHealthData()
  }, [])

  const fetchHealthData = async () => {
    try {
      setLoading(true)
      const response = await api.get<SystemHealth>("/admin/health")
      setHealth(response as SystemHealth)
      setLastRefreshed(new Date())
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
      if (auditAction && auditAction !== "all") url += `&action_type=${auditAction}`
      
      const response = await api.get<{ logs: AuditLog[] }>(url)
      setAuditLogs((response as { logs: AuditLog[] }).logs)
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
      if (userRole && userRole !== "all") url += `&role=${userRole}`
      
      const response = await api.get<{ users: User[] }>(url)
      setUsers((response as { users: User[] }).users)
      setError(null)
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load users")
    } finally {
      setLoading(false)
    }
  }

  const fetchManagers = async () => {
    try {
      const response = await api.get<{ managers: Manager[] }>("/admin/managers")
      setManagers((response as { managers: Manager[] }).managers)
    } catch (err: any) {
      // managers fetch failed
    }
  }

  const handleRoleChange = async () => {
    if (!roleUser || !newRole) return
    setActionLoading("role")
    try {
      await api.post(`/admin/user/${roleUser.user_hash}/role?new_role=${newRole}`)
      setSuccess(`Role changed to ${newRole} successfully`)
      setRoleUser(null)
      setNewRole("")
      fetchUsers()
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to change role")
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteUser = async () => {
    if (!deleteUser) return
    setActionLoading("delete")
    try {
      await api.delete(`/admin/user/${deleteUser.user_hash}`)
      setSuccess(`User deleted successfully`)
      setDeleteUser(null)
      fetchUsers()
      fetchHealthData()
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to delete user")
    } finally {
      setActionLoading(null)
    }
  }

  const handleUpdateProfile = async () => {
    if (!editUser || !editEmail) return
    setActionLoading("edit")
    try {
      await api.put(`/admin/user/${editUser.user_hash}?email=${encodeURIComponent(editEmail)}`)
      setSuccess("Profile updated successfully")
      setEditUser(null)
      setEditEmail("")
      fetchUsers()
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to update profile")
    } finally {
      setActionLoading(null)
    }
  }

  const handleAssignManager = async () => {
    if (!assignManagerUser || !selectedManager) return
    setActionLoading("manager")
    try {
      await api.post(`/admin/user/${assignManagerUser.user_hash}/manager?manager_hash=${selectedManager}`)
      setSuccess("Manager assigned successfully")
      setAssignManagerUser(null)
      setSelectedManager("")
      fetchUsers()
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to assign manager")
    } finally {
      setActionLoading(null)
    }
  }

  useEffect(() => {
    if (activeTab === "users") {
      fetchUsers()
      fetchManagers()
    }
    if (activeTab === "audit") {
      fetchAuditLogs()
    }
  }, [activeTab, userRole, auditDays, auditAction, auditOffset])

  const filteredUsers = useMemo(() => {
    return users.filter(user => 
      user.user_hash.toLowerCase().includes(userSearch.toLowerCase())
    )
  }, [users, userSearch])

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [success])

  if (loading && !health) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-12 w-12">
            <div className="absolute inset-0 rounded-full border-t-2 border-primary animate-spin"></div>
            <div className="absolute inset-2 rounded-full border-t-2 border-indigo-500 animate-spin reverse"></div>
          </div>
          <p className="text-sm font-medium text-muted-foreground">Initializing Engine Room...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-background       text-foreground font-sans selection:bg-indigo-500/30">
      {error && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-lg border border-[hsl(var(--sentinel-critical))]/20 bg-[hsl(var(--sentinel-critical))]/10 px-4 py-3 animate-in slide-in-from-top-2">
          <AlertTriangle className="h-5 w-5" style={{color: 'hsl(var(--sentinel-critical))'}} />
          <p className="text-sm font-medium" style={{color: 'hsl(var(--sentinel-critical))'}}>{error}</p>
          <Button variant="ghost" size="sm" onClick={() => setError(null)} className="ml-2 h-auto p-1" style={{color: 'hsl(var(--sentinel-critical))'}}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {success && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-lg border border-[hsl(var(--sentinel-healthy))]/20 bg-[hsl(var(--sentinel-healthy))]/10 px-4 py-3 animate-in slide-in-from-top-2">
          <CheckCircle2 className="h-5 w-5" style={{color: 'hsl(var(--sentinel-healthy))'}} />
          <p className="text-sm font-medium" style={{color: 'hsl(var(--sentinel-healthy))'}}>{success}</p>
          <Button variant="ghost" size="sm" onClick={() => setSuccess(null)} className="ml-2 h-auto p-1" style={{color: 'hsl(var(--sentinel-healthy))'}}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1a1a2e] border border-amber-500/30">
              <Shield className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-foreground">Admin Panel</h1>
              <p className="text-[11px] text-muted-foreground font-medium">System Administration & Diagnostics</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => router.push("/dashboard?view=admin")}
              className="gap-2 text-muted-foreground hover:text-foreground hover:bg-white/5"
            >
              <LayoutDashboard className="h-4 w-4" />
              Command Center
            </Button>
            <Badge variant="outline" className="ml-2 border-amber-500/30 text-amber-500 bg-amber-500/05 font-mono">
              ROOT_ACCESS
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 flex-1">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <TabsList className="bg-card border border-border p-1 h-auto w-fit">
              <TabsTrigger value="health" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-foreground px-4 py-2 text-xs font-medium gap-2">
                <Activity className="h-3.5 w-3.5" /> System Health
              </TabsTrigger>
              <TabsTrigger value="users" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-foreground px-4 py-2 text-xs font-medium gap-2">
                <Users className="h-3.5 w-3.5" /> All Users
              </TabsTrigger>
              <TabsTrigger value="audit" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-foreground px-4 py-2 text-xs font-medium gap-2">
                <FileText className="h-3.5 w-3.5" /> Audit Logs
              </TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground/70 font-mono hidden sm:block">
                LAST SYNC: {lastRefreshed.toLocaleTimeString()}
              </span>
              <Button 
                size="sm" 
                variant="outline" 
                className="h-8 border-border hover:bg-white/5 text-muted-foreground hover:text-foreground"
                onClick={() => {
                  if (activeTab === "health") fetchHealthData()
                  if (activeTab === "users") fetchUsers()
                  if (activeTab === "audit") fetchAuditLogs()
                }}
              >
                <RefreshCw className={cn("h-3.5 w-3.5 mr-2", loading ? "animate-spin" : "")} />
                Refresh
              </Button>
            </div>
          </div>

          <TabsContent value="health" className="space-y-6 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2 duration-500">
            {health && (
              <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <StatBlock label="Total Users" value={health.database.total_users.toString()} icon={<Users className="h-4 w-4" />} color="indigo" />
                  <StatBlock label="Total Events" value={health.database.total_events.toLocaleString()} icon={<Database className="h-4 w-4" />} color="emerald" />
                  <StatBlock label="Risk Alerts" value={health.risk_summary.at_risk_total.toString()} icon={<AlertTriangle className="h-4 w-4" />} color="amber" />
                  <StatBlock label="Consent Rate" value={`${health.users.consent_rate.percentage}%`} icon={<Lock className="h-4 w-4" />} color="purple" />
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <Card className="col-span-2 md:col-span-1 bg-card/50 border-border">
                    <CardHeader className="pb-3 border-b border-border">
                      <CardTitle className="text-sm font-medium flex items-center gap-2 text-foreground">
                        <Server className="h-4 w-4 text-indigo-400" />
                        Infrastructure Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4"> 
                      <div className="space-y-1">
                        {MOCK_SERVICES.map((service, i) => (
                          <div key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className={cn("h-2.5 w-2.5 rounded-full ring-2 ring-offset-2 ring-offset-card", service.status === "operational" ? "bg-emerald-500 ring-emerald-500/20" : "bg-amber-500 ring-amber-500/20")} />
                               <span className="text-sm font-medium text-foreground">{service.name}</span>
                            </div>
                             <div className="flex items-center gap-4 text-xs text-muted-foreground">
                               <span className="font-mono">Lat: <span className="text-foreground">{service.latency}</span></span>
                              <Badge variant="outline" className={cn("border-0 bg-opacity-10 uppercase tracking-wider text-[10px]", service.status === "operational" ? "bg-emerald-500 text-emerald-400" : "bg-[hsl(var(--sentinel-elevated))]")} style={service.status !== "operational" ? {color: 'hsl(var(--sentinel-elevated))'} : undefined}>
                                {service.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-card/50 border-border">
                    <CardHeader className="pb-3 border-b border-border">
                      <CardTitle className="text-sm font-medium text-foreground">Risk Distribution</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                      <div className="flex justify-between items-center">
                         <span className="text-sm text-muted-foreground">Critical</span>
                         <Badge className="bg-[hsl(var(--sentinel-critical))]/20 border-[hsl(var(--sentinel-critical))]/30" style={{color: 'hsl(var(--sentinel-critical))'}}>{health.risk_summary.critical_count}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                         <span className="text-sm text-muted-foreground">Elevated</span>
                         <Badge className="bg-[hsl(var(--sentinel-elevated))]/20 border-[hsl(var(--sentinel-elevated))]/30" style={{color: 'hsl(var(--sentinel-elevated))'}}>{health.risk_summary.elevated_count}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                         <span className="text-sm text-muted-foreground">Healthy</span>
                         <Badge className="bg-[hsl(var(--sentinel-healthy))]/20 border-[hsl(var(--sentinel-healthy))]/30" style={{color: 'hsl(var(--sentinel-healthy))'}}>{health.database.total_users - health.risk_summary.at_risk_total}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="users" className="space-y-6 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-card/50 p-4 rounded-xl border border-border">
              <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                <div className="relative">
                   <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground/70" />
                  <Input 
                    placeholder="Search users..." 
                    className="pl-9 bg-background border-border w-full md:w-[250px] text-sm"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                  />
                </div>
                <Select value={userRole} onValueChange={(val) => { setUserRole(val); fetchUsers() }}>
                  <SelectTrigger className="w-[150px] bg-background border-border">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="employee">Employee</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                </div>
               <div className="text-sm text-muted-foreground/70">
                {filteredUsers.length} users found
              </div>
            </div>

            <Card className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr className="border-b border-border">
                      <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground h-12 px-4">User</th>
                      <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground h-12 px-4">Role</th>
                      <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground h-12 px-4">Risk Level</th>
                      <th className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground h-12 px-4">Manager</th>
                      <th className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground h-12 px-4">Consent</th>
                      <th className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground h-12 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((user) => (
                        <tr key={user.user_hash} className="hover:bg-white/[0.02]">
                          <td className="px-4 py-3">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-foreground">{user.name || user.user_hash.slice(0, 8) + "..."}</span>
                               {user.email && <span className="text-xs text-muted-foreground/70">{user.email}</span>}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                             <Badge variant="secondary" className="capitalize text-[10px] bg-white/10 text-foreground">
                              {user.role}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className={cn("text-[10px] border-0", getRiskBadge(user.risk_level))}>
                              {user.risk_level}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {user.has_manager ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" />
                            ) : (
                              <span className="text-slate-600">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {user.consent_share_with_manager ? (
                              <Lock className="h-3.5 w-3.5 text-indigo-400 mx-auto" />
                            ) : (
                              <span className="text-slate-600">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => { setEditUser(user); setEditEmail(user.email || "") }}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => { setRoleUser(user); setNewRole(user.role) }}>
                                <UserCog className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => { setAssignManagerUser(user); setSelectedManager(user.has_manager ? "remove" : "") }}>
                                <Users className="h-4 w-4" />
                              </Button>
                               <Button variant="ghost" size="icon" className="h-8 w-8" style={{color: 'hsl(var(--sentinel-critical))'}} onClick={() => setDeleteUser(user)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                         <td colSpan={6} className="h-32 text-center text-muted-foreground/70">
                          No users found matching your criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="audit" className="space-y-6 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-card/50 p-4 rounded-xl border border-border">
              <div className="flex gap-3">
                <Select value={auditDays} onValueChange={setAuditDays}>
                  <SelectTrigger className="w-[140px] bg-background border-border">
                    <SelectValue placeholder="Period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Last 24 Hours</SelectItem>
                    <SelectItem value="7">Last 7 Days</SelectItem>
                    <SelectItem value="30">Last 30 Days</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={auditAction} onValueChange={setAuditAction}>
                  <SelectTrigger className="w-[160px] bg-background border-border">
                    <SelectValue placeholder="Action Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    <SelectItem value="data_access">Data Access</SelectItem>
                    <SelectItem value="consent">Consent Change</SelectItem>
                    <SelectItem value="authentication">Auth Events</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setAuditOffset(Math.max(0, auditOffset - 50))} disabled={auditOffset === 0} className="border-border">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs font-mono text-muted-foreground/70 w-20 text-center">OFFSET: {auditOffset}</span>
                <Button variant="outline" size="sm" onClick={() => setAuditOffset(auditOffset + 50)} className="border-border">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Card className="bg-card/50 border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white/5 text-xs uppercase text-muted-foreground font-semibold">
                    <tr>
                      <th className="px-6 py-3 border-b border-border w-[200px]">Timestamp</th>
                      <th className="px-6 py-3 border-b border-border w-[150px]">Action</th>
                      <th className="px-6 py-3 border-b border-border">User</th>
                      <th className="px-6 py-3 border-b border-border">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {auditLogs.length > 0 ? (
                      auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-white/[0.02]">
                          <td className="px-6 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="px-6 py-3">
                            <Badge variant="outline" className="border-indigo-500/20 text-indigo-400 bg-indigo-500/10 text-[10px] uppercase">
                              {formatAction(log.action)}
                            </Badge>
                          </td>
                          <td className="px-6 py-3 font-mono text-xs text-foreground">
                            {log.user_hash?.slice(0, 8)}...
                          </td>
                          <td className="px-6 py-3">
                            <code className="text-[10px] text-muted-foreground/70 font-mono bg-black/20 px-2 py-1 rounded block truncate max-w-[400px]">
                              {JSON.stringify(log.details)}
                            </code>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                         <td colSpan={4} className="h-32 text-center text-muted-foreground/70">
                          No audit logs found for this period.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Profile</DialogTitle>
            <DialogDescription>Update user information for {editUser?.user_hash.slice(0, 8)}...</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium">Email Address</label>
            <Input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder="user@example.com" className="mt-2" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>Cancel</Button>
            <Button onClick={handleUpdateProfile} disabled={actionLoading === "edit"}>
              {actionLoading === "edit" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!roleUser} onOpenChange={() => setRoleUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>Update role for {roleUser?.user_hash.slice(0, 8)}...</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium">New Role</label>
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="employee">Employee</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleUser(null)}>Cancel</Button>
            <Button onClick={handleRoleChange} disabled={actionLoading === "role" || newRole === roleUser?.role}>
              {actionLoading === "role" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserCog className="h-4 w-4 mr-2" />}
              Change Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteUser} onOpenChange={() => setDeleteUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle style={{color: 'hsl(var(--sentinel-critical))'}}>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete user {deleteUser?.user_hash.slice(0, 8)}...? 
              This action cannot be undone and will remove all associated data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteUser(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteUser} disabled={actionLoading === "delete"} className="bg-red-600 hover:bg-red-700">
              {actionLoading === "delete" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!assignManagerUser} onOpenChange={() => setAssignManagerUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Manager</DialogTitle>
            <DialogDescription>
              Assign a manager to {assignManagerUser?.user_hash.slice(0, 8)}...
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium">Select Manager</label>
            <Select value={selectedManager} onValueChange={setSelectedManager}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select manager" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="remove">Remove Manager</SelectItem>
                {managers.map((manager) => (
                  <SelectItem key={manager.user_hash} value={manager.user_hash}>
                    {manager.user_hash.slice(0, 8)}...
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignManagerUser(null)}>Cancel</Button>
            <Button onClick={handleAssignManager} disabled={actionLoading === "manager" || !selectedManager}>
              {actionLoading === "manager" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Users className="h-4 w-4 mr-2" />}
              Assign Manager
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StatBlock({ label, value, icon, color }: { label: string, value: string, icon: React.ReactNode, color: string }) {
  const colorClass = {
    indigo: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    amber: "text-[hsl(var(--sentinel-elevated))] bg-[hsl(var(--sentinel-elevated))]/10 border-[hsl(var(--sentinel-elevated))]/20",
    purple: "text-purple-400 bg-purple-500/10 border-purple-500/20"
  }[color] || "text-muted-foreground bg-muted/10 border-muted/20";

  return (
    <Card className="bg-card/50 border-border">
      <div className="p-5 flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1">{label}</p>
          <h3 className="text-2xl font-bold font-mono text-foreground">{value}</h3>
        </div>
        <div className={`p-2 rounded-lg border ${colorClass}`}>
          {icon}
        </div>
      </div>
    </Card>
  )
}

export default function AdminPage() {
  return (
    <ProtectedRoute>
      <AdminPageContent />
    </ProtectedRoute>
  )
}
