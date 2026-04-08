'use client'

import { useState, useEffect } from 'react'

type Client = {
  id: string
  name: string
  email: string
  phone: string
  created_at: string
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '' })

  useEffect(() => { fetchClients() }, [])

  async function fetchClients() {
    const res = await fetch('/api/clients')
    const data = await res.json()
    setClients(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Clients</h1>
          <p className="text-stone-400 text-sm mt-1">{clients.length} client{clients.length > 1 ? 's' : ''} au total</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-medium transition-colors text-sm"
        >
          + Nouveau client
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-stone-200 rounded-2xl p-6 mb-6 shadow-sm">
          <h2 className="font-semibold text-stone-900 mb-4">Nouveau client</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-stone-500 mb-1 block">Nom complet</label>
              <input
                type="text"
                placeholder="Marie Dupont"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 text-stone-900 placeholder-stone-400 focus:outline-none focus:border-emerald-400 text-sm"
              />
            </div>
            <div>
              <label className="text-sm text-stone-500 mb-1 block">Email</label>
              <input
                type="email"
                placeholder="marie@email.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 text-stone-900 placeholder-stone-400 focus:outline-none focus:border-emerald-400 text-sm"
              />
            </div>
            <div>
              <label className="text-sm text-stone-500 mb-1 block">Téléphone</label>
              <input
                type="tel"
                placeholder="06 12 34 56 78"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 text-stone-900 placeholder-stone-400 focus:outline-none focus:border-emerald-400 text-sm"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={async () => {
                if (!form.name) return
                const res = await fetch('/api/clients', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(form),
                })
                if (res.ok) {
                  setForm({ name: '', email: '', phone: '' })
                  setShowForm(false)
                  fetchClients()
                }
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-xl font-medium transition-colors text-sm"
            >
              Ajouter
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
      ) : clients.length === 0 ? (
        <div className="text-stone-400 text-center py-12 bg-white rounded-2xl border border-stone-200">
          Aucun client pour l'instant
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {clients.map(client => (
            <div key={client.id} className="bg-white border border-stone-200 rounded-2xl p-5 flex items-center justify-between hover:border-emerald-300 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold text-sm">
                  {client.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold text-stone-900">{client.name}</div>
                  <div className="text-stone-400 text-sm mt-0.5">
                    {client.email && <span>{client.email}</span>}
                    {client.email && client.phone && <span className="mx-2">·</span>}
                    {client.phone && <span>{client.phone}</span>}
                  </div>
                </div>
              </div>
              <button
                onClick={async () => {
                  await fetch('/api/clients', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: client.id }),
                  })
                  fetchClients()
                }}
                className="text-stone-300 hover:text-red-400 transition-colors text-sm"
              >
                Supprimer
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}