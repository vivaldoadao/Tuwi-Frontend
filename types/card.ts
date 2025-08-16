// ===================================
// TIPOS ESPECÍFICOS PARA CARDS
// ===================================

import { ReactNode } from 'react'

export interface BaseCardItem {
  id: string
  [key: string]: any
}

export interface CardAction {
  key: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
  onClick?: (item: any) => void
  href?: string
  external?: boolean
  disabled?: boolean
  className?: string
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
}

export interface CardBadge {
  key: string
  label: string
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'
  className?: string
  show?: (item: any) => boolean
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
}

export interface CardField {
  key: string
  label?: string
  render?: (value: any, item: any) => ReactNode
  icon?: React.ComponentType<{ className?: string }>
  className?: string
  show?: (item: any) => boolean
}

export interface CardImage {
  src: string | ((item: any) => string)
  alt: string | ((item: any) => string)
  fallback?: string
  aspectRatio?: 'square' | 'video' | 'portrait' | 'landscape'
  overlay?: boolean
  carousel?: boolean
  zoom?: boolean
}

export interface CardRating {
  key: string
  maxRating?: number
  showCount?: boolean
  countKey?: string
  className?: string
}

export interface CardLayout {
  variant?: 'default' | 'compact' | 'detailed' | 'minimal'
  size?: 'sm' | 'md' | 'lg'
  aspectRatio?: 'auto' | 'square' | 'video' | 'portrait'
  hover?: boolean
  animation?: boolean
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
}

export interface CardConfig {
  // Image configuration
  image?: CardImage
  
  // Content fields
  title?: CardField
  subtitle?: CardField
  description?: CardField
  fields?: CardField[]
  
  // Interactive elements
  actions?: CardAction[]
  badges?: CardBadge[]
  rating?: CardRating
  
  // Layout and styling
  layout?: CardLayout
  className?: string
  
  // Behavior
  clickable?: boolean
  selectable?: boolean
  favoritable?: boolean
  shareable?: boolean
  
  // Links
  href?: string | ((item: any) => string)
  external?: boolean
  
  // Events
  onClick?: (item: any) => void
  onFavorite?: (item: any) => void
  onShare?: (item: any) => void
  onAction?: (action: string, item: any) => void
}

export interface UseCardStateOptions {
  favoriteKey?: string
  initialFavorites?: string[]
  onFavoriteChange?: (id: string, isFavorite: boolean) => void
}

export interface UseCardStateReturn {
  isFavorite: (id: string) => boolean
  toggleFavorite: (id: string) => void
  favorites: string[]
  clearFavorites: () => void
}

// Predefined card templates
export interface CardTemplate {
  name: string
  config: CardConfig
}

// Common card types
export interface ProductCardData extends BaseCardItem {
  name: string
  description?: string
  price: number
  imageUrl?: string
  category?: string
  rating?: number
  reviewCount?: number
  inStock?: boolean
  discount?: number
}

export interface BraiderCardData extends BaseCardItem {
  name: string
  bio?: string
  profileImage?: string
  portfolioImages?: string[]
  location?: string
  rating?: number
  reviewCount?: number
  available?: boolean
  yearsExperience?: number
  specialties?: string[]
}

export interface ServiceCardData extends BaseCardItem {
  name: string
  description?: string
  price: number
  duration?: number
  category?: string
  imageUrl?: string
  difficulty?: 'easy' | 'medium' | 'hard'
  popular?: boolean
}

export interface UserCardData extends BaseCardItem {
  name: string
  email: string
  avatar?: string
  role?: string
  status?: 'active' | 'inactive' | 'pending'
  lastSeen?: string
  joinDate?: string
}

export interface ReviewCardData extends BaseCardItem {
  rating: number
  title?: string
  content: string
  author: string
  authorAvatar?: string
  date: string
  verified?: boolean
  helpful?: number
  images?: string[]
}