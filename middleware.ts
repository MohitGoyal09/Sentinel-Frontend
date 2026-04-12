import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

/**
 * Authentication middleware — uses @supabase/ssr createServerClient
 * to properly handle chunked cookies and base64url-encoded sessions.
 *
 * SECURITY MODEL:
 * - Layer 1 (Middleware): Authentication check only — "are you logged in?"
 * - Layer 2 (Server Components): Fetch user role from backend API with verified JWT
 * - Layer 3 (Backend API): Full JWT signature verification + database role check
 * - Layer 4 (Backend API): RBAC enforcement via require_role() dependency
 */

// Paths that redirect to dashboard when user is authenticated
const ROLE_BASED_PATHS = ["/"]

// Protected routes that require authentication
const PROTECTED_ROUTES = ["/me", "/profile", "/team", "/admin", "/dashboard", "/engines", "/data-ingestion", "/audit-log", "/privacy", "/team-health", "/tenants", "/notifications", "/search", "/ask-sentinel", "/simulation", "/talent-scout", "/workflows", "/marketplace", "/onboarding", "/employee", "/demo"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // If Supabase env vars are missing, allow all requests through
  // (build-time or misconfigured deployment — don't crash)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.next()
  }

  // Create a response that we can modify (for cookie refresh)
  let supabaseResponse = NextResponse.next({ request })

  // Use createServerClient which handles chunked cookies, base64url decoding,
  // and token refresh automatically — unlike manual cookie parsing
  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Forward cookies to the request (for downstream server components)
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          // Recreate response with updated request cookies
          supabaseResponse = NextResponse.next({ request })
          // Set cookies on the response (for the browser)
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getUser() verifies the JWT and refreshes tokens if needed.
  // Wrap in try-catch: stale refresh tokens throw instead of returning null.
  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {
    // Invalid/expired refresh token — treat as unauthenticated
  }

  // Check if this is a protected route
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  )

  // If no user and trying to access protected route, redirect to login
  if (!user && isProtectedRoute) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Redirect root to dashboard for authenticated users
  if (user && ROLE_BASED_PATHS.includes(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // Return the response (may include refreshed auth cookies)
  return supabaseResponse
}

// Configure middleware to run on specific paths
export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/engines/:path*",
    "/me/:path*",
    "/profile/:path*",
    "/team/:path*",
    "/admin/:path*",
    "/data-ingestion/:path*",
    "/audit-log/:path*",
    "/privacy/:path*",
    "/team-health/:path*",
    "/tenants/:path*",
    "/notifications/:path*",
    "/search/:path*",
    "/ask-sentinel/:path*",
    "/simulation/:path*",
    "/talent-scout/:path*",
    "/workflows/:path*",
    "/marketplace/:path*",
    "/onboarding/:path*",
    "/employee/:path*",
    "/demo/:path*",
    "/auth/sso/:path*",
  ],
}
