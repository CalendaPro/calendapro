'use client'

import React from 'react'
import { motion } from 'framer-motion'

export type DaySchedule = { start: string; end: string; closed: boolean }
export type WeekSchedule = Record<string, DaySchedule>
export type ScheduleException = { date: string; label: string; closed: boolean }

export const DEFAULT_SCHEDULE: WeekSchedule = {
  lundi:     { start: '09:00', end: '19:00', closed: false },
  mardi:     { start: '09:00', end: '19:00', closed: false },
  mercredi:  { start: '09:00', end: '19:00', closed: false },
  jeudi:     { start: '09:00', end: '19:00', closed: false },
  vendredi:  { start: '09:00', end: '19:00', closed: false },
  samedi:    { start: '10:00', end: '18:00', closed: false },
  dimanche:  { start: '00:00', end: '00:00', closed: true  },
}

const DAYS = ['lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche'] as const
const DAY_LABELS: Record<string, string> = {
  lundi: 'Lun', mardi: 'Mar', mercredi: 'Mer', jeudi: 'Jeu',
  vendredi: 'Ven', samedi: 'Sam', dimanche: 'Dim',
}

const PRESETS = [
  { label: '9h–19h lun–ven', apply: (s: WeekSchedule): WeekSchedule => {
    const result = { ...s }
    DAYS.forEach(d => {
      result[d] = d === 'dimanche'
        ? { start: '00:00', end: '00:00', closed: true }
        : d === 'samedi'
        ? { start: '10:00', end: '18:00', closed: false }
        : { start: '09:00', end: '19:00', closed: false }
    })
    return result
  }},
  { label: '7j/7 10h–20h', apply: (s: WeekSchedule): WeekSchedule => {
    const result = { ...s }
    DAYS.forEach(d => { result[d] = { start: '10:00', end: '20:00', closed: false } })
    return result
  }},
  { label: 'Tout fermé', apply: (s: WeekSchedule): WeekSchedule => {
    const result = { ...s }
    DAYS.forEach(d => { result[d] = { start: '00:00', end: '00:00', closed: true } })
    return result
  }},
]

interface Props {
  value: WeekSchedule
  onChange: (v: WeekSchedule) => void
  exceptions: ScheduleException[]
  onExceptionsChange: (v: ScheduleException[]) => void
  accentColor: string
}

export default function ScheduleEditor({ value, onChange, exceptions, onExceptionsChange, accentColor }: Props) {
  const update = (day: string, field: keyof DaySchedule, v: string | boolean) => {
    onChange({ ...value, [day]: { ...value[day], [field]: v } })
  }

  const removeException = (i: number) => {
    onExceptionsChange(exceptions.filter((_, idx) => idx !== i))
  }

  const addException = () => {
    onExceptionsChange([
      ...exceptions,
      { date: new Date().toISOString().split('T')[0] ?? '', label: 'Fermeture exceptionnelle', closed: true },
    ])
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Presets */}
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 6 }}>
        {PRESETS.map(p => (
          <button
            key={p.label}
            type="button"
            onClick={() => onChange(p.apply(value))}
            style={{ padding: '3px 9px', borderRadius: 999, border: `1px solid rgba(255,255,255,0.15)`, background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.7)', fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif' }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Days */}
      {DAYS.map(day => {
        const d = value[day] ?? { start: '09:00', end: '19:00', closed: false }
        return (
          <div key={day} style={{ display: 'grid', gridTemplateColumns: '36px 28px 1fr', alignItems: 'center', gap: 6, padding: '3px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: d.closed ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.7)', fontFamily: 'DM Sans,sans-serif' }}>
              {DAY_LABELS[day]}
            </span>
            <button
              type="button"
              onClick={() => update(day, 'closed', !d.closed)}
              style={{ width: 24, height: 14, borderRadius: 99, background: d.closed ? 'rgba(255,255,255,0.12)' : accentColor, border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}
            >
              <div style={{ position: 'absolute', top: 2, left: d.closed ? 2 : 'calc(100% - 12px)', width: 10, height: 10, borderRadius: '50%', background: 'white', transition: 'left 0.2s' }} />
            </button>
            {d.closed ? (
              <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.28)', fontFamily: 'DM Sans,sans-serif' }}>Fermé</span>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <input
                  type="time"
                  value={d.start}
                  onChange={e => update(day, 'start', e.target.value)}
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, color: 'rgba(255,255,255,0.8)', padding: '2px 5px', fontSize: '0.68rem', fontFamily: 'DM Sans,sans-serif', width: 66 }}
                />
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.65rem' }}>–</span>
                <input
                  type="time"
                  value={d.end}
                  onChange={e => update(day, 'end', e.target.value)}
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, color: 'rgba(255,255,255,0.8)', padding: '2px 5px', fontSize: '0.68rem', fontFamily: 'DM Sans,sans-serif', width: 66 }}
                />
              </div>
            )}
          </div>
        )
      })}

      {/* Exceptions */}
      {exceptions.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)', marginBottom: 5, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'DM Sans,sans-serif' }}>Exceptions</div>
          {exceptions.map((ex, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 5, marginBottom: 4, alignItems: 'center' }}>
              <input
                type="date"
                value={ex.date}
                onChange={e => {
                  const updated = [...exceptions]
                  if (updated[i]) updated[i] = { ...updated[i]!, date: e.target.value }
                  onExceptionsChange(updated)
                }}
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, color: 'rgba(255,255,255,0.7)', padding: '3px 6px', fontSize: '0.65rem', fontFamily: 'DM Sans,sans-serif' }}
              />
              <input
                value={ex.label}
                onChange={e => {
                  const updated = [...exceptions]
                  if (updated[i]) updated[i] = { ...updated[i]!, label: e.target.value }
                  onExceptionsChange(updated)
                }}
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, color: 'rgba(255,255,255,0.7)', padding: '3px 6px', fontSize: '0.65rem', fontFamily: 'DM Sans,sans-serif' }}
              />
              <motion.button type="button" whileTap={{ scale: 0.9 }} onClick={() => removeException(i)}
                style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', cursor: 'pointer', fontSize: '0.7rem', display: 'grid', placeItems: 'center' }}
              >×</motion.button>
            </div>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={addException}
        style={{ marginTop: 6, padding: '4px 10px', borderRadius: 8, border: `1px dashed rgba(255,255,255,0.2)`, background: 'transparent', color: 'rgba(255,255,255,0.45)', fontSize: '0.68rem', cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', alignSelf: 'flex-start' }}
      >
        + Exception (fériés, vacances)
      </button>
    </div>
  )
}
