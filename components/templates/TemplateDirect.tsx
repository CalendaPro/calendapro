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

export default function TemplateDirect({
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

      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex flex-col md:flex-row md:items-start gap-8">
          <div className="flex-1">
            <div className="mb-4 text-sm text-stone-500">
              Réservation rapide — {profile.full_name ?? profile.username}
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white shadow-sm overflow-hidden">
              <div
                className="px-6 py-4"
                style={{
                  background: 'linear-gradient(135deg, var(--accent), rgba(236,72,153,0.92))',
                }}
              >
                <h2 className="text-white font-semibold text-lg">Choisissez votre créneau</h2>
                <p className="text-white/90 text-xs mt-0.5">Paiement & confirmations selon vos réglages.</p>
              </div>
              <div className="p-6">{/* Directement au-dessus */}<BookingForm username={profile.username} /></div>
            </div>

            {(services?.length ?? 0) > 0 && (
              <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-3">Services</p>
                <div className="space-y-2">
                  {services.slice(0, 6).map(s => (
                    <div key={s.id ?? s.name} className="flex items-start justify-between gap-3 rounded-xl border border-stone-100 px-4 py-3 bg-stone-50/30">
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
          </div>

          <aside className="w-full md:w-[320px] shrink-0">
            <div className="text-center md:text-left mb-6">
              <div className="w-16 h-16 rounded-full bg-emerald-100 mx-auto md:mx-0 flex items-center justify-center text-emerald-700 text-2xl font-bold border-4 border-white shadow-sm mb-3">
                {profile.full_name?.charAt(0) ?? profile.username.charAt(0).toUpperCase()}
              </div>
              <h1 className="text-xl font-bold text-stone-900">{profile.full_name ?? profile.username}</h1>
              {profile.bio && <p className="text-stone-500 text-sm mt-2 leading-relaxed">{profile.bio}</p>}
            </div>

            {photos.length > 0 && (
              <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-3">Photos</p>
                <div className="grid grid-cols-3 gap-2">
                  {photos.slice(0, 6).map((p, idx) => (
                    <div key={p.path ?? idx} className="overflow-hidden rounded-lg border border-stone-100 bg-stone-50">
                      <img src={p.url} alt={`Photo ${idx + 1}`} className="w-full h-18 object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  )
}

