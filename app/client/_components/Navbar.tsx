import { BrandLogo } from '@/components/BrandLogo'
import UserMenuButton from '@/components/UserMenuButton'

export default function ClientNavbar() {
  return (
    <header className="bg-gradient-to-br from-stone-50 to-stone-100 border-b border-stone-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <BrandLogo href="/client" />
          <div className="flex items-center gap-4">
            <UserMenuButton />
          </div>
        </div>
      </div>
    </header>
  )
}
