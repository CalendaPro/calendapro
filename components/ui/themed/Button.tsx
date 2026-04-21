'use client'

import React from 'react'
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

const HOVER_CSS = `
  .themed-button:hover { transform: translateY(-1px); box-shadow: 0 8px 20px rgba(124,58,237,0.4); }
  .themed-button-secondary:hover { background: rgba(124,58,237,0.08) !important; }
`

export function Button({ 
  variant = 'primary', 
  size = 'md',
  children, 
  style,
  disabled,
  ...props 
}: ButtonProps) {
  const base: React.CSSProperties = {
    borderRadius: '9999px',
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    transition: 'all 0.2s ease',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    border: 'none',
  }

  const variants: Record<string, React.CSSProperties> = {
    primary:   { background: 'linear-gradient(135deg, #7c3aed, #ec4899)', color: '#ffffff', padding: '10px 24px', boxShadow: '0 4px 12px rgba(124,58,237,0.35)' },
    secondary: { background: 'transparent', color: '#7c3aed', border: '2px solid #7c3aed', padding: '10px 24px' },
    outline:   { background: 'transparent', color: '#7c3aed', border: '2px solid #7c3aed', padding: '10px 24px' },
    ghost:     { background: 'transparent', color: '#0f172a', border: 'none', padding: '10px 16px' },
  }

  const sizes: Record<string, React.CSSProperties> = {
    sm: { padding: '4px 14px', fontSize: '0.75rem' },
    md: {},
    lg: { padding: '14px 28px', fontSize: '1rem' },
  }

  const cls = variant === 'secondary' || variant === 'outline' ? 'themed-button-secondary' : 'themed-button'

  return (
    <>
      <style>{HOVER_CSS}</style>
      <button
        className={cls}
        style={{ ...base, ...variants[variant], ...sizes[size], ...style }}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    </>
  )
}
