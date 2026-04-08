import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { createServerSupabaseClient } from '@/lib/supabase-server'

const clerkWebhookSecret = process.env.CLERK_WEBHOOK_SECRET

export async function POST(req: Request) {
  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured', { status: 400 })
  }

  const payload = await req.json()
  const body = JSON.stringify(payload)

  const wh = new Webhook(clerkWebhookSecret || '')
  let evt: any

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    })
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return new Response('Error occured', { status: 400 })
  }

  const eventType = evt.type
  const { data } = evt

  if (eventType === 'user.created') {
    const { id, email_addresses, first_name, last_name, unsafe_metadata } = data
    const email = email_addresses[0]?.email_address
    const fullName = [first_name, last_name].filter(Boolean).join(' ')

    // Déterminer le rôle depuis les metadata (par défaut 'pro')
    const role = unsafe_metadata?.role === 'client' ? 'client' : 'pro'

    const supabase = createServerSupabaseClient()
    
    // Créer le profil dans Supabase avec le rôle approprié
    const { error } = await supabase.from('profiles').insert({
      id,
      email,
      full_name: fullName || null,
      role,
      onboarding_completed: role === 'client', // Les clients n'ont pas d'onboarding
    })

    if (error) {
      console.error('Erreur création profil Supabase:', error)
      return NextResponse.json({ error: 'Erreur création profil' }, { status: 500 })
    }

    console.log(`✅ Profil créé pour ${email} (ID: ${id}, rôle: ${role})`)
  }

  return NextResponse.json({ received: true })
}
