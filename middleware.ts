import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  // Public routes - allow access
  const publicPaths = [
    '/api/auth',
    '/login',
    '/register',
    '/',
    '/journal',
    '/entry/'
  ]
  
  const isPublicPath = publicPaths.some(path => 
    req.nextUrl.pathname.startsWith(path)
  )
  
  if (isPublicPath) {
    return NextResponse.next()
  }

  // Pilgrim-only routes - require authentication and PILGRIM role
  if (req.nextUrl.pathname.startsWith('/pilgrim')) {
    if (!req.auth) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    
    if (req.auth.user.role !== 'PILGRIM') {
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}