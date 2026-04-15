"use client"

import Link from "next/link"
import { Shield, Menu, X } from "lucide-react"
import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [hoveredLink, setHoveredLink] = useState<string | null>(null)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const navLinks = [
    { href: "#methodology", label: "Methodology" },
    { href: "#engines", label: "Engines" },
    { href: "#faq", label: "FAQ" },
  ]

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-black/80 backdrop-blur-xl border-b border-white/5 py-4"
          : "bg-transparent py-6"
      }`}
    >
      <div className="w-full px-[5vw] flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 flex items-center justify-center border border-emerald-500/20 group-hover:border-emerald-400/40 transition-all duration-300">
            <Shield className="h-4 w-4 text-emerald-400" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-white group-hover:text-emerald-100 transition-colors duration-200">
            Sentinel
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="relative px-5 py-2.5 text-sm text-white/50 hover:text-white rounded-xl hover:bg-white/5 transition-all duration-200"
              onMouseEnter={() => setHoveredLink(link.href)}
              onMouseLeave={() => setHoveredLink(null)}
            >
              <span className="relative z-10">{link.label}</span>
              {hoveredLink === link.href && (
                <motion.div
                  className="absolute inset-0 bg-emerald-500/10 rounded-xl border border-emerald-500/20"
                  layoutId="nav-hover"
                  transition={{ duration: 0.2 }}
                />
              )}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-white/50 hover:text-white transition-colors duration-200 px-4 py-2 rounded-xl hover:bg-white/5"
          >
            Sign In
          </Link>

          <Link href="/demo">
            <motion.button
              className="relative px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-medium overflow-hidden group"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="relative z-10">Get Demo</span>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-emerald-500"
                initial={{ x: "100%" }}
                whileHover={{ x: 0 }}
                transition={{ duration: 0.2 }}
              />
            </motion.button>
          </Link>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <motion.button
            className="p-2.5 text-white/50 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            whileTap={{ scale: 0.95 }}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="md:hidden absolute top-full left-0 right-0 bg-black/95 backdrop-blur-xl border-b border-white/10"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-4 flex flex-col gap-1">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    href={link.href}
                    className="flex items-center gap-3 text-sm text-white/50 hover:text-white py-3.5 px-4 rounded-xl hover:bg-white/5 transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              <div className="border-t border-white/10 mt-2 pt-2">
                <Link
                  href="/login"
                  className="flex items-center text-sm text-white/50 hover:text-white py-3.5 px-4 rounded-xl hover:bg-white/5 transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  href="/demo"
                  className="flex items-center justify-center text-sm bg-emerald-500 text-white py-3.5 px-4 rounded-xl transition-colors mt-1"
                  onClick={() => setMobileOpen(false)}
                >
                  Get Demo
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}