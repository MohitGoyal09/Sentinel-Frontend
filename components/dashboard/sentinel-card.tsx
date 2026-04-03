"use client"

import { useRouter } from "next/navigation"
import { MessageCircle } from "lucide-react"

interface Insight {
  icon: React.ComponentType<{ className?: string }>
  color: string
  text: string
  sub: string
}

interface SentinelCardProps {
  insights: Insight[]
}

export function SentinelCard({ insights }: SentinelCardProps) {
  const router = useRouter()

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden flex flex-col h-full">
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400/60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          <h3 className="text-base font-medium text-foreground">Sentinel AI</h3>
          <span className="text-[10px] font-medium text-emerald-400 ml-1">Live</span>
        </div>
      </div>

      <div className="flex-1 px-5 space-y-3">
        {insights.map((insight, idx) => (
          <div key={idx} className="flex items-start gap-2.5">
            <insight.icon className={`h-4 w-4 mt-0.5 shrink-0 ${insight.color}`} />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-foreground leading-snug">{insight.text}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{insight.sub}</p>
              <button className="text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors duration-150 mt-1 flex items-center gap-0.5">
                <MessageCircle className="h-3 w-3" />
                Ask Copilot
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="px-5 pb-5 pt-4">
        <button
          onClick={() => router.push("/ask-sentinel")}
          className="w-full rounded-lg px-4 py-2.5 text-sm font-medium text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/10 transition-colors duration-150"
        >
          Open Ask Sentinel
        </button>
      </div>
    </div>
  )
}
