'use client'

import React from 'react'
import { useLayout } from '@/lib/layout-provider'

interface TableProps {
  headers: Array<{ key: string; label: string; sortable?: boolean; align?: 'left' | 'center' | 'right' }>
  rows: Array<Record<string, React.ReactNode>>
  onSort?: (key: string, direction: 'asc' | 'desc') => void
  sortKey?: string
  sortDirection?: 'asc' | 'desc'
  selectable?: boolean
  selectedRows?: string[]
  onSelectRow?: (id: string) => void
}

export function Table({
  headers,
  rows,
  onSort,
  sortKey,
  sortDirection,
  selectable = false,
  selectedRows = [],
  onSelectRow,
}: TableProps) {
  const { dashboardLayout: layoutId } = useLayout()

  const handleSort = (key: string) => {
    if (!onSort) return
    const newDirection = sortKey === key && sortDirection === 'asc' ? 'desc' : 'asc'
    onSort(key, newDirection)
  }

  // PRO - Style tableur Excel/Bloomberg
  if (layoutId === 'pro') {
    return (
      <div style={{ overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: '"IBM Plex Mono", monospace' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              {selectable && (
                <th style={{ padding: '12px 16px', width: 40 }}>
                  <input type="checkbox" disabled style={{ cursor: 'pointer' }} />
                </th>
              )}
              {headers.map((header) => (
                <th
                  key={header.key}
                  onClick={() => header.sortable && handleSort(header.key)}
                  style={{
                    padding: '12px 16px',
                    textAlign: header.align || 'left',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: '#475569',
                    cursor: header.sortable ? 'pointer' : 'default',
                    whiteSpace: 'nowrap',
                    borderBottom: '1px solid #e2e8f0',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: header.align === 'right' ? 'flex-end' : 'flex-start', gap: 4 }}>
                    {header.label}
                    {header.sortable && (
                      <span style={{ fontSize: '0.6rem', color: '#94a3b8' }}>
                        {sortKey === header.key ? (sortDirection === 'asc' ? '▲' : '▼') : '▲▼'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                style={{
                  borderBottom: '1px solid #e2e8f0',
                  backgroundColor: rowIndex % 2 === 0 ? '#ffffff' : '#f8fafc',
                }}
              >
                {selectable && (
                  <td style={{ padding: '8px 16px' }}>
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(String(row.id))}
                      onChange={() => onSelectRow?.(String(row.id))}
                      style={{ cursor: 'pointer' }}
                    />
                  </td>
                )}
                {headers.map((header) => (
                  <td
                    key={header.key}
                    style={{
                      padding: '8px 16px',
                      textAlign: header.align || 'left',
                      fontSize: '0.8rem',
                      color: '#0f172a',
                      fontWeight: 400,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {row[header.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  // MINIMALIST - Style éditorial
  if (layoutId === 'minimalist') {
    return (
      <div style={{ overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: '"DM Sans", sans-serif' }}>
          <thead>
            <tr>
              {headers.map((header) => (
                <th
                  key={header.key}
                  onClick={() => header.sortable && handleSort(header.key)}
                  style={{
                    padding: '24px 0',
                    textAlign: header.align || 'left',
                    fontSize: '0.65rem',
                    fontWeight: 300,
                    textTransform: 'uppercase',
                    letterSpacing: '0.15em',
                    color: '#374151',
                    cursor: header.sortable ? 'pointer' : 'default',
                    borderBottom: '1px solid #f0f0f0',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {header.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                style={{
                  borderBottom: '1px solid #f0f0f0',
                }}
              >
                {headers.map((header) => (
                  <td
                    key={header.key}
                    style={{
                      padding: '24px 0',
                      textAlign: header.align || 'left',
                      fontSize: '0.9rem',
                      color: '#000000',
                      fontWeight: 400,
                    }}
                  >
                    {row[header.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  // COMPACT - Ultra-dense
  if (layoutId === 'compact') {
    return (
      <div style={{ overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: '"Inter", sans-serif', fontSize: '0.75rem' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
            <tr style={{ backgroundColor: '#f9fafb' }}>
              {selectable && (
                <th style={{ padding: '4px 8px', width: 32 }}>
                  <input type="checkbox" style={{ width: 14, height: 14 }} />
                </th>
              )}
              {headers.map((header) => (
                <th
                  key={header.key}
                  onClick={() => header.sortable && handleSort(header.key)}
                  style={{
                    padding: '4px 8px',
                    textAlign: header.align || 'left',
                    fontSize: '0.65rem',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.02em',
                    color: '#4b5563',
                    cursor: header.sortable ? 'pointer' : 'default',
                    whiteSpace: 'nowrap',
                    borderBottom: '1px solid #e5e7eb',
                  }}
                >
                  {header.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                style={{
                  borderBottom: '1px solid #f3f4f6',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f9fafb'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                {selectable && (
                  <td style={{ padding: '4px 8px' }}>
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(String(row.id))}
                      onChange={() => onSelectRow?.(String(row.id))}
                      style={{ width: 14, height: 14, cursor: 'pointer' }}
                    />
                  </td>
                )}
                {headers.map((header) => (
                  <td
                    key={header.key}
                    style={{
                      padding: '4px 8px',
                      textAlign: header.align || 'left',
                      color: '#1f2937',
                      fontWeight: 400,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {row[header.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  // DARK PRO - Style néon
  if (layoutId === 'dark-pro') {
    return (
      <div style={{ overflow: 'auto', backgroundColor: '#0a0a0a', borderRadius: 8 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: '"Space Grotesk", sans-serif' }}>
          <thead>
            <tr style={{ backgroundColor: '#0f0f0f', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {headers.map((header) => (
                <th
                  key={header.key}
                  onClick={() => header.sortable && handleSort(header.key)}
                  style={{
                    padding: '16px 20px',
                    textAlign: header.align || 'left',
                    fontSize: '0.7rem',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: '#9ca3af',
                    cursor: header.sortable ? 'pointer' : 'default',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {header.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                style={{
                  backgroundColor: '#0a0a0a',
                  borderBottom: '1px solid rgba(255,255,255,0.03)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(124,58,237,0.06)'
                  e.currentTarget.style.borderLeft = '2px solid #7c3aed'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#0a0a0a'
                  e.currentTarget.style.borderLeft = 'none'
                }}
              >
                {headers.map((header) => (
                  <td
                    key={header.key}
                    style={{
                      padding: '16px 20px',
                      textAlign: header.align || 'left',
                      fontSize: '0.85rem',
                      color: '#e5e7eb',
                      fontWeight: 400,
                    }}
                  >
                    {row[header.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  // MODERN - Défaut
  return (
    <div style={{ overflow: 'auto', borderRadius: 8, border: '1px solid #e7e5e4' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: '"DM Sans", sans-serif' }}>
        <thead style={{ backgroundColor: '#fafaf9' }}>
          <tr>
            {headers.map((header) => (
              <th
                key={header.key}
                onClick={() => header.sortable && handleSort(header.key)}
                style={{
                  padding: '16px 20px',
                  textAlign: header.align || 'left',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#57534e',
                  cursor: header.sortable ? 'pointer' : 'default',
                  borderBottom: '1px solid #e7e5e4',
                  whiteSpace: 'nowrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {header.label}
                  {header.sortable && sortKey === header.key && (
                    <span style={{ fontSize: '0.7rem' }}>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              style={{ borderBottom: '1px solid #f5f5f4', transition: 'background-color 0.15s ease' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fafaf9' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
            >
              {headers.map((header) => (
                <td
                  key={header.key}
                  style={{ padding: '16px 20px', textAlign: header.align || 'left', fontSize: '0.875rem', color: '#292524' }}
                >
                  {row[header.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
