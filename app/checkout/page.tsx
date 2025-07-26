"use client"

import SiteHeader from "@/components/site-header"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCart } from "@/context/cart-context"
import { useNotificationHelpers } from "@/hooks/use-notification-helpers"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Separator } from "@/components/ui/separator"

export default function CheckoutPage() {
  const { cartItems, cartTotal, clearCart } = useCart()
  const { notifyOrderPlaced, notifySuccess } = useNotificationHelpers()
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    zipCode: ''
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)

    // Simulate order processing
    try {
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Generate order ID
      const orderId = 'WIL' + Date.now()
      
      // Trigger order confirmation notification
      notifyOrderPlaced(orderId)
      
      // Clear cart
      clearCart()
      
      // Redirect to success page or home
      router.push('/')
      
    } catch (error) {
      console.error('Error processing order:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  if (cartItems.length === 0) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900">
        <SiteHeader />
        <main className="flex-1 py-12 md:py-20">
          <div className="container px-4 md:px-6">
            <Card className="bg-white text-gray-900 p-8 text-center max-w-2xl mx-auto shadow-lg rounded-lg">
              <CardTitle className="text-3xl mb-4 text-brand-primary">Carrinho Vazio</CardTitle>
              <p className="text-lg mb-6 text-gray-700">
                Seu carrinho está vazio. Adicione alguns produtos antes de finalizar a compra.
              </p>
              <Button asChild className="bg-brand-accent hover:bg-brand-background text-brand-primary hover:text-white">
                <Link href="/products">Ver Produtos</Link>
              </Button>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900">
      <SiteHeader />
      <main className="flex-1 py-12 md:py-20">
        <div className="container px-4 md:px-6">
          <h1 className="text-4xl font-bold text-center mb-10 text-brand-primary">Finalizar Compra</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Order Summary */}
            <Card className="bg-white shadow-lg rounded-lg">
              <CardTitle className="text-2xl mb-4 p-6 border-b text-brand-primary">Resumo do Pedido</CardTitle>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          width={50}
                          height={50}
                          className="rounded-md"
                          unoptimized={true}
                        />
                        <div>
                          <h4 className="font-medium">{item.name}</h4>
                          <p className="text-sm text-gray-600">Qtd: {item.quantity}</p>
                        </div>
                      </div>
                      <p className="font-semibold">€{(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
                
                <Separator className="my-4" />
                
                <div className="flex justify-between items-center text-xl font-bold text-brand-primary">
                  <span>Total:</span>
                  <span>€{cartTotal.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Checkout Form */}
            <Card className="bg-white shadow-lg rounded-lg">
              <CardTitle className="text-2xl mb-4 p-6 border-b text-brand-primary">Dados de Entrega</CardTitle>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Nome Completo</Label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="mt-1"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="address">Endereço</Label>
                    <Input
                      id="address"
                      name="address"
                      type="text"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                      className="mt-1"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">Cidade</Label>
                      <Input
                        id="city"
                        name="city"
                        type="text"
                        value={formData.city}
                        onChange={handleInputChange}
                        required
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="zipCode">Código Postal</Label>
                      <Input
                        id="zipCode"
                        name="zipCode"
                        type="text"
                        value={formData.zipCode}
                        onChange={handleInputChange}
                        required
                        className="mt-1"
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-4 pt-6">
                    <Button 
                      type="button" 
                      variant="outline" 
                      asChild 
                      className="flex-1"
                    >
                      <Link href="/cart">Voltar ao Carrinho</Link>
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isProcessing}
                      className="flex-1 bg-brand-accent hover:bg-brand-background text-brand-primary hover:text-white"
                    >
                      {isProcessing ? 'Processando...' : 'Finalizar Pedido'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <footer className="bg-brand-primary text-white py-8">
        <div className="container px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image
              src="/wilnara-logo.png"
              alt="Wilnara Tranças Logo"
              width={30}
              height={30}
              className="rounded-full"
              unoptimized={true}
            />
            <span className="text-lg font-bold text-brand-accent">WILNARA TRANÇAS</span>
          </div>
          <p className="text-sm text-white/80">
            © {new Date().getFullYear()} Wilnara Tranças. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}