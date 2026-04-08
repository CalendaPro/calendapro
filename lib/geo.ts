/** Distance en km (sphère, repli si PostGIS indisponible) */
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export const PLAN_SORT_RANK: Record<string, number> = {
  infinity: 0,
  premium: 1,
  starter: 2,
}

/** Infinity toujours avant premium/starter ; puis distance croissante si fournie. */
export function compareMarketplacePros(
  a: { plan: string; distance?: number },
  b: { plan: string; distance?: number },
  tieByDistance: boolean
) {
  const pa = PLAN_SORT_RANK[a.plan] ?? 3
  const pb = PLAN_SORT_RANK[b.plan] ?? 3
  if (pa !== pb) return pa - pb
  if (tieByDistance && a.distance != null && b.distance != null) {
    return a.distance - b.distance
  }
  return 0
}
