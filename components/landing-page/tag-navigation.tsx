"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Tag, X } from "lucide-react"

interface TagItem {
  id: string
  label: string
  href: string
  color: string
}

const tags: TagItem[] = [
  { id: "overview", label: "Overview", href: "#overview", color: "#10B981" },
  { id: "timeline", label: "18 Days", href: "#timeline", color: "#F59E0B" },
  { id: "privacy", label: "Privacy", href: "#privacy", color: "#8B5CF6" },
  { id: "engines", label: "Engines", href: "#engines", color: "#EF4444" },
  { id: "network", label: "Network", href: "#network", color: "#6366F1" },
  { id: "proof", label: "Trust", href: "#proof", color: "#10B981" },
  { id: "science", label: "Science", href: "#methodology", color: "#8B5CF6" },
  { id: "faq", label: "FAQ", href: "#faq", color: "#F59E0B" },
]

export function TagNavigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTag, setActiveTag] = useState<string | null>(null)

  const handleTagClick = (tag: TagItem) => {
    setActiveTag(tag.id)
    setIsOpen(false)

    const element = document.querySelector(tag.href)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <>
      {/* Floating tag button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed right-6 bottom-6 z-[100] p-4 rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 backdrop-blur-xl hover:border-emerald-400/50 transition-all duration-300"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        style={{
          boxShadow: "0 0 30px rgba(16, 185, 129, 0.2)",
        }}
      >
        {isOpen ? (
          <X className="w-5 h-5 text-emerald-400" />
        ) : (
          <Tag className="w-5 h-5 text-emerald-400" />
        )}
      </motion.button>

      {/* Tag panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed right-6 bottom-20 z-[100] p-4 rounded-2xl bg-black/90 backdrop-blur-xl border border-white/10 min-w-[200px]"
            style={{
              boxShadow: "0 0 40px rgba(0, 0, 0, 0.5)",
            }}
          >
            <div className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-3 px-2">
              Navigate
            </div>
            <div className="flex flex-col gap-1">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => handleTagClick(tag)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 text-left ${
                    activeTag === tag.id
                      ? "bg-white/10 text-white"
                      : "text-white/50 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  {tag.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}