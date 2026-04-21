'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useUser } from '@clerk/nextjs'
import { BrandLogo } from '@/components/BrandLogo'
import { Sparkles, Zap, Crown, ArrowRight, HelpCircle, ChevronLeft } from 'lucide-react'

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    price: '0',
    period: 'pour toujours',
    description: 'Parfait pour démarrer et tester CalendaPro',
    icon: Zap,
    color: '#64748b',
    features: [
      { name: 'Rendez-vous', value: '20/mois', included: true },
      { name: 'Page de réservation publique', value: 'Incluse', included: true },
      { name: 'Rappels par email', value: 'Inclus', included: true },
      { name: 'Dashboard de base', value: 'Inclus', included: true },
      { name: 'Rappels SMS', value: '—', included: false },
      { name: 'WhatsApp', value: '—', included: false },
      { name: 'Marketplace', value: '—', included: false },
      { name: 'Widget intégration', value: '—', included: false },
      { name: 'Statistiques avancées', value: '—', included: false },
      { name: 'Support prioritaire', value: '—', included: false },
      { name: 'Assistant IA', value: '—', included: false },
      { name: 'Sous-domaine perso', value: '—', included: false },
    ]
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '19',
    period: '/mois',
    description: 'Pour les pros qui veulent plus de clients',
    icon: Crown,
    color: '#7c3aed',
    popular: true,
    features: [
      { name: 'Rendez-vous', value: 'Illimités', included: true, highlight: true },
      { name: 'Page de réservation publique', value: 'Incluse', included: true },
      { name: 'Rappels par email', value: 'Inclus', included: true },
      { name: 'Dashboard de base', value: 'Inclus', included: true },
      { name: 'Rappels SMS', value: '30/mois', included: true, highlight: true },
      { name: 'WhatsApp', value: '30/mois', included: true },
      { name: 'Marketplace', value: 'Référencé', included: true, highlight: true },
      { name: 'Widget intégration', value: 'Inclus', included: true },
      { name: 'Statistiques avancées', value: 'Inclus', included: true },
      { name: 'Support prioritaire', value: 'Inclus', included: true },
      { name: 'Assistant IA', value: '—', included: false },
      { name: 'Sous-domaine perso', value: '—', included: false },
    ]
  },
  {
    id: 'infinity',
    name: 'Infinity',
    price: '49',
    period: '/mois',
    description: 'L\'expérience ultime avec IA intégrée',
    icon: Sparkles,
    color: '#ec4899',
    isInfinity: true,
    features: [
      { name: 'Rendez-vous', value: 'Illimités', included: true },
      { name: 'Page de réservation publique', value: 'Incluse', included: true },
      { name: 'Rappels par email', value: 'Inclus', included: true },
      { name: 'Dashboard de base', value: 'Inclus', included: true },
      { name: 'Rappels SMS', value: '200/mois', included: true, highlight: true },
      { name: 'WhatsApp', value: '200/mois', included: true },
      { name: 'Marketplace', value: 'Prioritaire', included: true, highlight: true },
      { name: 'Widget intégration', value: 'Inclus', included: true },
      { name: 'Statistiques avancées', value: 'Inclus', included: true },
      { name: 'Support prioritaire', value: 'VIP', included: true, highlight: true },
      { name: 'Assistant IA', value: 'Inclus', included: true, highlight: true },
      { name: 'Sous-domaine perso', value: 'Inclus', included: true },
    ]
  }
]

const faqs = [
  {
    question: 'Puis-je changer de plan à tout moment ?',
    answer: 'Oui, vous pouvez upgrader ou downgrader votre plan à tout moment. Les changements prennent effet immédiatement.'
  },
  {
    question: 'Y a-t-il des frais cachés ?',
    answer: 'Non, nos prix sont transparents. Pas de frais de setup, pas de frais de résiliation.'
  },
  {
    question: 'Que se passe-t-il si je dépasse mes SMS inclus ?',
    answer: 'Vous pouvez acheter des packs de SMS supplémentaires à 0.08€ par SMS, ou upgrader vers un plan supérieur.'
  },
  {
    question: 'Le plan Starter est-il vraiment gratuit ?',
    answer: 'Oui, à vie. C\'est notre façon de vous laisser tester CalendaPro sans engagement.'
  }
]

