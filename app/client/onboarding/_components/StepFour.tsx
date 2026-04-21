'use client'

import { useState, useRef } from 'react'
import { Camera, Bell, X } from 'lucide-react'
import { useUser } from '@clerk/nextjs'
import type { OnboardingData } from '../page'
import { isValidPhoneE164, normalizePhoneE164 } from '@/lib/phone-validation'

interface StepFourProps {
  phone: string
  avatarUrl: string | null
  smsReminders: boolean
  onChange: (updates: Partial<OnboardingData>) => void
}

export function StepFour({ phone, avatarUrl, smsReminders, onChange }: StepFourProps) {
  const { user } = useUser()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [phoneError, setPhoneError] = useState<string | null>(null)

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '')

    // Limit to 10 digits (French mobile number)
    const limited = digits.slice(0, 10)

    // Format as XX XX XX XX XX
    if (limited.length <= 2) return limited
    if (limited.length <= 4) return `${limited.slice(0, 2)} ${limited.slice(2)}`
    if (limited.length <= 6) return `${limited.slice(0, 2)} ${limited.slice(2, 4)} ${limited.slice(4)}`
    if (limited.length <= 8) return `${limited.slice(0, 2)} ${limited.slice(2, 4)} ${limited.slice(4, 6)} ${limited.slice(6)}`
    return `${limited.slice(0, 2)} ${limited.slice(2, 4)} ${limited.slice(4, 6)} ${limited.slice(6, 8)} ${limited.slice(8)}`
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    onChange({ phone: formatted })

    // Valider seulement si assez de chiffres
    const digits = formatted.replace(/\D/g, '')
    if (digits.length === 10) {
      const normalized = normalizePhoneE164(formatted)
      setPhoneError(
        normalized ? null : 'Format invalide. Ex: 06 12 34 56 78'
      )
    } else {
      setPhoneError(null)
    }
  }

  const handleFileSelect = (file: File | null) => {
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner une image')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('L\'image ne doit pas dépasser 5 Mo')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      onChange({ avatarUrl: reader.result as string })
    }
    reader.readAsDataURL(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    handleFileSelect(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const clearAvatar = () => {
    onChange({ avatarUrl: null })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const firstName = user?.firstName || user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] || 'Utilisateur'

  return (
    <div>
      <h1 className="step-title">Presque terminé !</h1>
      <p className="step-subtitle">Ces infos sont optionnelles et vous aident à mieux réserver</p>

      {/* First Name (readonly from Clerk) */}
      <div className="form-section">
        <p className="form-section-title">Prénom</p>
        <div className="readonly-field">
          <span className="readonly-value">{firstName}</span>
          <span className="readonly-badge">Via votre compte</span>
        </div>
      </div>

      {/* Phone Input */}
      <div className="form-section">
        <p className="form-section-title">Téléphone (optionnel)</p>
        <div className="phone-input-wrapper">
          <span className="phone-prefix">🇫🇷 +33</span>
          <input
            type="tel"
            value={phone}
            onChange={handlePhoneChange}
            placeholder="6 12 34 56 78"
            className="cb-input"
          />
        </div>
        {phoneError && (
          <p style={{
            fontSize: '0.72rem', color: '#ef4444',
            marginTop: '0.3rem', fontFamily: "'DM Sans', sans-serif",
          }}>
            {phoneError}
          </p>
        )}
      </div>

      {/* Photo Upload */}
      <div className="form-section">
        <p className="form-section-title">Photo de profil (optionnel)</p>
        <div className="photo-upload">
          <div
            className={`photo-upload-area ${isDragging ? 'dragging' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            style={isDragging ? { borderColor: '#7c3aed', background: 'rgba(124, 58, 237, 0.05)' } : undefined}
          >
            {avatarUrl ? (
              <>
                <img src={avatarUrl} alt="Avatar" className="photo-upload-preview" />
                <button
                  className="clear-avatar-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    clearAvatar()
                  }}
                  style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: 'rgba(0,0,0,0.5)',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'white',
                  }}
                >
                  <X size={14} />
                </button>
              </>
            ) : (
              <div className="photo-upload-placeholder">
                <Camera size={24} />
                <span className="photo-upload-text">Cliquez ou déposez une photo</span>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
            className="photo-upload-input"
          />
        </div>
      </div>

      {/* SMS Reminders Toggle */}
      <div className="form-section">
        <div className="cb-toggle-container" style={{ borderBottom: 'none' }}>
          <div className="cb-toggle-label">
            <Bell size={20} />
            <div>
              <p className="cb-toggle-text">Recevoir des rappels par SMS</p>
              <p className="cb-toggle-subtext">On vous préviendra 24h avant vos RDV</p>
            </div>
          </div>
          <div
            className={`cb-toggle ${smsReminders ? 'active' : ''}`}
            onClick={() => onChange({ smsReminders: !smsReminders })}
          >
            <div className="cb-toggle-knob" />
          </div>
        </div>
      </div>
    </div>
  )
}
