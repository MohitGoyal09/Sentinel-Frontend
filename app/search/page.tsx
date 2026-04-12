"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ProtectedRoute } from "@/components/protected-route"
import { Search, X, Loader2, Sparkles, Users, AlertTriangle, TrendingUp, ArrowRight } from "lucide-react"
import { useUsers } from "@/hooks/useUsers"
import { toRiskLevel } from "@/types"

// ─── Types ────────────────────────────────────────────────────────────────────
type FilterCategory = "all" | "employees" | "teams" | "at-risk" | "high-performers"

interface UserSummary {
  user_hash: string
  name?: string
  role?: string
  risk_level?: string
  velocity?: number
  confidence?: number
  belongingness_score?: number
}

// ─── Avatar gradient by index ────────────────────────────────────────────────
const AVATAR_GRADIENTS = [
  "from-blue-500/30 to-blue-600/10",
  "from-accent/30 to-accent/10",
  "from-primary/30 to-primary/10",
  "from-rose-500/30 to-rose-600/10",
  "from-amber-500/30 to-amber-600/10",
  "from-teal-500/30 to-teal-600/10",
]

function getGradient(hash: string): string {
  let n = 0
  for (let i = 0; i < hash.length; i++) n = (n + hash.charCodeAt(i)) % AVATAR_GRADIENTS.length
  return AVATAR_GRADIENTS[n]
}

// ─── Risk badge ───────────────────────────────────────────────────────────────
function RiskBadge({ risk }: { risk: string }) {
  if (risk === "CRITICAL") {
    return (
      <span className="flex items-center gap-1 rounded-full bg-destructive/10 text-destructive text-[10px] font-semibold px-2 py-0.5">
        <span className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse" />
        Critical
      </span>
    )
  }
  if (risk === "ELEVATED") {
    return (
      <span className="flex items-center gap-1 rounded-full bg-[hsl(var(--sentinel-elevated))]/10 text-[hsl(var(--sentinel-elevated))] text-[10px] font-semibold px-2 py-0.5">
        <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--sentinel-elevated))]" />
        Elevated
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1 rounded-full bg-accent/10 text-accent text-[10px] font-semibold px-2 py-0.5">
      <span className="h-1.5 w-1.5 rounded-full bg-accent" />
      Healthy
    </span>
  )
}

// ─── Metric chip ─────────────────────────────────────────────────────────────
function MetricChip({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-md bg-white/5 border border-white/5 px-2 py-0.5 text-[10px] text-muted-foreground">
      <span className="text-foreground font-semibold">{value}</span>{" "}
      <span>{label}</span>
    </span>
  )
}

// ─── Employee result card ─────────────────────────────────────────────────────
function EmployeeCard({
  user,
  index,
  onSelect,
}: {
  user: UserSummary
  index: number
  onSelect: (hash: string) => void
}) {
  const initials = user.name
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : user.user_hash.slice(0, 2).toUpperCase()

  const gradient = getGradient(user.user_hash)
  const risk = user.risk_level ? toRiskLevel(user.risk_level) : "LOW"
  const velocity = user.velocity ?? 0
  const confidence = user.confidence ?? 0

  return (
    <button
      className="group flex items-center gap-4 w-full bg-card border border-white/5 rounded-xl p-4 text-left hover:border-white/10 hover:bg-card/80 transition-[background-color,border-color,transform] duration-150 active:scale-[0.97] cursor-pointer"
      onClick={() => onSelect(user.user_hash)}
    >
      {/* Avatar */}
      <div
        className={`flex-shrink-0 h-12 w-12 rounded-full bg-gradient-to-br ${gradient} border border-white/10 flex items-center justify-center`}
      >
        <span className="text-sm font-semibold text-foreground">{initials}</span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-foreground truncate">
            {user.name || "Anonymous User"}
          </span>
          {user.role && (
            <span className="text-[10px] bg-white/5 border border-white/5 rounded-md px-2 py-0.5 text-muted-foreground">
              {user.role}
            </span>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground mt-0.5 truncate font-mono">
          {user.user_hash}
        </p>
        {/* Metrics row */}
        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
          <RiskBadge risk={risk} />
          <MetricChip label="velocity" value={velocity.toFixed(2)} />
          {confidence > 0 && (
            <MetricChip label="confidence" value={`${Math.round(confidence * 100)}%`} />
          )}
        </div>
      </div>

      {/* Hover CTA */}
      <div className="flex-shrink-0 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-xs text-primary font-medium">
        View Profile
        <ArrowRight className="h-3.5 w-3.5" />
      </div>
    </button>
  )
}

// ─── Quick suggestion chip ────────────────────────────────────────────────────
function SuggestionChip({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-full bg-card border border-white/10 hover:bg-white/5 hover:border-white/20 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-all duration-150 active:scale-[0.97]"
    >
      <Search className="h-3 w-3" />
      {label}
    </button>
  )
}

// ─── Filter pill ──────────────────────────────────────────────────────────────
function FilterPill({
  label,
  active,
  icon: Icon,
  onClick,
}: {
  label: string
  active: boolean
  icon?: React.ComponentType<{ className?: string }>
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-[background-color,color,border-color,transform] duration-150 active:scale-[0.97]",
        active
          ? "bg-primary text-white"
          : "bg-card border border-white/5 text-muted-foreground hover:bg-white/5 hover:text-foreground hover:border-white/10",
      ].join(" ")}
    >
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {label}
    </button>
  )
}

