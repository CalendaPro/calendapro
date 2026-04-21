import Link from 'next/link'

export const metadata = {
  title: 'Conditions Générales d\'Utilisation - CalendaPro',
  description: 'Conditions générales d\'utilisation de CalendaPro',
}

export default function CGUPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#FAF9F6', padding: '4rem 2rem' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <Link href="/" style={{ color: '#7c3aed', textDecoration: 'none', fontSize: '0.9rem' }}>← Retour à l'accueil</Link>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 700, margin: '2rem 0 1rem', color: '#1a1a1a', fontFamily: 'Clash Display, sans-serif' }}>
          Conditions Générales d'Utilisation
        </h1>
        <p style={{ color: '#64748b', marginBottom: '2rem' }}>Dernière mise à jour : 21 avril 2026</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', color: '#374151', lineHeight: 1.7 }}>
          <section>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 600, marginBottom: '1rem', color: '#1a1a1a' }}>1. Objet</h2>
            <p>Les présentes Conditions Générales d'Utilisation (CGU) régissent l'utilisation de la plateforme CalendaPro, solution de gestion de rendez-vous et de paiements pour professionnels.</p>
          </section>
          
          <section>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 600, marginBottom: '1rem', color: '#1a1a1a' }}>2. Inscription</h2>
            <p>L'utilisation de CalendaPro nécessite la création d'un compte. Vous vous engagez à fournir des informations exactes et à jour. Vous êtes responsable de la confidentialité de vos identifiants.</p>
          </section>
          
          <section>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 600, marginBottom: '1rem', color: '#1a1a1a' }}>3. Services proposés</h2>
            <p>CalendaPro permet aux professionnels de :</p>
            <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
              <li>Gérer leurs rendez-vous</li>
              <li>Gérer leur clientèle</li>
              <li>Accepter des paiements en ligne</li>
              <li>Envoyer des rappels automatiques</li>
              <li>Synchroniser leur agenda</li>
            </ul>
          </section>
          
          <section>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 600, marginBottom: '1rem', color: '#1a1a1a' }}>4. Paiements</h2>
            <p>Les paiements sont sécurisés via Stripe. CalendaPro applique des frais de commission sur chaque transaction selon le forfait choisi. Les reversements sont effectués selon les délais indiqués dans votre espace pro.</p>
          </section>
          
          <section>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 600, marginBottom: '1rem', color: '#1a1a1a' }}>5. Responsabilités</h2>
            <p>CalendaPro s'efforce d'assurer un service disponible 24/7 mais ne peut garantir une disponibilité ininterrompue. En cas de panne, nous nous engageons à rétablir le service dans les meilleurs délais.</p>
          </section>
          
          <section>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 600, marginBottom: '1rem', color: '#1a1a1a' }}>6. Résiliation</h2>
            <p>Vous pouvez résilier votre compte à tout moment depuis votre espace pro. Les données sont conservées pendant 30 jours puis définitivement supprimées.</p>
          </section>
          
          <section>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 600, marginBottom: '1rem', color: '#1a1a1a' }}>7. Contact</h2>
            <p>Pour toute question : contact@calendapro.fr</p>
          </section>
        </div>
      </div>
    </main>
  )
}
