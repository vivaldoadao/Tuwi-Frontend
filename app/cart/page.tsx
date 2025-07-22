"use client"

import Image from "next/image"
import Link from "next/link"
import SiteHeader from "@/components/site-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { useCart } from "@/context/cart-context"
import { Minus, Plus, Trash2 } from "lucide-react"

export default function CartPage() {
  const { cartItems, updateQuantity, removeFromCart, cartTotal, clearCart } = useCart()

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900">
      <SiteHeader />
      <main className="flex-1 py-12 md:py-20">
        <div className="container px-4 md:px-6">
          <h1 className="text-4xl font-bold text-center mb-10 text-brand-primary">Seu Carrinho de Compras</h1>

          {cartItems.length === 0 ? (
            <Card className="bg-white text-gray-900 p-8 text-center max-w-md mx-auto shadow-lg rounded-lg">
              <CardTitle className="text-2xl mb-4 text-brand-primary">Seu carrinho está vazio.</CardTitle>
              <p className="mb-6 text-gray-700">Parece que você ainda não adicionou nenhum produto.</p>
              <Button asChild className="bg-brand-accent hover:bg-brand-background text-brand-primary hover:text-white">
                <Link href="/products">Comece a Comprar</Link>
              </Button>
            </Card>
          ) : (
            <div className="grid md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-6">
                {cartItems.map((item) => (
                  <Card key={item.id} className="bg-white text-gray-900 shadow-lg rounded-lg overflow-hidden">
                    <CardContent className="flex items-center gap-4 p-4">
                      <Image
                        src={item.imageUrl || "/placeholder.svg"}
                        alt={item.name}
                        width={100}
                        height={100}
                        className="rounded-md object-cover"
                        unoptimized={true}
                      />
                      <div className="flex-1 grid gap-1">
                        <h3 className="font-bold text-lg text-brand-primary">{item.name}</h3>
                        <p className="text-sm text-gray-700">{item.description}</p>
                        <p className="font-semibold text-brand-accent">€{item.price.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="text-gray-700 hover:bg-gray-100"
                        >
                          <Minus className="h-4 w-4" />
                          <span className="sr-only">Diminuir quantidade</span>
                        </Button>
                        <span className="font-semibold text-lg">{item.quantity}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="text-gray-700 hover:bg-gray-100"
                        >
                          <Plus className="h-4 w-4" />
                          <span className="sr-only">Aumentar quantidade</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-500 hover:bg-red-100"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Remover item</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <div className="text-right">
                  <Button
                    variant="outline"
                    onClick={clearCart}
                    className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white bg-transparent"
                  >
                    Limpar Carrinho
                  </Button>
                </div>
              </div>

              <div className="md:col-span-1">
                <Card className="bg-white text-gray-900 shadow-lg rounded-lg p-6 space-y-4">
                  <CardTitle className="text-2xl font-bold text-brand-primary">Resumo do Pedido</CardTitle>
                  <div className="flex justify-between text-lg">
                    <span>Subtotal:</span>
                    <span>€{cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-brand-accent">
                    <span>Total:</span>
                    <span>€{cartTotal.toFixed(2)}</span>
                  </div>
                  <Button
                    asChild
                    className="w-full bg-brand-accent hover:bg-brand-background text-brand-primary hover:text-white px-8 py-3 text-lg font-semibold rounded-full transition-colors shadow-lg"
                  >
                    <Link href="/checkout">Finalizar Compra</Link>
                  </Button>
                </Card>
              </div>
            </div>
          )}
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
