"use client"

import { motion } from "framer-motion"
import { Quote, TrendingUp, Users, Shield } from "lucide-react"

const customEase = [0.32, 0.72, 0, 1] as [number, number, number, number]

const testimonials = [
  {
    quote: "Sentinel's Talent Scout found Emma — a mid-level dev with modest output but the highest betweenness centrality. She bridges Engineering and Design. If she left, four people lose their unblocker.",
    author: "Sarah Chen",
    role: "VP Engineering @ TechFlow",
    metric: "Promoted before leaving",
    metricValue: "100% retention",
    icon: TrendingUp,
    size: "large",
    color: "amber"
  },
  {
    quote: "Jordan was our infrastructure lead — single point of failure. Sentinel flagged his velocity spike 3 weeks before he crashed.",
    author: "Marcus T.",
    role: "Director of Engineering @ Nexus",
    metric: "Avoided 6-month replacement",
    metricValue: "$200K saved",
    icon: Users,
    size: "medium",
    color: "emerald"
  },
  {
    quote: "The two-vault architecture was the selling point. Even a full database breach yields nothing.",
    author: "Emily R.",
    role: "CTO @ ScaleUp Inc.",
    metric: "Zero pushback on rollout",
    metricValue: "Company-wide adoption",
    icon: Shield,
    size: "medium",
    color: "blue"
  },
  {
    quote: "Culture Thermometer flagged correlated burnout across our consulting team before the resignation cascade hit. We rebalanced client assignments and retained the whole team.",
    author: "Arpit R.",
    role: "CIO @ Grant Thornton Bharat",
    metric: "6-person team saved",
    metricValue: "$900K protected",
    icon: Users,
    size: "large",
    color: "rose"
  }
]

export function TestimonialsBento() {
  return (
    <section id="testimonials" className="relative bg-[#050505] py-32 md:py-40 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-white/[0.01] blur-[200px]" />
      </div>

      <div className="max-w-[1400px] mx-auto px-6 md:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 40, filter: "blur(4px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1, ease: customEase }}
          className="flex flex-col items-center text-center mb-16 md:mb-24"
        >
          <div className="mb-6 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08]">
            <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-white/40">
              Customer Stories
            </span>
          </div>
          
          <h2 className="text-[36px] md:text-[56px] font-bold text-white leading-[1.05] tracking-[-0.03em]">
            Real results. Real teams.
          </h2>
        </motion.div>

        {/* Asymmetrical Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {testimonials.map((testimonial, i) => {
            const IconComponent = testimonial.icon
            const isLarge = testimonial.size === "large"
            
            return (
              <motion.div
                key={i}
                initial={{ 
                  opacity: 0, 
                  y: 60, 
                  rotate: i % 2 === 0 ? -2 : 2 
                }}
                whileInView={{ 
                  opacity: 1, 
                  y: 0, 
                  rotate: 0 
                }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ 
                  duration: 1, 
                  delay: i * 0.15, 
                  ease: customEase 
                }}
                className={`group ${isLarge ? 'md:row-span-1' : ''}`}
              >
                {/* Double-bezel container */}
                <div className={`p-[2px] rounded-[2rem] bg-gradient-to-br from-${testimonial.color}-500/15 via-${testimonial.color}-500/5 to-transparent h-full`}>
                  <div className="relative h-full rounded-[calc(2rem-2px)] bg-[#0a0a0a]/90 border border-white/[0.06] p-8 md:p-10 overflow-hidden">
                    {/* Quote icon */}
                    <div className={`absolute top-6 right-6 w-12 h-12 rounded-full bg-${testimonial.color}-500/5 border border-${testimonial.color}-500/10 flex items-center justify-center`}>
                      <Quote className={`w-5 h-5 text-${testimonial.color}-400/40`} />
                    </div>

                    {/* Content */}
                    <div className="relative z-10">
                      {/* Quote text */}
                      <p className={`${isLarge ? 'text-[18px] md:text-[20px]' : 'text-[16px] md:text-[17px]'} text-white/70 leading-relaxed mb-8 font-light`}>
                        "{testimonial.quote}"
                      </p>

                      {/* Author info */}
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-[15px] font-semibold text-white/90 mb-1">
                            {testimonial.author}
                          </div>
                          <div className="text-[13px] text-white/40">
                            {testimonial.role}
                          </div>
                        </div>

                        {/* Metric badge */}
                        <div className="hidden sm:block text-right">
                          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-${testimonial.color}-500/10 border border-${testimonial.color}-500/20`}>
                            <IconComponent className={`w-4 h-4 text-${testimonial.color}-400`} />
                            <div>
                              <div className={`text-[13px] font-semibold text-${testimonial.color}-400`}>
                                {testimonial.metricValue}
                              </div>
                              <div className="text-[10px] text-white/40 tracking-wider uppercase">
                                {testimonial.metric}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Hover gradient */}
                    <div className={`absolute inset-0 bg-gradient-to-t from-${testimonial.color}-500/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none`} />
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
