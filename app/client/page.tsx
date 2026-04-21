'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import Link from 'next/link'

type Booking = { id: string; pro_name: string; pro_username: string; service_name: string; scheduled_at: string; duration_minutes: number | null; price: number | null; status: string }
type Favorite = { pro_id: string; pro_username: string; profile: { full_name: string; category: string | null; city: string | null } | null }

function KpiCard({ label, value, sub, tag, tagBg, tagColor, icon, loading }: {
  label: string; value: number; sub: string; tag: string; tagBg: string; tagColor: string; icon: React.ReactNode; loading: boolean
}) {
  return (
    <div
      style={{ background: '#fff', border: '1px solid #ede9e3', borderRadius: 16, padding: '1.2rem 1.3rem', cursor: 'default', transition: 'all 0.2s ease', flexShrink: 0, minWidth: 160 }}
      onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = 'translateY(-2px)'; el.style.boxShadow = '0 8px 24px rgba(0,0,0,0.06)'; el.style.borderColor = '#ddd9d3' }}
      onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = ''; el.style.boxShadow = ''; el.style.borderColor = '#ede9e3' }}
    >
      <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#94a3b8', marginBottom: '0.65rem' }}>{label}</div>
      {loading
        ? <div style={{ height: 28, width: 60, borderRadius: 6, background: '#f4f2ee', marginBottom: 4 }} />
        : <div style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.04em', color: '#0f172a', lineHeight: 1.15, paddingRight: '0.05em', overflow: 'visible', marginBottom: '0.2rem' }}>{value}</div>
      }
      <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.6rem' }}>{sub}</div>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '0.2rem 0.5rem', borderRadius: 100, fontSize: '0.62rem', fontWeight: 600, background: tagBg, color: tagColor }}>{icon} {tag}</div>
    </div>
  )
}

