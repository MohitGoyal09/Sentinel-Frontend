"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Minus } from "lucide-react"

const faqData = [
  {
    question: "How does Sentinel detect burnout without reading message content?",
    answer:
      "Uses metadata only (reply rates, meeting patterns, work hours, collaboration frequency). No message content, no email reading.",
  },
  {
    question: "Is our data safe? Can you identify our employees?",
    answer:
      "Two-vault architecture with no foreign key between them. Even a database breach yields only anonymous hashes and encrypted blobs.",
  },
  {
    question: "What's the accuracy rate?",
    answer:
      "94% accuracy in detecting employees at risk 2-4 weeks before traditional methods.",
  },
  {
    question: "How long does implementation take?",
    answer:
      "Non-invasive integration with existing tools. Most teams are up and running within a week.",
  },
  {
    question: "Do employees know they're being monitored?",
    answer:
      "Transparency-first approach. Employees see their own wellness dashboard. Managers only see anonymized risk alerts.",
  },
]

function FAQAccordionItem({
  item,
  index,
  isOpen,
  onToggle,
}: {
  item: (typeof faqData)[0]
  index: number
  isOpen: boolean
  onToggle: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <div className="border-b border-white/10">
        <button
          onClick={onToggle}
          className="w-full py-5 flex items-start justify-between gap-4 text-left group"
        >
          <span className="text-sm font-medium text-white group-hover:text-emerald-400 transition-colors duration-200">
            {item.question}
          </span>
          <span className="flex-shrink-0 mt-0.5">
            <motion.span
              animate={{ rotate: isOpen ? 45 : 0 }}
              transition={{ duration: 0.25 }}
              className="inline-flex"
            >
              {isOpen ? (
                <Minus className="h-4 w-4 text-emerald-400" />
              ) : (
                <Plus className="h-4 w-4 text-white/40 group-hover:text-white/60 transition-colors" />
              )}
            </motion.span>
          </span>
        </button>
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <p className="pb-5 text-sm text-white/60 leading-relaxed">
                {item.answer}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section id="faq" className="relative py-24 md:py-28 overflow-hidden bg-black">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-b from-emerald-500/[0.03] via-transparent to-transparent" />
      </div>

      <div className="max-w-[800px] mx-auto px-[5vw] relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-px bg-emerald-500/60" />
            <span className="text-[10px] uppercase tracking-[0.25em] text-emerald-500/70">
              FAQ
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-semibold text-white mb-3">
            Frequently asked questions
          </h2>
          <p className="text-white/50 text-sm max-w-xl">
            Everything you need to know about Sentinel&apos;s privacy-first approach to
            burnout detection.
          </p>
        </motion.div>

        <div className="space-y-0">
          {faqData.map((item, index) => (
            <FAQAccordionItem
              key={index}
              item={item}
              index={index}
              isOpen={openIndex === index}
              onToggle={() => handleToggle(index)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}