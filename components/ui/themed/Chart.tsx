'use client'

import React from 'react'
import { useLayout } from '@/lib/layout-provider'
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts'

interface ChartProps {
  data: Array<{ name: string; value: number; [key: string]: string | number }>
  dataKey?: string
  height?: number
  showGrid?: boolean
  showAxes?: boolean
  showTooltip?: boolean
  color?: string
  secondColor?: string
  fillOpacity?: number
  strokeWidth?: number
}

export function Chart({
  data,
  dataKey = 'value',
  height = 300,
  showGrid = true,
  showAxes = true,
  showTooltip = true,
  color,
  secondColor,
  fillOpacity,
  strokeWidth = 2,
}: ChartProps) {
  const { dashboardLayout: layoutId } = useLayout()

  const chartColor = color || '#7c3aed'
  const chartSecondColor = secondColor || '#ec4899'

  // PRO - AreaChart style financier (angles droits, pas de courbes douces)
  if (layoutId === 'pro') {
    return (
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="proGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0f172a" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#0f172a" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis 
              dataKey="name" 
              axisLine={{ stroke: '#e2e8f0' }}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 11, fontFamily: '"IBM Plex Mono", monospace' }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 11, fontFamily: '"IBM Plex Mono", monospace' }}
              tickFormatter={(value) => value.toLocaleString()}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                border: 'none',
                borderRadius: 0,
                fontFamily: '"IBM Plex Mono", monospace',
                fontSize: 12,
              }}
              labelStyle={{ color: '#94a3b8' }}
              itemStyle={{ color: '#fff' }}
              formatter={(value) => [String(value), '']}
            />
            <Area
              type="linear" // Angles droits, pas de courbes
              dataKey={dataKey}
              stroke="#0f172a"
              strokeWidth={1.5}
              fill="url(#proGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    )
  }

  // MINIMALIST - Juste une ligne 1px, zéro fill, zéro grid
  if (layoutId === 'minimalist') {
    return (
      <div style={{ width: '100%', height: Math.min(height, 200) }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke="#000000"
              strokeWidth={1}
              dot={false}
              activeDot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    )
  }

  // COMPACT - Sparkline miniaturisé
  if (layoutId === 'compact') {
    return (
      <div style={{ width: '100%', height: 120 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <defs>
              <linearGradient id="compactGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartColor} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={chartColor} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={chartColor}
              strokeWidth={1.5}
              fill="url(#compactGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    )
  }

  // DARK PRO - AreaChart avec fill dégradé néon, glow effect
  if (layoutId === 'dark-pro') {
    return (
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="darkProGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis 
              dataKey="name" 
              axisLine={{ stroke: '#374151' }}
              tickLine={false}
              tick={{ fill: '#6b7280', fontSize: 11, fontFamily: '"Space Grotesk", sans-serif' }}
            />
            <YAxis 
              axisLine={{ stroke: '#374151' }}
              tickLine={false}
              tick={{ fill: '#6b7280', fontSize: 11, fontFamily: '"Space Grotesk", sans-serif' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0a0a0a',
                border: '1px solid rgba(124,58,237,0.3)',
                borderRadius: 8,
                fontFamily: '"Space Grotesk", sans-serif',
              }}
              labelStyle={{ color: '#9ca3af' }}
              itemStyle={{ color: '#7c3aed' }}
            />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke="#7c3aed"
              strokeWidth={2}
              fill="url(#darkProGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    )
  }

  // MODERN - Défaut avec dégradés et animations fluides
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="modernGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={chartColor} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={chartColor} stopOpacity={0}/>
            </linearGradient>
          </defs>
          {showGrid && (
            <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
          )}
          {showAxes && (
            <>
              <XAxis 
                dataKey="name" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#78716c', fontSize: 12, fontFamily: '"DM Sans", sans-serif' }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#78716c', fontSize: 12, fontFamily: '"DM Sans", sans-serif' }}
              />
            </>
          )}
          {showTooltip && (
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e7e5e4',
                borderRadius: 8,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                fontFamily: '"DM Sans", sans-serif',
              }}
            />
          )}
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={chartColor}
            strokeWidth={strokeWidth}
            fill="url(#modernGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
