"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { ProtectedRoute } from "@/components/protected-route"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { StatCard } from "@/components/dashboard/stat-card"
import { SectionCard } from "@/components/dashboard/section-card"
import { RiskBadge } from "@/components/dashboard/risk-badge"
import { Spinner } from "@/components/ui/spinner"
import { Sparkles, RefreshCw, Lightbulb, Trophy, MessageSquare } from "lucide-react"
import { RiskLevel, toRiskLevel, NetworkNode, NetworkEdge } from "@/types"
import { mapUsersToEmployees } from "@/lib/map-employees"
import { useGlobalNetworkData } from "@/hooks/useGlobalNetworkData"
import { useUsers } from "@/hooks/useUsers"
import { cn, getInitials, timeAgo } from "@/lib/utils"

// ── Types & constants ────────────────────────────────────────────────────────

interface TalentMember {
  user_hash: string; name: string; role: string; risk_level: RiskLevel
  betweenness: number; eigenvector: number; unblocking: number
  networkScore: number
}

const NODE_CLR: Record<RiskLevel, string> = { LOW: "#10b981", ELEVATED: "#f59e0b", CRITICAL: "#ef4444" }

// ── Pure helpers ─────────────────────────────────────────────────────────────

const netScore = (b: number, e: number, u: number, mx: number) => (b * 0.4 + e * 0.4 + (u / Math.max(mx, 1)) * 0.2) * 100
const impactScore = (b: number, e: number, u: number, mx: number, r: RiskLevel) =>
  (b * 0.4 + e * 0.3 + (u / Math.max(mx, 1)) * 0.3) * (r === "CRITICAL" ? 1 : r === "ELEVATED" ? 0.7 : 0.3) * 100

function gemReason(m: TalentMember): string {
  if (m.betweenness >= 0.5) return `Bridges multiple teams (betweenness ${(m.betweenness * 100).toFixed(0)}%)`
  if (m.unblocking >= 5) return `Unblocks ${m.unblocking} people -- removes bottlenecks`
  if (m.eigenvector >= 0.5) return "Connected to the most influential people"
  return "High centrality across multiple dimensions"
}

const isNonMgmt = (role: string) => !["manager", "admin"].includes(role.toLowerCase())

// ── Network SVG ──────────────────────────────────────────────────────────────

