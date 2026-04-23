import { collectSegmentData } from 'next/dist/server/app-render/collect-segment-data'
import { supabase } from './supabase'

// SSO google
export async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${window.location.origin}/auth/callback`,
            queryParams: {
                hd: 'psu.palawan.edu.ph' //palsu accounts
            }
        }
    })

    if (error) {
        console.error('Login error:', error.message)
    }
}

// Sign Out
export async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) {
        console.error('Signout error:', error.message)
    }
}

// Get current logged in user
export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export function isPSUEmail(email: string) {
    return email.endsWith('@psu.palawan.edu.ph')
}
