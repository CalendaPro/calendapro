import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import WidgetBookingForm from './WidgetBookingForm'

export default async function WidgetPage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single()

  if (!profile) notFound()

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', padding: '16px', maxWidth: '400px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div style={{
          width: '56px', height: '56px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontWeight: 'bold', fontSize: '20px',
          margin: '0 auto 12px'
        }}>
          {profile.full_name?.charAt(0) ?? username.charAt(0).toUpperCase()}
        </div>
        <h2 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
          {profile.full_name ?? username}
        </h2>
        {profile.bio && (
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>{profile.bio}</p>
        )}
      </div>
      <WidgetBookingForm username={username} professionalName={profile.full_name ?? username} />
    </div>
  )
}