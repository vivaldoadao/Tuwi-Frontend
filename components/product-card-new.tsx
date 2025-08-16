// ===================================
// PRODUCT CARD - NOVA VERSÃO COM BASECARD
// ===================================

"use client"

import * as React from "react"
import { BaseCard } from "@/components/base-card"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, Eye, Euro, Package, AlertTriangle } from "lucide-react"
import { useCart } from "@/context/cart-context"
import { formatEuro } from "@/lib/currency"
import type { Product } from "@/lib/data"
import type { ProductAdmin } from "@/lib/data-supabase"
import type { ProductWithRealRating } from "@/lib/data-supabase-ratings"
import type { CardConfig, ProductCardData } from "@/types/card"

interface ProductCardNewProps {
  product: Product | ProductAdmin | ProductWithRealRating
  variant?: 'default' | 'compact' | 'detailed'
  showActions?: boolean
  onProductView?: (product: any) => void
}

export function ProductCardNew({ 
  product, 
  variant = 'default',
  showActions = true,
  onProductView
}: ProductCardNewProps) {
  
  const { addToCart } = useCart()

  // Transform product data to match card interface
  const cardData: ProductCardData = React.useMemo(() => ({
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    imageUrl: product.imageUrl,
    category: product.category,
    rating: 'averageRating' in product ? product.averageRating : 0,
    reviewCount: 'totalReviews' in product ? product.totalReviews : 0,
    inStock: 'stockQuantity' in product ? (product as ProductAdmin).stockQuantity > 0 : true,
    discount: 'discount' in product ? (product as any).discount : undefined,
    ...product
  }), [product])

  // Card configuration
  const cardConfig: CardConfig = React.useMemo(() => ({
    // Image configuration
    image: {
      src: (item) => item.imageUrl || "/placeholder.svg",
      alt: (item) => item.name,
      fallback: "/placeholder.svg",
      aspectRatio: 'video',
      overlay: true,
      zoom: true
    },

    // Content fields
    title: {
      key: 'name',
      className: 'text-gray-900 font-semibold'
    },

    subtitle: {
      key: 'category',
      className: 'text-sm text-gray-500',
      render: (value) => value ? `Categoria: ${value}` : ''
    },

    description: {
      key: 'description',
      className: 'text-gray-600 text-sm'
    },

    // Additional fields
    fields: [
      {
        key: 'price',
        icon: Euro,
        render: (value) => formatEuro(value),
        className: 'text-lg font-bold text-gray-900'
      }
    ],

    // Rating system
    rating: {
      key: 'rating',
      showCount: true,
      countKey: 'reviewCount',
      maxRating: 5
    },

    // Badges for product status
    badges: [
      {
        key: 'stock',
        label: 'Em Estoque',
        variant: 'success' as const,
        position: 'top-left' as const,
        show: (item) => item.inStock,
        className: 'bg-green-500 hover:bg-green-500 text-white'
      },
      {
        key: 'out-of-stock',
        label: 'Esgotado',
        variant: 'destructive' as const,
        position: 'top-left' as const,
        show: (item) => !item.inStock,
        className: 'bg-red-500 hover:bg-red-500 text-white'
      },
      {
        key: 'discount',
        label: (item) => `-${item.discount}%`,
        variant: 'destructive' as const,
        position: 'top-right' as const,
        show: (item) => item.discount > 0,
        className: 'bg-red-500 hover:bg-red-500 text-white'
      }
    ],

    // Actions
    actions: showActions ? [
      {
        key: 'add-to-cart',
        label: 'Adicionar',
        icon: ShoppingCart,
        variant: 'default' as const,
        disabled: (item) => !item.inStock
      },
      {
        key: 'view-details',
        label: 'Ver Detalhes',
        icon: Eye,
        variant: 'ghost' as const
      }
    ] : [],

    // Layout configuration
    layout: {
      variant,
      size: 'md',
      hover: true,
      animation: true,
      shadow: 'md',
      rounded: '2xl'
    },

    // Interactive features
    clickable: true,
    favoritable: true,
    shareable: true,
    href: `/products/${product.id}`,

    // Event handlers will be passed as props
  }), [product, variant, showActions])

  // Handle actions
  const handleAction = React.useCallback((action: string, item: any) => {
    switch (action) {
      case 'add-to-cart':
        addToCart(item)
        break
      case 'view-details':
        if (onProductView) {
          onProductView(item)
        }
        break
    }
  }, [addToCart, onProductView])

  // Handle favorite change
  const handleFavoriteChange = React.useCallback((id: string, isFavorite: boolean) => {
    // Could integrate with favorites context here
    console.log(`Product ${id} favorite status: ${isFavorite}`)
  }, [])

  return (
    <BaseCard<ProductCardData>
      item={cardData}
      config={cardConfig}
      favoriteKey="product-favorites"
      onFavoriteChange={handleFavoriteChange}
      onAction={handleAction}
    />
  )
}

// Export with different variants for convenience
export function ProductCardCompact(props: Omit<ProductCardNewProps, 'variant'>) {
  return <ProductCardNew {...props} variant="compact" />
}

export function ProductCardDetailed(props: Omit<ProductCardNewProps, 'variant'>) {
  return <ProductCardNew {...props} variant="detailed" />
}

// Default export for backward compatibility
export default ProductCardNew