"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Product } from "@/lib/data"
import type { ProductAdmin } from "@/lib/data-supabase"
import { useCart } from "@/context/cart-context"
import { useFavorites } from "@/context/favorites-context"
import { Heart, ShoppingCart, Star, Eye, Package, AlertTriangle } from "lucide-react"

interface ProductCardProps {
  product: Product | ProductAdmin
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart()
  const { isFavoriteProduct, toggleFavoriteProduct } = useFavorites()

  const handleAddToCart = () => {
    addToCart(product)
  }

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault()
    toggleFavoriteProduct(product.id)
  }

  const isLiked = isFavoriteProduct(product.id)

  // Mock rating - você pode substituir por dados reais
  const rating = 4.8
  const reviewCount = 127

  // Check if product has stock information (ProductAdmin type)
  const hasStockInfo = 'stockQuantity' in product
  const stockQuantity = hasStockInfo ? (product as ProductAdmin).stockQuantity : undefined
  const isInStock = stockQuantity === undefined || stockQuantity > 0
  const isLowStock = stockQuantity !== undefined && stockQuantity > 0 && stockQuantity <= 5

  return (
    <Card className="group w-full max-w-sm overflow-hidden bg-white shadow-md hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-0 rounded-2xl">
      {/* Image Section with Overlay */}
      <div className="relative overflow-hidden">
        <Link href={`/products/${product.id}`}>
          <Image
            src={product.imageUrl || "/placeholder.svg"}
            alt={product.name}
            width={400}
            height={300}
            className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-500"
            unoptimized={true}
          />
        </Link>
        
        {/* Glassmorphism overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Action buttons overlay */}
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 space-y-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={handleToggleFavorite}
            className="bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg rounded-full h-10 w-10"
          >
            <Heart className={`h-4 w-4 transition-colors ${isLiked ? 'fill-pink-500 text-pink-500' : 'text-gray-700'}`} />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            asChild
            className="bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg rounded-full h-10 w-10"
          >
            <Link href={`/products/${product.id}`}>
              <Eye className="h-4 w-4 text-gray-700" />
            </Link>
          </Button>
        </div>

        {/* Stock status badge */}
        <div className="absolute top-4 left-4">
          <Badge className="bg-green-500 hover:bg-green-500 text-white px-3 py-1 rounded-full">
            Em Estoque
          </Badge>
        </div>
      </div>
      
      <CardContent className="p-6 space-y-4">
        {/* Product name and rating */}
        <div className="space-y-2">
          <Link href={`/products/${product.id}`}>
            <CardTitle className="text-xl font-semibold text-gray-900 group-hover:text-brand-700 transition-colors line-clamp-2 font-heading">
              {product.name}
            </CardTitle>
          </Link>
          
          {/* Rating */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-accent-400 text-accent-400" />
              <span className="text-sm font-medium text-gray-700">{rating}</span>
            </div>
            <span className="text-sm text-gray-500">({reviewCount} avaliações)</span>
          </div>
        </div>
        
        {/* Description */}
        <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">{product.description}</p>
        
        {/* Price and Stock */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-brand-600">
              €{product.price.toFixed(2)}
            </div>
            {/* Stock status badge */}
            {hasStockInfo && (
              <div>
                {stockQuantity === 0 ? (
                  <Badge variant="secondary" className="bg-red-100 text-red-800 text-xs">
                    <Package className="h-3 w-3 mr-1" />
                    Sem estoque
                  </Badge>
                ) : isLowStock ? (
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Últimas {stockQuantity}
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                    <Package className="h-3 w-3 mr-1" />
                    Em estoque
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-6 pt-0">
        <Button
          onClick={handleAddToCart}
          disabled={hasStockInfo && stockQuantity === 0}
          className="w-full bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          {hasStockInfo && stockQuantity === 0 ? 'Fora de Estoque' : 'Adicionar ao Carrinho'}
        </Button>
      </CardFooter>
    </Card>
  )
}
