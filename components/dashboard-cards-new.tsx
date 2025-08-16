// ===================================
// DASHBOARD CARDS - NOVA VERSÃO COM BASECARD
// ===================================

"use client"

import * as React from "react"
import { BaseCard } from "@/components/base-card"
import { 
  Users, 
  ShoppingCart, 
  Package, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Eye,
  Calendar
} from "lucide-react"
import { formatEuro } from "@/lib/currency"
import type { CardConfig } from "@/types/card"

interface DashboardStat {
  id: string
  title: string
  value: string | number
  change?: number
  changeType?: 'increase' | 'decrease' | 'neutral'
  icon: React.ComponentType<{ className?: string }>
  description?: string
  trend?: number[]
}

interface DashboardCardsNewProps {
  stats: DashboardStat[]
  variant?: 'default' | 'compact' | 'detailed'
  onStatClick?: (stat: DashboardStat) => void
}

export function DashboardCardsNew({ 
  stats, 
  variant = 'default',
  onStatClick
}: DashboardCardsNewProps) {

  // Create card config for dashboard stats
  const createStatConfig = React.useCallback((stat: DashboardStat): CardConfig => ({
    // No image for dashboard cards
    image: undefined,

    // Content fields
    title: {
      key: 'title',
      className: 'text-gray-700 font-medium text-sm'
    },

    // Use description as subtitle if available
    subtitle: stat.description ? {
      key: 'description',
      className: 'text-xs text-gray-500'
    } : undefined,

    // Additional fields for value and change
    fields: [
      {
        key: 'value',
        render: (value) => {
          // Format different types of values
          if (typeof value === 'number' && stat.title.toLowerCase().includes('vendas')) {
            return formatEuro(value)
          }
          return value.toLocaleString()
        },
        className: 'text-2xl font-bold text-gray-900'
      },
      ...(stat.change !== undefined ? [{
        key: 'change',
        icon: stat.changeType === 'increase' ? TrendingUp : 
              stat.changeType === 'decrease' ? TrendingDown : undefined,
        render: (value: number) => {
          const sign = value > 0 ? '+' : ''
          return `${sign}${value}%`
        },
        className: stat.changeType === 'increase' ? 'text-green-600 font-medium' :
                   stat.changeType === 'decrease' ? 'text-red-600 font-medium' :
                   'text-gray-600 font-medium'
      }] : [])
    ],

    // Actions
    actions: [
      {
        key: 'view-details',
        label: 'Ver Detalhes',
        icon: Eye,
        variant: 'ghost' as const
      }
    ],

    // Layout configuration
    layout: {
      variant,
      size: 'md',
      hover: true,
      animation: false, // Keep dashboard cards stable
      shadow: 'sm',
      rounded: 'lg'
    },

    // Interactive features
    clickable: true,
    favoritable: false,
    shareable: false,

    // Custom styling based on change type
    className: stat.changeType === 'increase' ? 'border-l-4 border-green-500' :
               stat.changeType === 'decrease' ? 'border-l-4 border-red-500' :
               'border-l-4 border-blue-500'

  }), [variant])

  // Handle actions
  const handleAction = React.useCallback((action: string, item: any) => {
    if (action === 'view-details' && onStatClick) {
      const stat = stats.find(s => s.id === item.id)
      if (stat) {
        onStatClick(stat)
      }
    }
  }, [stats, onStatClick])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => {
        // Transform stat to card data
        const cardData = {
          id: stat.id,
          title: stat.title,
          description: stat.description,
          value: stat.value,
          change: stat.change,
          icon: stat.icon
        }

        return (
          <BaseCard
            key={stat.id}
            item={cardData}
            config={createStatConfig(stat)}
            onAction={handleAction}
          />
        )
      })}
    </div>
  )
}

// Predefined dashboard card configurations
export function SalesStatsCards(props: Omit<DashboardCardsNewProps, 'stats'>) {
  const defaultStats: DashboardStat[] = [
    {
      id: 'total-sales',
      title: 'Vendas Totais',
      value: 15750,
      change: 12,
      changeType: 'increase',
      icon: DollarSign,
      description: 'Último mês'
    },
    {
      id: 'total-orders',
      title: 'Pedidos',
      value: 245,
      change: 8,
      changeType: 'increase',
      icon: ShoppingCart,
      description: 'Último mês'
    },
    {
      id: 'total-products',
      title: 'Produtos',
      value: 156,
      change: -2,
      changeType: 'decrease',
      icon: Package,
      description: 'Ativos'
    },
    {
      id: 'total-customers',
      title: 'Clientes',
      value: 892,
      change: 15,
      changeType: 'increase',
      icon: Users,
      description: 'Registrados'
    }
  ]

  return <DashboardCardsNew {...props} stats={defaultStats} />
}

export function BraiderStatsCards(props: Omit<DashboardCardsNewProps, 'stats'>) {
  const defaultStats: DashboardStat[] = [
    {
      id: 'total-bookings',
      title: 'Agendamentos',
      value: 34,
      change: 20,
      changeType: 'increase',
      icon: Calendar,
      description: 'Este mês'
    },
    {
      id: 'total-revenue',
      title: 'Receita',
      value: 2340,
      change: 15,
      changeType: 'increase',
      icon: DollarSign,
      description: 'Este mês'
    },
    {
      id: 'profile-views',
      title: 'Visualizações',
      value: 1205,
      change: 8,
      changeType: 'increase',
      icon: Eye,
      description: 'Do perfil'
    },
    {
      id: 'rating',
      title: 'Avaliação',
      value: '4.8',
      change: 2,
      changeType: 'increase',
      icon: TrendingUp,
      description: 'Média geral'
    }
  ]

  return <DashboardCardsNew {...props} stats={defaultStats} />
}

// Compact version for sidebars
export function DashboardCardsCompact(props: Omit<DashboardCardsNewProps, 'variant'>) {
  return <DashboardCardsNew {...props} variant="compact" />
}

// Detailed version for main dashboard
export function DashboardCardsDetailed(props: Omit<DashboardCardsNewProps, 'variant'>) {
  return <DashboardCardsNew {...props} variant="detailed" />
}