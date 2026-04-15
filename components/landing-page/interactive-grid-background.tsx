"use client"

import { useEffect, useState, useRef } from "react"
import { motion } from "framer-motion"

export function InteractiveGridBackground() {
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 })
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setMousePos({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        })
      }
    }

    window.addEventListener("mousemove", handleMouseMove, { passive: true })
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  // Create fewer, larger cells for performance
  const cols = 20
  const rows = 12
  const cells = []

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const cellX = (x / cols) * 100
      const cellY = (y / rows) * 100
      const cellWidth = 100 / cols
      const cellHeight = 100 / rows
      
      // Calculate distance from mouse
      const cellCenterX = cellX + cellWidth / 2
      const cellCenterY = cellY + cellHeight / 2
      
      // Convert percentage to actual position (rough estimate)
      const actualCellX = (cellCenterX / 100) * (containerRef.current?.offsetWidth || 0)
      const actualCellY = (cellCenterY / 100) * (containerRef.current?.offsetHeight || 0)
      
      const dx = actualCellX - mousePos.x
      const dy = actualCellY - mousePos.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      const maxDistance = 200
      const opacity = distance < maxDistance 
        ? 0.1 + (1 - distance / maxDistance) * 0.3 
        : 0.05

      cells.push({
        id: `${x}-${y}`,
        x: cellX,
        y: cellY,
        width: cellWidth,
        height: cellHeight,
        opacity,
      })
    }
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none overflow-hidden z-[0]"
    >
      {/* Base grid lines */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.3) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.3) 1px, transparent 1px)
          `,
          backgroundSize: `${100 / cols}% ${100 / rows}%`,
        }}
      />

      {/* Interactive highlight cells */}
      {cells.map((cell) => (
        <motion.div
          key={cell.id}
          className="absolute"
          style={{
            left: `${cell.x}%`,
            top: `${cell.y}%`,
            width: `${cell.width}%`,
            height: `${cell.height}%`,
          }}
          initial={false}
          animate={{
            backgroundColor: `rgba(16, 185, 129, ${cell.opacity})`,
          }}
          transition={{ duration: 0.15 }}
        />
      ))}

      {/* Gradient vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 30% 20%, rgba(16, 185, 129, 0.08) 0%, transparent 50%),
            radial-gradient(ellipse at 70% 80%, rgba(139, 92, 246, 0.08) 0%, transparent 50%)
          `,
        }}
      />
    </div>
  )
}