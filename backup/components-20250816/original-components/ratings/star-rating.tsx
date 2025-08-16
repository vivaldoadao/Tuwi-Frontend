'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  rating?: number
  onRatingChange?: (rating: number) => void
  readonly?: boolean
  size?: 'sm' | 'md' | 'lg'
  showValue?: boolean
  className?: string
}

export function StarRating({
  rating = 0,
  onRatingChange,
  readonly = false,
  size = 'md',
  showValue = false,
  className
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0)
  const [currentRating, setCurrentRating] = useState(rating)

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5', 
    lg: 'w-6 h-6'
  }

  const handleClick = (value: number) => {
    if (readonly) return
    setCurrentRating(value)
    onRatingChange?.(value)
  }

  const handleMouseEnter = (value: number) => {
    if (readonly) return
    setHoverRating(value)
  }

  const handleMouseLeave = () => {
    if (readonly) return
    setHoverRating(0)
  }

  const displayRating = hoverRating || currentRating

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {/* Stars */}
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((value) => {
          const isFilled = value <= displayRating
          const isPartial = !Number.isInteger(displayRating) && 
                           value === Math.ceil(displayRating)

          return (
            <button
              key={value}
              type="button"
              disabled={readonly}
              className={cn(
                "transition-colors duration-200",
                !readonly && "hover:scale-110",
                readonly ? "cursor-default" : "cursor-pointer"
              )}
              onClick={() => handleClick(value)}
              onMouseEnter={() => handleMouseEnter(value)}
              onMouseLeave={handleMouseLeave}
            >
              <Star
                className={cn(
                  sizeClasses[size],
                  "transition-colors duration-200",
                  isFilled 
                    ? "fill-yellow-400 text-yellow-400" 
                    : "fill-transparent text-gray-300",
                  isPartial && "fill-yellow-200 text-yellow-400",
                  !readonly && "hover:text-yellow-400"
                )}
              />
            </button>
          )
        })}
      </div>

      {/* Rating value */}
      {showValue && (
        <span className="text-sm font-medium text-gray-600 ml-2">
          {currentRating > 0 ? currentRating.toFixed(1) : '0.0'}
        </span>
      )}
    </div>
  )
}

// Componente apenas para exibição (mais performático)
interface StarDisplayProps {
  rating: number
  size?: 'sm' | 'md' | 'lg'
  showValue?: boolean
  showCount?: boolean
  count?: number
  className?: string
}

export function StarDisplay({
  rating,
  size = 'md',
  showValue = false,
  showCount = false,
  count,
  className
}: StarDisplayProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((value) => {
          const isFilled = value <= rating
          const isPartial = !Number.isInteger(rating) && 
                           value === Math.ceil(rating)

          return (
            <Star
              key={value}
              className={cn(
                sizeClasses[size],
                isFilled 
                  ? "fill-yellow-400 text-yellow-400" 
                  : "fill-transparent text-gray-300",
                isPartial && "fill-yellow-200 text-yellow-400"
              )}
            />
          )
        })}
      </div>

      {showValue && (
        <span className="text-sm font-medium text-gray-600 ml-2">
          {rating.toFixed(1)}
        </span>
      )}

      {showCount && count !== undefined && (
        <span className="text-sm text-gray-500 ml-1">
          ({count} {count === 1 ? 'avaliação' : 'avaliações'})
        </span>
      )}
    </div>
  )
}

// Componente para rating breakdown (distribuição por estrelas)
interface RatingBreakdownProps {
  stats: {
    rating_1_count: number
    rating_2_count: number
    rating_3_count: number
    rating_4_count: number
    rating_5_count: number
    total_ratings: number
  }
  className?: string
}

export function RatingBreakdown({ stats, className }: RatingBreakdownProps) {
  const ratings = [
    { stars: 5, count: stats.rating_5_count },
    { stars: 4, count: stats.rating_4_count },
    { stars: 3, count: stats.rating_3_count },
    { stars: 2, count: stats.rating_2_count },
    { stars: 1, count: stats.rating_1_count }
  ]

  const getPercentage = (count: number) => {
    if (stats.total_ratings === 0) return 0
    return (count / stats.total_ratings) * 100
  }

  return (
    <div className={cn("space-y-2", className)}>
      {ratings.map(({ stars, count }) => (
        <div key={stars} className="flex items-center gap-2 text-sm">
          <span className="w-6 text-right font-medium">{stars}</span>
          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          
          <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-yellow-400 transition-all duration-300"
              style={{ width: `${getPercentage(count)}%` }}
            />
          </div>
          
          <span className="w-8 text-right text-gray-600">
            {count}
          </span>
          
          <span className="w-12 text-right text-gray-500 text-xs">
            {getPercentage(count).toFixed(0)}%
          </span>
        </div>
      ))}
    </div>
  )
}