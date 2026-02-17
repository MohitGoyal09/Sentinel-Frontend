"use client"

import { useState } from "react"
import { Search, Sparkles, Loader2, AlertCircle, X, MessageSquare, Bot, Clock, TrendingUp, Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { semanticQuery, type SemanticQueryResponse, type SemanticQueryResult } from "@/lib/api"

const SAMPLE_QUERIES = [
  { label: "Who knows PostgreSQL?", icon: Search },
  { label: "Who is at risk?", icon: AlertCircle },
  { label: "Who works late?", icon: Clock },
  { label: "Who is isolated?", icon: Users },
]

export function AskSentinel() {
  const [query, setQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<SemanticQueryResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setIsLoading(true)
    setError(null)
    try {
      const response = await semanticQuery(query)
      setResults(response)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to execute query"
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSampleQuery = (sampleQuery: string) => {
    setQuery(sampleQuery)
    setResults(null)
    setError(null)
  }

  const handleClear = () => {
    setQuery("")
    setResults(null)
    setError(null)
  }

  const getRiskBadgeColor = (riskLevel: string) => {
    switch (riskLevel?.toUpperCase()) {
      case "CRITICAL":
        return "bg-red-500/10 text-red-500 border-red-500/20"
      case "ELEVATED":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20"
      case "LOW":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
      default:
        return "bg-slate-500/10 text-slate-500 border-slate-500/20"
    }
  }

  return (
    <Card className="border-border bg-card shadow-sm overflow-hidden">
      <CardHeader className="pb-3 border-b bg-gradient-to-r from-purple-500/5 to-indigo-500/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 shadow-lg">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-foreground">
                Ask Sentinel
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Natural language team insights
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] font-semibold bg-purple-500/10 text-purple-500 border-purple-500/20">
              <Sparkles className="mr-1 h-3 w-3" />
              AI
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setShowHistory(!showHistory)}
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex flex-col gap-4 p-4">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder='Try "Who on my team is at risk?"'
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 pr-10 bg-muted/30 border-muted focus:border-purple-500 focus:ring-purple-500/20"
            />
            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {SAMPLE_QUERIES.map((sample, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSampleQuery(sample.label)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs transition-all",
                  query === sample.label
                    ? "bg-purple-500/20 text-purple-600 dark:text-purple-400 ring-1 ring-purple-500/30"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <sample.icon className="mr-1.5 h-3 w-3 inline" />
                {sample.label}
              </button>
            ))}
          </div>

          <Button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="w-full gap-2 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 shadow-lg shadow-purple-500/20"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Ask Sentinel
              </>
            )}
          </Button>
        </form>

        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-sm text-red-500 border border-red-500/20">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {results && (
          <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
            {results.summary && (
              <div className="rounded-lg bg-gradient-to-r from-purple-500/10 to-indigo-500/10 p-4 border border-purple-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  <span className="font-medium text-foreground">AI Summary</span>
                </div>
                <p className="text-sm text-muted-foreground">{results.summary}</p>
              </div>
            )}

            {results.results.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Users className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No results found for your query.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Results ({results.results.length})
                  </p>
                  <Badge variant="outline" className="text-[10px]">
                    <TrendingUp className="mr-1 h-3 w-3" />
                    Ranked
                  </Badge>
                </div>
                {results.results.map((result, index) => (
                  <ResultCard 
                    key={result.user_hash || index} 
                    result={result} 
                    index={index}
                    getRiskBadgeColor={getRiskBadgeColor} 
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ResultCard({
  result,
  index,
  getRiskBadgeColor,
}: {
  result: SemanticQueryResult
  index: number
  getRiskBadgeColor: (riskLevel: string) => string
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 transition-all duration-200 hover:border-purple-500/30 hover:shadow-md hover:shadow-purple-500/5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 text-sm font-medium">
            {result.name ? result.name.charAt(0).toUpperCase() : "?"}
          </div>
          <div>
            <span className="font-medium text-foreground">{result.name || "Unknown User"}</span>
            {result.user_hash && (
              <p className="text-[10px] text-muted-foreground font-mono">
                {result.user_hash.slice(0, 8)}...
              </p>
            )}
          </div>
        </div>
        <Badge variant="outline" className={cn("text-[10px] font-semibold", getRiskBadgeColor(result.risk_level))}>
          {result.risk_level || "UNKNOWN"} risk
        </Badge>
      </div>
      
      {result.insights && result.insights.length > 0 && (
        <ul className="mb-3 flex flex-col gap-2">
          {result.insights.map((insight, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-purple-500" />
              <span>{insight}</span>
            </li>
          ))}
        </ul>
      )}

      {result.suggested_action && (
        <div className="flex items-start gap-2 rounded-md bg-purple-500/10 p-3 text-sm border border-purple-500/20">
          <Sparkles className="h-4 w-4 shrink-0 text-purple-500 mt-0.5" />
          <div>
            <span className="font-medium text-purple-600 dark:text-purple-400">Suggested: </span>
            <span className="text-purple-600/80 dark:text-purple-400/80">
              {result.suggested_action}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
