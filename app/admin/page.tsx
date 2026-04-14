"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import {
  Search,
  Plus,
  Users,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  RefreshCcw,
  Trash2,
  UserPlus,
  Loader2,
  Calendar,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"
import { ProfileModal } from "@/components/profile-modal"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------

interface User {
  user_hash: string
  email: string | null
  name: string | null
  role: string
  risk_level: string
  velocity: number | null
  team_name: string | null
  team_id: string | null
}

interface Team {
  id: string
  name: string
  manager_hash: string | null
  tenant_id: string
  member_count: number
  created_at: string
}

interface TeamDetail extends Team {
  members: Array<{ user_hash: string; role: string }>
}

interface AuditEntry {
  id: number
  user_hash: string
  action: string
  details: Record<string, unknown>
  timestamp: string
}

interface Manager {
  user_hash: string
  role: string
}

interface HealthData {
  database: { total_users: number }
  risk_summary: { at_risk_total: number; critical_count: number; elevated_count: number }
}

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------

type TabId = "members" | "teams" | "audit"

const ROLE_ORDER: Record<string, number> = { admin: 0, manager: 1, employee: 2 }

function getRoleBadgeClass(role: string): string {
  switch (role) {
    case "admin": return "bg-primary/10 text-primary"
    case "manager": return "bg-amber-500/10 text-amber-400"
    default: return "bg-muted text-muted-foreground"
  }
}

function getRiskBadgeClass(level: string): string {
  switch (level) {
    case "CRITICAL": return "bg-red-500/10 text-red-400"
    case "ELEVATED": return "bg-amber-500/10 text-amber-400"
    case "LOW": return "bg-emerald-500/10 text-emerald-400"
    default: return "bg-muted text-muted-foreground"
  }
}

function getAuditBadgeClass(action: string): string {
  const green = ["auth:login", "authentication", "invite_accepted", "tool_connected"]
  const amber = ["role_changed", "role_updated", "consent_changed", "consent", "engine_run", "break_scheduled", "manager_assigned"]
  const red = ["user_removed", "data_deleted", "data_exported", "identity_revealed"]
  if (green.some(a => action.includes(a))) return "bg-emerald-500/10 text-emerald-400"
  if (amber.some(a => action.includes(a))) return "bg-amber-500/10 text-amber-400"
  if (red.some(a => action.includes(a))) return "bg-red-500/10 text-red-400"
  return "bg-muted text-muted-foreground"
}

function formatAction(action: string): string {
  return action.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso)
  return `${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })} ${d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`
}

function nextRole(current: string): string | null {
  if (current === "employee") return "manager"
  if (current === "manager") return "admin"
  return null
}

function prevRole(current: string): string | null {
  if (current === "admin") return "manager"
  if (current === "manager") return "employee"
  return null
}

// ----------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------

