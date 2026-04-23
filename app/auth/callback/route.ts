import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')

    if (code) {
        const supabase = await createClient()

        // exchangeCodeForSession returns the session + user directly —
        // no need for a second getUser() call that would miss the new cookies.
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)

        if (error || !data.user) {
            console.error('OAuth callback error:', error?.message)
            return NextResponse.redirect(`${origin}/`)
        }

        // Use the same authenticated client to query the users table.
        const { data: userData } = await supabase
            .from('users')
            .select('college')
            .eq('id', data.user.id)
            .single()

        const needsSetup = !userData?.college

        return NextResponse.redirect(
            needsSetup ? `${origin}/setup` : `${origin}/listings`
        )
    }

    // No code in URL — something went wrong with the OAuth flow
    return NextResponse.redirect(`${origin}/`)
}