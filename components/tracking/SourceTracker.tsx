'use client'

import { useEffect } from 'react'
import { setSourceCookie } from '@/lib/tracking/actions'
import { logger } from '@/lib/logger'

interface SourceTrackerProps {
  source: string
  detectedAt: string
}

export function SourceTracker({ source, detectedAt }: SourceTrackerProps) {
  useEffect(() => {
    // Appeler la Server Action pour setter le cookie
    setSourceCookie(source, detectedAt).catch(logger.error)
  }, [source, detectedAt])

  return null // Ce composant ne rend rien
}
