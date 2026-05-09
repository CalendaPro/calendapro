import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { step, stepData, isCompleted = false } = body

  // Validation
  if (!step || step < 1 || step > 4) {
    return NextResponse.json({ error: 'Invalid step number' }, { status: 400 })
  }

  if (!stepData || typeof stepData !== 'object') {
    return NextResponse.json({ error: 'Invalid step data' }, { status: 400 })
  }

  const supabase = createServerSupabaseClient()

  try {
    // Utiliser la fonction SQL pour sauvegarder l'étape
    const { data, error } = await supabase.rpc('save_onboarding_step', {
      p_user_id: userId,
      p_step: step,
      p_step_data: stepData,
      p_is_completed: isCompleted,
    })

    if (error) {
      logger.error('Error saving onboarding step:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      id: data,
      step,
      isCompleted 
    })
  } catch (err) {
    logger.error('Unexpected error saving onboarding step:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET: Récupérer le progrès de l'onboarding
export async function GET(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerSupabaseClient()

  try {
    const { data, error } = await supabase.rpc('get_onboarding_progress', {
      p_user_id: userId,
    })

    if (error) {
      logger.error('Error fetching onboarding progress:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      progress: data 
    })
  } catch (err) {
    logger.error('Unexpected error fetching onboarding progress:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
