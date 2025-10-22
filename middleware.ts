import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Temporarily restrict protection to admin-only to avoid redirect interference
const protectedRoutes = [
  '/admin'
]

const authOnlyRoutes: string[] = []
const publicRoutes = ['/', '/privacy', '/terms', '/delete-account']

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  
  const pathname = req.nextUrl.pathname
  
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return res
  }

  try {
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) {
      const response = NextResponse.next()
      response.cookies.delete('sb-access-token')
      response.cookies.delete('sb-refresh-token')
      return response
    }

    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

    if (isProtectedRoute && !session) {
      const redirectUrl = new URL('/', req.url)
      redirectUrl.searchParams.set('redirected', 'true')
      return NextResponse.redirect(redirectUrl)
    }

    return res
  } catch {
    return res
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api).*)',
  ],
}

