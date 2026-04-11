'use client'

import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react'
import { createClient } from '@/lib/supabase'

const supabase = createClient()
import { User, Session } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { api, setCachedAccessToken } from '@/lib/api'

interface UserRole {
  user_hash: string
  role: 'employee' | 'manager' | 'admin'
  consent_share_with_manager: boolean
  consent_share_anonymized: boolean
}

interface AuthContextType {
  user: User | null
  session: Session | null
  userRole: UserRole | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const roleFetchedRef = useRef(false)
  const isSigningInRef = useRef(false)

  const fetchUserRole = async () => {
    try {
      const raw = await api.get<any>('/auth/me')
      const response = raw?.data ?? raw

      if (response && response.role) {
        setUserRole({
          user_hash: response.user_hash,
          role: response.role,
          consent_share_with_manager: response.consent_share_with_manager ?? false,
          consent_share_anonymized: response.consent_share_anonymized ?? true,
        } as UserRole)
        roleFetchedRef.current = true
      } else {
        // Only clear role if this isn't a transient network error
        // (role present but no data could mean token expired mid-refresh)
        if (!isSigningInRef.current) {
          // Don't nuke role on transient failures - only clear on explicit sign out
          // The ProtectedRoute will handle redirect when user becomes null
        }
        roleFetchedRef.current = true
      }
    } catch (error: any) {
      // On 401 during token refresh, DON'T clear the existing role.
      // Supabase token refresh can cause a brief window where the old token
      // is invalid but the new one hasn't been set yet. The onAuthStateChange
      // will fire again with the new token and re-fetch the role.
      const status = error?.response?.status
      if (status === 401) {
        // Token expired or invalid - don't clear role yet.
        // The session refresh will trigger a new onAuthStateChange event
        // which will re-set the token and retry fetchUserRole.
        // Only clear role if we get explicit SIGNED_OUT event.
        console.warn('Auth/me returned 401, keeping existing role until session refreshes')
        roleFetchedRef.current = true
        return
      }
      // For other errors (network, etc.), keep existing role
      roleFetchedRef.current = true
    }
  }

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        // Ignore transient refresh failures
        if (!newSession && event !== 'SIGNED_OUT' && event !== 'INITIAL_SESSION') {
          setLoading(false)
          return
        }

        // Push access token to API module immediately
        setCachedAccessToken(newSession?.access_token ?? null)

        setSession(prev => {
          if (prev?.access_token === newSession?.access_token) return prev
          return newSession
        })
        setUser(newSession?.user ?? null)

        if (newSession) {
          roleFetchedRef.current = false
          await fetchUserRole()
        } else {
          // Only clear role on explicit sign out
          setUserRole(null)
          roleFetchedRef.current = true
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      const errorMap: Record<string, string> = {
        'Invalid login credentials': 'Invalid email or password. Please try again.',
        'Email not confirmed': 'Please verify your email before signing in.',
        'Too many requests': 'Too many login attempts. Please wait a few minutes.',
      }
      throw new Error(errorMap[error.message] || error.message)
    }
    isSigningInRef.current = true
    // Wait for role to be fetched
    await new Promise<void>((resolve) => {
      const checkRole = () => {
        if (roleFetchedRef.current) {
          setTimeout(resolve, 150)
        } else {
          setTimeout(checkRole, 50)
        }
      }
      setTimeout(checkRole, 100)
    })
    isSigningInRef.current = false
    router.push('/dashboard')
  }

  const signOut = async () => {
    setCachedAccessToken(null)
    roleFetchedRef.current = false
    setUserRole(null)
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <AuthContext.Provider value={{ user, session, userRole, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}