function AdminPageContent() {
  const { session, loading: authLoading } = useAuth()
  const [tab, setTab] = useState<TabId>("members")

  // Data state
  const [users, setUsers] = useState<User[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [managers, setManagers] = useState<Manager[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([])
  const [health, setHealth] = useState<HealthData | null>(null)
  const [loading, setLoading] = useState(true)

  // Members filters
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [riskFilter, setRiskFilter] = useState<string>("all")
  const [teamFilter, setTeamFilter] = useState<string>("all")

  // Audit filters
  const [auditDays, setAuditDays] = useState(7)
  const [auditAction, setAuditAction] = useState("all")
  const [auditSearch, setAuditSearch] = useState("")
  const [auditOffset, setAuditOffset] = useState(0)

  // Dialog state
  const [promoteUser, setPromoteUser] = useState<User | null>(null)
  const [demoteUser, setDemoteUser] = useState<User | null>(null)
  const [removeUser, setRemoveUser] = useState<User | null>(null)
  const [changeTeamUser, setChangeTeamUser] = useState<User | null>(null)
  const [selectedTeamId, setSelectedTeamId] = useState("")
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("employee")
  const [inviteTeam, setInviteTeam] = useState("")
  const [createTeamOpen, setCreateTeamOpen] = useState(false)
  const [createTeamName, setCreateTeamName] = useState("")
  const [createTeamManager, setCreateTeamManager] = useState("")
  const [deleteTeam, setDeleteTeam] = useState<Team | null>(null)
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null)
  const [teamDetail, setTeamDetail] = useState<TeamDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [profileHash, setProfileHash] = useState<string | null>(null)

  // ---- Fetch functions ----

  const fetchHealth = useCallback(async () => {
    try {
      const res = await api.get<HealthData>("/admin/health")
      setHealth(res as HealthData)
    } catch {
      // Health is optional, don't block rendering
    }
  }, [])

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      const res = await api.get<{ users: User[] }>("/admin/users?limit=200")
      setUsers((res as { users: User[] }).users)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load users"
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  const [teamsLoading, setTeamsLoading] = useState(true)

  const fetchTeams = useCallback(async () => {
    try {
      setTeamsLoading(true)
      const raw = await api.get<unknown>("/admin/teams")
      const data = (raw && typeof raw === "object" && "data" in raw)
        ? (raw as { data: Team[] }).data
        : raw as Team[]
      setTeams(Array.isArray(data) ? data : [])
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load teams"
      toast.error(msg)
    } finally {
      setTeamsLoading(false)
    }
  }, [])

  const fetchManagers = useCallback(async () => {
    try {
      const res = await api.get<{ managers: Manager[] }>("/admin/managers")
      setManagers((res as { managers: Manager[] }).managers)
    } catch {
      // Non-critical
    }
  }, [])

  const fetchAuditLogs = useCallback(async () => {
    try {
      setLoading(true)
      let url = `/admin/audit-logs?days=${auditDays}&limit=50&offset=${auditOffset}`
      if (auditAction !== "all") url += `&action_type=${auditAction}`
      if (auditSearch) url += `&user_hash=${auditSearch}`
      const res = await api.get<{ logs: AuditEntry[] }>(url)
      const data = res as { logs: AuditEntry[] }
      setAuditLogs(data.logs ?? [])
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load audit logs"
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }, [auditDays, auditAction, auditSearch, auditOffset])

  // ---- Effects ----

  useEffect(() => {
    if (authLoading || !session) return
    fetchHealth()
    fetchManagers()
    fetchTeams()
    fetchUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, session])

  useEffect(() => {
    if (authLoading || !session) return
    if (tab === "audit") fetchAuditLogs()
  }, [tab, authLoading, session, fetchAuditLogs])

  // ---- Filtered members ----

  const filteredUsers = useMemo(() => {
    let result = users
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(u =>
        (u.name ?? "").toLowerCase().includes(q) ||
        (u.email ?? "").toLowerCase().includes(q) ||
        u.user_hash.toLowerCase().includes(q)
      )
    }
    if (roleFilter !== "all") result = result.filter(u => u.role === roleFilter)
    if (riskFilter !== "all") result = result.filter(u => u.risk_level === riskFilter)
    if (teamFilter === "assigned") result = result.filter(u => u.team_name)
    if (teamFilter === "unassigned") result = result.filter(u => !u.team_name)
    return result.sort((a, b) => (ROLE_ORDER[a.role] ?? 9) - (ROLE_ORDER[b.role] ?? 9))
  }, [users, searchQuery, roleFilter, riskFilter, teamFilter])

  // ---- Actions ----

  const handlePromote = async () => {
    if (!promoteUser) return
    const nr = nextRole(promoteUser.role)
    if (!nr) return
    setActionLoading("promote")
    try {
      await api.post(`/admin/user/${promoteUser.user_hash}/role?new_role=${nr}`)
      toast.success(`${promoteUser.name ?? promoteUser.user_hash.slice(0, 8)} promoted to ${nr}`)
      setPromoteUser(null)
      fetchUsers()
      fetchHealth()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to promote"
      toast.error(msg)
    } finally {
      setActionLoading(null)
    }
  }

  const handleDemote = async () => {
    if (!demoteUser) return
    const nr = prevRole(demoteUser.role)
    if (!nr) return
    setActionLoading("demote")
    try {
      await api.post(`/admin/user/${demoteUser.user_hash}/role?new_role=${nr}`)
      toast.success(`${demoteUser.name ?? demoteUser.user_hash.slice(0, 8)} demoted to ${nr}`)
      setDemoteUser(null)
      fetchUsers()
      fetchHealth()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to demote"
      toast.error(msg)
    } finally {
      setActionLoading(null)
    }
  }

  const handleRemove = async () => {
    if (!removeUser) return
    setActionLoading("remove")
    try {
      await api.delete(`/admin/user/${removeUser.user_hash}`)
      toast.success(`${removeUser.name ?? removeUser.user_hash.slice(0, 8)} removed`)
      setRemoveUser(null)
      fetchUsers()
      fetchHealth()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to remove user"
      toast.error(msg)
    } finally {
      setActionLoading(null)
    }
  }

  const handleChangeTeam = async () => {
    if (!changeTeamUser || !selectedTeamId) return
    setActionLoading("team")
    try {
      await api.post(`/admin/user/${changeTeamUser.user_hash}/team?team_id=${selectedTeamId}`)
      toast.success("Team assignment updated")
      setChangeTeamUser(null)
      setSelectedTeamId("")
      fetchUsers()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to change team"
      toast.error(msg)
    } finally {
      setActionLoading(null)
    }
  }

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return
    setActionLoading("invite")
    try {
      const payload: Record<string, string> = { email: inviteEmail.trim(), role: inviteRole }
      if (inviteTeam) payload.team_id = inviteTeam
      await api.post("/admin/invite", payload)
      toast.success(`Invitation sent to ${inviteEmail}`)
      setInviteOpen(false)
      setInviteEmail("")
      setInviteRole("employee")
      setInviteTeam("")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send invite"
      toast.error(msg)
    } finally {
      setActionLoading(null)
    }
  }

  const handleCreateTeam = async () => {
    const trimmed = createTeamName.trim()
    if (!trimmed) return
    setActionLoading("createTeam")
    try {
      await api.post("/admin/teams", {
        name: trimmed,
        manager_hash: createTeamManager || null,
      })
      toast.success(`Team "${trimmed}" created`)
      setCreateTeamOpen(false)
      setCreateTeamName("")
      setCreateTeamManager("")
      fetchTeams()
      fetchHealth()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create team"
      toast.error(msg)
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteTeam = async () => {
    if (!deleteTeam) return
    setActionLoading("deleteTeam")
    try {
      await api.delete(`/admin/teams/${deleteTeam.id}`)
      toast.success(`Team "${deleteTeam.name}" deleted`)
      setDeleteTeam(null)
      fetchTeams()
      fetchHealth()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete team"
      toast.error(msg)
    } finally {
      setActionLoading(null)
    }
  }

  const handleExpandTeam = async (teamId: string) => {
    if (expandedTeam === teamId) {
      setExpandedTeam(null)
      setTeamDetail(null)
      return
    }
    setExpandedTeam(teamId)
    setDetailLoading(true)
    try {
      const raw = await api.get<unknown>(`/admin/teams/${teamId}`)
      const data = (raw && typeof raw === "object" && "data" in raw)
        ? (raw as { data: TeamDetail }).data
        : raw as TeamDetail
      setTeamDetail(data)
    } catch {
      setTeamDetail(null)
    } finally {
      setDetailLoading(false)
    }
  }

  // ---- Computed ----

  const memberCount = users.length
  const atRiskCount = health?.risk_summary.at_risk_total ?? users.filter(u => u.risk_level === "CRITICAL" || u.risk_level === "ELEVATED").length
  const teamCount = teams.length

  /** Per-team stats derived from user data */
  const teamStats = useMemo(() => {
    const statsMap = new Map<string, { avgVelocity: number; atRiskPct: number; memberNames: string[] }>()
    for (const team of teams) {
      const members = users.filter(u => u.team_id === team.id)
      const velocities = members.map(u => u.velocity).filter((v): v is number => v != null)
      const avgVelocity = velocities.length > 0
        ? velocities.reduce((a, b) => a + b, 0) / velocities.length
        : 0
      const atRiskMembers = members.filter(u => u.risk_level === "CRITICAL" || u.risk_level === "ELEVATED")
      const atRiskPct = members.length > 0 ? (atRiskMembers.length / members.length) * 100 : 0
      const memberNames = members.map(u => u.name ?? u.user_hash.slice(0, 8))
      statsMap.set(team.id, { avgVelocity, atRiskPct, memberNames })
    }
    return statsMap
  }, [teams, users])

  // ---- Loading state ----

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6 max-w-[1400px]">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Admin Panel</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage users, teams, and audit trail</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-5">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Total Members</p>
          <p className="text-[28px] font-semibold tabular-nums text-foreground mt-1">{memberCount}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-5">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">At Risk</p>
          <p className="text-[28px] font-semibold tabular-nums text-foreground mt-1">{atRiskCount}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-5">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Teams</p>
          <p className="text-[28px] font-semibold tabular-nums text-foreground mt-1">{teamCount}</p>
        </div>
      </div>

      {/* Action buttons + tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex gap-2">
          {(["members", "teams", "audit"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-150",
                tab === t
                  ? "bg-primary text-primary-foreground"
                  : "border border-border text-muted-foreground hover:text-foreground hover:bg-muted/20"
              )}
            >
              {t === "members" ? "Members" : t === "teams" ? "Teams" : "Audit Log"}
              {t === "members" && <span className="ml-1.5 text-xs opacity-70">{memberCount}</span>}
              {t === "teams" && <span className="ml-1.5 text-xs opacity-70">{teamCount}</span>}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setInviteOpen(true)}>
            <UserPlus className="h-3.5 w-3.5" /> Invite Member
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setCreateTeamOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Create Team
          </Button>
        </div>
      </div>

      {/* Tab Content: Members */}
      {tab === "members" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search by name..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>
            <div className="flex gap-1">
              {["all", "admin", "manager", "employee"].map(r => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                    roleFilter === r
                      ? "bg-primary text-primary-foreground"
                      : "border border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  {r === "all" ? "All" : r.charAt(0).toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>
            <div className="flex gap-1">
              {["all", "CRITICAL", "ELEVATED", "LOW"].map(r => (
                <button
                  key={r}
                  onClick={() => setRiskFilter(r)}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                    riskFilter === r
                      ? "bg-primary text-primary-foreground"
                      : "border border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  {r === "all" ? "All" : r.charAt(0) + r.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
            <Select value={teamFilter} onValueChange={setTeamFilter}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue placeholder="Team" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teams</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.04]">
                    <th className="text-left text-[11px] uppercase tracking-wider text-muted-foreground font-medium h-10 px-4 w-[20%]">Name</th>
                    <th className="text-left text-[11px] uppercase tracking-wider text-muted-foreground font-medium h-10 px-4 w-[12%]">Hash</th>
                    <th className="text-left text-[11px] uppercase tracking-wider text-muted-foreground font-medium h-10 px-4 w-[10%]">Role</th>
                    <th className="text-left text-[11px] uppercase tracking-wider text-muted-foreground font-medium h-10 px-4 w-[15%]">Team</th>
                    <th className="text-left text-[11px] uppercase tracking-wider text-muted-foreground font-medium h-10 px-4 w-[10%]">Risk</th>
                    <th className="text-left text-[11px] uppercase tracking-wider text-muted-foreground font-medium h-10 px-4 w-[8%]">Velocity</th>
                    <th className="text-right text-[11px] uppercase tracking-wider text-muted-foreground font-medium h-10 px-4 w-[15%]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && users.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="h-32 text-center text-muted-foreground text-sm">
                        <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="h-32 text-center text-muted-foreground text-sm">
                        No members found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map(user => (
                      <tr key={user.user_hash} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-2.5">
                          <button
                            className="text-sm font-medium text-foreground cursor-pointer hover:text-primary transition-colors"
                            onClick={() => setProfileHash(user.user_hash)}
                          >
                            {user.name ?? user.user_hash.slice(0, 8)}
                          </button>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="text-sm font-mono text-muted-foreground">{user.user_hash.slice(0, 8)}</span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={cn("inline-flex px-2 py-0.5 rounded-md text-xs font-medium capitalize", getRoleBadgeClass(user.role))}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="text-sm text-muted-foreground">{user.team_name || "\u2014"}</span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={cn("inline-flex px-2 py-0.5 rounded-md text-xs font-medium", getRiskBadgeClass(user.risk_level))}>
                            {user.risk_level}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="text-sm font-mono tabular-nums text-foreground">
                            {user.velocity != null ? user.velocity.toFixed(1) : "\u2014"}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <div className="flex items-center justify-end gap-0.5">
                            <button
                              className="h-7 w-7 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30"
                              title="Promote"
                              disabled={!nextRole(user.role)}
                              onClick={() => setPromoteUser(user)}
                            >
                              <ArrowUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              className="h-7 w-7 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30"
                              title="Demote"
                              disabled={!prevRole(user.role)}
                              onClick={() => setDemoteUser(user)}
                            >
                              <ArrowDown className="h-3.5 w-3.5" />
                            </button>
                            <button
                              className="h-7 w-7 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                              title="Change Team"
                              onClick={() => { setChangeTeamUser(user); setSelectedTeamId("") }}
                            >
                              <RefreshCcw className="h-3.5 w-3.5" />
                            </button>
                            <button
                              className="h-7 w-7 rounded-md hover:bg-muted flex items-center justify-center text-red-400 hover:text-red-300 transition-colors"
                              title="Remove"
                              onClick={() => setRemoveUser(user)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Teams */}
      {tab === "teams" && (
        <div className="space-y-4">
          {teamsLoading && teams.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : teams.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No teams yet</p>
              <p className="text-sm mt-1">Create your first team to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teams.map(team => {
                const stats = teamStats.get(team.id)
                const riskPct = stats?.atRiskPct ?? 0
                const riskStatus = riskPct >= 50 ? "High" : riskPct >= 20 ? "Moderate" : "Healthy"
                const riskStatusClass = riskPct >= 50
                  ? "bg-red-500/10 text-red-400"
                  : riskPct >= 20
                    ? "bg-amber-500/10 text-amber-400"
                    : "bg-emerald-500/10 text-emerald-400"
                const managerUser = team.manager_hash
                  ? users.find(u => u.user_hash === team.manager_hash)
                  : null

                return (
                <div key={team.id} className="bg-card border border-border rounded-lg overflow-hidden">
                  <button
                    className="w-full text-left p-5 hover:bg-white/[0.02] transition-colors"
                    onClick={() => handleExpandTeam(team.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium text-foreground truncate">{team.name}</h3>
                          <span className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium shrink-0",
                            team.member_count === 0 ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
                          )}>
                            <Users className="h-3 w-3" />
                            {team.member_count}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1.5">
                          {managerUser
                            ? `Lead: ${managerUser.name ?? managerUser.user_hash.slice(0, 8)}`
                            : team.manager_hash
                              ? `Lead: ${team.manager_hash.slice(0, 8)}...`
                              : "No lead assigned"}
                        </p>
                      </div>
                      <ChevronRight className={cn(
                        "h-4 w-4 text-muted-foreground transition-transform duration-200 shrink-0 ml-2",
                        expandedTeam === team.id && "rotate-90"
                      )} />
                    </div>

                    {/* Stats row */}
                    {team.member_count > 0 && (
                      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/[0.04]">
                        <div className="flex-1">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">Avg Velocity</p>
                          <p className="text-sm font-mono tabular-nums text-foreground mt-0.5">
                            {(stats?.avgVelocity ?? 0).toFixed(1)}
                          </p>
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">Risk Status</p>
                          <span className={cn(
                            "inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium mt-0.5",
                            riskStatusClass
                          )}>
                            {riskStatus}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">Created</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{formatDate(team.created_at)}</p>
                        </div>
                      </div>
                    )}
                  </button>

                  {/* Expanded member list */}
                  {expandedTeam === team.id && (
                    <div className="border-t border-border px-5 py-3 space-y-2">
                      {detailLoading ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                      ) : teamDetail && teamDetail.members.length > 0 ? (
                        <div className="space-y-1.5">
                          {teamDetail.members.map(m => {
                            const memberUser = users.find(u => u.user_hash === m.user_hash)
                            return (
                            <div key={m.user_hash} className="flex items-center justify-between px-2 py-1.5 rounded-md bg-muted/20">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-xs text-foreground truncate">
                                  {memberUser?.name ?? m.user_hash.slice(0, 12)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {memberUser && (
                                  <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded", getRiskBadgeClass(memberUser.risk_level))}>
                                    {memberUser.risk_level}
                                  </span>
                                )}
                                <span className={cn("text-[10px] font-medium capitalize px-1.5 py-0.5 rounded", getRoleBadgeClass(m.role))}>
                                  {m.role}
                                </span>
                              </div>
                            </div>
                            )
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground text-center py-3">No members in this team</p>
                      )}
                      {team.member_count === 0 && (
                        <Button
                          variant="destructive"
                          size="sm"
                          className="w-full mt-2 h-7 text-xs"
                          onClick={e => { e.stopPropagation(); setDeleteTeam(team) }}
                        >
                          <Trash2 className="h-3 w-3 mr-1.5" /> Delete Team
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Audit Log */}
      {tab === "audit" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-1">
              {[{ label: "24h", value: 1 }, { label: "7d", value: 7 }, { label: "30d", value: 30 }, { label: "All", value: 90 }].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { setAuditDays(opt.value); setAuditOffset(0) }}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                    auditDays === opt.value
                      ? "bg-primary text-primary-foreground"
                      : "border border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <Select value={auditAction} onValueChange={v => { setAuditAction(v); setAuditOffset(0) }}>
              <SelectTrigger className="w-[160px] h-8 text-xs">
                <SelectValue placeholder="Action type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="authentication">Auth</SelectItem>
                <SelectItem value="role_changed">Role Changes</SelectItem>
                <SelectItem value="consent">Consent</SelectItem>
                <SelectItem value="data_access">Data Access</SelectItem>
                <SelectItem value="data_deleted">Data Deleted</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search by actor hash..."
                value={auditSearch}
                onChange={e => setAuditSearch(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-card border border-border rounded-lg">
            {loading && auditLogs.length === 0 ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <p className="text-sm">No audit entries found for the selected filters.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {auditLogs.map((entry, i) => (
                  <div key={entry.id ?? i} className="flex items-start gap-4 px-5 py-3 hover:bg-white/[0.02] transition-colors">
                    <div className="shrink-0 text-xs text-muted-foreground font-mono w-[130px] pt-0.5">
                      {formatTimestamp(entry.timestamp)}
                    </div>
                    <div className="shrink-0">
                      <span className="font-mono text-xs text-muted-foreground">{entry.user_hash?.slice(0, 8)}...</span>
                    </div>
                    <div className="shrink-0">
                      <span className={cn("inline-flex px-2 py-0.5 rounded-md text-[10px] font-medium uppercase", getAuditBadgeClass(entry.action))}>
                        {formatAction(entry.action)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      {entry.details && Object.keys(entry.details).length > 0 && (
                        <code className="text-[10px] text-muted-foreground/60 font-mono block truncate">
                          {JSON.stringify(entry.details)}
                        </code>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {auditLogs.length > 0 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.04]">
                <p className="text-xs text-muted-foreground">
                  Showing {auditOffset + 1}&ndash;{auditOffset + auditLogs.length}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    disabled={auditOffset === 0}
                    onClick={() => setAuditOffset(Math.max(0, auditOffset - 50))}
                  >
                    Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    disabled={auditLogs.length < 50}
                    onClick={() => setAuditOffset(auditOffset + 50)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---- Dialogs ---- */}

      {/* Promote */}
      <AlertDialog open={!!promoteUser} onOpenChange={open => { if (!open) setPromoteUser(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Promote {promoteUser?.name ?? promoteUser?.user_hash.slice(0, 8)}</AlertDialogTitle>
            <AlertDialogDescription>
              Promote to <span className="font-medium text-foreground">{nextRole(promoteUser?.role ?? "")}</span>? This will grant additional permissions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePromote} disabled={actionLoading === "promote"}>
              {actionLoading === "promote" ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Demote */}
      <AlertDialog open={!!demoteUser} onOpenChange={open => { if (!open) setDemoteUser(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Demote {demoteUser?.name ?? demoteUser?.user_hash.slice(0, 8)}</AlertDialogTitle>
            <AlertDialogDescription>
              Demote to <span className="font-medium text-foreground">{prevRole(demoteUser?.role ?? "")}</span>? This will reduce their permissions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDemote} disabled={actionLoading === "demote"}>
              {actionLoading === "demote" ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove */}
      <AlertDialog open={!!removeUser} onOpenChange={open => { if (!open) setRemoveUser(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-400">Remove {removeUser?.name ?? removeUser?.user_hash.slice(0, 8)}</AlertDialogTitle>
            <AlertDialogDescription>
              Remove from organization? This cannot be undone. All associated data will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              disabled={actionLoading === "remove"}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {actionLoading === "remove" ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Change Team */}
      <Dialog open={!!changeTeamUser} onOpenChange={open => { if (!open) setChangeTeamUser(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Team</DialogTitle>
            <DialogDescription>
              Assign {changeTeamUser?.name ?? changeTeamUser?.user_hash.slice(0, 8)} to a different team.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5 block">
              Select Team
            </label>
            <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a team..." />
              </SelectTrigger>
              <SelectContent>
                {teams.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangeTeamUser(null)}>Cancel</Button>
            <Button onClick={handleChangeTeam} disabled={actionLoading === "team" || !selectedTeamId}>
              {actionLoading === "team" ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite Member */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Member</DialogTitle>
            <DialogDescription>
              Send a secure invitation link to a new team member.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5 block">
                Email
              </label>
              <Input
                type="email"
                placeholder="colleague@company.com"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                autoFocus
              />
            </div>
            <div>
              <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5 block">
                Role
              </label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5 block">
                Team <span className="normal-case font-normal text-muted-foreground/50">(optional)</span>
              </label>
              <Select value={inviteTeam} onValueChange={setInviteTeam}>
                <SelectTrigger>
                  <SelectValue placeholder="No team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No team</SelectItem>
                  {teams.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button onClick={handleInvite} disabled={actionLoading === "invite" || !inviteEmail.trim()}>
              {actionLoading === "invite" ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <UserPlus className="h-4 w-4 mr-1.5" />}
              Send Invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Team */}
      <Dialog open={createTeamOpen} onOpenChange={setCreateTeamOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Team</DialogTitle>
            <DialogDescription>
              Give the team a name. You can assign a manager and members after creation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5 block">
                Team Name
              </label>
              <Input
                placeholder="e.g. Engineering, Product, Sales..."
                value={createTeamName}
                onChange={e => setCreateTeamName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleCreateTeam()}
                autoFocus
              />
            </div>
            <div>
              <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5 block">
                Manager <span className="normal-case font-normal text-muted-foreground/50">(optional)</span>
              </label>
              <Select value={createTeamManager} onValueChange={setCreateTeamManager}>
                <SelectTrigger>
                  <SelectValue placeholder="No manager" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No manager</SelectItem>
                  {managers.map(m => (
                    <SelectItem key={m.user_hash} value={m.user_hash}>
                      {m.user_hash.slice(0, 12)}...
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateTeamOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateTeam} disabled={actionLoading === "createTeam" || !createTeamName.trim()}>
              {actionLoading === "createTeam" ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              Create Team
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Team */}
      <AlertDialog open={!!deleteTeam} onOpenChange={open => { if (!open) setDeleteTeam(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-400">Delete Team</AlertDialogTitle>
            <AlertDialogDescription>
              Delete &ldquo;{deleteTeam?.name}&rdquo;? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTeam}
              disabled={actionLoading === "deleteTeam"}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {actionLoading === "deleteTeam" ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Profile Modal */}
      <ProfileModal
        userHash={profileHash}
        open={!!profileHash}
        onOpenChange={(open) => !open && setProfileHash(null)}
      />
    </div>
  )
}

export default function AdminPage() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AdminPageContent />
    </ProtectedRoute>
  )
}
