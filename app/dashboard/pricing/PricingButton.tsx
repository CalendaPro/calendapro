'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PurchaseConfirmModal from '@/components/PurchaseConfirmModal'

export default function PricingButton({
  priceId,
  label,
  isUpgrade = false,
}: {
  priceId: string
  label: string
  isUpgrade?: boolean
}) {
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const router = useRouter()

  async function handleConfirm() {
    setShowConfirm(false)
    setLoading(true)

    try {
      if (isUpgrade) {
        const res = await fetch('/api/stripe/upgrade', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ priceId }),
        })
        const data = await res.json()
        if (data.success) router.push('/dashboard?upgrade=success')
      } else {
        const res = await fetch('/api/stripe/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ priceId }),
        })
        const data = await res.json()
        if (data.url) window.location.href = data.url
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        disabled={loading}
        className="w-full bg-gradient-to-r from-violet-600 to-pink-500 text-white font-semibold text-sm py-2.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {loading ? 'Chargement...' : label}
      </button>

      <PurchaseConfirmModal
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title="Confirmer votre achat"
        description={
          isUpgrade
            ? 'Vous allez modifier votre abonnement. La différence sera débitée automatiquement sur votre carte enregistrée. Souhaitez-vous continuer ?'
            : 'Vous allez souscrire à un abonnement payant. Vous serez redirigé vers la page de paiement sécurisée Stripe. Confirmez-vous ?'
        }
        onConfirm={handleConfirm}
        loading={loading}
      />
    </>
  )
}