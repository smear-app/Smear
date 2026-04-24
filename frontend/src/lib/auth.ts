import { postRegister } from './api'
import { supabase } from './supabase'

export class AccessRequiredError extends Error {
  email: string

  constructor(email: string) {
    super('This email needs an invite before you can register.')
    this.name = 'AccessRequiredError'
    this.email = email
  }
}

export async function signUp(
  email: string,
  password: string,
  username: string,
  displayName: string,
  referralCode?: string,
) {
  try {
    await postRegister({
      email,
      password,
      username,
      display_name: displayName,
      referral_code: referralCode ?? null,
    })
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('403') &&
      error.message.includes('This email has not been invited yet.')
    ) {
      throw new AccessRequiredError(email)
    }
    throw error
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
}

export async function signIn(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function fetchReferralCode(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('referral_code')
    .eq('id', userId)
    .single()
  if (error) throw error
  return data?.referral_code ?? null
}
