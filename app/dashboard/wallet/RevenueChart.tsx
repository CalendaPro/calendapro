'use client'

import { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

type Period = 'week' | 'month' | 'year'

interface Transaction {
  id: string
  status: string
  net_amount: number
  created_at: string
}

function fmtEur(cents: number) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(cents / 100)
}

interface RevenueChartProps {
  transactions: Transaction[]
  period: Period
  onPeriodChange: (p: Period) => void
}

export default function RevenueChart({ transactions, period, onPeriodChange }: RevenueChartProps) {
  const data = useMemo(() => {
    const now = new Date()
    const succeeded = transactions.filter(t => t.status === 'succeeded')

    if (period === 'week') {
      const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now)
        d.setDate(d.getDate() - (6 - i))
        return d
      })
      return days.map(d => {
        const dayStr = d.toISOString().split('T')[0]
        const dayTx = succeeded.filter(t => t.created_at.startsWith(dayStr))
        const net = dayTx.reduce((sum, t) => sum + t.net_amount, 0)
        return {
          label: d.toLocaleDateString('fr-FR', { weekday: 'short' }),
          net: net / 100,
        }
      })
    }

    if (period === 'month') {
      return Array.from({ length: 4 }, (_, i) => {
        const weekStart = new Date(now)
        weekStart.setDate(weekStart.getDate() - (3 - i) * 7)
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekEnd.getDate() + 7)
        const weekTx = succeeded.filter(t => {
          const d = new Date(t.created_at)
          return d >= weekStart && d < weekEnd
        })
        const net = weekTx.reduce((sum, t) => sum + t.net_amount, 0)
        return {
          label: `S${i + 1}`,
          net: net / 100,
        }
      })
    }

    return Array.from({ length: 12 }, (_, i) => {
      const m = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1)
      const monthTx = succeeded.filter(t => {
        const d = new Date(t.created_at)
        return d.getMonth() === m.getMonth() && d.getFullYear() === m.getFullYear()
      })
      const net = monthTx.reduce((sum, t) => sum + t.net_amount, 0)
      return {
        label: m.toLocaleDateString('fr-FR', { month: 'short' }),
        net: net / 100,
      }
    })
  }, [transactions, period])

  const total = data.reduce((sum, d) => sum + d.net, 0)

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.55)',
        backdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.35)',
        borderRadius: 20,
        padding: '24px',
        marginBottom: 24,
        boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--dl-text-primary)', margin: 0, fontFamily: "'Cabinet Grotesk', sans-serif" }}>
            Évolution des revenus
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--dl-text-muted)', margin: '4px 0 0', fontFamily: "'DM Sans', sans-serif" }}>
            Total: <strong style={{ color: '#059669' }}>{fmtEur(total * 100)}</strong>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['week', 'month', 'year'] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => onPeriodChange(p)}
              disabled={p === period}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                border: '1px solid var(--dl-card-border)',
                background: p === period ? '#7c3aed' : 'transparent',
                color: p === period ? 'white' : 'var(--dl-text-muted)',
                fontSize: '0.72rem',
                fontWeight: 600,
                cursor: p === period ? 'default' : 'pointer',
                fontFamily: "'DM Sans', sans-serif",
                textTransform: 'capitalize',
              }}
            >
              {p === 'week' ? '7j' : p === 'month' ? '4s' : '12m'}
            </button>
          ))}
        </div>
      </div>
      <div style={{ height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(124,58,237,0.1)" />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} tickFormatter={v => `${v}€`} />
            <Tooltip
              contentStyle={{
                background: 'white',
                border: '1px solid rgba(124,58,237,0.2)',
                borderRadius: 12,
                fontSize: 12,
              }}
              formatter={(value) => {
                if (typeof value === 'number') {
                  return [`${value.toFixed(2)} €`, 'Net']
                }
                return [String(value), 'Net']
              }}
            />
            <Line
              type="monotone"
              dataKey="net"
              stroke="#7c3aed"
              strokeWidth={2}
              dot={{ fill: '#7c3aed', strokeWidth: 0, r: 3 }}
              activeDot={{ r: 5, fill: '#7c3aed' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
