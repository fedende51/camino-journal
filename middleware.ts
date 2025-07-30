import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    // Pilgrim-only routes - require authentication and PILGRIM role
    if (req.nextUrl.pathname.startsWith('/pilgrim')) {
      if (req.nextauth.token?.role !== 'PILGRIM') {
        return NextResponse.redirect(new URL('/login', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Public routes - no authentication required
        if (req.nextUrl.pathname.startsWith('/api/auth') || 
            req.nextUrl.pathname === '/login' || 
            req.nextUrl.pathname === '/register' ||
            req.nextUrl.pathname === '/' ||
            req.nextUrl.pathname.startsWith('/journal') ||
            req.nextUrl.pathname.startsWith('/entry/')) {
          return true
        }

        // Protected routes - require authentication
        if (req.nextUrl.pathname.startsWith('/pilgrim')) {
          return !!token
        }

        // Default to allowing access
        return true
      },
    },
  }
)

export const config = {
  matcher: [
    '/pilgrim/:path*',
  ],
}