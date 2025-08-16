// ===================================
// BRAIDER CARD - NOVA VERSÃO COM BASECARD
// ===================================

"use client"

import * as React from "react"
import { BaseCard } from "@/components/base-card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Phone, Mail, MessageCircle, Calendar, Award } from "lucide-react"
import type { Braider } from "@/lib/data"
import type { BraiderWithRealRating } from "@/lib/data-supabase-ratings"
import type { CardConfig, BraiderCardData } from "@/types/card"

interface BraiderCardNewProps {
  braider: Braider | BraiderWithRealRating
  variant?: 'default' | 'compact' | 'detailed'
  showActions?: boolean
  onBraiderContact?: (braider: any) => void
  onBookingRequest?: (braider: any) => void
}

export function BraiderCardNew({ 
  braider, 
  variant = 'default',
  showActions = true,
  onBraiderContact,
  onBookingRequest
}: BraiderCardNewProps) {

  // Transform braider data to match card interface
  const cardData: BraiderCardData = React.useMemo(() => ({
    id: braider.id,
    name: braider.name,
    bio: braider.bio,
    profileImage: braider.profileImage,
    portfolioImages: braider.portfolioImages,
    location: braider.city ? `${braider.city}, ${braider.state}` : braider.state,
    rating: 'averageRating' in braider ? braider.averageRating : 0,
    reviewCount: 'totalReviews' in braider ? braider.totalReviews : 0,
    available: 'isAvailable' in braider ? braider.isAvailable : true,
    yearsExperience: braider.yearsExperience,
    specialties: braider.specialties || [],
    ...braider
  }), [braider])

  // Card configuration
  const cardConfig: CardConfig = React.useMemo(() => ({
    // Image configuration with carousel support
    image: {
      src: (item) => {
        if (item.portfolioImages && item.portfolioImages.length > 0) {
          return item.portfolioImages
        }
        return item.profileImage || "/placeholder.svg?height=300&width=400&text=Trancista"
      },
      alt: (item) => `Portfolio de ${item.name}`,
      fallback: "/placeholder.svg?height=300&width=400&text=Trancista",
      aspectRatio: 'video',
      overlay: true,
      carousel: true,
      zoom: true
    },

    // Content fields
    title: {
      key: 'name',
      className: 'text-gray-900 font-semibold'
    },

    subtitle: {
      key: 'location',
      icon: MapPin,
      className: 'text-sm text-gray-500'
    },

    description: {
      key: 'bio',
      className: 'text-gray-600 text-sm'
    },

    // Additional fields
    fields: [
      {
        key: 'yearsExperience',
        label: 'Experiência',
        icon: Award,
        render: (value) => value ? `${value} anos` : 'Não informado',
        className: 'text-sm text-gray-600',
        show: (item) => item.yearsExperience > 0
      },
      {
        key: 'specialties',
        label: 'Especialidades',
        render: (value) => {
          if (!value || !Array.isArray(value) || value.length === 0) {
            return 'Não informado'
          }
          return value.slice(0, 3).join(', ') + (value.length > 3 ? '...' : '')
        },
        className: 'text-sm text-gray-600',
        show: (item) => item.specialties && item.specialties.length > 0
      }
    ],

    // Rating system
    rating: {
      key: 'rating',
      showCount: true,
      countKey: 'reviewCount',
      maxRating: 5
    },

    // Badges for braider status
    badges: [
      {
        key: 'available',
        label: 'Disponível',
        variant: 'success' as const,
        position: 'top-left' as const,
        show: (item) => item.available,
        className: 'bg-green-500 hover:bg-green-500 text-white'
      },
      {
        key: 'unavailable',
        label: 'Indisponível',
        variant: 'destructive' as const,
        position: 'top-left' as const,
        show: (item) => !item.available,
        className: 'bg-red-500 hover:bg-red-500 text-white'
      },
      {
        key: 'verified',
        label: '✓ Verificado',
        variant: 'secondary' as const,
        position: 'top-right' as const,
        show: (item) => item.verified || false,
        className: 'bg-blue-500 hover:bg-blue-500 text-white'
      }
    ],

    // Actions
    actions: showActions ? [
      {
        key: 'book-service',
        label: 'Agendar',
        icon: Calendar,
        variant: 'default' as const,
        disabled: (item) => !item.available
      },
      {
        key: 'send-message',
        label: 'Conversar',
        icon: MessageCircle,
        variant: 'ghost' as const
      },
      {
        key: 'contact-info',
        label: 'Contato',
        icon: Phone,
        variant: 'ghost' as const
      }
    ] : [],

    // Layout configuration
    layout: {
      variant,
      size: 'md',
      hover: true,
      animation: true,
      shadow: 'lg',
      rounded: '2xl'
    },

    // Interactive features
    clickable: true,
    favoritable: true,
    shareable: true,
    href: `/braiders/${braider.id}`,

    // Event handlers will be passed as props
  }), [braider, variant, showActions])

  // Handle actions
  const handleAction = React.useCallback((action: string, item: any) => {
    switch (action) {
      case 'book-service':
        if (onBookingRequest) {
          onBookingRequest(item)
        } else {
          // Default booking navigation
          window.location.href = `/braiders/${item.id}/book`
        }
        break
      case 'send-message':
      case 'contact-info':
        if (onBraiderContact) {
          onBraiderContact(item)
        } else {
          // Default contact action
          if (item.email) {
            window.location.href = `mailto:${item.email}`
          } else if (item.phone) {
            window.location.href = `tel:${item.phone}`
          }
        }
        break
    }
  }, [onBookingRequest, onBraiderContact])

  // Handle favorite change
  const handleFavoriteChange = React.useCallback((id: string, isFavorite: boolean) => {
    // Could integrate with favorites context here
    console.log(`Braider ${id} favorite status: ${isFavorite}`)
  }, [])

  return (
    <BaseCard<BraiderCardData>
      item={cardData}
      config={cardConfig}
      favoriteKey="braider-favorites"
      onFavoriteChange={handleFavoriteChange}
      onAction={handleAction}
    />
  )
}

// Export with different variants for convenience
export function BraiderCardCompact(props: Omit<BraiderCardNewProps, 'variant'>) {
  return <BraiderCardNew {...props} variant="compact" />
}

export function BraiderCardDetailed(props: Omit<BraiderCardNewProps, 'variant'>) {
  return <BraiderCardNew {...props} variant="detailed" />
}

// Default export for backward compatibility
export default BraiderCardNew