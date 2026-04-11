"use client"

import React, { useState, useCallback } from "react"
import { Copy, Check } from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Code Block with Copy ───────────────────────────────────────────────────

function CodeBlock({ children, ...props }: React.HTMLAttributes<HTMLPreElement>) {
  const [copied, setCopied] = useState(false)

  // Extract text content from nested <code> element for clipboard
  const getCodeText = useCallback((): string => {
    if (!children || typeof children !== "object") return ""
    const el = children as React.ReactElement<{ children?: React.ReactNode }>
    return el.props?.children ? String(el.props.children).replace(/\n$/, "") : ""
  }, [children])

  const handleCopy = useCallback(() => {
    const text = getCodeText()
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [getCodeText])

  // Extract language from className (e.g. "language-typescript")
  const getLanguage = (): string => {
    if (!children || typeof children !== "object") return ""
    const el = children as React.ReactElement<{ className?: string }>
    return el.props?.className ? String(el.props.className).replace("language-", "") : ""
  }
  const language = getLanguage()

  return (
    <div className="relative group/code my-3 rounded-lg border border-border/50 overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-muted/60 border-b border-border/50">
        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider select-none">
          {language || "code"}
        </span>
        <button
          onClick={handleCopy}
          className={cn(
            "flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] transition-colors duration-150",
            copied
              ? "text-primary"
              : "text-muted-foreground/50 hover:text-foreground",
          )}
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      {/* Code content */}
      <pre
        className="bg-muted/30 px-4 py-3 overflow-x-auto text-[13px] leading-relaxed text-foreground/80 font-mono"
        {...props}
      >
        {children}
      </pre>
    </div>
  )
}

// ─── Exported Markdown Components ───────────────────────────────────────────

export const markdownComponents: Record<
  string,
  React.ComponentType<
    React.HTMLAttributes<HTMLElement> & {
      node?: unknown
      children?: React.ReactNode
      href?: string
      src?: string
      alt?: string
      inline?: boolean
    }
  >
> = {
  h1: ({ children, ...props }) => (
    <h1
      className="text-base font-semibold mb-3 mt-4 text-foreground border-b border-border/30 pb-2"
      {...props}
    >
      {children}
    </h1>
  ),

  h2: ({ children, ...props }) => (
    <h2 className="text-sm font-semibold mb-2 mt-4 text-foreground" {...props}>
      {children}
    </h2>
  ),

  h3: ({ children, ...props }) => (
    <h3
      className="text-sm font-medium mb-2 mt-3 text-foreground/90"
      {...props}
    >
      {children}
    </h3>
  ),

  p: ({ children, ...props }) => (
    <p
      className="mb-3 last:mb-0 text-foreground/85 leading-relaxed text-sm"
      {...props}
    >
      {children}
    </p>
  ),

  ul: ({ children, ...props }) => (
    <ul className="list-disc ml-5 space-y-1 mb-3" {...props}>
      {children}
    </ul>
  ),

  ol: ({ children, ...props }) => (
    <ol className="list-decimal ml-5 space-y-1 mb-3" {...props}>
      {children}
    </ol>
  ),

  li: ({ children, ...props }) => (
    <li className="text-sm text-foreground/85 leading-relaxed pl-0.5" {...props}>
      {children}
    </li>
  ),

  strong: ({ children, ...props }) => (
    <strong className="font-semibold text-foreground" {...props}>
      {children}
    </strong>
  ),

  em: ({ children, ...props }) => (
    <em className="italic text-foreground/80" {...props}>
      {children}
    </em>
  ),

  blockquote: ({ children, ...props }) => (
    <blockquote
      className="border-l-2 border-primary/40 pl-4 py-1 my-3 text-sm text-foreground/75 italic"
      {...props}
    >
      {children}
    </blockquote>
  ),

  hr: (props) => <hr className="border-border/40 my-4" {...props} />,

  table: ({ children, ...props }) => (
    <div className="overflow-x-auto my-3 rounded-lg border border-border/50">
      <table className="w-full text-sm border-collapse" {...props}>
        {children}
      </table>
    </div>
  ),

  thead: ({ children, ...props }) => (
    <thead className="bg-muted/40" {...props}>
      {children}
    </thead>
  ),

  th: ({ children, ...props }) => (
    <th
      className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/50"
      {...props}
    >
      {children}
    </th>
  ),

  td: ({ children, ...props }) => (
    <td
      className="px-3 py-2 text-sm text-foreground/80 border-b border-border/30"
      {...props}
    >
      {children}
    </td>
  ),

  tr: ({ children, ...props }) => (
    <tr
      className="hover:bg-muted/20 transition-colors duration-100"
      {...props}
    >
      {children}
    </tr>
  ),

  a: ({ children, href, ...props }) => (
    <a
      className="text-primary hover:underline underline-offset-2"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    >
      {children}
    </a>
  ),

  img: ({ src, alt, ...props }) => {
    // Validate src URL - only allow https and relative paths to prevent XSS, tracking pixels, CSRF-via-image
    if (src && !src.startsWith('https://') && !src.startsWith('/')) {
      return <span className="text-muted-foreground text-sm">[Image blocked: invalid URL]</span>
    }
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        className="max-w-full rounded-lg border border-border my-2"
        src={src}
        alt={alt ?? ""}
        {...props}
      />
    )
  },

  code: ({
    inline,
    children,
    className,
    ...props
  }: {
    inline?: boolean
    children?: React.ReactNode
    className?: string
  } & React.HTMLAttributes<HTMLElement>) => {
    if (inline) {
      return (
        <code
          className="bg-muted/60 border border-border/30 px-1.5 py-0.5 rounded text-[13px] font-mono text-primary"
          {...props}
        >
          {children}
        </code>
      )
    }
    return (
      <code className={className} {...props}>
        {children}
      </code>
    )
  },

  pre: ({ children, ...props }) => <CodeBlock {...props}>{children}</CodeBlock>,
}
