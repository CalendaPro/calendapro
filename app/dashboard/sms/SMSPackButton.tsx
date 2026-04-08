'use client'

import { useState } from 'react'
import PurchaseConfirmModal from '@/components/PurchaseConfirmModal'

export default function SMSPackButton({
  priceId,
  credits,
  label,
}: {
  priceId: string
  credits: number
  label: string
}) {
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  async function handleBuy() {
    setShowConfirm(false)
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/sms-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, credits }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
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
          <>
            Vous allez acheter <strong>{credits} crédits SMS</strong>. Vous serez redirigé vers la page de paiement sécurisée Stripe. Souhaitez-vous continuer ?
          </>
        }
        onConfirm={handleBuy}
        loading={loading}
      />
    </>
  )
}