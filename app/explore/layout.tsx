import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'CalendaPro - Espace Client | Réservez avec les meilleurs pros',
  description: 'Découvrez des professionnels d\'exception près de chez vous. Réservez en quelques secondes, sans appel, sans attente.',
}

export default function ExploreLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
