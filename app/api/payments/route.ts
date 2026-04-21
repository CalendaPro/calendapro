import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { auth } from '@clerk/nextjs/server'

export async function GET(request: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1', 10)
  const limit = parseInt(searchParams.get('limit') || '10', 10)
  const status = searchParams.get('status')

  const offset = (page - 1) * limit

  try {
    const supabase = createServerSupabaseClient()

    // Get the user's profile to find their user_id in the profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Build the query for payments
    let query = supabase
      .from('payments')
      .select('*', { count: 'exact' })
      .eq('pro_id', profile.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: payments, error, count } = await query

    if (error) {
      console.error('Error fetching payments:', error)
      return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })
    }

    // Transform the data to match the frontend interface
    const transformedPayments = payments.map(p => ({
      id: p.id,
      date: p.created_at,
      client_name: p.client_name || p.client_email || 'Client',
      client_email: p.client_email || '',
      amount: p.amount || 0,
      type: p.type || 'deposit',
      status: p.status || 'paid',
    }))

    return NextResponse.json({
      payments: transformedPayments,
      total: count || 0,
      page,
      limit,
    })
  } catch (error) {
    console.error('Unexpected error in payments API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
