"use client"

import { motion } from "framer-motion"
import { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface ScrollRevealProps {
  children: ReactNode
  className?: string
  delay?: number
  yOffset?: number
  duration?: number
}

export function ScrollReveal({ 
  children, 
  className, 
  delay = 0, 
  yOffset = 40,
  duration = 0.8
}: ScrollRevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: yOffset }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{
        duration: duration,
        delay: delay,
        ease: [0.23, 1, 0.32, 1] as [number, number, number, number] // ease-out-strong matching our CSS tokens
      }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  )
}