// ─── Page Component ───────────────────────────────────────────────────────────
export default function SearchPage() {
  const router = useRouter()
  const { users, isLoading } = useUsers()
  const [query, setQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState<FilterCategory>("all")

  const handleUserSelect = useCallback((userHash: string) => {
    router.push(`/dashboard?view=employee-detail&uid=${userHash}`)
  }, [router])

  const handleSuggestion = (suggestion: string) => {
    setQuery(suggestion)
  }

  // Apply filter category + search query
  const filteredUsers = users.filter((user) => {
    const matchesQuery =
      !query ||
      user.name?.toLowerCase().includes(query.toLowerCase()) ||
      user.user_hash?.toLowerCase().includes(query.toLowerCase()) ||
      user.role?.toLowerCase().includes(query.toLowerCase())

    if (!matchesQuery) return false

    const risk = user.risk_level ? toRiskLevel(user.risk_level) : "LOW"

    switch (activeFilter) {
      case "employees":
        return true
      case "teams":
        return false // teams not in current data model
      case "at-risk":
        return risk === "CRITICAL" || risk === "ELEVATED"
      case "high-performers":
        return (user.velocity ?? 0) > 1.5
      default:
        return true
    }
  })

  const FILTER_TABS: { key: FilterCategory; label: string; icon?: React.ComponentType<{ className?: string }> }[] = [
    { key: "all", label: "All" },
    { key: "employees", label: "Employees", icon: Users },
    { key: "teams", label: "Teams", icon: Users },
    { key: "at-risk", label: "At-Risk", icon: AlertTriangle },
    { key: "high-performers", label: "High Performers", icon: TrendingUp },
  ]

  const SUGGESTIONS = ["Engineering team", "At-risk members", "Marcus Kim", "High velocity"]

  const hasQuery = query.trim().length > 0

  return (
    <ProtectedRoute>
    <div className="flex flex-col gap-6 p-6 lg:p-8 min-h-screen bg-background">

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1 max-w-3xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Search</h1>
        </div>
        <p className="text-sm text-muted-foreground ml-9">
          Find employees, teams, or ask AI about your organization.
        </p>
      </div>

      {/* ── Search Input ─────────────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto w-full">
        <div className="relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search employees, teams, or ask AI..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className={[
              "w-full bg-card border border-white/10 rounded-2xl pl-14 pr-12 py-4 text-base text-foreground",
              "placeholder:text-muted-foreground",
              "focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20",
              "transition-[border-color,box-shadow] duration-150",
            ].join(" ")}
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all duration-150"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* ── Quick Filters ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {FILTER_TABS.map(({ key, label, icon }) => (
            <FilterPill
              key={key}
              label={label}
              active={activeFilter === key}
              icon={icon}
              onClick={() => setActiveFilter(key)}
            />
          ))}
        </div>
      </div>

      {/* ── Results ──────────────────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto w-full flex flex-col gap-3">

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Empty state — no query */}
        {!isLoading && !hasQuery && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-2xl bg-card border border-white/5 flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-muted-foreground/30" />
            </div>
            <p className="text-sm font-semibold text-foreground">Start typing to search</p>
            <p className="text-xs text-muted-foreground mt-1.5">or try one of these:</p>
            <div className="flex items-center gap-2 mt-4 flex-wrap justify-center">
              {SUGGESTIONS.map((s) => (
                <SuggestionChip key={s} label={s} onClick={() => handleSuggestion(s)} />
              ))}
            </div>
          </div>
        )}

        {/* No results */}
        {!isLoading && hasQuery && filteredUsers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-2xl bg-card border border-white/5 flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-muted-foreground/30" />
            </div>
            <p className="text-sm font-semibold text-foreground">No results for &quot;{query}&quot;</p>
            <p className="text-xs text-muted-foreground mt-1.5">Try searching for:</p>
            <div className="flex items-center gap-2 mt-4 flex-wrap justify-center">
              {SUGGESTIONS.filter((s) => s.toLowerCase() !== query.toLowerCase()).map((s) => (
                <SuggestionChip key={s} label={s} onClick={() => handleSuggestion(s)} />
              ))}
            </div>
          </div>
        )}

        {/* Result count */}
        {!isLoading && hasQuery && filteredUsers.length > 0 && (
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{filteredUsers.length}</span>{" "}
            {filteredUsers.length === 1 ? "result" : "results"} for &quot;{query}&quot;
          </p>
        )}

        {/* Result cards */}
        {!isLoading && filteredUsers.length > 0 && (
          <div className="flex flex-col gap-2">
            {filteredUsers.map((user, idx) => (
              <EmployeeCard
                key={user.user_hash}
                user={user}
                index={idx}
                onSelect={handleUserSelect}
              />
            ))}
          </div>
        )}
      </div>
    </div>
    </ProtectedRoute>
  )
}
