"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { ProductWithRealRating } from "@/lib/data-supabase-ratings"
import { useCart } from "@/context/cart-context"
import { useFavorites } from "@/context/favorites-context"
import { Heart, ShoppingCart, Star, Eye, Package, AlertTriangle } from "lucide-react"

interface ProductCardV2Props {
  product: ProductWithRealRating
}

export default function ProductCardV2({ product }: ProductCardV2Props) {
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

  // DADOS REAIS DO BANCO DE DADOS (não mais mock!)
  const rating = product.averageRating || 0
  const reviewCount = product.totalReviews || 0
  const stockStatus = product.stockStatus
  const isInStock = product.isInStock

  // Função para formatar rating
  const formatRating = (rating: number) => {
    return rating > 0 ? rating.toFixed(1) : '0.0'
  }

  // Função para obter cor do badge baseado no status do estoque
  const getStockBadgeClass = () => {
    switch (stockStatus) {
      case 'in_stock':
        return "bg-green-500 hover:bg-green-500 text-white"
      case 'low_stock':
        return "bg-yellow-500 hover:bg-yellow-500 text-white"
      case 'out_of_stock':
        return "bg-red-500 hover:bg-red-500 text-white"
      default:
        return "bg-gray-500 hover:bg-gray-500 text-white"
    }
  }

  const getStockLabel = () => {
    switch (stockStatus) {
      case 'in_stock':
        return 'Em Estoque'
      case 'low_stock':
        return 'Últimas Unidades'
      case 'out_of_stock':
        return 'Fora de Estoque'
      default:
        return 'Estoque'
    }
  }

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

        {/* Stock status badge - DADOS REAIS DO BANCO */}
        <div className="absolute top-4 left-4">
          <Badge className={`px-3 py-1 rounded-full ${getStockBadgeClass()}`}>
            {getStockLabel()}
          </Badge>
        </div>
      </div>
      
      <CardContent className="p-6 space-y-4">
        {/* Product name and rating - DADOS REAIS DO BANCO */}
        <div className="space-y-2">
          <Link href={`/products/${product.id}`}>
            <CardTitle className="text-xl font-semibold text-gray-900 group-hover:text-brand-700 transition-colors line-clamp-2 font-heading">
              {product.name}
            </CardTitle>
          </Link>
          
          {/* Rating with real data from database */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Star className={`h-4 w-4 ${rating > 0 ? 'fill-accent-400 text-accent-400' : 'fill-gray-300 text-gray-300'}`} />
              <span className={`text-sm font-medium ${rating > 0 ? 'text-gray-700' : 'text-gray-400'}`}>
                {formatRating(rating)}
              </span>
            </div>
            <span className={`text-sm ${reviewCount > 0 ? 'text-gray-500' : 'text-gray-400'}`}>
              ({reviewCount} {reviewCount === 1 ? 'avaliação' : 'avaliações'})
            </span>
            {/* Indicador visual de dados reais */}
            {rating > 0 && (
              <Badge variant="secondary" className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5">
                Real
              </Badge>
            )}
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
            {/* Stock status indicator with real data */}
            <div>
              {stockStatus === 'out_of_stock' ? (
                <Badge variant="secondary" className="bg-red-100 text-red-800 text-xs">
                  <Package className="h-3 w-3 mr-1" />
                  Sem estoque
                </Badge>
              ) : stockStatus === 'low_stock' ? (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Últimas unidades
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                  <Package className="h-3 w-3 mr-1" />
                  Em estoque
                </Badge>
              )}
            </div>
          </div>
          
          {/* Stats adicionais com dados reais */}
          {rating > 0 && (
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <div className="text-center">
                <div className="text-lg font-bold text-brand-600">{formatRating(rating)}</div>
                <div className="text-xs text-gray-500">Rating</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-gray-700">{reviewCount}</div>
                <div className="text-xs text-gray-500">Reviews</div>
              </div>
              <div className="text-center">
                <div className={`text-lg font-bold ${isInStock ? 'text-green-600' : 'text-red-600'}`}>
                  {isInStock ? '✓' : '✗'}
                </div>
                <div className="text-xs text-gray-500">Stock</div>
              </div>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-6 pt-0">
        <Button
          onClick={handleAddToCart}
          disabled={!isInStock}
          className="w-full bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          {!isInStock ? 'Fora de Estoque' : 'Adicionar ao Carrinho'}
        </Button>
      </CardFooter>
    </Card>
  )
}