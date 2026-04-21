'use client'

import { useEffect, useState } from 'react'

export type Plan = 'free' | 'premium' | 'infinity'

const PLAN_RANK: Record<Plan, number> = { free: 0, premium: 1, infinity: 2 }

export function usePlan() {
  const [plan, setPlan] = useState<Plan | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.json())
      .then((d: { plan?: Plan }) => setPlan(d.plan ?? 'free'))
      .catch(() => setPlan('free'))
      .finally(() => setLoading(false))
  }, [])

  const has = (required: Plan) =>
    plan !== null && PLAN_RANK[plan] >= PLAN_RANK[required]

  return { plan, loading, has }
}
