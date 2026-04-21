import Link from 'next/link'

export const metadata = {
  title: 'Documentation - CalendaPro',
  description: 'Documentation et guides d\'utilisation de CalendaPro',
}

export default function DocumentationPage() {
  const guides = [
    {
      title: "Premiers pas",
      items: ["Créer votre compte", "Configurer votre profil", "Définir vos horaires", "Inviter votre équipe"]
    },
    {
      title: "Rendez-vous",
      items: ["Créer un rendez-vous", "Gérer les annulations", "Rappels automatiques", "Synchronisation agenda"]
    },
    {
      title: "Paiements",
      items: ["Connecter Stripe", "Configurer les tarifs", "Remboursements", "Facturation"]
    },
    {
      title: "Paramètres",
      items: ["Notifications", "Personnalisation", "Intégrations", "Sécurité"]
    }
  ]

  return (
    <main style={{ minHeight: '100vh', background: '#FAF9F6' }}>
      {/* Hero */}
      <section style={{ padding: '6rem 2rem 4rem', textAlign: 'center', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: 'white' }}>
        <Link href="/" style={{ color: '#a78bfa', textDecoration: 'none', fontSize: '0.9rem' }}>← Retour à l'accueil</Link>
        <h1 style={{ fontSize: '3rem', fontWeight: 700, margin: '2rem 0 1rem', fontFamily: 'Clash Display, sans-serif' }}>
          Documentation
        </h1>
        <p style={{ fontSize: '1.1rem', color: '#94a3b8', maxWidth: '500px', margin: '0 auto' }}>
          Guides et ressources pour maîtriser CalendaPro
        </p>
      </section>

      {/* Guides */}
      <section style={{ padding: '4rem 2rem', maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
          {guides.map((guide, i) => (
            <div key={i} style={{ padding: '1.5rem', background: 'white', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
              <h3 style={{ fontWeight: 600, marginBottom: '1rem', color: '#1a1a1a', fontFamily: 'Clash Display, sans-serif' }}>
                {guide.title}
              </h3>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', color: '#64748b', fontSize: '0.9rem' }}>
                {guide.items.map((item, j) => (
                  <li key={j} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: '#7c3aed' }}>•</span> {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        <div style={{ textAlign: 'center', marginTop: '3rem', padding: '2rem', background: '#0f172a', borderRadius: '16px', color: 'white' }}>
          <h3 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Documentation API</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1rem' }}>Intégrez CalendaPro à vos outils</p>
          <a href="#" style={{ display: 'inline-block', padding: '0.75rem 1.5rem', background: '#7c3aed', color: 'white', borderRadius: '100px', textDecoration: 'none', fontWeight: 600 }}>
            Voir la doc API (bientôt)
          </a>
        </div>
      </section>
    </main>
  )
}
