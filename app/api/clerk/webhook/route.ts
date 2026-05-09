import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { ensureProfile } from '@/lib/auth/ensure-profile'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'
 
const clerkWebhookSecret = process.env.CLERK_WEBHOOK_SECRET
 
export async function POST(req: Request) {
 logger.info(' WEBHOOK CALLED')
  
  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')
 
 logger.info(' svix_id:', svix_id ? 'present' : 'missing')
 
  if (!svix_id || !svix_timestamp || !svix_signature) {
 logger.info(' Missing svix headers')
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
 logger.info(' Webhook verified')
  } catch (err) {
 logger.error(' Error verifying webhook:', err)
    return new Response('Error occured', { status: 400 })
  }
 
  const eventType = evt.type
  const { data } = evt

  logger.info(' eventType:', eventType)

  if (eventType === 'user.created') {
    const { id, email_addresses, first_name, last_name, unsafe_metadata } = data

    const email = email_addresses?.[0]?.email_address as string | undefined
    const fullName = [first_name, last_name].filter(Boolean).join(' ') || null
    const role: 'pro' | 'client' = unsafe_metadata?.role === 'client' ? 'client' : 'pro'

    logger.info(` user.created → id=${id} role=${role} email=${email}`)

    try {
      await ensureProfile(id, {
        role,
        emailOverride: email,
        fullNameOverride: fullName ?? undefined,
      })
      logger.info(` ensureProfile OK pour ${id}`)
    } catch (err) {
      logger.error(' ensureProfile failed in webhook:', err)
      return NextResponse.json({ error: 'Profile creation failed' }, { status: 500 })
    }
  }

  return NextResponse.json({ received: true })
}