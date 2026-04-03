"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { MessageCircle, Search, Clock, ArrowLeft, MessageSquarePlus, Star } from "lucide-react"
import { ProtectedRoute } from "@/components/protected-route"
import { useChatHistory, ChatSessionSummary } from "@/hooks/useChatHistory"
import { cn } from "@/lib/utils"

function formatRelative(iso: string | null): string {
  if (!iso) return "unknown"
  try {
    const date = new Date(iso)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  } catch {
    return iso
  }
}

function SessionCard({ session }: { session: ChatSessionSummary }) {
  return (
    <Link
      href={`/ask-sentinel?session=${session.id}`}
      className={cn(
        "flex flex-col gap-1.5 p-4 rounded-xl border border-border",
        "hover:border-primary/30 hover:bg-primary/5 transition-all duration-150",
        "group"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium text-foreground group-hover:text-primary truncate">
          {session.title}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          {session.is_favorite && (
            <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
          )}
          <span className="text-[10px] text-muted-foreground/50 flex items-center gap-1 pt-0.5">
            <Clock className="h-3 w-3" />
            {formatRelative(session.updated_at)}
          </span>
        </div>
      </div>
    </Link>
  )
}

function HistoryContent() {
  const [search, setSearch] = useState("")
  const { sessions, isLoading, error, refetch } = useChatHistory({ limit: 100 })

  const filtered = useMemo(() => {
    if (!search.trim()) return sessions
    const lower = search.toLowerCase()
    return sessions.filter((s) => s.title.toLowerCase().includes(lower))
  }, [sessions, search])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background/90 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link
            href="/ask-sentinel"
            className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-all duration-150 shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-2.5 flex-1">
            <MessageCircle className="h-5 w-5 text-accent" />
            <h1 className="font-bold text-base text-foreground">Chat History</h1>
          </div>
          <Link
            href="/ask-sentinel"
            className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          >
            <MessageSquarePlus className="h-3.5 w-3.5" />
            New chat
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="max-w-3xl mx-auto px-6 py-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
          <input
            type="text"
            placeholder="Search sessions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/40 transition-colors"
          />
        </div>
      </div>

      {/* Session list */}
      <div className="max-w-3xl mx-auto px-6 pb-16">
        {isLoading && (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-xl border border-border bg-card/50 animate-pulse" />
            ))}
          </div>
        )}

        {error && !isLoading && (
          <div className="text-center py-16">
            <p className="text-sm text-muted-foreground mb-3">Failed to load chat history.</p>
            <button
              onClick={refetch}
              className="text-xs text-primary hover:underline"
            >
              Try again
            </button>
          </div>
        )}

        {!isLoading && !error && filtered.length === 0 && (
          <div className="text-center py-16">
            <MessageCircle className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {search ? "No sessions match your search." : "No sessions yet."}
            </p>
            {!search && (
              <Link
                href="/ask-sentinel"
                className="inline-block mt-3 text-xs text-primary hover:underline"
              >
                Start your first conversation
              </Link>
            )}
          </div>
        )}

        {!isLoading && !error && filtered.length > 0 && (
          <div className="flex flex-col gap-3">
            {filtered.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function HistoryPage() {
  return (
    <ProtectedRoute>
      <HistoryContent />
    </ProtectedRoute>
  )
}
