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
    <div className="p-8 max-w-4xl mx-auto" style={{ padding: '2rem', maxWidth: '36rem', margin: '0 auto' }}>

      <div className="flex items-center justify-between mb-8" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 className="text-2xl font-bold" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--dl-text-primary)' }}>Clients</h1>
          <p className="text-sm mt-1" style={{ fontSize: '0.875rem', marginTop: '0.25rem', color: 'var(--dl-text-muted)' }}>{clients.length} client{clients.length > 1 ? 's' : ''} au total</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-medium transition-colors text-sm"
        >
          + Nouveau client
        </button>
      </div>

      {showForm && (
        <div className="rounded-2xl p-6 mb-6" style={{ borderRadius: '0.5rem', padding: '1.5rem', marginBottom: '1.5rem', background: 'var(--dl-card-bg)', border: '1px solid var(--dl-card-border)', boxShadow: 'var(--dl-card-shadow)' }}>
          <h2 className="font-semibold mb-4" style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1rem', color: 'var(--dl-text-primary)' }}>Nouveau client</h2>
          <div className="grid grid-cols-3 gap-4" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            <div>
              <label className="text-sm mb-1 block" style={{ fontSize: '0.875rem', marginBottom: '0.25rem', color: 'var(--dl-text-muted)' }}>Nom complet</label>
              <input
                type="text"
                placeholder="Marie Dupont"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-xl px-4 py-2 text-sm focus:outline-none"
                style={{ width: '100%', borderRadius: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.875rem', background: 'var(--dl-sidebar-bg)', border: '1px solid var(--dl-card-border)', color: 'var(--dl-text-primary)' }}
              />
            </div>
            <div>
              <label className="text-sm mb-1 block" style={{ fontSize: '0.875rem', marginBottom: '0.25rem', color: 'var(--dl-text-muted)' }}>Email</label>
              <input
                type="email"
                placeholder="marie@email.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-xl px-4 py-2 text-sm focus:outline-none"
                style={{ width: '100%', borderRadius: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.875rem', background: 'var(--dl-sidebar-bg)', border: '1px solid var(--dl-card-border)', color: 'var(--dl-text-primary)' }}
              />
            </div>
            <div>
              <label className="text-sm mb-1 block" style={{ fontSize: '0.875rem', marginBottom: '0.25rem', color: 'var(--dl-text-muted)' }}>Téléphone</label>
              <input
                type="tel"
                placeholder="06 12 34 56 78"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                className="w-full rounded-xl px-4 py-2 text-sm focus:outline-none"
                style={{ width: '100%', borderRadius: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.875rem', background: 'var(--dl-sidebar-bg)', border: '1px solid var(--dl-card-border)', color: 'var(--dl-text-primary)' }}
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4" style={{ gap: '0.75rem', marginTop: '1rem' }}>
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
              className="px-6 py-2 rounded-xl font-medium transition-colors text-sm"
              style={{ padding: '0.5rem 1.5rem', borderRadius: '0.5rem', fontSize: '0.875rem', background: 'var(--dl-sidebar-bg)', color: 'var(--dl-text-primary)', border: '1px solid var(--dl-card-border)' }}
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12" style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--dl-text-muted)' }}>Chargement...</div>
      ) : clients.length === 0 ? (
        <div className="text-center py-12 rounded-2xl" style={{ textAlign: 'center', padding: '3rem 0', borderRadius: '0.5rem', color: 'var(--dl-text-muted)', background: 'var(--dl-card-bg)', border: '1px solid var(--dl-card-border)' }}>
          Aucun client pour l'instant
        </div>
      ) : (
        <div className="flex flex-col gap-3" style={{ flexDirection: 'column', gap: '0.75rem' }}>
          {clients.map(client => (
            <div key={client.id} className="rounded-2xl p-5 flex items-center justify-between transition-colors" style={{ borderRadius: '0.5rem', padding: '1.25rem', background: 'var(--dl-card-bg)', border: '1px solid var(--dl-card-border)' }}>
              <div className="flex items-center gap-4" style={{ gap: '1rem' }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm" style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%', background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                  {client.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold" style={{ fontSize: '1.125rem', fontWeight: 'bold', color: 'var(--dl-text-primary)' }}>{client.name}</div>
                  <div className="text-sm mt-0.5" style={{ fontSize: '0.875rem', marginTop: '0.125rem', color: 'var(--dl-text-muted)' }}>
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
                className="hover:text-red-400 transition-colors text-sm"
                style={{ color: 'var(--dl-text-muted)' }}
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