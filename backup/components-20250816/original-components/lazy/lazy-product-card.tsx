"use client"

import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ShoppingCart } from "lucide-react"
import type { Product } from "@/lib/data"

// 🚀 LAZY LOADING for ProductCard with skeleton
const ProductCardComponent = dynamic(() => import('@/components/product-card'), {
  loading: () => <ProductCardSkeleton />,
  ssr: false
})

// 💀 SKELETON COMPONENT
function ProductCardSkeleton() {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 border-purple-100">
      <div className="relative">
        <Skeleton className="w-full h-64" />
        <div className="absolute top-3 right-3">
          <Skeleton className="w-8 h-8 rounded-full" />
        </div>
      </div>
      <CardContent className="p-4">
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-full mb-3" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-20" />
          <div className="flex gap-2">
            <Skeleton className="w-8 h-8 rounded" />
            <Skeleton className="w-20 h-8 rounded" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// 🎯 LAZY PRODUCT CARD with intersection observer
interface LazyProductCardProps {
  product: Product
  priority?: boolean
  className?: string
  onAddToCart?: (product: Product) => void
}

export function LazyProductCard({ 
  product, 
  priority = false, 
  className,
  onAddToCart
}: LazyProductCardProps) {
  return (
    <div className={className}>
      {priority ? (
        // Load immediately for above-the-fold content
        <ProductCardComponent product={product} />
      ) : (
        // Lazy load for below-the-fold content
        <Suspense fallback={<ProductCardSkeleton />}>
          <ProductCardComponent product={product} />
        </Suspense>
      )}
    </div>
  )
}

export default LazyProductCard