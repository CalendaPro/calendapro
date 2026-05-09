import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Conditions Générales de Vente - CalendaPro',
  description: 'Conditions générales de vente de CalendaPro - Réservations, paiements et commissions.',
  alternates: {
    canonical: '/legal/cgv',
  },
}

export default function CGVPage() {
  return (
    <main className="min-h-screen bg-[#F7F5F0] py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <Link 
          href="/" 
          className="inline-flex items-center text-sm text-violet-600 hover:text-violet-700 transition-colors mb-8"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Retour à l&apos;accueil
        </Link>

        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Clash Display, sans-serif' }}>
          Conditions Générales de Vente
        </h1>
        <p className="text-gray-500 mb-12">Dernière mise à jour : 25 avril 2026</p>

        <div className="prose prose-gray max-w-none">
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Préambule</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Les présentes Conditions Générales de Vente (CGV) régissent les relations contractuelles entre :
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li><strong>CalendaPro SAS</strong>, société immatriculée au RCS de Paris sous le numéro [En cours d'immatriculation], ci-après dénommée &quot;la Plateforme&quot;</li>
              <li>Les professionnels utilisant la plateforme pour gérer leurs rendez-vous et paiements, ci-après dénommés &quot;les Pros&quot;</li>
              <li>Les clients réalisant des réservations via la plateforme, ci-après dénommés &quot;les Clients&quot;</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Conditions de réservation et paiement</h2>
            <h3 className="text-lg font-medium text-gray-800 mb-3">2.1 Réservation</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              La réservation d&apos;un rendez-vous s&apos;effectue en ligne via la fiche publique du professionnel ou par invitation directe. 
              La confirmation de la réservation dépend des paramètres définis par le Pro :
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4 mb-4">
              <li><strong>Réservation instantanée</strong> : confirmation immédiate sans validation du Pro</li>
              <li><strong>Réservation sur demande</strong> : validation manuelle requise dans un délai de 24h</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mb-3">2.2 Paiement</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Le paiement peut être effectué :
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li><strong>En ligne</strong> via Stripe (carte bancaire) au moment de la réservation</li>
              <li><strong>Sur place</strong> selon les modalités définies par le Pro</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Politique d&apos;annulation et remboursement</h2>
            <h3 className="text-lg font-medium text-gray-800 mb-3">3.1 Annulation par le Client</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Les conditions d&apos;annulation sont définies par chaque Pro dans ses paramètres :
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4 mb-4">
              <li><strong>Annulation gratuite</strong> : jusqu&apos;à 24h avant le rendez-vous</li>
              <li><strong>Annulation payante</strong> : au-delà du délai défini, le montant total ou partiel peut être facturé</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mb-3">3.2 Annulation par le Pro</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              En cas d&apos;annulation par le Pro, le Client est intégralement remboursé si un paiement en ligne a été effectué. 
              Le Pro s&apos;engage à notifier le Client dans les meilleurs délais.
            </p>

            <h3 className="text-lg font-medium text-gray-800 mb-3">3.3 Remboursement</h3>
            <p className="text-gray-600 leading-relaxed">
              Les remboursements sont traités sous 5 à 10 jours ouvrés selon les délais bancaires. 
              Pour toute question : <a href="mailto:support@calendapro.fr" className="text-violet-600 hover:underline">support@calendapro.fr</a>
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Commissions CalendaPro</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              CalendaPro applique des commissions sur les transactions selon le forfait du Pro :
            </p>
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 font-medium text-gray-700">Forfait</th>
                    <th className="text-right py-2 font-medium text-gray-700">Commission</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600">
                  <tr className="border-b border-gray-100">
                    <td className="py-2">Starter</td>
                    <td className="text-right">5% par transaction</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2">Premium</td>
                    <td className="text-right">0%</td>
                  </tr>
                  <tr>
                    <td className="py-2">Infinity</td>
                    <td className="text-right">0%</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-gray-600 leading-relaxed">
              La commission est automatiquement déduite lors du paiement pour les comptes Starter. 
              Les Pros Premium et Infinity reçoivent l&apos;intégralité du montant.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Obligations des Pros</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Les Pros s&apos;engagent à :
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>Respecter les rendez-vous confirmés ou notifier les annulations dans les délais</li>
              <li>Maintainir leurs disponibilités à jour sur la plateforme</li>
              <li>Respecter les tarifs affichés lors de la réservation</li>
              <li>Fournir un service conforme à la description</li>
              <li>Respecter la législation en vigueur applicable à leur activité</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Obligations des Clients</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Les Clients s&apos;engagent à :
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>Fournir des informations exactes lors de la réservation</li>
              <li>Se présenter au rendez-vous convenu ou annuler dans les délais impartis</li>
              <li>Respecter les conditions de paiement définies par le Pro</li>
              <li>Respecter le Pro et ses locaux</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Médiation des litiges</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              En cas de litige entre un Client et un Pro, les parties s&apos;engagent à rechercher une solution amiable.
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              À défaut d&apos;accord amiable dans un délai de 30 jours, le litige pourra être soumis à une médiation 
              ou à la juridiction compétente.
            </p>
            <p className="text-gray-600 leading-relaxed">
              CalendaPro propose un service de médiation interne : <a href="mailto:mediation@calendapro.fr" className="text-violet-600 hover:underline">mediation@calendapro.fr</a>
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Force majeure</h2>
            <p className="text-gray-600 leading-relaxed">
              Ni le Client ni le Pro ne seront tenus responsables de l&apos;inexécution de leurs obligations 
              en cas de force majeure telle que définie par la jurisprudence française.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Droit applicable</h2>
            <p className="text-gray-600 leading-relaxed">
              Les présentes CGV sont soumises au droit français. En cas de litige, les tribunaux français seront compétents.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Contact</h2>
            <p className="text-gray-600 leading-relaxed">
              Pour toute question concernant les CGV :<br />
              Email : <a href="mailto:legal@calendapro.fr" className="text-violet-600 hover:underline">legal@calendapro.fr</a><br />
              Adresse : CalendaPro - Paris, France
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
