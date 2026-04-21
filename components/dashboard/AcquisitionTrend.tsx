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
  Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getSourceColor, TRACKING_SOURCES } from '@/lib/tracking/sources'

interface TrendData {
  date: string
  sourceChannel: string
  clientCount: number
  revenue: number
  newClients: number
}

interface AcquisitionTrendProps {
  trends: TrendData[]
  days: number
}

export function AcquisitionTrend({ trends, days }: AcquisitionTrendProps) {
  // Formater les données pour le chart
  const chartData = useMemo(() => {
    // Grouper par date
    const grouped = trends.reduce((acc, trend) => {
      const date = new Date(trend.date).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
      })

      if (!acc[date]) {
        acc[date] = { date }
      }

      acc[date][trend.sourceChannel] = trend.clientCount
      return acc
    }, {} as Record<string, any>)

    return Object.values(grouped).sort((a: any, b: any) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime()
    })
  }, [trends])

  // Détecter les sources uniques
  const uniqueSources = useMemo(() => {
    const sources = new Set(trends.map((t) => t.sourceChannel))
    return Array.from(sources)
  }, [trends])

  // Calculer les tendances (↑ ↓ →)
  const sourceTrends = useMemo(() => {
    const result: Record<string, { direction: string; change: number }> = {}

    uniqueSources.forEach((source) => {
      const sourceTrends = trends.filter((t) => t.sourceChannel === source)
      if (sourceTrends.length < 2) {
        result[source] = { direction: '→', change: 0 }
        return
      }

      // Comparer la première moitié vs la deuxième moitié
      const mid = Math.floor(sourceTrends.length / 2)
      const firstHalf = sourceTrends.slice(0, mid).reduce((sum, t) => sum + t.clientCount, 0)
      const secondHalf = sourceTrends.slice(mid).reduce((sum, t) => sum + t.clientCount, 0)

      if (firstHalf === 0) {
        result[source] = { direction: '↑', change: 100 }
      } else {
        const change = Math.round(((secondHalf - firstHalf) / firstHalf) * 100)
        result[source] = {
          direction: change > 5 ? '↑' : change < -5 ? '↓' : '→',
          change: Math.abs(change),
        }
      }
    })

    return result
  }, [trends, uniqueSources])

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-white p-3 shadow-lg">
          <p className="font-semibold mb-2">{label}</p>
          {payload.map((entry: any) => (
            <div key={entry.dataKey} className="flex items-center gap-2 text-sm">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span>
                {TRACKING_SOURCES[entry.dataKey]?.emoji} {entry.name}: {entry.value} clients
              </span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  if (trends.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">📈 Tendances d'Acquisition</CardTitle>
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
          📈 Tendances d'Acquisition
          <span className="text-sm font-normal text-gray-500">({days} derniers jours)</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="line" />

              {uniqueSources.map((source) => (
                <Line
                  key={source}
                  type="monotone"
                  dataKey={source}
                  name={TRACKING_SOURCES[source]?.name || source}
                  stroke={getSourceColor(source)}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                  animationDuration={1000}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Indicateurs de tendance */}
        <div className="mt-4 flex flex-wrap gap-3 border-t pt-4">
          {uniqueSources.map((source) => {
            const trend = sourceTrends[source]
            const color = trend.direction === '↑' ? 'text-green-600' : trend.direction === '↓' ? 'text-red-600' : 'text-gray-600'
            return (
              <div key={source} className="flex items-center gap-2 text-sm">
                <span>{TRACKING_SOURCES[source]?.emoji}</span>
                <span className="font-medium">{TRACKING_SOURCES[source]?.name}</span>
                <span className={`font-bold ${color}`}>
                  {trend.direction} {trend.change > 0 && `${trend.change}%`}
                </span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
