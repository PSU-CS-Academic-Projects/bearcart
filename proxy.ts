import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export default async function proxy(request: NextRequest) {
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
          cookiesToSet.forEach(({ name, value }) =>
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

  // Refresh session — keeps cookies alive
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Auth routes are always accessible — OAuth flow must never be blocked
  const isAuthRoute = pathname.startsWith('/auth')

  // Public routes accessible without login
  const isPublicRoute = pathname === '/' || pathname === '/listings' || pathname.startsWith('/listings/') || (pathname.startsWith('/profile/') && pathname !== '/profile/')

  // If not logged in, only allow public pages + auth routes
  if (!user && !isAuthRoute && !isPublicRoute) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // For logged-in users, enforce setup on every route except /auth/*
  if (user && !isAuthRoute) {
    const { data: userData } = await supabase
      .from('users')
      .select('college')
      .eq('id', user.id)
      .single()

    const needsSetup = !userData || !userData.college

    // Needs setup → force to /setup (even from homepage)
    if (needsSetup && pathname !== '/setup') {
      return NextResponse.redirect(new URL('/setup', request.url))
    }

    // Already set up → block going back to /setup
    if (!needsSetup && pathname === '/setup') {
      return NextResponse.redirect(new URL('/listings', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
