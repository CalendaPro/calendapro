'use client'

import { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getSourceColor, formatSourceLabel } from '@/lib/tracking/sources'

interface ChannelData {
  sourceChannel: string
  clientCount: number
  bookingCount: number
  totalRevenue: number
  averageBasket: number
  retentionRate: number
  percentage: number
  emoji: string
  label: string
}

interface AcquisitionChartProps {
  channels: ChannelData[]
  totalClients: number
  totalRevenue: number
}

export function AcquisitionChart({ channels, totalClients, totalRevenue }: AcquisitionChartProps) {
  // Préparer les données pour le chart
  const chartData = useMemo(() => {
    return channels.map((channel) => ({
      name: channel.label,
      value: channel.clientCount,
      percentage: channel.percentage,
      revenue: channel.totalRevenue,
      color: getSourceColor(channel.sourceChannel),
      emoji: channel.emoji,
    }))
  }, [channels])

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="rounded-lg border bg-white p-3 shadow-lg">
          <p className="font-semibold">{data.name}</p>
          <p className="text-sm text-gray-600">{data.percentage}% des clients</p>
          <p className="text-sm font-medium">{data.value} clients</p>
          <p className="text-sm text-green-600">€{data.revenue.toFixed(2)} générés</p>
        </div>
      )
    }
    return null
  }

  if (channels.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">📊 Canaux d'Acquisition</CardTitle>
        </CardHeader>
        <CardContent className="flex h-64 items-center justify-center">
          <p className="text-gray-500">Aucune donnée disponible</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          📊 Canaux d'Acquisition
          <span className="text-sm font-normal text-gray-500">
            ({totalClients} clients, €{totalRevenue.toFixed(2)})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="45%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                animationBegin={0}
                animationDuration={800}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                formatter={(value: string, entry: any) => (
                  <span style={{ color: entry.color }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Stats rapides */}
        <div className="mt-4 grid grid-cols-2 gap-4 border-t pt-4">
          <div className="text-center">
            <p className="text-2xl font-bold">{totalClients}</p>
            <p className="text-xs text-gray-500">Clients total</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">€{totalRevenue.toFixed(0)}</p>
            <p className="text-xs text-gray-500">Revenu total</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
