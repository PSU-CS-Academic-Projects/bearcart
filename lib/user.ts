import { createClient } from '@/lib/supabase-server'

/**
 * Checks if the current user still needs to complete the onboarding setup.
 * Returns true  → setup is needed  (college is null/empty)
 * Returns false → setup is done    (college is already set)
 */
export async function checkUserSetup(): Promise<boolean> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return false // not logged in – let middleware handle this

  const { data, error } = await supabase
    .from('users')
    .select('college')
    .eq('id', user.id)
    .single()

  if (error || !data) return true // row missing → treat as needing setup

  return !data.college // true if college is null / empty string
}
