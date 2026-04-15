"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { ProtectedRoute } from "@/components/protected-route"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { SectionCard } from "@/components/dashboard/section-card"
import { RiskBadge } from "@/components/dashboard/risk-badge"
import { Spinner } from "@/components/ui/spinner"
import {
  Sparkles, RefreshCw, Lightbulb, Trophy, MessageSquare,
  Diamond, Network, AlertTriangle, Activity,
  Calendar, Award, BotMessageSquare, ArrowRight,
} from "lucide-react"
import { RiskLevel, toRiskLevel, NetworkNode, NetworkEdge } from "@/types"
import { mapUsersToEmployees } from "@/lib/map-employees"
import { useGlobalNetworkData } from "@/hooks/useGlobalNetworkData"
import { useUsers } from "@/hooks/useUsers"
import { cn, getInitials, timeAgo } from "@/lib/utils"

// -- Types & constants --------------------------------------------------------

interface TalentMember {
  user_hash: string; name: string; role: string; risk_level: RiskLevel
  betweenness: number; eigenvector: number; unblocking: number
  networkScore: number
}

const NODE_CLR: Record<RiskLevel, string> = { LOW: "#10b981", ELEVATED: "#f59e0b", CRITICAL: "#ef4444" }

// -- Pure helpers -------------------------------------------------------------

const netScore = (b: number, e: number, u: number, mx: number) =>
  (b * 0.4 + e * 0.4 + (u / Math.max(mx, 1)) * 0.2) * 100

const impactScore = (b: number, e: number, u: number, mx: number, r: RiskLevel) =>
  (b * 0.4 + e * 0.3 + (u / Math.max(mx, 1)) * 0.3) * (r === "CRITICAL" ? 1 : r === "ELEVATED" ? 0.7 : 0.3) * 100

function gemReason(m: TalentMember): string {
  if (m.betweenness >= 0.5) return `Bridges multiple teams (betweenness ${(m.betweenness * 100).toFixed(0)}%)`
  if (m.unblocking >= 5) return `Unblocks ${m.unblocking} people -- removes bottlenecks`
  if (m.eigenvector >= 0.5) return "Connected to the most influential people"
  return "High centrality across multiple dimensions"
}

const isNonMgmt = (role: string) => !["manager", "admin"].includes(role.toLowerCase())

// -- Network SVG (force-directed-ish layout) ----------------------------------

