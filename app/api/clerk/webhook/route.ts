import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { ensureProfile } from '@/lib/auth/ensure-profile'
 
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

  console.log(' eventType:', eventType)

  if (eventType === 'user.created') {
    const { id, email_addresses, first_name, last_name, unsafe_metadata } = data

    const email = email_addresses?.[0]?.email_address as string | undefined
    const fullName = [first_name, last_name].filter(Boolean).join(' ') || null
    const role: 'pro' | 'client' = unsafe_metadata?.role === 'client' ? 'client' : 'pro'

    console.log(` user.created → id=${id} role=${role} email=${email}`)

    try {
      await ensureProfile(id, {
        role,
        emailOverride: email,
        fullNameOverride: fullName ?? undefined,
      })
      console.log(` ensureProfile OK pour ${id}`)
    } catch (err) {
      console.error(' ensureProfile failed in webhook:', err)
      return NextResponse.json({ error: 'Profile creation failed' }, { status: 500 })
    }
  }

  return NextResponse.json({ received: true })
}