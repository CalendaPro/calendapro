import Link from 'next/link'

export const metadata = {
  title: 'Support - CalendaPro',
  description: 'Centre d\'aide et support CalendaPro',
}

export default function SupportPage() {
  const faqs = [
    {
      q: "Comment créer mon compte ?",
      a: "Cliquez sur 'Démarrer gratuitement' en haut de page, remplissez vos informations et confirmez votre email. Votre espace pro sera créé instantanément."
    },
    {
      q: "Comment configurer mes disponibilités ?",
      a: "Dans votre dashboard, allez dans 'Paramètres' > 'Horaires' pour définir vos créneaux de travail et vos indisponibilités."
    },
    {
      q: "Comment accepter les paiements en ligne ?",
      a: "Activez Stripe dans 'Paramètres' > 'Paiements'. Connectez votre compte Stripe et vos clients pourront payer lors de la réservation."
    },
    {
      q: "Comment fonctionnent les rappels SMS ?",
      a: "Les rappels sont envoyés automatiquement 24h avant le rendez-vous. Vous pouvez configurer le contenu dans 'Paramètres' > 'Notifications'."
    },
    {
      q: "Puis-je synchroniser mon agenda Google/Outlook ?",
      a: "Oui ! Dans 'Paramètres' > 'Calendriers', connectez vos comptes externes pour synchronisation bidirectionnelle."
    },
    {
      q: "Comment annuler mon abonnement ?",
      a: "Vous pouvez résilier à tout moment dans 'Paramètres' > 'Abonnement'. Votre accès reste actif jusqu'à la fin de la période payée."
    }
  ]

  return (
    <main style={{ minHeight: '100vh', background: '#FAF9F6' }}>
      {/* Hero */}
      <section style={{ padding: '6rem 2rem 4rem', textAlign: 'center', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: 'white' }}>
        <Link href="/" style={{ color: '#a78bfa', textDecoration: 'none', fontSize: '0.9rem' }}>← Retour à l'accueil</Link>
        <h1 style={{ fontSize: '3rem', fontWeight: 700, margin: '2rem 0 1rem', fontFamily: 'Clash Display, sans-serif' }}>
          Centre d'aide
        </h1>
        <p style={{ fontSize: '1.1rem', color: '#94a3b8', maxWidth: '500px', margin: '0 auto' }}>
          Trouvez des réponses à vos questions ou contactez notre équipe
        </p>
      </section>

      {/* FAQ */}
      <section style={{ padding: '4rem 2rem', maxWidth: '800px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '2rem', color: '#1a1a1a', fontFamily: 'Clash Display, sans-serif', textAlign: 'center' }}>
          Questions fréquentes
        </h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {faqs.map((faq, i) => (
            <details key={i} style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
              <summary style={{ padding: '1.25rem', cursor: 'pointer', fontWeight: 600, color: '#1a1a1a', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {faq.q}
                <span style={{ color: '#7c3aed' }}>▼</span>
              </summary>
              <div style={{ padding: '0 1.25rem 1.25rem', color: '#64748b', lineHeight: 1.6 }}>
                {faq.a}
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section style={{ padding: '4rem 2rem', background: 'white', borderTop: '1px solid #e5e7eb' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: '#1a1a1a', fontFamily: 'Clash Display, sans-serif' }}>
            Besoin d'aide personnalisée ?
          </h2>
          <p style={{ color: '#64748b', marginBottom: '2rem' }}>
            Notre équipe est disponible du lundi au vendredi, 9h-18h
          </p>
          
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="mailto:support@calendapro.fr" style={{ padding: '1rem 2rem', background: '#7c3aed', color: 'white', borderRadius: '100px', textDecoration: 'none', fontWeight: 600 }}>
              Email : support@calendapro.fr
            </a>
            <a href="#" style={{ padding: '1rem 2rem', background: '#f3f4f6', color: '#374151', borderRadius: '100px', textDecoration: 'none', fontWeight: 600 }}>
              Chat en direct (bientôt)
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}
