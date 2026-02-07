"use client"

import { EyeOff, Lock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function VaultStatus({ eventCount, userCount }: { eventCount?: number; userCount?: number }) {
  const users = userCount || 6
  const events = eventCount || 1248
  const resolutions = Math.floor(users * 0.5)

  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-foreground">Two-Vault Architecture</CardTitle>
          <Badge
            variant="outline"
            className="border-primary/20 bg-primary/6 text-[10px] font-medium text-primary"
          >
            <Lock className="mr-1 h-2.5 w-2.5" />
            Secure
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {/* Vault A */}
        <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--sentinel-info))]/8">
            <EyeOff className="h-4 w-4 text-[hsl(var(--sentinel-info))]" />
          </div>
          <div className="flex-1">
            <div className="mb-1 flex items-center gap-2">
              <p className="text-[13px] font-semibold text-foreground">Vault A - Analytics</p>
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Blind to identity. Stores only user_hash + behavioral timestamps. No names, no emails,
              no message content.
            </p>
            <div className="mt-2 flex items-center gap-4">
              <span className="text-xs text-muted-foreground">
                <span className="font-mono font-semibold text-foreground">{events.toLocaleString()}</span> events
              </span>
              <span className="text-xs text-muted-foreground">
                <span className="font-mono font-semibold text-foreground">{users}</span> hashes
              </span>
            </div>
          </div>
        </div>

        {/* Vault B */}
        <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--sentinel-elevated))]/8">
            <Lock className="h-4 w-4 text-[hsl(var(--sentinel-elevated))]" />
          </div>
          <div className="flex-1">
            <div className="mb-1 flex items-center gap-2">
              <p className="text-[13px] font-semibold text-foreground">Vault B - Identity</p>
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Encrypted identity mapping. AES-256 encrypted emails. Only resolved for high-priority
              nudges. Full audit trail.
            </p>
            <div className="mt-2 flex items-center gap-4">
              <span className="text-xs text-muted-foreground">
                <span className="font-mono font-semibold text-foreground">{users}</span> identities
              </span>
              <span className="text-xs text-muted-foreground">
                <span className="font-mono font-semibold text-foreground">{resolutions}</span> resolutions
              </span>
            </div>
          </div>
        </div>

        {/* Handoff Protocol */}
        <div className="rounded-lg border border-[hsl(var(--sentinel-info))]/10 bg-[hsl(var(--sentinel-info))]/4 p-4">
          <p className="mb-2 text-xs font-semibold text-foreground">Handoff Protocol</p>
          <div className="flex flex-col gap-1.5">
            {[
              "Vault A detects pattern on anonymous hash",
              "Vault A sends {hash + message} to Vault B",
              "Vault B decrypts email, delivers nudge",
              "Vault A never learns user identity",
            ].map((step, i) => (
              <div key={`step-${i}`} className="flex items-start gap-2.5">
                <span className="shrink-0 font-mono text-[11px] font-bold text-[hsl(var(--sentinel-info))]">
                  {i + 1}.
                </span>
                <span className="text-xs text-muted-foreground">{step}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
