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
 */

// Paths that should redirect authenticated users to their role page
const ROLE_BASED_PATHS = ["/dashboard"]

// Role-based default routes
const ROLE_ROUTES: Record<string, string> = {
  employee: "/me",
  manager: "/team",
  admin: "/admin",
}

// Protected routes that require authentication
const PROTECTED_ROUTES = ["/me", "/team", "/admin", "/dashboard"]

// Routes that are role-specific (only accessible by certain roles)
const ROLE_SPECIFIC_ROUTES: Record<string, string[]> = {
  employee: ["/me"],
  manager: ["/me", "/team"],
  admin: ["/me", "/team", "/admin"],
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Create a Supabase client that reads cookies correctly
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: use getUser() not getSession() — getUser() validates the JWT server-side
  const { data: { user }, error } = await supabase.auth.getUser()

  // Check if this is a protected route
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  )

  // If not protected, allow through
  if (!isProtectedRoute) {
    return supabaseResponse
  }

  // If no user and trying to access protected route, redirect to login
  if (!user || error) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("redirectTo", pathname)
    return NextResponse.redirect(url)
  }

  // Get user role from metadata (set during signup or by admin)
  const userRole = user.user_metadata?.role || "employee"

  // If accessing /dashboard, redirect to role-specific page
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
  return supabaseResponse
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

