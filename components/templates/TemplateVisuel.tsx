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

export default function TemplateVisuel({
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

      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
            <span className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>
              Page publique
            </span>
          </div>
          <h1 className="text-3xl font-bold text-stone-900 mt-4">{profile.full_name ?? profile.username}</h1>
          {profile.bio && <p className="text-stone-500 text-sm max-w-xl mx-auto mt-2 leading-relaxed">{profile.bio}</p>}
        </div>

        {photos.length > 0 && (
          <div className="rounded-2xl overflow-hidden border border-stone-200 bg-white shadow-sm mb-6">
            <div className="relative h-56 sm:h-72">
              <img src={photos[0].url} alt="Photo principale" className="w-full h-full object-cover" />
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
                  <div key={p.path ?? idx} className="overflow-hidden rounded-lg">
                    <img src={p.url} alt={`Photo ${idx + 2}`} className="w-full h-20 object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            {services?.length > 0 && (
              <div className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-3">Offres</p>
                <div className="space-y-2">
                  {services.slice(0, 5).map(s => (
                    <div
                      key={s.id ?? s.name}
                      className="flex items-start justify-between gap-3 rounded-xl border border-stone-100 px-4 py-3 bg-stone-50/30"
                    >
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

            <div className="rounded-xl bg-[var(--accent)]/5 border border-[var(--accent)]/15 p-4">
              <p className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>
                Réservez en ligne
              </p>
              <p className="text-xs text-stone-500 mt-1">Votre créneau est confirmé instantanément.</p>
            </div>

            <div className="mt-4">
              <BookingForm username={profile.username} />
            </div>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-3">Info</p>
            <p className="text-sm text-stone-700">
              {profile.city ? `Basé à ${profile.city}` : 'Local & sur rendez-vous.'}
            </p>
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2">Conseil</p>
              <p className="text-sm text-stone-500 leading-relaxed">
                Ajoutez des photos récentes pour augmenter la conversion.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

