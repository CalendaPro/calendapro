'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { usePlan } from '@/lib/hooks/usePlan'
import FeatureGate from '@/components/dashboard/FeatureGate'
import { AcquisitionChart } from '@/components/dashboard/AcquisitionChart'
import { AcquisitionTrend } from '@/components/dashboard/AcquisitionTrend'
import { ClientValueAnalysis } from '@/components/dashboard/ClientValueAnalysis'
import { MarketingAdviceCard } from '@/components/dashboard/MarketingAdviceCard'
import { QuickActionCards } from '@/components/dashboard/QuickActionCards'
import type { AcquisitionData } from '@/app/api/pro/analytics/acquisition/route'
import type { MarketingAdvice } from '@/lib/analytics/ltv'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { RefreshCw, Download, Sparkles } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function AcquisitionIntelligencePage() {
  const { plan } = usePlan()
  const { toast } = useToast()
  const [data, setData] = useState<AcquisitionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/pro/analytics/acquisition?range=${timeRange}`)
      if (!response.ok) throw new Error('Failed to fetch')
      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error('Error fetching acquisition data:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les données d acquisition',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [timeRange, toast])

  useEffect(() => {
    if (plan && plan !== 'free') {
      fetchData()
    }
  }, [plan, fetchData])

  // Handle advice actions
  const handleMarkRead = async (id: string) => {
    try {
      await fetch('/api/pro/analytics/acquisition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark-read', adviceId: id }),
      })
      setData((prev) =>
        prev
          ? {
              ...prev,
              advice: prev.advice.map((a) =>
                a.id === id ? { ...a, isRead: true } : a
              ),
            }
          : null
      )
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  const handleMarkActioned = async (id: string) => {
    try {
      await fetch('/api/pro/analytics/acquisition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark-actioned', adviceId: id }),
      })
      setData((prev) =>
        prev
          ? {
              ...prev,
              advice: prev.advice.map((a) =>
                a.id === id ? { ...a, isActioned: true, isRead: true } : a
              ),
            }
          : null
      )
      toast({
        title: 'Action enregistrée!',
        description: 'Continue comme ça! 🚀',
      })
    } catch (error) {
      console.error('Error marking as actioned:', error)
    }
  }

  const handleDismiss = async (id: string) => {
    try {
      await fetch('/api/pro/analytics/acquisition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'dismiss', adviceId: id }),
      })
      setData((prev) =>
        prev
          ? {
              ...prev,
              advice: prev.advice.filter((a) => a.id !== id),
            }
          : null
      )
    } catch (error) {
      console.error('Error dismissing:', error)
    }
  }

  const handleRefreshAdvice = async () => {
    setIsRefreshing(true)
    try {
      const response = await fetch('/api/pro/analytics/acquisition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate-advice' }),
      })
      const result = await response.json()
      if (result.advice) {
        setData((prev) => (prev ? { ...prev, advice: result.advice } : null))
        toast({
          title: 'Nouveaux conseils générés!',
          description: `${result.advice.length} recommandations pour toi`,
        })
      }
    } catch (error) {
      console.error('Error refreshing advice:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de générer de nouveaux conseils',
        variant: 'destructive',
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  // Export data
  const handleExport = () => {
    if (!data) return
    const csv = [
      ['Source', 'Clients', 'Réservations', 'Revenu', 'Panier Moyen', 'Rétention'],
      ...data.channels.map((c) => [
        c.sourceChannel,
        c.clientCount,
        c.bookingCount,
        c.totalRevenue,
        c.averageBasket,
        c.retentionRate,
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `acquisition-${timeRange}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (plan === 'free') {
    return (
      <FeatureGate required="premium" current={plan}>
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-4">📊 Intelligence d Acquisition</h1>
          <p className="text-gray-600 mb-6">
            Découvre exactement où tes clients viennent et où investir pour maximiser tes revenus.
          </p>
          <Button onClick={() => window.location.href = '/dashboard/pricing'}>
            Passer à Pro
          </Button>
        </div>
      </FeatureGate>
    )
  }

  if (loading) {
    return (
      <div className="p-8 space-y-8">
        <div className="h-8 w-64 bg-gray-200 animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-80 bg-gray-200 animate-pulse rounded-xl" />
          <div className="h-80 bg-gray-200 animate-pulse rounded-xl" />
        </div>
      </div>
    )
  }

  const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            🎯 Intelligence d Acquisition
          </h1>
          <p className="text-gray-600 mt-1">
            Découvre exactement où investir pour maximiser tes revenus
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as '7d' | '30d' | '90d')}>
            <TabsList>
              <TabsTrigger value="7d">7 jours</TabsTrigger>
              <TabsTrigger value="30d">30 jours</TabsTrigger>
              <TabsTrigger value="90d">90 jours</TabsTrigger>
            </TabsList>
          </Tabs>

          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw size={16} className="mr-2" />
            Actualiser
          </Button>

          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download size={16} className="mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <QuickActionCards
        proUsername="test" // TODO: get from user
        topSource={data?.summary.topSource}
        clientsToRelaunch={0} // TODO: calculate
        optimalPostTime="18:30"
      />

      {/* Main Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl p-4 text-white">
          <p className="text-purple-100 text-sm">Clients Total</p>
          <p className="text-3xl font-bold">{data?.summary.totalClients || 0}</p>
          <p className="text-purple-200 text-xs mt-1">sur {days} jours</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-4 text-white">
          <p className="text-green-100 text-sm">Revenu Total</p>
          <p className="text-3xl font-bold">€{data?.summary.totalRevenue?.toFixed(0) || 0}</p>
          <p className="text-green-200 text-xs mt-1">€{data?.summary.averageBasket?.toFixed(0) || 0} panier moyen</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl p-4 text-white">
          <p className="text-blue-100 text-sm">Top Canal</p>
          <p className="text-2xl font-bold truncate">{data?.summary.topSource || 'N/A'}</p>
          <p className="text-blue-200 text-xs mt-1">{data?.summary.topSourcePercent || 0}% des clients</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl p-4 text-white">
          <p className="text-orange-100 text-sm">Réservations</p>
          <p className="text-3xl font-bold">{data?.summary.totalBookings || 0}</p>
          <p className="text-orange-200 text-xs mt-1">{data?.channels?.length || 0} sources actives</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AcquisitionChart
          channels={data?.channels || []}
          totalClients={data?.summary.totalClients || 0}
          totalRevenue={data?.summary.totalRevenue || 0}
        />

        <AcquisitionTrend trends={data?.trends || []} days={days} />
      </div>

      {/* LTV Table */}
      <ClientValueAnalysis
        channels={data?.channels || []}
        totalRevenue={data?.summary.totalRevenue || 0}
      />

      {/* AI Recommendations */}
      <MarketingAdviceCard
        advice={data?.advice || []}
        onMarkRead={handleMarkRead}
        onMarkActioned={handleMarkActioned}
        onDismiss={handleDismiss}
        onRefresh={handleRefreshAdvice}
        isLoading={isRefreshing}
      />

      {/* Recommendations Footer */}
      {data?.recommendations && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200">
          <div className="flex items-start gap-4">
            <div className="bg-purple-100 rounded-full p-3">
              <Sparkles className="text-purple-600" size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-purple-900 text-lg">
                💡 Recommandation Prioritaire
              </h3>
              <p className="text-purple-800 mt-1">{data.recommendations.topAction}</p>
              <p className="text-purple-600 text-sm mt-2">
                {data.recommendations.topContent}
              </p>
              <div className="flex items-center gap-4 mt-3">
                <span className="text-sm text-purple-700">
                  💰 Impact estimé: €{data.recommendations.estimatedRevenue.toFixed(0)}
                </span>
                <span className={`text-sm font-medium ${
                  data.recommendations.priority === 'high' ? 'text-red-600' : 'text-yellow-600'
                }`}>
                  Priorité: {data.recommendations.priority === 'high' ? 'HAUTE' : 'MOYENNE'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
