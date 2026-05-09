'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Minus, Users, ShoppingCart, Euro, Repeat } from 'lucide-react'
import { formatSourceLabel, getSourceEmoji, TRACKING_SOURCES } from '@/lib/tracking/sources'
import { cn } from '@/lib/utils'

interface ChannelValue {
  sourceChannel: string
  clientCount: number
  bookingCount: number
  totalRevenue: number
  averageBasket: number
  retentionRate: number
  percentage: number
  emoji: string
  label: string
  trend: 'up' | 'down' | 'stable'
  changePercent: number
}

interface ClientValueAnalysisProps {
  channels: ChannelValue[]
  totalRevenue: number
}

export function ClientValueAnalysis({ channels, totalRevenue }: ClientValueAnalysisProps) {
  // Trier par revenu total décroissant
  const sortedChannels = useMemo(() => {
    return [...channels].sort((a, b) => b.totalRevenue - a.totalRevenue)
  }, [channels])

  // Calculer le meilleur canal pour chaque métrique
  const bestMetrics = useMemo(() => {
    if (channels.length === 0) return null

    return {
      revenue: channels.reduce((max, c) => (c.totalRevenue > max.totalRevenue ? c : max)),
      basket: channels.reduce((max, c) => (c.averageBasket > max.averageBasket ? c : max)),
      retention: channels.reduce((max, c) => (c.retentionRate > max.retentionRate ? c : max)),
    }
  }, [channels])

  // Fonction pour afficher la tendance
  const TrendIndicator = ({ trend, change }: { trend: string; change: number }) => {
    if (trend === 'up') {
      return (
        <span className="flex items-center gap-1 text-green-600 text-xs">
          <TrendingUp size={14} />
          +{change}%
        </span>
      )
    }
    if (trend === 'down') {
      return (
        <span className="flex items-center gap-1 text-red-600 text-xs">
          <TrendingDown size={14} />
          -{change}%
        </span>
      )
    }
    return (
      <span className="flex items-center gap-1 text-gray-500 text-xs">
        <Minus size={14} />
        {change > 0 ? `${change}%` : 'stable'}
      </span>
    )
  }

  if (channels.length === 0) {
    return (
      <Card>
        <CardHeader>
 <CardTitle className="text-lg"> Valeur Clients par Source</CardTitle>
        </CardHeader>
        <CardContent className="flex h-64 items-center justify-center">
          <p className="text-gray-500">Aucune donnée disponible</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
 Valeur Clients par Source
          <span className="text-sm font-normal text-gray-500">
            (LTV = Lifetime Value)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Table header */}
        <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-gray-50 text-xs font-medium text-gray-600 uppercase tracking-wider">
          <div className="col-span-3">Canal</div>
          <div className="col-span-2 text-center">Clients</div>
          <div className="col-span-2 text-center">Panier Moy.</div>
          <div className="col-span-2 text-center">Revenu Total</div>
          <div className="col-span-2 text-center">Rétention</div>
          <div className="col-span-1 text-center">Trend</div>
        </div>

        {/* Table rows */}
        <div className="divide-y divide-gray-100">
          {sortedChannels.map((channel, index) => {
            const isTop = index === 0
            const isBestRevenue = bestMetrics && channel.sourceChannel === bestMetrics.revenue.sourceChannel
            const isBestBasket = bestMetrics && channel.sourceChannel === bestMetrics.basket.sourceChannel
            const isBestRetention = bestMetrics && channel.sourceChannel === bestMetrics.retention.sourceChannel

            return (
              <div
                key={channel.sourceChannel}
                className={cn(
                  'grid grid-cols-12 gap-2 px-4 py-4 items-center hover:bg-gray-50 transition-colors',
                  isTop && 'bg-gradient-to-r from-purple-50 to-transparent'
                )}
              >
                {/* Canal */}
                <div className="col-span-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{channel.emoji}</span>
                    <div>
                      <p className="font-semibold text-gray-900">{channel.label.replace(/^\S+\s/, '')}</p>
                      <p className="text-xs text-gray-500">{channel.percentage}% des clients</p>
                    </div>
                  </div>
                  {isTop && (
                    <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
 Top Canal
                    </span>
                  )}
                </div>

                {/* Clients */}
                <div className="col-span-2 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Users size={14} className="text-gray-400" />
                    <span className="font-semibold">{channel.clientCount}</span>
                  </div>
                  <p className="text-xs text-gray-500">{channel.bookingCount} résa.</p>
                </div>

                {/* Panier Moyen */}
                <div className="col-span-2 text-center">
                  <div className={cn(
                    'flex items-center justify-center gap-1',
                    isBestBasket && 'text-green-600'
                  )}>
                    <Euro size={14} />
                    <span className="font-semibold">{channel.averageBasket.toFixed(2)}</span>
                  </div>
                  {isBestBasket && (
                    <span className="text-xs text-green-600 font-medium">Meilleur!</span>
                  )}
                </div>

                {/* Revenu Total */}
                <div className="col-span-2 text-center">
                  <div className={cn(
                    'flex items-center justify-center gap-1',
                    isBestRevenue && 'text-purple-600'
                  )}>
                    <span className="font-semibold">€{channel.totalRevenue.toFixed(0)}</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {((channel.totalRevenue / totalRevenue) * 100).toFixed(0)}% du total
                  </p>
                </div>

                {/* Rétention */}
                <div className="col-span-2 text-center">
                  <div className={cn(
                    'flex items-center justify-center gap-1',
                    isBestRetention && 'text-blue-600'
                  )}>
                    <Repeat size={14} />
                    <span className="font-semibold">{channel.retentionRate}%</span>
                  </div>
                  {isBestRetention && (
                    <span className="text-xs text-blue-600 font-medium">Fidélisés!</span>
                  )}
                </div>

                {/* Trend */}
                <div className="col-span-1 text-center">
                  <TrendIndicator trend={channel.trend} change={channel.changePercent} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="px-4 py-3 bg-gray-50 border-t text-xs text-gray-500">
          <div className="flex flex-wrap gap-4">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-purple-100"></span>
 = Canal le plus rentable
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-100"></span>
              Meilleur panier = Valeur moyenne la plus haute
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-100"></span>
              Fidélisés = Meilleur taux de rétention
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
