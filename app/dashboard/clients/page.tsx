'use client'

import { useState, useEffect, useMemo } from 'react'

type Client = {
  id: string
  name: string
  email: string
  phone: string
  created_at: string
}

const ITEMS_PER_PAGE = 20

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => { fetchClients() }, [])

  async function fetchClients() {
    const res = await fetch('/api/clients')
    const data = await res.json()
    setClients(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  // #26 - Filtrer et paginer les clients
  const filteredClients = useMemo(() => {
    const q = search.toLowerCase()
    return clients.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.phone.includes(q)
    )
  }, [clients, search])

  const totalPages = Math.ceil(filteredClients.length / ITEMS_PER_PAGE)
  const paginatedClients = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredClients.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredClients, currentPage])

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [search])

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-4xl mx-auto">

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--dl-text-primary)' }}>Clients</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--dl-text-muted)' }}>{clients.length} client{clients.length > 1 ? 's' : ''} au total</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 sm:py-2 rounded-xl font-medium transition-colors text-sm touch-target"
        >
          + Nouveau client
        </button>
      </div>

      {/* #26 - Search bar */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Rechercher un client..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full rounded-xl px-4 py-3 sm:py-2"
          style={{ background: 'var(--dl-sidebar-bg)', border: '1px solid var(--dl-card-border)', color: 'var(--dl-text-primary)' }}
        />
      </div>

      {showForm && (
        <div className="rounded-2xl p-4 sm:p-6 mb-6" style={{ background: 'var(--dl-card-bg)', border: '1px solid var(--dl-card-border)', boxShadow: 'var(--dl-card-shadow)' }}>
          <h2 className="font-semibold mb-4" style={{ fontSize: '1.125rem', fontWeight: 'bold', color: 'var(--dl-text-primary)' }}>Nouveau client</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-sm mb-1.5 block" style={{ color: 'var(--dl-text-muted)' }}>Nom complet</label>
              <input
                type="text"
                placeholder="Marie Dupont"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-xl px-4 py-3 sm:py-2 focus:outline-none"
                style={{ background: 'var(--dl-sidebar-bg)', border: '1px solid var(--dl-card-border)', color: 'var(--dl-text-primary)' }}
              />
            </div>
            <div>
              <label className="text-sm mb-1.5 block" style={{ color: 'var(--dl-text-muted)' }}>Email</label>
              <input
                type="email"
                placeholder="marie@email.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-xl px-4 py-3 sm:py-2 focus:outline-none"
                style={{ background: 'var(--dl-sidebar-bg)', border: '1px solid var(--dl-card-border)', color: 'var(--dl-text-primary)' }}
              />
            </div>
            <div>
              <label className="text-sm mb-1.5 block" style={{ color: 'var(--dl-text-muted)' }}>Téléphone</label>
              <input
                type="tel"
                placeholder="06 12 34 56 78"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                className="w-full rounded-xl px-4 py-3 sm:py-2 focus:outline-none"
                style={{ background: 'var(--dl-sidebar-bg)', border: '1px solid var(--dl-card-border)', color: 'var(--dl-text-primary)' }}
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
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
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 sm:py-2 rounded-xl font-medium transition-colors text-sm touch-target"
            >
              Ajouter
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-6 py-3 sm:py-2 rounded-xl font-medium transition-colors text-sm touch-target"
              style={{ background: 'var(--dl-sidebar-bg)', color: 'var(--dl-text-primary)', border: '1px solid var(--dl-card-border)' }}
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12" style={{ color: 'var(--dl-text-muted)' }}>Chargement...</div>
      ) : clients.length === 0 ? (
        <div className="text-center py-12 rounded-2xl" style={{ color: 'var(--dl-text-muted)', background: 'var(--dl-card-bg)', border: '1px solid var(--dl-card-border)' }}>
          Aucun client pour l'instant
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {/* #26 - Afficher clients paginés */}
          {paginatedClients.map(client => (
            <div key={client.id} className="rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors" style={{ background: 'var(--dl-card-bg)', border: '1px solid var(--dl-card-border)' }}>
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                  {client.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-base" style={{ color: 'var(--dl-text-primary)' }}>{client.name}</div>
                  <div className="text-sm mt-0.5 flex flex-wrap items-center gap-x-2" style={{ color: 'var(--dl-text-muted)' }}>
                    {client.email && <span className="truncate">{client.email}</span>}
                    {client.email && client.phone && <span className="hidden sm:inline">·</span>}
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
                className="hover:text-red-400 transition-colors text-sm touch-target self-start sm:self-auto px-2 py-2 sm:px-0 sm:py-0"
                style={{ color: 'var(--dl-text-muted)' }}
              >
                Supprimer
              </button>
            </div>
          ))}
        </div>
      )}

      {/* #26 - Pagination controls */}
      {!loading && filteredClients.length > ITEMS_PER_PAGE && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t" style={{ borderColor: 'var(--dl-card-border)' }}>
          <div className="text-sm" style={{ color: 'var(--dl-text-muted)' }}>
            Page {currentPage} sur {totalPages} · {filteredClients.length} résultats
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              style={{ background: 'var(--dl-sidebar-bg)', border: '1px solid var(--dl-card-border)', color: 'var(--dl-text-primary)' }}
            >
              Précédent
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              style={{ background: 'var(--dl-sidebar-bg)', border: '1px solid var(--dl-card-border)', color: 'var(--dl-text-primary)' }}
            >
              Suivant
            </button>
          </div>
        </div>
      )}
    </div>
  )
}