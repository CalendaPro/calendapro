'use client'

import React, { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { BrandLogo } from '@/components/BrandLogo'
import { Check, Sparkles, Crown, Zap, ArrowRight, CreditCard, Shield, Clock } from 'lucide-react'

interface PlanDetails {
  name: string
  price: string
  period: string
  color: string
  icon: React.ElementType
  description: string
  features: string[]
  cta: string
  subtitle: string
  paymentRequired: boolean
  popular?: boolean
  badge?: string
}

const planDetails: Record<string, PlanDetails> = {
  starter: {
    name: 'Starter',
    price: '0',
    period: 'pour toujours',
    color: '#64748b',
    icon: Zap,
    description: 'Parfait pour démarrer sans engagement',
    features: [
      '20 rendez-vous par mois',
      'Page de réservation publique',
      'Rappels par email',
      'Dashboard de base',
      'Support par email',
    ],
    cta: 'Continuer avec Starter',
    subtitle: 'Gratuit, pour toujours',
    paymentRequired: false,
  },
  premium: {
    name: 'Premium',
    price: '19',
    period: '/mois',
    color: '#7c3aed',
    icon: Crown,
    description: 'Pour les pros qui veulent plus de clients',
    features: [
      'Rendez-vous illimités',
      'SMS & WhatsApp (30/mois)',
      'Référencement Marketplace',
      "Widget d'intégration",
      'Statistiques avancées',
      'Support prioritaire',
    ],
    cta: 'Activer mon Premium',
    subtitle: 'Sans engagement, annulation à tout moment',
    paymentRequired: true,
    popular: true,
  },
  infinity: {
    name: 'Infinity',
    price: '49',
    period: '/mois',
    color: '#ec4899',
    icon: Sparkles,
    description: "L'expérience ultime avec IA intégrée",
    features: [
      'Tout Premium inclus',
      'Assistant IA personnel',
      '200 SMS/mois',
      'Priorité Marketplace MAX',
      'Sous-domaine personnalisé',
      'Accès API complet',
      'Support VIP',
    ],
    cta: 'Activer mon Infinity',
    subtitle: 'L\'expérience la plus complète',
    paymentRequired: true,
    badge: 'IA',
  },
}

function Header() {
  return (
    <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, padding: '0 2.5rem', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(250,250,248,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
      <BrandLogo />
    </nav>
  )
}

function PlanContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const planParam = searchParams.get('plan') || 'starter'
  const plan = planDetails[planParam] || planDetails.starter
  
  const PlanIcon = plan.icon

  useEffect(() => {
    // Store selected plan in localStorage for post-signup flow
    if (planParam) {
      localStorage.setItem('selectedPlan', planParam)
    }
  }, [planParam])

  const handleContinue = () => {
    if (plan.paymentRequired) {
      // Redirect to checkout for paid plans
      router.push(`/api/stripe/checkout?plan=${planParam}`)
    } else {
      // Redirect to dashboard for free plan
      router.push('/dashboard')
    }
  }

  return (
    <div style={{ background: '#fafaf8', minHeight: '100vh', paddingTop: '64px' }}>
      <Header />

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '4rem 2rem' }}>
        {/* Progress indicator */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '3rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Check size={20} color="white" />
            </div>
            <div style={{ width: '60px', height: '2px', background: '#e2e8f0' }} />
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontSize: '0.75rem', fontWeight: 700 }}>2</span>
            </div>
            <div style={{ width: '60px', height: '2px', background: '#e2e8f0' }} />
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'white', border: '2px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700 }}>3</span>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: 'center', marginBottom: '3rem' }}
        >
          <div style={{
            display: 'inline-block',
            fontSize: '0.7rem',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: plan.color,
            background: `${plan.color}15`,
            padding: '0.4rem 1rem',
            borderRadius: '100px',
            marginBottom: '1.5rem',
            fontFamily: 'DM Sans, sans-serif'
          }}>
            Étape 2 sur 3
          </div>
          <h1 style={{
            fontFamily: "'Clash Display', sans-serif",
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            fontWeight: 700,
            letterSpacing: '-0.03em',
            color: '#0f172a',
            marginBottom: '1rem',
            lineHeight: 1.2
          }}>
            Voici votre plan
          </h1>
          <p style={{ color: '#64748b', fontSize: '1.1rem', fontFamily: 'DM Sans, sans-serif', maxWidth: '500px', margin: '0 auto' }}>
            {plan.description}
          </p>
        </motion.div>

        {/* Plan Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          style={{
            background: 'white',
            borderRadius: '24px',
            padding: '2.5rem',
            border: plan.popular ? `2px solid ${plan.color}` : '1px solid rgba(0,0,0,0.08)',
            boxShadow: plan.popular ? `0 20px 60px ${plan.color}25` : '0 10px 40px rgba(0,0,0,0.08)',
            position: 'relative',
            marginBottom: '2rem'
          }}
        >
          {plan.badge && (
            <div style={{
              position: 'absolute',
              top: '-12px',
              right: '2rem',
              background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
              color: 'white',
              fontSize: '0.65rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              padding: '0.3rem 0.9rem',
              borderRadius: '100px',
              fontFamily: 'DM Sans, sans-serif'
            }}>
              {plan.badge}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '20px',
              background: `${plan.color}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <PlanIcon size={36} style={{ color: plan.color }} />
            </div>
            <div>
              <h2 style={{
                fontFamily: "'Clash Display', sans-serif",
                fontSize: '2rem',
                fontWeight: 700,
                color: '#0f172a',
                marginBottom: '0.25rem'
              }}>
                {plan.name}
              </h2>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                <span style={{
                  fontFamily: "'Clash Display', sans-serif",
                  fontSize: '2.5rem',
                  fontWeight: 700,
                  color: plan.color
                }}>
                  {plan.price}€
                </span>
                <span style={{ color: '#94a3b8', fontSize: '1rem', fontFamily: 'DM Sans, sans-serif' }}>
                  {plan.period}
                </span>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{
              fontFamily: "'Clash Display', sans-serif",
              fontSize: '1rem',
              fontWeight: 600,
              color: '#0f172a',
              marginBottom: '1rem'
            }}>
              Ce qui est inclus :
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {plan.features.map((feature, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: `${plan.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Check size={14} style={{ color: plan.color }} />
                  </div>
                  <span style={{ fontSize: '0.9rem', color: '#475569', fontFamily: 'DM Sans, sans-serif' }}>
                    {feature}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {plan.paymentRequired && (
            <div style={{
              display: 'flex',
              gap: '1rem',
              marginBottom: '2rem',
              padding: '1.25rem',
              background: '#f8fafc',
              borderRadius: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                <Shield size={24} style={{ color: '#10b981' }} />
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a', fontFamily: 'DM Sans, sans-serif' }}>
                    Paiement sécurisé
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'DM Sans, sans-serif' }}>
                    Par Stripe, sans stockage CB
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                <Clock size={24} style={{ color: '#7c3aed' }} />
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a', fontFamily: 'DM Sans, sans-serif' }}>
                    Sans engagement
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'DM Sans, sans-serif' }}>
                    Annulation à tout moment
                  </div>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleContinue}
            style={{
              width: '100%',
              padding: '1.25rem',
              borderRadius: '16px',
              background: plan.paymentRequired ? plan.color : '#0f172a',
              color: 'white',
              border: 'none',
              fontSize: '1rem',
              fontWeight: 700,
              fontFamily: 'DM Sans, sans-serif',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              transition: 'all 0.2s',
              boxShadow: plan.paymentRequired ? `0 8px 30px ${plan.color}40` : '0 8px 30px rgba(0,0,0,0.2)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = plan.paymentRequired ? `0 12px 40px ${plan.color}50` : '0 12px 40px rgba(0,0,0,0.25)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = plan.paymentRequired ? `0 8px 30px ${plan.color}40` : '0 8px 30px rgba(0,0,0,0.2)'
            }}
          >
            {plan.paymentRequired && <CreditCard size={20} />}
            {plan.cta}
            <ArrowRight size={20} />
          </button>

          <p style={{
            textAlign: 'center',
            fontSize: '0.8rem',
            color: '#94a3b8',
            fontFamily: 'DM Sans, sans-serif',
            marginTop: '1rem'
          }}>
            {plan.subtitle}
          </p>
        </motion.div>

        {/* Change plan */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          style={{ textAlign: 'center' }}
        >
          <p style={{ fontSize: '0.9rem', color: '#64748b', fontFamily: 'DM Sans, sans-serif', marginBottom: '1rem' }}>
            Ce plan ne vous convient pas ?
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            {Object.entries(planDetails).filter(([key]) => key !== planParam).map(([key, otherPlan]) => (
              <Link
                key={key}
                href={`/onboarding/plan?plan=${key}`}
                style={{
                  padding: '0.75rem 1.25rem',
                  borderRadius: '12px',
                  background: 'white',
                  border: '1px solid rgba(0,0,0,0.08)',
                  color: '#475569',
                  textDecoration: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  fontFamily: 'DM Sans, sans-serif',
                  transition: 'all 0.2s'
                }}
              >
                Voir {otherPlan.name}
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{
            marginTop: '4rem',
            padding: '1.5rem',
            background: 'white',
            borderRadius: '16px',
            border: '1px solid rgba(0,0,0,0.06)',
            display: 'flex',
            justifyContent: 'center',
            gap: '3rem',
            flexWrap: 'wrap'
          }}
        >
          {[
            { value: '15,000+', label: 'Pros actifs' },
            { value: '4.8/5', label: 'Note moyenne' },
            { value: '99.9%', label: 'Uptime' },
          ].map((stat) => (
            <div key={stat.label} style={{ textAlign: 'center' }}>
              <div style={{
                fontFamily: "'Clash Display', sans-serif",
                fontSize: '1.5rem',
                fontWeight: 700,
                color: '#0f172a'
              }}>
                {stat.value}
              </div>
              <div style={{
                fontSize: '0.75rem',
                color: '#94a3b8',
                fontFamily: 'DM Sans, sans-serif'
              }}>
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}

export default function OnboardingPlanPage() {
  return (
    <Suspense fallback={
      <div style={{ background: '#fafaf8', minHeight: '100vh', paddingTop: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: '1.5rem', color: '#7c3aed', marginBottom: '1rem' }}>
            Chargement...
          </div>
        </div>
      </div>
    }>
      <PlanContent />
    </Suspense>
  )
}
