"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { toast } from "sonner"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ProtectedRoute } from "@/components/protected-route"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Search, Loader2, Info, Shield, Gem, Thermometer,
  Link as LinkIcon, ChevronRight, ChevronLeft,
  ExternalLink, CheckCircle2,
} from "lucide-react"
import {
  initiateConnection, getConnectedToolsLive, disconnectTool, listToolkits,
  invalidateToolCache, postConnectSync,
} from "@/lib/api"

interface ToolDef {
  name: string
  slug: string
  description: string
  category: string
  logo: string
  no_auth?: boolean
}

type CategoryFilter = "all" | string
type TabFilter = "my-apps" | "all-apps"

const CDN = "https://logos.composio.dev/api"
const fb = (s: string, n: string, d: string, c: string): ToolDef => ({
  slug: s, name: n, description: d, category: c, logo: `${CDN}/${s}`,
})
const FALLBACK_CATALOG: ToolDef[] = [
  fb("gmail", "Gmail", "Read, send, and manage emails.", "Communication"),
  fb("slack", "Slack", "Monitor team communication patterns.", "Communication"),
  fb("zoom", "Zoom", "Detect meeting fatigue from video calls.", "Communication"),
  fb("outlook", "Outlook", "Manage Microsoft Outlook emails and calendar.", "Communication"),
  fb("msteams", "Microsoft Teams", "Team collaboration and messaging.", "Communication"),
  fb("googlecalendar", "Google Calendar", "Analyze meeting load and scheduling.", "Productivity"),
  fb("notion", "Notion", "Access workspace pages and databases.", "Productivity"),
  fb("googledrive", "Google Drive", "Access and manage files.", "Productivity"),
  fb("asana", "Asana", "Task and project tracking.", "Productivity"),
  fb("github", "GitHub", "Track commits, PRs, and code review.", "Development"),
  fb("gitlab", "GitLab", "DevOps platform for code collaboration.", "Development"),
  fb("bitbucket", "Bitbucket", "Code repositories and PR management.", "Development"),
  fb("jira", "Jira", "Monitor sprint velocity and workload.", "Project Management"),
  fb("linear", "Linear", "Track issue workload and cycle time.", "Project Management"),
  fb("trello", "Trello", "Organize tasks with boards.", "Project Management"),
  fb("hubspot", "HubSpot", "CRM data and pipeline management.", "Sales"),
  fb("salesforce", "Salesforce", "CRM analytics and sales pipeline.", "Sales"),
  fb("bamboohr", "BambooHR", "HR data and time-off tracking.", "HR & Analytics"),
  fb("pagerduty", "PagerDuty", "Incident management and alerting.", "HR & Analytics"),
  fb("datadog", "Datadog", "Infrastructure monitoring and metrics.", "HR & Analytics"),
]

const ENGINE_MAPPINGS = [
  { engine: "Safety Engine", icon: Shield, tools: ["GitHub", "Slack"], color: "hsl(var(--sentinel-critical))" },
  { engine: "Talent Scout", icon: Gem, tools: ["GitHub", "Jira"], color: "hsl(var(--sentinel-gem))" },
  { engine: "Culture Engine", icon: Thermometer, tools: ["Slack", "Google Calendar"], color: "hsl(var(--sentinel-critical))" },
  { engine: "Network Engine", icon: LinkIcon, tools: ["Slack", "GitHub"], color: "hsl(var(--primary))" },
]

/** Validate OAuth/connection URLs — only allow HTTPS to known providers */
function isValidConnectionUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== "https:") return false
    const allowedDomains = [
      "composio.dev",
      "accounts.google.com",
      "login.microsoftonline.com",
      "github.com",
      "slack.com",
    ]
    return allowedDomains.some(
      (domain) =>
        parsed.hostname === domain ||
        parsed.hostname.endsWith(`.${domain}`),
    )
  } catch {
    return false
  }
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])
  return debouncedValue
}

