'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface PersistentFormOptions<T> {
  storageKey: string
  initialValues: T
  expireAfterMinutes?: number
  onRestore?: (values: T) => void
}

interface PersistentFormReturn<T> {
  values: T
  setValues: (values: T | ((prev: T) => T)) => void
  getInputProps: (name: keyof T) => {
    value: unknown
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
  }
  clearStorage: () => void
  hasRestoredData: boolean
  restoreData: () => boolean
}

interface StoredFormData<T> {
  values: T
  timestamp: number
  url: string
}

/**
 * Hook pour persister les données de formulaire dans localStorage
 * Gère l'expiration automatique et la restauration après reconnexion
 * 
 * @example
 * const form = usePersistentForm({
 *   storageKey: 'booking_form_${username}',
 *   initialValues: { name: '', email: '', date: '' },
 *   expireAfterMinutes: 60
 * });
 */
export function usePersistentForm<T extends Record<string, unknown>>(
  options: PersistentFormOptions<T>
): PersistentFormReturn<T> {
  const { storageKey, initialValues, expireAfterMinutes = 60, onRestore } = options
  
  const [values, setValuesState] = useState<T>(initialValues)
  const [hasRestoredData, setHasRestoredData] = useState(false)
  const isInitializing = useRef(true)

  // Charger les données au montage
  const restoreData = useCallback((): boolean => {
    if (typeof window === 'undefined') return false
    
    try {
      const stored = localStorage.getItem(storageKey)
      if (!stored) return false

      const data: StoredFormData<T> = JSON.parse(stored)
      
      // Vérifier l'expiration
      const now = Date.now()
      const expireMs = expireAfterMinutes * 60 * 1000
      
      if (now - data.timestamp > expireMs) {
        localStorage.removeItem(storageKey)
        return false
      }

      // Vérifier que c'est bien pour la même page
      if (data.url && data.url !== window.location.pathname) {
        // On garde quand même si c'est une page de re-auth
        const isAuthPage = /sign-in|sign-up|auth-choice/.test(window.location.pathname)
        if (!isAuthPage) {
          return false
        }
      }

      setValuesState(data.values)
      setHasRestoredData(true)
      onRestore?.(data.values)
      return true
      
    } catch (error) {
      console.error('[usePersistentForm] Error restoring data:', error)
      localStorage.removeItem(storageKey)
      return false
    }
  }, [storageKey, expireAfterMinutes, onRestore])

  // Restauration initiale
  useEffect(() => {
    if (isInitializing.current) {
      isInitializing.current = false
      restoreData()
    }
  }, [restoreData])

  // Sauvegarder à chaque changement
  const setValues = useCallback((newValues: T | ((prev: T) => T)) => {
    setValuesState(prev => {
      const updated = typeof newValues === 'function' 
        ? (newValues as (prev: T) => T)(prev)
        : newValues
      
      // Sauvegarder dans localStorage
      if (typeof window !== 'undefined') {
        try {
          const data: StoredFormData<T> = {
            values: updated,
            timestamp: Date.now(),
            url: window.location.pathname
          }
          localStorage.setItem(storageKey, JSON.stringify(data))
        } catch (error) {
          console.error('[usePersistentForm] Error saving data:', error)
        }
      }
      
      return updated
    })
  }, [storageKey])

  // Helper pour les inputs
  const getInputProps = useCallback((name: keyof T) => ({
    value: values[name] as unknown,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const newValue = e.target.type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked
        : e.target.value
      
      setValues(prev => ({
        ...prev,
        [name]: newValue
      }))
    }
  }), [values, setValues])

  // Effacer le stockage
  const clearStorage = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(storageKey)
    }
    setValuesState(initialValues)
    setHasRestoredData(false)
  }, [storageKey, initialValues])

  return {
    values,
    setValues,
    getInputProps,
    clearStorage,
    hasRestoredData,
    restoreData
  }
}

/**
 * Hook spécifique pour les formulaires de booking avec gestion de session
 */
export function useBookingFormPersistence(
  username: string,
  initialValues: {
    clientName: string
    clientEmail: string
    clientPhone: string
    date: string
    notes: string
  }
) {
  const storageKey = `booking_form_${username}`
  
  const form = usePersistentForm({
    storageKey,
    initialValues,
    expireAfterMinutes: 30, // 30 minutes comme la session Stripe
    onRestore: (values) => {
      console.log('[BookingForm] Données restaurées:', values)
    }
  })

  // Effacer automatiquement après succès
  const clearOnSuccess = useCallback(() => {
    form.clearStorage()
  }, [form])

  return {
    ...form,
    clearOnSuccess
  }
}
