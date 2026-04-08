import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'
import { getUserPlan } from '@/lib/subscription'
import { redirect } from 'next/navigation'
import WidgetCopyButton from './WidgetCopyButton'

export default async function WidgetPage() {
  const { userId } = await auth()
  const plan = await getUserPlan(userId!)

  if (plan === 'free') redirect('/dashboard/pricing')

  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', userId)
    .single()

  const username = profile?.username ?? 'votre-username'
  const widgetCode = `<script src="https://calendapro.com/widget.js" data-username="${username}"></script>`
  const widgetCodeCustom = `<script 
  src="https://calendapro.com/widget.js" 
  data-username="${username}"
  data-button-text="Réserver une séance"
  data-color="#7c3aed">
</script>`

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <p className="text-sm text-stone-400 font-medium mb-1">Intégration</p>
        <h1 className="text-3xl font-bold text-stone-900 tracking-tight">
          Widget d'intégration
        </h1>
        <p className="text-stone-500 text-sm mt-2">
          Ajoutez un bouton de réservation directement sur votre site web.
        </p>
      </div>

      {/* Aperçu */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm mb-6">
        <h2 className="font-semibold text-stone-900 mb-4">Aperçu du widget</h2>
        <div className="bg-stone-50 rounded-xl p-8 flex items-center justify-center border border-stone-100">
          <button className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 text-white rounded-xl font-semibold text-sm hover:bg-violet-700 transition-colors">
            📅 Prendre rendez-vous
          </button>
        </div>
        <p className="text-stone-400 text-xs mt-3 text-center">
          Ce bouton s'affiche sur votre site et ouvre une popup de réservation
        </p>
      </div>

      {/* Code basique */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm mb-6">
        <h2 className="font-semibold text-stone-900 mb-2">Code d'intégration</h2>
        <p className="text-stone-500 text-sm mb-4">
          Copiez ce code et collez-le dans le HTML de votre site, là où vous voulez que le bouton apparaisse.
        </p>
        <div className="bg-stone-950 rounded-xl p-4 mb-3">
          <code className="text-emerald-400 text-sm font-mono break-all">
            {widgetCode}
          </code>
        </div>
        <WidgetCopyButton code={widgetCode} label="Copier le code" />
      </div>

      {/* Code personnalisé */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm mb-6">
        <h2 className="font-semibold text-stone-900 mb-2">Personnaliser le widget</h2>
        <p className="text-stone-500 text-sm mb-4">
          Vous pouvez personnaliser le texte et la couleur du bouton.
        </p>
        <div className="bg-stone-950 rounded-xl p-4 mb-3">
          <pre className="text-emerald-400 text-sm font-mono whitespace-pre-wrap break-all">
            {widgetCodeCustom}
          </pre>
        </div>
        <WidgetCopyButton code={widgetCodeCustom} label="Copier le code personnalisé" />
      </div>

      {/* Instructions */}
      <div className="bg-violet-50 rounded-2xl border border-violet-100 p-6">
        <h2 className="font-semibold text-violet-900 mb-4">Comment l'installer ?</h2>
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-violet-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</div>
            <p className="text-violet-800 text-sm">Copiez le code ci-dessus</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-violet-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</div>
            <p className="text-violet-800 text-sm">Collez-le dans le HTML de votre site, avant la balise <code className="bg-violet-100 px-1 rounded">&lt;/body&gt;</code></p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-violet-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</div>
            <p className="text-violet-800 text-sm">Un bouton "Prendre rendez-vous" apparaît automatiquement sur votre site</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-violet-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">4</div>
            <p className="text-violet-800 text-sm">Vos clients cliquent dessus et peuvent réserver sans quitter votre site</p>
          </div>
        </div>
      </div>
    </div>
  )
}