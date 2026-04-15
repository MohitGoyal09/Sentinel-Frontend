"use client"

import { useEffect, useState } from "react"
import { motion, useMotionValue, useSpring } from "framer-motion"

export function CustomCursor() {
  const [isHovering, setIsHovering] = useState(false)
  const [cursorText, setCursorText] = useState("")
  const [isVisible, setIsVisible] = useState(false)
  
  const cursorX = useMotionValue(-100)
  const cursorY = useMotionValue(-100)
  
  // Spring config for smooth following
  const springConfig = { damping: 30, stiffness: 500 }
  const cursorXSpring = useSpring(cursorX, springConfig)
  const cursorYSpring = useSpring(cursorY, springConfig)

  // Ring lags behind with more physics
  const ringConfig = { damping: 20, stiffness: 200 }
  const ringX = useSpring(cursorX, ringConfig)
  const ringY = useSpring(cursorY, ringConfig)

  useEffect(() => {
    // Only show custom cursor on desktop
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    if (isMobile) return

    setIsVisible(true)

    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX)
      cursorY.set(e.clientY)
    }

    window.addEventListener("mousemove", moveCursor)

    return () => {
      window.removeEventListener("mousemove", moveCursor)
    }
  }, [cursorX, cursorY])

  useEffect(() => {
    // Track hover targets
    const setupHoverListeners = () => {
      const hoverElements = document.querySelectorAll("[data-cursor]")
      
      hoverElements.forEach((el) => {
        el.addEventListener("mouseenter", () => {
          setIsHovering(true)
          setCursorText(el.getAttribute("data-cursor") || "VIEW")
        })
        el.addEventListener("mouseleave", () => {
          setIsHovering(false)
          setCursorText("")
        })
      })
    }

    // Setup after a short delay to ensure DOM is ready
    const timer = setTimeout(setupHoverListeners, 100)
    
    return () => clearTimeout(timer)
  }, [])

  if (!isVisible) return null

  return (
    <>
      {/* Dot - instant follow */}
      <motion.div
        className="fixed top-0 left-0 w-1.5 h-1.5 bg-[#B75C40] rounded-full pointer-events-none z-[9999] mix-blend-difference"
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
          translateX: "-50%",
          translateY: "-50%",
        }}
      />
      
      {/* Ring - physics lag */}
      <motion.div
        className="fixed top-0 left-0 rounded-full border pointer-events-none z-[9998]
                   flex items-center justify-center text-[10px] font-medium tracking-wider uppercase"
        style={{
          x: ringX,
          y: ringY,
          translateX: "-50%",
          translateY: "-50%",
        }}
        animate={{
          width: isHovering ? 80 : 40,
          height: isHovering ? 80 : 40,
          backgroundColor: isHovering ? "rgba(183, 92, 64, 0.1)" : "transparent",
          borderColor: isHovering ? "rgba(183, 92, 64, 0.5)" : "rgba(242, 239, 233, 0.3)",
        }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        {isHovering && <span className="text-[#B75C40]">{cursorText}</span>}
      </motion.div>
    </>
  )
}
