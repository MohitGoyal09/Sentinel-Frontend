"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { toast } from "sonner"

import { ScrollArea } from "@/components/ui/scroll-area"
import { ProtectedRoute } from "@/components/protected-route"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Search,
  MessageSquare,
  Mail,
  Users,
  ClipboardList,
  Zap,
  CheckSquare,
  GitBranch,
  Calendar,
  BarChart3,
  Bell,
  Activity,
  Loader2,
  Info,
  Shield,
  Gem,
  Thermometer,
  Link as LinkIcon,
  ChevronRight,
} from "lucide-react"
import { connectTool, disconnectTool, getConnectedTools } from "@/lib/api"

// ============================================================================
// TYPES
// ============================================================================

type LucideIcon = React.ComponentType<{ className?: string }>

interface ToolDef {
  name: string
  slug: string
  description: string
  category: string
  icon: LucideIcon
}

type CategoryFilter = "all" | string
type TabFilter = "my-apps" | "marketplace"

// ============================================================================
// STATIC TOOL CATALOG
// ============================================================================

const TOOL_CATALOG: ToolDef[] = [
  // Communication
  {
    name: "Slack",
    slug: "slack",
    description: "Team messaging and notifications",
    category: "Communication",
    icon: MessageSquare,
  },
  {
    name: "Gmail",
    slug: "gmail",
    description: "Email integration and alerts",
    category: "Communication",
    icon: Mail,
  },
  {
    name: "Microsoft Teams",
    slug: "msteams",
    description: "Team collaboration",
    category: "Communication",
    icon: Users,
  },
  // Project Management
  {
    name: "Jira",
    slug: "jira",
    description: "Issue tracking and sprints",
    category: "Project Management",
    icon: ClipboardList,
  },
  {
    name: "Linear",
    slug: "linear",
    description: "Modern project management",
    category: "Project Management",
    icon: Zap,
  },
  {
    name: "Asana",
    slug: "asana",
    description: "Task and project tracking",
    category: "Project Management",
    icon: CheckSquare,
  },
  // Developer Tools
  {
    name: "GitHub",
    slug: "github",
    description: "Code repos and PR tracking",
    category: "Developer Tools",
    icon: GitBranch,
  },
  {
    name: "GitLab",
    slug: "gitlab",
    description: "DevOps platform",
    category: "Developer Tools",
    icon: GitBranch,
  },
  {
    name: "Bitbucket",
    slug: "bitbucket",
    description: "Code collaboration",
    category: "Developer Tools",
    icon: GitBranch,
  },
  // Calendar & HR
  {
    name: "Google Calendar",
    slug: "googlecalendar",
    description: "Meeting and schedule sync",
    category: "Calendar & HR",
    icon: Calendar,
  },
  {
    name: "Outlook",
    slug: "outlook",
    description: "Microsoft calendar sync",
    category: "Calendar & HR",
    icon: Calendar,
  },
  {
    name: "BambooHR",
    slug: "bamboohr",
    description: "HR data integration",
    category: "Calendar & HR",
    icon: Users,
  },
  // Analytics
  {
    name: "Google Analytics",
    slug: "googleanalytics",
    description: "Web analytics data",
    category: "Analytics",
    icon: BarChart3,
  },
  {
    name: "PagerDuty",
    slug: "pagerduty",
    description: "Incident management",
    category: "Analytics",
    icon: Bell,
  },
  {
    name: "Datadog",
    slug: "datadog",
    description: "Infrastructure monitoring",
    category: "Analytics",
    icon: Activity,
  },
]

// Tools that are pre-marked as connected for demo purposes
const DEFAULT_CONNECTED = new Set(["slack", "github", "googlecalendar"])

const CATEGORIES = [
  "all",
  "Communication",
  "Project Management",
  "Developer Tools",
  "Calendar & HR",
  "Analytics",
] as const

const ENGINE_MAPPINGS = [
  {
    engine: "Safety Engine",
    icon: Shield,
    tools: ["GitHub", "Slack"],
    color: "hsl(var(--sentinel-critical))",
  },
  {
    engine: "Talent Scout",
    icon: Gem,
    tools: ["GitHub", "Jira"],
    color: "hsl(var(--sentinel-gem))",
  },
  {
    engine: "Culture Engine",
    icon: Thermometer,
    tools: ["Slack", "Google Calendar"],
    color: "hsl(var(--sentinel-critical))",
  },
  {
    engine: "Network Engine",
    icon: LinkIcon,
    tools: ["Slack", "GitHub"],
    color: "hsl(var(--primary))",
  },
]

