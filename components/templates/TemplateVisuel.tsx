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

export default function TemplateVisuel({
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

        <div className="max-w-3xl mx-auto px-6 py-10">
          <div className="mb-6 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--accent-20)] bg-[var(--cl-glass-sidebar)] px-4 py-2 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-[var(--accent-500)]" />
              <span className="text-sm font-semibold text-[var(--accent-600)]">
                Page publique
              </span>
            </div>
            <h1 className="text-3xl font-bold text-[var(--cl-text-primary)] mt-4">{profile.full_name ?? profile.username}</h1>
            {profile.bio && <p className="text-[var(--cl-text-muted)] text-sm max-w-xl mx-auto mt-2 leading-relaxed">{profile.bio}</p>}
          </div>

          {photos.length > 0 && (
            <div className="rounded-2xl overflow-hidden border border-[var(--accent-20)] bg-[var(--cl-glass-sidebar)] shadow-sm mb-6">
              <div className="relative h-56 sm:h-72">
                <Image src={photos[0].url} alt="Photo principale" fill sizes="(max-width: 768px) 100vw, 800px" className="object-cover" priority />
                <div
                  className="absolute inset-x-0 bottom-0 p-4"
                  style={{ background: 'linear-gradient(180deg, transparent, rgba(0,0,0,0.55))' }}
                >
                  <p className="text-white text-sm font-semibold">
                    Ambiance & réalisations — réservez pour passer à l&apos;action.
                  </p>
                </div>
              </div>
              {photos.length > 1 && (
                <div className="grid grid-cols-4 gap-1 p-1">
                  {photos.slice(1, 9).map((p, idx) => (
                    <div key={p.path ?? idx} className="relative overflow-hidden rounded-lg aspect-[4/3]">
                      <Image src={p.url} alt={`Photo ${idx + 2}`} fill sizes="150px" className="object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
            <div className="rounded-2xl border border-[var(--accent-20)] bg-[var(--cl-glass-sidebar)] p-6 shadow-sm">
              {services?.length > 0 && (
                <div className="mb-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--cl-text-muted)] mb-3">Offres</p>
                  <div className="space-y-2">
                    {services.slice(0, 5).map(s => (
                      <div
                        key={s.id ?? s.name}
                        className="flex items-start justify-between gap-3 rounded-xl border border-[var(--accent-20)] px-4 py-3 bg-[var(--cl-bg)]"
                      >
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

              <div className="rounded-xl bg-[var(--accent-50)] border border-[var(--accent-200)] p-4">
                <p className="text-sm font-semibold text-[var(--accent-700)]">
                  Réservez en ligne
                </p>
                <p className="text-xs text-[var(--cl-text-muted)] mt-1">Votre créneau est confirmé instantanément.</p>
              </div>

              <div className="mt-4">
                <BookingForm username={profile.username} trackingSource={trackingSource} />
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--accent-20)] bg-[var(--cl-glass-sidebar)] p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--cl-text-muted)] mb-3">Info</p>
              <p className="text-sm text-[var(--cl-text-primary)]">
                {profile.city ? `Basé à ${profile.city}` : 'Local & sur rendez-vous.'}
              </p>
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--cl-text-muted)] mb-2">Conseil</p>
                <p className="text-sm text-[var(--cl-text-muted)] leading-relaxed">
                  Ajoutez des photos récentes pour augmenter la conversion.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ClientAccentProvider>
  )
}

