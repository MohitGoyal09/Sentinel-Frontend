"use client"

import { motion } from "framer-motion"
import { 
  Github, 
  MessageSquare, 
  Trello, 
  Calendar,
  Mail,
  GitPullRequest,
  Clock,
  BarChart3,
  Shield
} from "lucide-react"

const customEase = [0.32, 0.72, 0, 1] as [number, number, number, number]

const integrations = [
  { name: "GitHub", icon: Github, category: "Code", color: "white" },
  { name: "Slack", icon: MessageSquare, category: "Communication", color: "emerald" },
  { name: "Jira", icon: Trello, category: "Project", color: "blue" },
  { name: "Google Calendar", icon: Calendar, category: "Calendar", color: "amber" },
  { name: "Outlook", icon: Mail, category: "Email", color: "blue" },
  { name: "GitLab", icon: GitPullRequest, category: "Code", color: "orange" },
  { name: "Clockify", icon: Clock, category: "Time", color: "emerald" },
  { name: "Notion", icon: BarChart3, category: "Docs", color: "white" },
]

export function IntegrationsSection() {
  return (
    <section id="integrations" className="relative bg-[#050505] py-24 md:py-32 overflow-hidden border-t border-white/[0.04]">
      <div className="max-w-[1200px] mx-auto px-6 md:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: customEase }}
          className="text-center mb-12 md:mb-16"
        >
          <div className="inline-block px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] mb-4">
            <span className="text-[10px] font-semibold tracking-wider text-white/40 uppercase">Integrations</span>
          </div>
          <h2 className="text-[32px] md:text-[48px] font-bold text-white leading-[1.1] tracking-tight">
            Connects to your tools
          </h2>
          <p className="mt-4 text-[16px] text-white/40 max-w-lg mx-auto">
            Works with the tools your team already uses. No migration needed.
          </p>
        </motion.div>

        {/* Integration Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-12">
          {integrations.map((integration, i) => (
            <motion.div
              key={integration.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.05, ease: customEase }}
              whileHover={{ scale: 1.02, y: -2 }}
              className="group"
            >
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.04] transition-all duration-300">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl bg-${integration.color}-500/10 border border-${integration.color}-500/20 flex items-center justify-center`}>
                    <integration.icon className={`w-5 h-5 text-${integration.color}-400`} />
                  </div>
                </div>
                <h3 className="text-[15px] font-medium text-white/80 group-hover:text-white transition-colors">
                  {integration.name}
                </h3>
                <p className="text-[12px] text-white/30 mt-1">{integration.category}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Data flow visualization */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="p-6 md:p-8 rounded-2xl bg-white/[0.02] border border-white/[0.06]"
        >
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
            {/* Left: Tools */}
            <div className="flex-1">
              <h3 className="text-[18px] font-semibold text-white mb-2">Your Tools</h3>
              <p className="text-[14px] text-white/40">
                GitHub, Slack, Jira, Calendar, and more. We read only metadata — timestamps, event counts, response times.
              </p>
            </div>

            {/* Center: Arrow with animation */}
            <div className="relative w-16 h-16 flex items-center justify-center">
              <motion.div
                className="absolute inset-0 rounded-full border border-emerald-500/30"
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                <Shield className="w-6 h-6 text-emerald-400" />
              </div>
            </div>

            {/* Right: Sentinel */}
            <div className="flex-1 text-center md:text-right">
              <h3 className="text-[18px] font-semibold text-emerald-400 mb-2">Sentinel</h3>
              <p className="text-[14px] text-white/40">
                Processes signals through Safety Valve, Talent Scout, and Culture Thermometer engines.
              </p>
            </div>
          </div>

          {/* Data privacy note */}
          <div className="mt-6 pt-6 border-t border-white/[0.04] flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-[13px] text-white/50">
              We never read message content. Only timestamps and metadata.
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
