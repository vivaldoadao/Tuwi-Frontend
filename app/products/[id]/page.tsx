"use client"

import Image from "next/image"
import { notFound } from "next/navigation"
import { use, useState, useEffect } from "react"
import Link from "next/link"
import SiteHeader from "@/components/site-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatEuro } from "@/lib/currency"
import { getProductByIdWithStock, type Product, type ProductAdmin } from "@/lib/data-supabase"
import { useCart } from "@/context/cart-context"
import { useFavorites } from "@/context/favorites-context"
import { 
  ArrowLeft, 
  ShoppingCart, 
  Heart, 
  Share2, 
  Star, 
  Package, 
  Truck, 
  Shield, 
  CreditCard,
  Plus,
  Minus,
  CheckCircle,
  Info
} from "lucide-react"

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { addToCart, cartItems } = useCart() || { addToCart: () => {}, cartItems: [] }
  const { isFavoriteProduct, toggleFavoriteProduct } = useFavorites()
  
  // Estados locais
  const [product, setProduct] = useState<ProductAdmin | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  
  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true)
      try {
        const productData = await getProductByIdWithStock(id)
        setProduct(productData)
      } catch (error) {
        console.error('Error fetching product:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchProduct()
  }, [id])
  
  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <SiteHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-accent-500"></div>
        </div>
      </div>
    )
  }
  
  if (!product) {
    notFound()
  }

  const isLiked = isFavoriteProduct(product.id)

  // Use real product images from Supabase or fall back to placeholder
  const hasMultipleImages = product.images && product.images.length > 0
  const productImages = hasMultipleImages
    ? product.images 
    : [
        product.imageUrl || "/placeholder.svg",
        "/placeholder.svg?height=400&width=400&text=Imagem+2",
        "/placeholder.svg?height=400&width=400&text=Imagem+3",
        "/placeholder.svg?height=400&width=400&text=Imagem+4"
      ]

  const rating = 4.7
  const reviewCount = 124
  const stockQuantity = product.stockQuantity || 0
  const inStock = stockQuantity > 0

  // Verificar se produto já está no carrinho
  const cartItem = cartItems?.find(item => item.id === product.id)
  const quantityInCart = cartItem?.quantity || 0

  const handleAddToCart = async () => {
    if (!addToCart) return
    
    setIsAddingToCart(true)
    
    // Simular delay para feedback visual
    await new Promise(resolve => setTimeout(resolve, 500))
    
    for (let i = 0; i < quantity; i++) {
      addToCart(product)
    }
    
    setIsAddingToCart(false)
  }

  const increaseQuantity = () => {
    if (quantity < 10) { // Limite máximo de 10 unidades
      setQuantity(prev => prev + 1)
    }
  }

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <SiteHeader />
      
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-brand-800 via-brand-700 to-brand-600 text-white">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative container mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-6">
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 rounded-full"
            >
              <Link href="/products">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-heading">{product.name}</h1>
              <p className="text-white/80">Produto premium para você</p>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 -mt-8 relative z-10">
        <div className="container mx-auto px-4 space-y-8">
          
          {/* Product Info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Modern Product Gallery */}
            <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-3xl border-0 overflow-hidden group">
              <CardContent className="p-6">
                <div className="space-y-6">
                  {/* Main Image with modern styling */}
                  <div className="relative">
                    <div className="relative w-full max-w-md mx-auto h-80 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 shadow-lg group-hover:shadow-xl transition-all duration-500">
                      <Image
                        src={productImages[selectedImageIndex]}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        unoptimized={true}
                        priority
                      />
                      
                      {/* Image overlay gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      {/* Image counter */}
                      <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm">
                        {selectedImageIndex + 1} / {productImages.length}
                      </div>
                      
                      {/* Navigation arrows */}
                      {productImages.length > 1 && (
                        <>
                          <button
                            onClick={() => setSelectedImageIndex(prev => prev > 0 ? prev - 1 : productImages.length - 1)}
                            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
                          >
                            <ArrowLeft className="h-5 w-5 text-gray-700" />
                          </button>
                          
                          <button
                            onClick={() => setSelectedImageIndex(prev => prev < productImages.length - 1 ? prev + 1 : 0)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
                          >
                            <ArrowLeft className="h-5 w-5 text-gray-700 rotate-180" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Modern Thumbnail Gallery */}
                  {productImages.length > 1 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-700">Galeria ({productImages.length} imagens)</h4>
                        <div className="flex gap-1">
                          {productImages.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setSelectedImageIndex(index)}
                              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                selectedImageIndex === index 
                                  ? 'bg-accent-500 w-6' 
                                  : 'bg-gray-300 hover:bg-gray-400'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-3">
                        {productImages.map((image, index) => (
                          <button
                            key={index}
                            onClick={() => setSelectedImageIndex(index)}
                            className={`relative group/thumb w-full h-20 rounded-xl overflow-hidden bg-gray-100 transition-all duration-300 ${
                              selectedImageIndex === index 
                                ? 'ring-2 ring-accent-500 ring-offset-2 shadow-lg scale-105' 
                                : 'hover:ring-2 hover:ring-accent-300 hover:ring-offset-1 hover:shadow-md hover:scale-102'
                            }`}
                          >
                            <Image
                              src={image}
                              alt={`${product.name} - Imagem ${index + 1}`}
                              fill
                              className="object-cover transition-transform duration-300 group-hover/thumb:scale-110"
                              unoptimized={true}
                            />
                            
                            {/* Thumbnail overlay */}
                            <div className={`absolute inset-0 transition-all duration-300 ${
                              selectedImageIndex === index 
                                ? 'bg-accent-500/20' 
                                : 'bg-black/0 group-hover/thumb:bg-black/10'
                            }`} />
                            
                            {/* Selected indicator */}
                            {selectedImageIndex === index && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-6 h-6 bg-accent-500 rounded-full flex items-center justify-center">
                                  <CheckCircle className="h-4 w-4 text-white" />
                                </div>
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Modern Product Details */}
            <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-3xl border-0 hover:shadow-2xl transition-all duration-500">
              <CardContent className="p-6 space-y-6">
                
                {/* Price and Actions */}
                <div className="space-y-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="text-3xl font-bold bg-gradient-to-r from-accent-600 to-accent-500 bg-clip-text text-transparent">
                        {formatEuro(product.price)}
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-200 transition-colors">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Melhor Preço
                        </Badge>
                        <Badge variant="outline" className="border-accent-200 text-accent-700">
                          Frete Grátis
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleFavoriteProduct(product.id)}
                        className={`w-12 h-12 rounded-full transition-all duration-300 ${
                          isLiked 
                            ? 'text-pink-600 bg-pink-50 hover:bg-pink-100 scale-110 shadow-lg' 
                            : 'text-gray-500 hover:text-pink-600 hover:bg-pink-50 hover:scale-110'
                        }`}
                      >
                        <Heart className={`h-6 w-6 transition-transform duration-300 ${
                          isLiked ? 'fill-current scale-110' : 'hover:scale-110'
                        }`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-12 h-12 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-50 hover:scale-110 transition-all duration-300"
                      >
                        <Share2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Rating with modern styling */}
                  <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl border border-yellow-200">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-5 w-5 transition-all duration-300 ${
                            i < Math.floor(rating) 
                              ? 'fill-yellow-400 text-yellow-400 scale-110' 
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-yellow-700">{rating}</span>
                      <span className="text-sm text-gray-600">({reviewCount} avaliações)</span>
                    </div>
                  </div>
                </div>

                {/* Modern Status */}
                <div className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-300 ${
                  inStock 
                    ? 'bg-green-50 border-green-200 hover:bg-green-100' 
                    : 'bg-red-50 border-red-200 hover:bg-red-100'
                }`}>
                  {inStock ? (
                    <>
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg"></div>
                      <CheckCircle className="h-6 w-6 text-green-600" />
                      <div className="flex-1">
                        <span className="text-green-800 font-semibold text-base">Em estoque</span>
                        <p className="text-green-600 text-sm">Disponível para entrega imediata</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-3 h-3 bg-red-500 rounded-full shadow-lg"></div>
                      <Info className="h-6 w-6 text-red-600" />
                      <div className="flex-1">
                        <span className="text-red-800 font-semibold text-base">Fora de estoque</span>
                        <p className="text-red-600 text-sm">Produto temporariamente indisponível</p>
                      </div>
                    </>
                  )}
                </div>

                {/* Modern Description */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-6 bg-gradient-to-b from-accent-500 to-accent-600 rounded-full"></div>
                    <h3 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      Sobre o Produto
                    </h3>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <p className="text-gray-700 leading-relaxed text-base">
                      {product.longDescription || product.description}
                    </p>
                  </div>
                </div>

                {/* Modern Quantity Selector */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-6 bg-gradient-to-b from-accent-500 to-accent-600 rounded-full"></div>
                    <h3 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      Quantidade
                    </h3>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={decreaseQuantity}
                      disabled={quantity <= 1}
                      className="w-12 h-12 rounded-xl border-2 hover:border-accent-300 hover:bg-accent-50 transition-all duration-300 disabled:opacity-50"
                    >
                      <Minus className="h-5 w-5" />
                    </Button>
                    
                    <div className="flex-1 text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {quantity}
                      </div>
                      <div className="text-sm text-gray-500">
                        {quantity === 1 ? 'unidade' : 'unidades'}
                      </div>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={increaseQuantity}
                      disabled={quantity >= 10}
                      className="w-12 h-12 rounded-xl border-2 hover:border-accent-300 hover:bg-accent-50 transition-all duration-300 disabled:opacity-50"
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                  </div>
                  
                  {quantityInCart > 0 && (
                    <div className="flex items-center gap-2 p-3 bg-accent-50 rounded-xl border border-accent-200">
                      <ShoppingCart className="h-4 w-4 text-accent-600" />
                      <p className="text-sm text-accent-700 font-medium">
                        {quantityInCart} unidade(s) já no carrinho
                      </p>
                    </div>
                  )}
                </div>

                {/* Modern Add to Cart Button */}
                <div className="space-y-4">
                  <Button
                    onClick={handleAddToCart}
                    disabled={!inStock || isAddingToCart}
                    className="w-full bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white h-12 text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 disabled:opacity-50"
                  >
                    {isAddingToCart ? (
                      <div className="flex items-center gap-3">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                        <span>Adicionando ao carrinho...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <ShoppingCart className="h-6 w-6" />
                        <span>Adicionar ao Carrinho</span>
                        <div className="ml-auto bg-white/20 px-3 py-1 rounded-lg">
                          {formatEuro(product.price * quantity)}
                        </div>
                      </div>
                    )}
                  </Button>
                  
                  {/* Trust badges */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="flex flex-col items-center gap-1 p-2">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <Truck className="h-4 w-4 text-green-600" />
                      </div>
                      <span className="text-xs text-gray-600">Entrega Rápida</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 p-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Shield className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="text-xs text-gray-600">Compra Segura</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 p-2">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <CreditCard className="h-4 w-4 text-purple-600" />
                      </div>
                      <span className="text-xs text-gray-600">Parcelado</span>
                    </div>
                  </div>
                </div>

              </CardContent>
            </Card>
          </div>

          {/* Related Products Section */}
          <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-3xl border-0">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-3xl font-bold font-heading text-gray-900">
                Produtos Relacionados
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="text-center text-gray-600">
                <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>Produtos relacionados em breve...</p>
              </div>
            </CardContent>
          </Card>

        </div>
      </main>

      {/* Modern Footer */}
      <footer className="bg-gradient-to-r from-brand-800 via-brand-700 to-brand-600 text-white py-12 mt-16">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Image
              src="/wilnara-logo.png"
              alt="Wilnara Tranças Logo"
              width={40}
              height={40}
              className="rounded-full"
              unoptimized={true}
            />
            <span className="text-2xl font-bold font-heading text-accent-300">WILNARA TRANÇAS</span>
          </div>
          <p className="text-white/80">
            © {new Date().getFullYear()} Wilnara Tranças. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}