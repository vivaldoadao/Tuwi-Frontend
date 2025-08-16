"use client"

import { useState, useMemo } from "react"
import ProductCard from "@/components/product-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Package, Filter, ChevronLeft, ChevronRight } from "lucide-react"
import type { Product } from "@/lib/data"

interface ProductsGridProps {
  initialProducts: Product[]
}

export default function ProductsGrid({ initialProducts }: ProductsGridProps) {
  const [products] = useState<Product[]>(initialProducts)
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [priceRange, setPriceRange] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const productsPerPage = 12

  // Get unique categories from products
  const categories = useMemo(() => {
    const cats = [...new Set(products.map(p => (p as any).category).filter(Boolean))]
    return cats.length > 0 ? cats : ['Tranças', 'Extensões', 'Acessórios', 'Cuidados']
  }, [products])

  // Filter products based on search and filters
  const filteredProducts = useMemo(() => {
    let filtered = products

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query) ||
        (product.longDescription && product.longDescription.toLowerCase().includes(query))
      )
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(product => (product as any).category === categoryFilter)
    }

    // Price range filter
    if (priceRange !== "all") {
      switch (priceRange) {
        case "0-25":
          filtered = filtered.filter(product => product.price <= 25)
          break
        case "25-50":
          filtered = filtered.filter(product => product.price > 25 && product.price <= 50)
          break
        case "50-100":
          filtered = filtered.filter(product => product.price > 50 && product.price <= 100)
          break
        case "100+":
          filtered = filtered.filter(product => product.price > 100)
          break
      }
    }

    return filtered
  }, [products, searchQuery, categoryFilter, priceRange])

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage)
  const startIndex = (currentPage - 1) * productsPerPage
  const endIndex = startIndex + productsPerPage
  const currentProducts = filteredProducts.slice(startIndex, endIndex)

  // Reset page when filters change
  const handleFilterChange = () => {
    setCurrentPage(1)
  }

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    handleFilterChange()
  }

  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value)
    handleFilterChange()
  }

  const handlePriceRangeChange = (value: string) => {
    setPriceRange(value)
    handleFilterChange()
  }

  return (
    <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-3xl border-0">
      <CardHeader className="pb-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2 text-2xl font-bold text-gray-900 mb-4">
              <Package className="h-6 w-6" />
              Catálogo de Produtos
            </CardTitle>
            
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Pesquisar produtos..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10 bg-gray-50 border-gray-200 focus:bg-white"
                />
              </div>
              
              <Select value={categoryFilter} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Categorias</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={priceRange} onValueChange={handlePriceRangeChange}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Preço" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Preços</SelectItem>
                  <SelectItem value="0-25">Até €25</SelectItem>
                  <SelectItem value="25-50">€25 - €50</SelectItem>
                  <SelectItem value="50-100">€50 - €100</SelectItem>
                  <SelectItem value="100+">Acima de €100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {filteredProducts.length} produto{filteredProducts.length !== 1 ? 's' : ''}
            </Badge>
            {(searchQuery || categoryFilter !== "all" || priceRange !== "all") && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("")
                  setCategoryFilter("all")
                  setPriceRange("all")
                  setCurrentPage(1)
                }}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Limpar Filtros
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-8">
        {/* Products Grid */}
        {currentProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {currentProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Package className="h-24 w-24 mx-auto mb-6 text-gray-300" />
            <h3 className="text-2xl font-bold text-gray-700 mb-3">
              {searchQuery || categoryFilter !== "all" || priceRange !== "all" 
                ? "Nenhum produto encontrado" 
                : "Nenhum produto disponível"
              }
            </h3>
            <p className="text-gray-500 text-lg">
              {searchQuery || categoryFilter !== "all" || priceRange !== "all"
                ? "Tente ajustar os filtros de pesquisa"
                : "Os produtos aparecerão aqui em breve"
              }
            </p>
            {(searchQuery || categoryFilter !== "all" || priceRange !== "all") && (
              <Button
                variant="outline"
                className="mt-6"
                onClick={() => {
                  setSearchQuery("")
                  setCategoryFilter("all")
                  setPriceRange("all")
                  setCurrentPage(1)
                }}
              >
                Limpar todos os filtros
              </Button>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-8 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Mostrando {startIndex + 1} a {Math.min(endIndex, filteredProducts.length)} de {filteredProducts.length} produtos
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="h-9"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="h-9 w-9"
                    >
                      {pageNum}
                    </Button>
                  )
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="h-9"
              >
                Próxima
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}