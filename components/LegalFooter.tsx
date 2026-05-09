'use client'

import Link from 'next/link'

export default function LegalFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="w-full py-8 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#FAF9F6' }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Copyright */}
          <p className="text-sm text-gray-500">
            © {currentYear} CalendaPro — Tous droits réservés
          </p>

          {/* Links */}
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <Link 
              href="/mentions-legales" 
              className="text-sm text-gray-500 hover:text-violet-600 transition-colors"
            >
              Mentions légales
            </Link>
            <Link 
              href="/cgu" 
              className="text-sm text-gray-500 hover:text-violet-600 transition-colors"
            >
              CGU
            </Link>
            <Link 
              href="/legal/cgv" 
              className="text-sm text-gray-500 hover:text-violet-600 transition-colors"
            >
              CGV
            </Link>
            <Link 
              href="/confidentialite" 
              className="text-sm text-gray-500 hover:text-violet-600 transition-colors"
            >
              Confidentialité
            </Link>
            <Link 
              href="/legal/politique-cookies" 
              className="text-sm text-gray-500 hover:text-violet-600 transition-colors"
            >
              Cookies
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}
