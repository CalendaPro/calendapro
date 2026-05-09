import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Politique de Cookies - CalendaPro',
  description: 'Politique de cookies de CalendaPro - Informations sur les cookies utilisés et comment les gérer.',
  alternates: {
    canonical: '/legal/politique-cookies',
  },
}

export default function PolitiqueCookiesPage() {
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
          Politique de Cookies
        </h1>
        <p className="text-gray-500 mb-12">Dernière mise à jour : 25 avril 2026</p>

        <div className="prose prose-gray max-w-none">
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Qu&apos;est-ce qu&apos;un cookie ?</h2>
            <p className="text-gray-600 leading-relaxed">
              Un cookie est un petit fichier texte déposé sur votre terminal (ordinateur, tablette, smartphone) 
              lors de la visite d&apos;un site web. Il permet de stocker des informations relatives à votre navigation 
              et de faciliter votre expérience utilisateur.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Cookies utilisés par CalendaPro</h2>
            
            <h3 className="text-lg font-medium text-gray-800 mb-3">2.1 Cookies techniques et essentiels</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Ces cookies sont indispensables au fonctionnement du site et ne peuvent pas être désactivés.
            </p>
            <div className="bg-gray-50 rounded-lg overflow-hidden mb-6">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Cookie</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Finalité</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Durée</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600">
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4 font-mono text-xs">__session</td>
                    <td className="py-3 px-4">Authentification utilisateur (Clerk)</td>
                    <td className="py-3 px-4">Session</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4 font-mono text-xs">calendapro_source</td>
                    <td className="py-3 px-4">Tracking source acquisition</td>
                    <td className="py-3 px-4">30 jours</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4 font-mono text-xs">pending_pro_selection</td>
                    <td className="py-3 px-4">Tunnel de réservation</td>
                    <td className="py-3 px-4">24 heures</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-mono text-xs">cookie_consent</td>
                    <td className="py-3 px-4">Enregistrement du choix cookies</td>
                    <td className="py-3 px-4">1 an</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-lg font-medium text-gray-800 mb-3">2.2 Cookies de paiement (Stripe)</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Lors des transactions, Stripe dépose des cookies nécessaires à la sécurité et à la prévention de la fraude :
            </p>
            <div className="bg-gray-50 rounded-lg overflow-hidden mb-6">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Cookie</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Finalité</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600">
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4 font-mono text-xs">__stripe_sid / __stripe_mid</td>
                    <td className="py-3 px-4">Session de paiement sécurisée</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-mono text-xs">m</td>
                    <td className="py-3 px-4">Prévention de la fraude (fingerprinting)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-lg font-medium text-gray-800 mb-3">2.3 Cookies analytiques (optionnels)</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Ces cookies nous aident à comprendre comment les visiteurs interagissent avec notre site. 
              Ils ne sont déposés qu&apos;avec votre consentement.
            </p>
            <div className="bg-gray-50 rounded-lg overflow-hidden mb-6">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Service</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Finalité</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600">
                  <tr>
                    <td className="py-3 px-4">Google Analytics</td>
                    <td className="py-3 px-4">Mesure d&apos;audience et statistiques de navigation</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Gestion des cookies</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Vous pouvez gérer vos préférences en matière de cookies de différentes manières :
            </p>
            
            <h3 className="text-lg font-medium text-gray-800 mb-3">3.1 Via notre bandeau de cookies</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Lors de votre première visite, un bandeau vous permet d&apos;accepter ou de refuser les cookies analytiques. 
              Vous pouvez modifier ce choix à tout moment en cliquant sur &quot;Paramètres des cookies&quot; en bas de page.
            </p>

            <h3 className="text-lg font-medium text-gray-800 mb-3">3.2 Via les paramètres de votre navigateur</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Vous pouvez configurer votre navigateur pour :
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4 mb-4">
              <li>Accepter ou refuser tous les cookies</li>
              <li>Être alerté lorsqu&apos;un cookie est déposé</li>
              <li>Supprimer les cookies existants</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mb-4">
              Consultez l&apos;aide de votre navigateur :
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-violet-600 hover:underline">Chrome</a></li>
              <li><a href="https://support.mozilla.org/fr/kb/cookies-informations-sites-enregistrent" target="_blank" rel="noopener noreferrer" className="text-violet-600 hover:underline">Firefox</a></li>
              <li><a href="https://support.apple.com/fr-fr/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-violet-600 hover:underline">Safari</a></li>
              <li><a href="https://support.microsoft.com/fr-fr/microsoft-edge" target="_blank" rel="noopener noreferrer" className="text-violet-600 hover:underline">Edge</a></li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Conséquences du refus des cookies</h2>
            <p className="text-gray-600 leading-relaxed">
              Le refus des cookies techniques peut empêcher le fonctionnement normal du site 
              (notamment l&apos;authentification et les paiements). Le refus des cookies analytiques 
              n&apos;affecte pas le fonctionnement du site mais limite notre capacité à l&apos;améliorer.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Durée de conservation</h2>
            <p className="text-gray-600 leading-relaxed">
              Les cookies sont conservés pour une durée maximale de 13 mois à compter de leur dépôt, 
              conformément aux recommandations de la CNIL. À l&apos;expiration de cette période, 
              votre consentement sera à nouveau demandé.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Contact</h2>
            <p className="text-gray-600 leading-relaxed">
              Pour toute question concernant notre politique de cookies :<br />
              Email : <a href="mailto:contact.calendapro@gmail.com" className="text-violet-600 hover:underline">contact.calendapro@gmail.com</a>
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
