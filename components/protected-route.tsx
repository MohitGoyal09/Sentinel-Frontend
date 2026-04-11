'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Spinner } from '@/components/ui/spinner'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: string[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, userRole, loading, roleLoading } = useAuth()
  const router = useRouter()

  const role = userRole?.role ?? null

  useEffect(() => {
    // Wait for both auth and role to finish loading
    if (loading || roleLoading) return

    if (!user) {
      router.push('/login')
    } else if (!role) {
      // User is authenticated but role fetch failed after retries
      router.push('/login')
    } else if (allowedRoles && !allowedRoles.includes(role)) {
      router.push('/dashboard')
    }
  }, [user, userRole, loading, roleLoading, router, allowedRoles, role])

  if (loading || roleLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="h-8 w-8" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user || role === null) {
    return null // Will redirect via useEffect above
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return null // Will redirect to dashboard
  }

  return <>{children}</>
}
