import Link from 'next/link'

export const metadata = {
  title: 'Politique de Confidentialité - CalendaPro',
  description: 'Politique de confidentialité et protection des données de CalendaPro',
}

export default function ConfidentialitePage() {
  return (
    <main style={{ minHeight: '100vh', background: '#FAF9F6', padding: '4rem 2rem' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <Link href="/" style={{ color: '#7c3aed', textDecoration: 'none', fontSize: '0.9rem' }}>← Retour à l'accueil</Link>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 700, margin: '2rem 0 1rem', color: '#1a1a1a', fontFamily: 'Clash Display, sans-serif' }}>
          Politique de Confidentialité
        </h1>
        <p style={{ color: '#64748b', marginBottom: '2rem' }}>Dernière mise à jour : 21 avril 2026</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', color: '#374151', lineHeight: 1.7 }}>
          <section>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 600, marginBottom: '1rem', color: '#1a1a1a' }}>1. Collecte des données</h2>
            <p>Nous collectons uniquement les données nécessaires au fonctionnement du service :</p>
            <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
              <li>Nom, email, téléphone (professionnels et clients)</li>
              <li>Informations de rendez-vous</li>
              <li>Données de paiement (via Stripe, non stockées sur nos serveurs)</li>
              <li>Préférences utilisateur</li>
            </ul>
          </section>
          
          <section>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 600, marginBottom: '1rem', color: '#1a1a1a' }}>2. Utilisation des données</h2>
            <p>Vos données sont utilisées pour :</p>
            <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
              <li>Fournir et améliorer nos services</li>
              <li>Envoyer des notifications et rappels</li>
              <li>Traiter les paiements</li>
              <li>Assurer la sécurité de la plateforme</li>
            </ul>
          </section>
          
          <section>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 600, marginBottom: '1rem', color: '#1a1a1a' }}>3. Protection des données</h2>
            <p>Nous mettons en œuvre des mesures de sécurité robustes : chiffrement des données, serveurs sécurisés en Europe, accès restreint au personnel autorisé.</p>
          </section>
          
          <section>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 600, marginBottom: '1rem', color: '#1a1a1a' }}>4. Vos droits (RGPD)</h2>
            <p>Conformément au RGPD, vous disposez des droits suivants :</p>
            <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
              <li>Droit d'accès à vos données</li>
              <li>Droit de rectification</li>
              <li>Droit à l'effacement (droit à l'oubli)</li>
              <li>Droit à la portabilité</li>
              <li>Droit d'opposition au traitement</li>
            </ul>
          </section>
          
          <section>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 600, marginBottom: '1rem', color: '#1a1a1a' }}>5. Cookies</h2>
            <p>Nous utilisons des cookies essentiels pour le fonctionnement du service et des cookies analytiques pour améliorer l'expérience utilisateur. Vous pouvez gérer vos préférences dans les paramètres de votre navigateur.</p>
          </section>
          
          <section>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 600, marginBottom: '1rem', color: '#1a1a1a' }}>6. Contact DPO</h2>
            <p>Pour exercer vos droits ou poser des questions : dpo@calendapro.fr</p>
          </section>
        </div>
      </div>
    </main>
  )
}
