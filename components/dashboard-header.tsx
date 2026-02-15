import { Bell, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { UserSummary } from "@/types"

interface DashboardHeaderProps {
  selectedUser: UserSummary | null
  activeView: string
}

const viewLabels: Record<string, string> = {
  dashboard: "Overview",
  "safety-valve": "Safety Valve",
  "talent-scout": "Talent Scout",
  culture: "Culture Thermometer",
  network: "Network Graph",
  simulation: "Simulation",
}

export function DashboardHeader({ selectedUser, activeView }: DashboardHeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 lg:px-8">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-[15px] font-semibold text-foreground">{viewLabels[activeView] || "Dashboard"}</h1>
          {selectedUser && (
            <>
              <span className="text-border">/</span>
              <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
                {selectedUser.user_hash}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
          <Input
            placeholder="Search..."
            className="h-9 w-52 rounded-lg border-border bg-muted/50 pl-9 text-sm placeholder:text-muted-foreground/50 focus-visible:ring-primary/20"
          />
        </div>
        <Button variant="ghost" size="icon" className="relative h-9 w-9 text-muted-foreground hover:text-foreground">
          <Bell className="h-[18px] w-[18px]" />
          <span className="sr-only">Notifications</span>
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[hsl(var(--sentinel-critical))] ring-2 ring-card" />
        </Button>
        <Badge
          variant="outline"
          className="hidden gap-1.5 border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary sm:flex"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          Live
        </Badge>
      </div>
    </header>
  )
}
