import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { allProducts } from "@/lib/data" // Atualizado para lib/data
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"

export default function DashboardProductsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-brand-primary">Gerenciar Produtos</h2>
        <Button className="bg-brand-accent hover:bg-brand-background text-brand-primary hover:text-white">
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Produto
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allProducts.map((product) => (
          <Card key={product.id} className="bg-white text-gray-900 shadow-lg rounded-lg overflow-hidden">
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
            <CardContent className="p-4 grid gap-2">
              <CardTitle className="text-xl font-bold text-brand-primary">{product.name}</CardTitle>
              <p className="text-sm text-gray-700">{product.description}</p>
              <div className="text-2xl font-semibold text-brand-accent">€{product.price.toFixed(2)}</div>
              <div className="flex gap-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white bg-transparent"
                >
                  Editar
                </Button>
                <Button variant="destructive" size="sm">
                  Excluir
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
