import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Shield, Zap, Heart, Network, Lock, Eye, Sparkles, Users, ArrowUpRight } from "lucide-react"

export function FeaturesBentoGrid() {
  const features = [
    {
      title: "Safety Valve",
      description: "Detect burnout signals 30 days before they manifest using velocity analysis on metadata only.",
      Icon: Shield,
      gradient: "from-red-500/15 to-orange-500/5",
      iconBg: "bg-red-500/10",
      iconColor: "text-red-400",
      stat: "94% accuracy",
      span: "md:col-span-2",
    },
    {
      title: "Talent Scout",
      description: "Network analysis finds hidden gems — high-impact connectors invisible to traditional metrics.",
      Icon: Zap,
      gradient: "from-amber-500/15 to-yellow-500/5",
      iconBg: "bg-amber-500/10",
      iconColor: "text-amber-400",
      stat: "3.2x discovery",
      span: "",
    },
    {
      title: "Culture Thermometer",
      description: "SIR epidemic model tracks resignation contagion across your organization.",
      Icon: Heart,
      gradient: "from-pink-500/15 to-rose-500/5",
      iconBg: "bg-pink-500/10",
      iconColor: "text-pink-400",
      stat: "Real-time",
      span: "",
    },
    {
      title: "Network Engine",
      description: "Visualize collaboration patterns, identify silos, and map knowledge flow across teams.",
      Icon: Network,
      gradient: "from-cyan-500/15 to-blue-500/5",
      iconBg: "bg-cyan-500/10",
      iconColor: "text-cyan-400",
      stat: "Deep insights",
      span: "md:col-span-2",
    },
  ]

  const benefits = [
    { icon: Lock, title: "Privacy by Architecture", description: "Two-vault system. Analytics never sees identity. Math on anonymous hashes, not people." },
    { icon: Eye, title: "Metadata Only", description: "We analyze timestamps, never content. A smoke detector, not a camera." },
    { icon: Sparkles, title: "Deterministic + AI", description: "Math makes the decisions. LLM writes the supportive messages. Nothing inverted." },
    { icon: Users, title: "Employee First", description: "Nudges go to the employee before the manager. Agency always stays with the individual." },
  ]

  return (
    <section id="features" className="py-24 relative overflow-hidden">
      <div className="container px-6 mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 border-primary/20 text-primary bg-primary/5">
            <Sparkles className="w-3 h-3 mr-1" />
            AI-Powered
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">
            Three engines.{" "}
            <span className="text-gradient-primary">One mission.</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Built for managers who care about people, not just metrics.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto mb-20 stagger-children">
          {features.map((feature, index) => (
            <Card
              key={index}
              className={cn(
                "group relative overflow-hidden border-border/50 bg-card/40 backdrop-blur-sm",
                "hover:border-border hover:bg-card/60 transition-all duration-200",
                feature.span
              )}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={cn("p-2.5 rounded-xl", feature.iconBg)}>
                    <feature.Icon className={cn("h-5 w-5", feature.iconColor)} />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full">
                    {feature.stat}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-4xl mx-auto stagger-children">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex gap-4 p-5 rounded-xl border border-border/50 bg-card/30 hover:bg-card/50 transition-colors duration-200">
              <div className="flex-shrink-0 p-2.5 h-fit rounded-lg bg-primary/8">
                <benefit.icon className="h-4.5 w-4.5 text-primary" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-1">{benefit.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
