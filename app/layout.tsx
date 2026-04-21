import { ClerkProvider } from '@clerk/nextjs'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/lib/theme-provider'
import { AccentColorProvider } from '@/lib/accent-color-provider'
import { LayoutProvider } from '@/lib/layout-provider'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'CalendaPro',
  description: 'Gérez vos rendez-vous comme un pro',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider afterSignOutUrl="/">
      <html lang="fr" className={inter.variable}>
        <body className={`${inter.variable} font-sans antialiased`}>
          <ThemeProvider>
            <AccentColorProvider>
              <LayoutProvider>
                {children}
              </LayoutProvider>
            </AccentColorProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}