function NetworkGraph({ members, edges }: { members: TalentMember[]; edges: NetworkEdge[] }) {
  const W = 560, H = 380, CX = W / 2, CY = H / 2, RAD = Math.min(CX, CY) - 56

  const pos = useMemo(() => members.map((_, i) => {
    const a = (2 * Math.PI * i) / members.length - Math.PI / 2
    // Stagger radius slightly to break the perfect ring
    const jitter = (i % 3 === 0 ? -18 : i % 3 === 1 ? 12 : 0)
    return { x: CX + (RAD + jitter) * Math.cos(a), y: CY + (RAD + jitter) * Math.sin(a) }
  }), [members.length, CX, CY, RAD])

  const idx = useMemo(() => new Map(members.map((m, i) => [m.user_hash, i])), [members])
  const maxB = Math.max(0.01, ...members.map((m) => m.betweenness))
  const gems = useMemo(
    () => new Set(
      members
        .filter((m) => m.betweenness > 0.3 && m.unblocking > 5 && m.eigenvector < 0.2 && isNonMgmt(m.role))
        .map((m) => m.user_hash)
    ),
    [members],
  )
  const avg = members.length > 0 ? (edges.length * 2 / members.length).toFixed(1) : "0"

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        <defs>
          <filter id="glow-red" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feFlood floodColor="#ef4444" floodOpacity="0.4" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="shadow" />
            <feMerge><feMergeNode in="shadow" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="glow-gem" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feFlood floodColor="#f59e0b" floodOpacity="0.35" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="shadow" />
            <feMerge><feMergeNode in="shadow" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Edges */}
        {edges.map((e, i) => {
          const s = idx.get(e.source), t = idx.get(e.target)
          return s !== undefined && t !== undefined ? (
            <line
              key={i}
              x1={pos[s].x} y1={pos[s].y}
              x2={pos[t].x} y2={pos[t].y}
              stroke="hsl(var(--border))"
              strokeWidth={Math.max(0.5, e.weight * 2.5)}
              opacity={0.35}
            />
          ) : null
        })}

        {/* Nodes */}
        {members.map((m, i) => {
          const p = pos[i]
          // Size by betweenness centrality (range 10..28)
          const sz = 10 + (m.betweenness / maxB) * 18
          const isGem = gems.has(m.user_hash)
          const isCritical = m.risk_level === "CRITICAL"
          const filterAttr = isCritical ? "url(#glow-red)" : isGem ? "url(#glow-gem)" : undefined

          return (
            <g key={m.user_hash} className="cursor-pointer" style={{ transition: "opacity 150ms" }}>
              {/* Hidden gem dashed amber ring */}
              {isGem && (
                <circle
                  cx={p.x} cy={p.y} r={sz + 5}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="4 3"
                  opacity={0.8}
                />
              )}

              {/* Main node circle */}
              <circle
                cx={p.x} cy={p.y} r={sz}
                fill={NODE_CLR[m.risk_level]}
                fillOpacity={isCritical ? 0.4 : 0.2}
                stroke={NODE_CLR[m.risk_level]}
                strokeWidth={isCritical ? 2.5 : 1.5}
                filter={filterAttr}
              />

              {/* Initials inside node */}
              <text
                x={p.x} y={p.y + 3}
                textAnchor="middle"
                fontSize={sz > 18 ? "10" : "8"}
                fill="hsl(var(--foreground))"
                fontWeight="700"
                fontFamily="var(--font-geist-mono), monospace"
              >
                {getInitials(m.name)}
              </text>

              {/* Name label below */}
              <text
                x={p.x} y={p.y + sz + 13}
                textAnchor="middle"
                fontSize="8"
                fill="hsl(var(--muted-foreground))"
                fontFamily="var(--font-geist-sans), sans-serif"
              >
                {m.name.split(" ")[0]}
              </text>
            </g>
          )
        })}
      </svg>

      {/* Legend and summary */}
      <div className="flex items-center justify-between mt-3 px-1">
        <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />Low
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500" />Elevated
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-red-500" />Critical
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full border border-dashed border-amber-500" />Gem
          </span>
        </div>
        <p className="text-[10px] text-muted-foreground tabular-nums">
          {members.length} members &middot; {edges.length} connections &middot; Avg {avg}/person
        </p>
      </div>
    </div>
  )
}

// -- Stat card with icon ------------------------------------------------------

function TalentStat({
  label, value, description, icon: Icon, valueClass, iconClass,
}: {
  label: string
  value: string | number
  description: string
  icon: React.ElementType
  valueClass?: string
  iconClass?: string
}) {
  return (
    <div className="bg-card border border-border rounded-lg p-5 group">
      <div className="flex items-center gap-2 mb-2">
        <div className={cn("h-7 w-7 rounded-md flex items-center justify-center shrink-0", iconClass ?? "bg-emerald-500/10")}>
          <Icon className={cn("h-3.5 w-3.5", valueClass ?? "text-emerald-400")} />
        </div>
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{label}</span>
      </div>
      <p className={cn("text-2xl font-semibold tabular-nums font-mono", valueClass ?? "text-foreground")}>{value}</p>
      <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{description}</p>
    </div>
  )
}

// -- Top contributors table ---------------------------------------------------

