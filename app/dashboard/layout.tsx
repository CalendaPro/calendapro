import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import SidebarNav from './SidebarNav'
import { BrandLogo } from '@/components/BrandLogo'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await currentUser()
  if (!user) redirect('/sign-in')

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&display=swap');
        @import url('https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&display=swap');

        *, *::before, *::after { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; background: #f8f7f4; font-family: 'DM Sans', sans-serif; }

        .dl-root { display: flex; min-height: 100vh; }

        .dl-sidebar {
          width: 252px;
          min-width: 252px;
          background: #ffffff;
          border-right: 1px solid #ede9e3;
          display: flex;
          flex-direction: column;
          position: fixed;
          top: 0; left: 0;
          height: 100vh;
          max-height: 100vh;
          min-height: 0;
          z-index: 40;
          box-shadow: 2px 0 8px rgba(0,0,0,0.03);
        }

        .dl-nav-scroll {
          flex: 1;
          min-height: 0;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .dl-logo-wrap {
          padding: 1.4rem 1.4rem 1.1rem;
          border-bottom: 1px solid #f0ede8;
          flex-shrink: 0;
        }

        .dl-dev-badge {
          margin-top: 0.5rem;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 100px;
          padding: 2px 8px;
        }

        .dl-dev-dot {
          width: 5px; height: 5px;
          border-radius: 50%;
          background: #10b981;
          animation: blink 2s infinite;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        .dl-dev-label {
          font-size: 0.62rem;
          font-weight: 600;
          color: #059669;
          letter-spacing: 0.03em;
        }

        .dl-infinity-card {
          margin: 0.6rem 0.75rem;
          padding: 0.85rem;
          border-radius: 12px;
          background: linear-gradient(135deg, #faf5ff, #fdf2f8);
          border: 1px solid #e9d5ff;
          flex-shrink: 0;
        }

        .dl-infinity-title {
          font-family: 'Clash Display', sans-serif;
          font-size: 0.73rem;
          font-weight: 600;
          color: #7c3aed;
          margin-bottom: 0.2rem;
        }

        .dl-infinity-desc {
          font-size: 0.67rem;
          color: #94a3b8;
          line-height: 1.5;
          margin-bottom: 0.55rem;
        }

        .dl-infinity-btn {
          width: 100%;
          background: linear-gradient(135deg, #7c3aed, #ec4899);
          color: white;
          font-size: 0.68rem;
          font-weight: 600;
          padding: 0.38rem;
          border-radius: 7px;
          border: none;
          cursor: default;
          letter-spacing: 0.02em;
        }

        .dl-user-wrap {
          padding: 0.85rem 1rem;
          border-top: 1px solid #f0ede8;
          display: flex;
          align-items: center;
          gap: 0.65rem;
          flex-shrink: 0;
          background: #fafaf8;
        }

        .dl-user-avatar-slot {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .dl-user-avatar-slot .cl-userButtonBox {
          flex-shrink: 0;
        }

        .dl-user-name {
          font-size: 0.77rem;
          font-weight: 600;
          color: #0f172a;
          font-family: 'Clash Display', sans-serif;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          letter-spacing: -0.01em;
        }

        .dl-user-email {
          font-size: 0.65rem;
          color: #94a3b8;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .dl-main {
          margin-left: 252px;
          width: calc(100% - 252px);
          min-height: 100vh;
          background: #f8f7f4;
        }
      `}</style>

      <div className="dl-root">
        <aside className="dl-sidebar">
          <div className="dl-logo-wrap">
            <BrandLogo href="/" size="compact" />
            <div className="dl-dev-badge">
              <div className="dl-dev-dot" />
              <span className="dl-dev-label">Développement</span>
            </div>
          </div>

          <div className="dl-nav-scroll">
            <SidebarNav />
          </div>

          <div className="dl-infinity-card">
            <div className="dl-infinity-title">✦ CalendaPro Infinity</div>
            <p className="dl-infinity-desc">IA conversationnelle + automatisations avancées</p>
            <button className="dl-infinity-btn">Bientôt disponible</button>
          </div>

          <div className="dl-user-wrap">
            <div className="dl-user-avatar-slot">
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: 'h-9 w-9 ring-2 ring-violet-100 ring-offset-2 ring-offset-[#fafaf8]',
                  },
                }}
              />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="dl-user-name">{user.firstName ?? user.username ?? 'Compte'}</div>
              <div className="dl-user-email">{user.emailAddresses[0]?.emailAddress ?? ''}</div>
            </div>
          </div>
        </aside>

        <main className="dl-main">{children}</main>
      </div>
    </>
  )
}
