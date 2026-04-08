import type { ReactNode } from 'react'
import { BrandLogo } from '@/components/BrandLogo'
import BookingForm from '@/app/[username]/BookingForm'

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
}: {
  profile: Profile
  accentColor: string
  photos: Photo[]
  services: Service[]
}): ReactNode {
  return (
    <div className="min-h-screen bg-stone-50" style={{ ['--accent' as any]: accentColor }}>
      <div className="bg-white border-b border-stone-200 py-4 px-6">
        <BrandLogo />
      </div>

      <div className="max-w-lg mx-auto px-6 py-10">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-3xl font-bold mx-auto mb-4 border-4 border-white shadow-md">
            {profile.full_name?.charAt(0) ?? profile.username.charAt(0).toUpperCase()}
          </div>
          <h1 className="text-2xl font-bold text-stone-900 mb-1">{profile.full_name ?? profile.username}</h1>
          {profile.bio && <p className="text-stone-500 text-sm max-w-sm mx-auto leading-relaxed">{profile.bio}</p>}
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          <div
            className="px-6 py-4"
            style={{ background: 'linear-gradient(135deg, var(--accent), rgba(236,72,153,0.9))' }}
          >
            <h2 className="text-white font-semibold text-lg">Prendre un rendez-vous</h2>
            <p className="text-white/90 text-sm mt-0.5">Réservez en ligne, simplement.</p>
          </div>

          <div className="p-6">
            {services?.length > 0 && (
              <div className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2">Services</p>
                <div className="space-y-2">
                  {services.slice(0, 3).map(s => (
                    <div key={s.id ?? s.name} className="flex items-center justify-between gap-3 rounded-xl border border-stone-100 px-4 py-2 bg-stone-50/30">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-stone-900 truncate">{s.name}</p>
                        {s.duration && <p className="text-xs text-stone-500">{s.duration}</p>}
                      </div>
                      {typeof s.price === 'number' && (
                        <p className="text-sm font-bold text-stone-900 tabular-nums">{s.price.toLocaleString('fr-FR')}€</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Booking UI */}
            <BookingForm username={profile.username} />
          </div>
        </div>

        {photos.length > 0 && (
          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-3 text-center">Galerie</p>
            <div className="grid grid-cols-3 gap-2">
              {photos.slice(0, 6).map((p, idx) => (
                <div key={p.path ?? idx} className="overflow-hidden rounded-xl border border-stone-100 bg-stone-50">
                  <img src={p.url} alt={`Photo ${idx + 1}`} className="w-full h-20 object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

