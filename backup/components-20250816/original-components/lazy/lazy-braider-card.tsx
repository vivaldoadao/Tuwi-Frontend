"use client"

import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { MapPin, Star } from "lucide-react"
import type { Braider } from "@/lib/data"

// 🚀 LAZY LOADING for BraiderCard with skeleton
const BraiderCardComponent = dynamic(() => import('@/components/braider-card'), {
  loading: () => <BraiderCardSkeleton />,
  ssr: false
})

// 💀 SKELETON COMPONENT
function BraiderCardSkeleton() {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 border-purple-100">
      <div className="relative">
        <Skeleton className="w-full h-64" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <Skeleton className="h-6 w-3/4 mb-2" />
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-4 w-4 text-white/80" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </div>
      <CardContent className="p-4">
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4 mb-3" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-20" />
        </div>
      </CardContent>
    </Card>
  )
}

// 🎯 LAZY BRAIDER CARD with intersection observer
interface LazyBraiderCardProps {
  braider: Braider
  priority?: boolean
  className?: string
}

export function LazyBraiderCard({ 
  braider, 
  priority = false, 
  className 
}: LazyBraiderCardProps) {
  return (
    <div className={className}>
      {priority ? (
        // Load immediately for above-the-fold content
        <BraiderCardComponent braider={braider} />
      ) : (
        // Lazy load for below-the-fold content
        <Suspense fallback={<BraiderCardSkeleton />}>
          <BraiderCardComponent braider={braider} />
        </Suspense>
      )}
    </div>
  )
}

export default LazyBraiderCard