"use client"

import { motion } from "framer-motion"
import { Check, Sparkles, Zap, Building2 } from "lucide-react"
import { TiltCard } from "./tilt-card"
import Link from "next/link"

const customEase = [0.32, 0.72, 0, 1] as [number, number, number, number]

const plans = [
  {
    name: "Starter",
    price: "$4",
    period: "/employee/month",
    description: "Perfect for teams up to 50 employees",
    icon: Sparkles,
    color: "emerald",
    features: [
      "Safety Valve burnout detection",
      "Basic risk scoring",
      "Slack & GitHub integration",
      "Employee self-service dashboard",
      "Email support",
    ],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    name: "Professional",
    price: "$8",
    period: "/employee/month",
    description: "For growing companies with 50-500 employees",
    icon: Zap,
    color: "amber",
    features: [
      "All Starter features",
      "Talent Scout network analysis",
      "Culture Thermometer team health",
      "Advanced risk forecasting",
      "Priority support",
      "API access",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "$15",
    period: "/employee/month",
    description: "For organizations with 500+ employees",
    icon: Building2,
    color: "blue",
    features: [
      "All Professional features",
      "Custom integrations",
      "Dedicated success manager",
      "SSO & advanced security",
      "Custom risk thresholds",
      "On-premise deployment option",
      "SLA guarantee",
    ],
    cta: "Contact Sales",
    popular: false,
  },
]

export function PricingSection() {
  return (
    <section id="pricing" className="relative bg-[#050505] py-24 md:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-emerald-500/[0.03] blur-[150px]" />
      </div>

      <div className="relative max-w-[1200px] mx-auto px-6 md:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: customEase }}
          className="text-center mb-12 md:mb-16"
        >
          <div className="inline-block px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] mb-4">
            <span className="text-[10px] font-semibold tracking-wider text-white/40 uppercase">Pricing</span>
          </div>
          <h2 className="text-[32px] md:text-[48px] font-bold text-white leading-[1.1] tracking-tight">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-[16px] text-white/40 max-w-lg mx-auto">
            Pay per employee. No hidden fees. Cancel anytime.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: customEase }}
              className={`relative ${plan.popular ? 'md:-mt-4 md:mb-4' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <div className="px-3 py-1 rounded-full bg-amber-500 text-[11px] font-semibold text-black uppercase tracking-wider">
                    Most Popular
                  </div>
                </div>
              )}

              <TiltCard intensity={plan.popular ? 8 : 5} className="h-full">
                <div className={`h-full p-6 rounded-2xl border ${
                  plan.popular 
                    ? 'bg-[#0a0a0a] border-amber-500/30 shadow-[0_0_40px_rgba(245,158,11,0.1)]' 
                    : 'bg-[#0a0a0a]/50 border-white/[0.06]'
                }`}>
                  {/* Plan header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-xl bg-${plan.color}-500/10 border border-${plan.color}-500/20 flex items-center justify-center`}>
                      <plan.icon className={`w-5 h-5 text-${plan.color}-400`} />
                    </div>
                    <div>
                      <h3 className="text-[18px] font-semibold text-white">{plan.name}</h3>
                    </div>
                  </div>

                  <p className="text-[13px] text-white/40 mb-6">{plan.description}</p>

                  {/* Price */}
                  <div className="mb-6">
                    <span className={`text-[40px] md:text-[48px] font-bold ${plan.popular ? 'text-amber-400' : 'text-white'}`}>
                      {plan.price}
                    </span>
                    <span className="text-[14px] text-white/40">{plan.period}</span>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, j) => (
                      <li key={j} className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded-full bg-${plan.color}-500/10 flex items-center justify-center shrink-0 mt-0.5`}>
                          <Check className={`w-3 h-3 text-${plan.color}-400`} />
                        </div>
                        <span className="text-[14px] text-white/60">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Link href="/login">
                    <button className={`w-full py-3 rounded-xl font-medium transition-all duration-300 ${
                      plan.popular
                        ? 'bg-amber-500 text-black hover:bg-amber-400'
                        : 'bg-white/[0.05] text-white border border-white/[0.1] hover:bg-white/[0.1]'
                    }`}>
                      {plan.cta}
                    </button>
                  </Link>
                </div>
              </TiltCard>
            </motion.div>
          ))}
        </div>

        {/* Enterprise note */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 text-center"
        >
          <p className="text-[14px] text-white/40">
            Need a custom solution?{" "}
            <Link href="/contact" className="text-emerald-400 hover:text-emerald-300 transition-colors">
              Contact our sales team
            </Link>
          </p>
        </motion.div>
      </div>
    </section>
  )
}