// ============================================================================
// HOOKS
// ============================================================================

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/** Shimmer loading skeleton */
function ShimmerGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 9 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-lg border border-border bg-card p-5"
        >
          <Skeleton className="h-9 w-9 shrink-0 rounded-md" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-40" />
          </div>
          <Skeleton className="h-7 w-16 shrink-0 rounded-md" />
        </div>
      ))}
    </div>
  )
}

/** Individual tool card — flat row layout per DESIGN.md */
function ToolCard({
  tool,
  connected,
  isLoading,
  onConnect,
  onDisconnect,
}: {
  tool: ToolDef
  connected: boolean
  isLoading: boolean
  onConnect: (slug: string) => void
  onDisconnect: (slug: string) => void
}) {
  const Icon = tool.icon

  const handleAction = () => {
    if (isLoading) return
    if (connected) {
      onDisconnect(tool.slug)
    } else {
      onConnect(tool.slug)
    }
  }

  return (
    <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-5 transition-colors duration-150 hover:border-border/80">
      {/* Icon */}
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-muted/40">
        <Icon className="h-4 w-4 text-foreground" />
      </div>

      {/* Text */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {tool.name}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {tool.description}
        </p>
      </div>

      {/* Action */}
      {connected ? (
        <Badge
          variant="secondary"
          className="shrink-0 cursor-pointer bg-emerald-500/10 px-2.5 py-1 text-[10px] font-medium text-emerald-500 transition-colors hover:bg-red-500/10 hover:text-red-500"
          onClick={handleAction}
          title="Click to disconnect"
        >
          {isLoading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            "Connected"
          )}
        </Badge>
      ) : (
        <button
          onClick={handleAction}
          disabled={isLoading}
          className="shrink-0 rounded-md border border-border px-3 py-1 text-xs font-medium text-muted-foreground transition-colors duration-150 hover:border-primary/50 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            "Connect"
          )}
        </button>
      )}
    </div>
  )
}

