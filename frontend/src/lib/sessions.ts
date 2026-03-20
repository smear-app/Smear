import { supabase } from './supabase'
import { SESSION_THRESHOLD_MS } from './logbook'

async function findActiveSession(
  userId: string,
  gymId: string | null,
  thresholdTime: string,
): Promise<string | null> {
  let query = supabase
    .from('sessions')
    .select('id')
    .eq('user_id', userId)
    .gt('ended_at', thresholdTime)
    .order('ended_at', { ascending: false })
    .limit(1)

  query = gymId ? query.eq('gym_id', gymId) : query.is('gym_id', null)

  const { data, error } = await query
  if (error) throw error
  return data?.[0]?.id ?? null
}

export async function getOrCreateSession(
  userId: string,
  gymId: string | null,
  gymName: string | null,
): Promise<string> {
  const thresholdTime = new Date(Date.now() - SESSION_THRESHOLD_MS).toISOString()

  const existing = await findActiveSession(userId, gymId, thresholdTime)
  if (existing) return existing

  const { data: newSession, error: insertError } = await supabase
    .from('sessions')
    .insert({ user_id: userId, gym_id: gymId, gym_name: gymName })
    .select('id')
    .single()

  if (!insertError) return newSession.id

  // Log the full error so we can diagnose the constraint being violated
  console.error('[sessions] insert failed', {
    code: insertError.code,
    message: insertError.message,
    details: insertError.details,
    hint: insertError.hint,
    payload: { user_id: userId, gym_id: gymId, gym_name: gymName },
  })

  // Conflict — another concurrent insert won the race; fetch whichever is newest
  const retry = await findActiveSession(userId, gymId, thresholdTime)
  if (retry) return retry

  throw insertError
}

export async function touchSession(sessionId: string): Promise<void> {
  const { error } = await supabase
    .from('sessions')
    .update({ ended_at: new Date().toISOString() })
    .eq('id', sessionId)

  if (error) throw error
}
