'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { AlertCircle, Loader2, Shield, CheckCircle, Zap, TrendingUp, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { getSSOProviders, initiateSSOLogin, SSOProvider } from '@/lib/sso'
import { createClient } from '@/lib/supabase'
import { toast } from 'sonner'

// ─── Security ────────────────────────────────────────────────────────────────

const ALLOWED_SSO_HOSTS = [
  'accounts.google.com',
  'login.microsoftonline.com',
  'login.windows.net',
]

function safeRedirect(url: string): boolean {
  try {
    const parsed = new URL(url)
    // Check exact match or subdomain match (must be preceded by a dot)
    const allowed = ALLOWED_SSO_HOSTS.some(host =>
      parsed.hostname === host || parsed.hostname.endsWith('.' + host)
    )
    if (!allowed) {
      return false
    }
    window.location.href = url
    return true
  } catch {
    return false
  }
}

// ─── Stat Pill ───────────────────────────────────────────────────────────────

interface StatPillProps {
  icon: React.ReactNode
  label: string
}

function StatPill({ icon, label }: StatPillProps) {
  return (
    <div className="flex items-center gap-2 backdrop-blur-sm bg-white/5 border border-white/10 rounded-full px-4 py-2">
      <span className="text-primary flex-shrink-0">{icon}</span>
      <span className="text-sm font-medium text-foreground/90 whitespace-nowrap">{label}</span>
    </div>
  )
}

// ─── Brand Glyph (pure SVG) ──────────────────────────────────────────────────

