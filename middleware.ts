import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define which routes require authentication
const protectedRoutes = [
  '/dashboard',
  '/predictions',
  '/trends',
  '/settings',
  '/admin',
  '/professor-lock',
  '/games',
  '/cheat-sheets'
]

// Define which routes are only for non-authenticated users
const authOnlyRoutes = ['/signin', '/signup']

// Define public routes that anyone can access
const publicRoutes = ['/', '/privacy', '/terms', '/delete-account']

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  
  const pathname = req.nextUrl.pathname
  
  // Skip middleware for static files, API routes, and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') // Files with extensions
  ) {
    return res
  }

  try {
    // Refresh session if expired - required for Server Components
    const { data: { session }, error } = await supabase.auth.getSession()
    
    // Log for debugging
    console.log('[Middleware]', {
      path: pathname,
      hasSession: !!session,
      error: error?.message
    })

    // If there's an error getting the session, clear cookies and redirect to home
    if (error) {
      console.error('[Middleware] Session error:', error)
      const response = NextResponse.redirect(new URL('/', req.url))
      // Clear auth cookies
      response.cookies.delete('sb-access-token')
      response.cookies.delete('sb-refresh-token')
      return response
    }

    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
    const isAuthOnlyRoute = authOnlyRoutes.includes(pathname)
    const isPublicRoute = publicRoutes.includes(pathname)

    // Protect routes that require authentication
    if (isProtectedRoute && !session) {
      console.log('[Middleware] Protected route without session, redirecting to home')
      const redirectUrl = new URL('/', req.url)
      redirectUrl.searchParams.set('redirected', 'true')
      return NextResponse.redirect(redirectUrl)
    }

    // Redirect authenticated users away from auth pages
    if (isAuthOnlyRoute && session) {
      console.log('[Middleware] Auth route with session, redirecting to dashboard')
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    return res
  } catch (error) {
    console.error('[Middleware] Unexpected error:', error)
    // On any error, allow the request to continue but log it
    return res
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api).*)',
  ],
}

