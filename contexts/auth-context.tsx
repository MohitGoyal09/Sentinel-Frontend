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
  roleLoading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)
  const [roleLoading, setRoleLoading] = useState(false)
  const router = useRouter()

  const roleFetchedRef = useRef(false)
  const isSigningInRef = useRef(false)

  const fetchUserRole = async (retries = 2) => {
    setRoleLoading(true)
    for (let attempt = 0; attempt <= retries; attempt++) {
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
          setRoleLoading(false)
          return
        }
      } catch (error: any) {
        const status = error?.response?.status
        if (status === 401) {
          // Token expired — don't clear role, session refresh will retry
          roleFetchedRef.current = true
          setRoleLoading(false)
          return
        }
        if (attempt < retries) {
          await new Promise(r => setTimeout(r, 1000))
          continue
        }
      }
    }
    roleFetchedRef.current = true
    setRoleLoading(false)
  }

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        // Ignore transient refresh failures (e.g. TOKEN_REFRESHED with null session)
        if (!newSession && event !== 'SIGNED_OUT' && event !== 'INITIAL_SESSION') {
          setLoading(false)
          return
        }

        // Clear stale cookies on initial load with no valid session
        // This prevents repeated "Refresh Token Not Found" errors
        if (!newSession && event === 'INITIAL_SESSION') {
          supabase.auth.signOut().catch(() => {})
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
    // Wait for role to be fetched before navigating
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
    <AuthContext.Provider value={{ user, session, userRole, loading, roleLoading, signIn, signOut }}>
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
