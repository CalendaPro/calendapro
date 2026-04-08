import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'
import { getUserPlan } from '@/lib/subscription'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const user = await currentUser()
  if (!user) redirect('/sign-in')
  const { userId } = await auth()

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - today.getDay())

  const [
    { count: todayCount },
    { count: clientsCount },
    { count: pendingCount },
    { count: weekCount },
    { data: nextAppointments },
    { data: recentClients },
    { data: allAppointments },
  ] = await Promise.all([
    supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('user_id', userId).gte('date', today.toISOString()).lt('date', tomorrow.toISOString()),
    supabase.from('clients').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'pending'),
    supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('user_id', userId).gte('date', weekStart.toISOString()),
    supabase.from('appointments').select('*').eq('user_id', userId).gte('date', new Date().toISOString()).order('date', { ascending: true }).limit(5),
    supabase.from('clients').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(5),
    supabase.from('appointments').select('date, price').eq('user_id', userId).gte('date', weekStart.toISOString()).order('date', { ascending: true }),
  ])

  const plan = await getUserPlan(userId!)

  const greetingHour = new Date().getHours()
  const greeting = greetingHour < 12 ? 'Bonjour' : greetingHour < 18 ? 'Bon après-midi' : 'Bonsoir'

  // Prépare les données du graphique (7 jours)
  const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
  const chartData = days.map((day, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    const dayStr = d.toISOString().split('T')[0]
    const dayApts = (allAppointments ?? []).filter(a => a.date?.startsWith(dayStr))
    const revenue = dayApts.reduce((sum: number, a: { price?: number }) => sum + (a.price ?? 0), 0)
    return { day, revenue, rdv: dayApts.length }
  })

  const username = user.username ?? user.firstName?.toLowerCase() ?? 'votre-nom'
  const publicUrl = `calendapro.fr/${username}`

  const planBadge = {
    free: { label: 'Starter', bg: '#f8f7f4', color: '#64748b', border: '#e2e0da' },
    premium: { label: 'Premium ⭐', bg: '#f5f3ff', color: '#7c3aed', border: '#ede9fe' },
    infinity: { label: 'Infinity ✦', bg: '#fdf2f8', color: '#ec4899', border: '#fce7f3' },
  }[plan]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&display=swap');
        @import url('https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&display=swap');

        .db { padding: 2rem 2.2rem 4rem; max-width: 100%; font-family: 'DM Sans', sans-serif; }

        /* HEADER */
        .db-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 2rem; }
        .db-greeting { font-size: 0.75rem; color: #94a3b8; margin-bottom: 0.2rem; }
        .db-title { font-family: 'Clash Display', sans-serif; font-size: clamp(1.6rem, 2.5vw, 2.2rem); font-weight: 700; letter-spacing: -0.04em; color: #0f172a; line-height: 1; }
        .db-badge { display: inline-flex; align-items: center; gap: 5px; padding: 0.35rem 0.9rem; border-radius: 100px; font-size: 0.72rem; font-weight: 600; border: 1px solid; }

        /* KPI GRID */
        .db-kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.9rem; margin-bottom: 1.2rem; }
        .db-kpi {
          background: white;
          border-radius: 16px;
          padding: 1.3rem 1.4rem;
          border: 1px solid #ede9e3;
          transition: all 0.2s ease;
          cursor: default;
        }
        .db-kpi:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.06); border-color: #ddd9d3; }
        .db-kpi-label { font-size: 0.65rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #94a3b8; margin-bottom: 0.7rem; }
        .db-kpi-value { font-family: 'Clash Display', sans-serif; font-size: 2.2rem; font-weight: 700; letter-spacing: -0.04em; color: #0f172a; line-height: 1; margin-bottom: 0.25rem; }
        .db-kpi-sub { font-size: 0.72rem; color: #94a3b8; margin-bottom: 0.7rem; }
        .db-kpi-tag { display: inline-flex; align-items: center; gap: 3px; padding: 0.22rem 0.55rem; border-radius: 100px; font-size: 0.65rem; font-weight: 600; }

        /* PANELS */
        .db-row { display: grid; gap: 1rem; margin-bottom: 1rem; }
        .db-row-3 { grid-template-columns: 1.5fr 1fr 1fr; }
        .db-row-2 { grid-template-columns: 1fr 1fr; }
        .db-row-2b { grid-template-columns: 1.6fr 1fr; }

        .db-panel {
          background: white;
          border-radius: 16px;
          border: 1px solid #ede9e3;
          overflow: hidden;
        }

        .db-panel-hd {
          padding: 1rem 1.3rem;
          border-bottom: 1px solid #f4f2ee;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .db-panel-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-family: 'Clash Display', sans-serif;
          font-size: 0.85rem;
          font-weight: 600;
          color: #0f172a;
          letter-spacing: -0.01em;
        }

        .db-panel-link {
          font-size: 0.72rem;
          color: #7c3aed;
          text-decoration: none;
          font-weight: 500;
          transition: opacity 0.2s;
        }
        .db-panel-link:hover { opacity: 0.7; }

        /* APT LIST */
        .db-apt { padding: 0.8rem 1.3rem; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #f8f7f4; transition: background 0.12s; }
        .db-apt:hover { background: #fafaf8; }
        .db-apt:last-child { border-bottom: none; }
        .db-apt-left { display: flex; align-items: center; gap: 0.65rem; }
        .db-apt-datebox { width: 34px; height: 34px; border-radius: 9px; background: #f5f3ff; display: flex; flex-direction: column; align-items: center; justify-content: center; flex-shrink: 0; }
        .db-apt-day { font-family: 'Clash Display', sans-serif; font-size: 0.75rem; font-weight: 700; color: #7c3aed; line-height: 1; }
        .db-apt-month { font-size: 0.52rem; color: #a78bfa; text-transform: uppercase; letter-spacing: 0.04em; }
        .db-apt-title { font-size: 0.8rem; font-weight: 600; color: #0f172a; margin-bottom: 1px; }
        .db-apt-time { font-size: 0.68rem; color: #94a3b8; }
        .db-status { font-size: 0.65rem; font-weight: 600; padding: 0.2rem 0.55rem; border-radius: 100px; }
        .db-status-ok { background: #f0fdf4; color: #16a34a; }
        .db-status-wait { background: #fffbeb; color: #d97706; }

        /* CLIENT LIST */
        .db-client { padding: 0.7rem 1.3rem; display: flex; align-items: center; gap: 0.65rem; border-bottom: 1px solid #f8f7f4; transition: background 0.12s; }
        .db-client:hover { background: #fafaf8; }
        .db-client:last-child { border-bottom: none; }
        .db-avatar { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 700; font-family: 'Clash Display', sans-serif; flex-shrink: 0; }
        .db-client-name { font-size: 0.8rem; font-weight: 600; color: #0f172a; }
        .db-client-email { font-size: 0.68rem; color: #94a3b8; }

        /* EMPTY STATE */
        .db-empty { padding: 2rem 1.3rem; text-align: center; }
        .db-empty-ico { width: 40px; height: 40px; border-radius: 11px; display: flex; align-items: center; justify-content: center; margin: 0 auto 0.65rem; }
        .db-empty-txt { font-size: 0.78rem; color: #94a3b8; margin-bottom: 0.5rem; }
        .db-empty-link { font-size: 0.72rem; font-weight: 600; color: #7c3aed; text-decoration: none; }

        /* QUICK ACTIONS */
        .db-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 0.55rem; padding: 1rem; }
        .db-action {
          display: flex; align-items: center; gap: 0.55rem;
          padding: 0.65rem 0.8rem;
          background: #f8f7f4;
          border: 1px solid #ede9e3;
          border-radius: 11px;
          text-decoration: none;
          transition: all 0.18s ease;
          font-family: 'DM Sans', sans-serif;
        }
        .db-action:hover { background: white; border-color: #d4d0e8; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .db-action-ico { width: 28px; height: 28px; border-radius: 7px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .db-action-lbl { font-size: 0.75rem; font-weight: 600; color: #374151; letter-spacing: -0.01em; }

        /* URL CARD */
        .db-url-body { padding: 1rem 1.3rem; }
        .db-url-desc { font-size: 0.75rem; color: #64748b; line-height: 1.6; margin-bottom: 0.8rem; }
        .db-url-box { display: flex; align-items: center; gap: 0.5rem; padding: 0.6rem 0.85rem; background: #f8f7f4; border: 1px solid #ede9e3; border-radius: 9px; font-size: 0.75rem; color: #7c3aed; font-weight: 500; margin-bottom: 0.7rem; word-break: break-all; }
        .db-url-btns { display: flex; gap: 0.5rem; }
        .db-url-btn-main { flex: 1; text-align: center; padding: 0.55rem; background: linear-gradient(135deg, #7c3aed, #ec4899); color: white; border-radius: 9px; font-size: 0.73rem; font-weight: 600; text-decoration: none; transition: opacity 0.2s; }
        .db-url-btn-main:hover { opacity: 0.9; }
        .db-url-btn-sec { flex: 1; text-align: center; padding: 0.55rem; background: #f8f7f4; color: #374151; border: 1px solid #ede9e3; border-radius: 9px; font-size: 0.73rem; font-weight: 600; text-decoration: none; transition: all 0.15s; }
        .db-url-btn-sec:hover { background: white; border-color: #d1d5db; }

        /* NOTIFS TOGGLE */
        .db-notif-list { padding: 0.5rem 1.3rem 1rem; display: flex; flex-direction: column; gap: 0; }
        .db-notif-item { display: flex; align-items: center; justify-content: space-between; padding: 0.7rem 0; border-bottom: 1px solid #f4f2ee; }
        .db-notif-item:last-child { border-bottom: none; }
        .db-notif-label { font-size: 0.78rem; font-weight: 500; color: #374151; margin-bottom: 2px; }
        .db-notif-sub { font-size: 0.68rem; color: #94a3b8; }
        .db-toggle { position: relative; width: 36px; height: 20px; flex-shrink: 0; }
        .db-toggle input { opacity: 0; width: 0; height: 0; position: absolute; }
        .db-toggle-track {
          position: absolute; inset: 0;
          background: #e2e8f0;
          border-radius: 100px;
          transition: background 0.2s;
          cursor: pointer;
        }
        .db-toggle input:checked + .db-toggle-track { background: #7c3aed; }
        .db-toggle-thumb {
          position: absolute;
          top: 2px; left: 2px;
          width: 16px; height: 16px;
          background: white;
          border-radius: 50%;
          transition: transform 0.2s;
          pointer-events: none;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }
        .db-toggle input:checked ~ .db-toggle-thumb { transform: translateX(16px); }

        /* UPGRADE */
        .db-upgrade {
          background: #0f172a;
          border-radius: 16px;
          padding: 1.4rem 1.6rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          margin-top: 1rem;
          position: relative;
          overflow: hidden;
        }
        .db-upgrade::before {
          content: '';
          position: absolute;
          top: -50px; right: -50px;
          width: 200px; height: 200px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(124,58,237,0.25), transparent 70%);
          pointer-events: none;
        }
        .db-upgrade-title { font-family: 'Clash Display', sans-serif; font-size: 0.95rem; font-weight: 700; color: white; letter-spacing: -0.02em; margin-bottom: 0.25rem; position: relative; }
        .db-upgrade-desc { font-size: 0.75rem; color: #475569; line-height: 1.5; position: relative; }
        .db-upgrade-btn { background: linear-gradient(135deg, #7c3aed, #ec4899); color: white; font-size: 0.78rem; font-weight: 700; padding: 0.65rem 1.3rem; border-radius: 100px; text-decoration: none; white-space: nowrap; position: relative; transition: all 0.2s; box-shadow: 0 4px 16px rgba(124,58,237,0.3); }
        .db-upgrade-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(124,58,237,0.4); }
        .db-upgrade-active { background: rgba(255,255,255,0.08); color: white; font-size: 0.78rem; font-weight: 600; padding: 0.65rem 1.3rem; border-radius: 100px; border: 1px solid rgba(255,255,255,0.12); position: relative; }
      `}</style>

      <div className="db">

        {/* HEADER */}
        <div className="db-header">
          <div>
            <div className="db-greeting">{greeting},</div>
            <div className="db-title">{user.firstName ?? 'Professionnel'} 👋</div>
          </div>
          <div className="db-badge" style={{ background: planBadge.bg, color: planBadge.color, borderColor: planBadge.border }}>
            {planBadge.label}
          </div>
        </div>

        {/* KPI CARDS */}
        <div className="db-kpis">
          {[
            { label: "Aujourd'hui", value: todayCount ?? 0, sub: 'Rendez-vous', tag: `${pendingCount ?? 0} en attente`, tagBg: '#f5f3ff', tagColor: '#7c3aed', icon: <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
            { label: 'Cette semaine', value: weekCount ?? 0, sub: 'RDV planifiés', tag: 'En cours', tagBg: '#fdf2f8', tagColor: '#ec4899', icon: <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
            { label: 'Clients', value: clientsCount ?? 0, sub: 'Enregistrés', tag: '↑ Croissance', tagBg: '#f0fdf4', tagColor: '#16a34a', icon: <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/></svg> },
            { label: 'En attente', value: pendingCount ?? 0, sub: 'À confirmer', tag: 'À traiter', tagBg: '#fffbeb', tagColor: '#d97706', icon: <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/></svg> },
          ].map(k => (
            <div key={k.label} className="db-kpi">
              <div className="db-kpi-label">{k.label}</div>
              <div className="db-kpi-value">{k.value}</div>
              <div className="db-kpi-sub">{k.sub}</div>
              <div className="db-kpi-tag" style={{ background: k.tagBg, color: k.tagColor }}>
                {k.icon} {k.tag}
              </div>
            </div>
          ))}
        </div>

        {/* ROW 1 : Graphique + RDV + Clients */}
        <div className="db-row db-row-3">

          {/* Graphique CA hebdo */}
          <div className="db-panel">
            <div className="db-panel-hd">
              <div className="db-panel-title">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>
                CA cette semaine
              </div>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Prévisionnel</span>
            </div>
            {/* Recharts est côté client — on passe les data via DashboardClient */}
            <DashboardClient chartData={chartData} />
          </div>

          {/* Prochains RDV */}
          <div className="db-panel">
            <div className="db-panel-hd">
              <div className="db-panel-title">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                Prochains RDV
              </div>
              <Link href="/dashboard/appointments" className="db-panel-link">Voir tout →</Link>
            </div>
            {nextAppointments && nextAppointments.length > 0 ? (
              nextAppointments.map(apt => (
                <div key={apt.id} className="db-apt">
                  <div className="db-apt-left">
                    <div className="db-apt-datebox">
                      <span className="db-apt-day">{new Date(apt.date).getDate()}</span>
                      <span className="db-apt-month">{new Date(apt.date).toLocaleDateString('fr-FR', { month: 'short' })}</span>
                    </div>
                    <div>
                      <div className="db-apt-title">{apt.title}</div>
                      <div className="db-apt-time">{new Date(apt.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  </div>
                  <span className={`db-status ${apt.status === 'confirmed' ? 'db-status-ok' : 'db-status-wait'}`}>
                    {apt.status === 'confirmed' ? 'Confirmé' : 'En attente'}
                  </span>
                </div>
              ))
            ) : (
              <div className="db-empty">
                <div className="db-empty-ico" style={{ background: '#f5f3ff' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                </div>
                <p className="db-empty-txt">Aucun rendez-vous à venir</p>
                <Link href="/dashboard/appointments" className="db-empty-link">+ Créer un rendez-vous</Link>
              </div>
            )}
          </div>

          {/* Clients récents */}
          <div className="db-panel">
            <div className="db-panel-hd">
              <div className="db-panel-title">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                Clients récents
              </div>
              <Link href="/dashboard/clients" className="db-panel-link">Voir tout →</Link>
            </div>
            {recentClients && recentClients.length > 0 ? (
              recentClients.map((client, i) => {
                const palettes = [
                  { bg: '#f5f3ff', color: '#7c3aed' },
                  { bg: '#fdf2f8', color: '#ec4899' },
                  { bg: '#f0fdf4', color: '#10b981' },
                  { bg: '#fffbeb', color: '#d97706' },
                  { bg: '#eff6ff', color: '#3b82f6' },
                ]
                const p = palettes[i % palettes.length]
                return (
                  <div key={client.id} className="db-client">
                    <div className="db-avatar" style={{ background: p.bg, color: p.color }}>{client.name.charAt(0).toUpperCase()}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="db-client-name">{client.name}</div>
                      <div className="db-client-email">{client.email}</div>
                    </div>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                  </div>
                )
              })
            ) : (
              <div className="db-empty">
                <div className="db-empty-ico" style={{ background: '#fdf2f8' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f472b6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                </div>
                <p className="db-empty-txt">Aucun client pour l'instant</p>
                <Link href="/dashboard/clients" className="db-empty-link">+ Ajouter un client</Link>
              </div>
            )}
          </div>

        </div>

        {/* ROW 2 : Actions rapides + URL + Rappels */}
        <div className="db-row db-row-3">

          {/* Actions rapides */}
          <div className="db-panel">
            <div className="db-panel-hd">
              <div className="db-panel-title">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                Actions rapides
              </div>
            </div>
            <div className="db-actions">
              {[
                { label: 'Nouveau RDV', href: '/dashboard/appointments', bg: '#f5f3ff', color: '#7c3aed', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
                { label: 'Ajouter client', href: '/dashboard/clients', bg: '#fdf2f8', color: '#ec4899', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg> },
                { label: 'Mon profil', href: '/dashboard/profile', bg: '#f0fdf4', color: '#10b981', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg> },
                { label: 'Crédits SMS', href: '/dashboard/sms', bg: '#fffbeb', color: '#d97706', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
              ].map(a => (
                <Link key={a.href} href={a.href} className="db-action">
                  <div className="db-action-ico" style={{ background: a.bg, color: a.color }}>{a.icon}</div>
                  <span className="db-action-lbl">{a.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Lien public */}
          <div className="db-panel">
            <div className="db-panel-hd">
              <div className="db-panel-title">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                Lien de réservation
              </div>
            </div>
            <div className="db-url-body">
              <p className="db-url-desc">Partagez ce lien sur Instagram, WhatsApp ou votre site pour recevoir des réservations directement.</p>
              <div className="db-url-box">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/></svg>
                {publicUrl}
              </div>
              <div className="db-url-btns">
                <Link href="/dashboard/profile" className="db-url-btn-main">Modifier le profil</Link>
                <Link href="/dashboard/widget" className="db-url-btn-sec">Widget</Link>
              </div>
            </div>
          </div>

          {/* Rappels automatiques */}
          <div className="db-panel">
            <div className="db-panel-hd">
              <div className="db-panel-title">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                Rappels automatiques
              </div>
              <Link href="/dashboard/sms" className="db-panel-link">Gérer →</Link>
            </div>
            <div className="db-notif-list">
              {[
                { label: 'Email 24h avant', sub: 'Rappel automatique par email', defaultOn: true },
                { label: 'SMS 2h avant', sub: 'Consomme 1 crédit SMS', defaultOn: false },
                { label: 'Confirmation client', sub: 'Email à la réservation', defaultOn: true },
                { label: 'Rappel no-show', sub: 'SMS si absence détectée', defaultOn: false },
              ].map((n, i) => (
                <div key={i} className="db-notif-item">
                  <div>
                    <div className="db-notif-label">{n.label}</div>
                    <div className="db-notif-sub">{n.sub}</div>
                  </div>
                  <label className="db-toggle">
                    <input type="checkbox" defaultChecked={n.defaultOn} />
                    <div className="db-toggle-track" />
                    <div className="db-toggle-thumb" />
                  </label>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* UPGRADE BANNER */}
        {plan === 'free' && (
          <div className="db-upgrade">
            <div>
              <div className="db-upgrade-title">Passez au Premium — débloquez tout ⭐</div>
              <div className="db-upgrade-desc">RDV illimités · Rappels SMS · Marketplace · Statistiques avancées · 19€/mois</div>
            </div>
            <Link href="/dashboard/pricing" className="db-upgrade-btn">Upgrader maintenant</Link>
          </div>
        )}
        {plan === 'premium' && (
          <div className="db-upgrade">
            <div>
              <div className="db-upgrade-title">Découvrez Infinity — l'IA CalendaPro ✦</div>
              <div className="db-upgrade-desc">Assistant IA · Automatisations · Badge vérifié · Priorité Marketplace · 49€/mois</div>
            </div>
            <Link href="/dashboard/pricing" className="db-upgrade-btn">Découvrir Infinity</Link>
          </div>
        )}
        {plan === 'infinity' && (
          <div className="db-upgrade">
            <div>
              <div className="db-upgrade-title">Vous êtes sur Infinity ✦ — Merci !</div>
              <div className="db-upgrade-desc">Toutes les fonctionnalités sont actives. L'IA conversationnelle arrive très bientôt.</div>
            </div>
            <div className="db-upgrade-active">Plan actif</div>
          </div>
        )}

      </div>
    </>
  )
}
