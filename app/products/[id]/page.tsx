"use client"

import Image from "next/image"
import { notFound } from "next/navigation"
import SiteHeader from "@/components/site-header"
import { Button } from "@/components/ui/button"
import { getProductById, type Product } from "@/lib/data" // Atualizado para lib/data
import { useCart } from "@/context/cart-context"
import { Card, CardContent } from "@/components/ui/card"

// This is a client component for cart interaction
function AddToCartButton({ product }: { product: Product }) {
  const { addToCart } = useCart()
  const handleAddToCart = () => {
    addToCart(product)
    // toast({
    //   title: "Adicionado ao carrinho!",
    //   description: `${product.name} foi adicionado ao seu carrinho.`,
    // })
  }
  return (
    <Button
      onClick={handleAddToCart}
      className="w-full bg-brand-accent hover:bg-brand-primary text-brand-primary hover:text-white px-8 py-3 text-lg font-semibold rounded-full transition-colors shadow-lg"
    >
      Adicionar ao Carrinho
    </Button>
  )
}

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const product = getProductById(params.id)

  if (!product) {
    notFound()
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900">
      <SiteHeader />
      <main className="flex-1 py-12 md:py-20">
        <div className="container px-4 md:px-6">
          <Card className="bg-white text-gray-900 shadow-lg rounded-lg overflow-hidden">
            <CardContent className="grid md:grid-cols-2 gap-8 p-6 md:p-8">
              <div className="flex justify-center items-center">
                <Image
                  src={product.imageUrl || "/placeholder.svg"}
                  alt={product.name}
                  width={600}
                  height={450}
                  className="rounded-lg object-cover w-full h-auto max-h-[450px]"
                  unoptimized={true}
                />
              </div>
              <div className="space-y-6">
                <h1 className="text-4xl font-bold text-brand-primary">{product.name}</h1>
                <p className="text-2xl font-semibold text-brand-accent">€{product.price.toFixed(2)}</p>
                <p className="text-lg text-gray-700 leading-relaxed">{product.longDescription}</p>
                <div className="pt-4">
                  <AddToCartButton product={product} />
                </div>
              </div>
            </CardContent>
          </Card>
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
