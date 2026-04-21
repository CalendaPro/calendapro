'use client'

import React from 'react'
import { Button } from './Button'

interface PageHeaderProps {
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    icon?: React.ReactNode
  }
  breadcrumbs?: { label: string; href?: string }[]
}

export function PageHeader({ title, description, action, breadcrumbs }: PageHeaderProps) {
  return (
    <div style={{ marginBottom: '28px' }}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: '#64748b', marginBottom: '8px' }}>
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              {index > 0 && <span>/</span>}
              {crumb.href ? (
                <a href={crumb.href} style={{ color: '#64748b', textDecoration: 'none' }}>{crumb.label}</a>
              ) : (
                <span style={{ color: '#0f172a', fontWeight: 500 }}>{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: "'Satoshi', sans-serif", fontSize: '1.35rem', fontWeight: 700, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
            {title}
          </h1>
          {description && (
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '8px 0 0', maxWidth: '600px', lineHeight: '1.5' }}>
              {description}
            </p>
          )}
        </div>
        {action && (
          <Button onClick={action.onClick} variant="primary">
            {action.icon && <span style={{ marginRight: '6px' }}>{action.icon}</span>}
            {action.label}
          </Button>
        )}
      </div>
    </div>
  )
}
