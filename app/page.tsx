import { FeaturesBentoGrid } from "@/components/landing-page/features-bento-grid"
import { LandingFooter } from "@/components/landing-page/footer"
import { LandingHero } from "@/components/landing-page/hero"
import { LandingNavbar } from "@/components/landing-page/navbar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Check, Shield, Zap, Heart, Users, Play, Star, ArrowUpRight } from "lucide-react"
import Link from "next/link"

export default function Home() {
  const steps = [
    { number: "01", title: "Connect Tools", description: "GitHub, Slack, Jira — we only see timestamps, never content.", icon: Zap },
    { number: "02", title: "AI Analysis", description: "Velocity regression, entropy, and network centrality on metadata.", icon: Heart },
    { number: "03", title: "Early Detection", description: "Risk scores flag burnout 30 days before it manifests.", icon: Shield },
    { number: "04", title: "Intervene", description: "Supportive nudges to employees first. Managers see anonymized trends.", icon: Users },
  ]

  const testimonials = [
    { name: "Sarah Chen", role: "VP of Engineering", company: "TechCorp", content: "Sentinel caught burnout in 3 team members before it became a problem. We saved months of productivity." },
    { name: "Marcus Johnson", role: "Engineering Manager", company: "StartupXYZ", content: "The hidden talent feature found an incredible engineer who'd been quietly unblocking everyone." },
    { name: "Emily Rodriguez", role: "CTO", company: "ScaleUp Inc", content: "Finally a tool that helps managers care without being invasive. Retention improved 40%." },
  ]

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <LandingNavbar />

      <main className="flex-1 w-full">
        <LandingHero />
        <FeaturesBentoGrid />

        {/* How It Works */}
        <section id="how-it-works" className="py-24 border-y border-border/40">
          <div className="container px-6 mx-auto">
            <div className="text-center mb-14">
              <Badge variant="outline" className="mb-3 border-primary/20 text-primary bg-primary/5">
                How It Works
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                From data to insight in <span className="text-gradient-primary">minutes</span>
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Four simple steps to transform how you understand your team.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto stagger-children">
              {steps.map((step, i) => (
                <div key={i} className="relative">
                  <div className="metric-card h-full">
                    <div className="text-4xl font-bold text-primary/15 mb-3">{step.number}</div>
                    <div className="p-2 rounded-lg bg-primary/8 w-fit mb-3">
                      <step.icon className="h-4 w-4 text-primary" />
                    </div>
                    <h3 className="text-sm font-semibold text-foreground mb-1.5">{step.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>
                  </div>
                  {i < steps.length - 1 && (
                    <ArrowRight className="hidden lg:block absolute -right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/30 h-4 w-4 z-10" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="py-24">
          <div className="container px-6 mx-auto">
            <div className="text-center mb-14">
              <Badge variant="outline" className="mb-3 border-accent/20 text-accent bg-accent/5">
                <Star className="w-3 h-3 mr-1" />
                Loved by Leaders
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                Trusted by engineering teams
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto stagger-children">
              {testimonials.map((t, i) => (
                <div key={i} className="metric-card p-6">
                  <div className="flex items-center gap-0.5 mb-4">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="h-3.5 w-3.5 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-5">&ldquo;{t.content}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold">
                      {t.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">{t.name}</div>
                      <div className="text-[11px] text-muted-foreground">{t.role}, {t.company}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 border-t border-border/40">
          <div className="container px-6 mx-auto text-center">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Ready to see what your data says?
              </h2>
              <p className="text-muted-foreground mb-8">
                Join engineering leaders using Sentinel to build healthier, more productive teams.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/login">
                  <Button size="lg" className="h-11 px-6 rounded-xl font-medium group">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" />
                  </Button>
                </Link>
                <Link href="/demo">
                  <Button size="lg" variant="ghost" className="h-11 px-6 rounded-xl text-muted-foreground hover:text-foreground">
                    <Play className="mr-2 h-4 w-4" />
                    Watch Demo
                  </Button>
                </Link>
              </div>
              <div className="mt-6 flex items-center justify-center gap-4 text-[11px] text-muted-foreground/60">
                <span className="flex items-center gap-1"><Check className="h-3 w-3" />No credit card</span>
                <span className="flex items-center gap-1"><Check className="h-3 w-3" />14-day trial</span>
                <span className="flex items-center gap-1"><Check className="h-3 w-3" />Cancel anytime</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  )
}
