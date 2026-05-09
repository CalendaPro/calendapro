'use client'

import React from 'react'
import { CreditCard, CheckCircle, XCircle, RotateCcw, Clock, MapPin } from 'lucide-react'

type PaymentStatus = 'paid' | 'on_site' | 'refunded' | 'partially_refunded' | 'failed' | 'pending'

interface PaymentStatusBadgeProps {
  status: PaymentStatus | string
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
  className?: string
}

const STATUS_CONFIG: Record<PaymentStatus, {
  label: string
  color: string
  bg: string
  border: string
  icon: React.ReactNode
}> = {
  paid: {
    label: 'Payé',
    color: '#166534',      // #54 - Plus foncé pour contraste 4.5:1+
    bg: '#DCFCE7',         // Fond plus soutenu
    border: '#86EFAC',
    icon: <CheckCircle size={12} strokeWidth={2} />,
  },
  on_site: {
    label: 'Sur place',
    color: '#374151',      // #54 - Gris plus foncé
    bg: '#F3F4F6',
    border: '#D1D5DB',
    icon: <MapPin size={12} strokeWidth={2} />,
  },
  refunded: {
    label: 'Remboursé',
    color: '#1E40AF',      // #54 - Bleu plus foncé
    bg: '#DBEAFE',
    border: '#93C5FD',
    icon: <RotateCcw size={12} strokeWidth={2} />,
  },
  partially_refunded: {
    label: 'Partiellement remboursé',
    color: '#6D28D9',      // #54 - Violet plus foncé
    bg: '#EDE9FE',
    border: '#C4B5FD',
    icon: <RotateCcw size={12} strokeWidth={2} />,
  },
  failed: {
    label: 'Échoué',
    color: '#9F1239',      // #54 - Rouge plus foncé
    bg: '#FFE4E6',
    border: '#FDA4AF',
    icon: <XCircle size={12} strokeWidth={2} />,
  },
  pending: {
    label: 'En attente',
    color: '#92400E',      // #54 - Orange/ambre plus foncé
    bg: '#FEF3C7',
    border: '#FCD34D',
    icon: <Clock size={12} strokeWidth={2} />,
  },
}

const SIZE_CONFIG = {
  sm: { padding: '0.13rem 0.5rem', fontSize: '0.64rem', iconSize: 12, gap: 4 },
  md: { padding: '0.22rem 0.65rem', fontSize: '0.68rem', iconSize: 14, gap: 6 },
  lg: { padding: '0.35rem 0.85rem', fontSize: '0.75rem', iconSize: 16, gap: 8 },
}

export function PaymentStatusBadge({
  status,
  size = 'md',
  showIcon = true,
  className = '',
}: PaymentStatusBadgeProps) {
  const config = STATUS_CONFIG[status as PaymentStatus] || STATUS_CONFIG.pending
  const sizeConfig = SIZE_CONFIG[size]

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: sizeConfig.gap,
        padding: sizeConfig.padding,
        borderRadius: 100,
        background: config.bg,
        border: `1px solid ${config.border}`,
        color: config.color,
        fontSize: sizeConfig.fontSize,
        fontWeight: 600,
        fontFamily: "'DM Sans', sans-serif",
        whiteSpace: 'nowrap',
      }}
    >
      {showIcon && (
        <span style={{ display: 'flex', alignItems: 'center' }}>
          {config.icon}
        </span>
      )}
      {config.label}
    </span>
  )
}

// Helper pour convertir les statuts DB en PaymentStatus
export function mapPaymentStatus(
  paymentStatus?: string | null,
  paymentMethod?: string | null,
  refundAmount?: number | null,
  amountPaid?: number | null
): PaymentStatus {
  if (paymentStatus === 'failed') return 'failed'
  if (paymentStatus === 'refunded') return 'refunded'
  if (paymentStatus === 'partially_refunded' || (refundAmount && refundAmount > 0 && amountPaid && refundAmount < amountPaid)) {
    return 'partially_refunded'
  }
  if (paymentStatus === 'paid' || paymentStatus === 'succeeded') {
    if (paymentMethod === 'on_site') return 'on_site'
    return 'paid'
  }
  if (paymentMethod === 'on_site') return 'on_site'
  return 'pending'
}

export default PaymentStatusBadge
