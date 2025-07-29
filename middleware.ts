import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { canAccessRoute, getDefaultRedirectPath } from '@/lib/roles'

// Public routes that don't require authentication
const publicRoutes = [
  '/',
  '/products',
  '/braiders',
  '/login',
  '/register',
  '/register-braider',
  '/auth',
  '/api/auth',
  '/api/braiders',
  '/api/products',
  '/_next',
  '/favicon.ico'
]

// Admin-only routes
const adminRoutes = [
  '/dashboard',
  '/admin'
]

// Braider-only routes
const braiderRoutes = [
  '/braider-dashboard'
]

// Protected routes that require authentication
const protectedRoutes = [
  '/cart',
  '/checkout',
  '/profile',
  '/orders',
  '/favorites'
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Get the session
  const session = await auth()

  // Redirect unauthenticated users to login for protected routes
  if (!session?.user) {
    if (protectedRoutes.some(route => pathname.startsWith(route)) ||
        adminRoutes.some(route => pathname.startsWith(route)) ||
        braiderRoutes.some(route => pathname.startsWith(route))) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }
    return NextResponse.next()
  }

  // Check role-based access for admin routes
  if (adminRoutes.some(route => pathname.startsWith(route))) {
    if (session.user.role !== 'admin') {
      const defaultPath = getDefaultRedirectPath(session)
      return NextResponse.redirect(new URL(defaultPath, request.url))
    }
  }

  // Check role-based access for braider routes
  if (braiderRoutes.some(route => pathname.startsWith(route))) {
    if (session.user.role !== 'braider' && session.user.role !== 'admin') {
      const defaultPath = getDefaultRedirectPath(session)
      return NextResponse.redirect(new URL(defaultPath, request.url))
    }
  }

  // Use the general role-based access check for any other route
  if (!canAccessRoute(session, pathname)) {
    const defaultPath = getDefaultRedirectPath(session)
    return NextResponse.redirect(new URL(defaultPath, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)']
}