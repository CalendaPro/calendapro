import type { ReactNode } from 'react'
import Image from 'next/image'
import { BrandLogo } from '@/components/BrandLogo'
import BookingForm from '@/app/[username]/BookingForm'
import { ClientAccentProvider } from '@/components/ClientAccentProvider'
import { SourceTracker } from '@/components/tracking/SourceTracker'

type Photo = { url: string; path?: string }
type Service = { id?: string; name: string; duration?: string; price?: number | null }

type Profile = {
  id: string
  username: string
  full_name?: string | null
  bio?: string | null
  city?: string | null
  social_links?: Record<string, string> | null
}

export default function TemplateDirect({
  profile,
  accentColor,
  photos,
  services,
  trackingSource,
  trackingDetectedAt,
  socialLinks,
}: {
  profile: Profile
  accentColor: string
  photos: Photo[]
  services: Service[]
  trackingSource?: string
  trackingDetectedAt?: string
  socialLinks?: Record<string, string> | null
}): ReactNode {
  return (
    <ClientAccentProvider accentColor={accentColor}>
      {trackingSource && trackingDetectedAt && (
        <SourceTracker source={trackingSource} detectedAt={trackingDetectedAt} />
      )}
      <div className="min-h-screen bg-[var(--cl-bg)]">
        <div className="bg-[var(--cl-glass-navbar)] border-b border-[var(--accent-20)] py-4 px-6 backdrop-blur-sm">
          <BrandLogo />
        </div>

        <div className="max-w-4xl mx-auto px-6 py-10">
          <div className="flex flex-col md:flex-row md:items-start gap-8">
            <div className="flex-1">
              <div className="mb-4 text-sm text-[var(--cl-text-muted)]">
                Réservation rapide — {profile.full_name ?? profile.username}
              </div>
              <div className="rounded-2xl border border-[var(--accent-20)] bg-[var(--cl-glass-sidebar)] shadow-sm overflow-hidden">
                <div
                  className="px-6 py-4"
                  style={{
                    background: 'linear-gradient(135deg, var(--accent-500), var(--accent-600))',
                  }}
                >
                  <h2 className="text-white font-semibold text-lg">Choisissez votre créneau</h2>
                  <p className="text-white/90 text-xs mt-0.5">Paiement & confirmations selon vos réglages.</p>
                </div>
                <div className="p-6">{/* Directement au-dessus */}<BookingForm username={profile.username} trackingSource={trackingSource} professionalName={profile.full_name} /></div>
              </div>

              {(services?.length ?? 0) > 0 && (
                <div className="mt-6 rounded-2xl border border-[var(--accent-20)] bg-[var(--cl-glass-sidebar)] p-6 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--cl-text-muted)] mb-3">Services</p>
                  <div className="space-y-2">
                    {services.slice(0, 6).map(s => (
                      <div key={s.id ?? s.name} className="flex items-start justify-between gap-3 rounded-xl border border-[var(--accent-20)] px-4 py-3 bg-[var(--cl-bg)]">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[var(--cl-text-primary)] truncate">{s.name}</p>
                          {s.duration && <p className="text-xs text-[var(--cl-text-muted)]">{s.duration}</p>}
                        </div>
                        {typeof s.price === 'number' && (
                          <p className="text-sm font-bold text-[var(--accent-600)] tabular-nums">{s.price.toLocaleString('fr-FR')}€</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <aside className="w-full md:w-[320px] shrink-0">
              <div className="text-center md:text-left mb-6">
                <div className="w-16 h-16 rounded-full bg-[var(--accent-100)] mx-auto md:mx-0 flex items-center justify-center text-[var(--accent-700)] text-2xl font-bold border-4 border-[var(--cl-bg)] shadow-sm mb-3">
                  {profile.full_name?.charAt(0) ?? profile.username.charAt(0).toUpperCase()}
                </div>
                <h1 className="text-xl font-bold text-[var(--cl-text-primary)]">{profile.full_name ?? profile.username}</h1>
                {profile.bio && <p className="text-[var(--cl-text-muted)] text-sm mt-2 leading-relaxed">{profile.bio}</p>}
              </div>

              {photos.length > 0 && (
                <div className="rounded-2xl border border-[var(--accent-20)] bg-[var(--cl-glass-sidebar)] p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--cl-text-muted)] mb-3">Photos</p>
                  <div className="grid grid-cols-3 gap-2">
                    {photos.slice(0, 6).map((p, idx) => (
                      <div key={p.path ?? idx} className="relative overflow-hidden rounded-lg border border-[var(--accent-20)] bg-[var(--cl-bg)] aspect-square">
                        <Image src={p.url} alt={`Photo ${idx + 1}`} fill sizes="100px" className="object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          </div>
        </div>
      </div>
    </ClientAccentProvider>
  )
}

