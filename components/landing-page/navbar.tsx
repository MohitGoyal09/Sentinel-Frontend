"use client"

import Link from "next/link"
import { Shield, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const navLinks = [
    { href: "#features", label: "Features" },
    { href: "#how-it-works", label: "How it Works" },
    { href: "#testimonials", label: "Testimonials" },
  ]

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-200",
        scrolled
          ? "bg-background/80 backdrop-blur-xl border-b border-border/50 py-3"
          : "bg-transparent py-5"
      )}
    >
      <div className="container mx-auto px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center transition-colors duration-200 group-hover:bg-primary/25">
            <Shield className="h-4.5 w-4.5 text-primary" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-foreground">Sentinel</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-white/5 transition-all duration-150"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-150 px-3 py-2">
            Sign In
          </Link>
          <Link href="/login">
            <Button size="sm" className="rounded-lg px-5 h-9 font-medium">
              Get Started
            </Button>
          </Link>
        </div>

        <button
          className="md:hidden p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-white/5"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-background/95 backdrop-blur-xl border-b border-border p-4 flex flex-col gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground hover:text-foreground py-2.5 px-3 rounded-lg hover:bg-white/5"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="flex flex-col gap-2 pt-3 mt-1 border-t border-border">
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground py-2.5 px-3">
              Sign In
            </Link>
            <Link href="/login">
              <Button className="rounded-lg w-full h-10">Get Started</Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
