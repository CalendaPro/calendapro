'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'

export interface LocationData {
  address: string
  lat: number | null
  lng: number | null
  phone: string
  email: string
}

export const DEFAULT_LOCATION: LocationData = {
  address: '',
  lat: null,
  lng: null,
  phone: '',
  email: '',
}

interface Props {
  value: LocationData
  onChange: (v: LocationData) => void
  accentColor: string
}

export default function LocationEditor({ value, onChange, accentColor }: Props) {
  const [geoLoading, setGeoLoading] = useState(false)
  const [geocodeLoading, setGeocodeLoading] = useState(false)

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 8,
    color: 'rgba(255,255,255,0.85)',
    padding: '6px 10px',
    fontSize: '0.76rem',
    fontFamily: 'DM Sans,sans-serif',
    outline: 'none',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '0.62rem',
    fontWeight: 700,
    color: 'rgba(255,255,255,0.38)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: 4,
    display: 'block',
    fontFamily: 'DM Sans,sans-serif',
  }

  const useGeolocation = () => {
    if (!navigator.geolocation) return
    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        onChange({ ...value, lat: pos.coords.latitude, lng: pos.coords.longitude })
        setGeoLoading(false)
      },
      () => setGeoLoading(false)
    )
  }

  const geocodeAddress = async () => {
    if (!value.address.trim()) return
    setGeocodeLoading(true)
    try {
      const res = await fetch(
        `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(value.address)}&limit=1`
      )
      const data = (await res.json()) as { features?: Array<{ geometry?: { coordinates?: [number, number] } }> }
      const coords = data.features?.[0]?.geometry?.coordinates
      if (coords) {
        onChange({ ...value, lat: coords[1] ?? null, lng: coords[0] ?? null })
      }
    } catch { /* ignore */ }
    setGeocodeLoading(false)
  }

  const hasCoords = value.lat !== null && value.lng !== null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Address */}
      <div>
        <label style={labelStyle}>Adresse</label>
        <div style={{ display: 'flex', gap: 5 }}>
          <input
            style={{ ...inputStyle, flex: 1 }}
            placeholder="123 rue Exemple, 75001 Paris"
            value={value.address}
            onChange={e => onChange({ ...value, address: e.target.value })}
          />
          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={() => void geocodeAddress()}
            disabled={geocodeLoading || !value.address.trim()}
            title="Géocoder l'adresse"
            style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${accentColor}44`, background: `${accentColor}18`, color: accentColor, cursor: 'pointer', display: 'grid', placeItems: 'center', flexShrink: 0, opacity: (!value.address.trim() || geocodeLoading) ? 0.4 : 1 }}
          >
            {geocodeLoading
              ? <span style={{ width: 12, height: 12, borderRadius: '50%', border: `2px solid ${accentColor}30`, borderTopColor: accentColor, display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
              : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            }
          </motion.button>
        </div>
        {hasCoords && (
          <div style={{ marginTop: 4, fontSize: '0.62rem', color: '#10b981', fontFamily: 'DM Sans,sans-serif' }}>
            ✓ {value.lat?.toFixed(4)}, {value.lng?.toFixed(4)}
          </div>
        )}
      </div>

      {/* Geoloc button */}
      <motion.button
        type="button"
        whileTap={{ scale: 0.95 }}
        onClick={useGeolocation}
        disabled={geoLoading}
        style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid rgba(255,255,255,0.15)`, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.65)', fontSize: '0.71rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'DM Sans,sans-serif', alignSelf: 'flex-start' }}
      >
        📍 {geoLoading ? 'Localisation…' : 'Utiliser ma géolocalisation'}
      </motion.button>

      {/* Mini map link */}
      {hasCoords && (
        <a
          href={`https://maps.google.com/?q=${value.lat},${value.lng}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: '0.7rem', color: accentColor, fontFamily: 'DM Sans,sans-serif', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5 }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          Voir sur Google Maps
        </a>
      )}

      {/* Phone */}
      <div>
        <label style={labelStyle}>Téléphone</label>
        <input
          style={inputStyle}
          type="tel"
          placeholder="+33 6 12 34 56 78"
          value={value.phone}
          onChange={e => onChange({ ...value, phone: e.target.value })}
        />
      </div>

      {/* Email */}
      <div>
        <label style={labelStyle}>Email de contact</label>
        <input
          style={inputStyle}
          type="email"
          placeholder="contact@exemple.com"
          value={value.email}
          onChange={e => onChange({ ...value, email: e.target.value })}
        />
      </div>
    </div>
  )
}
