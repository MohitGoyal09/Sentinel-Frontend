"use client"

import Link from "next/link"
import { Shield, Twitter, Github, Linkedin, Mail } from "lucide-react"

export function LandingFooter() {
  const footerLinks = {
    Product: [
      { label: "Features", href: "#features" },
      { label: "How it Works", href: "#how-it-works" },
      { label: "Pricing", href: "#" },
      { label: "Integrations", href: "#" },
    ],
    Company: [
      { label: "About", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Contact", href: "#" },
    ],
    Legal: [
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" },
      { label: "Security", href: "#" },
      { label: "GDPR", href: "#" },
    ],
  }

  const socialLinks = [
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Linkedin, href: "#", label: "LinkedIn" },
    { icon: Github, href: "#", label: "GitHub" },
    { icon: Mail, href: "#", label: "Email" },
  ]

  return (
    <footer className="border-t border-border/50 py-12">
      <div className="container px-6 mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-3">
              <div className="h-7 w-7 rounded-lg bg-primary/15 flex items-center justify-center">
                <Shield className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="text-sm font-semibold text-foreground">Sentinel</span>
            </Link>
            <p className="text-xs text-muted-foreground leading-relaxed mb-4 max-w-[200px]">
              Privacy-first burnout detection and talent discovery.
            </p>
            <div className="flex gap-2">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="w-7 h-7 rounded-md bg-muted/40 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-150"
                  aria-label={social.label}
                >
                  <social.icon className="h-3.5 w-3.5" />
                </a>
              ))}
            </div>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">{title}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-150">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-border/50 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-[11px] text-muted-foreground/60">
            &copy; {new Date().getFullYear()} Sentinel. All rights reserved.
          </p>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] text-emerald-500/80 font-medium">All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