function MarketplaceBanner() {
  const [titleIdx, setTitleIdx] = useState(0)
  const [fade, setFade] = useState(true)
  const titles = [
    "Connect your workspace",
    "500+ integrations available",
    "AI-powered tool execution",
    "One chat for every app",
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setFade(false)
      setTimeout(() => {
        setTitleIdx((p) => (p + 1) % titles.length)
        setFade(true)
      }, 300)
    }, 4000)
    return () => clearInterval(timer)
  }, [titles.length])

  const floatingLogos = [
    { slug: "gmail", top: "10%", left: "5%" },
    { slug: "googlecalendar", top: "60%", left: "8%" },
    { slug: "slack", top: "18%", right: "6%" },
    { slug: "github", top: "68%", right: "10%" },
    { slug: "notion", top: "8%", right: "22%" },
    { slug: "linear", top: "72%", left: "20%" },
    { slug: "jira", top: "38%", left: "3%" },
    { slug: "zoom", top: "42%", right: "4%" },
    { slug: "salesforce", top: "15%", left: "28%" },
    { slug: "asana", top: "80%", right: "24%" },
  ]

  return (
    <div className="relative w-full rounded-xl border border-border bg-card overflow-hidden mb-6">
      <div className="flex items-center justify-center py-16 px-6">
        {floatingLogos.map((logo) => (
          <img
            key={logo.slug}
            src={`${CDN}/${logo.slug}`}
            alt=""
            className="absolute h-9 w-9 rounded-lg opacity-15"
            style={{ top: logo.top, left: logo.left, right: logo.right }}
          />
        ))}
        <div className="text-center z-10">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-4">
            500+ Integrations
          </div>
          <h2
            className="text-2xl font-bold text-foreground transition-opacity duration-300"
            style={{ opacity: fade ? 1 : 0 }}
          >
            {titles[titleIdx]}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Connect any tool and let Sentinel&apos;s AI handle the rest
          </p>
        </div>
      </div>
    </div>
  )
}

function ShimmerGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="flex flex-col rounded-xl border border-border bg-card p-5">
          <div className="flex items-start gap-4">
            <Skeleton className="h-12 w-12 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-3/4" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-8 w-20 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  )
}

function ToolLogo({ src, name, className = "" }: { src: string; name: string; className?: string }) {
  const [failed, setFailed] = useState(false)
  if (failed || !src) {
    return (
      <div className={`flex items-center justify-center rounded-xl bg-muted/30 text-sm font-semibold text-muted-foreground ${className}`}>
        {name.charAt(0).toUpperCase()}
      </div>
    )
  }
  return (
    <img
      src={src} alt={`${name} logo`} loading="lazy" decoding="async"
      onError={() => setFailed(true)}
      className={`rounded-xl bg-muted/30 object-contain p-2 ${className}`}
    />
  )
}

