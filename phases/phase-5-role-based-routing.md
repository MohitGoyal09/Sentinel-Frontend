# Phase 5: Role-Based Routing - The Right Door for Every User

## The Story: The Intelligent Concierge

Imagine walking into a hotel. You have a key card, but instead of wandering hallways looking for your room, the elevator **just knows** which floor you're on. Press the button, and it takes you exactly where you need to be.

That's what Phase 5 builds—an intelligent routing system that knows who you are and takes you to the right place automatically.

## The Problem: Choice Paralysis

Before Phase 5, every user saw the same dashboard:
- Employees saw team analytics (confusing and irrelevant)
- Managers saw individual employee details (privacy concern)
- Admins saw... everything (overwhelming)

**The Result**: Users got lost, clicked wrong things, and had a poor experience.

## The Solution: Role-Based Defaults

**The Philosophy**: Don't make users think. Give them what they need based on who they are.

```
Employee logs in    →  /me (personal dashboard)
Manager logs in     →  /team (team dashboard)  
Admin logs in       →  /admin (system dashboard)
```

Simple. Intuitive. Secure.

## Technical Implementation

### 1. The Middleware (`middleware.ts`)

Next.js middleware runs on the edge—before the page even loads. It's the perfect place for role-based redirects.

```typescript
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get("sb-access-token")?.value
  
  // Decode JWT to get role
  const payload = decodeJWT(token)
  const userRole = payload.user_metadata?.role || "employee"
  
  // Role → Default Route Mapping
  const ROLE_ROUTES = {
    employee: "/me",
    manager: "/team",
    admin: "/admin"
  }
  
  // If accessing /dashboard or /, redirect to role-specific page
  if (["/dashboard", "/"].includes(pathname)) {
    return NextResponse.redirect(
      new URL(ROLE_ROUTES[userRole], request.url)
    )
  }
  
  // Check if user has access to this specific route
  const allowedRoutes = {
    employee: ["/me"],
    manager: ["/me", "/team"],
    admin: ["/me", "/team", "/admin"]
  }
  
  if (!allowedRoutes[userRole].some(route => pathname.startsWith(route))) {
    // Redirect to their default page with error
    const url = new URL(ROLE_ROUTES[userRole], request.url)
    url.searchParams.set("error", "access_denied")
    return NextResponse.redirect(url)
  }
  
  return NextResponse.next()
}
```

**What This Does**:
- Intercepts every request to protected routes
- Reads JWT token from cookies
- Decodes token to extract user role
- Redirects based on role when accessing generic paths
- Blocks access to role-inappropriate pages
- Adds error parameter for UI feedback

### 2. The Auth Context Update

The auth context now tracks user role and handles role-based redirects on login:

```typescript
const signIn = async (email: string, password: string) => {
  const { data } = await supabase.auth.signInWithPassword({ email, password })
  
  // Fetch user role from backend
  const roleResponse = await api.get('/me')
  const role = roleResponse.data.user.role
  
  // Redirect based on role
  switch (role) {
    case 'admin':
      router.push('/admin')
      break
    case 'manager':
      router.push('/team')
      break
    case 'employee':
    default:
      router.push('/me')
      break
  }
}
```

**Why This Matters**:
- User logs in → Immediately taken to relevant dashboard
- No confusion about where to go
- No accidental access to wrong pages
- Smooth, professional experience

### 3. The Sidebar Navigation

The sidebar now adapts to the user's role:

```typescript
const roleBasedNavItems = {
  employee: [
    { id: "me", label: "My Wellbeing", icon: User, href: "/me" },
    { id: "dashboard", label: "Team Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  ],
  manager: [
    { id: "me", label: "My Wellbeing", icon: User, href: "/me" },
    { id: "team", label: "My Team", icon: Users, href: "/team" },
    { id: "dashboard", label: "Team Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  ],
  admin: [
    { id: "me", label: "My Wellbeing", icon: User, href: "/me" },
    { id: "team", label: "My Team", icon: Users, href: "/team" },
    { id: "admin", label: "Admin", icon: Settings, href: "/admin" },
    { id: "dashboard", label: "Team Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  ],
}
```

