import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { checkUserSetup } from '@/lib/user'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')

    if (code) {
        const supabase = await createClient()
        await supabase.auth.exchangeCodeForSession(code)

        // Check if the user needs onboarding setup
        const needsSetup = await checkUserSetup()
        if (needsSetup) {
            return NextResponse.redirect(`${origin}/setup`)
        }
        return NextResponse.redirect(`${origin}/listings`)
    }

    // Fallback — something went wrong with the OAuth flow
    return NextResponse.redirect(`${origin}/`)
}