'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertCircle, Loader2, Shield, Lock, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const { signIn, signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const handleSubmit = async (e: React.FormEvent, action: 'signin' | 'signup') => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      if (action === 'signin') await signIn(email, password)
      else await signUp(email, password)
    } catch (err: any) {
      setError(err.message || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center p-6">
      {/* Ambient gradient */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/6 rounded-full blur-[150px]" />
      </div>

      <div className={`w-full max-w-sm relative z-10 transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 rounded-2xl bg-primary/10 items-center justify-center mb-4">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Welcome to Sentinel</h1>
          <p className="text-sm text-muted-foreground mt-1">Employee insights that respect privacy</p>
        </div>

        {/* Card */}
        <div className="glass-card-elevated rounded-2xl overflow-hidden">
          <Tabs defaultValue="signin" className="w-full">
            <div className="p-1.5 pt-3 mx-4">
              <TabsList className="grid w-full grid-cols-2 bg-muted/30 h-10 rounded-xl p-1">
                <TabsTrigger value="signin" className="rounded-lg text-xs font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all duration-200">
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="signup" className="rounded-lg text-xs font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all duration-200">
                  Sign Up
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="signin" className="mt-0">
              <form onSubmit={(e) => handleSubmit(e, 'signin')}>
                <div className="space-y-4 px-6 pt-4 pb-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/80">
                      Work Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@company.com"
                      className="h-11 bg-background/50 border-border/60 focus:border-primary/50 rounded-xl text-sm transition-all duration-200"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/80">
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        className="h-11 bg-background/50 border-border/60 focus:border-primary/50 rounded-xl pr-10 text-sm transition-all duration-200"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                      />
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/30" />
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/8 border border-destructive/15 text-xs font-medium text-destructive">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      {error}
                    </div>
                  )}
                </div>

                <div className="px-6 pb-6">
                  <Button
                    type="submit"
                    className="w-full h-11 rounded-xl font-medium text-sm group"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        Sign In
                        <ArrowRight className="ml-2 h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-0">
              <form onSubmit={(e) => handleSubmit(e, 'signup')}>
                <div className="space-y-4 px-6 pt-4 pb-6">
                  <div className="space-y-2">
                    <Label htmlFor="reg-email" className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/80">
                      Work Email
                    </Label>
                    <Input
                      id="reg-email"
                      type="email"
                      placeholder="you@company.com"
                      className="h-11 bg-background/50 border-border/60 focus:border-primary/50 rounded-xl text-sm"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-password" className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/80">
                      Password
                    </Label>
                    <Input
                      id="reg-password"
                      type="password"
                      placeholder="Min 8 characters"
                      className="h-11 bg-background/50 border-border/60 focus:border-primary/50 rounded-xl text-sm"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      disabled={loading}
                    />
                  </div>
                  {error && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/8 border border-destructive/15 text-xs font-medium text-destructive">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      {error}
                    </div>
                  )}
                </div>
                <div className="px-6 pb-6">
                  <Button type="submit" className="w-full h-11 rounded-xl font-medium text-sm" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Account'}
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </div>

        <p className="mt-6 text-center text-[11px] text-muted-foreground/40">
          Privacy-first architecture · Two-vault encryption
        </p>
      </div>
    </div>
  )
}
