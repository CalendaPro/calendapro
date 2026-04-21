'use client'

import React, { forwardRef } from 'react'
const INPUT_FOCUS_CSS = `
  .themed-input:focus { border-color: #7c3aed; box-shadow: 0 0 0 3px rgba(124,58,237,0.1); }
  .themed-input::placeholder { color: #9ca3af; }
`

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, style, className, ...props }, ref) => {
    return (
      <>
        <style>{INPUT_FOCUS_CSS}</style>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }} className={className}>
          {label && (
            <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.72rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {label}
            </label>
          )}
          <input
            ref={ref}
            className="themed-input"
            style={{
              borderRadius: '12px',
              border: '2px solid #e5e7eb',
              background: '#ffffff',
              color: '#0f172a',
              padding: '12px 16px',
              fontSize: '0.9rem',
              fontFamily: "'DM Sans', sans-serif",
              transition: 'all 0.2s ease',
              width: '100%',
              outline: 'none',
              ...style,
            }}
            {...props}
          />
          {error && <span style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '4px' }}>{error}</span>}
        </div>
      </>
    )
  }
)

Input.displayName = 'Input'
