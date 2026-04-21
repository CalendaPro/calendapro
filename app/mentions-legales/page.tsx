import Link from 'next/link'

export const metadata = {
  title: 'Mentions Légales - CalendaPro',
  description: 'Mentions légales de CalendaPro',
}

export default function MentionsLegalesPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#FAF9F6', padding: '4rem 2rem' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <Link href="/" style={{ color: '#7c3aed', textDecoration: 'none', fontSize: '0.9rem' }}>← Retour à l'accueil</Link>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 700, margin: '2rem 0 1rem', color: '#1a1a1a', fontFamily: 'Clash Display, sans-serif' }}>
          Mentions Légales
        </h1>
        <p style={{ color: '#64748b', marginBottom: '2rem' }}>Dernière mise à jour : 21 avril 2026</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', color: '#374151', lineHeight: 1.7 }}>
          <section>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 600, marginBottom: '1rem', color: '#1a1a1a' }}>Éditeur du site</h2>
            <p><strong>CalendaPro SAS</strong></p>
            <p>Siège social : Paris, France</p>
            <p>SIRET : 000 000 000 00000</p>
            <p>RCS : Paris B 000 000 000</p>
            <p>Capital social : 10 000 €</p>
            <p>Email : contact@calendapro.fr</p>
          </section>
          
          <section>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 600, marginBottom: '1rem', color: '#1a1a1a' }}>Directeur de la publication</h2>
            <p>Directeur de la publication : [Nom du fondateur]</p>
          </section>
          
          <section>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 600, marginBottom: '1rem', color: '#1a1a1a' }}>Hébergement</h2>
            <p>Le site est hébergé par :</p>
            <p><strong>Vercel Inc.</strong></p>
            <p>340 S Lemon Ave #4133</p>
            <p>Walnut, CA 91789</p>
            <p>États-Unis</p>
          </section>
          
          <section>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 600, marginBottom: '1rem', color: '#1a1a1a' }}>Propriété intellectuelle</h2>
            <p>Tous les éléments du site (textes, images, logos, graphismes) sont protégés par le droit d'auteur. Toute reproduction sans autorisation préalable est interdite.</p>
          </section>
          
          <section>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 600, marginBottom: '1rem', color: '#1a1a1a' }}>Traitement des données personnelles</h2>
            <p>Conformément à la loi Informatique et Libertés et au RGPD, vous disposez d'un droit d'accès, de modification et de suppression des données vous concernant. Voir notre <Link href="/confidentialite" style={{ color: '#7c3aed' }}>Politique de Confidentialité</Link>.</p>
          </section>
          
          <section>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 600, marginBottom: '1rem', color: '#1a1a1a' }}>Contact</h2>
            <p>Email : contact@calendapro.fr</p>
            <p>Adresse : Paris, France</p>
          </section>
        </div>
      </div>
    </main>
  )
}
