'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { PlanBadge, type MarketplacePlan } from './PlanBadge'
import { Sparkles, X, ArrowRight, MapPin } from 'lucide-react'

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
      <style>{`
        @keyframes infinity-glow {
          0%, 100% {
            box-shadow:
              0 0 0 0 rgba(124, 58, 237, 0),
              0 0 24px rgba(124, 58, 237, 0.5),
              0 10px 36px rgba(124, 58, 237, 0.4),
              0 0 0 1px rgba(255,255,255,0.3) inset;
          }
          50% {
            box-shadow:
              0 0 0 12px rgba(124, 58, 237, 0),
              0 0 48px rgba(236, 72, 153, 0.45),
              0 10px 48px rgba(124, 58, 237, 0.55),
              0 0 0 1px rgba(255,255,255,0.4) inset;
          }
        }
        .infinity-fab {
          animation: infinity-glow 3s ease-in-out infinite;
        }
      `}</style>
      <motion.button
        type="button"
        onClick={() => setOpen(v => !v)}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.97 }}
        title="Infinity Match — laisse l'IA te proposer une option"
        className="infinity-fab"
        style={{
          position: 'fixed',
          right: 24,
          bottom: 24,
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '0.85rem 1.25rem',
          borderRadius: 100,
          border: 'none',
          cursor: 'pointer',
          fontFamily: "'DM Sans', sans-serif",
          fontWeight: 600,
          fontSize: '0.85rem',
          letterSpacing: '0.01em',
          color: 'white',
          background: 'linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)',
        }}
      >
        <Sparkles size={16} strokeWidth={2} />
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
              right: 24,
              bottom: 90,
              zIndex: 1999,
              width: 'min(400px, calc(100vw - 48px))',
              maxHeight: 'min(520px, 70vh)',
              display: 'flex',
              flexDirection: 'column',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px) saturate(180%)',
              borderRadius: 24,
              border: '1px solid rgba(255, 255, 255, 0.5)',
              boxShadow: '0 24px 64px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid rgba(0,0,0,0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <div>
                <div style={{
                  fontFamily: "'Clash Display', sans-serif",
                  fontWeight: 600,
                  color: '#0B0F19',
                  fontSize: '1rem',
                  letterSpacing: '-0.01em'
                }}>
                  Infinity Match
                </div>
                <div style={{
                  fontSize: '0.75rem',
                  color: '#7c3aed',
                  marginTop: 4,
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 500
                }}>
                  Bêta — une suggestion, pas une liste
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                style={{
                  background: 'rgba(0,0,0,0.04)',
                  border: 'none',
                  color: '#6B7280',
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(124, 58, 237, 0.1)'
                  e.currentTarget.style.color = '#7c3aed'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(0,0,0,0.04)'
                  e.currentTarget.style.color = '#6B7280'
                }}
              >
                <X size={18} strokeWidth={2} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{
                margin: 0,
                fontSize: '0.85rem',
                color: '#6B7280',
                fontFamily: "'DM Sans', sans-serif",
                lineHeight: 1.6,
                fontWeight: 400
              }}>
                Décris ton besoin : métier, créneau, ville. Ex. « Coach sportif demain matin pas trop loin ».
                {!userCoords && (
                  <span style={{ color: '#7c3aed', fontWeight: 500 }}> Active la géolocalisation sur la page pour prioriser les pros proches.</span>
                )}
              </p>

              {messages.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    alignSelf: msg.role === 'you' ? 'flex-end' : 'flex-start',
                    maxWidth: '92%',
                    padding: '10px 14px',
                    borderRadius: msg.role === 'you' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    background: msg.role === 'you'
                      ? 'linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)'
                      : 'rgba(243, 244, 246, 0.8)',
                    color: msg.role === 'you' ? 'white' : '#374151',
                    fontSize: '0.85rem',
                    fontFamily: "'DM Sans', sans-serif",
                    lineHeight: 1.6,
                    boxShadow: msg.role === 'you'
                      ? '0 2px 8px rgba(124, 58, 237, 0.2)'
                      : '0 1px 4px rgba(0,0,0,0.04)',
                  }}
                >
                  {msg.text}
                </div>
              ))}

              {loading && (
                <div style={{
                  fontSize: '0.8rem',
                  color: '#7c3aed',
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 500,
                  fontStyle: 'italic'
                }}>
                  Analyse des profils et des agendas…
                </div>
              )}

              {match && (
                <div
                  style={{
                    background: 'rgba(124, 58, 237, 0.06)',
                    border: '1px solid rgba(124, 58, 237, 0.12)',
                    borderRadius: 20,
                    padding: 16,
                    marginTop: 8,
                  }}
                >
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    {match.pro.avatar_url ? (
                      <img
                        src={match.pro.avatar_url}
                        alt=""
                        referrerPolicy="no-referrer"
                        style={{
                          width: 52,
                          height: 52,
                          borderRadius: '50%',
                          objectFit: 'cover',
                          flexShrink: 0,
                          border: '2px solid white',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 52,
                          height: 52,
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: 14,
                          fontFamily: "'Clash Display', sans-serif",
                          flexShrink: 0,
                          border: '2px solid white',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                      >
                        {initialsOf(match.pro.full_name || match.pro.username)}
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontWeight: 600,
                        color: '#0B0F19',
                        fontFamily: "'Clash Display', sans-serif",
                        fontSize: '0.95rem',
                        letterSpacing: '-0.01em'
                      }}>
                        {match.pro.full_name || match.pro.username}
                      </div>
                      <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <PlanBadge plan={match.pro.plan} variant="compact" />
                        {match.pro.distance != null && (
                          <span style={{
                            fontSize: '0.7rem',
                            color: '#6B7280',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4
                          }}>
                            <MapPin size={10} strokeWidth={2} />
                            {formatDistance(match.pro.distance)}
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          marginTop: 10,
                          padding: '10px 12px',
                          background: 'rgba(255,255,255,0.8)',
                          borderRadius: 12,
                          fontSize: '0.8rem',
                          color: '#4B5563',
                          fontFamily: "'DM Sans', sans-serif",
                          lineHeight: 1.5,
                          border: '1px solid rgba(0,0,0,0.04)'
                        }}
                      >
                        <strong style={{ color: '#7c3aed' }}>Créneau suggéré :</strong> {match.slot.label}
                      </div>
                      <div style={{
                        fontSize: '0.7rem',
                        color: '#9CA3AF',
                        marginTop: 8,
                        fontFamily: "'DM Sans', sans-serif"
                      }}>
                        {match.hint}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
                    <Link
                      href={`/${match.pro.username}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        padding: '12px 16px',
                        borderRadius: 14,
                        background: 'linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)',
                        color: 'white',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        textDecoration: 'none',
                        fontFamily: "'DM Sans', sans-serif",
                        boxShadow: '0 4px 16px rgba(124, 58, 237, 0.3)',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.transform = 'translateY(-1px)'
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(124, 58, 237, 0.4)'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = ''
                        e.currentTarget.style.boxShadow = '0 4px 16px rgba(124, 58, 237, 0.3)'
                      }}
                    >
                      Réserver en 1 clic
                      <ArrowRight size={14} strokeWidth={2.5} />
                    </Link>
                    <Link
                      href={`/${match.pro.username}`}
                      style={{
                        display: 'block',
                        textAlign: 'center',
                        padding: '10px 14px',
                        borderRadius: 14,
                        border: '1px solid rgba(124, 58, 237, 0.2)',
                        color: '#7c3aed',
                        fontWeight: 500,
                        fontSize: '0.8rem',
                        textDecoration: 'none',
                        fontFamily: "'DM Sans', sans-serif",
                        background: 'rgba(255,255,255,0.6)',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.9)'
                        e.currentTarget.style.borderColor = 'rgba(124, 58, 237, 0.3)'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.6)'
                        e.currentTarget.style.borderColor = 'rgba(124, 58, 237, 0.2)'
                      }}
                    >
                      Voir le profil complet
                    </Link>
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            <div style={{
              padding: '16px 20px',
              borderTop: '1px solid rgba(0,0,0,0.06)',
              display: 'flex',
              gap: 10,
              background: 'rgba(255,255,255,0.5)'
            }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send()}
                placeholder="Je cherche un…"
                style={{
                  flex: 1,
                  borderRadius: 14,
                  border: '1px solid rgba(0,0,0,0.08)',
                  background: 'rgba(255,255,255,0.8)',
                  color: '#0B0F19',
                  padding: '12px 14px',
                  fontSize: '0.9rem',
                  fontFamily: "'DM Sans', sans-serif",
                  outline: 'none',
                  transition: 'all 0.2s',
                }}
                onFocus={e => {
                  e.currentTarget.style.borderColor = 'rgba(124, 58, 237, 0.3)'
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124, 58, 237, 0.08)'
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = 'rgba(0,0,0,0.08)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              />
              <button
                type="button"
                onClick={send}
                disabled={loading || input.trim().length < 3}
                style={{
                  padding: '0 18px',
                  borderRadius: 14,
                  border: 'none',
                  background: loading || input.trim().length < 3
                    ? 'rgba(0,0,0,0.06)'
                    : 'linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)',
                  color: loading || input.trim().length < 3 ? '#9CA3AF' : 'white',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: loading || input.trim().length < 3 ? 'not-allowed' : 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                  transition: 'all 0.2s',
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
