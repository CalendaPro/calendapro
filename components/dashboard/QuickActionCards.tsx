'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Instagram, 
  Smartphone, 
  Link2, 
  Share2,
  Copy,
  Check,
  Clock,
  MessageCircle,
  Calendar,
  Users
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuickActionCardsProps {
  proUsername: string
  topSource?: string
  clientsToRelaunch?: number
  optimalPostTime?: string
}

export function QuickActionCards({
  proUsername,
  topSource = 'instagram',
  clientsToRelaunch = 0,
  optimalPostTime = '18:30',
}: QuickActionCardsProps) {
  const [copied, setCopied] = useState(false)
  
  const trackingUrl = `https://calendapro.fr/${proUsername}?ref=${topSource}`
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(trackingUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const actions = [
    {
      id: 'instagram',
      icon: Instagram,
      title: 'Poste sur Instagram',
      subtitle: `Optimal: ${optimalPostTime}`,
      description: 'Génère un post optimisé',
      color: 'bg-gradient-to-br from-purple-500 to-pink-500',
      iconColor: 'text-white',
      buttonText: 'Générer post IA',
      href: '/dashboard/ai-content',
    },
    {
      id: 'sms',
      icon: Smartphone,
      title: 'Envoie SMS relance',
      subtitle: `${clientsToRelaunch} clients à relancer`,
      description: 'Messages personnalisés',
      color: 'bg-gradient-to-br from-blue-500 to-cyan-500',
      iconColor: 'text-white',
      buttonText: clientsToRelaunch > 0 ? `Relancer ${clientsToRelaunch}` : 'Voir clients',
      href: '/dashboard/clients',
      disabled: clientsToRelaunch === 0,
    },
    {
      id: 'share',
      icon: Link2,
      title: 'Partage ton lien',
      subtitle: 'Copie et partage',
      description: trackingUrl,
      color: 'bg-gradient-to-br from-green-500 to-emerald-500',
      iconColor: 'text-white',
      buttonText: copied ? 'Copié!' : 'Copier le lien',
      onClick: handleCopyLink,
      isCopied: copied,
    },
    {
      id: 'referral',
      icon: Share2,
      title: 'Parrainage',
      subtitle: 'Active le programme',
      description: 'Gagne €10 par filleul',
      color: 'bg-gradient-to-br from-orange-500 to-red-500',
      iconColor: 'text-white',
      buttonText: 'Configurer',
      href: '/dashboard/settings/referral',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {actions.map((action) => {
        const Icon = action.icon
        
        return (
          <Card 
            key={action.id} 
            className={cn(
              'overflow-hidden transition-all hover:shadow-lg',
              action.disabled && 'opacity-60'
            )}
          >
            <CardContent className="p-0">
              <div className={cn('h-2', action.color)} />
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center',
                    action.color
                  )}>
                    <Icon size={20} className={action.iconColor} />
                  </div>
                  {action.id === 'sms' && clientsToRelaunch > 0 && (
                    <span className="bg-red-100 text-red-800 text-xs font-bold px-2 py-1 rounded-full">
                      {clientsToRelaunch}
                    </span>
                  )}
                </div>
                
                <h4 className="font-semibold text-gray-900">{action.title}</h4>
                <p className="text-sm text-gray-500 mb-1">{action.subtitle}</p>
                <p className="text-xs text-gray-400 mb-4 truncate">{action.description}</p>
                
                <Button
                  variant={action.isCopied ? 'outline' : 'secondary'}
                  size="sm"
                  className={cn(
                    'w-full',
                    action.isCopied && 'border-green-500 text-green-600'
                  )}
                  disabled={action.disabled}
                  onClick={action.onClick}
                  asChild={!action.onClick}
                >
                  {action.onClick ? (
                    <span className="flex items-center justify-center gap-2">
                      {action.isCopied ? (
                        <>
                          <Check size={14} />
                          {action.buttonText}
                        </>
                      ) : (
                        <>
                          <Copy size={14} />
                          {action.buttonText}
                        </>
                      )}
                    </span>
                  ) : (
                    <a href={action.href} className="flex items-center justify-center gap-2">
                      {action.id === 'instagram' && <MessageCircle size={14} />}
                      {action.id === 'sms' && <MessageCircle size={14} />}
                      {action.id === 'referral' && <Users size={14} />}
                      {action.buttonText}
                    </a>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
