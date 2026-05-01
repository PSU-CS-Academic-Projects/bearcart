import { supabase } from './supabase'
import { toast } from 'sonner'

// SSO google
export async function signInWithGoogle() {
    try {
        const redirectUrl = `${window.location.origin}/auth/callback`
        console.log('SSO redirect URL:', redirectUrl)

        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: redirectUrl,
                queryParams: {
                    hd: 'psu.palawan.edu.ph' //palsu accounts
                }
            }
        })

        if (error) {
            console.error('Login error:', error.message)
            toast.error(`Login error: ${error.message}`)
            alert(`Login error: ${error.message}`)
        } else {
            console.log('OAuth response:', data)
            // If signInWithOAuth didn't auto-redirect, manually redirect
            if (data?.url) {
                window.location.href = data.url
            }
        }
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error('SSO exception:', msg)
        toast.error(`SSO exception: ${msg}`)
        alert(`SSO exception: ${msg}`)
    }
}

// Sign Out
export async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) {
        console.error('Signout error:', error.message)
    }
    // Hard redirect so server components re-render with cleared auth
    window.location.href = '/'
}

// Get current logged in user
export async function getUser() {
    const { data: { user } } = await supabase.auth.getUser()
    return user
}

export function isPSUEmail(email: string) {
    return email.endsWith('@psu.palawan.edu.ph')
}
