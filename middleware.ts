import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(_request: NextRequest) {
  // Temporarily disable authentication middleware until NextAuth is fully configured
  // This allows the site to function while we set up the authentication system
  
  // For now, just allow all requests to pass through
  return NextResponse.next()
  
  /* TODO: Re-enable after NextAuth configuration is complete
  const session = await auth()
  const { pathname } = request.nextUrl

  // Allow public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Redirect unauthenticated users to login
  if (!session?.user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Check role-based access using the new helper functions
  if (!canAccessRoute(session, pathname)) {
    // User doesn't have access, redirect to their default dashboard
    const defaultPath = getDefaultRedirectPath(session)
    return NextResponse.redirect(new URL(defaultPath, request.url))
  }

  return NextResponse.next()
  */
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)']
}