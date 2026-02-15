'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertCircle, Loader2, Shield, Lock } from 'lucide-react'
import gsap from 'gsap'

export default function LoginPage() {
  const { signIn, signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(cardRef.current, 
        { 
          opacity: 0, 
          y: 20,
          scale: 0.95,
          filter: 'blur(10px)'
        }, 
        { 
          opacity: 1, 
          y: 0, 
          scale: 1,
          filter: 'blur(0px)',
          duration: 1.2, 
          ease: 'expo.out' 
        }
      )
    }
  }, [])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await signIn(email, password)
    } catch (err: any) {
      setError(err.message || 'Access Denied: Invalid credentials')
      // Shake animation on error
      if (cardRef.current) {
        gsap.to(cardRef.current, {
          x: 10,
          duration: 0.1,
          repeat: 5,
          yoyo: true,
          onComplete: () => { gsap.set(cardRef.current, { x: 0 }) }
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await signUp(email, password)
    } catch (err: any) {
      setError(err.message || 'Operation failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-6 selection:bg-primary/30">
      {/* Premium Ambient Background Mesh */}
      <div className="ambient-bg absolute inset-0 -z-10 bg-background" />
      
      {/* Decorative noise/grain overlay */}
      <div className="absolute inset-0 -z-10 opacity-[0.03] pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      <div ref={cardRef} className="w-full max-w-md perspective-1000">
        <Card className="glass-card overflow-hidden border-none shadow-[0_0_50px_rgba(0,0,0,0.3)]">
          <CardHeader className="text-center pb-2 pt-8">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-accent p-0.5 shadow-2xl shadow-primary/20 mb-6 group cursor-default">
              <div className="h-full w-full rounded-[14px] bg-background/80 backdrop-blur-sm flex items-center justify-center transition-transform duration-500 group-hover:scale-105">
                <Shield className="h-8 w-8 text-primary transition-all duration-500 group-hover:drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
              </div>
            </div>
            
            <CardTitle className="text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70 uppercase mb-2">
              Sentinel
            </CardTitle>
            <CardDescription className="text-muted-foreground font-medium text-pretty max-w-[280px] mx-auto text-base">
              Predictive burnout prevention & talent discovery
            </CardDescription>
          </CardHeader>
          
          <Tabs defaultValue="signin" className="w-full">
            <div className="px-8 mb-4">
              <TabsList className="grid w-full grid-cols-2 bg-background/50 border border-white/10 p-1 h-12 rounded-xl">
                <TabsTrigger 
                  value="signin" 
                  className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-300 font-bold uppercase text-xs tracking-widest"
                >
                  Sign In
                </TabsTrigger>
                <TabsTrigger 
                  value="signup" 
                  className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-300 font-bold uppercase text-xs tracking-widest"
                >
                  Sign Up
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="signin" className="mt-0 focus-visible:outline-none">
              <form onSubmit={handleSignIn}>
                <CardContent className="space-y-6 px-10 pt-4">
                  <div className="space-y-3">
                    <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80 pl-1">
                      Work Email
                    </Label>
                    <div className="relative group">
                      <Input
                        id="email"
                        type="email"
                        placeholder="admin@sentinel.local"
                        className="h-12 bg-background/30 border-white/10 focus:border-primary/50 focus:ring-primary/20 rounded-xl px-5 transition-all duration-300 group-hover:border-white/20"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="password" title="password" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80 pl-1">
                      Security Code
                    </Label>
                    <div className="relative group">
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        className="h-12 bg-background/30 border-white/10 focus:border-primary/50 focus:ring-primary/20 rounded-xl px-5 pr-10 transition-all duration-300 group-hover:border-white/20"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                      />
                      <Lock className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground/50 transition-colors" />
                    </div>
                  </div>
                  
                  {error && (
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-xs font-semibold text-destructive animate-in fade-in slide-in-from-top-2 duration-300">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      {error}
                    </div>
                  )}
                </CardContent>
                
                <CardFooter className="px-10 pb-10 pt-2">
                  <Button 
                    type="submit" 
                    className="w-full h-14 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 font-black uppercase tracking-widest text-sm shadow-[0_10px_30px_rgba(34,197,94,0.3)] group overflow-hidden relative"
                    disabled={loading}
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Enter Command Center'}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>
            
            <TabsContent value="signup" className="mt-0 focus-visible:outline-none">
              <form onSubmit={handleSignUp}>
                <CardContent className="space-y-6 px-10 pt-4">
                  <div className="space-y-3">
                    <Label htmlFor="reg-email" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80 pl-1">
                      New Identity (Email)
                    </Label>
                    <Input
                      id="reg-email"
                      type="email"
                      className="h-12 bg-background/30 border-white/10 focus:border-primary/50 rounded-xl px-5"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="reg-password" title="password" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80 pl-1">
                      Passkey
                    </Label>
                    <Input
                      id="reg-password"
                      type="password"
                      className="h-12 bg-background/30 border-white/10 focus:border-primary/50 rounded-xl px-5"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      disabled={loading}
                    />
                  </div>
                  {error && (
                    <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/5 p-3 rounded-lg border border-destructive/10">
                      <AlertCircle className="h-4 w-4" />
                      {error}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="px-10 pb-10 pt-2">
                  <Button type="submit" className="w-full h-14 rounded-2xl bg-accent text-accent-foreground font-black uppercase tracking-widest text-sm" disabled={loading}>
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Initialize Identity'}
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
        
        <p className="mt-8 text-center text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 cursor-default hover:text-muted-foreground/60 transition-colors">
          Security Level: High-Density Encryption
        </p>
      </div>
    </div>
  )
}
