'use client'

import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertCircle, Loader2, Shield, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function LoginPage() {
  const { signIn, signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [shake, setShake] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  // GSAP entrance animation
  useEffect(() => {
    import('gsap').then(({ default: gsap }) => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        if (cardRef.current) {
          gsap.from(cardRef.current, {
            opacity: 0,
            y: 20,
            scale: 0.98,
            duration: 0.5,
            ease: 'power2.out',
          })
        }
        return () => mm.revert()
      })
    })
  }, [])

  // Shake on error
  useEffect(() => {
    if (error) {
      setShake(true)
      const t = setTimeout(() => setShake(false), 500)
      return () => clearTimeout(t)
    }
  }, [error])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await signIn(email, password)
    } catch (err: any) {
      setError(err.message || 'Failed to sign in')
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)
    try {
      await signUp(email, password)
      setMessage('Check your email for the confirmation link!')
    } catch (err: any) {
      setError(err.message || 'Failed to sign up')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card
        ref={cardRef}
        className={cn(
          "glass-card w-full max-w-md rounded-2xl",
          shake && "animate-[shake_0.5s_ease-in-out]"
        )}
        style={shake ? { animation: 'shake 0.4s ease-in-out' } : undefined}
      >
        <CardHeader className="text-center space-y-2">
          <div
            className="mx-auto h-12 w-12 rounded-xl bg-[hsl(var(--primary))]/10 flex items-center justify-center mb-2"
            style={{ boxShadow: '0 0 20px hsl(152 55% 48% / 0.15)' }}
          >
            <Shield className="h-6 w-6 text-[hsl(var(--primary))]" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">Sentinel</CardTitle>
          <CardDescription>
            Predictive burnout prevention & talent discovery
          </CardDescription>
        </CardHeader>

        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mx-4" style={{ width: 'calc(100% - 32px)' }}>
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <form onSubmit={handleSignIn}>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11 rounded-lg border-[var(--glass-border)] bg-[hsl(var(--muted))]/50 transition-all duration-200 focus:border-[hsl(var(--primary))]/50 focus:ring-2 focus:ring-[hsl(var(--primary))]/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 rounded-lg border-[var(--glass-border)] bg-[hsl(var(--muted))]/50 transition-all duration-200 focus:border-[hsl(var(--primary))]/50 focus:ring-2 focus:ring-[hsl(var(--primary))]/20"
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 rounded-lg bg-[hsl(var(--destructive))]/8 px-3 py-2 text-sm text-[hsl(var(--destructive))]">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}
              </CardContent>

              <CardFooter>
                <Button
                  type="submit"
                  className="w-full h-11 rounded-lg text-[14px] font-semibold active:scale-[0.98] transition-transform duration-100"
                  disabled={loading}
                  style={{ boxShadow: '0 0 16px hsl(152 55% 48% / 0.15)' }}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sign In'}
                </Button>
              </CardFooter>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={handleSignUp}>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11 rounded-lg border-[var(--glass-border)] bg-[hsl(var(--muted))]/50 transition-all duration-200 focus:border-[hsl(var(--primary))]/50 focus:ring-2 focus:ring-[hsl(var(--primary))]/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="h-11 rounded-lg border-[var(--glass-border)] bg-[hsl(var(--muted))]/50 transition-all duration-200 focus:border-[hsl(var(--primary))]/50 focus:ring-2 focus:ring-[hsl(var(--primary))]/20"
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 rounded-lg bg-[hsl(var(--destructive))]/8 px-3 py-2 text-sm text-[hsl(var(--destructive))]">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}

                {message && (
                  <div className="rounded-lg bg-[hsl(var(--sentinel-healthy))]/8 px-3 py-2 text-sm text-[hsl(var(--sentinel-healthy))]">
                    {message}
                  </div>
                )}
              </CardContent>

              <CardFooter className="flex-col gap-3">
                <Button
                  type="submit"
                  className="w-full h-11 rounded-lg text-[14px] font-semibold active:scale-[0.98] transition-transform duration-100"
                  disabled={loading}
                  style={{ boxShadow: '0 0 16px hsl(152 55% 48% / 0.15)' }}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Account'}
                </Button>
                <div className="flex items-center gap-1.5 text-muted-foreground/60">
                  <Lock className="h-3 w-3" />
                  <span className="text-[11px]">Two-vault architecture. Data never leaves your custody.</span>
                </div>
              </CardFooter>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  )
}
