import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { createServerSupabaseClient } from '@/lib/supabase-server'
 
const clerkWebhookSecret = process.env.CLERK_WEBHOOK_SECRET
 
export async function POST(req: Request) {
  console.log('🎣 WEBHOOK CALLED')
  
  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')
 
  console.log('🔐 svix_id:', svix_id ? 'present' : 'missing')
 
  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.log('❌ Missing svix headers')
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
    console.log('✅ Webhook verified')
  } catch (err) {
    console.error('❌ Error verifying webhook:', err)
    return new Response('Error occured', { status: 400 })
  }
 
  const eventType = evt.type
  const { data } = evt
 
  console.log('📨 eventType:', eventType)
 
  if (eventType === 'user.created') {
    const { id, email_addresses, first_name, last_name, unsafe_metadata } = data
    
    // DEBUG: voir la structure exacte
    console.log('📊 FULL DATA:', JSON.stringify(data, null, 2))
    console.log('📧 email_addresses:', JSON.stringify(email_addresses, null, 2))
    
    // Essayer différentes façons de récupérer l'email
    let email = email_addresses?.[0]?.email_address
    
    // Si toujours pas d'email, retourner une erreur
    if (!email) {
      console.error('❌ Pas d\'email trouvé dans Clerk data')
      console.error('email_addresses structure:', JSON.stringify(email_addresses))
      return NextResponse.json({ 
        error: 'Pas d\'email fourni par Clerk' 
      }, { status: 400 })
    }
    
    const fullName = [first_name, last_name].filter(Boolean).join(' ')
 
    console.log('👤 user.id:', id)
    console.log('📧 email:', email)
    console.log('🏷️ unsafe_metadata:', unsafe_metadata)
 
    // Déterminer le rôle depuis les metadata (par défaut 'pro')
    const role = unsafe_metadata?.role === 'client' ? 'client' : 'pro'
    console.log('🎯 role:', role)
 
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
      console.error('❌ Erreur création profil Supabase:', error)
      return NextResponse.json({ error: 'Erreur création profil' }, { status: 500 })
    }
 
    console.log(`✅ Profil créé pour ${email} (ID: ${id}, rôle: ${role})`)
  }
 
  return NextResponse.json({ received: true })
}