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
    { number: "01", title: "Connect Sources", description: "GitHub, Slack, Calendar, Jira. We ingest timestamps, file counts, and reply patterns. Never message content.", icon: Zap },
    { number: "02", title: "Mathematical Analysis", description: "Linear regression for velocity. Shannon entropy for schedule chaos. NetworkX for team structure. Deterministic math, not AI opinion.", icon: Heart },
    { number: "03", title: "Pattern Detection", description: "We measure the velocity of change from personal baselines. A night owl working late is normal. A day worker suddenly at midnight is a signal.", icon: Shield },
    { number: "04", title: "Supportive Action", description: "Employees see their own wellbeing first. Managers see anonymized team trends. Identity reveal requires consent and audit logging.", icon: Users },
  ]

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <LandingNavbar />

      <main className="flex-1 w-full">
        <LandingHero />

        {/* Problem Statement */}
        <section className="py-20 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-sm font-medium text-primary uppercase tracking-wider mb-3">The Problem</p>
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Burnout is detected 6 months too late
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                76% of employees experience burnout. Current detection happens in exit interviews,
                quarterly surveys, and resignation letters. By then, it costs $150K-$300K per engineer to replace.
              </p>
            </div>

            {/* Comparison Table */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              <div className="p-6 rounded-lg bg-muted/30 border border-border/50">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Current Approach</h3>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2"><span className="text-destructive mt-0.5">✕</span> Exit interviews (too late)</li>
                  <li className="flex items-start gap-2"><span className="text-destructive mt-0.5">✕</span> Quarterly surveys (snapshot, not trend)</li>
                  <li className="flex items-start gap-2"><span className="text-destructive mt-0.5">✕</span> Content surveillance (illegal in EU, destroys trust)</li>
                  <li className="flex items-start gap-2"><span className="text-destructive mt-0.5">✕</span> Manager intuition (biased, inconsistent)</li>
                </ul>
              </div>
              <div className="p-6 rounded-lg bg-primary/5 border border-primary/20">
                <h3 className="text-sm font-medium text-primary uppercase tracking-wider mb-4">Sentinel</h3>
                <ul className="space-y-3 text-sm text-foreground/80">
                  <li className="flex items-start gap-2"><span className="text-primary mt-0.5">✓</span> Continuous behavioral monitoring (daily signals)</li>
                  <li className="flex items-start gap-2"><span className="text-primary mt-0.5">✓</span> 30-day trend analysis (pattern changes over time)</li>
                  <li className="flex items-start gap-2"><span className="text-primary mt-0.5">✓</span> Metadata only (timestamps, not content)</li>
                  <li className="flex items-start gap-2"><span className="text-primary mt-0.5">✓</span> Mathematical models (deterministic, auditable)</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <FeaturesBentoGrid />

        {/* How It Works */}
        <section id="how-it-works" className="py-24 border-y border-border/40">
          <div className="container px-6 mx-auto">
            <div className="text-center mb-14">
              <Badge variant="outline" className="mb-3 border-primary/20 text-primary bg-primary/5">
                How It Works
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                From data to insight in <span className="text-primary">minutes</span>
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

        {/* Real-World Scenarios */}
        <section className="py-20 px-6 bg-muted/20">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-sm font-medium text-primary uppercase tracking-wider mb-3">Real-World Impact</p>
              <h2 className="text-3xl font-bold text-foreground mb-4">
                What Sentinel catches that humans miss
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-lg border border-border/50 bg-card/50">
                <div className="text-xs font-medium text-destructive uppercase tracking-wider mb-2">Safety Valve Detection</div>
                <p className="text-sm text-foreground font-medium mb-2">Senior dev starts committing at 2 AM</p>
                <p className="text-sm text-muted-foreground">
                  Velocity trending from 1.5 to 3.2 over 3 weeks. Slack replies dropped from 15/day to 3.
                  Entropy jumped above 1.5. The pattern says burnout — 30 days before anyone notices.
                </p>
              </div>

              <div className="p-6 rounded-lg border border-border/50 bg-card/50">
                <div className="text-xs font-medium text-primary uppercase tracking-wider mb-2">Talent Scout Discovery</div>
                <p className="text-sm text-foreground font-medium mb-2">Quiet IC bridges two disconnected teams</p>
                <p className="text-sm text-muted-foreground">
                  Betweenness centrality 0.85 but eigenvector only 0.15. She reviews PRs across Engineering and Design.
                  22 unblocking events last month. Traditional metrics show nothing special.
                </p>
              </div>

              <div className="p-6 rounded-lg border border-border/50 bg-card/50">
                <div className="text-xs font-medium text-amber-500 uppercase tracking-wider mb-2">Culture Thermometer Alert</div>
                <p className="text-sm text-foreground font-medium mb-2">Burnout spreading across Engineering</p>
                <p className="text-sm text-muted-foreground">
                  SIR model detects R&#x2080; = 1.96 — epidemic growth. Two team members CRITICAL, average velocity
                  above threshold. Communication decay measured at 35% decline over 2 weeks.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Privacy Architecture */}
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-sm font-medium text-primary uppercase tracking-wider mb-3">Privacy Architecture</p>
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Privacy by physics, not policy
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Two separate database vaults with no foreign key constraints between them.
              Even a full breach yields only anonymous hashes and encrypted blobs.
            </p>
            <div className="grid grid-cols-2 gap-6 max-w-2xl mx-auto">
              <div className="p-6 rounded-lg bg-primary/5 border border-primary/20 text-left">
                <h3 className="text-sm font-semibold text-primary mb-2">Vault A — Analytics</h3>
                <p className="text-sm text-muted-foreground">Anonymous hashes, event timestamps, computed scores. Zero PII. Cannot identify anyone.</p>
              </div>
              <div className="p-6 rounded-lg bg-muted/30 border border-border/50 text-left">
                <h3 className="text-sm font-semibold text-foreground mb-2">Vault B — Identity</h3>
                <p className="text-sm text-muted-foreground">AES-encrypted emails, consent flags, RBAC data. Without the Fernet key, unreadable.</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground/60 mt-4">HMAC-SHA256 links vaults. Vault key never stored in database.</p>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 border-t border-border/40">
          <div className="container px-6 mx-auto text-center">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                See Sentinel in action
              </h2>
              <p className="text-muted-foreground mb-8">
                Explore the interactive demo to see how behavioral metadata becomes actionable insight.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/onboarding">
                  <Button size="lg" className="h-11 px-6 rounded-xl font-medium group">
                    Try Interactive Demo
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="h-11 px-6 rounded-xl">
                    Sign In
                  </Button>
                </Link>
              </div>
              <div className="mt-6 flex items-center justify-center gap-4 text-[11px] text-muted-foreground/60">
                <span className="flex items-center gap-1"><Check className="h-3 w-3" />Metadata only</span>
                <span className="flex items-center gap-1"><Check className="h-3 w-3" />Two-vault encryption</span>
                <span className="flex items-center gap-1"><Check className="h-3 w-3" />GDPR & DPDPA compliant</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  )
}