/** Category filter chips */
function CategoryChips({
  active,
  onChange,
  counts,
}: {
  active: CategoryFilter
  onChange: (cat: CategoryFilter) => void
  counts: Record<string, number>
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORIES.map((cat) => {
        const isActive = active === cat
        const count = cat === "all" ? undefined : counts[cat]
        return (
          <button
            key={cat}
            onClick={() => onChange(cat)}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors duration-150 ${
              isActive
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-card text-muted-foreground hover:border-border/80 hover:text-foreground"
            }`}
          >
            {cat === "all" ? "All" : cat}
            {count !== undefined && (
              <span
                className={`rounded px-1 text-[10px] tabular-nums ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

// ============================================================================
// PAGE CONTENT
// ============================================================================

function MarketplaceContent() {
  const [connectedSlugs, setConnectedSlugs] = useState<Set<string>>(
    new Set(DEFAULT_CONNECTED)
  )
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabFilter>("marketplace")
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all")
  const [searchQuery, setSearchQuery] = useState("")

  const debouncedSearch = useDebounce(searchQuery, 300)

  // ---- Data fetching ----

  const fetchConnectedTools = useCallback(async () => {
    try {
      const data = (await getConnectedTools()) as Record<string, unknown>
      const slugs: string[] =
        (data?.connected_tools as string[]) ??
        ((data?.data as Record<string, unknown>)?.connected_tools as string[]) ??
        []
      if (slugs.length > 0) {
        setConnectedSlugs(new Set(slugs))
      }
    } catch {
      // Silently handle — backend may not have /tools/connected yet
    } finally {
      setIsInitialLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchConnectedTools()
  }, [fetchConnectedTools])

  // Reset category + search when switching tabs
  useEffect(() => {
    setSearchQuery("")
    setActiveCategory("all")
  }, [activeTab])

  // ---- Handlers ----

  const handleConnect = async (slug: string) => {
    setLoadingSlug(slug)
    const tool = TOOL_CATALOG.find((t) => t.slug === slug)
    try {
      const result = await connectTool(slug)
      const data = result as { redirect_url?: string; success?: boolean }
      if (data?.redirect_url) {
        window.location.href = data.redirect_url
        return
      }
      setConnectedSlugs((prev) => new Set([...prev, slug]))
      toast.success(`Connected to ${tool?.name ?? slug}`)
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to connect integration"
      toast.error(message)
    } finally {
      setLoadingSlug(null)
    }
  }

  const handleDisconnect = async (slug: string) => {
    setLoadingSlug(slug)
    const tool = TOOL_CATALOG.find((t) => t.slug === slug)
    try {
      await disconnectTool(slug)
      setConnectedSlugs((prev) => {
        const next = new Set(prev)
        next.delete(slug)
        return next
      })
      toast.success(`Disconnected ${tool?.name ?? slug}`)
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to disconnect integration"
      toast.error(message)
    } finally {
      setLoadingSlug(null)
    }
  }

  // ---- Category counts ----

  const categoryCounts = useMemo(() => {
    const source =
      activeTab === "my-apps"
        ? TOOL_CATALOG.filter((t) => connectedSlugs.has(t.slug))
        : TOOL_CATALOG
    const counts: Record<string, number> = {}
    for (const tool of source) {
      counts[tool.category] = (counts[tool.category] ?? 0) + 1
    }
    return counts
  }, [activeTab, connectedSlugs])

  // ---- Filtered tools ----

  const filteredTools = useMemo(() => {
    let source =
      activeTab === "my-apps"
        ? TOOL_CATALOG.filter((t) => connectedSlugs.has(t.slug))
        : TOOL_CATALOG

    if (activeCategory !== "all") {
      source = source.filter((t) => t.category === activeCategory)
    }

    if (!debouncedSearch.trim()) return source

    const query = debouncedSearch.toLowerCase()
    return source.filter(
      (t) =>
        t.name.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.category.toLowerCase().includes(query)
    )
  }, [activeTab, activeCategory, connectedSlugs, debouncedSearch])

  // ---- Grouped by category (marketplace tab, no search) ----

  const groupedTools = useMemo(() => {
    if (debouncedSearch.trim() || activeCategory !== "all") return null
    if (activeTab === "my-apps") return null

    const groups: Record<string, ToolDef[]> = {}
    for (const tool of filteredTools) {
      if (!groups[tool.category]) groups[tool.category] = []
      groups[tool.category].push(tool)
    }
    return groups
  }, [filteredTools, debouncedSearch, activeCategory, activeTab])

  const totalForTab =
    activeTab === "my-apps"
      ? TOOL_CATALOG.filter((t) => connectedSlugs.has(t.slug)).length
      : TOOL_CATALOG.length

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="flex flex-1 flex-col">
      <ScrollArea className="flex-1">
        <main className="flex flex-col gap-6 p-6 lg:p-10">

          {/* ---------------------------------------------------------------- */}
          {/* Page header                                                       */}
          {/* ---------------------------------------------------------------- */}
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Marketplace
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Connect your tools to Sentinel
            </p>
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* Tab + Search row                                                  */}
          {/* ---------------------------------------------------------------- */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab("my-apps")}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors duration-150 ${
                  activeTab === "my-apps"
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                My Apps
                <span className="ml-2 text-xs tabular-nums opacity-70">
                  {TOOL_CATALOG.filter((t) => connectedSlugs.has(t.slug)).length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab("marketplace")}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors duration-150 ${
                  activeTab === "marketplace"
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                Marketplace
                <span className="ml-2 text-xs tabular-nums opacity-70">
                  {TOOL_CATALOG.length}
                </span>
              </button>
            </div>

            {/* Search */}
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search integrations..."
                className="h-9 w-full rounded-md border border-border bg-card pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
              />
            </div>
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* Category filter chips                                             */}
          {/* ---------------------------------------------------------------- */}
          <CategoryChips
            active={activeCategory}
            onChange={setActiveCategory}
            counts={categoryCounts}
          />

          {/* ---------------------------------------------------------------- */}
          {/* Results count                                                     */}
          {/* ---------------------------------------------------------------- */}
          <p className="text-xs text-muted-foreground">
            Showing{" "}
            <span className="font-medium text-foreground tabular-nums">
              {filteredTools.length}
            </span>{" "}
            of {totalForTab} integrations
          </p>

          {/* ---------------------------------------------------------------- */}
          {/* Tool grid                                                         */}
          {/* ---------------------------------------------------------------- */}
          {isInitialLoading ? (
            <ShimmerGrid />
          ) : groupedTools ? (
            /* Grouped by category (default marketplace view) */
            <div className="flex flex-col gap-8">
              {Object.entries(groupedTools).map(([category, tools]) => (
                <section key={category} className="flex flex-col gap-3">
                  <h2 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    {category}
                  </h2>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {tools.map((tool) => (
                      <ToolCard
                        key={tool.slug}
                        tool={tool}
                        connected={connectedSlugs.has(tool.slug)}
                        isLoading={loadingSlug === tool.slug}
                        onConnect={handleConnect}
                        onDisconnect={handleDisconnect}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            /* Flat grid (search active, category filtered, or my-apps tab) */
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {filteredTools.map((tool) => (
                <ToolCard
                  key={tool.slug}
                  tool={tool}
                  connected={connectedSlugs.has(tool.slug)}
                  isLoading={loadingSlug === tool.slug}
                  onConnect={handleConnect}
                  onDisconnect={handleDisconnect}
                />
              ))}
            </div>
          )}

          {/* Empty state — search */}
          {!isInitialLoading &&
            filteredTools.length === 0 &&
            debouncedSearch.trim() !== "" && (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-card">
                  <Search className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">
                  No integrations found
                </p>
                <p className="max-w-xs text-xs text-muted-foreground">
                  Try a different search term or browse by category.
                </p>
              </div>
            )}

          {/* Empty state — my-apps, nothing connected */}
          {!isInitialLoading &&
            activeTab === "my-apps" &&
            filteredTools.length === 0 &&
            debouncedSearch.trim() === "" && (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-card">
                  <LinkIcon className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">
                  No apps connected
                </p>
                <p className="max-w-xs text-xs text-muted-foreground">
                  Head to the Marketplace tab to connect your first integration.
                </p>
              </div>
            )}

          {/* ---------------------------------------------------------------- */}
          {/* Data Preview — engine mapping                                     */}
          {/* ---------------------------------------------------------------- */}
          <section className="rounded-lg border border-border bg-card p-5 space-y-4">
            <div>
              <h3 className="text-sm font-medium text-foreground">
                Data Preview
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Connected tools power these Sentinel engines
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {ENGINE_MAPPINGS.map(({ engine, icon: Icon, tools, color }) => (
                <div
                  key={engine}
                  className="flex items-center gap-3 rounded-md border border-border bg-muted/20 px-4 py-3"
                >
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
                    style={{ backgroundColor: `${color}15` }}
                  >
                    <Icon className="h-3.5 w-3.5" style={{ color }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-foreground truncate">
                      {engine}
                    </p>
                    <div className="mt-1 flex items-center gap-1 flex-wrap">
                      <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                      {tools.map((toolName, idx) => {
                        const slug = TOOL_CATALOG.find(
                          (t) => t.name === toolName
                        )?.slug
                        const isConnected = slug
                          ? connectedSlugs.has(slug)
                          : false
                        return (
                          <span key={toolName} className="flex items-center gap-1">
                            <Badge
                              variant="secondary"
                              className={`text-[9px] px-1.5 py-0 ${
                                isConnected
                                  ? "bg-emerald-500/10 text-emerald-500"
                                  : "bg-muted/50 text-muted-foreground"
                              }`}
                            >
                              {toolName}
                            </Badge>
                            {idx < tools.length - 1 && (
                              <span className="text-[10px] text-muted-foreground">
                                ·
                              </span>
                            )}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ---------------------------------------------------------------- */}
          {/* Footer                                                            */}
          {/* ---------------------------------------------------------------- */}
          <div className="flex items-center justify-center gap-2 py-3 text-[11px] text-muted-foreground">
            <Info className="h-3.5 w-3.5 shrink-0" />
            <span>
              OAuth tokens are managed securely by Composio — never stored in
              Sentinel
            </span>
          </div>
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
