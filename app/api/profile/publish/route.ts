import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getUserPlan } from '@/lib/subscription'

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const plan = await getUserPlan(userId)
  if (!plan) return NextResponse.json({ error: 'Plan introuvable' }, { status: 500 })

  // Optionnel : on laisse le front envoyer template/accent/bio pour garantir la cohérence au moment du publish
  const body = (await request.json().catch(() => ({}))) as {
    template?: 'minimal' | 'visual' | 'direct'
    accentColor?: string
    accent_color?: string
    bio?: string
    // Cancellation policy
    allow_cancellations?: boolean
    cancellation_delay?: string
    cancellation_delay_custom_value?: number
    cancellation_delay_custom_unit?: string
    keep_deposit_on_late_cancellation?: boolean
    allow_reschedule?: boolean
    // Receipt settings
    auto_send_receipt_to_client?: boolean
    auto_send_receipt_to_pro?: boolean
    receipt_custom_message?: string
  }

  if (plan !== 'infinity' && body.template && body.template !== 'minimal') {
    return NextResponse.json({ error: 'Template réservé au plan Infinity' }, { status: 403 })
  }
  const accentColor = body.accentColor ?? body.accent_color
  if (plan === 'free' && accentColor && accentColor !== '#7c3aed') {
    return NextResponse.json({ error: 'Palette réservée au plan Premium/Infinity' }, { status: 403 })
  }

  const supabase = createServerSupabaseClient()

  const now = new Date().toISOString()
  const updates: Record<string, unknown> = {}

  // Only set is_published if we're doing a full publish (template/bio fields present)
  if (body.template || body.bio !== undefined || accentColor) {
    updates.is_published = true
    updates.published_at = now
  }

  if (body.template) updates.template = body.template
  if (accentColor) updates.accent_color = accentColor
  if (typeof body.bio === 'string') updates.bio = body.bio

  // Cancellation policy
  if (typeof body.allow_cancellations === 'boolean') updates.allow_cancellations = body.allow_cancellations
  if (body.cancellation_delay) updates.cancellation_delay = body.cancellation_delay
  if (body.cancellation_delay_custom_value !== undefined) updates.cancellation_delay_custom_value = body.cancellation_delay_custom_value
  if (body.cancellation_delay_custom_unit) updates.cancellation_delay_custom_unit = body.cancellation_delay_custom_unit
  if (typeof body.keep_deposit_on_late_cancellation === 'boolean') updates.keep_deposit_on_late_cancellation = body.keep_deposit_on_late_cancellation
  if (typeof body.allow_reschedule === 'boolean') updates.allow_reschedule = body.allow_reschedule

  // Receipt settings
  if (typeof body.auto_send_receipt_to_client === 'boolean') updates.auto_send_receipt_to_client = body.auto_send_receipt_to_client
  if (typeof body.auto_send_receipt_to_pro === 'boolean') updates.auto_send_receipt_to_pro = body.auto_send_receipt_to_pro
  if (typeof body.receipt_custom_message === 'string') updates.receipt_custom_message = body.receipt_custom_message

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ success: true, published_at: now })
  }

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)

  if (error) {
    console.error('profile/publish:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, published_at: now })
}

