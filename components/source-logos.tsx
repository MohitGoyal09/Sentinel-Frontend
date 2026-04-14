import { FileSpreadsheet } from "lucide-react"

interface LogoProps {
  className?: string
}

/**
 * GitHub Octocat mark.
 * Uses the official GitHub mark SVG path. Fills with currentColor
 * so it adapts to light/dark contexts.
 */
export function GitHubLogo({ className = "h-5 w-5" }: LogoProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-label="GitHub"
      role="img"
    >
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  )
}

/**
 * Slack mark — four-color shape using the official brand colors.
 * Simplified version of the Slack mark that reads well at 20-24px.
 */
export function SlackLogo({ className = "h-5 w-5" }: LogoProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-label="Slack"
      role="img"
    >
      {/* Top-left: red */}
      <path
        d="M6.527 14.514A1.263 1.263 0 0 1 5.263 15.777 1.263 1.263 0 0 1 4 14.514a1.263 1.263 0 0 1 1.263-1.264h1.264v1.264zm.632 0a1.263 1.263 0 0 1 1.264-1.264 1.263 1.263 0 0 1 1.263 1.264v3.159A1.263 1.263 0 0 1 8.423 18.936a1.263 1.263 0 0 1-1.264-1.263v-3.16z"
        fill="#E01E5A"
      />
      {/* Top-right: blue */}
      <path
        d="M8.423 6.527A1.263 1.263 0 0 1 7.159 5.263 1.263 1.263 0 0 1 8.423 4a1.263 1.263 0 0 1 1.263 1.263v1.264H8.423zm0 .645a1.263 1.263 0 0 1 1.263 1.264 1.263 1.263 0 0 1-1.263 1.263H5.263A1.263 1.263 0 0 1 4 8.436a1.263 1.263 0 0 1 1.263-1.264h3.16z"
        fill="#36C5F0"
      />
      {/* Bottom-right: green */}
      <path
        d="M16.41 8.436a1.263 1.263 0 0 1 1.264-1.264A1.263 1.263 0 0 1 18.936 8.436a1.263 1.263 0 0 1-1.263 1.263H16.41V8.436zm-.632 0a1.263 1.263 0 0 1-1.264 1.263 1.263 1.263 0 0 1-1.263-1.263V5.263A1.263 1.263 0 0 1 14.514 4a1.263 1.263 0 0 1 1.264 1.263v3.173z"
        fill="#2EB67D"
      />
      {/* Bottom-left: yellow */}
      <path
        d="M14.514 16.41a1.263 1.263 0 0 1 1.264 1.264A1.263 1.263 0 0 1 14.514 18.936a1.263 1.263 0 0 1-1.263-1.263V16.41h1.263zm0-.632a1.263 1.263 0 0 1-1.263-1.264 1.263 1.263 0 0 1 1.263-1.263h3.16A1.263 1.263 0 0 1 18.936 14.514a1.263 1.263 0 0 1-1.264 1.264h-3.159z"
        fill="#ECB22E"
      />
    </svg>
  )
}

/**
 * Google Calendar — simplified blue calendar with date number.
 */
export function GoogleCalendarLogo({ className = "h-5 w-5" }: LogoProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-label="Google Calendar"
      role="img"
    >
      {/* Calendar body */}
      <rect x="3" y="4" width="18" height="18" rx="2" fill="#4285F4" />
      {/* Header bar */}
      <rect x="3" y="4" width="18" height="5" rx="2" fill="#1967D2" />
      {/* Hanging tabs */}
      <rect x="7" y="2" width="2" height="4" rx="1" fill="#1967D2" />
      <rect x="15" y="2" width="2" height="4" rx="1" fill="#1967D2" />
      {/* Date area */}
      <rect x="5" y="11" width="14" height="9" rx="1" fill="white" />
      {/* Date number */}
      <text
        x="12"
        y="18"
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
        fontSize="7"
        fontWeight="bold"
        fill="#4285F4"
      >
        31
      </text>
    </svg>
  )
}

/**
 * Gmail — the M-shaped envelope with red accents.
 * Simplified mark that reads well at small sizes.
 */
export function GmailLogo({ className = "h-5 w-5" }: LogoProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-label="Gmail"
      role="img"
    >
      {/* Envelope background */}
      <rect x="2" y="4" width="20" height="16" rx="2" fill="#F2F2F2" />
      {/* Left red panel */}
      <path d="M2 6v12a2 2 0 0 0 2 2h1V7.5L2 6z" fill="#EA4335" />
      {/* Right red panel */}
      <path d="M22 6v12a2 2 0 0 1-2 2h-1V7.5L22 6z" fill="#EA4335" />
      {/* Bottom section */}
      <rect x="5" y="8" width="14" height="12" fill="white" />
      {/* M-shaped flap (the key visual) */}
      <path
        d="M5 7.5L12 13l7-5.5V4H5v3.5z"
        fill="#EA4335"
      />
      {/* Left inner triangle */}
      <path d="M5 7.5L12 13V4H5v3.5z" fill="#FBBC04" />
      {/* Right inner triangle */}
      <path d="M19 7.5L12 13V4h7v3.5z" fill="#34A853" />
      {/* Top of M */}
      <path d="M5 4l7 5.5L19 4" stroke="#C5221F" strokeWidth="0" fill="none" />
    </svg>
  )
}

/**
 * Jira — the blue chevron/diamond mark.
 * Uses blue gradient matching the official Jira brand.
 */
export function JiraLogo({ className = "h-5 w-5" }: LogoProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-label="Jira"
      role="img"
    >
      <defs>
        <linearGradient id="jira-blue-a" x1="99%" y1="0%" x2="40%" y2="100%">
          <stop offset="18%" stopColor="#0052CC" />
          <stop offset="100%" stopColor="#2684FF" />
        </linearGradient>
        <linearGradient id="jira-blue-b" x1="1%" y1="0%" x2="60%" y2="100%">
          <stop offset="18%" stopColor="#0052CC" />
          <stop offset="100%" stopColor="#2684FF" />
        </linearGradient>
      </defs>
      {/* Right chevron */}
      <path
        d="M21.17 11.41L12.71 2.95 12 2.24l-9.17 9.17a.83.83 0 0 0 0 1.18L12 21.76l9.17-9.17a.83.83 0 0 0 0-1.18zM12 15.12L8.88 12 12 8.88 15.12 12 12 15.12z"
        fill="url(#jira-blue-a)"
      />
      {/* Shadow / depth on lower-left */}
      <path
        d="M12 8.88a4.41 4.41 0 0 1-.02-6.22L3.06 11.59a.83.83 0 0 0 0 1.18L8.88 12 12 8.88z"
        fill="url(#jira-blue-b)"
      />
      {/* Shadow / depth on upper-right */}
      <path
        d="M15.13 12L12 15.12a4.42 4.42 0 0 1 0 6.25l8.95-8.95a.84.84 0 0 0 0-1.18L15.13 12z"
        fill="url(#jira-blue-a)"
      />
    </svg>
  )
}

/**
 * CSV file icon — uses the Lucide FileSpreadsheet icon.
 * Inherits currentColor for theming consistency.
 */
export function CSVLogo({ className = "h-5 w-5" }: LogoProps) {
  return <FileSpreadsheet className={className} aria-label="CSV" />
}
