"use client"

import { useState, useRef, useEffect } from "react"
import { Link2, CheckCircle2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { initiateConnection, getConnectedToolsLive, invalidateToolCache } from "@/lib/api"
import { formatToolName } from "@/lib/utils"

// ─── Types ───────────────────────────────────────────────────────────────────

interface ConnectionLinkCardProps {
  toolName: string
  toolSlug: string
  toolLogo?: string
  connectionUrl?: string
  message: string
}

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

// ─── Component ───────────────────────────────────────────────────────────────

export function ConnectionLinkCard({
  toolName,
  toolSlug,
  toolLogo,
  connectionUrl,
  message,
}: ConnectionLinkCardProps) {
  const [status, setStatus] = useState<"idle" | "connecting" | "connected">(
    "idle",
  )

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const popupCheckRef = useRef<NodeJS.Timeout | null>(null)

  // Clean up timers on unmount to prevent leaks
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (popupCheckRef.current) clearInterval(popupCheckRef.current)
    }
  }, [])

  const handleConnect = async () => {
    if (status !== "idle") return
    setStatus("connecting")

    try {
      // If the backend already provided a real OAuth URL, open it directly
      const redirectUrl = connectionUrl || null

      if (redirectUrl) {
        // Validate the URL before opening — block non-HTTPS and unknown domains
        if (!isValidConnectionUrl(redirectUrl)) {
          setStatus("idle")
          toast.error("Invalid connection URL")
          return
        }

        // Open OAuth popup (centered)
        const w = 600
        const h = 700
        const left = window.screenX + (window.outerWidth - w) / 2
        const top = window.screenY + (window.outerHeight - h) / 2
        const popup = window.open(
          redirectUrl,
          "Connect",
          `width=${w},height=${h},left=${left},top=${top}`,
        )

        // The backend is already polling for connection completion.
        // We just need to detect popup close or success from the stream.
        let resolved = false

        // Poll every 3s until tool appears connected (fallback for non-streaming cases)
        const poll = pollIntervalRef.current = setInterval(async () => {
          if (resolved) return
          try {
            const result = await getConnectedToolsLive()
            if (result.tools.includes(toolSlug)) {
              resolved = true
              clearInterval(poll); clearTimeout(timeout); clearInterval(closeCheck)
              setStatus("connected")
              popup?.close()
              toast.success(`${displayName} connected!`)
              invalidateToolCache().catch(() => {})
              window.dispatchEvent(new CustomEvent("sentinel:tool-connected", { detail: { toolSlug } }))
            }
          } catch {
            // Ignore polling errors
          }
        }, 3000)

        // 120s timeout
        const timeout = timeoutRef.current = setTimeout(() => {
          if (resolved) return
          clearInterval(poll); clearInterval(closeCheck)
          setStatus("idle")
          toast.error("Connection timed out. Please try again.")
        }, 120000)

        // Detect popup close — wait 5s then do a final check
        const closeCheck = popupCheckRef.current = setInterval(() => {
          if (popup?.closed) {
            clearInterval(closeCheck)
            setTimeout(async () => {
              if (resolved) return
              resolved = true
              clearInterval(poll); clearTimeout(timeout)
              try {
                const s = await getConnectedToolsLive()
                if (s.tools.includes(toolSlug)) {
                  setStatus("connected")
                  toast.success(`${displayName} connected!`)
                  invalidateToolCache().catch(() => {})
              window.dispatchEvent(new CustomEvent("sentinel:tool-connected", { detail: { toolSlug } }))
                } else {
                  setStatus("idle")
                }
              } catch {
                setStatus("idle")
              }
            }, 5000)
          }
        }, 1000)
      } else {
        // No URL from backend -- fall back to initiateConnection
        const data = await initiateConnection(
          toolSlug,
          window.location.href,
        )

        if (!data.redirect_url) {
          // No-auth toolkit — connected immediately
          setStatus("connected")
          toast.success(`${displayName} connected!`)
          window.dispatchEvent(new CustomEvent("sentinel:tool-connected", { detail: { toolSlug } }))
          return
        }

        // Validate the redirect URL from the API response
        if (!isValidConnectionUrl(data.redirect_url)) {
          setStatus("idle")
          toast.error("Invalid connection URL")
          return
        }

        // Open OAuth popup
        const w = 600
        const h = 700
        const left = window.screenX + (window.outerWidth - w) / 2
        const top = window.screenY + (window.outerHeight - h) / 2
        const popup = window.open(
          data.redirect_url,
          "Connect",
          `width=${w},height=${h},left=${left},top=${top}`,
        )

        let resolved = false

        const poll = pollIntervalRef.current = setInterval(async () => {
          if (resolved) return
          try {
            const result = await getConnectedToolsLive()
            if (result.tools.includes(toolSlug)) {
              resolved = true
              clearInterval(poll); clearTimeout(timeout); clearInterval(closeCheck)
              setStatus("connected")
              popup?.close()
              toast.success(`${displayName} connected!`)
              invalidateToolCache().catch(() => {})
              window.dispatchEvent(new CustomEvent("sentinel:tool-connected", { detail: { toolSlug } }))
            }
          } catch {
            // Ignore polling errors
          }
        }, 3000)

        const timeout = timeoutRef.current = setTimeout(() => {
          if (resolved) return
          clearInterval(poll); clearInterval(closeCheck)
          setStatus("idle")
          toast.error("Connection timed out. Please try again.")
        }, 120000)

        const closeCheck = popupCheckRef.current = setInterval(() => {
          if (popup?.closed) {
            clearInterval(closeCheck)
            setTimeout(async () => {
              if (resolved) return
              resolved = true
              clearInterval(poll); clearTimeout(timeout)
              try {
                const s = await getConnectedToolsLive()
                if (s.tools.includes(toolSlug)) {
                  setStatus("connected")
                  toast.success(`${displayName} connected!`)
                  invalidateToolCache().catch(() => {})
              window.dispatchEvent(new CustomEvent("sentinel:tool-connected", { detail: { toolSlug } }))
                } else {
                  setStatus("idle")
                }
              } catch {
                setStatus("idle")
              }
            }, 5000)
          }
        }, 1000)
      }
    } catch {
      setStatus("idle")
      toast.error(`Failed to connect ${displayName}`)
    }
  }

  const displayName = toolName || formatToolName(toolSlug)
  const logoUrl = toolLogo || `https://logos.composio.dev/api/${toolSlug}`
  const [logoError, setLogoError] = useState(false)

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-1 duration-200">
      <div className="w-full rounded-lg border border-border/50 bg-muted/10 overflow-hidden">
        <div className="flex items-center gap-3 px-3 py-2.5">
          {/* Left: tool logo */}
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted/60 overflow-hidden">
            {status === "connected" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            ) : !logoError ? (
              <img
                src={logoUrl}
                alt={displayName}
                className="h-4 w-4 object-contain"
                onError={() => setLogoError(true)}
              />
            ) : (
              <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </div>

          {/* Center: name + message */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-foreground">
              {displayName}
            </p>
            <p className="truncate text-[11px] text-muted-foreground">{message}</p>
          </div>

          {/* Right: action */}
          <div className="shrink-0">
            {status === "connected" ? (
              <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-500">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Connected
              </div>
            ) : status === "connecting" ? (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin text-primary" />
                Connecting...
              </span>
            ) : (
              <button
                onClick={handleConnect}
                className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors duration-150 hover:border-primary/50 hover:text-primary"
              >
                Connect
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