function AptRow({ b }: { b: Booking }) {
  const d = new Date(b.scheduled_at)
  const isToday = new Date().toDateString() === d.toDateString()
  const time = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  const calUrl = (() => {
    const end = new Date(d.getTime() + (b.duration_minutes ?? 60) * 60000)
    const f = (x: Date) => x.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`RDV ${b.pro_name}`)}&dates=${f(d)}/${f(end)}`
  })()
  return (
    <div
      style={{ padding: '0.75rem 1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f8f7f4', transition: 'background 0.12s' }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = '#fafaf8' }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = '' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: '#f5f3ff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#7c3aed', lineHeight: 1 }}>{d.getDate()}</span>
          <span style={{ fontSize: '0.5rem', color: '#a78bfa', textTransform: 'uppercase' as const, letterSpacing: '0.04em' }}>{d.toLocaleDateString('fr-FR', { month: 'short' })}</span>
        </div>
        <div>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0f172a', marginBottom: 1 }}>{b.pro_name}</div>
          <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{b.service_name}{b.duration_minutes ? ` · ${b.duration_minutes} min` : ''}</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{ textAlign: 'right' as const }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 600, color: isToday ? '#16a34a' : '#7c3aed' }}>{isToday ? "Aujourd'hui" : time}</div>
          {b.price != null && <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{b.price}€</div>}
        </div>
        <a href={calUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#d1d5db', display: 'flex' }} title="Google Calendar">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        </a>
      </div>
    </div>
  )
}

function FavRow({ fav }: { fav: Favorite }) {
  const name = fav.profile?.full_name ?? fav.pro_username
  const pal: [string, string][] = [['#f5f3ff','#7c3aed'],['#fdf2f8','#ec4899'],['#f0fdf4','#10b981'],['#fffbeb','#d97706'],['#eff6ff','#3b82f6']]
  const [bg, color] = pal[name.charCodeAt(0) % pal.length]
  return (
    <Link href={`/client/${fav.pro_username}`}
      style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.65rem 1.2rem', borderBottom: '1px solid #f8f7f4', transition: 'background 0.12s' }}
      onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#fafaf8' }}
      onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = '' }}
    >
      <div style={{ width: 32, height: 32, borderRadius: '50%', background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0 }}>{name.charAt(0).toUpperCase()}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
        <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{[fav.profile?.category, fav.profile?.city].filter(Boolean).join(' · ')}</div>
      </div>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
    </Link>
  )
}

function Empty({ svgPath, text, linkHref, linkLabel }: { svgPath: React.ReactNode; text: string; linkHref: string; linkLabel: string }) {
  return (
    <div style={{ padding: '2rem 1.2rem', textAlign: 'center' as const }}>
      <div style={{ width: 40, height: 40, borderRadius: 11, background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.65rem' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{svgPath}</svg>
      </div>
      <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.5rem' }}>{text}</p>
      <Link href={linkHref} style={{ fontSize: '0.72rem', fontWeight: 600, color: '#7c3aed', textDecoration: 'none' }}>{linkLabel}</Link>
    </div>
  )
}

export default function ClientDashboardPage() {
  const { user } = useUser()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [completedCount, setCompletedCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/bookings?status=upcoming').then(r => r.json()).catch(() => []),
      fetch('/api/bookings?status=completed').then(r => r.json()).catch(() => []),
      fetch('/api/favorites').then(r => r.json()).catch(() => []),
    ]).then(([upcoming, completed, favs]) => {
      setBookings(Array.isArray(upcoming) ? upcoming.slice(0, 4) : [])
      setCompletedCount(Array.isArray(completed) ? completed.length : 0)
      setFavorites(Array.isArray(favs) ? favs.slice(0, 5) : [])
      setLoading(false)
    })
  }, [])

  const firstName = user?.firstName ?? user?.fullName?.split(' ')[0] ?? ''
  const h = new Date().getHours()
  const greeting = h < 12 ? 'Bonjour' : h < 18 ? 'Bon après-midi' : 'Bonsoir'
  const dateStr = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

  const iCal = <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
  const iHeart = <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
  const iCheck = <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
  const iSearch = <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>

  const actions = [
    { href: '/client/marketplace', label: 'Nouveau RDV', bg: '#f5f3ff', color: '#7c3aed', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
    { href: '/client/bookings', label: 'Mes RDV', bg: '#fdf2f8', color: '#ec4899', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg> },
    { href: '/client/favorites', label: 'Favoris', bg: '#f0fdf4', color: '#10b981', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> },
    { href: '/client/profile', label: 'Profil', bg: '#fffbeb', color: '#d97706', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg> },
  ]

  const calSvg = <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></>
  const heartSvg = <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* ── HEADER ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.2rem', fontWeight: 500 }}>{dateStr}</div>
          <div style={{ fontSize: 'clamp(1.4rem, 2.5vw, 1.9rem)', fontWeight: 700, letterSpacing: '-0.04em', color: '#0f172a', lineHeight: 1.15, paddingRight: '0.05em', overflow: 'visible' }}>
            {greeting}{firstName ? `, ${firstName}` : ''}.
          </div>
        </div>
        <Link href="/client/marketplace" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1.1rem', background: 'linear-gradient(135deg, #7c3aed, #ec4899)', color: 'white', borderRadius: 100, fontSize: '0.78rem', fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 14px rgba(124,58,237,0.28)', flexShrink: 0 }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          Trouver un pro
        </Link>
      </div>

      {/* ── KPI CARDS – horizontal scroll on mobile ── */}
      <div style={{ display: 'flex', gap: '0.9rem', marginBottom: '1.2rem', overflowX: 'auto', paddingBottom: 4, WebkitOverflowScrolling: 'touch' as const }}>
        <KpiCard label="RDV à venir"   value={bookings.length}   sub="Rendez-vous"     tag="Planifiés"    tagBg="#f5f3ff" tagColor="#7c3aed" icon={iCal}   loading={loading} />
        <KpiCard label="Favoris"        value={favorites.length}  sub="Professionnels"  tag="Sauvegardés"  tagBg="#fdf2f8" tagColor="#ec4899" icon={iHeart} loading={loading} />
        <KpiCard label="RDV terminés"   value={completedCount}    sub="Complétés"       tag="Historique"   tagBg="#f0fdf4" tagColor="#16a34a" icon={iCheck} loading={loading} />
        <KpiCard label="Marketplace"    value={0}                 sub="Explorer"        tag="Découvrir"    tagBg="#fffbeb" tagColor="#d97706" icon={iSearch} loading={false} />
      </div>

      {/* ── BENTO ROW ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr_1fr] gap-[0.9rem]">

        {/* Prochains RDV */}
        <div style={{ background: '#fff', border: '1px solid #ede9e3', borderRadius: 16, overflow: 'hidden', gridColumn: 'span 1' }}>
          <div style={{ padding: '0.85rem 1.2rem', borderBottom: '1px solid #f4f2ee', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.82rem', fontWeight: 600, color: '#0f172a' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              Prochains RDV
            </div>
            <Link href="/client/bookings" style={{ fontSize: '0.72rem', color: '#7c3aed', fontWeight: 500, textDecoration: 'none' }}>Voir tout →</Link>
          </div>
          {loading
            ? <div style={{ padding: '0.75rem 1.2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>{[0,1,2].map(i => <div key={i} style={{ height: 52, borderRadius: 8, background: '#f4f2ee' }} />)}</div>
            : bookings.length === 0
              ? <Empty svgPath={calSvg} text="Aucun rendez-vous à venir" linkHref="/client/marketplace" linkLabel="+ Prendre un RDV" />
              : bookings.map(b => <AptRow key={b.id} b={b} />)
          }
        </div>

        {/* Favoris */}
        <div style={{ background: '#fff', border: '1px solid #ede9e3', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '0.85rem 1.2rem', borderBottom: '1px solid #f4f2ee', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.82rem', fontWeight: 600, color: '#0f172a' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              Mes favoris
            </div>
            <Link href="/client/favorites" style={{ fontSize: '0.72rem', color: '#7c3aed', fontWeight: 500, textDecoration: 'none' }}>Voir tout →</Link>
          </div>
          {loading
            ? <div style={{ padding: '0.75rem 1.2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>{[0,1,2].map(i => <div key={i} style={{ height: 44, borderRadius: 8, background: '#f4f2ee' }} />)}</div>
            : favorites.length === 0
              ? <Empty svgPath={heartSvg} text="Aucun favori sauvegardé" linkHref="/client/marketplace" linkLabel="Explorer la marketplace" />
              : favorites.map(f => <FavRow key={f.pro_id} fav={f} />)
          }
        </div>

        {/* Actions rapides */}
        <div style={{ background: '#fff', border: '1px solid #ede9e3', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '0.85rem 1.2rem', borderBottom: '1px solid #f4f2ee' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.82rem', fontWeight: 600, color: '#0f172a' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              Actions rapides
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', padding: '0.75rem' }}>
            {actions.map(a => (
              <Link key={a.href} href={a.href}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.7rem', background: '#f8f7f4', border: '1px solid #ede9e3', borderRadius: 11, textDecoration: 'none', transition: 'all 0.18s' }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.background = '#fff'; el.style.borderColor = '#d4d0e8'; el.style.transform = 'translateY(-1px)'; el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)' }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.background = '#f8f7f4'; el.style.borderColor = '#ede9e3'; el.style.transform = ''; el.style.boxShadow = '' }}
              >
                <div style={{ width: 28, height: 28, borderRadius: 7, background: a.bg, color: a.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{a.icon}</div>
                <span style={{ fontSize: '0.73rem', fontWeight: 600, color: '#374151', letterSpacing: '-0.01em', lineHeight: 1.2 }}>{a.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
