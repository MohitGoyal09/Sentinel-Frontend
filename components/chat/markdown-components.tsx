import React from "react"

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
    <h1 className="text-base sm:text-lg font-bold mb-2 mt-3 text-foreground" {...props}>{children}</h1>
  ),
  h2: ({ children, ...props }) => (
    <h2 className="text-sm sm:text-base font-semibold mb-2 mt-2 text-foreground" {...props}>{children}</h2>
  ),
  h3: ({ children, ...props }) => (
    <h3 className="text-xs sm:text-sm font-semibold mb-2 mt-2 text-foreground/90" {...props}>{children}</h3>
  ),
  p: ({ children, ...props }) => (
    <p className="mb-2 text-foreground/85 leading-relaxed text-sm" {...props}>{children}</p>
  ),
  ul: ({ children, ...props }) => (
    <ul className="list-disc ml-6 space-y-1.5 mb-2" {...props}>{children}</ul>
  ),
  ol: ({ children, ...props }) => (
    <ol className="list-decimal ml-6 space-y-1.5 mb-2" {...props}>{children}</ol>
  ),
  li: ({ children, ...props }) => (
    <li className="text-sm text-foreground/85" {...props}>{children}</li>
  ),
  strong: ({ children, ...props }) => (
    <strong className="font-semibold text-foreground" {...props}>{children}</strong>
  ),
  blockquote: ({ children, ...props }) => (
    <blockquote className="border-l-4 border-primary/40 pl-4 py-2 my-3 bg-muted/30 rounded-r text-sm" {...props}>{children}</blockquote>
  ),
  table: ({ children, ...props }) => (
    <div className="overflow-x-auto my-3 rounded-lg border border-border/50">
      <table className="w-full text-sm border-collapse" {...props}>{children}</table>
    </div>
  ),
  thead: ({ children, ...props }) => (
    <thead className="bg-muted/50" {...props}>{children}</thead>
  ),
  th: ({ children, ...props }) => (
    <th className="px-3 py-2 text-left font-semibold text-foreground border-b border-border/50" {...props}>{children}</th>
  ),
  td: ({ children, ...props }) => (
    <td className="px-3 py-2 text-muted-foreground border-b border-border/30" {...props}>{children}</td>
  ),
  tr: ({ children, ...props }) => (
    <tr className="hover:bg-muted/30 transition-colors" {...props}>{children}</tr>
  ),
  a: ({ children, href, ...props }) => (
    <a className="text-primary hover:underline" href={href} target="_blank" rel="noopener noreferrer" {...props}>{children}</a>
  ),
  img: ({ src, alt, ...props }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img className="max-w-full rounded-xl shadow-sm border border-border" src={src} alt={alt ?? ""} {...props} />
  ),
  code: ({
    inline,
    children,
    className,
    ...props
  }: { inline?: boolean; children?: React.ReactNode; className?: string } & React.HTMLAttributes<HTMLElement>) => {
    if (inline) {
      return (
        <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-primary" {...props}>
          {children}
        </code>
      )
    }
    return <code className={className} {...props}>{children}</code>
  },
  pre: ({ children, ...props }) => (
    <pre className="bg-muted border border-border/50 p-4 rounded-lg overflow-x-auto text-xs my-3 text-foreground/80" {...props}>{children}</pre>
  ),
}
