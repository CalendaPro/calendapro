import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { getUserPlan } from '@/lib/subscription'
import DashboardClient from './DashboardClient'
import WelcomeTour from './WelcomeTour'
import { stripe } from '@/lib/stripe'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { resetCredits } from '@/lib/sms-credits'
import { LiveStats } from './_components/LiveStats'
import { PerformanceWidget } from './_components/PerformanceWidget'
import { NextAppointmentsWidget, RevenueTrendWidget } from './widgets'
import { FinancialIntelligenceWidget } from './_components/FinancialIntelligence'
import { OnboardingChecklist } from './_components/OnboardingChecklist'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const SYNC_PLAN_CREDITS: Record<string, number> = { premium: 30, infinity: 200 }
function planFromPriceId(priceId: string): string {
  if (priceId === process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID) return 'premium'
  if (priceId === process.env.NEXT_PUBLIC_STRIPE_INFINITY_PRICE_ID) return 'infinity'
  return 'free'
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ upgrade?: string; session_id?: string }>
}) {
  const user = await currentUser()
  if (!user) redirect('/sign-in')
  const { userId } = await auth()
  const serverSb = createServerSupabaseClient()
  // userId IS the pro_id in bookings table (profiles.id = Clerk userId)

  // ── Auto-sync plan after Stripe checkout ─────────────────────────────────
  const params = await searchParams
  if (params.session_id?.startsWith('cs_') && userId) {
    try {
      const session = await stripe.checkout.sessions.retrieve(params.session_id, {
        expand: ['subscription'],
      })
      if (
        session.payment_status === 'paid' &&
        session.metadata?.userId === userId &&
        session.subscription
      ) {
        const sub = session.subscription as import('stripe').Stripe.Subscription
        const rawSub = sub as typeof sub & { current_period_end?: number | null }
        const priceId = sub.items.data[0]?.price?.id ?? ''
        const plan = planFromPriceId(priceId)
        const periodEnd = rawSub.current_period_end
          ? new Date(rawSub.current_period_end * 1000).toISOString()
          : null
        const serverSb = createServerSupabaseClient()
        await serverSb.from('subscriptions').upsert(
          {
            user_id: userId,
            plan,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: sub.id,
            status: 'active',
            current_period_end: periodEnd,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        )
        if (plan === 'premium' || plan === 'infinity') {
          await resetCredits(userId, SYNC_PLAN_CREDITS[plan])
        }
      }
    } catch (e) {
 logger.error(' Dashboard sync error (non-bloquant):', e)
    }
  }
  // ─────────────────────────────────────────────────────────────────────────

  const now = new Date()
  const nowMinus1h = new Date(Date.now() - 60 * 60 * 1000) // fenêtre -1h pour sécurité

  // ── Récupérer les RDV UNIQUEMENT depuis la table bookings ─────────
  const [
    { data: nextBookings },
    { data: recentBookingsForClients },
  ] = await Promise.all([
    // Next bookings (upcoming/pending) with real client data
    serverSb
      .from('bookings')
      .select(`
        id, service_name, pro_name, scheduled_at,
        duration_minutes, status, payment_status, source_channel, client_id,
        price, deposit_amount,
        client_profiles!left(name, phone)
      `)
      .eq('pro_id', userId)
      .gte('scheduled_at', nowMinus1h.toISOString())
      .in('status', ['upcoming', 'pending'])
      .order('scheduled_at', { ascending: true })
      .limit(10),
    // Recent clients (extraits de bookings, pas de la table clients legacy)
    serverSb
      .from('bookings')
      .select('client_id, pro_name, created_at')
      .eq('pro_id', userId)
      .not('client_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  // Deduplication par client_id, garder le plus recent
  const seenClients = new Set<string>()
  const recentClients = (recentBookingsForClients ?? [])
    .filter((b) => {
      if (!b.client_id || seenClients.has(b.client_id)) return false
      seenClients.add(b.client_id)
      return true
    })
    .slice(0, 5)
    .map((b) => ({
      id: b.client_id as string,
      name: b.pro_name || (b.client_id?.includes('@') ? b.client_id.split('@')[0] : 'Client'),
      email: b.client_id?.includes('@') ? b.client_id : null,
      created_at: b.created_at,
    }))

  // ── Construire unifiedNextAppointments depuis bookings uniquement ────────
  const unifiedNextAppointments = (nextBookings ?? []).slice(0, 6).map((b) => {
    const profile = b.client_profiles as { name?: string; phone?: string } | null
    return {
      id: b.id,
      title: b.service_name || 'Rendez-vous',
      date: b.scheduled_at,
      status: b.status === 'upcoming' ? 'confirmed' : b.status,
      duration: b.duration_minutes || 60,
      price: b.price,
      client_id: b.client_id,
      source_channel: b.source_channel,
      // Priorité : profile Supabase > pro_name (fallback) > email parsé
      client_name: profile?.name
        || b.pro_name
        || (b.client_id?.includes('@') ? b.client_id.split('@')[0] : null),
      is_booking: true,
    }
  })

  // Fonction pour calculer le temps restant
  function getTimeUntil(dateStr: string): string | null {
    const diff = new Date(dateStr).getTime() - Date.now()
    if (diff < 0) return null
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `Dans ${mins} min`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `Dans ${hours}h`
    return null
  }

  const plan = await getUserPlan(userId!)

  // ── Stripe Connect status (for banner) ─────────────────────────────────
  const { data: connectProfile } = await serverSb
    .from('profiles')
    .select('stripe_connect_onboarding')
    .eq('id', userId!)
    .maybeSingle()
  const stripeConnectConfigured = connectProfile?.stripe_connect_onboarding === true

  const greetingHour = new Date().getHours()
  const greeting = greetingHour < 12 ? 'Bonjour' : greetingHour < 18 ? 'Bon après-midi' : 'Bonsoir'

  const username = user.username ?? user.firstName?.toLowerCase() ?? 'votre-nom'
  const publicUrl = `calendapro.fr/${username}`

  const planBadge = {
    free: { label: 'Starter', bg: 'var(--dl-sidebar-bg)', color: 'var(--dl-text-muted)', border: 'var(--dl-card-border)' },
    premium: { label: 'Premium ⭐', bg: 'var(--dl-accent-light)', color: 'var(--dl-accent)', border: 'var(--dl-accent-border)' },
 infinity: { label: 'Infinity ', bg: 'rgba(236,72,153,0.1)', color: '#ec4899', border: 'rgba(236,72,153,0.2)' },
  }[plan]

  return (
    <>
      <WelcomeTour username={username} />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&display=swap');
        @import url('https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&display=swap');

        .db { padding: 2rem 2.2rem 4rem; max-width: 100%; font-family: 'DM Sans', sans-serif; background: var(--dl-bg, #F7F5F0); min-height: 100vh; }

        /* HEADER */
        .db-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 1.5rem; }
        .db-greeting { font-size: 0.75rem; color: var(--dl-text-muted, #94a3b8); margin-bottom: 0.2rem; }
        .db-title { font-family: 'Clash Display', sans-serif; font-size: clamp(1.6rem, 2.5vw, 2.2rem); font-weight: 700; letter-spacing: -0.04em; color: var(--dl-text-primary, #0f172a); line-height: 1; }

        /* QUICK STATS SECTION */
        .db-quick-stats {
          background: var(--dl-card-bg, white);
          border-radius: 24px;
          padding: 1.5rem 2rem;
          margin-bottom: 1.5rem;
          box-shadow: var(--dl-card-shadow);
          border: 1px solid var(--dl-card-border, rgba(0,0,0,0.04));
        }
        .db-quick-stats-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1rem;
        }
        .db-quick-stats-title {
          font-family: 'Clash Display', sans-serif;
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--dl-text-primary, #0f172a);
          letter-spacing: -0.01em;
        }
        .db-quick-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem;
        }
        .db-quick-stat {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .db-quick-stat-value {
          font-family: 'Clash Display', sans-serif;
          font-size: 1.8rem;
          font-weight: 700;
          color: var(--dl-text-primary, #0f172a);
          letter-spacing: -0.03em;
          line-height: 1;
        }
        .db-quick-stat-value.accent { color: var(--dl-chart-primary, #7c3aed); }
        .db-quick-stat-label {
          font-size: 0.7rem;
          color: var(--dl-text-muted, #94a3b8);
          font-weight: 500;
        }
        .db-quick-stat-change {
          font-size: 0.65rem;
          color: #10b981;
          font-weight: 600;
        }
        .db-badge { display: inline-flex; align-items: center; gap: 5px; padding: 0.35rem 0.9rem; border-radius: 100px; font-size: 0.72rem; font-weight: 600; border: 1px solid; }

        /* KPI GRID */
        .db-kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.9rem; margin-bottom: 1.2rem; }
        .db-kpi {
          background: var(--dl-card-bg, white);
          border-radius: 16px;
          padding: 1.3rem 1.4rem;
          border: 1px solid var(--dl-card-border, #ede9e3);
          transition: all 0.2s ease;
          cursor: default;
        }
        .db-kpi:hover { transform: translateY(-2px); box-shadow: var(--dl-card-shadow-hover); border-color: var(--dl-sidebar-border, #ddd9d3); }
        .db-kpi-label { font-size: 0.65rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--dl-text-muted, #94a3b8); margin-bottom: 0.7rem; }
        .db-kpi-value { font-family: 'Clash Display', sans-serif; font-size: 2.2rem; font-weight: 700; letter-spacing: -0.04em; color: var(--dl-text-primary, #0f172a); line-height: 1; margin-bottom: 0.25rem; }
        .db-kpi-sub { font-size: 0.72rem; color: var(--dl-text-muted, #94a3b8); margin-bottom: 0.7rem; }
        .db-kpi-tag { display: inline-flex; align-items: center; gap: 3px; padding: 0.22rem 0.55rem; border-radius: 100px; font-size: 0.65rem; font-weight: 600; }

        /* PANELS */
        .db-row { display: grid; gap: 1rem; margin-bottom: 1rem; }
        .db-row-3 { grid-template-columns: 1.5fr 1fr 1fr; }
        .db-row-2 { grid-template-columns: 1fr 1fr; }
        .db-row-2b { grid-template-columns: 1.6fr 1fr; }

        .db-panel {
          background: var(--dl-card-bg, white);
          border-radius: 24px;
          border: 1px solid var(--dl-card-border, #ede9e3);
          overflow: hidden;
          box-shadow: var(--dl-card-shadow);
        }

        /* APPOINTMENTS SECTION */
        .db-apt-section {
          background: var(--dl-card-bg, white);
          border-radius: 24px;
          border: 1px solid var(--dl-card-border, rgba(0,0,0,0.06));
          box-shadow: var(--dl-card-shadow);
          overflow: hidden;
        }
        .db-apt-header {
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid var(--dl-sidebar-border, #f1f5f9);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .db-apt-title {
          font-family: 'Clash Display', sans-serif;
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--dl-text-primary, #0f172a);
          letter-spacing: -0.02em;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .db-apt-new-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.5rem 1rem;
          background: linear-gradient(135deg, var(--dl-chart-primary, #7c3aed), var(--dl-chart-gradient-end, #ec4899));
          color: white;
          border-radius: 100px;
          font-size: 0.75rem;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s ease;
          box-shadow: 0 4px 16px var(--dl-accent-glow, rgba(124,58,237,0.3));
        }
        .db-apt-new-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px var(--dl-accent-glow, rgba(124,58,237,0.4));
        }

        .db-panel-hd {
          padding: 1rem 1.3rem;
          border-bottom: 1px solid var(--dl-sidebar-border, #f4f2ee);
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
          color: var(--dl-text-primary, #0f172a);
          letter-spacing: -0.01em;
        }

        .db-panel-link {
          font-size: 0.72rem;
          color: var(--dl-chart-primary, #7c3aed);
          text-decoration: none;
          font-weight: 500;
          transition: opacity 0.2s;
        }
        .db-panel-link:hover { opacity: 0.7; }

        /* APT LIST */
        .db-apt { padding: 0.8rem 1.3rem; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--dl-sidebar-border, #f8f7f4); transition: background 0.12s; }
        .db-apt:hover { background: var(--dl-sidebar-hover-bg, #fafaf8); }
        .db-apt:last-child { border-bottom: none; }
        .db-apt-left { display: flex; align-items: center; gap: 0.65rem; }
        .db-apt-datebox { width: 34px; height: 34px; border-radius: 9px; background: var(--dl-accent-light, #f5f3ff); display: flex; flex-direction: column; align-items: center; justify-content: center; flex-shrink: 0; }
        .db-apt-day { font-family: 'Clash Display', sans-serif; font-size: 0.75rem; font-weight: 700; color: var(--dl-chart-primary, #7c3aed); line-height: 1; }
        .db-apt-month { font-size: 0.52rem; color: var(--dl-chart-secondary, #a78bfa); text-transform: uppercase; letter-spacing: 0.04em; }
        .db-apt-title { font-size: 0.8rem; font-weight: 600; color: var(--dl-text-primary, #0f172a); margin-bottom: 1px; }
        .db-apt-time { font-size: 0.68rem; color: var(--dl-text-muted, #94a3b8); }
        .db-status { font-size: 0.65rem; font-weight: 600; padding: 0.2rem 0.55rem; border-radius: 100px; }
        .db-status-ok { background: rgba(16, 163, 74, 0.15); color: #22c55e; }
        .db-status-wait { background: rgba(217, 119, 6, 0.15); color: #f59e0b; }

        /* CLIENT LIST */
        .db-client { padding: 0.7rem 1.3rem; display: flex; align-items: center; gap: 0.65rem; border-bottom: 1px solid var(--dl-sidebar-border, #f8f7f4); transition: background 0.12s; }
        .db-client:hover { background: var(--dl-sidebar-hover-bg, #fafaf8); }
        .db-client:last-child { border-bottom: none; }
        .db-avatar { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 700; font-family: 'Clash Display', sans-serif; flex-shrink: 0; }
        .db-client-name { font-size: 0.8rem; font-weight: 600; color: var(--dl-text-primary, #0f172a); }
        .db-client-email { font-size: 0.68rem; color: var(--dl-text-muted, #94a3b8); }

        /* EMPTY STATE */
        .db-empty { padding: 2rem 1.3rem; text-align: center; }
        .db-empty-ico { width: 40px; height: 40px; border-radius: 11px; display: flex; align-items: center; justify-content: center; margin: 0 auto 0.65rem; }
        .db-empty-txt { font-size: 0.78rem; color: var(--dl-text-muted, #94a3b8); margin-bottom: 0.5rem; }
        .db-empty-link { font-size: 0.72rem; font-weight: 600; color: var(--dl-chart-primary, #7c3aed); text-decoration: none; }

        /* QUICK ACTIONS */
        .db-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 0.55rem; padding: 1rem; }
        .db-action {
          display: flex; align-items: center; gap: 0.55rem;
          padding: 0.65rem 0.8rem;
          background: var(--dl-sidebar-bg, #f8f7f4);
          border: 1px solid var(--dl-sidebar-border, #ede9e3);
          border-radius: 11px;
          text-decoration: none;
          transition: all 0.18s ease;
          font-family: 'DM Sans', sans-serif;
        }
        .db-action:hover { background: var(--dl-card-bg); border-color: var(--dl-accent-border, #d4d0e8); transform: translateY(-1px); box-shadow: var(--dl-card-shadow); }
        .db-action-ico { width: 28px; height: 28px; border-radius: 7px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .db-action-lbl { font-size: 0.75rem; font-weight: 600; color: var(--dl-text-primary, #374151); letter-spacing: -0.01em; }

        /* URL CARD */
        .db-url-body { padding: 1rem 1.3rem; }
        .db-url-desc { font-size: 0.75rem; color: var(--dl-text-muted, #64748b); line-height: 1.6; margin-bottom: 0.8rem; }
        .db-url-box { display: flex; align-items: center; gap: 0.5rem; padding: 0.6rem 0.85rem; background: var(--dl-sidebar-bg, #f8f7f4); border: 1px solid var(--dl-sidebar-border, #ede9e3); border-radius: 9px; font-size: 0.75rem; color: var(--dl-chart-primary, #7c3aed); font-weight: 500; margin-bottom: 0.7rem; word-break: break-all; }
        .db-url-btns { display: flex; gap: 0.5rem; }
        .db-url-btn-main { flex: 1; text-align: center; padding: 0.55rem; background: linear-gradient(135deg, var(--dl-chart-primary, #7c3aed), var(--dl-chart-gradient-end, #ec4899)); color: white; border-radius: 9px; font-size: 0.73rem; font-weight: 600; text-decoration: none; transition: opacity 0.2s; }
        .db-url-btn-main:hover { opacity: 0.9; }
        .db-url-btn-sec { flex: 1; text-align: center; padding: 0.55rem; background: var(--dl-sidebar-bg, #f8f7f4); color: var(--dl-text-primary, #374151); border: 1px solid var(--dl-sidebar-border, #ede9e3); border-radius: 9px; font-size: 0.73rem; font-weight: 600; text-decoration: none; transition: all 0.15s; }
        .db-url-btn-sec:hover { background: var(--dl-card-bg, white); border-color: var(--dl-sidebar-border, #d1d5db); }

        /* NOTIFS TOGGLE */
        .db-notif-list { padding: 0.5rem 1.3rem 1rem; display: flex; flex-direction: column; gap: 0; }
        .db-notif-item { display: flex; align-items: center; justify-content: space-between; padding: 0.7rem 0; border-bottom: 1px solid var(--dl-sidebar-border, #f4f2ee); }
        .db-notif-item:last-child { border-bottom: none; }
        .db-notif-label { font-size: 0.78rem; font-weight: 500; color: var(--dl-text-primary, #374151); margin-bottom: 2px; }
        .db-notif-sub { font-size: 0.68rem; color: var(--dl-text-muted, #94a3b8); }
        .db-toggle { position: relative; width: 36px; height: 20px; flex-shrink: 0; }
        .db-toggle input { opacity: 0; width: 0; height: 0; position: absolute; }
        .db-toggle-track {
          position: absolute; inset: 0;
          background: var(--dl-surface-elevated, #e2e8f0);
          border-radius: 100px;
          transition: background 0.2s;
          cursor: pointer;
        }
        .db-toggle input:checked + .db-toggle-track { background: var(--dl-chart-primary, #7c3aed); }
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
          border: 1px solid rgba(148,163,184,0.12);
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
            <div className="db-title">{user.firstName ?? 'Professionnel'}</div>
          </div>
          <div className="db-badge" style={{ background: planBadge.bg, color: planBadge.color, borderColor: planBadge.border }}>
            {planBadge.label}
          </div>
        </div>

        {/* ONBOARDING CHECKLIST - visible jusqu'à complétion */}
        <OnboardingChecklist userId={userId!} />

        {/* STRIPE CONNECT BANNER */}
        {!stripeConnectConfigured && (
          <Link
            href="/dashboard/settings?section=integrations"
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 20px', marginBottom: '1.2rem', borderRadius: 14,
              background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
              border: '1px solid #fbbf24',
              textDecoration: 'none', transition: 'transform 0.15s, box-shadow 0.15s',
            }}
          >
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: 'rgba(217,119,6,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '0.82rem', fontWeight: 700, color: '#92400e', margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
                Configurez vos paiements pour commencer a encaisser vos revenus
              </p>
              <p style={{ fontSize: '0.68rem', color: '#a16207', margin: '2px 0 0', fontFamily: "'DM Sans', sans-serif" }}>
                Connectez Stripe pour recevoir les paiements directement sur votre compte bancaire →
              </p>
            </div>
          </Link>
        )}

        {/* KPI CARDS */}
        <LiveStats />

        {/* ROW 1 : Graphique + RDV + Intelligence + Clients + Lien + Performance */}
        <div className="db-row db-row-3">

          {/* Graphique CA hebdo */}
          <div className="db-panel">
            <div className="db-panel-hd">
              <div className="db-panel-title">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>
                CA cette semaine
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--dl-text-muted)' }}>Prévisionnel</span>
            </div>
            <DashboardClient />
          </div>

          {/* Prochains RDV - Nouveau design premium */}
          <div className="db-apt-section">
            <div className="db-apt-header">
              <div className="db-apt-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                Prochains rendez-vous
              </div>
              <Link href="/dashboard/appointments" className="db-apt-new-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Nouveau
              </Link>
            </div>
            {unifiedNextAppointments && unifiedNextAppointments.length > 0 ? (
              unifiedNextAppointments.map(apt => {
                const timeUntil = getTimeUntil(apt.date)
                const statusColors = {
                  confirmed: { dot: '#7c3aed', bg: '#f5f3ff', text: '#7c3aed' },
                  pending:   { dot: '#f59e0b', bg: '#fffbeb', text: '#d97706' },
                }
                const sc = statusColors[apt.status as keyof typeof statusColors] || statusColors.confirmed
                return (
                  <div
                    key={apt.id}
                    className="db-apt"
                    style={{ cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      {/* Pastille couleur */}
                      <div style={{
                        width: 4, alignSelf: 'stretch', borderRadius: 4,
                        background: sc.dot, flexShrink: 0,
                      }} />
                      {/* Date box */}
                      <div style={{
                        width: 38, height: 38, borderRadius: 10,
                        background: sc.bg, display: 'flex',
                        flexDirection: 'column', alignItems: 'center',
                        justifyContent: 'center', flexShrink: 0,
                      }}>
                        <span style={{
                          fontFamily: "'Clash Display', sans-serif",
                          fontSize: '0.8rem', fontWeight: 700, color: sc.text, lineHeight: 1,
                        }}>
                          {new Date(apt.date).getDate()}
                        </span>
                        <span style={{
                          fontSize: '0.52rem', color: sc.text, opacity: 0.7,
                          textTransform: 'uppercase', letterSpacing: '0.04em',
                        }}>
                          {new Date(apt.date).toLocaleDateString('fr-FR', { month: 'short' })}
                        </span>
                      </div>
                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: '0.8rem', fontWeight: 600,
                          color: 'var(--dl-text-primary)',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {apt.title}
                        </div>
                        <div style={{
                          fontSize: '0.68rem', color: 'var(--dl-text-muted)',
                          display: 'flex', alignItems: 'center', gap: '0.4rem',
                        }}>
                          <span>
                            {new Date(apt.date).toLocaleTimeString('fr-FR', {
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </span>
                          {apt.client_name && (
                            <>
                              <span style={{ opacity: 0.4 }}>·</span>
                              <span style={{
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                maxWidth: 100,
                              }}>
                                {apt.client_name}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Droite : temps restant + statut */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem', flexShrink: 0 }}>
                      {timeUntil ? (
                        <span style={{
                          fontSize: '0.65rem', fontWeight: 700,
                          color: sc.text, background: sc.bg,
                          padding: '0.15rem 0.5rem', borderRadius: 100,
                          fontFamily: "'DM Sans', sans-serif",
                        }}>
                          {timeUntil}
                        </span>
                      ) : (
                        <span style={{
                          fontSize: '0.65rem', fontWeight: 600,
                          color: 'var(--dl-text-muted)',
                          fontFamily: "'DM Sans', sans-serif",
                        }}>
                          {apt.status === 'confirmed' ? 'Confirme' : 'En attente'}
                        </span>
                      )}
                      {apt.duration > 0 && (
                        <span style={{ fontSize: '0.6rem', color: 'var(--dl-text-muted)' }}>
                          {apt.duration} min{apt.price && apt.price > 0 ? ` · ${apt.price}€` : ''}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="db-empty">
                <div className="db-empty-ico" style={{ background: 'var(--dl-accent-light)' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                </div>
                <p className="db-empty-txt">Aucun rendez-vous à venir</p>
                <Link href="/dashboard/appointments" className="db-empty-link">+ Créer un rendez-vous</Link>
              </div>
            )}
          </div>

          {/* Financial Intelligence - Revenue Analytics */}
          <div className="db-panel" style={{ background: 'var(--dl-surface, rgba(15,23,42,0.95))', border: '1px solid var(--dl-glass-border, rgba(255,255,255,0.08))' }}>
            <div className="db-panel-hd" style={{ borderBottom: '1px solid var(--dl-glass-border, rgba(255,255,255,0.08))' }}>
              <div className="db-panel-title" style={{ color: 'var(--dl-text-primary)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                Intelligence Financière
              </div>
            </div>
            <div style={{ padding: '1rem' }}>
              <FinancialIntelligenceWidget />
            </div>
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
                  { bg: 'rgba(124,58,237,0.1)', color: '#7c3aed' },
                  { bg: 'rgba(236,72,153,0.1)', color: '#ec4899' },
                  { bg: 'rgba(16,185,129,0.1)', color: '#10b981' },
                  { bg: 'rgba(217,119,6,0.1)', color: '#d97706' },
                  { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6' },
                ]
                const p = palettes[i % palettes.length]
                return (
                  <div key={client.id} className="db-client">
                    <div className="db-avatar" style={{ background: p.bg, color: p.color }}>{client.name.charAt(0).toUpperCase()}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="db-client-name">{client.name}</div>
                      <div className="db-client-email">{client.email}</div>
                    </div>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--dl-text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                  </div>
                )
              })
            ) : (
              <div className="db-empty">
                <div className="db-empty-ico" style={{ background: 'rgba(236,72,153,0.1)' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f472b6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                </div>
                <p className="db-empty-txt">Aucun client pour l'instant</p>
                <Link href="/dashboard/clients" className="db-empty-link">+ Ajouter un client</Link>
              </div>
            )}
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
                <Link href="/dashboard/site-customize" className="db-url-btn-main">Modifier le profil</Link>
                <Link href="/dashboard/widget" className="db-url-btn-sec">Widget</Link>
              </div>
            </div>
          </div>

          {/* Performance - Quick Stats */}
          <div className="db-panel">
            <div className="db-panel-hd">
              <div className="db-panel-title">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                Performance
              </div>
            </div>
            <PerformanceWidget />
          </div>

        </div>

        {/* UPGRADE BANNER */}
        {plan === 'free' && (
          <div className="db-upgrade">
            <div>
              <div className="db-upgrade-title">Passez au Premium : tout est inclus ⭐</div>
              <div className="db-upgrade-desc">RDV illimités, rappels SMS, marketplace, statistiques avancées. 19€/mois.</div>
            </div>
            <Link href="/dashboard/pricing" className="db-upgrade-btn">Upgrader maintenant</Link>
          </div>
        )}
        {plan === 'premium' && (
          <div className="db-upgrade">
            <div>
 <div className="db-upgrade-title">Découvrez Infinity : l'IA CalendaPro </div>
              <div className="db-upgrade-desc">Assistant IA, automatisations, badge vérifié, priorité marketplace. 49€/mois.</div>
            </div>
            <Link href="/dashboard/pricing" className="db-upgrade-btn">Découvrir Infinity</Link>
          </div>
        )}
        {plan === 'infinity' && (
          <div className="db-upgrade">
            <div>
 <div className="db-upgrade-title">Vous êtes sur Infinity Merci !</div>
              <div className="db-upgrade-desc">Toutes les fonctionnalités sont actives. L'IA conversationnelle arrive très bientôt.</div>
            </div>
            <div className="db-upgrade-active">Plan actif</div>
          </div>
        )}

      </div>
    </>
  )
}