function TopContributors({
  ranked, gems, router,
}: {
  ranked: TalentMember[]
  gems: Set<string>
  router: ReturnType<typeof useRouter>
}) {
  const top = ranked.slice(0, 5)
  if (top.length === 0) return null

  return (
    <div className="mt-4">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-3">Top Contributors by Betweenness</p>
      <div className="space-y-0.5">
        {top.map((m, i) => {
          const isGem = gems.has(m.user_hash)
          return (
            <div
              key={m.user_hash}
              onClick={() => router.push(`/search?q=${m.user_hash}`)}
              className="flex items-center gap-3 py-2 px-2 rounded-md hover:bg-white/[0.04] cursor-pointer transition-colors duration-150"
            >
              <span className="w-5 text-center shrink-0">
                {i < 3
                  ? <Trophy className={cn("h-3.5 w-3.5 mx-auto", i === 0 ? "text-amber-400" : i === 1 ? "text-gray-400" : "text-amber-600")} />
                  : <span className="text-xs tabular-nums text-muted-foreground">{i + 1}</span>}
              </span>
              <span className="text-xs font-medium text-foreground truncate flex-1 min-w-0">{m.name}</span>
              <span className="text-[10px] tabular-nums text-muted-foreground w-14 text-right">{(m.betweenness * 100).toFixed(0)}% B</span>
              <span className="text-[10px] tabular-nums text-muted-foreground w-14 text-right">{(m.eigenvector * 100).toFixed(0)}% E</span>
              <span className="text-[10px] tabular-nums text-muted-foreground w-14 text-right">{m.unblocking} unbl</span>
              {isGem && (
                <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">Gem</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// -- Main page ----------------------------------------------------------------

function TalentContent() {
  const router = useRouter()
  const { users, isLoading: uLoad, refetch: rU } = useUsers()
  const { data: net, isLoading: nLoad, refetch: rN } = useGlobalNetworkData()
  const employees = useMemo(() => mapUsersToEmployees(users), [users])

  const members = useMemo((): TalentMember[] => {
    const nodes: NetworkNode[] = net?.nodes ?? []
    const mxU = Math.max(1, ...nodes.map((n) => n.unblocking_count ?? 0))
    if (nodes.length > 0) {
      return nodes.map((nd, i) => {
        const emp = employees.find((e) => e.user_hash === nd.id) ?? employees[i % Math.max(employees.length, 1)]
        const b = nd.betweenness ?? 0, e = nd.eigenvector ?? 0, u = nd.unblocking_count ?? 0
        return {
          user_hash: nd.id || `n${i}`,
          name: emp?.name || (nd.label?.startsWith('User_') ? undefined : nd.label) || nd.label || `User ${i + 1}`,
          role: emp?.role || "Employee",
          risk_level: toRiskLevel(nd.risk_level),
          betweenness: b, eigenvector: e, unblocking: u,
          networkScore: netScore(b, e, u, mxU),
        }
      })
    }
    return employees.map((emp) => {
      const b = emp.confidence, e = emp.velocity / 100
      return {
        user_hash: emp.user_hash, name: emp.name, role: emp.role, risk_level: emp.risk_level,
        betweenness: b, eigenvector: e, unblocking: 0, networkScore: netScore(b, e, 0, 1),
      }
    })
  }, [net, employees])

  const edges: NetworkEdge[] = net?.edges ?? []
  const mxUnblock = useMemo(() => Math.max(1, ...members.map((m) => m.unblocking)), [members])

  const hiddenGems = useMemo(
    () => members
      .filter((m) => m.betweenness > 0.3 && m.unblocking > 5 && m.eigenvector < 0.2 && isNonMgmt(m.role))
      .sort((a, b) => b.networkScore - a.networkScore)
      .slice(0, 5),
    [members],
  )
  const gemSet = useMemo(() => new Set(hiddenGems.map((g) => g.user_hash)), [hiddenGems])
  const topConn = useMemo(() => members.filter((m) => m.betweenness > 0.5), [members])
  const flightRisks = useMemo(
    () => members
      .filter((m) => (m.risk_level === "ELEVATED" || m.risk_level === "CRITICAL") && (m.betweenness + m.eigenvector) / 2 > 0.3)
      .slice(0, 5),
    [members],
  )
  const avgNet = useMemo(
    () => members.length === 0 ? 0 : Math.round(members.reduce((s, m) => s + (m.betweenness + m.eigenvector) / 2, 0) / members.length * 100),
    [members],
  )
  const ranked = useMemo(() => [...members].sort((a, b) => b.networkScore - a.networkScore), [members])
  const retRisks = useMemo(
    () => members
      .filter((m) => m.risk_level === "ELEVATED" || m.risk_level === "CRITICAL")
      .map((m) => ({ ...m, impact: impactScore(m.betweenness, m.eigenvector, m.unblocking, mxUnblock, m.risk_level) }))
      .sort((a, b) => b.impact - a.impact)
      .slice(0, 5),
    [members, mxUnblock],
  )

  const insights = useMemo(() => {
    const out: { text: string; type: "gem" | "risk" | "skill" }[] = []
    if (hiddenGems[0]) out.push({ text: `${hiddenGems[0].name} is structurally critical (betweenness: ${(hiddenGems[0].betweenness * 100).toFixed(0)}%, unblocks ${hiddenGems[0].unblocking} people) but under-recognized -- consider recognition.`, type: "gem" })
    if (retRisks[0]) out.push({ text: `${retRisks[0].name} is at ${retRisks[0].risk_level} risk and unblocks ${retRisks[0].unblocking} people -- losing them would impact throughput.`, type: "risk" })
    const lowNetPct = members.length > 0 ? Math.round(members.filter((m) => m.networkScore < 40).length / members.length * 100) : 0
    if (lowNetPct > 30) out.push({ text: `${lowNetPct}% of members have a network score below 40 -- consider cross-team collaboration programs.`, type: "skill" })
    if (out.length === 0) out.push({ text: "Collect more data to generate insights about hidden talent and network dynamics.", type: "skill" })
    return out.slice(0, 3)
  }, [hiddenGems, retRisks, members])

  const lastUp = useMemo(() => {
    const t = employees.reduce((b, e) => (e.updated_at > b ? e.updated_at : b), "")
    return t ? timeAgo(t) : "N/A"
  }, [employees])

  if (uLoad || nLoad) return <div className="flex items-center justify-center h-64"><Spinner className="h-8 w-8" /></div>

  return (
    <ScrollArea className="flex-1">
      <main className="flex flex-col gap-6 p-4 lg:p-6 max-w-[1400px] mx-auto">

        {/* ---- Row 1: Header ---- */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Talent Scout</h1>
              <p className="text-sm text-muted-foreground">Hidden talent and network impact discovery</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground bg-white/[0.04] border border-white/[0.06] rounded-full px-3 py-1">Last analyzed: {lastUp}</span>
            <button onClick={() => { rU(); rN() }} className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-border rounded-md text-muted-foreground hover:text-foreground hover:border-white/[0.12] transition-colors duration-150 cursor-pointer active:scale-[0.97]">
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </button>
          </div>
        </div>

        {/* ---- Row 2: KPI stats ---- */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <TalentStat
            label="Hidden Gems"
            value={hiddenGems.length}
            description="Structurally critical but under-recognized contributors"
            icon={Diamond}
            valueClass="text-emerald-400"
            iconClass="bg-emerald-500/10"
          />
          <TalentStat
            label="Top Connectors"
            value={topConn.length}
            description="High betweenness centrality (> 50%)"
            icon={Network}
            valueClass="text-emerald-400"
            iconClass="bg-emerald-500/10"
          />
          <TalentStat
            label="Flight Risk"
            value={flightRisks.length}
            description="Elevated+ risk with high network impact"
            icon={AlertTriangle}
            valueClass={flightRisks.length > 0 ? "text-red-400" : "text-amber-400"}
            iconClass={flightRisks.length > 0 ? "bg-red-500/10" : "bg-amber-500/10"}
          />
          <TalentStat
            label="Avg Network Score"
            value={`${avgNet}%`}
            description="Mean centrality across all members"
            icon={Activity}
            valueClass="text-foreground"
            iconClass="bg-white/[0.06]"
          />
        </div>

        {/* ---- Row 3: Network Graph (60%) + Hidden Gems (40%) ---- */}
        <div className="grid grid-cols-1 lg:grid-cols-[60fr_40fr] gap-4">

          {/* Network Graph + Top Contributors stacked */}
          <SectionCard title="Network Impact" subtitle={`${members.length} members`}>
            {members.length > 0 ? (
              <>
                <NetworkGraph members={members} edges={edges} />
                <TopContributors ranked={ranked} gems={gemSet} router={router} />
              </>
            ) : (
              <div className="py-12 text-center">
                <Network className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No network data available yet</p>
                <p className="text-xs text-muted-foreground mt-1">Network will appear as team data grows</p>
              </div>
            )}
          </SectionCard>

          {/* Hidden Gems -- the star section */}
          <div className="bg-card border border-border rounded-lg overflow-hidden flex flex-col">
            <div className="px-5 pt-5 pb-4 flex items-start justify-between border-b border-border">
              <div className="flex items-center gap-2">
                <Diamond className="h-4 w-4 text-amber-400" />
                <div>
                  <h3 className="text-base font-medium text-foreground">Hidden Gems</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Under-recognized high-impact contributors</p>
                </div>
              </div>
              {hiddenGems.length > 0 && (
                <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 tabular-nums">
                  {hiddenGems.length} found
                </span>
              )}
            </div>

            <div className="px-5 py-4 flex-1">
              {hiddenGems.length > 0 ? (
                <div className="space-y-4">
                  {hiddenGems.map((g, gi) => {
                    const bridgePct = (g.betweenness * 100).toFixed(0)
                    const visPct = (g.eigenvector * 100).toFixed(0)
                    return (
                      <div
                        key={g.user_hash}
                        className={cn(
                          "rounded-lg border p-4 transition-colors duration-150",
                          gi === 0
                            ? "border-amber-500/20 bg-amber-500/[0.04]"
                            : "border-border hover:border-white/[0.08]",
                        )}
                      >
                        {/* Header row */}
                        <div className="flex items-center gap-3 mb-3">
                          <Avatar className="h-9 w-9 shrink-0">
                            <AvatarFallback className="bg-amber-500/10 text-amber-400 text-[11px] font-semibold">
                              {getInitials(g.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{g.name}</p>
                            <p className="text-[11px] text-muted-foreground">{g.role}</p>
                          </div>
                          {gi === 0 && <Sparkles className="h-4 w-4 text-amber-400 shrink-0" />}
                        </div>

                        {/* Why they are a hidden gem */}
                        <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                          {gemReason(g)}
                        </p>

                        {/* Metric pills */}
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 tabular-nums">
                            Bridge {bridgePct}%
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-white/[0.04] text-muted-foreground border border-white/[0.06] tabular-nums">
                            Visibility {visPct}%
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-white/[0.04] text-muted-foreground border border-white/[0.06] tabular-nums">
                            {g.unblocking} unblocked
                          </span>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => router.push(`/ask-sentinel?q=${encodeURIComponent(`Prepare a 1:1 agenda for ${g.name} who is a hidden gem - high betweenness ${bridgePct}%, unblocks ${g.unblocking} people`)}`)}
                            className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 cursor-pointer transition-colors"
                          >
                            <Calendar className="h-3 w-3" /> Schedule 1:1
                          </button>
                          <span className="h-3 border-l border-border" />
                          <button
                            onClick={() => router.push(`/ask-sentinel?q=${encodeURIComponent(`How should I recognize ${g.name} who bridges teams with ${bridgePct}% betweenness centrality?`)}`)}
                            className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                          >
                            <Award className="h-3 w-3" /> Recognize
                          </button>
                          <span className="h-3 border-l border-border" />
                          <button
                            onClick={() => router.push(`/ask-sentinel?q=${encodeURIComponent(`Tell me about ${g.name}'s network position and contribution patterns`)}`)}
                            className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                          >
                            <BotMessageSquare className="h-3 w-3" /> Ask Sentinel
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="h-12 w-12 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-4">
                    <Diamond className="h-6 w-6 text-muted-foreground/30" />
                  </div>
                  <p className="text-sm font-medium text-foreground mb-1">No hidden gems detected</p>
                  <p className="text-xs text-muted-foreground max-w-[260px] leading-relaxed">
                    All high-impact contributors appear properly recognized, or more data is needed to identify under-the-radar talent.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ---- Row 4: Network Impact Assessment + Retention Risk (50/50) ---- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SectionCard title="Network Impact Assessment" subtitle="4 real metrics">
            <div className="overflow-x-auto">
              <div className="flex items-center gap-0.5 mb-1">
                <div className="w-24 shrink-0" />
                {(["Betweenness", "Eigenvector", "Unblocking", "Net Score"] as const).map((h) => <div key={h} className="flex-1 text-[10px] text-muted-foreground text-center font-medium uppercase tracking-wider">{h}</div>)}
              </div>
              {members.slice(0, 5).map((m) => {
                const bPct = m.betweenness * 100
                const ePct = m.eigenvector * 100
                const pctLabel = (v: number) => v >= 70 ? { text: "High", cls: "bg-emerald-500/20 text-emerald-400" } : v >= 40 ? { text: "Med", cls: "bg-primary/10 text-primary" } : v >= 20 ? { text: "Low", cls: "bg-amber-500/15 text-amber-400" } : { text: "Min", cls: "bg-muted text-muted-foreground" }
                const countLabel = (v: number) => v >= 8 ? { text: "High", cls: "bg-emerald-500/20 text-emerald-400" } : v >= 4 ? { text: "Med", cls: "bg-primary/10 text-primary" } : v >= 2 ? { text: "Low", cls: "bg-amber-500/15 text-amber-400" } : { text: "Min", cls: "bg-muted text-muted-foreground" }
                const bL = pctLabel(bPct), eL = pctLabel(ePct), uL = countLabel(m.unblocking), nL = pctLabel(m.networkScore)
                return (
                  <div key={m.user_hash} className="flex items-center gap-0.5 mb-0.5">
                    <div className="w-24 shrink-0 text-xs text-muted-foreground truncate pr-2">{m.name}</div>
                    <div className={cn("flex-1 rounded-sm py-1 text-center text-[9px] font-medium", bL.cls)} title={`Betweenness: ${bPct.toFixed(0)}%`}>{bL.text}</div>
                    <div className={cn("flex-1 rounded-sm py-1 text-center text-[9px] font-medium", eL.cls)} title={`Eigenvector: ${ePct.toFixed(0)}%`}>{eL.text}</div>
                    <div className={cn("flex-1 rounded-sm py-1 text-center text-[9px] font-medium", uL.cls)} title={`Unblocking: ${m.unblocking}`}>{uL.text}</div>
                    <div className={cn("flex-1 rounded-sm py-1 text-center text-[9px] font-medium", nL.cls)} title={`Net Score: ${m.networkScore.toFixed(1)}`}>{nL.text}</div>
                  </div>
                )
              })}
              {members.length > 5 && <p className="text-xs text-muted-foreground mt-2">+{members.length - 5} more</p>}
              {members.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No network data available</p>}
              <div className="flex gap-3 mt-3 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-emerald-500/20" />High</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-primary/10" />Med</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-amber-500/15" />Low</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-muted" />Min</span>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Retention Risk" subtitle="Impact-weighted">
            {retRisks.length > 0 ? (
              <div className="space-y-3">
                {retRisks.map((m) => (
                  <div key={m.user_hash} className="flex items-center gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
                    <Avatar className="h-8 w-8 shrink-0"><AvatarFallback className={cn("text-[10px]", m.risk_level === "CRITICAL" ? "bg-red-500/10 text-red-400" : "bg-amber-500/10 text-amber-400")}>{getInitials(m.name)}</AvatarFallback></Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2"><span className="text-sm font-medium text-foreground truncate">{m.name}</span><RiskBadge level={m.risk_level} /></div>
                        <span className="text-xs font-medium tabular-nums text-muted-foreground ml-2 shrink-0">{m.impact.toFixed(0)}%</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full transition-all duration-500", m.risk_level === "CRITICAL" ? "bg-red-500" : "bg-amber-500")} style={{ width: `${Math.min(m.impact, 100)}%` }} />
                      </div>
                    </div>
                    <button onClick={() => router.push(`/ask-sentinel?q=${encodeURIComponent(`Prepare a retention conversation for ${m.name} who is at ${m.risk_level} risk and unblocks ${m.unblocking} people`)}`)} className="shrink-0 text-xs border border-border rounded-md px-2.5 py-1 text-muted-foreground hover:text-foreground hover:border-white/[0.12] transition-colors duration-150 cursor-pointer active:scale-[0.97]">Schedule Talk</button>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-muted-foreground text-center py-8">No high-impact flight risks detected</p>}
          </SectionCard>
        </div>

        {/* ---- Row 5: Full-width Leaderboard ---- */}
        <SectionCard title="Top Network Contributors" subtitle="Ranked by network impact">
          <div className="overflow-x-auto">
            <div className="flex items-center text-[11px] uppercase tracking-wider text-muted-foreground font-medium border-b border-border pb-2 mb-1">
              <div className="w-12 shrink-0 text-center">Rank</div>
              <div className="flex-[2] min-w-0">Member</div>
              <div className="flex-1 hidden md:block">Role</div>
              <div className="w-20 text-right hidden md:block">Between.</div>
              <div className="w-20 text-right hidden md:block">Eigen.</div>
              <div className="w-20 text-right hidden md:block">Unblocked</div>
              <div className="w-24 text-right">Score</div>
            </div>
            {ranked.map((m, i) => (
              <div key={m.user_hash} onClick={() => router.push(`/search?q=${m.user_hash}`)} className="flex items-center py-2.5 border-b border-white/[0.04] hover:bg-muted/50 cursor-pointer transition-colors duration-150">
                <div className="w-12 shrink-0 text-center">
                  {i < 3 ? <Trophy className={cn("h-4 w-4 mx-auto", i === 0 ? "text-amber-400" : i === 1 ? "text-gray-400" : "text-amber-600")} /> : <span className="text-sm tabular-nums text-muted-foreground">{i + 1}</span>}
                </div>
                <div className="flex-[2] min-w-0 flex items-center gap-2">
                  <Avatar className="h-7 w-7 shrink-0"><AvatarFallback className="text-[10px] bg-muted">{getInitials(m.name)}</AvatarFallback></Avatar>
                  <span className="text-sm font-medium text-foreground truncate">{m.name}</span>
                  {gemSet.has(m.user_hash) && <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">Gem</span>}
                </div>
                <div className="flex-1 text-sm text-muted-foreground hidden md:block truncate">{m.role}</div>
                <div className="w-20 text-right text-sm tabular-nums hidden md:block">{(m.betweenness * 100).toFixed(0)}%</div>
                <div className="w-20 text-right text-sm tabular-nums hidden md:block">{(m.eigenvector * 100).toFixed(0)}%</div>
                <div className="w-20 text-right text-sm tabular-nums hidden md:block">{m.unblocking}</div>
                <div className="w-24 text-right text-sm font-medium tabular-nums text-emerald-400">{m.networkScore.toFixed(1)}</div>
              </div>
            ))}
            {ranked.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">No contributor data available yet</p>}
          </div>
        </SectionCard>

        {/* ---- Row 6: AI Insights ---- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {insights.map((ins, i) => (
            <div key={i} className="bg-card border border-border rounded-lg p-5">
              <div className="flex items-start gap-3">
                {ins.type === "gem"
                  ? <Sparkles className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                  : ins.type === "risk"
                  ? <Lightbulb className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                  : <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />}
                <div>
                  <p className="text-sm text-foreground leading-relaxed">{ins.text}</p>
                  <button
                    onClick={() => router.push(`/ask-sentinel?q=${encodeURIComponent(ins.text.slice(0, 80))}`)}
                    className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 mt-2 cursor-pointer transition-colors"
                  >
                    Ask Sentinel <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </ScrollArea>
  )
}

export default function TalentEnginePage() {
  return (
    <ProtectedRoute allowedRoles={["manager", "admin"]}>
      <TalentContent />
    </ProtectedRoute>
  )
}
