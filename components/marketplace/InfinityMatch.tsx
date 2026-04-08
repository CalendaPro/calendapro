'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { PlanBadge, type MarketplacePlan } from './PlanBadge'

type MatchPro = {
  id: string
  username: string
  full_name: string
  bio: string | null
  category: string | null
  city: string | null
  avatar_url: string | null
  plan: MarketplacePlan
  distance?: number
}

function formatDistance(km: number) {
  if (km < 1) return `${Math.round(km * 1000)} m`
  if (km < 10) return `${km.toFixed(1)} km`
  return `${Math.round(km)} km`
}

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export default function InfinityMatch({
  userCoords,
}: {
  userCoords: { lat: number; lng: number } | null
}) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<{ role: 'you' | 'infinity'; text: string }[]>([])
  const [match, setMatch] = useState<{
    pro: MatchPro
    slot: { iso: string; label: string }
    hint: string
  } | null>(null)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, match, open])

  const send = async () => {
    const q = input.trim()
    if (q.length < 3 || loading) return
    setInput('')
    setMessages(m => [...m, { role: 'you', text: q }])
    setLoading(true)
    setMatch(null)
    try {
      const r = await fetch('/api/marketplace/infinity-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          lat: userCoords?.lat,
          lng: userCoords?.lng,
        }),
      })
      const data = await r.json()
      if (data.error && !data.match) {
        setMessages(m => [...m, { role: 'infinity', text: data.error || 'Impossible de trouver une correspondance.' }])
      } else if (data.match) {
        setMessages(m => [
          ...m,
          {
            role: 'infinity',
            text:
              "Voici la meilleure option d'après ton message, la proximité et les agendas (aperçu créneau). Réserve en un clic.",
          },
        ])
        setMatch({ pro: data.match, slot: data.slot, hint: data.hint })
      }
    } catch {
      setMessages(m => [...m, { role: 'infinity', text: 'Erreur réseau. Réessaie dans un instant.' }])
    }
    setLoading(false)
  }

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen(v => !v)}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
        title="Infinity Match — laisse l’IA te proposer une option"
        style={{
          position: 'fixed',
          right: 20,
          bottom: 22,
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          gap: 9,
          padding: '0.75rem 1.15rem',
          borderRadius: 100,
          border: 'none',
          cursor: 'pointer',
          fontFamily: "'Outfit', sans-serif",
          fontWeight: 800,
          fontSize: '0.82rem',
          letterSpacing: '0.02em',
          color: 'white',
          background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
          boxShadow: '0 10px 36px rgba(124,58,237,0.45), 0 0 0 1px rgba(255,255,255,0.2) inset',
        }}
      >
        <span style={{ fontSize: '1.05rem' }}>✦</span>
        Infinity Match
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            style={{
              position: 'fixed',
              right: 20,
              bottom: 86,
              zIndex: 1999,
              width: 'min(400px, calc(100vw - 40px))',
              maxHeight: 'min(520px, 70vh)',
              display: 'flex',
              flexDirection: 'column',
              background: 'linear-gradient(180deg, #0f0a1e 0%, #1a1330 100%)',
              borderRadius: 20,
              border: '1px solid rgba(167,139,250,0.35)',
              boxShadow: '0 24px 64px rgba(0,0,0,0.45)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '14px 16px',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
              }}
            >
              <div>
                <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, color: 'white', fontSize: '0.9rem' }}>
                  Infinity Match
                </div>
                <div style={{ fontSize: '0.68rem', color: '#a78bfa', marginTop: 2, fontFamily: "'Outfit', sans-serif" }}>
                  Bêta — une suggestion, pas une liste
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: 'none',
                  color: '#c4bdd6',
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  cursor: 'pointer',
                  fontSize: 16,
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8', fontFamily: "'Outfit', sans-serif", lineHeight: 1.55 }}>
                Décris ton besoin : métier, créneau, ville. Ex. « Coach sportif demain matin pas trop loin ».
                {!userCoords && (
                  <span style={{ color: '#fbbf24' }}> Active la géolocalisation sur la page pour prioriser les pros proches.</span>
                )}
              </p>

              {messages.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    alignSelf: msg.role === 'you' ? 'flex-end' : 'flex-start',
                    maxWidth: '92%',
                    padding: '9px 12px',
                    borderRadius: msg.role === 'you' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                    background: msg.role === 'you' ? 'linear-gradient(135deg,#7c3aed,#6366f1)' : 'rgba(255,255,255,0.07)',
                    color: msg.role === 'you' ? 'white' : '#e2e8f0',
                    fontSize: '0.78rem',
                    fontFamily: "'Outfit', sans-serif",
                    lineHeight: 1.5,
                  }}
                >
                  {msg.text}
                </div>
              ))}

              {loading && (
                <div style={{ fontSize: '0.72rem', color: '#a78bfa', fontFamily: "'Outfit', sans-serif", fontStyle: 'italic' }}>
                  Analyse des profils et des agendas…
                </div>
              )}

              {match && (
                <div
                  style={{
                    background: 'rgba(124,58,237,0.12)',
                    border: '1px solid rgba(167,139,250,0.35)',
                    borderRadius: 16,
                    padding: 12,
                    marginTop: 4,
                  }}
                >
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    {match.pro.avatar_url ? (
                      <img
                        src={match.pro.avatar_url}
                        alt=""
                        referrerPolicy="no-referrer"
                        style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg,#7c3aed,#ec4899)',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: 14,
                          flexShrink: 0,
                        }}
                      >
                        {initialsOf(match.pro.full_name || match.pro.username)}
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 800, color: 'white', fontFamily: "'Outfit', sans-serif", fontSize: '0.88rem' }}>
                        {match.pro.full_name || match.pro.username}
                      </div>
                      <div style={{ marginTop: 5, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <PlanBadge plan={match.pro.plan} variant="compact" />
                        {match.pro.distance != null && (
                          <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600 }}>
                            📍 {formatDistance(match.pro.distance)}
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          marginTop: 8,
                          padding: '8px 10px',
                          background: 'rgba(15,10,30,0.6)',
                          borderRadius: 10,
                          fontSize: '0.72rem',
                          color: '#e9d5ff',
                          fontFamily: "'Outfit', sans-serif",
                          lineHeight: 1.45,
                        }}
                      >
                        <strong style={{ color: 'white' }}>Créneau suggéré :</strong> {match.slot.label}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: 6, fontFamily: "'Outfit', sans-serif" }}>
                        {match.hint}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                    <Link
                      href={`/${match.pro.username}`}
                      style={{
                        display: 'block',
                        textAlign: 'center',
                        padding: '10px 14px',
                        borderRadius: 12,
                        background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
                        color: 'white',
                        fontWeight: 800,
                        fontSize: '0.8rem',
                        textDecoration: 'none',
                        fontFamily: "'Outfit', sans-serif",
                      }}
                    >
                      Réserver en 1 clic →
                    </Link>
                    <Link
                      href={`/${match.pro.username}`}
                      style={{
                        display: 'block',
                        textAlign: 'center',
                        padding: '9px 12px',
                        borderRadius: 12,
                        border: '1px solid rgba(167,139,250,0.4)',
                        color: '#c4b5fd',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        textDecoration: 'none',
                        fontFamily: "'Outfit', sans-serif",
                      }}
                    >
                      Voir le profil complet
                    </Link>
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            <div style={{ padding: '12px 14px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: 8 }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send()}
                placeholder="Je cherche un…"
                style={{
                  flex: 1,
                  borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: 'rgba(255,255,255,0.06)',
                  color: 'white',
                  padding: '10px 12px',
                  fontSize: '0.8rem',
                  fontFamily: "'Outfit', sans-serif",
                  outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={send}
                disabled={loading || input.trim().length < 3}
                style={{
                  padding: '0 16px',
                  borderRadius: 12,
                  border: 'none',
                  background:
                    loading || input.trim().length < 3 ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #7c3aed, #ec4899)',
                  color: 'white',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  cursor: loading || input.trim().length < 3 ? 'not-allowed' : 'pointer',
                  fontFamily: "'Outfit', sans-serif",
                }}
              >
                Envoyer
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
