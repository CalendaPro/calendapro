'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const sections = [
  {
    label: 'Principal',
    links: [
      {
        href: '/dashboard',
        label: 'Tableau de bord',
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>,
      },
      {
        href: '/dashboard/calendar',
        label: 'Calendrier',
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
      },
      {
        href: '/dashboard/appointments',
        label: 'Rendez-vous',
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>,
      },
    ],
  },
  {
    label: 'Gestion',
    links: [
      {
        href: '/dashboard/clients',
        label: 'Clients',
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
      },
      {
        href: '/dashboard/profile',
        label: 'Profil & paiements',
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
      },
      {
        href: '/dashboard/widget',
        label: 'Widget',
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
      },
    ],
  },
  {
    label: 'Paramètres',
    links: [
      {
        href: '/dashboard/sms',
        label: 'Crédits SMS',
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
      },
      {
        href: '/dashboard/pricing',
        label: 'Abonnements',
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
      },
    ],
  },
]

export default function SidebarNav() {
  const pathname = usePathname()

  return (
    <>
      <style>{`
        .snav {
          flex: 1;
          overflow-y: auto;
          padding: 0.6rem 0.65rem;
          display: flex;
          flex-direction: column;
          gap: 0.1rem;
        }

        .snav-section-label {
          font-size: 0.6rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #c4bfb8;
          padding: 0.7rem 0.6rem 0.25rem;
          font-family: 'DM Sans', sans-serif;
        }

        .snav-link {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.55rem 0.7rem;
          border-radius: 9px;
          font-size: 0.82rem;
          font-weight: 500;
          font-family: 'DM Sans', sans-serif;
          text-decoration: none;
          color: #64748b;
          transition: all 0.15s ease;
          border: 1px solid transparent;
          letter-spacing: -0.01em;
          position: relative;
        }

        .snav-link:hover {
          background: #f8f7f4;
          color: #0f172a;
        }

        .snav-link.active {
          background: #f5f3ff;
          color: #7c3aed;
          border-color: #ede9fe;
          font-weight: 600;
        }

        .snav-link.active .snav-icon {
          color: #7c3aed;
        }

        .snav-icon {
          flex-shrink: 0;
          color: #94a3b8;
          transition: color 0.15s;
          display: flex;
          align-items: center;
        }

        .snav-link:hover .snav-icon {
          color: #64748b;
        }

        .snav-indicator {
          margin-left: auto;
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #7c3aed;
          box-shadow: 0 0 0 2px #ede9fe;
          flex-shrink: 0;
        }

        .snav-divider {
          height: 1px;
          background: #f0ede8;
          margin: 0.35rem 0.5rem;
        }
      `}</style>

      <nav className="snav">
        {sections.map((section, si) => (
          <div key={section.label}>
            {si > 0 && <div className="snav-divider" />}
            <div className="snav-section-label">{section.label}</div>
            {section.links.map(link => {
              const isActive = pathname === link.href
              return (
                <Link key={link.href} href={link.href} className={`snav-link ${isActive ? 'active' : ''}`}>
                  <span className="snav-icon">{link.icon}</span>
                  <span>{link.label}</span>
                  {isActive && <span className="snav-indicator" />}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>
    </>
  )
}