// ─── FLOATING BACK BUTTON ────────────────────────────────────────────────────
function FloatingBackButton() {
  return (
    <Link
      href="/"
      style={{
        position: 'fixed',
        top: '80px',
        left: '24px',
        zIndex: 101,
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '10px 16px',
        borderRadius: '100px',
        background: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(12px)',
        border: '0.5px solid rgba(0, 0, 0, 0.08)',
        color: '#64748b',
        fontSize: '0.8rem',
        fontFamily: 'Clash Display, DM Sans, sans-serif',
        fontWeight: 500,
        textDecoration: 'none',
        transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(124, 58, 237, 0.08)'
        e.currentTarget.style.color = '#7c3aed'
        e.currentTarget.style.borderColor = 'rgba(124, 58, 237, 0.2)'
        e.currentTarget.style.transform = 'translateX(4px)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.7)'
        e.currentTarget.style.color = '#64748b'
        e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.08)'
        e.currentTarget.style.transform = 'translateX(0)'
      }}
    >
      <ChevronLeft size={14} strokeWidth={2} />
      <span>Retour</span>
    </Link>
  )
}

// ─── HEADER ──────────────────────────────────────────────────────────────────
function Header() {
  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      padding: '0 2.5rem',
      height: '64px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: 'rgba(250, 249, 246, 0.85)',
      backdropFilter: 'blur(12px)',
      borderBottom: '0.5px solid rgba(0, 0, 0, 0.06)',
    }}>
      <BrandLogo />
    </nav>
  )
}

// ─── INFINITY BUTTON WITH DATA FLOW ──────────────────────────────────────────
function InfinityButton({ children, href, onMouseEnter, onMouseLeave }: { 
  children: React.ReactNode, 
  href: string, 
  onMouseEnter?: () => void, 
  onMouseLeave?: () => void 
}) {
  return (
    <Link
      href={href}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        position: 'relative',
        display: 'block',
        textAlign: 'center',
        padding: '1rem 1.5rem',
        borderRadius: '14px',
        background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
        color: 'white',
        textDecoration: 'none',
        fontWeight: 600,
        fontSize: '0.9rem',
        fontFamily: 'Clash Display, DM Sans, sans-serif',
        overflow: 'hidden',
        border: '0.5px solid rgba(255, 255, 255, 0.2)',
      }}
    >
      <div
        className="infinity-data-particle"
        style={{
          position: 'absolute',
          width: '5px',
          height: '5px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, #ffffff 0%, #a78bfa 50%, transparent 70%)',
          boxShadow: '0 0 10px #a78bfa, 0 0 20px #7c3aed',
          pointerEvents: 'none',
        }}
      />
      <div
        className="infinity-data-trail"
        style={{
          position: 'absolute',
          width: '3px',
          height: '3px',
          borderRadius: '50%',
          background: 'rgba(167, 139, 250, 0.6)',
          pointerEvents: 'none',
        }}
      />
      <span style={{ position: 'relative', zIndex: 2 }}>{children}</span>
    </Link>
  )
}

// ─── PURPLE DOT INDICATOR ──────────────────────────────────────────────────
function PurpleDot({ color = '#7c3aed' }: { color?: string }) {
  return (
    <div
      style={{
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        background: color,
        flexShrink: 0,
      }}
    />
  )
}

