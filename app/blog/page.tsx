import Link from 'next/link'

export const metadata = {
  title: 'Blog - CalendaPro',
  description: 'Actualités, conseils et astuces pour les professionnels',
}

export default function BlogPage() {
  const posts = [
    {
      title: "Comment réduire les no-shows de 40%",
      excerpt: "Découvrez les stratégies efficaces pour minimiser les absences à vos rendez-vous.",
      date: "15 avril 2026",
      category: "Conseils"
    },
    {
      title: "L'avenir de la réservation en ligne",
      excerpt: "Les tendances 2026 qui transforment le secteur des services.",
      date: "10 avril 2026",
      category: "Tendances"
    },
    {
      title: "Gestion du temps : conseils d'experts",
      excerpt: "Optimisez votre emploi du temps et gagnez en sérénité.",
      date: "5 avril 2026",
      category: "Productivité"
    }
  ]

  return (
    <main style={{ minHeight: '100vh', background: '#FAF9F6' }}>
      {/* Hero */}
      <section style={{ padding: '6rem 2rem 4rem', textAlign: 'center', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: 'white' }}>
        <Link href="/" style={{ color: '#a78bfa', textDecoration: 'none', fontSize: '0.9rem' }}>← Retour à l'accueil</Link>
        <h1 style={{ fontSize: '3rem', fontWeight: 700, margin: '2rem 0 1rem', fontFamily: 'Clash Display, sans-serif' }}>
          Blog CalendaPro
        </h1>
        <p style={{ fontSize: '1.1rem', color: '#94a3b8', maxWidth: '500px', margin: '0 auto' }}>
          Conseils, tendances et astuces pour les professionnels
        </p>
      </section>

      {/* Articles */}
      <section style={{ padding: '4rem 2rem', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {posts.map((post, i) => (
            <article key={i} style={{ padding: '2rem', background: 'white', borderRadius: '16px', border: '1px solid #e5e7eb', transition: 'transform 0.2s', cursor: 'pointer' }}>
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#7c3aed', background: 'rgba(124,58,237,0.1)', padding: '0.25rem 0.75rem', borderRadius: '100px' }}>
                  {post.category}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{post.date}</span>
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem', color: '#1a1a1a', fontFamily: 'Clash Display, sans-serif' }}>
                {post.title}
              </h2>
              <p style={{ color: '#64748b', lineHeight: 1.6 }}>{post.excerpt}</p>
            </article>
          ))}
        </div>
        
        <div style={{ textAlign: 'center', marginTop: '3rem', padding: '2rem', background: '#f3f4f6', borderRadius: '16px' }}>
          <p style={{ color: '#64748b', marginBottom: '1rem' }}>Plus d'articles à venir prochainement...</p>
          <Link href="/support" style={{ color: '#7c3aed', fontWeight: 500 }}>Besoin d'aide ? Consultez notre support →</Link>
        </div>
      </section>
    </main>
  )
}
