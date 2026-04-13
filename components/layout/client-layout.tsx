"use client"

import React, { useCallback } from "react"
import { usePathname, useRouter } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { CommandPalette } from "@/components/command-palette"
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar"

const NO_SIDEBAR_PATHS = new Set(["/", "/login", "/register"])
const FULL_HEIGHT_PATHS = new Set(["/ask-sentinel"])

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  const handleCommandNavigate = useCallback(
    (view: string) => {
      const directRoutes = [
        "data-ingestion",
        "me",
        "team",
        "admin",
        "ask-sentinel",
      ]
      if (directRoutes.includes(view)) {
        router.push(`/${view}`)
      } else if (view.startsWith("engines/") || view.startsWith("/engines/")) {
        router.push(view.startsWith("/") ? view : `/${view}`)
      } else {
        router.push(`/dashboard?view=${view}`)
      }
    },
    [router],
  )

  if (NO_SIDEBAR_PATHS.has(pathname)) {
    return <>{children}</>
  }

  const isFullHeight = FULL_HEIGHT_PATHS.has(pathname)

  return (
    <SidebarProvider>
      <CommandPalette onNavigate={handleCommandNavigate} />
      <AppSidebar variant="inset" />
      <SidebarInset>
        <div className="flex items-center gap-2 p-3 md:hidden border-b border-border">
          <SidebarTrigger />
          <span className="text-sm font-semibold text-foreground">Sentinel</span>
        </div>
        {isFullHeight ? (
          <div className="flex flex-1 flex-col min-h-0 overflow-hidden">{children}</div>
        ) : (
          <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6 overflow-y-auto">{children}</div>
        )}
      </SidebarInset>
    </SidebarProvider>
  )
}
