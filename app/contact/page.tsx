import Link from 'next/link'

export const metadata = {
  title: 'Contact - CalendaPro',
  description: 'Contactez l\'équipe CalendaPro',
}

export default function ContactPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#FAF9F6', padding: '4rem 2rem' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <Link href="/" style={{ color: '#7c3aed', textDecoration: 'none', fontSize: '0.9rem' }}>← Retour à l'accueil</Link>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 700, margin: '2rem 0 1rem', color: '#1a1a1a', fontFamily: 'Clash Display, sans-serif' }}>
          Contactez-nous
        </h1>
        <p style={{ color: '#64748b', marginBottom: '2rem' }}>
          Une question ? Un projet ? Nous sommes là pour vous aider.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '3rem' }}>
          <div style={{ padding: '1.5rem', background: 'white', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
            <h3 style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#1a1a1a' }}>Support client</h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '0.75rem' }}>Pour toute question sur votre compte</p>
            <a href="mailto:support@calendapro.fr" style={{ color: '#7c3aed', fontWeight: 500 }}>support@calendapro.fr</a>
          </div>
          
          <div style={{ padding: '1.5rem', background: 'white', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
            <h3 style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#1a1a1a' }}>Presse & Partenariats</h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '0.75rem' }}>Pour les médias et collaborations</p>
            <a href="mailto:presse@calendapro.fr" style={{ color: '#7c3aed', fontWeight: 500 }}>presse@calendapro.fr</a>
          </div>
          
          <div style={{ padding: '1.5rem', background: 'white', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
            <h3 style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#1a1a1a' }}>Adresse</h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
              CalendaPro SAS<br />
              Paris, France
            </p>
          </div>
        </div>

        <div style={{ textAlign: 'center', padding: '2rem', background: '#0f172a', borderRadius: '16px', color: 'white' }}>
          <h3 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Besoin d'aide rapide ?</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1rem' }}>Consultez notre centre d'aide</p>
          <Link href="/support" style={{ display: 'inline-block', padding: '0.75rem 1.5rem', background: '#7c3aed', color: 'white', borderRadius: '100px', textDecoration: 'none', fontWeight: 600 }}>
            Voir le Support
          </Link>
        </div>
      </div>
    </main>
  )
}
