import type { Metadata } from 'next'

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://calendapro.fr'

export const metadata: Metadata = {
  title: 'Marketplace — Trouvez les meilleurs professionnels',
  description: 'Découvrez et réservez avec les meilleurs professionnels près de chez vous. Coiffeurs, barbiers, coachs, thérapeutes, freelances et plus encore sur CalendaPro.',
  keywords: ['professionnels', 'marketplace', 'réservation', 'coiffeur', 'barbier', 'coach', 'thérapeute', 'freelance', 'rendez-vous'],
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: `${baseUrl}/marketplace`,
    siteName: 'CalendaPro',
    title: 'Marketplace CalendaPro — Trouvez les meilleurs professionnels',
    description: 'Découvrez et réservez avec les meilleurs professionnels près de chez vous.',
    images: [
      {
        url: '/og-marketplace.png',
        width: 1200,
        height: 630,
        alt: 'Marketplace CalendaPro - Découvrez les meilleurs professionnels',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Marketplace CalendaPro — Trouvez les meilleurs professionnels',
    description: 'Découvrez et réservez avec les meilleurs professionnels près de chez vous.',
    images: ['/og-marketplace.png'],
  },
  alternates: {
    canonical: '/marketplace',
  },
}

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
