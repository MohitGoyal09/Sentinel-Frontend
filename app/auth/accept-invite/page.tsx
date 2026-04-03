'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Shield, Loader2, AlertCircle, CheckCircle, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { api } from '@/lib/api'
import { createClient } from '@/lib/supabase'

interface AcceptInviteResponse {
  success: boolean
  data: {
    access_token: string
    refresh_token: string
    user_hash: string
    tenant_id: string
    role: string
  }
}

function AcceptInviteContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()

  const token = searchParams.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (mounted && !token) {
      setError('Invalid invite link. Please request a new invitation from your admin.')
    }
  }, [mounted, token])

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8) return 'Password must be at least 8 characters.'
    if (!/[A-Z]/.test(pwd)) return 'Password must contain at least one uppercase letter.'
    if (!/[0-9]/.test(pwd)) return 'Password must contain at least one number.'
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const pwdError = validatePassword(password)
    if (pwdError) {
      setError(pwdError)
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    try {
      const raw = await api.post<AcceptInviteResponse>('/auth/accept-invite', {
        token,
        password,
      })
      const result = raw as AcceptInviteResponse

      await supabase.auth.setSession({
        access_token: result.data.access_token,
        refresh_token: result.data.refresh_token,
      })

      setSuccess(true)
      setTimeout(() => router.push('/dashboard'), 1500)
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { detail?: string } } }
      const httpStatus = axiosErr?.response?.status
      const detail = axiosErr?.response?.data?.detail

      if (httpStatus === 404) {
        setError('This invite link is invalid. Please request a new invitation from your admin.')
      } else if (httpStatus === 409) {
        setError('This invitation has already been accepted. Try signing in instead.')
      } else if (httpStatus === 410) {
        setError('This invite link has expired. Please ask your admin to send a new one.')
      } else {
        setError(detail ?? 'Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-background items-center justify-center px-6 py-12">
      <div
        className={[
          'w-full max-w-sm transition-[opacity,transform] duration-500 ease-out',
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
        ].join(' ')}
      >
        <div className="flex flex-col items-center mb-8">
          <div className="inline-flex h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 items-center justify-center mb-4 shadow-2xl shadow-black/50">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            {success ? 'Welcome to Sentinel' : 'Accept Your Invitation'}
          </h2>
          <p className="text-sm text-muted-foreground mt-1 text-center">
            {success
              ? 'Account created. Redirecting to your dashboard...'
              : 'Create a password to activate your account.'}
          </p>
        </div>

        {success && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/8 border border-green-500/15 text-xs font-medium text-green-500 animate-in fade-in duration-200">
            <CheckCircle className="h-3.5 w-3.5 shrink-0" />
            Account activated! Taking you to your dashboard...
          </div>
        )}

        {error && !success && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/8 border border-destructive/20 text-xs font-medium text-destructive mb-4 animate-in fade-in duration-150">
            <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {!success && token && (
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground/80 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min 8 chars, 1 uppercase, 1 number"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  disabled={loading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-muted border border-white/10 rounded-lg px-4 py-3 pr-11 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/50 transition-[color,background-color,border-color,box-shadow] duration-150 ease-out disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground transition-[color] duration-150 ease-out"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground/80 mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirm-password"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  required
                  disabled={loading}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={[
                    'w-full bg-muted border rounded-lg px-4 py-3 pr-11 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/50 transition-[color,background-color,border-color,box-shadow] duration-150 ease-out disabled:opacity-50 disabled:cursor-not-allowed',
                    confirmPassword && password !== confirmPassword
                      ? 'border-destructive/60 focus:border-destructive/60 focus:ring-destructive/20'
                      : 'border-white/10',
                  ].join(' ')}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground transition-[color] duration-150 ease-out"
                  aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-semibold py-3 rounded-lg text-sm transition-[color,background-color,transform,box-shadow] duration-150 ease-out active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 shadow-2xl shadow-black/50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Activate Account
                  <ArrowRight className="h-4 w-4 transition-transform duration-150 ease-out group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>
        )}

        <p className="mt-8 text-center text-xs text-muted-foreground/40">
          Already have an account?{' '}
          <a href="/login" className="text-primary hover:underline">
            Sign in
          </a>
        </p>
      </div>
    </div>
  )
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    }>
      <AcceptInviteContent />
    </Suspense>
  )
}
