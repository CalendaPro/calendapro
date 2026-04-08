import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import SMSPageClient from './SMSPageClient'

type SmsLogRow = {
  id: string
  created_at: string
  type: string
  client_name?: string
  credits_used?: number
}

export default async function SMSPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const supabase = createServerSupabaseClient()

  const { data: smsData } = await supabase
    .from('sms_credits')
    .select('credits')
    .eq('user_id', userId)
    .maybeSingle()

  const credits = smsData?.credits ?? 0

  const { data: history } = await supabase
    .from('sms_logs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10)

  const safeHistory = JSON.parse(JSON.stringify(history ?? [])) as SmsLogRow[]

  return <SMSPageClient credits={credits} history={safeHistory} />
}
