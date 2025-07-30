import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    // Pilgrim-only routes
    if (req.nextUrl.pathname.startsWith('/pilgrim')) {
      if (req.nextauth.token?.role !== 'PILGRIM') {
        return NextResponse.redirect(new URL('/login', req.url))
      }
    }

    // Family routes (publicly accessible)
    if (req.nextUrl.pathname.startsWith('/journal')) {
      // Allow access to family viewing pages
      return NextResponse.next()
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to public routes
        if (req.nextUrl.pathname.startsWith('/api/auth') || 
            req.nextUrl.pathname === '/login' || 
            req.nextUrl.pathname === '/register' ||
            req.nextUrl.pathname === '/' ||
            req.nextUrl.pathname.startsWith('/journal')) {
          return true
        }

        // For protected routes, check if user is authenticated
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico|login|register).*)',
  ],
}