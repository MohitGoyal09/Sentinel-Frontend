'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { createClient } from '@/lib/supabase'

// Module-scope singleton — prevents infinite re-renders from useEffect [supabase] dependency
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
  // supabase is at module scope (singleton)

  // Fetch user role from backend
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
      } else {
        setUserRole(null)
      }
    } catch (error) {
      setUserRole(null)
    }
  }

  useEffect(() => {
    // onAuthStateChange fires INITIAL_SESSION synchronously on mount,
    // so a separate getSession() call is unnecessary and causes a double-fetch race.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        // Ignore token refresh failures — keep the existing session alive.
        // Only clear state on explicit SIGNED_OUT, not on transient refresh errors.
        if (!newSession && event !== 'SIGNED_OUT' && event !== 'INITIAL_SESSION') {
          setLoading(false)
          return
        }

        // Push access token to API module immediately (before any API calls)
        setCachedAccessToken(newSession?.access_token ?? null)

        setSession(prev => {
          if (prev?.access_token === newSession?.access_token) return prev
          return newSession
        })
        setUser(newSession?.user ?? null)
        if (newSession) {
          await fetchUserRole()
        } else {
          setUserRole(null)
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
    // onAuthStateChange listener will fire, calling fetchUserRole() and setting state
    router.push('/dashboard')
  }

  const signOut = async () => {
    setCachedAccessToken(null)
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
