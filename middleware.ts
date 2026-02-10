import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/**
 * Role-based routing middleware
 * 
 * This middleware checks the user's role from the JWT token in the cookie
 * and redirects them to the appropriate default page.
 * 
 * Role → Default Page Mapping:
 * - employee → /me (employee self-service dashboard)
 * - manager → /team (manager team dashboard)  
 * - admin → /admin (admin system dashboard)
 */

// Paths that require role-based redirection
const ROLE_BASED_PATHS = ["/dashboard", "/"]

// Role-based default routes
const ROLE_ROUTES: Record<string, string> = {
  employee: "/me",
  manager: "/team",
  admin: "/admin",
}

// Protected routes that require authentication
const PROTECTED_ROUTES = ["/me", "/team", "/admin", "/dashboard", "/engines"]

// Routes that are role-specific (only accessible by certain roles)
const ROLE_SPECIFIC_ROUTES: Record<string, string[]> = {
  employee: ["/me"],
  manager: ["/me", "/team"],
  admin: ["/me", "/team", "/admin"],
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Get the token from cookies or headers
  const token = request.cookies.get("sb-access-token")?.value

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

  // If token exists, we need to decode it to get the role
  // The role is stored in the JWT token from Supabase
  try {
    // Decode the JWT payload (base64)
    const base64Payload = token!.split(".")[1]
    const payload = JSON.parse(Buffer.from(base64Payload, "base64").toString())
    
    // Get user role from the token
    // Note: The actual field name depends on your Supabase setup
    // This assumes the role is stored in user_metadata
    const userRole = payload.user_metadata?.role || payload.role || "employee"

    // If accessing /dashboard or /, redirect to role-specific page
    if (ROLE_BASED_PATHS.includes(pathname)) {
      const defaultRoute = ROLE_ROUTES[userRole] || "/me"
      return NextResponse.redirect(new URL(defaultRoute, request.url))
    }

    // Check if user has access to this specific route
    const allowedRoutes = ROLE_SPECIFIC_ROUTES[userRole] || ["/me"]
    const hasAccess = allowedRoutes.some((route) => pathname.startsWith(route))

    if (!hasAccess) {
      // Redirect to their default page with error message
      const defaultRoute = ROLE_ROUTES[userRole] || "/me"
      const url = new URL(defaultRoute, request.url)
      url.searchParams.set("error", "access_denied")
      return NextResponse.redirect(url)
    }

    // User has access, allow through
    return NextResponse.next()
  } catch (error) {
    // If token decoding fails, redirect to login
    console.error("Token decoding error:", error)
    return NextResponse.redirect(new URL("/login", request.url))
  }
}

// Configure middleware to run on specific paths
export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/me/:path*",
    "/team/:path*",
    "/admin/:path*",
  ],
}
