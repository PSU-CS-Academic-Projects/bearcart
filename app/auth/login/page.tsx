'use client'

import { signInWithGoogle } from '@/lib/auth'

export default function LoginPage() {
  return (
    <div>
      <h1>Welcome to PalMart</h1>
      <p>Login with your PSU Google account</p>

      <button onClick={signInWithGoogle}>
        Continue with Google
      </button>

      <p>Only @psu.palawan.edu.ph accounts are allowed</p>
    </div>
  )
}