function SentinelGlyph({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M10 1L18 5v5c0 4.5-3.5 8-8 9C5.5 18 2 14.5 2 10V5l8-4z"
        fill="currentColor"
        fillOpacity="0.15"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        className="text-primary"
      />
      <path
        d="M10 6l1.5 3.5H15l-2.75 2 1 3.5L10 13l-3.25 2 1-3.5L5 9.5h3.5L10 6z"
        fill="currentColor"
        className="text-primary"
      />
    </svg>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function LoginContent() {
  const { signIn } = useAuth()

  // Form state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState('')
  const [mounted, setMounted] = useState(false)

  // SSO state
  const [ssoProviders, setSsoProviders] = useState<SSOProvider[]>([])
  const [ssoLoading, setSsoLoading] = useState<string | null>(null)

  const searchParams = useSearchParams()

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    const ssoSuccess = searchParams.get('sso')
    const provider = searchParams.get('provider')
    if (ssoSuccess === 'success') {
      setSuccess(`Successfully signed in with ${provider || 'SSO'}. Please sign in with your credentials.`)
    }
  }, [searchParams])

  useEffect(() => {
    getSSOProviders()
      .then(setSsoProviders)
      .catch(() => {}) // SSO providers are optional
  }, [])

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address first')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })
      if (resetError) throw resetError
      toast.success('Password reset email sent. Check your inbox.')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send password reset email'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await signIn(email, password)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid credentials'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleSSOLogin = async (providerName: string) => {
    setSsoLoading(providerName)
    setError(null)
    try {
      const { auth_url } = await initiateSSOLogin(providerName)
      safeRedirect(auth_url)
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { detail?: string } } }
      setError(apiErr?.response?.data?.detail || `Failed to initiate ${providerName} login`)
      setSsoLoading(null)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen bg-background overflow-hidden">

      {/* ── LEFT PANEL — Brand storytelling ─────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col bg-gradient-to-br from-background via-card to-background overflow-hidden">

        {/* Dot-grid background */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: 'radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        {/* Atmospheric glow */}
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-primary/8 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent/6 rounded-full blur-[100px] pointer-events-none" />

        {/* Top-left wordmark */}
        <div className="relative z-10 flex items-center gap-2.5 p-8">
          <SentinelGlyph size={24} />
          <span className="text-2xl font-bold tracking-tight text-foreground">Sentinel</span>
        </div>

        {/* Center content */}
        <div className="relative z-10 flex flex-col justify-center flex-1 px-12 pb-16">
          <div
            className={[
              'transition-[opacity,transform] duration-500 ease-out',
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6',
            ].join(' ')}
          >
            {/* Headline */}
            <div className="mb-6">
              <h1 className="text-4xl font-bold tracking-tight text-foreground leading-tight">
                Know Your Team.
              </h1>
              <h1 className="text-4xl font-bold tracking-tight text-primary leading-tight">
                Before It&apos;s Too Late.
              </h1>
            </div>

            {/* Subtitle */}
            <p className="text-lg text-muted-foreground leading-relaxed max-w-md mb-10">
              AI-powered burnout prediction and workforce intelligence for modern managers.
            </p>

            {/* Stat pills */}
            <div className="flex flex-wrap gap-3">
              <StatPill
                icon={<Shield className="h-3.5 w-3.5" />}
                label="Metadata Only — Zero Content Access"
              />
              <StatPill
                icon={<Zap className="h-3.5 w-3.5" />}
                label="6 Behavioral Signals per Employee"
              />
              <StatPill
                icon={<TrendingUp className="h-3.5 w-3.5" />}
                label="30-Day Trend Analysis"
              />
            </div>
          </div>
        </div>

        {/* Bottom left privacy note */}
        <div className="relative z-10 px-8 pb-8">
          <p className="text-xs text-muted-foreground/40 tracking-wide">
            Privacy-first architecture · Two-vault encryption
          </p>
        </div>
      </div>

      {/* ── RIGHT PANEL — Auth form ──────────────────────────────────────── */}
      <div className="flex flex-1 lg:w-1/2 flex-col items-center justify-center bg-card/50 border-l border-white/5 relative px-6 py-12">

        {/* Mobile ambient glow */}
        <div className="absolute inset-0 lg:hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-primary/6 rounded-full blur-[100px]" />
        </div>

        {/* Form container */}
        <div
          className={[
            'w-full max-w-sm relative z-10 transition-[opacity,transform] duration-500 ease-out',
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
          ].join(' ')}
        >
          {/* Logo mark */}
          <div className="flex flex-col items-center mb-8">
            <div className="inline-flex h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 items-center justify-center mb-4 shadow-2xl shadow-black/50">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Welcome back</h2>
            <p className="text-sm text-muted-foreground mt-1">Sign in to your workspace</p>
          </div>

          {/* Success banner */}
          {success && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/8 border border-green-500/15 text-xs font-medium text-green-500 mb-6 animate-in fade-in slide-in-from-top-2 duration-200">
              <CheckCircle className="h-3.5 w-3.5 shrink-0" />
              {success}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate>
            <div className="space-y-4">

              {/* Email */}
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-200" style={{ animationDelay: '50ms', animationFillMode: 'both' }}>
                <label
                  htmlFor="email"
                  className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground/80 mb-1.5"
                >
                  Work Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  autoComplete="email"
                  required
                  disabled={loading}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={[
                    'w-full bg-muted border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40',
                    'focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/50',
                    'transition-[color,background-color,border-color,box-shadow] duration-150 ease-out',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    error && error.toLowerCase().includes('email')
                      ? 'border-destructive/60 focus:border-destructive/60 focus:ring-destructive/20'
                      : 'border-white/10',
                  ].join(' ')}
                />
              </div>

              {/* Password */}
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-200" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="password"
                    className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/80"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={loading}
                    className="text-sm text-primary hover:text-primary/80 hover:underline transition-[color] duration-150 ease-out disabled:opacity-50"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                    disabled={loading}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={[
                      'w-full bg-muted border rounded-lg px-4 py-3 pr-11 text-sm text-foreground placeholder:text-muted-foreground/40',
                      'focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/50',
                      'transition-[color,background-color,border-color,box-shadow] duration-150 ease-out',
                      'disabled:opacity-50 disabled:cursor-not-allowed',
                      error && error.toLowerCase().includes('password')
                        ? 'border-destructive/60 focus:border-destructive/60 focus:ring-destructive/20'
                        : 'border-white/10',
                    ].join(' ')}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground transition-[color] duration-150 ease-out"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword
                      ? <EyeOff className="h-4 w-4" />
                      : <Eye className="h-4 w-4" />
                    }
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/8 border border-destructive/20 text-xs font-medium text-destructive animate-in fade-in slide-in-from-top-1 duration-150">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit button */}
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-200" style={{ animationDelay: '150ms', animationFillMode: 'both' }}>
                <button
                  type="submit"
                  disabled={loading}
                  className={[
                    'group w-full flex items-center justify-center gap-2',
                    'bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70',
                    'text-white font-semibold py-3 rounded-lg text-sm',
                    'transition-[color,background-color,transform,box-shadow] duration-150 ease-out',
                    'active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100',
                    'shadow-2xl shadow-black/50',
                  ].join(' ')}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="h-4 w-4 transition-transform duration-150 ease-out group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* SSO section */}
          {ssoProviders.length > 0 && (
            <div className="mt-6 animate-in fade-in duration-300" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
              {/* Divider */}
              <div className="relative flex items-center my-6">
                <div className="flex-1 border-t border-white/8" />
                <span className="mx-3 text-[11px] uppercase tracking-widest text-muted-foreground/50 select-none">
                  or
                </span>
                <div className="flex-1 border-t border-white/8" />
              </div>

              {/* SSO buttons */}
              <div className="flex flex-col gap-2.5">
                {ssoProviders.map((provider) => (
                  <button
                    key={provider.name}
                    type="button"
                    onClick={() => handleSSOLogin(provider.name)}
                    disabled={ssoLoading !== null}
                    className={[
                      'w-full flex items-center justify-center gap-2.5',
                      'border border-white/10 bg-transparent hover:bg-white/5',
                      'text-foreground font-medium py-3 rounded-lg text-sm',
                      'transition-[color,background-color,border-color,transform,box-shadow] duration-150 ease-out',
                      'active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
                    ].join(' ')}
                  >
                    {ssoLoading === provider.name ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        {provider.name === 'google' && (
                          <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                          </svg>
                        )}
                        {provider.name === 'azure_ad' && (
                          <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M1 1h10l3.5 8.5L11 23H1V1z" fill="#00A4EF"/>
                            <path d="M15 1h8v22h-8l-3.5-8.5L15 1z" fill="#FFB900"/>
                          </svg>
                        )}
                        {provider.name === 'saml' && (
                          <Shield className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                        )}
                        Sign in with {provider.display_name}
                      </>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bottom note */}
          <p className="mt-8 text-center text-xs text-muted-foreground/40">
            Contact your admin to get access
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
