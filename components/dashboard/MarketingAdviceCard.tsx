'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  CheckCircle2, 
  X, 
  Sparkles, 
  Target, 
  TrendingUp, 
  Ear,
  AlertCircle,
  RefreshCw,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MarketingAdvice } from '@/lib/analytics/ltv'

interface MarketingAdviceCardProps {
  advice: MarketingAdvice[]
  onMarkRead: (id: string) => void
  onMarkActioned: (id: string) => void
  onDismiss: (id: string) => void
  onRefresh: () => void
  isLoading?: boolean
}

const priorityConfig = {
  high: {
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: Zap,
    label: 'Priorité Haute',
  },
  medium: {
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Target,
    label: 'Priorité Moyenne',
  },
  low: {
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: TrendingUp,
    label: 'Priorité Basse',
  },
}

const iconMap: Record<string, React.ComponentType<{ className?: string; size?: number }>> = {
 '': Target,
 '': TrendingUp,
 '': Ear,
 '': AlertCircle,
 '': Sparkles,
 '': AlertCircle,
 '': CheckCircle2,
 '': Target,
}

export function MarketingAdviceCard({
  advice,
  onMarkRead,
  onMarkActioned,
  onDismiss,
  onRefresh,
  isLoading,
}: MarketingAdviceCardProps) {
  const [expanded, setExpanded] = useState<string | null>(null)

  if (advice.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="text-purple-500" size={20} />
 Conseils Marketing IA
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onRefresh} disabled={isLoading}>
            <RefreshCw size={16} className={cn(isLoading && 'animate-spin')} />
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Sparkles className="text-gray-400" size={24} />
          </div>
          <p className="text-gray-600 font-medium mb-2">Pas de nouveaux conseils</p>
          <p className="text-sm text-gray-500 mb-4">
            Continue à recevoir des clients pour recevoir des recommandations personnalisées
          </p>
          <Button variant="outline" onClick={onRefresh} disabled={isLoading}>
            <RefreshCw size={16} className={cn('mr-2', isLoading && 'animate-spin')} />
            Générer des conseils
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="text-purple-500" size={20} />
 Conseils Marketing IA
          <Badge variant="secondary" className="ml-2">
            {advice.length} recommandations
          </Badge>
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={onRefresh} disabled={isLoading}>
          <RefreshCw size={16} className={cn(isLoading && 'animate-spin')} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {advice.map((item) => {
          const config = priorityConfig[item.priority]
          const IconComponent = iconMap[item.icon] || Sparkles
          const isExpanded = expanded === item.id

          return (
            <div
              key={item.id}
              className={cn(
                'relative rounded-lg border p-4 transition-all',
                item.isRead ? 'bg-gray-50 border-gray-200' : 'bg-white border-purple-200 shadow-sm',
                item.isActioned && 'opacity-60'
              )}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={cn('p-2 rounded-lg', config.color)}>
                    <IconComponent size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className={cn('text-xs', config.color)}>
                        {config.label}
                      </Badge>
                      {!item.isRead && (
                        <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                      )}
                    </div>
                    <h4 className="font-semibold text-gray-900">{item.title}</h4>
                  </div>
                </div>
                <button
                  onClick={() => onDismiss(item.id)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Description */}
              <p className="mt-3 text-sm text-gray-600">{item.description}</p>

              {/* Action & Content */}
              <div className="mt-4 space-y-3">
                <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
 <p className="text-sm font-medium text-purple-900 mb-1"> Action recommandée:</p>
                  <p className="text-sm text-purple-800">{item.action}</p>
                </div>

                {isExpanded && (
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
 <p className="text-sm font-medium text-gray-900 mb-1"> Suggestion de contenu:</p>
                    <p className="text-sm text-gray-700">{item.contentSuggestion}</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
 Impact estimé: €{item.estimatedRevenueImpact.toFixed(0)}
                  </span>
                  <button
                    onClick={() => setExpanded(isExpanded ? null : item.id)}
                    className="text-purple-600 hover:text-purple-700 font-medium"
                  >
                    {isExpanded ? 'Moins' : 'Plus de détails'}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {!item.isRead && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onMarkRead(item.id)}
                    >
                      Marquer lu
                    </Button>
                  )}
                  <Button
                    variant={item.isActioned ? 'outline' : 'default'}
                    size="sm"
                    onClick={() => onMarkActioned(item.id)}
                    disabled={item.isActioned}
                    className={cn(
                      item.isActioned && 'bg-green-100 text-green-700 border-green-300'
                    )}
                  >
                    {item.isActioned ? (
                      <>
                        <CheckCircle2 size={16} className="mr-1" />
                        Fait!
                      </>
                    ) : (
                      'J\'ai fait ça'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
