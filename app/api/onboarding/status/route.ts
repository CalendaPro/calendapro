import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServerSupabaseClient()

  try {
    // Fetch profile data
    const { data: profile } = await supabase
      .from('profiles')
      .select('avatar_url, onboarding_completed, stripe_connect_onboarding, is_published')
      .eq('id', userId)
      .single()

    // Fetch services count
    const { data: services } = await supabase
      .from('services')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)

    // Fetch schedule data
    const { data: scheduleData } = await supabase
      .from('profiles')
      .select('schedule')
      .eq('id', userId)
      .single()

    // Check if user has any bookings (indicates they've been shared/active)  // reason: unavoidable dynamic type boundary
    const { data: bookings } = await supabase
      .from('bookings')
      .select('id', { count: 'exact' })
      .eq('pro_id', userId)
      .limit(1)

    // Determine if schedule is configured
    const hasSchedule = scheduleData?.schedule && 
      Object.values(scheduleData.schedule as Record<string, { isOpen: boolean }>)
        .some(day => day?.isOpen)

    const status = {
      hasPhoto: !!profile?.avatar_url,
      hasServices: (services?.length ?? 0) > 0,
      hasSchedule: !!hasSchedule,
      isPublished: profile?.is_published ?? false,
      hasStripeConnect: profile?.stripe_connect_onboarding ?? false,
      hasShared: (bookings?.length ?? 0) > 0,
      onboardingCompleted: profile?.onboarding_completed ?? false,
    }

    return NextResponse.json(status)
  } catch (error) {
    logger.error('Error fetching onboarding status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch onboarding status' },
      { status: 500 }
    )
  }
}
