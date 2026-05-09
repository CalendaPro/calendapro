import { ClerkProvider } from '@clerk/nextjs'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/lib/theme-provider'
import { AccentColorProvider } from '@/lib/accent-color-provider'
import { LayoutProvider } from '@/lib/layout-provider'
import CookieBanner from '@/components/CookieBanner'


const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://calendapro.fr'

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'CalendaPro — Gérez vos rendez-vous comme un pro',
    template: '%s | CalendaPro',
  },
  description: 'Solution complète de gestion de rendez-vous pour professionnels. Acceptez des réservations en ligne 24/7, envoyez des rappels automatiques et gérez vos paiements.',
  keywords: ['rendez-vous', 'réservation', 'professionnel', 'agenda', 'calendrier', 'booking', 'RDV'],
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider afterSignOutUrl="/">
      <html lang="fr" className={inter.variable}>
        <head>
          {/* #52 - Preconnect pour les fonts externes */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link rel="preconnect" href="https://api.fontshare.com" />
        </head>
        <body className={`${inter.variable} font-sans antialiased`}>
          {/* #55 - Skip to content link pour accessibilité */}
          <a href="#main-content" className="skip-to-content">
            Aller au contenu principal
          </a>
          <ThemeProvider>
            <AccentColorProvider>
              <LayoutProvider>
                {children}
                <CookieBanner />
              </LayoutProvider>
            </AccentColorProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}