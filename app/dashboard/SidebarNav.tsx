'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NAV_SECTIONS } from './_nav/links'

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
          color: var(--dl-sidebar-section-label, #c4bfb8);
          padding: 0.7rem 0.6rem 0.25rem;
          font-family: 'DM Sans', sans-serif;
        }

        .snav-link {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.55rem 0.7rem;
          border-radius: 9px;
          font-size: calc(0.82rem * var(--dl-font-scale, 1));
          font-weight: 500;
          font-family: 'DM Sans', sans-serif;
          text-decoration: none;
          color: var(--dl-sidebar-text, #64748b);
          transition: all 0.15s ease;
          border: 1px solid transparent;
          letter-spacing: -0.01em;
          position: relative;
        }

        .snav-link:hover {
          background: var(--dl-sidebar-hover-bg, #f8f7f4);
          color: var(--dl-sidebar-text-hover, #0f172a);
        }

        .snav-link.active {
          background: var(--dl-sidebar-active-bg, #f5f3ff);
          color: var(--dl-accent, #7c3aed);
          border-color: var(--dl-sidebar-active-border, #ede9fe);
          font-weight: 600;
        }

        .snav-link.active .snav-icon {
          color: var(--dl-accent, #7c3aed);
        }

        .snav-icon {
          flex-shrink: 0;
          color: var(--dl-sidebar-text, #94a3b8);
          transition: color 0.15s;
          display: flex;
          align-items: center;
        }

        .snav-link:hover .snav-icon {
          color: var(--dl-sidebar-text-hover, #64748b);
        }

        .snav-indicator {
          margin-left: auto;
          width: 6px; height: 6px;
          border-radius: 50%;
          background: var(--dl-accent, #7c3aed);
          box-shadow: 0 0 0 2px var(--dl-sidebar-active-border, #ede9fe);
          flex-shrink: 0;
        }

        .snav-divider {
          height: 1px;
          background: var(--dl-sidebar-border, #f0ede8);
          margin: 0.35rem 0.5rem;
        }
      `}</style>

      <nav className="snav">
        {NAV_SECTIONS.map((section, si) => (
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
