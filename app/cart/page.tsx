"use client"

import Image from "next/image"
import Link from "next/link"
import SiteHeader from "@/components/site-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useCart } from "@/context/cart-context"
import { CustomerGuard } from "@/components/role-guard"
import { 
  Minus, 
  Plus, 
  Trash2, 
  ShoppingBag, 
  ArrowLeft, 
  CreditCard, 
  Truck, 
  Shield, 
  Heart,
  Package,
  AlertCircle,
  CheckCircle
} from "lucide-react"
import { useState } from "react"

export default function CartPage() {
  const { cartItems, updateQuantity, removeFromCart, cartTotal, clearCart } = useCart() || {
    cartItems: [],
    updateQuantity: () => {},
    removeFromCart: () => {},
    cartTotal: 0,
    clearCart: () => {}
  }
  
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  // Cálculos do carrinho
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)
  const savings = cartTotal * 0.1 // Simular 10% de economia
  const shipping = cartTotal > 50 ? 0 : 5.99
  const finalTotal = cartTotal + shipping

  const handleQuantityUpdate = async (itemId: string, newQuantity: number) => {
    setIsUpdating(itemId)
    // Simular delay para feedback visual
    await new Promise(resolve => setTimeout(resolve, 300))
    updateQuantity(itemId, newQuantity)
    setIsUpdating(null)
  }

  const handleRemoveItem = async (itemId: string) => {
    setIsUpdating(itemId)
    await new Promise(resolve => setTimeout(resolve, 300))
    removeFromCart(itemId)
    setIsUpdating(null)
  }

  const handleClearCart = () => {
    if (showClearConfirm) {
      clearCart()
      setShowClearConfirm(false)
    } else {
      setShowClearConfirm(true)
      setTimeout(() => setShowClearConfirm(false), 3000)
    }
  }

  return (
    <CustomerGuard redirectTo="/login">
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
              <h1 className="text-2xl md:text-3xl font-bold font-heading">Carrinho de Compras</h1>
              <p className="text-white/80">
                {itemCount > 0 ? `${itemCount} ${itemCount === 1 ? 'item' : 'itens'} no carrinho` : 'Carrinho vazio'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 -mt-8 relative z-10">
        <div className="container mx-auto px-4 space-y-8">
          
          {cartItems.length === 0 ? (
            /* Empty Cart State */
            <Card className="bg-white/95 backdrop-blur-sm shadow-2xl rounded-3xl border-0 overflow-hidden">
              <CardContent className="text-center py-12 px-6">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShoppingBag className="h-10 w-10 text-gray-400" />
                </div>
                <h2 className="text-2xl font-bold font-heading text-gray-900 mb-3">
                  Seu carrinho está vazio
                </h2>
                <p className="text-base text-gray-600 mb-6 max-w-md mx-auto">
                  Parece que você ainda não adicionou nenhum produto. Que tal explorar nossa coleção?
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    asChild
                    className="bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white px-6 py-2 text-base font-semibold rounded-xl shadow-lg"
                  >
                    <Link href="/products">
                      <Package className="mr-2 h-5 w-5" />
                      Explorar Produtos
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="px-6 py-2 text-base font-semibold rounded-xl"
                  >
                    <Link href="/braiders">
                      <Heart className="mr-2 h-5 w-5" />
                      Ver Trancistas
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid lg:grid-cols-3 gap-8">
              
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-3xl border-0">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl font-bold font-heading text-gray-900 flex items-center gap-2">
                        <ShoppingBag className="h-6 w-6" />
                        Seus Produtos ({itemCount})
                      </CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleClearCart}
                        className={`rounded-xl transition-all duration-300 ${
                          showClearConfirm 
                            ? 'bg-red-500 text-white border-red-500 hover:bg-red-600' 
                            : 'border-red-300 text-red-600 hover:bg-red-50'
                        }`}
                      >
                        {showClearConfirm ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Confirmar
                          </>
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4 mr-1" />
                            Limpar Tudo
                          </>
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {cartItems.map((item) => (
                      <div
                        key={item.id}
                        className={`relative bg-gray-50 rounded-xl p-4 transition-all duration-300 ${
                          isUpdating === item.id ? 'opacity-50' : 'hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <Image
                              src={item.imageUrl || "/placeholder.svg"}
                              alt={item.name}
                              width={80}
                              height={80}
                              className="rounded-lg object-cover shadow-md"
                              unoptimized={true}
                            />
                            <Badge className="absolute -top-2 -right-2 bg-accent-500 text-white">
                              {item.quantity}
                            </Badge>
                          </div>
                          
                          <div className="flex-1 space-y-2">
                            <div>
                              <Link href={`/products/${item.id}`}>
                                <h3 className="text-lg font-bold font-heading text-gray-900 hover:text-accent-600 transition-colors">
                                  {item.name}
                                </h3>
                              </Link>
                              <p className="text-gray-600 mt-1">{item.description}</p>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="text-xl font-bold text-accent-600">
                                  €{item.price.toFixed(2)}
                                </span>
                                <span className="text-sm text-gray-500">por unidade</span>
                              </div>
                              
                              <div className="text-right">
                                <div className="text-sm text-gray-500">Subtotal</div>
                                <div className="text-lg font-bold text-gray-900">
                                  €{(item.price * item.quantity).toFixed(2)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-gray-700">Quantidade:</span>
                            <div className="flex items-center border-2 border-gray-200 rounded-xl bg-white">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleQuantityUpdate(item.id, item.quantity - 1)}
                                disabled={item.quantity <= 1 || isUpdating === item.id}
                                className="h-10 w-10 rounded-l-xl"
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="w-12 text-center font-semibold">
                                {item.quantity}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleQuantityUpdate(item.id, item.quantity + 1)}
                                disabled={isUpdating === item.id}
                                className="h-10 w-10 rounded-r-xl"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveItem(item.id)}
                            disabled={isUpdating === item.id}
                            className="text-red-600 border-red-300 hover:bg-red-50 rounded-xl"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Remover
                          </Button>
                        </div>

                        {isUpdating === item.id && (
                          <div className="absolute inset-0 bg-white/50 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-500"></div>
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1 space-y-6">
                <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-3xl border-0 sticky top-8">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold font-heading text-gray-900 flex items-center gap-2">
                      <CreditCard className="h-6 w-6" />
                      Resumo do Pedido
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between text-gray-700">
                        <span>Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'itens'})</span>
                        <span>€{cartTotal.toFixed(2)}</span>
                      </div>
                      
                      {savings > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Economia</span>
                          <span>-€{savings.toFixed(2)}</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between text-gray-700">
                        <span className="flex items-center gap-2">
                          <Truck className="h-4 w-4" />
                          Entrega
                        </span>
                        <span>
                          {shipping === 0 ? (
                            <Badge className="bg-green-500 text-white">Grátis</Badge>
                          ) : (
                            `€${shipping.toFixed(2)}`
                          )}
                        </span>
                      </div>
                      
                      {cartTotal < 50 && (
                        <div className="bg-blue-50 p-3 rounded-xl">
                          <div className="flex items-center gap-2 text-blue-700 text-sm">
                            <AlertCircle className="h-4 w-4" />
                            <span>Faltam €{(50 - cartTotal).toFixed(2)} para frete grátis!</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <hr className="border-gray-300" />
                    
                    <div className="flex justify-between text-lg font-bold text-gray-900">
                      <span>Total</span>
                      <span className="text-accent-600">€{finalTotal.toFixed(2)}</span>
                    </div>

                    <Button
                      asChild
                      className="w-full bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white px-6 py-3 text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <Link href="/checkout">
                        <CreditCard className="mr-2 h-5 w-5" />
                        Finalizar Compra
                      </Link>
                    </Button>

                    <Button
                      asChild
                      variant="outline"
                      className="w-full rounded-xl"
                    >
                      <Link href="/products">Continuar Comprando</Link>
                    </Button>
                  </CardContent>
                </Card>

                {/* Benefits Cards */}
                <div className="space-y-4">
                  <Card className="bg-white/90 backdrop-blur-sm shadow-lg rounded-2xl border-0 p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-accent-100 rounded-full flex items-center justify-center">
                        <Truck className="h-5 w-5 text-accent-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Entrega Rápida</h4>
                        <p className="text-sm text-gray-600">2-3 dias úteis</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="bg-white/90 backdrop-blur-sm shadow-lg rounded-2xl border-0 p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <Shield className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Compra Segura</h4>
                        <p className="text-sm text-gray-600">Pagamento protegido</p>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          )}

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
    </CustomerGuard>
  )
}
