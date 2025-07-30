"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import SiteHeader from "@/components/site-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useCart } from "@/context/cart-context"
import { formatEuro } from "@/lib/currency"
import { 
  ShoppingBag, 
  CreditCard, 
  Truck, 
  Shield, 
  User, 
  Lock,
  CheckCircle,
  ArrowLeft,
  Plus,
  Minus,
  Trash2
} from "lucide-react"
import { toast } from "react-hot-toast"

export default function CheckoutPage() {
  const { cartItems, updateQuantity, removeFromCart, clearCart, cartTotal } = useCart()
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)
  const [step] = useState(1) // 1: Info, 2: Payment, 3: Confirmation
  
  // Form states
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    country: "Portugal"
  })
  
  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardHolder: ""
  })
  
  const [orderNotes, setOrderNotes] = useState("")
  const [selectedShipping, setSelectedShipping] = useState("standard")

  // Redirect if cart is empty
  useEffect(() => {
    if (!cartItems || cartItems.length === 0) {
      router.push('/cart')
    }
  }, [cartItems, router])

  if (!cartItems || cartItems.length === 0) {
    return null
  }

  const totalPrice = cartTotal
  const shippingCost = selectedShipping === "express" ? 9.99 : selectedShipping === "standard" ? 4.99 : 0
  const finalTotal = totalPrice + shippingCost

  const handleCustomerInfoChange = (field: string, value: string) => {
    setCustomerInfo(prev => ({ ...prev, [field]: value }))
  }

  const handlePaymentInfoChange = (field: string, value: string) => {
    setPaymentInfo(prev => ({ ...prev, [field]: value }))
  }

  const handleProcessOrder = async () => {
    setIsProcessing(true)
    
    try {
      // Simulate order processing
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Clear cart and redirect to success
      clearCart()
      toast.success('Pedido realizado com sucesso!')
      router.push('/')
    } catch (error) {
      toast.error('Erro ao processar pedido. Tente novamente.')
    } finally {
      setIsProcessing(false)
    }
  }

  const canProceedToPayment = () => {
    return customerInfo.name && customerInfo.email && customerInfo.phone && 
           customerInfo.address && customerInfo.city && customerInfo.postalCode
  }

  const canPlaceOrder = () => {
    return canProceedToPayment() && paymentInfo.cardNumber && 
           paymentInfo.expiryDate && paymentInfo.cvv && paymentInfo.cardHolder
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <SiteHeader />
      
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-brand-800 via-brand-700 to-brand-600 text-white">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative container mx-auto px-4 py-12">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="text-white hover:bg-white/20 rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold font-heading">Finalizar Compra</h1>
              <p className="text-white/90 text-lg">Complete seu pedido de forma segura</p>
            </div>
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center gap-4 max-w-md">
            {[1, 2, 3].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                  step >= stepNum 
                    ? 'bg-accent-500 text-white shadow-lg' 
                    : 'bg-white/20 text-white/70'
                }`}>
                  {step > stepNum ? <CheckCircle className="h-5 w-5" /> : stepNum}
                </div>
                {stepNum < 3 && (
                  <div className={`w-12 h-0.5 mx-2 transition-all duration-300 ${
                    step > stepNum ? 'bg-accent-500' : 'bg-white/30'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <main className="flex-1 -mt-8 relative z-10">
        <div className="container mx-auto px-4 space-y-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Customer Information */}
              <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-3xl border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-2xl font-bold text-gray-900">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      step >= 1 ? 'bg-accent-500 text-white' : 'bg-gray-200 text-gray-600'
                    }`}>
                      <User className="h-4 w-4" />
                    </div>
                    Informações de Entrega
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                        Nome Completo *
                      </Label>
                      <Input
                        id="name"
                        value={customerInfo.name}
                        onChange={(e) => handleCustomerInfoChange('name', e.target.value)}
                        placeholder="Seu nome completo"
                        className="bg-gray-50 border-gray-200 focus:bg-white"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                        Email *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={customerInfo.email}
                        onChange={(e) => handleCustomerInfoChange('email', e.target.value)}
                        placeholder="seu@email.com"
                        className="bg-gray-50 border-gray-200 focus:bg-white"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                        Telefone *
                      </Label>
                      <Input
                        id="phone"
                        value={customerInfo.phone}
                        onChange={(e) => handleCustomerInfoChange('phone', e.target.value)}
                        placeholder="+351 900 000 000"
                        className="bg-gray-50 border-gray-200 focus:bg-white"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="country" className="text-sm font-medium text-gray-700">
                        País
                      </Label>
                      <Select value={customerInfo.country} onValueChange={(value) => handleCustomerInfoChange('country', value)}>
                        <SelectTrigger className="bg-gray-50 border-gray-200 focus:bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Portugal">Portugal</SelectItem>
                          <SelectItem value="Brasil">Brasil</SelectItem>
                          <SelectItem value="Espanha">Espanha</SelectItem>
                          <SelectItem value="França">França</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-sm font-medium text-gray-700">
                      Endereço Completo *
                    </Label>
                    <Input
                      id="address"
                      value={customerInfo.address}
                      onChange={(e) => handleCustomerInfoChange('address', e.target.value)}
                      placeholder="Rua, número, apartamento"
                      className="bg-gray-50 border-gray-200 focus:bg-white"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-sm font-medium text-gray-700">
                        Cidade *
                      </Label>
                      <Input
                        id="city"
                        value={customerInfo.city}
                        onChange={(e) => handleCustomerInfoChange('city', e.target.value)}
                        placeholder="Lisboa"
                        className="bg-gray-50 border-gray-200 focus:bg-white"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="postalCode" className="text-sm font-medium text-gray-700">
                        Código Postal *
                      </Label>
                      <Input
                        id="postalCode"
                        value={customerInfo.postalCode}
                        onChange={(e) => handleCustomerInfoChange('postalCode', e.target.value)}
                        placeholder="1000-001"
                        className="bg-gray-50 border-gray-200 focus:bg-white"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Shipping Options */}
              <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-3xl border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-2xl font-bold text-gray-900">
                    <Truck className="h-6 w-6 text-accent-500" />
                    Opções de Entrega
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { id: "free", name: "Entrega Gratuita", time: "5-7 dias úteis", price: 0 },
                    { id: "standard", name: "Entrega Standard", time: "2-3 dias úteis", price: 4.99 },
                    { id: "express", name: "Entrega Express", time: "24-48 horas", price: 9.99 }
                  ].map((option) => (
                    <div
                      key={option.id}
                      onClick={() => setSelectedShipping(option.id)}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
                        selectedShipping === option.id 
                          ? 'border-accent-500 bg-accent-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-gray-900">{option.name}</div>
                          <div className="text-sm text-gray-600">{option.time}</div>
                        </div>
                        <div className="text-lg font-bold text-accent-600">
                          {option.price === 0 ? 'Grátis' : formatEuro(option.price)}
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Payment Information */}
              <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-3xl border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-2xl font-bold text-gray-900">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      step >= 2 ? 'bg-accent-500 text-white' : 'bg-gray-200 text-gray-600'
                    }`}>
                      <CreditCard className="h-4 w-4" />
                    </div>
                    Informações de Pagamento
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="cardHolder" className="text-sm font-medium text-gray-700">
                        Nome no Cartão *
                      </Label>
                      <Input
                        id="cardHolder"
                        value={paymentInfo.cardHolder}
                        onChange={(e) => handlePaymentInfoChange('cardHolder', e.target.value)}
                        placeholder="Nome como aparece no cartão"
                        className="bg-gray-50 border-gray-200 focus:bg-white"
                        disabled={!canProceedToPayment()}
                      />
                    </div>
                    
                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="cardNumber" className="text-sm font-medium text-gray-700">
                        Número do Cartão *
                      </Label>
                      <Input
                        id="cardNumber"
                        value={paymentInfo.cardNumber}
                        onChange={(e) => handlePaymentInfoChange('cardNumber', e.target.value)}
                        placeholder="1234 5678 9012 3456"
                        className="bg-gray-50 border-gray-200 focus:bg-white"
                        disabled={!canProceedToPayment()}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="expiryDate" className="text-sm font-medium text-gray-700">
                        Data de Expiração *
                      </Label>
                      <Input
                        id="expiryDate"
                        value={paymentInfo.expiryDate}
                        onChange={(e) => handlePaymentInfoChange('expiryDate', e.target.value)}
                        placeholder="MM/AA"
                        className="bg-gray-50 border-gray-200 focus:bg-white"
                        disabled={!canProceedToPayment()}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="cvv" className="text-sm font-medium text-gray-700">
                        CVV *
                      </Label>
                      <Input
                        id="cvv"
                        value={paymentInfo.cvv}
                        onChange={(e) => handlePaymentInfoChange('cvv', e.target.value)}
                        placeholder="123"
                        className="bg-gray-50 border-gray-200 focus:bg-white"
                        disabled={!canProceedToPayment()}
                      />
                    </div>
                  </div>
                  
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <Shield className="h-5 w-5 text-blue-600" />
                      <div className="text-sm text-blue-800">
                        <div className="font-semibold">Pagamento 100% Seguro</div>
                        <div>Seus dados são protegidos com criptografia SSL</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Order Notes */}
              <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-3xl border-0">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-900">
                    Observações do Pedido (Opcional)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="Instruções especiais para entrega, preferências, etc."
                    className="bg-gray-50 border-gray-200 focus:bg-white min-h-24"
                  />
                </CardContent>
              </Card>
            </div>

            {/* Order Summary Sidebar */}
            <div className="space-y-6">
              
              {/* Cart Items */}
              <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-3xl border-0 sticky top-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-900">
                    <ShoppingBag className="h-5 w-5 text-accent-500" />
                    Resumo do Pedido
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  {/* Items */}
                  <div className="space-y-4 max-h-64 overflow-y-auto">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-2xl">
                        <Image
                          src={item.imageUrl || "/placeholder.svg"}
                          alt={item.name}
                          width={60}
                          height={60}
                          className="rounded-xl object-cover"
                          unoptimized={true}
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 text-sm line-clamp-2">{item.name}</h4>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex items-center gap-1">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-red-500 hover:text-red-700"
                              onClick={() => removeFromCart(item.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="text-sm font-bold text-accent-600 mt-1">
                            {formatEuro(item.price * item.quantity)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  {/* Totals */}
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-semibold">{formatEuro(totalPrice)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Entrega</span>
                      <span className="font-semibold">
                        {shippingCost === 0 ? 'Grátis' : formatEuro(shippingCost)}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-accent-600">{formatEuro(finalTotal)}</span>
                    </div>
                  </div>

                  {/* Place Order Button */}
                  <Button
                    onClick={handleProcessOrder}
                    disabled={!canPlaceOrder() || isProcessing}
                    className="w-full bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white h-14 text-lg font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <div className="flex items-center gap-3">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Processando...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <Lock className="h-5 w-5" />
                        <span>Finalizar Pedido</span>
                        <div className="ml-auto bg-white/20 px-3 py-1 rounded-lg">
                          {formatEuro(finalTotal)}
                        </div>
                      </div>
                    )}
                  </Button>

                  {/* Trust Indicators */}
                  <div className="grid grid-cols-2 gap-2 text-center pt-4">
                    <div className="flex flex-col items-center gap-1 p-2">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <Shield className="h-4 w-4 text-green-600" />
                      </div>
                      <span className="text-xs text-gray-600">SSL Seguro</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 p-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <CreditCard className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="text-xs text-gray-600">Pagamento Seguro</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-brand-800 via-brand-700 to-brand-600 text-white py-8 mt-16">
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