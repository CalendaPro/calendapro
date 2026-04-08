import { PLANS } from '@/lib/stripe'
import PricingButton from '@/app/dashboard/pricing/PricingButton'
import { auth } from '@clerk/nextjs/server'
import { getUserPlan } from '@/lib/subscription'

export default async function PricingPage() {
  const { userId } = await auth()
  const currentPlan = await getUserPlan(userId!)

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-10 text-center">
        <p className="text-sm text-stone-400 font-medium mb-1">Abonnements</p>
        <h1 className="text-3xl font-bold text-stone-900 tracking-tight mb-3">
          Choisissez votre plan
        </h1>
        <p className="text-stone-500 text-sm max-w-md mx-auto">
          Démarrez gratuitement. Upgradez quand votre activité se développe.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-6">

        {/* Free */}
        <div className={`bg-white rounded-2xl border p-6 shadow-sm relative ${currentPlan === 'free' ? 'border-violet-300 ring-2 ring-violet-100' : 'border-stone-200'}`}>
          {currentPlan === 'free' && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full">
              Plan actuel
            </div>
          )}
          <div className="mb-6">
            <div className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">{PLANS.free.name}</div>
            <div className="text-4xl font-bold text-stone-900 tracking-tight">0€</div>
            <div className="text-stone-400 text-sm mt-1">pour toujours</div>
          </div>
          <ul className="flex flex-col gap-2.5 mb-6">
            {PLANS.free.features.map(f => (
              <li key={f} className="flex items-center gap-2 text-sm text-stone-600">
                <span className="text-emerald-500 font-bold">✓</span> {f}
              </li>
            ))}
          </ul>
          <div className="w-full bg-stone-100 text-stone-500 font-semibold text-sm py-2.5 rounded-xl text-center">
            {currentPlan === 'free' ? 'Plan actuel' : 'Gratuit'}
          </div>
        </div>

        {/* Premium */}
        <div className={`relative rounded-2xl border p-6 shadow-xl ${currentPlan === 'premium' ? 'bg-stone-900 border-violet-400 ring-2 ring-violet-300' : 'bg-stone-900 border-stone-800'}`}>
          {currentPlan === 'premium' ? (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full">
              Plan actuel
            </div>
          ) : (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-violet-600 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full">
              Populaire
            </div>
          )}
          <div className="mb-6">
            <div className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">{PLANS.premium.name}</div>
            <div className="text-4xl font-bold text-white tracking-tight">19€</div>
            <div className="text-stone-400 text-sm mt-1">par mois</div>
          </div>
          <ul className="flex flex-col gap-2.5 mb-6">
            {PLANS.premium.features.map(f => (
              <li key={f} className="flex items-center gap-2 text-sm text-stone-300">
                <span className="text-violet-400 font-bold">✓</span> {f}
              </li>
            ))}
          </ul>
          {currentPlan === 'premium' ? (
            <div className="w-full bg-emerald-500/20 text-emerald-400 font-semibold text-sm py-2.5 rounded-xl text-center">
              Plan actuel ✓
            </div>
          ) : (
            <PricingButton priceId={PLANS.premium.priceId!} label="Passer au Premium" isUpgrade={false} />
          )}
        </div>

        {/* Infinity */}
        <div className={`bg-white rounded-2xl border p-6 shadow-sm relative ${currentPlan === 'infinity' ? 'border-violet-300 ring-2 ring-violet-100' : 'border-stone-200'}`}>
          {currentPlan === 'infinity' && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full">
              Plan actuel
            </div>
          )}
          <div className="mb-6">
            <div className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">{PLANS.infinity.name}</div>
            <div className="text-4xl font-bold text-stone-900 tracking-tight">49€</div>
            <div className="text-stone-400 text-sm mt-1">par mois</div>
          </div>
          <ul className="flex flex-col gap-2.5 mb-6">
            {PLANS.infinity.features.map(f => (
              <li key={f} className="flex items-center gap-2 text-sm text-stone-600">
                <span className="text-pink-500 font-bold">✓</span> {f}
              </li>
            ))}
          </ul>
          {currentPlan === 'infinity' ? (
            <div className="w-full bg-emerald-500/20 text-emerald-600 font-semibold text-sm py-2.5 rounded-xl text-center">
              Plan actuel ✓
            </div>
          ) : (
            <PricingButton
              priceId={PLANS.infinity.priceId!}
              label={currentPlan === 'premium' ? 'Upgrader vers Infinity' : 'Passer à Infinity'}
              isUpgrade={currentPlan === 'premium'}
            />
          )}
        </div>

      </div>

      {currentPlan === 'premium' && (
        <div className="mt-6 bg-violet-50 border border-violet-100 rounded-2xl p-4 text-center">
          <p className="text-violet-700 text-sm font-medium">
            ✦ Upgrade vers Infinity — vous ne payez que la différence pour les jours restants du mois.
          </p>
        </div>
      )}

      <p className="text-center text-stone-400 text-xs mt-6">
        Paiement sécurisé par Stripe · Annulation à tout moment · Sans engagement
      </p>
    </div>
  )
}