**The Experience**:

**Employee Sidebar**:
```
Personal
├── My Wellbeing
└── Team Dashboard

Engines
├── Safety Valve
├── Talent Scout
├── Culture Temp
├── Network Graph
└── Simulation
```

**Manager Sidebar**:
```
Management
├── My Wellbeing
├── My Team          ← NEW
└── Team Dashboard

Engines
├── Safety Valve
├── Talent Scout
├── Culture Temp
├── Network Graph
└── Simulation
```

**Admin Sidebar**:
```
Administration
├── My Wellbeing
├── My Team
├── Admin            ← NEW
└── Team Dashboard

Engines
├── Safety Valve
├── Talent Scout
├── Culture Temp
├── Network Graph
└── Simulation
```

**Key Features**:
- Role-specific sections labeled appropriately ("Personal", "Management", "Administration")
- Relevant links only (employees don't see "My Team")
- Direct links to role-based pages (not just view switching)
- Visual hierarchy: Role-specific links first, then engines

## User Flow Examples

### Flow 1: Employee Login

**Before Phase 5**:
1. Employee logs in
2. Redirected to `/dashboard`
3. Sees team analytics (confusing)
4. Has to find "My Wellbeing" section manually
5. Gets lost in manager-focused UI

**After Phase 5**:
1. Employee logs in
2. Redirected to `/me`
3. Immediately sees personal wellbeing dashboard
4. Sidebar shows "My Wellbeing" as primary option
5. Clean, focused experience

### Flow 2: Manager Bookmark

**Before Phase 5**:
1. Manager bookmarks `/dashboard`
2. Opens bookmark next day
3. Sees generic dashboard
4. Has to navigate to team view

**After Phase 5**:
1. Manager bookmarks `/dashboard`
2. Opens bookmark next day
3. Middleware detects role
4. Redirects to `/team`
5. Immediately sees team view

### Flow 3: Unauthorized Access Attempt

**Scenario**: Employee tries to access `/admin`

**Before Phase 5**:
1. Employee types `/admin` in URL
2. Page loads (security hole!)
3. Shows admin UI (even if data is blocked)
4. Confusing error messages

**After Phase 5**:
1. Employee types `/admin` in URL
2. Middleware intercepts request
3. Checks role (employee ≠ admin)
4. Redirects to `/me?error=access_denied`
5. Shows friendly message: "This area is restricted to administrators"

### Flow 4: Role Change

**Scenario**: Engineer gets promoted to Manager

**The Transition**:
1. Admin updates role: employee → manager
2. User refreshes page (or re-logs in)
3. Middleware reads new role
4. Redirects now go to `/team`
5. Sidebar shows "My Team" link
6. Immediate access to new capabilities

## Security Benefits

### 1. Defense in Depth

Even if backend permission checks fail (bug), the middleware provides a first line of defense:

```
Request: GET /admin (by employee)
  ↓
Middleware: "Is this an admin?" → NO
  ↓
Redirect to /me
  ↓
Backend never even sees the request
```

### 2. Principle of Least Surprise

Users only see what they can access:
- No broken links
- No "Access Denied" surprises
- No temptation to try restricted areas

### 3. Audit Trail Alignment

The middleware logs align with backend audit logs:
- Middleware: "Blocked access to /admin (user: employee_123)"
- Backend: "Access denied to /admin/data (user: employee_123)"
- Consistent security posture

## Files Modified

### New Files
1. `frontend/middleware.ts` - Role-based routing middleware

### Modified Files
1. `frontend/contexts/auth-context.tsx`:
   - Added `userRole` state
   - Added role fetching from `/me` endpoint
   - Updated `signIn` to redirect based on role

2. `frontend/components/app-sidebar.tsx`:
   - Added `roleBasedNavItems` object
   - Dynamic navigation based on user role
   - Role indicator in footer
   - Direct links to role-appropriate pages

## Configuration

### Middleware Matcher

```typescript
export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/me/:path*",
    "/team/:path*",
    "/admin/:path*",
  ],
}
```

**What This Means**:
- Middleware runs on all protected routes
- Excludes static files, API routes, login page
- Covers both exact matches and sub-routes

### Route Permissions

```typescript
const ROLE_SPECIFIC_ROUTES = {
  employee: ["/me"],
  manager: ["/me", "/team"],
  admin: ["/me", "/team", "/admin"],
}
```

**Why Not Use Wildcards?**
- Explicit is better than implicit
- Easier to audit
- Prevents accidental access to new routes

## Edge Cases Handled

### 1. Token Expiration

**Scenario**: User's JWT expires while browsing

**Handling**:
1. Middleware tries to decode token
2. Decoding fails (expired)
3. Redirects to `/login`
4. User re-authenticates
5. Back to role-appropriate page

### 2. Role Not in Token

**Scenario**: Legacy user, role field missing

**Handling**:
1. Middleware checks for role
2. Role not found, defaults to "employee"
3. Redirects to `/me`
4. Safest default (least privilege)

### 3. Direct URL Access

**Scenario**: User bookmarks `/team/member/abc123`

**Handling**:
1. User clicks bookmark
2. Middleware checks role
3. If employee: redirect to `/me`
4. If manager: allow access
5. If not their team member: backend blocks (403)

### 4. Server-Side Rendering (SSR)

**Challenge**: Middleware runs on edge, but pages might SSR

**Solution**:
- Middleware handles routing
- Components fetch data client-side
- Auth context provides role for UI decisions
- No role-dependent rendering on server

## Testing the Routing

### Test Scenarios

**Test 1: Employee Access to Root**
```bash
# Request
curl -H "Cookie: sb-access-token=EMPLOYEE_TOKEN" http://localhost:3000/

# Expected: 307 Redirect to /me
```

**Test 2: Manager Access to Dashboard**
```bash
# Request
curl -H "Cookie: sb-access-token=MANAGER_TOKEN" http://localhost:3000/dashboard

# Expected: 307 Redirect to /team
```

**Test 3: Employee Blocked from Admin**
```bash
# Request
curl -H "Cookie: sb-access-token=EMPLOYEE_TOKEN" http://localhost:3000/admin

# Expected: 307 Redirect to /me?error=access_denied
```

**Test 4: No Token**
```bash
# Request
curl http://localhost:3000/me

# Expected: 307 Redirect to /login
```

## The Bottom Line

Phase 5 transforms the user experience from **generic** to **personalized**:

**Before**: One-size-fits-all dashboard
**After**: Role-appropriate default pages

**Before**: Users get lost in irrelevant features  
**After**: Users see exactly what they need

**Before**: Security through backend checks only
**After**: Defense in depth (middleware + backend)

**The Result**: 
- ✅ Happier users (relevant UI)
- ✅ Better security (layered defense)
- ✅ Cleaner code (role-based separation)
- ✅ Easier maintenance (clear boundaries)

## User Experience Summary

| Role | Login Destination | Sidebar Focus | Blocked From |
|------|------------------|---------------|--------------|
| **Employee** | `/me` | Personal wellbeing | `/team`, `/admin` |
| **Manager** | `/team` | Team management | `/admin` |
| **Admin** | `/admin` | System oversight | Nothing |

**The Philosophy**: Every user gets a tailored experience, appropriate to their role and needs.

Onward to Phase 6! 🚀

---

## Quick Reference: Role-Based URLs

| URL | Employee | Manager | Admin |
|-----|----------|---------|-------|
| `/` | Redirects to `/me` | Redirects to `/team` | Redirects to `/admin` |
| `/dashboard` | Redirects to `/me` | Redirects to `/team` | Redirects to `/admin` |
| `/me` | ✅ Access | ✅ Access | ✅ Access |
| `/team` | ❌ Redirect to `/me` | ✅ Access | ✅ Access |
| `/admin` | ❌ Redirect to `/me` | ❌ Redirect to `/team` | ✅ Access |

**Note**: Backend API endpoints have their own RBAC (Phase 1). This table shows frontend routing only.
