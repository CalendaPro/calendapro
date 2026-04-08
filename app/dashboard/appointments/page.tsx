'use client'

import { useState, useEffect } from 'react'

type Appointment = {
  id: string
  title: string
  date: string
  duration: number
  status: string
  notes: string
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', date: '', duration: 60, notes: '' })

  useEffect(() => { fetchAppointments() }, [])

  async function fetchAppointments() {
    const res = await fetch('/api/appointments')
    const data = await res.json()
    setAppointments(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Rendez-vous</h1>
          <p className="text-stone-400 text-sm mt-1">{appointments.length} rendez-vous au total</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-medium transition-colors text-sm"
        >
          + Nouveau RDV
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-stone-200 rounded-2xl p-6 mb-6 shadow-sm">
          <h2 className="font-semibold text-stone-900 mb-4">Nouveau rendez-vous</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-stone-500 mb-1 block">Titre</label>
              <input
                type="text"
                placeholder="Ex: Coaching avec Marie"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 text-stone-900 placeholder-stone-400 focus:outline-none focus:border-emerald-400 text-sm"
              />
            </div>
            <div>
              <label className="text-sm text-stone-500 mb-1 block">Date et heure</label>
              <input
                type="datetime-local"
                value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 text-stone-900 focus:outline-none focus:border-emerald-400 text-sm"
              />
            </div>
            <div>
              <label className="text-sm text-stone-500 mb-1 block">Durée (minutes)</label>
              <input
                type="number"
                value={form.duration}
                onChange={e => setForm({ ...form, duration: parseInt(e.target.value) || 60 })}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 text-stone-900 focus:outline-none focus:border-emerald-400 text-sm"
              />
            </div>
            <div>
              <label className="text-sm text-stone-500 mb-1 block">Notes</label>
              <input
                type="text"
                placeholder="Notes optionnelles"
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 text-stone-900 placeholder-stone-400 focus:outline-none focus:border-emerald-400 text-sm"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={async () => {
                if (!form.title || !form.date) return
                const res = await fetch('/api/appointments', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(form),
                })
                if (res.ok) {
                  setForm({ title: '', date: '', duration: 60, notes: '' })
                  setShowForm(false)
                  fetchAppointments()
                }
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-xl font-medium transition-colors text-sm"
            >
              Créer
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="bg-stone-100 hover:bg-stone-200 text-stone-700 px-6 py-2 rounded-xl font-medium transition-colors text-sm"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-stone-400 text-center py-12">Chargement...</div>
      ) : appointments.length === 0 ? (
        <div className="text-stone-400 text-center py-12 bg-white rounded-2xl border border-stone-200">
          Aucun rendez-vous pour l'instant
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {appointments.map(apt => (
            <div key={apt.id} className="bg-white border border-stone-200 rounded-2xl p-5 flex items-center justify-between hover:border-emerald-300 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 text-lg">
                  📅
                </div>
                <div>
                  <div className="font-semibold text-stone-900">{apt.title}</div>
                  <div className="text-stone-400 text-sm mt-0.5">
                    {new Date(apt.date).toLocaleDateString('fr-FR', {
                      weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
                    })} — {apt.duration} min
                  </div>
                  {apt.notes && <div className="text-stone-400 text-xs mt-1">{apt.notes}</div>}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                  apt.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600' :
                  apt.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                  'bg-stone-100 text-stone-500'
                }`}>
                  {apt.status === 'confirmed' ? 'Confirmé' : apt.status === 'pending' ? 'En attente' : apt.status}
                </span>
                <button
                  onClick={async () => {
                    await fetch('/api/appointments', {
                      method: 'DELETE',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ id: apt.id }),
                    })
                    fetchAppointments()
                  }}
                  className="text-stone-300 hover:text-red-400 transition-colors text-sm"
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}