import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Accessible without being logged in at all
function isPublicRoute(pathname: string): boolean {
  return (
    pathname === '/' ||
    pathname === '/listings' ||
    pathname.startsWith('/listings/') ||
    pathname === '/requests' ||
    pathname.startsWith('/requests/') ||
    pathname === '/privacy-policy' ||
    pathname === '/terms-of-service'
  )
}

// Exempt from onboarding enforcement even when logged in
// (keeps the OAuth flow and onboarding pages from redirect-looping)
function isOnboardingExempt(pathname: string): boolean {
  return (
    pathname.startsWith('/auth/') ||
    pathname === '/setup' ||
    pathname === '/consent' ||
    pathname === '/privacy-policy' ||
    pathname === '/terms-of-service' ||
    pathname.startsWith('/api/')
  )
}

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

  // Refresh session — required by @supabase/ssr to keep cookies alive
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Not logged in → allow public routes, block everything else
  if (!user) {
    if (isPublicRoute(pathname) || pathname.startsWith('/auth/')) {
      return supabaseResponse
    }
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Logged in + onboarding exempt → skip DB check entirely
  if (isOnboardingExempt(pathname)) {
    return supabaseResponse
  }

  // Logged in + all other routes → enforce onboarding completion
  const { data: userData } = await supabase
    .from('users')
    .select('college, terms_accepted')
    .eq('id', user.id)
    .single()

  const returnTo = encodeURIComponent(pathname + request.nextUrl.search)

  if (!userData?.college) {
    return NextResponse.redirect(new URL(`/setup?returnTo=${returnTo}`, request.url))
  }

  if (!userData.terms_accepted) {
    return NextResponse.redirect(new URL(`/consent?returnTo=${returnTo}`, request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
