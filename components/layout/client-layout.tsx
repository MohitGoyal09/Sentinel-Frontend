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
        <SidebarTrigger className="fixed top-3 left-14 z-50 h-7 w-7 rounded-md border border-border bg-card text-muted-foreground hover:text-foreground group-has-data-[state=expanded]/sidebar-wrapper:hidden" />
        {isFullHeight ? (
          <div className="flex flex-1 flex-col min-h-0">{children}</div>
        ) : (
          <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6 overflow-y-auto">{children}</div>
        )}
      </SidebarInset>
    </SidebarProvider>
  )
}
