import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { normalizeBookingPaymentSettings } from '@/lib/booking-payment-settings'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const username = searchParams.get('username')?.trim()
  if (!username) {
    console.log('[booking-settings] ❌ username manquant')
    return NextResponse.json({ error: 'username requis' }, { status: 400 })
  }

  console.log(`[booking-settings] 🔍 Recherche du pro: ${username}`)

  const supabase = createServerSupabaseClient()
  
  // Vérifier d'abord si le profil existe (sans les colonnes de paiement)
  const { data: basicProfile, error: basicError } = await supabase
    .from('profiles')
    .select('id, username, full_name')
    .ilike('username', username)
    .maybeSingle()

  if (basicError) {
    console.error(`[booking-settings] ❌ Erreur Supabase basic pour ${username}:`, basicError)
    return NextResponse.json({ error: 'Erreur base de données', details: basicError.message }, { status: 500 })
  }

  if (!basicProfile) {
    console.error(`[booking-settings] ❌ Profil introuvable: ${username}`)
    return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })
  }

  // Maintenant récupérer les settings de paiement
  const { data: profile, error } = await supabase
    .from('profiles')
    .select(
      'username, full_name, online_payment_enabled, deposit_required, deposit_type, deposit_value, allow_full_online_payment'
    )
    .ilike('username', username)
    .maybeSingle()

  if (error) {
    console.error(`[booking-settings] ❌ Erreur Supabase settings pour ${username}:`, error)
    // Retourner des valeurs par défaut si les colonnes n'existent pas
    return NextResponse.json({
      username: basicProfile.username,
      professionalName: basicProfile.full_name,
      online_payment_enabled: false,
      deposit_required: false,
      deposit_type: 'percent',
      deposit_value: 25,
      allow_full_online_payment: false,
      error: 'Colonnes de paiement manquantes - valeurs par défaut utilisées'
    })
  }

  if (!profile) {
    console.error(`[booking-settings] ❌ Profil introuvable: ${username}`)
    return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })
  }

  console.log(`[booking-settings] ✅ Profil trouvé: ${username}`, {
    online_payment_enabled: profile.online_payment_enabled,
    deposit_required: profile.deposit_required,
  })

  const settings = normalizeBookingPaymentSettings(profile)

  console.log(`[booking-settings] ⚙️ Settings normalisés:`, settings)

  return NextResponse.json({
    username: profile.username,
    professionalName: profile.full_name,
    ...settings,
  })
}
