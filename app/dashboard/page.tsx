"use client"

import { Suspense, useMemo } from "react"
import { AlertTriangle } from "lucide-react"

import { ProtectedRoute } from "@/components/protected-route"
import { AdminView } from "@/components/dashboard/admin-view"
import { ManagerView } from "@/components/dashboard/manager-view"
import { EmployeeView } from "@/components/dashboard/employee-view"
import { useAuth } from "@/contexts/auth-context"
import { useUsers } from "@/hooks/useUsers"
import { useRecentEvents } from "@/hooks/useRecentEvents"
import { mapUsersToEmployees } from "@/lib/map-employees"

// ---------------------------------------------------------------------------
// Dashboard orchestrator — delegates to role-specific views
// ---------------------------------------------------------------------------

function DashboardContent() {
  const { user, userRole } = useAuth()
  const { users, isLoading: usersLoading, error: usersError } = useUsers()
  const { events: recentEvents } = useRecentEvents()

  const isAdmin = userRole?.role === "admin"
  const isManager = userRole?.role === "manager"

  const employees = useMemo(() => mapUsersToEmployees(users), [users])

  const currentEmployee = useMemo(() => {
    if (!userRole?.user_hash) return null
    return employees.find(e => e.user_hash === userRole.user_hash) || null
  }, [employees, userRole?.user_hash])

  const displayName = useMemo(() => {
    const email = user?.email || ""
    const local = email.split("@")[0] || "there"
    return local.charAt(0).toUpperCase() + local.slice(1)
  }, [user?.email])

  const mappedEvents = useMemo(() =>
    recentEvents.map((e) => ({
      timestamp: e.timestamp,
      event_type: e.event_type,
      description: e.description || `Event: ${e.event_type}`,
    })),
    [recentEvents]
  )

  // Loading
  if (usersLoading && users.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
          <p className="text-sm">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  // Error
  if (usersError && users.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <AlertTriangle className="h-8 w-8 text-red-400" />
          <p className="text-sm font-medium text-foreground">Failed to load dashboard data</p>
          <p className="text-xs text-muted-foreground max-w-md text-center">
            {usersError?.message || "Could not fetch data from the engine API."}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="text-xs border border-white/[0.08] rounded-md px-3 py-1.5 hover:bg-white/[0.04] transition-colors duration-150"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (isAdmin) return <AdminView employees={employees} />
  if (isManager) return <ManagerView employees={employees} userName={displayName} />
  return <EmployeeView employee={currentEmployee} events={mappedEvents} />
}

// ---------------------------------------------------------------------------
// Page export
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
          </div>
        }
      >
        <div className="flex flex-1 flex-col h-full bg-background">
          <main className="flex flex-col gap-6 p-6 max-w-[1400px] mx-auto w-full pb-20">
            <DashboardContent />
          </main>
        </div>
      </Suspense>
    </ProtectedRoute>
  )
}
