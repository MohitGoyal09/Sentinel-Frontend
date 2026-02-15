import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

/**
 * Role-based routing middleware
 * 
 * Uses @supabase/ssr to correctly read Supabase session cookies
 * (cookie name is `sb-<project-ref>-auth-token`, NOT `sb-access-token`).
 * 
 * Role → Default Page Mapping:
 * - employee → /me (employee self-service dashboard)
 * - manager → /team (manager team dashboard)  
 * - admin → /admin (admin system dashboard)
 * 
 * Cookie Name Note:
 * Supabase Auth uses project-specific cookie names: sb-{project_ref}-auth-token
 * The cookie contains a JSON object with access_token, refresh_token, etc.
 * We also fall back to sb-access-token for compatibility.
 */

// Paths that require role-based redirection
const ROLE_BASED_PATHS = ["/"]

// Role-based default routes - redirect to dashboard (which shows content based on role)
const ROLE_ROUTES: Record<string, string> = {
  employee: "/dashboard",
  manager: "/dashboard",
  admin: "/dashboard",
}

// Protected routes that require authentication
const PROTECTED_ROUTES = ["/me", "/profile", "/team", "/admin", "/dashboard", "/engines"]

// Routes that are role-specific (only accessible by certain roles)
const ROLE_SPECIFIC_ROUTES: Record<string, string[]> = {
  employee: ["/me", "/profile"],
  manager: ["/me", "/profile", "/team"],
  admin: ["/me", "/profile", "/team", "/admin"],
}

/**
 * Extract the access token from Supabase auth cookies
 * Supabase stores auth data in sb-{project_ref}-auth-token as JSON
 */
function getAccessToken(request: NextRequest): string | null {
  // Try project-specific cookie first (Supabase default format)
  const allCookies = request.cookies.getAll()
  const authCookie = allCookies.find(
    (cookie) => cookie.name.startsWith("sb-") && cookie.name.endsWith("-auth-token")
  )

  if (authCookie?.value) {
    let rawValue = authCookie.value
    
    // Handle Supabase Auth Helpers "base64-" prefix
    if (rawValue.startsWith("base64-")) {
      try {
        const base64Part = rawValue.replace("base64-", "")
        rawValue = atob(base64Part)
      } catch (e) {
        // If decoding fails, continue with original value
        console.warn("Failed to decode base64 cookie prefix", e)
      }
    }

    try {
      // Decode URI if needed and parse JSON
      // Some cookies are URI encoded, others not. unique decoding.
      const decodedVal = decodeURIComponent(rawValue)
      const data = JSON.parse(decodedVal)

      if (data.access_token) {
        return data.access_token
      }
      
      // Handle array format (common in some Supabase versions)
      // Format: ["session", { access_token: "..." }]
      if (Array.isArray(data)) {
        for (const item of data) {
          if (typeof item === 'object' && item?.access_token) {
            return item.access_token
          }
        }
      }
    } catch {
      // If parsing fails, check if the value itself is a JWT
      // JWTs start with "ey"
      if (rawValue.startsWith("ey")) {
        return rawValue
      }
    }
  }

  // Fall back to sb-access-token (legacy/alternative format)
  const legacyToken = request.cookies.get("sb-access-token")?.value
  if (legacyToken && legacyToken.startsWith("ey")) {
    return legacyToken
  }

  return null
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Get the token from cookies using the helper function
  const token = getAccessToken(request)

  // Check if this is a protected route
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  )

  // If not protected, allow through
  if (!isProtectedRoute) {
    return NextResponse.next()
  }

  // If no token and trying to access protected route, redirect to login
  if (!token && isProtectedRoute) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // If token exists, try to decode it to get the role
  // Note: The role in the JWT might not match the database role
  // So we allow access to all protected routes for authenticated users
  // The backend will handle actual authorization
  let userRole = "employee" // default
  
  if (token) {
    try {
      const tokenParts = token.split(".")
      if (tokenParts.length >= 2 && tokenParts[1]) {
        const base64Payload = tokenParts[1]
          .replace(/-/g, "+")
          .replace(/_/g, "/")
        
        const padding = base64Payload.length % 4
        const paddedPayload = padding 
          ? base64Payload + "=".repeat(4 - padding) 
          : base64Payload

        const payload = JSON.parse(atob(paddedPayload))
        userRole = payload.user_metadata?.role || payload.role || "employee"
      }
    } catch (error) {
      console.warn("Failed to decode token for role:", error)
      // Continue with default role - backend will authorize
    }
  }

  // If accessing /dashboard or /, redirect to role-specific page
  if (ROLE_BASED_PATHS.includes(pathname)) {
    const defaultRoute = ROLE_ROUTES[userRole] || "/me"
    return NextResponse.redirect(new URL(defaultRoute, request.url))
  }

  // Allow all authenticated users to access protected routes
  // The backend will enforce authorization based on database role
  // This fixes the issue where JWT role doesn't match database role
  return NextResponse.next()
}

// Configure middleware to run on specific paths
// NOTE: "/" is excluded — landing page is public
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/me/:path*",
    "/team/:path*",
    "/admin/:path*",
  ],
}

