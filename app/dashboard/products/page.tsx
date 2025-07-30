"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ProductsTable } from "@/components/products-table"
import { getProductCategories, type ProductAdmin } from "@/lib/data-supabase"
import { getAllProductsAdminSecureClient } from "@/lib/api-client"
import { 
  Package, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  TrendingUp,
  ShoppingCart,
  DollarSign
} from "lucide-react"

export default function DashboardProductsPage() {
  const [products, setProducts] = useState<ProductAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<string[]>([])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [productsResult, categoriesResult] = await Promise.all([
          getAllProductsAdminSecureClient(1, 1000), // Get all products for stats
          getProductCategories()
        ])
        setProducts(productsResult.products)
        setCategories(categoriesResult)
      } catch (error) {
        console.error('Error fetching products data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Calculate metrics
  const totalProducts = products.length
  const activeProducts = products.filter(p => p.isActive).length
  const inactiveProducts = products.filter(p => !p.isActive).length
  const lowStockProducts = products.filter(p => p.stockQuantity <= 5).length
  const outOfStockProducts = products.filter(p => p.stockQuantity === 0).length
  const totalValue = products.reduce((sum, p) => sum + (p.price * p.stockQuantity), 0)
  const avgPrice = totalProducts > 0 ? products.reduce((sum, p) => sum + p.price, 0) / totalProducts : 0

  return (
    <div className="space-y-8">
      {/* Enhanced Header Section */}
      <div className="bg-gradient-to-br from-emerald-500 via-green-600 to-teal-600 rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10 backdrop-blur-3xl"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Package className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold font-heading mb-2">
                  Gestão de Produtos 📦
                </h1>
                <p className="text-white/90 text-lg">
                  Controle completo do estoque e inventário
                </p>
                <p className="text-white/80 text-sm mt-1">
                  Sistema integrado de gerenciamento de produtos
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{loading ? '...' : totalProducts}</div>
              <div className="text-white/80 font-medium">Total de Produtos</div>
            </div>
          </div>
          
          {/* Quick Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold">{loading ? '...' : activeProducts}</div>
              <div className="text-white/80 text-sm">Ativos</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold">{loading ? '...' : lowStockProducts}</div>
              <div className="text-white/80 text-sm">Estoque Baixo</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold">{loading ? '...' : categories.length}</div>
              <div className="text-white/80 text-sm">Categorias</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold">€ {loading ? '...' : totalValue.toFixed(0)}</div>
              <div className="text-white/80 text-sm">Valor Total</div>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-xl rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                Disponível
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">Produtos Ativos</p>
              <p className="text-3xl font-bold text-gray-900">{loading ? '...' : activeProducts}</p>
              <p className="text-sm text-green-600 font-medium">prontos para venda</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200 shadow-xl rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 border-yellow-200">
                Atenção
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">Estoque Baixo</p>
              <p className="text-3xl font-bold text-gray-900">{loading ? '...' : lowStockProducts}</p>
              <p className="text-sm text-yellow-600 font-medium">≤ 5 unidades</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-rose-50 border-red-200 shadow-xl rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                <XCircle className="h-6 w-6 text-white" />
              </div>
              <Badge variant="secondary" className="bg-red-100 text-red-700 border-red-200">
                Urgente
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">Fora de Estoque</p>
              <p className="text-3xl font-bold text-gray-900">{loading ? '...' : outOfStockProducts}</p>
              <p className="text-sm text-red-600 font-medium">requer reposição</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 shadow-xl rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
                Média
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">Preço Médio</p>
              <p className="text-3xl font-bold text-gray-900">€ {loading ? '...' : avgPrice.toFixed(0)}</p>
              <p className="text-sm text-blue-600 font-medium">por produto</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products Table */}
      <ProductsTable />
    </div>
  )
}