// ─── FEATURE ROW ─────────────────────────────────────────────────────────────
function FeatureRow({ feature, plans }: { feature: string, plans: any[] }) {
  const [isHovered, setIsHovered] = useState(false)

  const hasHighlight = plans.some(plan => {
    const planFeature = plan.features.find((f: any) => f.name === feature)
    return planFeature?.highlight
  })

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: '1.5fr repeat(3, 1fr)',
        gap: '1rem',
        padding: '0.875rem 1.5rem',
        alignItems: 'center',
        cursor: 'default',
        background: isHovered ? 'rgba(124, 58, 237, 0.04)' : 'transparent',
        transition: 'all 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
        borderBottom: '0.5px solid rgba(0, 0, 0, 0.05)',
      }}
    >
      {/* Feature name - Clash Display */}
      <span style={{
        fontSize: '0.9rem',
        color: isHovered ? '#0f172a' : '#475569',
        fontFamily: 'Clash Display, DM Sans, sans-serif',
        fontWeight: 500,
        letterSpacing: '-0.01em',
        transition: 'color 0.25s ease',
      }}>
        {feature}
      </span>

      {plans.map((plan, idx) => {
        const planFeature = plan.features.find((f: any) => f.name === feature)
        const isNumeric = planFeature?.value && /\d/.test(planFeature.value)

        return (
          <div key={idx} style={{ 
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}>
            {planFeature?.included ? (
              <>
                <PurpleDot color={plan.color} />
                <span
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: planFeature.highlight ? 600 : 500,
                    color: planFeature.highlight
                      ? plan.color
                      : isHovered ? '#0f172a' : '#334155',
                    fontFamily: isNumeric
                      ? "'JetBrains Mono', 'Fira Code', monospace"
                      : "Clash Display, DM Sans, sans-serif",
                    letterSpacing: isNumeric ? '-0.02em' : '-0.01em',
                    transition: 'color 0.25s ease',
                  }}
                >
                  {planFeature.value}
                </span>
              </>
            ) : (
              <span style={{
                fontSize: '0.85rem',
                color: '#cbd5e1',
                fontFamily: 'Clash Display, DM Sans, sans-serif',
                fontWeight: 400,
              }}>
                —
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function PlansPage() {
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null)
  const { isSignedIn } = useUser()

  const allFeatures = plans[0].features.map((f: any) => f.name)

  // Helper to get plan link based on auth state (Zero Friction)
  const getPlanLink = (planId: string) => {
    if (isSignedIn) {
      // User already logged in → direct to auth sync
      return `/api/auth/sync?planId=${planId}`
    }
    // Not logged in → sign up flow
    return `/sign-up?planId=${planId}&redirect_url=/api/auth/sync`
  }

  return (
    <div style={{
      background: '#FAF9F6',
      minHeight: '100vh',
      paddingTop: '64px',
      position: 'relative',
    }}>
      <FloatingBackButton />
      <Header />

      {/* Hero */}
      <section style={{ padding: '4rem 2.5rem 3rem', textAlign: 'center', position: 'relative', zIndex: 2 }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div style={{
            display: 'inline-block',
            fontSize: '0.7rem',
            fontWeight: 600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#7c3aed',
            background: 'rgba(124, 58, 237, 0.08)',
            border: '0.5px solid rgba(124, 58, 237, 0.2)',
            padding: '0.35rem 1rem',
            borderRadius: '100px',
            marginBottom: '1.5rem',
            fontFamily: 'Clash Display, DM Sans, sans-serif',
          }}>
            Comparaison des plans
          </div>
          <h1 style={{
            fontFamily: "Clash Display, sans-serif",
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            fontWeight: 700,
            letterSpacing: '-0.03em',
            color: '#0f172a',
            marginBottom: '1rem',
            lineHeight: 1.1,
          }}>
            Choisissez votre plan
          </h1>
          <p style={{
            color: '#64748b',
            fontSize: '1.1rem',
            fontFamily: 'Satoshi, DM Sans, sans-serif',
            fontWeight: 400,
            maxWidth: '600px',
            margin: '0 auto',
            lineHeight: 1.7,
          }}>
            Tous nos plans incluent les fonctionnalités essentielles. <br />
            <strong style={{ color: '#7c3aed', fontFamily: 'Clash Display, DM Sans, sans-serif' }}>
              Commencez gratuitement
            </strong>
            , évoluez quand vous voulez.
          </p>
        </motion.div>
      </section>

      {/* Pricing Cards */}
      <section style={{ padding: '0 2.5rem 4rem', position: 'relative', zIndex: 2 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }} className="plans-grid">
            {plans.map((plan, idx) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                onMouseEnter={() => setHoveredPlan(plan.name)}
                onMouseLeave={() => setHoveredPlan(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.7)',
                  borderRadius: '24px',
                  padding: '2.5rem',
                  border: plan.popular 
                    ? '0.5px solid rgba(124, 58, 237, 0.3)' 
                    : '0.5px solid rgba(0, 0, 0, 0.06)',
                  position: 'relative',
                  transform: hoveredPlan === plan.name ? 'translateY(-8px) scale(1.02)' : 'translateY(0) scale(1)',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  boxShadow: hoveredPlan === plan.name
                    ? '0 30px 80px rgba(124, 58, 237, 0.15)'
                    : '0 8px 32px rgba(0, 0, 0, 0.04)',
                  backdropFilter: 'blur(12px)',
                }}
              >
                {plan.popular && (
                  <div style={{
                    position: 'absolute',
                    top: '-14px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
                    color: 'white',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    padding: '0.35rem 1.2rem',
                    borderRadius: '100px',
                    fontFamily: 'Clash Display, DM Sans, sans-serif',
                    boxShadow: '0 4px 20px rgba(124, 58, 237, 0.3)',
                  }}>
                    Le plus populaire
                  </div>
                )}

                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  background: `${plan.color}12`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.5rem',
                  border: `0.5px solid ${plan.color}30`,
                }}>
                  <plan.icon size={28} style={{ color: plan.color }} />
                </div>

                <h3 style={{
                  fontFamily: "Clash Display, sans-serif",
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: '#0f172a',
                  marginBottom: '0.5rem',
                  letterSpacing: '-0.02em',
                }}>
                  {plan.name}
                </h3>

                <p style={{
                  fontSize: '0.85rem',
                  color: '#64748b',
                  fontFamily: 'Satoshi, DM Sans, sans-serif',
                  fontWeight: 400,
                  marginBottom: '1.5rem',
                  minHeight: '40px',
                }}>
                  {plan.description}
                </p>

                {/* Price - Clash Display */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', marginBottom: '2rem' }}>
                  <span style={{
                    fontFamily: "Clash Display, sans-serif",
                    fontSize: '3.5rem',
                    fontWeight: 700,
                    color: '#0f172a',
                    letterSpacing: '-0.04em',
                    lineHeight: 1,
                  }}>
                    {plan.price}€
                  </span>
                  <span style={{
                    fontSize: '0.9rem',
                    color: '#94a3b8',
                    fontFamily: 'Clash Display, DM Sans, sans-serif',
                    fontWeight: 400,
                  }}>
                    {plan.period}
                  </span>
                </div>

                {/* Feature bullets */}
                <div style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {plan.features.slice(0, 4).map((feat, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <PurpleDot color={plan.color} />
                      <span style={{
                        fontSize: '0.8rem',
                        color: '#475569',
                        fontFamily: 'Satoshi, DM Sans, sans-serif',
                        fontWeight: 400,
                      }}>
                        {feat.name}
                      </span>
                    </div>
                  ))}
                </div>

                {plan.isInfinity ? (
                  <InfinityButton
                    href={getPlanLink(plan.id)}
                    onMouseEnter={() => setHoveredPlan(plan.name)}
                    onMouseLeave={() => setHoveredPlan(null)}
                  >
                    Choisir {plan.name}
                  </InfinityButton>
                ) : (
                  <Link
                    href={getPlanLink(plan.id)}
                    style={{
                      display: 'block',
                      textAlign: 'center',
                      padding: '1rem',
                      borderRadius: '14px',
                      background: plan.popular ? plan.color : `${plan.color}15`,
                      color: plan.popular ? 'white' : plan.color,
                      textDecoration: 'none',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      fontFamily: 'Clash Display, DM Sans, sans-serif',
                      border: `0.5px solid ${plan.popular ? 'transparent' : `${plan.color}40`}`,
                      opacity: hoveredPlan === plan.name ? 0.9 : 1,
                      transition: 'opacity 0.2s',
                    }}
                  >
                    Choisir {plan.name}
                  </Link>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Detailed Comparison - Glass Table */}
      <section style={{ padding: '3rem 2.5rem', position: 'relative', zIndex: 2 }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <h2 style={{
            fontFamily: "Clash Display, sans-serif",
            fontSize: '2rem',
            fontWeight: 700,
            color: '#0f172a',
            textAlign: 'center',
            marginBottom: '3rem',
            letterSpacing: '-0.02em',
          }}>
            Comparaison détaillée
          </h2>

          {/* Glass Table Container */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.7)',
              backdropFilter: 'blur(12px)',
              borderRadius: '24px',
              padding: '2rem',
              overflow: 'hidden',
              border: '0.5px solid rgba(124, 58, 237, 0.1)',
              boxShadow: '0 32px 64px rgba(0, 0, 0, 0.04), 0 0 0 0.5px rgba(255, 255, 255, 0.5) inset',
            }}
          >
            {/* Header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1.5fr repeat(3, 1fr)',
              gap: '1rem',
              padding: '0 1.5rem 1.5rem',
              borderBottom: '0.5px solid rgba(0, 0, 0, 0.08)',
              marginBottom: '0.5rem',
            }}>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#94a3b8',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                fontFamily: 'Clash Display, DM Sans, sans-serif',
              }}>
                Fonctionnalités
              </span>
              {plans.map((plan, idx) => (
                <div key={idx} style={{ textAlign: 'center' }}>
                  <span style={{
                    fontFamily: "Clash Display, sans-serif",
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: plan.color,
                    letterSpacing: '-0.01em',
                  }}>
                    {plan.name}
                  </span>
                </div>
              ))}
            </div>

            {/* Features */}
            {allFeatures.map((feature, idx) => (
              <FeatureRow key={idx} feature={feature} plans={plans} />
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: '3rem 2.5rem 5rem', position: 'relative', zIndex: 2 }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{
            fontFamily: "Clash Display, sans-serif",
            fontSize: '2rem',
            fontWeight: 700,
            color: '#0f172a',
            textAlign: 'center',
            marginBottom: '3rem',
            letterSpacing: '-0.02em',
          }}>
            Questions fréquentes
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {faqs.map((faq, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                style={{
                  background: 'rgba(255, 255, 255, 0.7)',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  border: '0.5px solid rgba(0, 0, 0, 0.06)',
                  backdropFilter: 'blur(12px)',
                  boxShadow: '0 2px 12px rgba(0, 0, 0, 0.02)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                  <PurpleDot color="#7c3aed" />
                  <div>
                    <h4 style={{
                      fontFamily: "Clash Display, sans-serif",
                      fontSize: '1rem',
                      fontWeight: 600,
                      color: '#0f172a',
                      marginBottom: '0.5rem',
                      letterSpacing: '-0.01em',
                    }}>
                      {faq.question}
                    </h4>
                    <p style={{
                      fontSize: '0.9rem',
                      color: '#64748b',
                      fontFamily: 'Satoshi, DM Sans, sans-serif',
                      fontWeight: 400,
                      lineHeight: 1.6,
                    }}>
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{
        padding: '4rem 2.5rem',
        background: '#0f172a',
        textAlign: 'center',
        position: 'relative',
        zIndex: 2,
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 style={{
            fontFamily: "Clash Display, sans-serif",
            fontSize: '2rem',
            fontWeight: 700,
            color: '#f8fafc',
            marginBottom: '1rem',
            letterSpacing: '-0.02em',
          }}>
            Prêt à transformer votre business ?
          </h2>
          <p style={{
            color: '#94a3b8',
            fontSize: '1rem',
            fontFamily: 'Satoshi, DM Sans, sans-serif',
            fontWeight: 400,
            marginBottom: '2rem',
          }}>
            Rejoignez des milliers d'indépendants qui gèrent leur agenda avec CalendaPro.
          </p>
          <InfinityButton href={getPlanLink('starter')}>
            Commencer gratuitement
          </InfinityButton>
        </motion.div>
      </section>

      <style>{`
        @media (max-width: 900px) {
          .plans-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}
