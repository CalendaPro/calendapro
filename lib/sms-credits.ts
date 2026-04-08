import { createServerSupabaseClient } from './supabase-server'

export async function getUserCredits(userId: string): Promise<number> {
  const supabase = createServerSupabaseClient()
  const { data } = await supabase
    .from('sms_credits')
    .select('credits')
    .eq('user_id', userId)
    .single()

  return data?.credits ?? 0
}

export async function consumeCredit(userId: string): Promise<boolean> {
  const supabase = createServerSupabaseClient()
  const { data } = await supabase
    .from('sms_credits')
    .select('credits, total_used')
    .eq('user_id', userId)
    .single()

  if (!data || data.credits <= 0) return false

  await supabase
    .from('sms_credits')
    .update({
      credits: data.credits - 1,
      total_used: data.total_used + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)

  return true
}

export async function addCredits(userId: string, amount: number): Promise<void> {
  const supabase = createServerSupabaseClient()
  const { data: row, error: selErr } = await supabase
    .from('sms_credits')
    .select('credits')
    .eq('user_id', userId)
    .maybeSingle()

  if (selErr) {
    console.error('addCredits select', selErr)
    throw selErr
  }

  if (!row) {
    const { error: insErr } = await supabase.from('sms_credits').insert({
      user_id: userId,
      credits: amount,
      total_used: 0,
    })
    if (insErr?.code === '23505') {
      await addCredits(userId, amount)
      return
    }
    if (insErr) {
      console.error('addCredits insert', insErr)
      throw insErr
    }
    return
  }

  const { error: updErr } = await supabase
    .from('sms_credits')
    .update({
      credits: row.credits + amount,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)

  if (updErr) {
    console.error('addCredits update', updErr)
    throw updErr
  }
}

// ✅ Nouvelle fonction — remet les crédits à un montant fixe
// Utilisée pour les renouvellements mensuels (pas d'accumulation)
export async function resetCredits(userId: string, amount: number): Promise<void> {
  const supabase = createServerSupabaseClient()
  const { data } = await supabase
    .from('sms_credits')
    .select('total_used')
    .eq('user_id', userId)
    .single()

  if (!data) {
    // Première fois — on crée la ligne
    await supabase.from('sms_credits').insert({
      user_id: userId,
      credits: amount,
      total_used: 0,
    })
  } else {
    // On remet à `amount` sans toucher à total_used (historique conservé)
    await supabase
      .from('sms_credits')
      .update({
        credits: amount,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
  }
}