function NetworkGraph({ members, edges }: { members: TalentMember[]; edges: NetworkEdge[] }) {
  const W = 480, H = 320, CX = W / 2, CY = H / 2, RAD = Math.min(CX, CY) - 46
  const pos = useMemo(() => members.map((_, i) => {
    const a = (2 * Math.PI * i) / members.length - Math.PI / 2
    return { x: CX + RAD * Math.cos(a), y: CY + RAD * Math.sin(a) }
  }), [members.length, CX, CY, RAD])

  const idx = useMemo(() => new Map(members.map((m, i) => [m.user_hash, i])), [members])
  const maxE = Math.max(0.01, ...members.map((m) => m.eigenvector))
  const gems = useMemo(() => new Set(members.filter((m) => m.betweenness > 0.3 && m.unblocking > 5 && m.eigenvector < 0.2 && isNonMgmt(m.role)).map((m) => m.user_hash)), [members])
  const avg = members.length > 0 ? (edges.length * 2 / members.length).toFixed(1) : "0"

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        {edges.map((e, i) => {
          const s = idx.get(e.source), t = idx.get(e.target)
          return s !== undefined && t !== undefined ? (
            <line key={i} x1={pos[s].x} y1={pos[s].y} x2={pos[t].x} y2={pos[t].y} stroke="hsl(var(--border))" strokeWidth={Math.max(0.5, e.weight * 2)} opacity={0.5} />
          ) : null
        })}
        {members.map((m, i) => {
          const p = pos[i], sz = 12 + (m.eigenvector / maxE) * 14, isGem = gems.has(m.user_hash)
          return (
            <g key={m.user_hash}>
              {isGem && <circle cx={p.x} cy={p.y} r={sz + 4} fill="none" stroke="#f59e0b" strokeWidth={2} strokeDasharray="3 2" />}
              <circle cx={p.x} cy={p.y} r={sz} fill={NODE_CLR[m.risk_level]} fillOpacity={0.25} stroke={NODE_CLR[m.risk_level]} strokeWidth={1.5} />
              <text x={p.x} y={p.y + 3} textAnchor="middle" fontSize="8" fill="hsl(var(--foreground))" fontWeight="600">{getInitials(m.name)}</text>
              <text x={p.x} y={p.y + sz + 11} textAnchor="middle" fontSize="7" fill="hsl(var(--muted-foreground))">{m.name.split(" ")[0]}</text>
            </g>
          )
        })}
      </svg>
      <p className="text-xs text-muted-foreground mt-2 text-center">{members.length} members &middot; {edges.length} connections &middot; Avg {avg} per person</p>
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────

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
        return { user_hash: nd.id || `n${i}`, name: nd.label || emp?.name || `User ${i + 1}`, role: emp?.role || "Employee", risk_level: toRiskLevel(nd.risk_level), betweenness: b, eigenvector: e, unblocking: u, networkScore: netScore(b, e, u, mxU) }
      })
    }
    return employees.map((emp) => {
      const b = emp.confidence, e = emp.velocity / 100
      return { user_hash: emp.user_hash, name: emp.name, role: emp.role, risk_level: emp.risk_level, betweenness: b, eigenvector: e, unblocking: 0, networkScore: netScore(b, e, 0, 1) }
    })
  }, [net, employees])

  const edges: NetworkEdge[] = net?.edges ?? []
  const mxUnblock = useMemo(() => Math.max(1, ...members.map((m) => m.unblocking)), [members])

  const hiddenGems = useMemo(() => members.filter((m) => m.betweenness > 0.3 && m.unblocking > 5 && m.eigenvector < 0.2 && isNonMgmt(m.role)).sort((a, b) => b.networkScore - a.networkScore).slice(0, 5), [members])
  const topConn = useMemo(() => members.filter((m) => m.betweenness > 0.5), [members])
  const flightRisks = useMemo(() => members.filter((m) => (m.risk_level === "ELEVATED" || m.risk_level === "CRITICAL") && (m.betweenness + m.eigenvector) / 2 > 0.3).slice(0, 5), [members])
  const avgNet = useMemo(() => members.length === 0 ? 0 : Math.round(members.reduce((s, m) => s + (m.betweenness + m.eigenvector) / 2, 0) / members.length * 100), [members])
  const ranked = useMemo(() => [...members].sort((a, b) => b.networkScore - a.networkScore), [members])
  const retRisks = useMemo(() => members.filter((m) => m.risk_level === "ELEVATED" || m.risk_level === "CRITICAL").map((m) => ({ ...m, impact: impactScore(m.betweenness, m.eigenvector, m.unblocking, mxUnblock, m.risk_level) })).sort((a, b) => b.impact - a.impact).slice(0, 5), [members, mxUnblock])

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
        {/* Row 1 -- Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-emerald-400 shrink-0" />
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Talent Scout</h1>
              <p className="text-sm text-muted-foreground">Hidden talent and network impact discovery</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">Last analyzed: {lastUp}</span>
            <button onClick={() => { rU(); rN() }} className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-border rounded-md text-muted-foreground hover:text-foreground hover:border-white/[0.12] transition-colors duration-150 cursor-pointer active:scale-[0.97]">
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </button>
          </div>
        </div>

        {/* Row 2 -- KPI */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="HIDDEN GEMS" value={hiddenGems.length} description="Structurally critical but under-recognized" valueClassName="text-emerald-400" />
          <StatCard label="TOP CONNECTORS" value={topConn.length} description="Betweenness > 50%" valueClassName="text-emerald-400" />
          <StatCard label="FLIGHT RISK" value={flightRisks.length} description="Elevated+ risk, high impact" valueClassName={flightRisks.length > 0 ? "text-red-400" : "text-amber-400"} />
          <StatCard label="AVG NETWORK SCORE" value={`${avgNet}%`} description="Mean centrality across team" />
        </div>

        {/* Row 3 -- Network + Gems (55/45) */}
        <div className="grid grid-cols-1 lg:grid-cols-[55fr_45fr] gap-4">
          <SectionCard title="Network Impact" subtitle={`${members.length} members`}>
            {members.length > 0 ? <NetworkGraph members={members} edges={edges} /> : <p className="text-sm text-muted-foreground text-center py-12">No network data available yet</p>}
          </SectionCard>

          <SectionCard title="Hidden Gems" action={hiddenGems.length > 0 ? <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400">{hiddenGems.length} found</span> : null}>
            {hiddenGems.length > 0 ? (
              <div className="space-y-3">
                {hiddenGems.map((g) => (
                  <div key={g.user_hash} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                    <Avatar className="h-8 w-8 shrink-0"><AvatarFallback className="bg-emerald-500/10 text-emerald-400 text-[10px]">{getInitials(g.name)}</AvatarFallback></Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{g.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{gemReason(g)}</p>
                      <div className="flex gap-3 mt-1.5 text-[11px] text-muted-foreground tabular-nums">
                        <span>B: {(g.betweenness * 100).toFixed(0)}%</span>
                        <span>E: {(g.eigenvector * 100).toFixed(0)}%</span>
                        <span>Unblocked: {g.unblocking}</span>
                      </div>
                    </div>
                    <button onClick={() => router.push(`/ask-sentinel?q=${encodeURIComponent(`Prepare a 1:1 agenda for ${g.name} who is a hidden gem - high betweenness ${(g.betweenness * 100).toFixed(0)}%, unblocks ${g.unblocking} people`)}`)} className="shrink-0 text-xs text-emerald-400 hover:text-emerald-300 cursor-pointer transition-colors">Schedule 1:1</button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center">
                <p className="text-sm text-muted-foreground">No employees currently meet all hidden gem criteria (betweenness &gt; 30%, unblocking &gt; 5, eigenvector &lt; 20%, non-management).</p>
                <p className="text-xs text-muted-foreground mt-2">This can mean your team is well-recognized, or more data is needed.</p>
              </div>
            )}
          </SectionCard>
        </div>

        {/* Row 4 -- Network Impact + Retention (50/50) */}
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

        {/* Row 5 -- Leaderboard */}
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

        {/* Row 6 -- AI Insights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {insights.map((ins, i) => (
            <div key={i} className="bg-card border border-border rounded-lg p-5">
              <div className="flex items-start gap-3">
                {ins.type === "gem" ? <Sparkles className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" /> : ins.type === "risk" ? <Lightbulb className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" /> : <MessageSquare className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />}
                <div>
                  <p className="text-sm text-foreground leading-relaxed">{ins.text}</p>
                  <button onClick={() => router.push(`/ask-sentinel?q=${encodeURIComponent(ins.text.slice(0, 80))}`)} className="text-xs text-primary hover:text-primary/80 mt-2 cursor-pointer transition-colors">Ask Copilot</button>
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
