"use client"

import Image from "next/image"
import { notFound } from "next/navigation"
import { use, useState } from "react"
import Link from "next/link"
import SiteHeader from "@/components/site-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getProductById, type Product } from "@/lib/data"
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
  const product = getProductById(id)
  const { addToCart, cartItems } = useCart() || { addToCart: () => {}, cartItems: [] }
  const { isFavoriteProduct, toggleFavoriteProduct } = useFavorites()
  
  // Estados locais
  const [quantity, setQuantity] = useState(1)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  
  if (!product) {
    notFound()
  }

  const isLiked = isFavoriteProduct(product.id)

  // Mock data para demonstração
  const productImages = [
    product.imageUrl || "/placeholder.svg",
    "/placeholder.svg?height=400&width=400&text=Imagem+2",
    "/placeholder.svg?height=400&width=400&text=Imagem+3",
    "/placeholder.svg?height=400&width=400&text=Imagem+4"
  ]

  const rating = 4.7
  const reviewCount = 124
  const inStock = true // Sempre em estoque para demo

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
            
            {/* Product Images */}
            <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-3xl border-0 overflow-hidden">
              <CardContent className="p-8">
                <div className="space-y-4">
                  {/* Main Image */}
                  <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100">
                    <Image
                      src={productImages[selectedImageIndex]}
                      alt={product.name}
                      width={500}
                      height={500}
                      className="w-full h-full object-cover"
                      unoptimized={true}
                    />
                  </div>
                  
                  {/* Thumbnail Images */}
                  <div className="grid grid-cols-4 gap-2">
                    {productImages.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`aspect-square rounded-lg overflow-hidden bg-gray-100 border-2 transition-all duration-300 ${
                          selectedImageIndex === index 
                            ? 'border-accent-500 ring-2 ring-accent-200' 
                            : 'border-gray-200 hover:border-accent-300'
                        }`}
                      >
                        <Image
                          src={image}
                          alt={`${product.name} - Imagem ${index + 1}`}
                          width={100}
                          height={100}
                          className="w-full h-full object-cover"
                          unoptimized={true}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Product Details */}
            <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-3xl border-0">
              <CardContent className="p-8 space-y-6">
                
                {/* Price and Rating */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-4xl font-bold text-accent-600">
                      €{product.price.toFixed(2)}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleFavoriteProduct(product.id)}
                        className={`rounded-full ${
                          isLiked 
                            ? 'text-pink-600 bg-pink-50 hover:bg-pink-100' 
                            : 'text-gray-500 hover:text-pink-600 hover:bg-pink-50'
                        }`}
                      >
                        <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full text-gray-500 hover:text-gray-700"
                      >
                        <Share2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">
                      {rating} ({reviewCount} avaliações)
                    </span>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center gap-2">
                  {inStock ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-green-700 font-medium">Em estoque</span>
                    </>
                  ) : (
                    <>
                      <Info className="h-5 w-5 text-red-600" />
                      <span className="text-red-700 font-medium">Fora de estoque</span>
                    </>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-gray-900">Descrição</h3>
                  <p className="text-gray-600 leading-relaxed">
                    {product.description}
                  </p>
                </div>

                {/* Quantity Selector */}
                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-gray-900">Quantidade</h3>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={decreaseQuantity}
                      disabled={quantity <= 1}
                      className="rounded-full"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="text-xl font-bold min-w-[3rem] text-center">
                      {quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={increaseQuantity}
                      disabled={quantity >= 10}
                      className="rounded-full"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {quantityInCart > 0 && (
                    <p className="text-sm text-accent-600">
                      {quantityInCart} unidade(s) já no carrinho
                    </p>
                  )}
                </div>

                {/* Add to Cart Button */}
                <Button
                  onClick={handleAddToCart}
                  disabled={!inStock || isAddingToCart}
                  className="w-full bg-accent-500 hover:bg-accent-600 text-white h-12 text-lg font-semibold rounded-xl"
                >
                  {isAddingToCart ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Adicionando...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5" />
                      Adicionar ao Carrinho
                    </div>
                  )}
                </Button>

                {/* Features */}
                <div className="grid grid-cols-1 gap-4 pt-6 border-t border-gray-200">
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Truck className="h-4 w-4 text-green-600" />
                    </div>
                    <span>Entrega gratuita em pedidos acima de €50</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Shield className="h-4 w-4 text-blue-600" />
                    </div>
                    <span>Garantia de qualidade de 30 dias</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <CreditCard className="h-4 w-4 text-purple-600" />
                    </div>
                    <span>Pagamento seguro e parcelado</span>
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