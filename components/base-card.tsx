// ===================================
// COMPONENTE BASECARD GENÉRICO
// ===================================

"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { 
  Heart, 
  Share2, 
  MoreVertical, 
  Star, 
  ChevronLeft, 
  ChevronRight,
  Eye,
  ExternalLink
} from "lucide-react"
import { useCardState } from "@/hooks/use-card-state"
import type { BaseCardItem, CardConfig } from "@/types/card"
import { cn } from "@/lib/utils"

interface BaseCardProps<T extends BaseCardItem> {
  // Required props
  item: T
  config: CardConfig
  
  // Optional customization
  className?: string
  
  // State management
  favoriteKey?: string
  
  // Events
  onFavoriteChange?: (id: string, isFavorite: boolean) => void
  
  // Grid/list context
  selected?: boolean
  onSelect?: (item: T) => void
}

export function BaseCard<T extends BaseCardItem>({
  item,
  config,
  className,
  favoriteKey = 'favorites',
  onFavoriteChange,
  selected = false,
  onSelect
}: BaseCardProps<T>) {
  
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0)
  const [imageError, setImageError] = React.useState(false)
  
  const { isFavorite, toggleFavorite } = useCardState({
    favoriteKey,
    onFavoriteChange
  })

  // Get configuration with defaults
  const {
    image,
    title,
    subtitle, 
    description,
    fields = [],
    actions = [],
    badges = [],
    rating,
    layout = {},
    clickable = false,
    favoritable = false,
    shareable = false,
    href,
    external = false,
    onClick,
    onFavorite,
    onShare,
    onAction
  } = config

  const {
    variant = 'default',
    size = 'md',
    aspectRatio = 'auto',
    hover = true,
    animation = true,
    shadow = 'md',
    rounded = '2xl'
  } = layout

  // Image handling
  const imageUrl = React.useMemo(() => {
    if (!image) return null
    return typeof image.src === 'function' ? image.src(item) : image.src
  }, [image, item])

  const imageAlt = React.useMemo(() => {
    if (!image) return ''
    return typeof image.alt === 'function' ? image.alt(item) : image.alt
  }, [image, item])

  const hasCarousel = image?.carousel && Array.isArray(imageUrl) && imageUrl.length > 1

  // Handle image navigation
  const handleNextImage = React.useCallback(() => {
    if (hasCarousel && Array.isArray(imageUrl)) {
      setCurrentImageIndex(prev => (prev + 1) % imageUrl.length)
    }
  }, [hasCarousel, imageUrl])

  const handlePrevImage = React.useCallback(() => {
    if (hasCarousel && Array.isArray(imageUrl)) {
      setCurrentImageIndex(prev => prev === 0 ? imageUrl.length - 1 : prev - 1)
    }
  }, [hasCarousel, imageUrl])

  // Handle actions
  const handleFavoriteClick = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (onFavorite) {
      onFavorite(item)
    } else {
      toggleFavorite(item.id)
    }
  }, [item, onFavorite, toggleFavorite])

  const handleShareClick = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (onShare) {
      onShare(item)
    } else {
      // Default share behavior
      if (navigator.share) {
        navigator.share({
          title: typeof title?.render === 'function' ? 
            String(title.render(item[title.key], item)) : 
            String(item[title?.key || 'name']),
          url: window.location.href
        }).catch(console.error)
      }
    }
  }, [item, onShare, title])

  const handleCardClick = React.useCallback(() => {
    if (onClick) {
      onClick(item)
    } else if (onSelect) {
      onSelect(item)
    }
  }, [item, onClick, onSelect])

  const handleActionClick = React.useCallback((action: string) => {
    if (onAction) {
      onAction(action, item)
    }
  }, [item, onAction])

  // Render field value
  const renderField = React.useCallback((field: any) => {
    const value = item[field.key]
    
    if (field.show && !field.show(item)) {
      return null
    }
    
    if (field.render) {
      return field.render(value, item)
    }
    
    return value
  }, [item])

  // Render rating
  const renderRating = React.useCallback(() => {
    if (!rating) return null
    
    const ratingValue = item[rating.key] || 0
    const maxRating = rating.maxRating || 5
    const reviewCount = rating.countKey ? item[rating.countKey] : undefined
    
    return (
      <div className={cn("flex items-center gap-1", rating.className)}>
        <div className="flex items-center">
          {Array.from({ length: maxRating }).map((_, i) => (
            <Star
              key={i}
              className={cn(
                "h-4 w-4",
                i < ratingValue ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
              )}
            />
          ))}
        </div>
        <span className="text-sm font-medium">{ratingValue.toFixed(1)}</span>
        {rating.showCount && reviewCount !== undefined && (
          <span className="text-sm text-gray-500">({reviewCount})</span>
        )}
      </div>
    )
  }, [rating, item])

  // Get current image for display
  const currentImage = React.useMemo(() => {
    if (!imageUrl) return null
    if (Array.isArray(imageUrl)) {
      return imageUrl[currentImageIndex] || imageUrl[0]
    }
    return imageUrl
  }, [imageUrl, currentImageIndex])

  // Card wrapper component
  const CardWrapper = href ? Link : 'div'
  const cardWrapperProps = href ? { 
    href: typeof href === 'function' ? href(item) : href,
    ...(external && { target: '_blank', rel: 'noopener noreferrer' })
  } : {}

  return (
    <CardWrapper {...cardWrapperProps}>
      <Card className={cn(
        "group overflow-hidden bg-white transition-all duration-300",
        
        // Size variants
        size === 'sm' && "max-w-xs",
        size === 'md' && "max-w-sm", 
        size === 'lg' && "max-w-md",
        
        // Shadow variants
        shadow === 'none' && "shadow-none",
        shadow === 'sm' && "shadow-sm",
        shadow === 'md' && "shadow-md",
        shadow === 'lg' && "shadow-lg",
        shadow === 'xl' && "shadow-xl",
        
        // Rounded variants
        rounded === 'none' && "rounded-none",
        rounded === 'sm' && "rounded-sm",
        rounded === 'md' && "rounded-md",
        rounded === 'lg' && "rounded-lg",
        rounded === 'xl' && "rounded-xl",
        rounded === '2xl' && "rounded-2xl",
        rounded === '3xl' && "rounded-3xl",
        
        // Hover effects
        hover && "hover:shadow-2xl",
        animation && hover && "hover:-translate-y-1",
        
        // Clickable cursor
        (clickable || href || onClick) && "cursor-pointer",
        
        // Selection state
        selected && "ring-2 ring-blue-500 ring-offset-2",
        
        // Border
        "border-0",
        
        className
      )}>
        {/* Image Section */}
        {currentImage && (
          <div className={cn(
            "relative overflow-hidden",
            aspectRatio === 'square' && "aspect-square",
            aspectRatio === 'video' && "aspect-video",
            aspectRatio === 'portrait' && "aspect-[3/4]",
            aspectRatio === 'auto' && "h-56"
          )}>
            <Image
              src={currentImage}
              alt={imageAlt}
              fill
              className={cn(
                "object-cover transition-transform duration-500",
                animation && "group-hover:scale-105"
              )}
              onError={() => setImageError(true)}
            />
            
            {/* Image overlay */}
            {image?.overlay && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
            )}
            
            {/* Badges */}
            <div className="absolute inset-4 pointer-events-none">
              {badges.map((badge, index) => {
                if (badge.show && !badge.show(item)) return null
                
                return (
                  <Badge
                    key={badge.key}
                    variant={badge.variant}
                    className={cn(
                      "absolute pointer-events-auto",
                      badge.position === 'top-left' && "top-0 left-0",
                      badge.position === 'top-right' && "top-0 right-0",
                      badge.position === 'bottom-left' && "bottom-0 left-0",
                      badge.position === 'bottom-right' && "bottom-0 right-0",
                      !badge.position && "top-0 left-0", // default
                      badge.className
                    )}
                  >
                    {badge.label}
                  </Badge>
                )
              })}
            </div>
            
            {/* Action buttons overlay */}
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 space-y-2">
              {favoritable && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleFavoriteClick}
                  className="bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg rounded-full h-10 w-10"
                >
                  <Heart className={cn(
                    "h-4 w-4 transition-colors",
                    isFavorite(item.id) ? "fill-pink-500 text-pink-500" : "text-gray-700"
                  )} />
                </Button>
              )}
              
              {shareable && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleShareClick}
                  className="bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg rounded-full h-10 w-10"
                >
                  <Share2 className="h-4 w-4 text-gray-700" />
                </Button>
              )}
              
              {href && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg rounded-full h-10 w-10"
                >
                  {external ? (
                    <ExternalLink className="h-4 w-4 text-gray-700" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-700" />
                  )}
                </Button>
              )}
            </div>
            
            {/* Carousel controls */}
            {hasCarousel && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-md hover:bg-white/30 text-white rounded-full h-10 w-10"
                  onClick={handlePrevImage}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost" 
                  size="icon"
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-md hover:bg-white/30 text-white rounded-full h-10 w-10"
                  onClick={handleNextImage}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
                
                {/* Image indicators */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {Array.isArray(imageUrl) && imageUrl.map((_, index) => (
                    <button
                      key={index}
                      className={cn(
                        "w-2 h-2 rounded-full transition-colors",
                        index === currentImageIndex ? "bg-white" : "bg-white/50"
                      )}
                      onClick={() => setCurrentImageIndex(index)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
        
        {/* Content Section */}
        <CardContent className={cn(
          "space-y-3",
          variant === 'compact' ? "p-4" : "p-6"
        )}>
          {/* Title */}
          {title && (
            <CardTitle className={cn(
              "transition-colors line-clamp-2 font-heading",
              (clickable || href) && "group-hover:text-blue-600",
              variant === 'compact' ? "text-lg" : "text-xl",
              title.className
            )}>
              {title.icon && <title.icon className="h-5 w-5 mr-2 inline" />}
              {renderField(title)}
            </CardTitle>
          )}
          
          {/* Subtitle */}
          {subtitle && (
            <div className={cn("text-gray-600", subtitle.className)}>
              {subtitle.icon && <subtitle.icon className="h-4 w-4 mr-1 inline" />}
              {renderField(subtitle)}
            </div>
          )}
          
          {/* Rating */}
          {rating && renderRating()}
          
          {/* Description */}
          {description && (
            <p className={cn(
              "text-gray-600 line-clamp-3",
              variant === 'compact' ? "text-sm" : "text-base",
              description.className
            )}>
              {renderField(description)}
            </p>
          )}
          
          {/* Additional fields */}
          {fields.length > 0 && (
            <div className="space-y-2">
              {fields.map((field, index) => (
                <div key={field.key || index} className={cn("flex items-center gap-1", field.className)}>
                  {field.icon && <field.icon className="h-4 w-4 text-gray-500" />}
                  {field.label && (
                    <span className="text-sm text-gray-500">{field.label}:</span>
                  )}
                  <span className="text-sm">{renderField(field)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
        
        {/* Footer with actions */}
        {actions.length > 0 && (
          <CardFooter className={cn(
            "flex items-center justify-between border-t border-gray-100",
            variant === 'compact' ? "p-4 pt-3" : "p-6 pt-4"
          )}>
            <div className="flex gap-2">
              {actions.slice(0, 2).map(action => (
                <Button
                  key={action.key}
                  variant={action.variant || 'default'}
                  size="sm"
                  onClick={() => handleActionClick(action.key)}
                  disabled={action.disabled}
                  className={action.className}
                  asChild={!!action.href}
                >
                  {action.href ? (
                    <Link href={action.href} {...(action.external && { target: '_blank', rel: 'noopener noreferrer' })}>
                      {action.icon && <action.icon className="h-4 w-4 mr-1" />}
                      {action.label}
                    </Link>
                  ) : (
                    <>
                      {action.icon && <action.icon className="h-4 w-4 mr-1" />}
                      {action.label}
                    </>
                  )}
                </Button>
              ))}
            </div>
            
            {actions.length > 2 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {actions.slice(2).map((action, index) => (
                    <React.Fragment key={action.key}>
                      {index > 0 && action.key.includes('separator') && <DropdownMenuSeparator />}
                      <DropdownMenuItem
                        onClick={() => handleActionClick(action.key)}
                        disabled={action.disabled}
                        className={action.className}
                      >
                        {action.icon && <action.icon className="h-4 w-4 mr-2" />}
                        {action.label}
                      </DropdownMenuItem>
                    </React.Fragment>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </CardFooter>
        )}
      </Card>
    </CardWrapper>
  )
}