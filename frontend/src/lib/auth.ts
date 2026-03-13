import { supabase } from './supabase'

export async function signUp(
  email: string,
  password: string,
  username: string,
  displayName: string,
  referralCode?: string,
) {
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) throw error

  const userId = data.user?.id
  if (!userId) throw new Error('No user returned from signUp')

  // Resolve referral code → referrer's profile id
  let referredBy: string | null = null
  if (referralCode) {
    const { data: referrer } = await supabase
      .from('profiles')
      .select('id')
      .eq('referral_code', referralCode.toUpperCase())
      .maybeSingle()
    referredBy = referrer?.id ?? null
  }

  const { error: profileError } = await supabase.from('profiles').insert({
    id: userId,
    username,
    avatar_url: null,
    display_name: displayName,
    referred_by: referredBy,
  })
  if (profileError) throw profileError
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
