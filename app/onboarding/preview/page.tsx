'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

type Vibe = 'minimal' | 'barber' | 'studio' | 'organic'
type BtnStyle = 'pill' | 'rounded' | 'square'

const VIBES: Record<Vibe, { bg: string; text: string; muted: string; border: string; card: string }> = {
  minimal: { bg: '#ffffff', text: '#0f172a', muted: '#64748b', border: '#e2e8f0', card: '#f8fafc' },
  barber:  { bg: '#110e09', text: '#f0e4cc', muted: '#9a8060', border: '#2a2010', card: '#1c1710' },
  studio:  { bg: '#f5f3ff', text: '#1e1b4b', muted: '#6b7280', border: '#ddd6fe', card: '#ede9fe' },
  organic: { bg: '#faf7f2', text: '#3d2c1e', muted: '#8b6b4e', border: '#e8ddd0', card: '#f2ede5' },
}

type PreviewState = {
  fullName: string
  categoryLabel: string
  city: string
  bio: string
  accentColor: string
  vibe: Vibe
  btnStyle: BtnStyle
  serviceName: string
  serviceDuration: string
  servicePrice: string
  photoUrl: string
  fontTitle: string
  fontBody: string
}

function PreviewContent() {
  const params = useSearchParams()

  const parse = useCallback((): PreviewState => ({
    fullName:        params.get('name') ?? 'Votre nom',
    categoryLabel:   params.get('metier') ?? 'Métier',
    city:            params.get('city') ?? 'Ville',
    bio:             params.get('bio') ?? '',
    accentColor:     params.get('accent') ?? '#7c3aed',
    vibe:            (params.get('vibe') as Vibe) ?? 'minimal',
    btnStyle:        (params.get('btn') as BtnStyle) ?? 'pill',
    serviceName:     params.get('sName') ?? 'Votre service',
    serviceDuration: params.get('sDur') ?? '1h',
    servicePrice:    params.get('sPrice') ?? '0',
    photoUrl:        params.get('photo') ?? '',
    fontTitle:       params.get('fontTitle') ?? 'DM Sans',
    fontBody:        params.get('fontBody') ?? 'DM Sans',
  }), [params])

  const [state, setState] = useState<PreviewState>(parse)

  useEffect(() => {
    setState(parse())
  }, [parse])

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type !== 'PREVIEW_UPDATE') return
      setState(prev => ({ ...prev, ...(e.data.payload as Partial<PreviewState>) }))
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  const { bg, text, muted, border, card } = VIBES[state.vibe] ?? VIBES.minimal
  const acc = state.accentColor
  const btnRadius = state.btnStyle === 'pill' ? 999 : state.btnStyle === 'rounded' ? 14 : 4

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;800&family=Inter:wght@400;600;700&family=Manrope:wght@400;600;700;800&family=Lato:wght@400;700&family=Nunito:wght@400;600;700;800&family=Playfair+Display:wght@500;700&family=Syne:wght@700;800&family=Cormorant:wght@500;700&display=swap');
        @import url('https://api.fontshare.com/v2/css?f[]=clash-display@600,700,800&f[]=bebas-neue@400&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${bg}; font-family: 'DM Sans', sans-serif; transition: background 0.4s; min-height: 100vh; }
      `}</style>

      <div style={{ background: bg, minHeight: '100vh', transition: 'background 0.4s', padding: '2rem 1.5rem' }}>

        {/* Hero */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28 }}>
          <div style={{ width: 88, height: 88, borderRadius: '50%', border: `3.5px solid ${acc}`, overflow: 'hidden', flexShrink: 0, background: `${acc}18`, transition: 'border-color 0.3s' }}>
            {state.photoUrl && <img src={state.photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
          </div>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: text, lineHeight: 1.15, paddingRight: '0.05em', overflow: 'visible', fontFamily: `'${state.fontTitle}', sans-serif`, transition: 'color 0.3s' }}>
              {state.fullName}
            </h1>
            <p style={{ marginTop: 6, fontSize: '0.95rem', color: acc, fontWeight: 700, fontFamily: `'${state.fontBody}', sans-serif`, transition: 'color 0.3s' }}>
              {state.categoryLabel} · {state.city}
            </p>
            <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 999, background: `${acc}18`, color: acc, fontSize: '0.72rem', fontWeight: 700 }}>
                ⭐ 4.9 (24 avis)
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 999, background: `${acc}10`, color: muted, fontSize: '0.72rem', fontWeight: 600 }}>
                📅 3 créneaux dispo
              </span>
            </div>
          </div>
        </div>

        {/* Bio */}
        {state.bio && (
          <p style={{ fontSize: '0.95rem', color: muted, lineHeight: 1.8, marginBottom: 28, fontFamily: `'${state.fontBody}', sans-serif`, transition: 'color 0.3s', maxWidth: 540 }}>
            {state.bio}
          </p>
        )}

        {/* Service card */}
        <div style={{ borderRadius: 18, border: `1.5px solid ${acc}28`, padding: '1.2rem 1.4rem', background: card, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: `0 4px 20px ${acc}14`, transition: 'all 0.3s' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: text, fontFamily: `'${state.fontTitle}', sans-serif` }}>{state.serviceName}</div>
            <div style={{ marginTop: 5, fontSize: '0.82rem', color: muted }}>
              {state.serviceDuration} · Réservation instantanée ✓
            </div>
          </div>
          <div style={{ fontSize: '1.7rem', fontWeight: 800, color: acc, fontFamily: `'${state.fontTitle}', sans-serif`, transition: 'color 0.3s' }}>
            {Number(state.servicePrice) > 0 ? `${state.servicePrice}€` : '—'}
          </div>
        </div>

        {/* CTA */}
        <button style={{ width: '100%', height: 56, borderRadius: btnRadius, background: `linear-gradient(135deg, ${acc}, ${acc}cc)`, border: 'none', color: 'white', fontWeight: 800, fontSize: '1.05rem', cursor: 'pointer', boxShadow: `0 10px 32px ${acc}50`, transition: 'all 0.3s', fontFamily: `'${state.fontBody}', sans-serif`, marginBottom: 28 }}>
          Réserver maintenant
        </button>

        {/* Info band */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 24 }}>
          {[['🏆', 'Certifié', 'Pro vérifié'], ['💬', 'Répond vite', '< 2h en moyenne'], ['🔒', 'Sécurisé', 'Paiement protégé']].map(([ic, t, s]) => (
            <div key={t} style={{ borderRadius: 12, border: `1px solid ${border}`, padding: '0.75rem', background: bg, textAlign: 'center', transition: 'all 0.3s' }}>
              <div style={{ fontSize: '1.2rem', marginBottom: 4 }}>{ic}</div>
              <div style={{ fontWeight: 700, fontSize: '0.78rem', color: text }}>{t}</div>
              <div style={{ fontSize: '0.66rem', color: muted, marginTop: 2 }}>{s}</div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', paddingTop: '1rem', borderTop: `1px solid ${border}` }}>
          <div style={{ fontSize: '0.7rem', color: muted }}>Propulsé par <span style={{ fontWeight: 700, color: acc }}>CalendaPro</span></div>
        </div>
      </div>
    </>
  )
}

export default function PreviewPage() {
  return (
    <Suspense>
      <PreviewContent />
    </Suspense>
  )
}

