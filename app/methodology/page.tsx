"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ProtectedRoute } from "@/components/protected-route"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Activity,
  Brain,
  Network,
  Thermometer,
  Shield,
  ArrowRight,
  Info,
} from "lucide-react"

function MethodologyContent() {
  return (
    <div className="flex flex-1 flex-col h-full bg-background">
      <ScrollArea className="flex-1">
        <main className="flex flex-col gap-6 p-5 lg:p-8 pb-20 max-w-4xl mx-auto">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground mb-1">
              Methodology
            </h1>
            <p className="text-sm text-slate-400">
              How Sentinel detects behavioral pattern changes using mathematical models, not AI opinions.
            </p>
          </div>

          {/* Deterministic Sandwich */}
          <Card className="border-emerald-500/20 bg-emerald-500/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Brain className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-foreground mb-2">The Deterministic Sandwich</h3>
                  <p className="text-sm text-slate-300 mb-3">
                    AI does NOT make decisions. Math makes decisions. AI writes text.
                  </p>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Badge variant="outline" className="border-blue-500/30 text-blue-400">Layer 1: Ingestion</Badge>
                    <ArrowRight className="h-3 w-3" />
                    <Badge variant="outline" className="border-emerald-500/30 text-emerald-400">Layer 2: Math (Deterministic)</Badge>
                    <ArrowRight className="h-3 w-3" />
                    <Badge variant="outline" className="border-purple-500/30 text-purple-400">Layer 3: LLM (Text Only)</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Python validation → NumPy/SciPy analysis → LLM narration. The LLM never sees raw behavioral data.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Engine 1: Safety Valve */}
          <Card className="border-border/50 bg-card/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Activity className="h-4 w-4 text-red-400" />
                Safety Valve — Burnout Detection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-300">
                Detects burnout risk by measuring the <strong>velocity of behavioral change</strong> from
                a personal baseline. A night owl is never flagged for working late. Only a sudden
                shift from their personal pattern triggers an alert.
              </p>

              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                  <h4 className="text-xs font-medium text-emerald-400 uppercase tracking-wider mb-1">Velocity</h4>
                  <p className="text-sm text-slate-300">Linear regression slope on daily activity scores</p>
                  <code className="text-xs text-slate-500 block mt-1">scipy.stats.linregress(days, scores) → slope, r_squared</code>
                  <p className="text-xs text-slate-500 mt-1">R-squared gives confidence. A slope of 3.2 with R²=0.91 means 91% of variance is explained by the trend.</p>
                </div>

                <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                  <h4 className="text-xs font-medium text-emerald-400 uppercase tracking-wider mb-1">Belongingness</h4>
                  <p className="text-sm text-slate-300">Social engagement via reply rate and mention frequency</p>
                  <code className="text-xs text-slate-500 block mt-1">belongingness = (replies + mentions_others) / (2 × total_interactions)</code>
                  <p className="text-xs text-slate-500 mt-1">Measures social connection. Low values indicate withdrawal from team communication.</p>
                </div>

                <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                  <h4 className="text-xs font-medium text-emerald-400 uppercase tracking-wider mb-1">Circadian Entropy</h4>
                  <p className="text-sm text-slate-300">Schedule chaos measured via Shannon entropy</p>
                  <code className="text-xs text-slate-500 block mt-1">H = -Σ(p × log₂(p)) over hourly distribution</code>
                  <p className="text-xs text-slate-500 mt-1">Higher entropy = more scattered work hours. Same formula used in information theory since 1948.</p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                <h4 className="text-xs font-medium text-red-400 uppercase tracking-wider mb-2">Risk Thresholds</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">CRITICAL</Badge>
                    <span className="text-slate-400">velocity &gt; 2.5 AND belongingness &lt; 0.3 AND entropy &gt; 1.5</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">ELEVATED</Badge>
                    <span className="text-slate-400">velocity &gt; 1.5 OR belongingness &lt; 0.4</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">LOW</Badge>
                    <span className="text-slate-400">Everything else</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Engine 2: Talent Scout */}
          <Card className="border-border/50 bg-card/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Network className="h-4 w-4 text-blue-400" />
                Talent Scout — Hidden Gem Discovery
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-300">
                Uses Organizational Network Analysis (NetworkX) to find structurally critical
                people who are invisible to traditional performance metrics.
              </p>

              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                  <h4 className="text-xs font-medium text-blue-400 uppercase tracking-wider mb-1">Betweenness Centrality</h4>
                  <p className="text-sm text-slate-300">Who bridges disconnected teams</p>
                  <code className="text-xs text-slate-500 block mt-1">networkx.betweenness_centrality(G, weight="weight")</code>
                </div>

                <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                  <h4 className="text-xs font-medium text-blue-400 uppercase tracking-wider mb-1">Eigenvector Centrality</h4>
                  <p className="text-sm text-slate-300">Connection quality — are they connected to influential people?</p>
                  <code className="text-xs text-slate-500 block mt-1">networkx.eigenvector_centrality(G, weight="weight")</code>
                </div>

                <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                  <h4 className="text-xs font-medium text-blue-400 uppercase tracking-wider mb-1">Unblocking Score</h4>
                  <p className="text-sm text-slate-300">How often they help others get unstuck</p>
                  <code className="text-xs text-slate-500 block mt-1">weighted_out_degree = Σ(edge_weight) for all outgoing edges</code>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                <h4 className="text-xs font-medium text-blue-400 uppercase tracking-wider mb-2">Hidden Gem Criteria</h4>
                <p className="text-sm text-slate-400">
                  betweenness &gt; 0.3 AND eigenvector &lt; 0.2 AND unblocking &gt; 5
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  High bridge position + low "celebrity" status + frequent helping = someone holding teams together invisibly.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Engine 3: Culture Thermometer */}
          <Card className="border-border/50 bg-card/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Thermometer className="h-4 w-4 text-amber-400" />
                Culture Thermometer — Team Health &amp; Contagion
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-300">
                Adapts the SIR epidemiological model (used to model COVID spread) to detect
                when burnout is spreading across a team like a contagion.
              </p>

              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                  <h4 className="text-xs font-medium text-amber-400 uppercase tracking-wider mb-1">SIR Model</h4>
                  <p className="text-sm text-slate-300">Susceptible → Infected → Recovered differential equations</p>
                  <code className="text-xs text-slate-500 block mt-1">scipy.integrate.odeint(sir_derivatives, [S0, I0, R0], t)</code>
                  <p className="text-xs text-slate-500 mt-1">
                    R₀ (basic reproduction number) predicts whether burnout will spread or die out.
                    R₀ &gt; 1.0 = epidemic growth. R₀ &lt; 1.0 = natural recovery.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                  <h4 className="text-xs font-medium text-amber-400 uppercase tracking-wider mb-1">Communication Decay</h4>
                  <p className="text-sm text-slate-300">Are team interactions declining over time?</p>
                  <code className="text-xs text-slate-500 block mt-1">decay = (interactions_week_2 - interactions_week_1) / interactions_week_2</code>
                </div>

                <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                  <h4 className="text-xs font-medium text-amber-400 uppercase tracking-wider mb-1">Team Fragmentation</h4>
                  <p className="text-sm text-slate-300">Network clustering coefficient — how connected is the team?</p>
                  <code className="text-xs text-slate-500 block mt-1">fragmentation = 1.0 - networkx.average_clustering(G)</code>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Accuracy Statement */}
          <Card className="border-border/50 bg-card/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Info className="h-4 w-4 text-slate-400" />
                About Accuracy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-slate-300">
                <p>
                  Sentinel uses mathematically grounded signal detection, not machine learning prediction.
                  Each metric is computed using standard statistical methods with known mathematical properties.
                </p>
                <p>
                  <strong className="text-foreground">What confidence means:</strong> The R-squared value
                  (0.0 to 1.0) measures how well the linear trend explains the variance in daily activity.
                  R²=0.91 means 91% of the variance is explained by the trend. This is statistical confidence
                  in the trend direction, not prediction accuracy.
                </p>
                <p>
                  <strong className="text-foreground">What we don't claim:</strong> We do not claim to predict
                  burnout with a specific accuracy percentage. We detect pattern changes from personal baselines
                  using deterministic math. The composition of these signals into burnout risk assessment is a
                  hypothesis that requires longitudinal validation with real organizational data.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Privacy Architecture — Interactive Diagram */}
          <Card className="border-border/50 bg-card/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-400" />
                Two-Vault Privacy Architecture
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-300 mb-4">
                Privacy by physics, not policy. Identity resolution is mathematically impossible without the vault key.
              </p>

              {/* Architecture Diagram */}
              <div className="relative p-6 rounded-xl bg-background border border-border/50">
                {/* Data Flow Arrow */}
                <div className="flex flex-col items-center mb-6">
                  <div className="px-4 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm text-blue-400 font-medium">
                    Raw Data (email, timestamp, event)
                  </div>
                  <div className="h-8 w-px bg-gradient-to-b from-blue-500/50 to-emerald-500/50 my-1" />
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Privacy Boundary
                  </div>
                </div>

                {/* HMAC Transform */}
                <div className="flex justify-center mb-6">
                  <div className="px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-center">
                    <div className="text-xs font-medium text-emerald-400 uppercase tracking-wider mb-1">HMAC-SHA256</div>
                    <code className="text-xs text-slate-400">hash = HMAC(email, VAULT_SALT)[:32]</code>
                  </div>
                </div>

                {/* Two Vaults */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Vault A */}
                  <div className="p-4 rounded-xl bg-emerald-500/5 border-2 border-emerald-500/20 relative">
                    <div className="absolute -top-3 left-4 px-2 py-0.5 bg-background text-xs font-semibold text-emerald-400 border border-emerald-500/30 rounded">
                      VAULT A — Analytics
                    </div>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        <span className="text-slate-400">user_hash</span>
                        <span className="text-slate-600 ml-auto font-mono">5db675...</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        <span className="text-slate-400">events</span>
                        <span className="text-slate-600 ml-auto">timestamps only</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        <span className="text-slate-400">risk_scores</span>
                        <span className="text-slate-600 ml-auto">velocity, entropy</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        <span className="text-slate-400">graph_edges</span>
                        <span className="text-slate-600 ml-auto">hash → hash</span>
                      </div>
                      <div className="mt-3 pt-2 border-t border-emerald-500/20">
                        <span className="text-[10px] text-emerald-400/60 uppercase tracking-widest">Zero PII possible</span>
                      </div>
                    </div>
                  </div>

                  {/* Vault B */}
                  <div className="p-4 rounded-xl bg-blue-500/5 border-2 border-blue-500/20 relative">
                    <div className="absolute -top-3 left-4 px-2 py-0.5 bg-background text-xs font-semibold text-blue-400 border border-blue-500/30 rounded">
                      VAULT B — Identity
                    </div>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                        <span className="text-slate-400">user_hash</span>
                        <span className="text-slate-600 ml-auto font-mono">5db675...</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                        <span className="text-slate-400">email_encrypted</span>
                        <span className="text-slate-600 ml-auto font-mono">gAAAAA...</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                        <span className="text-slate-400">consent_flags</span>
                        <span className="text-slate-600 ml-auto">boolean</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                        <span className="text-slate-400">audit_logs</span>
                        <span className="text-slate-600 ml-auto">immutable</span>
                      </div>
                      <div className="mt-3 pt-2 border-t border-blue-500/20">
                        <span className="text-[10px] text-blue-400/60 uppercase tracking-widest">AES-encrypted at rest</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* No FK indicator */}
                <div className="flex justify-center mt-4">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/5 border border-red-500/20">
                    <span className="text-xs text-red-400">✕ No foreign keys between vaults</span>
                  </div>
                </div>

                {/* Attack scenario */}
                <div className="mt-4 p-3 rounded-lg bg-muted/30 border border-border/50">
                  <h4 className="text-xs font-medium text-slate-400 mb-1">If an attacker breaches the database:</h4>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500">
                      <span className="text-emerald-400">Vault A:</span> Anonymous hashes + numerical scores. No names, no emails, no content.
                    </p>
                    <p className="text-xs text-slate-500">
                      <span className="text-blue-400">Vault B:</span> Encrypted blobs. Without the Fernet key, unreadable.
                    </p>
                    <p className="text-xs text-slate-500">
                      <span className="text-red-400">Correlation:</span> Impossible without VAULT_SALT (not stored in DB).
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </ScrollArea>
    </div>
  )
}

export default function MethodologyPage() {
  return (
    <ProtectedRoute>
      <MethodologyContent />
    </ProtectedRoute>
  )
}
