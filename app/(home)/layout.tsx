import type { Metadata } from 'next'

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://calendapro.fr'

export const metadata: Metadata = {
  title: 'CalendaPro — Gérez vos rendez-vous comme un pro',
  description: 'Solution complète de gestion de rendez-vous pour professionnels. Acceptez des réservations en ligne 24/7, envoyez des rappels automatiques et gérez vos paiements.',
  keywords: ['rendez-vous', 'réservation', 'professionnel', 'agenda', 'calendrier', 'booking', 'RDV', 'gestion rendez-vous', 'planning'],
  authors: [{ name: 'CalendaPro' }],
  creator: 'CalendaPro',
  publisher: 'CalendaPro',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: baseUrl,
    siteName: 'CalendaPro',
    title: 'CalendaPro — Gérez vos rendez-vous comme un pro',
    description: 'Solution complète de gestion de rendez-vous pour professionnels. Acceptez des réservations en ligne 24/7.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'CalendaPro - Gestion de rendez-vous pour professionnels',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CalendaPro — Gérez vos rendez-vous comme un pro',
    description: 'Solution complète de gestion de rendez-vous pour professionnels.',
    images: ['/og-image.png'],
    creator: '@calendapro',
  },
  alternates: {
    canonical: '/',
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
}

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
