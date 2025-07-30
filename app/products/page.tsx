import SiteHeader from "@/components/site-header"
import { getAllProducts } from "@/lib/data-supabase"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package } from "lucide-react"
import Image from "next/image"
import { Suspense } from "react"
import ProductsGrid from "@/components/products-grid"

async function getProductsData() {
  try {
    const products = await getAllProducts()
    return products
  } catch (error) {
    console.error('Error fetching products:', error)
    return []
  }
}

export default async function ProductsPage() {
  const products = await getProductsData()

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <SiteHeader />
      
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-brand-800 via-brand-700 to-brand-600 text-white">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative container mx-auto px-4 py-16">
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold font-heading">
              Todos os Nossos Produtos
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Descubra nossa coleção completa de produtos para tranças e cuidados capilares
            </p>
            <div className="flex items-center justify-center gap-3 pt-4">
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                <Package className="h-4 w-4 mr-1" />
                {products.length} produtos disponíveis
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 -mt-8 relative z-10">
        <div className="container mx-auto px-4 space-y-8">
          
          {/* Products Grid with Client-Side Filtering */}
          <Suspense fallback={
            <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-3xl border-0">
              <CardContent className="p-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-64 bg-gray-200 rounded-2xl mb-4"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          }>
            <ProductsGrid initialProducts={products} />
          </Suspense>

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