function ToolCard({
  tool, connected, isLoading, onConnect, onDisconnect, onClick,
}: {
  tool: ToolDef; connected: boolean; isLoading: boolean
  onConnect: (slug: string) => void; onDisconnect: (slug: string) => void
  onClick: () => void
}) {
  return (
    <div
      className="flex flex-col rounded-xl border border-border bg-card p-5 transition-colors duration-150 hover:border-border/80 cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        <ToolLogo src={tool.logo} name={tool.name} className="h-12 w-12 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-base font-semibold text-foreground">{tool.name}</p>
            {connected && (
              <Badge className="border-transparent bg-primary/10 text-primary rounded-full px-2 py-0.5 text-[10px]">
                Connected
              </Badge>
            )}
          </div>
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {tool.description}
          </p>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <Badge variant="secondary" className="bg-muted text-muted-foreground border-transparent rounded-full px-2 py-0.5 text-[10px] font-medium">
          {tool.category}
        </Badge>
        {connected ? (
          <Button variant="outline" size="sm"
            onClick={(e) => { e.stopPropagation(); onDisconnect(tool.slug) }}
            disabled={isLoading}
            className="h-8 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive">
            {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Disconnect"}
          </Button>
        ) : (
          <Button size="sm"
            onClick={(e) => { e.stopPropagation(); onConnect(tool.slug) }}
            disabled={isLoading} className="h-8 gap-1.5 text-xs">
            {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <><ExternalLink className="h-3 w-3" />Connect</>}
          </Button>
        )}
      </div>
    </div>
  )
}

function ToolDetailView({ tool, connected, isLoading, onBack, onConnect, onDisconnect, similarTools }: {
  tool: ToolDef; connected: boolean; isLoading: boolean
  onBack: () => void; onConnect: (slug: string) => void; onDisconnect: (slug: string) => void
  similarTools: ToolDef[]
}) {
  return (
    <div className="flex flex-col gap-6">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit">
        <ChevronLeft className="h-4 w-4" /> Back to all integrations
      </button>

      <div className="flex items-start gap-5">
        <ToolLogo src={tool.logo} name={tool.name} className="h-16 w-16 shrink-0" />
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-foreground">{tool.name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{tool.description}</p>
        </div>
        <div className="shrink-0">
          {connected ? (
            <Button variant="outline" onClick={() => onDisconnect(tool.slug)} disabled={isLoading}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Disconnect"}
            </Button>
          ) : (
            <Button onClick={() => onConnect(tool.slug)} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Connect"}
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold mb-3">Overview</h3>
        <div className="space-y-3 text-sm">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Category</span>
            <p className="mt-0.5">{tool.category}</p>
          </div>
          <div>
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Description</span>
            <p className="mt-0.5 text-muted-foreground">{tool.description}</p>
          </div>
          <div>
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Connection Status</span>
            <div className="mt-0.5 flex items-center gap-1.5">
              {connected ? (
                <><CheckCircle2 className="h-4 w-4 text-emerald-500" /> <span className="text-emerald-500">Connected</span></>
              ) : (
                <span className="text-muted-foreground">Not Connected</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {similarTools.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-3">Similar Integrations</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {similarTools.map((st) => (
              <button
                key={st.slug}
                onClick={() => {
                  // Navigate to this tool -- handled by parent via onBack + select
                  onBack()
                  // Small delay so parent state clears, then re-select
                  setTimeout(() => {
                    window.dispatchEvent(new CustomEvent("sentinel:select-tool", { detail: { slug: st.slug } }))
                  }, 50)
                }}
                className="flex items-center gap-3 rounded-lg border border-border bg-muted/20 px-4 py-3 text-left transition-colors hover:border-border/80"
              >
                <ToolLogo src={st.logo} name={st.name} className="h-8 w-8 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{st.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{st.category}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function CategoryChips({ categories, active, onChange, counts }: {
  categories: string[]; active: CategoryFilter; onChange: (cat: CategoryFilter) => void; counts: Record<string, number>
}) {
  const chipClass = (isActive: boolean) =>
    `flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors duration-150 ${
      isActive ? "bg-primary text-primary-foreground" : "border border-border bg-card text-muted-foreground hover:border-border/80 hover:text-foreground"
    }`
  return (
    <div className="flex flex-wrap gap-2">
      <button onClick={() => onChange("all")} className={chipClass(active === "all")}>All</button>
      {categories.map((cat) => (
        <button key={cat} onClick={() => onChange(cat)} className={chipClass(active === cat)}>
          {cat}
          {(counts[cat] ?? 0) > 0 && (
            <span className={`rounded-full px-1.5 text-[10px] tabular-nums ${active === cat ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"}`}>
              {counts[cat]}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

function MarketplaceContent() {
  const [connectedSlugs, setConnectedSlugs] = useState<Set<string>>(new Set())
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [allTools, setAllTools] = useState<ToolDef[]>([])
  const [totalTools, setTotalTools] = useState(0)
  const [activeTab, setActiveTab] = useState<TabFilter>("all-apps")
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTool, setSelectedTool] = useState<ToolDef | null>(null)
  const debouncedSearch = useDebounce(searchQuery, 300)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const closeCheckRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Auto-paginate: fetch ALL pages on mount or when search changes
  useEffect(() => {
    let cancelled = false
    async function fetchAll() {
      setIsLoading(true)
      let cursor: string | undefined
      let accumulated: ToolDef[] = []

      try {
        while (true) {
          const result = await listToolkits({
            limit: 100,
            cursor,
            search: debouncedSearch || undefined,
          })
          const mapped: ToolDef[] = result.items.map((item) => ({
            slug: item.slug,
            name: item.name,
            description: item.description,
            category: item.category,
            logo: item.logo,
            no_auth: item.no_auth,
          }))
          accumulated = [...accumulated, ...mapped]
          // Dedupe by slug
          const seen = new Set<string>()
          accumulated = accumulated.filter((t) => {
            if (seen.has(t.slug)) return false
            seen.add(t.slug)
            return true
          })

          if (cancelled) return
          setAllTools(accumulated)
          setTotalTools(result.total)

          if (!result.next_cursor) break
          cursor = result.next_cursor
        }
      } catch {
        if (!cancelled) {
          setAllTools(FALLBACK_CATALOG)
          setTotalTools(FALLBACK_CATALOG.length)
        }
      }
      if (!cancelled) setIsLoading(false)
    }
    fetchAll()
    return () => { cancelled = true }
  }, [debouncedSearch])

  // Listen for tool selection events (from similar tools)
  useEffect(() => {
    const handler = (e: Event) => {
      const slug = (e as CustomEvent).detail?.slug
      if (slug) {
        const tool = allTools.find((t) => t.slug === slug)
        if (tool) setSelectedTool(tool)
      }
    }
    window.addEventListener("sentinel:select-tool", handler)
    return () => window.removeEventListener("sentinel:select-tool", handler)
  }, [allTools])

  const fetchConnectedTools = useCallback(async () => {
    try {
      const data = await getConnectedToolsLive()
      setConnectedSlugs(new Set(data?.tools ?? []))
    } catch { /* endpoint may not be ready */ }
  }, [])

  useEffect(() => { fetchConnectedTools() }, [fetchConnectedTools])
  useEffect(() => { setSearchQuery(""); setActiveCategory("all") }, [activeTab])
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (closeCheckRef.current) clearInterval(closeCheckRef.current)
    }
  }, [])

  useEffect(() => {
    const handler = () => {
      getConnectedToolsLive()
        .then((data) => setConnectedSlugs(new Set(data.tools)))
        .catch(() => {})
    }
    window.addEventListener("sentinel:tool-connected", handler)
    window.addEventListener("sentinel:tool-disconnected", handler)
    return () => {
      window.removeEventListener("sentinel:tool-connected", handler)
      window.removeEventListener("sentinel:tool-disconnected", handler)
    }
  }, [])

  const clearTimers = () => {
    if (pollRef.current) clearInterval(pollRef.current)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (closeCheckRef.current) clearInterval(closeCheckRef.current)
  }

  const handleConnect = async (slug: string) => {
    setLoadingSlug(slug)
    const toolName = allTools.find((t) => t.slug === slug)?.name ?? slug
    try {
      const data = await initiateConnection(slug, `${window.location.origin}/marketplace`)
      if (!data.redirect_url) {
        setConnectedSlugs((prev) => new Set([...prev, slug]))
        setLoadingSlug(null)
        toast.success(`Connected to ${toolName}`)
        invalidateToolCache().catch(() => {})
        postConnectSync().then(() => {
          toast.success("Syncing your data in the background...")
        }).catch(() => {})
        window.dispatchEvent(new CustomEvent("sentinel:tool-connected", { detail: { toolSlug: slug } }))
        return
      }
      // Validate the redirect URL before opening
      if (!isValidConnectionUrl(data.redirect_url)) {
        setLoadingSlug(null)
        toast.error("Invalid connection URL")
        return
      }
      const w = 600, h = 700
      const left = window.screenX + (window.outerWidth - w) / 2
      const top = window.screenY + (window.outerHeight - h) / 2
      const popup = window.open(data.redirect_url, "Connect", `width=${w},height=${h},left=${left},top=${top}`)
      let resolved = false

      pollRef.current = setInterval(async () => {
        if (resolved) return
        const status = await getConnectedToolsLive().catch(() => ({ tools: [] as string[] }))
        if (status.tools.includes(slug)) {
          resolved = true; clearTimers()
          setConnectedSlugs(new Set(status.tools)); setLoadingSlug(null)
          popup?.close(); toast.success(`${toolName} connected!`)
          invalidateToolCache().catch(() => {})
          postConnectSync().then(() => {
            toast.success("Syncing your data in the background...")
          }).catch(() => {})
          window.dispatchEvent(new CustomEvent("sentinel:tool-connected", { detail: { toolSlug: slug } }))
        }
      }, 3000)

      timeoutRef.current = setTimeout(() => {
        if (resolved) return; clearTimers()
        setLoadingSlug(null); toast.error("Connection timed out.")
      }, 120000)

      closeCheckRef.current = setInterval(() => {
        if (popup?.closed) {
          if (closeCheckRef.current) clearInterval(closeCheckRef.current)
          setTimeout(async () => {
            if (resolved) return; resolved = true; clearTimers()
            const s = await getConnectedToolsLive().catch(() => ({ tools: [] as string[] }))
            setConnectedSlugs(new Set(s.tools))
            if (s.tools.includes(slug)) {
              toast.success(`${toolName} connected!`)
              invalidateToolCache().catch(() => {})
              postConnectSync().then(() => {
                toast.success("Syncing your data in the background...")
              }).catch(() => {})
              window.dispatchEvent(new CustomEvent("sentinel:tool-connected", { detail: { toolSlug: slug } }))
            }
            setLoadingSlug(null)
          }, 5000)
        }
      }, 1000)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to connect integration")
      setLoadingSlug(null)
    }
  }

  const handleDisconnect = async (slug: string) => {
    setLoadingSlug(slug)
    const toolName = allTools.find((t) => t.slug === slug)?.name ?? slug
    try {
      await disconnectTool(slug)
      setConnectedSlugs((prev) => { const n = new Set(prev); n.delete(slug); return n })
      toast.success(`Disconnected ${toolName}`)
      invalidateToolCache().catch(() => {})
      window.dispatchEvent(new CustomEvent("sentinel:tool-disconnected", { detail: { toolSlug: slug } }))
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to disconnect")
    } finally { setLoadingSlug(null) }
  }

  const connectedTools = useMemo(
    () => allTools.filter((t) => connectedSlugs.has(t.slug)),
    [allTools, connectedSlugs]
  )
  const connectedCount = connectedTools.length

  // Show only top 5 relevant categories + "Others" for the rest
  const TOP_CATEGORIES = ["email", "developer tools", "productivity", "communication", "project management"]

  const categories = useMemo(() => {
    const source = activeTab === "my-apps" ? connectedTools : allTools
    const allCats = Array.from(new Set(source.map((t) => t.category.toLowerCase())))
    const top = TOP_CATEGORIES.filter((c) => allCats.includes(c))
    const hasOthers = allCats.some((c) => !TOP_CATEGORIES.includes(c))
    return hasOthers ? [...top, "Others"] : top
  }, [activeTab, allTools, connectedTools])

  const categoryCounts = useMemo(() => {
    const source = activeTab === "my-apps" ? connectedTools : allTools
    const c: Record<string, number> = {}
    let othersCount = 0
    for (const tool of source) {
      const cat = tool.category.toLowerCase()
      if (TOP_CATEGORIES.includes(cat)) {
        c[cat] = (c[cat] ?? 0) + 1
      } else {
        othersCount++
      }
    }
    if (othersCount > 0) c["Others"] = othersCount
    return c
  }, [activeTab, allTools, connectedTools])

  const filteredTools = useMemo(() => {
    let source = activeTab === "my-apps" ? connectedTools : allTools
    if (activeCategory !== "all") {
      if (activeCategory === "Others") {
        source = source.filter((t) => !TOP_CATEGORIES.includes(t.category.toLowerCase()))
      } else {
        source = source.filter((t) => t.category.toLowerCase() === activeCategory.toLowerCase())
      }
    }
    if (activeTab === "my-apps" && debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase()
      source = source.filter((t) =>
        t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.category.toLowerCase().includes(q)
      )
    }
    return source
  }, [activeTab, activeCategory, allTools, connectedTools, debouncedSearch])

  const groupedTools = useMemo(() => {
    if (debouncedSearch.trim() || activeCategory !== "all" || activeTab === "my-apps") return null
    const groups: Record<string, ToolDef[]> = {}
    for (const tool of filteredTools) {
      if (!groups[tool.category]) groups[tool.category] = []
      groups[tool.category].push(tool)
    }
    return groups
  }, [filteredTools, debouncedSearch, activeCategory, activeTab])

  const similarTools = useMemo(() => {
    if (!selectedTool) return []
    return allTools
      .filter((t) => t.category === selectedTool.category && t.slug !== selectedTool.slug)
      .slice(0, 6)
  }, [selectedTool, allTools])

  const totalForTab = activeTab === "my-apps" ? connectedCount : totalTools

  const tabClass = (isActive: boolean) =>
    `rounded-full px-4 py-2 text-sm font-medium transition-colors duration-150 ${
      isActive ? "bg-primary text-primary-foreground" : "border border-border bg-card text-muted-foreground hover:text-foreground"
    }`

  return (
    <div className="flex flex-1 flex-col">
      <ScrollArea className="flex-1">
        <main className="flex flex-col gap-6 p-6 lg:p-10">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-foreground">Integrations</h1>
            <p className="mt-1 text-sm text-muted-foreground">Connect your tools to unlock AI-powered insights</p>
          </div>

          {selectedTool ? (
            <ToolDetailView
              tool={selectedTool}
              connected={connectedSlugs.has(selectedTool.slug)}
              isLoading={loadingSlug === selectedTool.slug}
              onBack={() => setSelectedTool(null)}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
              similarTools={similarTools}
            />
          ) : (
            <>
              {/* Tab + Search */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-2">
                  <button onClick={() => setActiveTab("my-apps")} className={tabClass(activeTab === "my-apps")}>
                    My Apps<span className="ml-2 text-xs tabular-nums opacity-70">{connectedCount}</span>
                  </button>
                  <button onClick={() => setActiveTab("all-apps")} className={tabClass(activeTab === "all-apps")}>
                    All Apps<span className="ml-2 text-xs tabular-nums opacity-70">{allTools.length}</span>
                  </button>
                </div>
                <div className="relative w-full sm:max-w-xs">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search integrations..."
                    className="h-9 w-full rounded-lg border border-border bg-card pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors" />
                </div>
              </div>

              {/* Banner (only on All Apps tab, no search) */}
              {activeTab === "all-apps" && !debouncedSearch.trim() && <MarketplaceBanner />}

              {/* Category chips */}
              <CategoryChips categories={categories} active={activeCategory} onChange={setActiveCategory} counts={categoryCounts} />

              {/* Results count */}
              <p className="text-xs text-muted-foreground">
                Showing <span className="font-medium text-foreground tabular-nums">{filteredTools.length}</span> / {totalForTab} integrations
                {isLoading && <Loader2 className="ml-2 inline h-3 w-3 animate-spin" />}
              </p>

              {/* Tool grid */}
              {isLoading && allTools.length === 0 ? (
                <ShimmerGrid />
              ) : groupedTools ? (
                <div className="flex flex-col gap-8">
                  {Object.entries(groupedTools).map(([category, tools]) => (
                    <section key={category} className="flex flex-col gap-3">
                      <h2 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{category}</h2>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {tools.map((tool) => (
                          <ToolCard key={tool.slug} tool={tool} connected={connectedSlugs.has(tool.slug)}
                            isLoading={loadingSlug === tool.slug} onConnect={handleConnect} onDisconnect={handleDisconnect}
                            onClick={() => setSelectedTool(tool)} />
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredTools.map((tool) => (
                    <ToolCard key={tool.slug} tool={tool} connected={connectedSlugs.has(tool.slug)}
                      isLoading={loadingSlug === tool.slug} onConnect={handleConnect} onDisconnect={handleDisconnect}
                      onClick={() => setSelectedTool(tool)} />
                  ))}
                </div>
              )}

              {/* Empty state -- search */}
              {!isLoading && filteredTools.length === 0 && debouncedSearch.trim() !== "" && (
                <div className="flex flex-col items-center gap-3 py-16 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-card">
                    <Search className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground">No integrations found</p>
                  <p className="max-w-xs text-sm text-muted-foreground">Try a different search term or browse by category.</p>
                </div>
              )}

              {/* Empty state -- my-apps */}
              {!isLoading && activeTab === "my-apps" && filteredTools.length === 0 && debouncedSearch.trim() === "" && (
                <div className="flex flex-col items-center gap-3 py-16 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-card">
                    <LinkIcon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground">No apps connected yet</p>
                  <p className="max-w-sm text-sm text-muted-foreground">Browse the marketplace to get started.</p>
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => setActiveTab("all-apps")}>
                    Browse All Apps
                  </Button>
                </div>
              )}

              {/* Data Preview -- engine mapping */}
              <section className="rounded-lg border border-border bg-card p-5 space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-foreground">Data Preview</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">Connected tools power these Sentinel engines</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {ENGINE_MAPPINGS.map(({ engine, icon: Icon, tools, color }) => (
                    <div key={engine} className="flex items-center gap-3 rounded-md border border-border bg-muted/20 px-4 py-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md" style={{ backgroundColor: `${color}15` }}>
                        <Icon className="h-3.5 w-3.5" style={{ color }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-medium text-foreground truncate">{engine}</p>
                        <div className="mt-1 flex items-center gap-1 flex-wrap">
                          <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                          {tools.map((toolName, idx) => {
                            const slug = allTools.find((t) => t.name === toolName)?.slug
                            const isConnected = slug ? connectedSlugs.has(slug) : false
                            return (
                              <span key={toolName} className="flex items-center gap-1">
                                <Badge variant="secondary" className={`text-[9px] px-1.5 py-0 ${isConnected ? "bg-primary/10 text-primary" : "bg-muted/50 text-muted-foreground"}`}>
                                  {toolName}
                                </Badge>
                                {idx < tools.length - 1 && <span className="text-[10px] text-muted-foreground">&middot;</span>}
                              </span>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Footer */}
              <div className="flex items-center justify-center gap-2 py-3 text-[11px] text-muted-foreground">
                <Info className="h-3.5 w-3.5 shrink-0" />
                <span>OAuth tokens are managed securely by Composio -- never stored in Sentinel</span>
              </div>
            </>
          )}
        </main>
      </ScrollArea>
    </div>
  )
}

export default function MarketplacePage() {
  return (
    <ProtectedRoute>
      <MarketplaceContent />
    </ProtectedRoute>
  )
}
