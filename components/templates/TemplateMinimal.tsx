import type { ReactNode } from 'react'
import { BrandLogo } from '@/components/BrandLogo'
import BookingForm from '@/app/[username]/BookingForm'
import { ClientAccentProvider } from '@/components/ClientAccentProvider'

type Photo = { url: string; path?: string }
type Service = { id?: string; name: string; duration?: string; price?: number | null }

type Profile = {
  id: string
  username: string
  full_name?: string | null
  bio?: string | null
  city?: string | null
}

export default function TemplateMinimal({
  profile,
  accentColor,
  photos,
  services,
  trackingSource,
}: {
  profile: Profile
  accentColor: string
  photos: Photo[]
  services: Service[]
  trackingSource?: string
}): ReactNode {
  return (
    <ClientAccentProvider accentColor={accentColor}>
      <div className="min-h-screen bg-[var(--cl-bg)]">
        <div className="bg-[var(--cl-glass-navbar)] border-b border-[var(--accent-20)] py-4 px-6 backdrop-blur-sm">
          <BrandLogo />
        </div>

        <div className="max-w-lg mx-auto px-6 py-10">
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-[var(--accent-100)] flex items-center justify-center text-[var(--accent-700)] text-3xl font-bold mx-auto mb-4 border-4 border-[var(--cl-bg)] shadow-md">
              {profile.full_name?.charAt(0) ?? profile.username.charAt(0).toUpperCase()}
            </div>
            <h1 className="text-2xl font-bold text-[var(--cl-text-primary)] mb-1">{profile.full_name ?? profile.username}</h1>
            {profile.bio && <p className="text-[var(--cl-text-muted)] text-sm max-w-sm mx-auto leading-relaxed">{profile.bio}</p>}
          </div>

          <div className="bg-[var(--cl-glass-sidebar)] rounded-2xl border border-[var(--accent-20)] shadow-sm overflow-hidden">
            <div
              className="px-6 py-4"
              style={{ background: 'linear-gradient(135deg, var(--accent-500), var(--accent-600))' }}
            >
              <h2 className="text-white font-semibold text-lg">Prendre un rendez-vous</h2>
              <p className="text-white/90 text-sm mt-0.5">Réservez en ligne, simplement.</p>
            </div>

            <div className="p-6">
              {services?.length > 0 && (
                <div className="mb-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--cl-text-muted)] mb-2">Services</p>
                  <div className="space-y-2">
                    {services.slice(0, 3).map(s => (
                      <div key={s.id ?? s.name} className="flex items-center justify-between gap-3 rounded-xl border border-[var(--accent-20)] px-4 py-2 bg-[var(--cl-bg)]">
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

              {/* Booking UI */}
              <BookingForm username={profile.username} trackingSource={trackingSource} />
            </div>
          </div>

          {photos.length > 0 && (
            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--cl-text-muted)] mb-3 text-center">Galerie</p>
              <div className="grid grid-cols-3 gap-2">
                {photos.slice(0, 6).map((p, idx) => (
                  <div key={p.path ?? idx} className="overflow-hidden rounded-xl border border-[var(--accent-20)] bg-[var(--cl-bg)]">
                    <img src={p.url} alt={`Photo ${idx + 1}`} className="w-full h-20 object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </ClientAccentProvider>
  )
}

