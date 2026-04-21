import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function AppointmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { userId } = await auth()

  const { data: apt } = await supabase
    .from('bookings')
    .select('*, client_profiles(*)')
    .eq('id', id)
    .eq('pro_id', userId)
    .single()

  if (!apt) notFound()

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <Link href="/dashboard/appointments" className="text-sm text-violet-600 hover:underline mb-4 inline-block">
          ← Retour aux rendez-vous
        </Link>
        <h1 className="text-3xl font-bold text-stone-900 tracking-tight">{apt.service_name}</h1>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm mb-4">
        <h2 className="font-semibold text-stone-900 mb-4">Détails</h2>
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center py-3 border-b border-stone-100">
            <span className="text-stone-400 text-sm">Service</span>
            <span className="font-medium text-stone-900">{apt.service_name}</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-stone-100">
            <span className="text-stone-400 text-sm">Date</span>
            <span className="font-medium text-stone-900">
              {new Date(apt.scheduled_at).toLocaleDateString('fr-FR', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
              })}
            </span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-stone-100">
            <span className="text-stone-400 text-sm">Durée</span>
            <span className="font-medium text-stone-900">{apt.duration_minutes} minutes</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-stone-100">
            <span className="text-stone-400 text-sm">Statut</span>
            <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
              apt.status === 'upcoming' ? 'bg-emerald-50 text-emerald-600' : 
              apt.status === 'completed' ? 'bg-blue-50 text-blue-600' :
              apt.status === 'cancelled' ? 'bg-red-50 text-red-600' :
              'bg-amber-50 text-amber-600'
            }`}>
              {apt.status === 'upcoming' ? 'Confirmé' : 
               apt.status === 'completed' ? 'Terminé' :
               apt.status === 'cancelled' ? 'Annulé' :
               apt.status === 'no_show' ? 'Absent' : 'En attente'}
            </span>
          </div>
          {apt.notes && (
            <div className="flex justify-between items-center py-3 border-b border-stone-100">
              <span className="text-stone-400 text-sm">Notes</span>
              <span className="font-medium text-stone-900">{apt.notes}</span>
            </div>
          )}
        </div>
      </div>

      {apt.client_profiles && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm mb-4">
          <h2 className="font-semibold text-stone-900 mb-4">Client</h2>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-pink-50 flex items-center justify-center text-pink-600 font-bold text-lg">
              {(apt.pro_name || apt.client_profiles.name || 'C').charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="font-semibold text-stone-900">{apt.pro_name || apt.client_profiles.name}</div>
              {apt.client_profiles.email && <div className="text-stone-400 text-sm">{apt.client_profiles.email}</div>}
              {apt.client_profiles.phone && <div className="text-stone-400 text-sm">{apt.client_profiles.phone}</div>}
            </div>
          </div>
        </div>
      )}

      {/* Actions - simplified, no more manual confirm needed */}
      <div className="flex gap-3">
        {apt.status !== 'cancelled' && apt.status !== 'completed' && (
          <CancelButton id={apt.id} />
        )}
        <DeleteButton id={apt.id} />
      </div>
    </div>
  )
}

function CancelButton({ id }: { id: string }) {
  return (
    <form action={async () => {
      'use server'
      const { auth } = await import('@clerk/nextjs/server')
      const { supabase } = await import('@/lib/supabase')
      const { redirect } = await import('next/navigation')
      const { userId } = await auth()
      await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', id).eq('pro_id', userId)
      redirect(`/dashboard/appointments/${id}`)
    }}>
      <button type="submit" className="bg-rose-50 hover:bg-rose-100 text-rose-600 px-6 py-2 rounded-xl font-medium transition-colors text-sm">
        Annuler le RDV
      </button>
    </form>
  )
}

function DeleteButton({ id }: { id: string }) {
  return (
    <form action={async () => {
      'use server'
      const { auth } = await import('@clerk/nextjs/server')
      const { supabase } = await import('@/lib/supabase')
      const { redirect } = await import('next/navigation')
      const { userId } = await auth()
      await supabase.from('bookings').delete().eq('id', id).eq('pro_id', userId)
      redirect('/dashboard/appointments')
    }}>
      <button type="submit" className="bg-red-50 hover:bg-red-100 text-red-600 px-6 py-2 rounded-xl font-medium transition-colors text-sm">
        Supprimer
      </button>
    </form>
  )
}