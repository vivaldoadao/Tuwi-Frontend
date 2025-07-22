"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import type { Product } from "@/lib/data" // Atualizado para lib/data
import { useCart } from "@/context/cart-context"

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart()

  const handleAddToCart = () => {
    addToCart(product)
    // toast({
    //   title: "Adicionado ao carrinho!",
    //   description: `${product.name} foi adicionado ao seu carrinho.`,
    // })
  }

  return (
    <Card className="w-full max-w-sm rounded-lg overflow-hidden shadow-lg bg-white text-gray-900">
      <Link href={`/products/${product.id}`}>
        <CardHeader className="p-0">
          <Image
            src={product.imageUrl || "/placeholder.svg"}
            alt={product.name}
            width={400}
            height={300}
            className="w-full h-48 object-cover"
            unoptimized={true}
          />
        </CardHeader>
      </Link>
      <CardContent className="p-4 grid gap-2">
        <Link href={`/products/${product.id}`}>
          <CardTitle className="text-xl font-bold text-brand-primary hover:text-brand-accent transition-colors">
            {product.name}
          </CardTitle>
        </Link>
        <p className="text-sm text-gray-700">{product.description}</p>
        <div className="text-2xl font-semibold text-brand-accent">€{product.price.toFixed(2)}</div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button
          onClick={handleAddToCart}
          className="w-full bg-brand-accent hover:bg-brand-background text-brand-primary hover:text-white px-4 py-2 rounded-md transition-colors"
        >
          Adicionar ao Carrinho
        </Button>
      </CardFooter>
    </Card>
  )
}
