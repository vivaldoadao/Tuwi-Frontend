"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Search, 
  Package, 
  ChevronLeft, 
  ChevronRight, 
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Plus,
  CheckCircle,
  XCircle,
  AlertTriangle
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { getProductCategories, type ProductAdmin } from "@/lib/data-supabase"
import { getAllProductsAdminSecureClient, toggleProductStatusSecure, deleteProductSecure } from "@/lib/api-client"
import { ProductForm } from "@/components/product-form"
import { formatEuro } from "@/lib/currency"
import { toast } from "react-hot-toast"
import Image from "next/image"
import Link from "next/link"

export function ProductsTable() {
  const [products, setProducts] = React.useState<ProductAdmin[]>([])
  const [loading, setLoading] = React.useState(true)
  const [currentPage, setCurrentPage] = React.useState(1)
  const [totalProducts, setTotalProducts] = React.useState(0)
  const [hasMore, setHasMore] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [categoryFilter, setCategoryFilter] = React.useState("all")
  const [actionLoading, setActionLoading] = React.useState<string | null>(null)
  const [categories, setCategories] = React.useState<string[]>([])
  
  const productsPerPage = 10

  const fetchProducts = React.useCallback(async (page: number = 1, search?: string, category?: string) => {
    setLoading(true)
    try {
      const { products: fetchedProducts, total, hasMore: moreProducts } = await getAllProductsAdminSecureClient(
        page, 
        productsPerPage, 
        search,
        category === 'all' ? undefined : category
      )
      setProducts(fetchedProducts)
      setTotalProducts(total)
      setHasMore(moreProducts)
      setCurrentPage(page)
    } catch (error) {
      console.error('Error fetching products:', error)
      toast.error('Erro ao carregar produtos')
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    const fetchData = async () => {
      const categoriesResult = await getProductCategories()
      setCategories(categoriesResult)
      fetchProducts(1, searchQuery, categoryFilter)
    }
    fetchData()
  }, [fetchProducts, searchQuery, categoryFilter])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1)
  }

  const handleCategoryFilter = (category: string) => {
    setCategoryFilter(category)
    setCurrentPage(1)
  }

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      fetchProducts(currentPage - 1, searchQuery, categoryFilter)
    }
  }

  const handleNextPage = () => {
    if (hasMore) {
      fetchProducts(currentPage + 1, searchQuery, categoryFilter)
    }
  }

  const handleToggleStatus = async (productId: string) => {
    setActionLoading(productId)
    try {
      const { success, error, isActive } = await toggleProductStatusSecure(productId)
      if (success) {
        toast.success(isActive ? 'Produto ativado com sucesso' : 'Produto desativado com sucesso')
        fetchProducts(currentPage, searchQuery, categoryFilter)
      } else {
        toast.error(error || 'Erro ao alterar status do produto')
      }
    } catch (error) {
      console.error('Error toggling product status:', error)
      toast.error('Erro inesperado ao alterar status do produto')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.')) {
      return
    }

    setActionLoading(productId)
    try {
      const { success, error } = await deleteProductSecure(productId)
      if (success) {
        toast.success('Produto excluído com sucesso')
        fetchProducts(currentPage, searchQuery, categoryFilter)
      } else {
        toast.error(error || 'Erro ao excluir produto')
      }
    } catch (error) {
      console.error('Error deleting product:', error)
      toast.error('Erro inesperado ao excluir produto')
    } finally {
      setActionLoading(null)
    }
  }

  const handleProductSaved = () => {
    // Refresh the current page after creating/editing a product
    fetchProducts(currentPage, searchQuery, categoryFilter)
  }

  const getStatusBadge = (isActive: boolean, stockQuantity: number) => {
    if (!isActive) {
      return <Badge variant="secondary" className="bg-gray-100 text-gray-800"><XCircle className="h-3 w-3 mr-1" />Inativo</Badge>
    }
    if (stockQuantity === 0) {
      return <Badge variant="secondary" className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Sem Estoque</Badge>
    }
    if (stockQuantity <= 5) {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><AlertTriangle className="h-3 w-3 mr-1" />Estoque Baixo</Badge>
    }
    return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Disponível</Badge>
  }


  const totalPages = Math.ceil(totalProducts / productsPerPage)

  return (
    <Card className="w-full bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl font-bold font-heading text-gray-900">
              <Package className="h-5 w-5" />
              Catálogo de Produtos
            </CardTitle>
            <CardDescription>
              Gerencie todos os produtos, estoque e preços
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-lg px-3 py-1">
              {totalProducts} produtos
            </Badge>
            <ProductForm 
              mode="create" 
              onProductSaved={handleProductSaved}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Pesquisar por nome, descrição ou categoria..."
              value={searchQuery}
              onChange={handleSearch}
              className="pl-10 bg-gray-50 border-gray-200 focus:bg-white"
            />
          </div>
          <Select value={categoryFilter} onValueChange={handleCategoryFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filtrar por categoria" />
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
        </div>

        {/* Products Table */}
        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <Table className="min-w-[1000px]">
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="font-semibold text-gray-900 w-1/3">Produto</TableHead>
                <TableHead className="font-semibold text-gray-900 w-1/6">Categoria</TableHead>
                <TableHead className="font-semibold text-gray-900 w-1/6">Preço</TableHead>
                <TableHead className="font-semibold text-gray-900 w-1/6">Estoque</TableHead>
                <TableHead className="font-semibold text-gray-900 w-1/6">Status</TableHead>
                <TableHead className="text-center font-semibold text-gray-900 w-1/6">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: productsPerPage }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="animate-pulse">
                          <div className="h-12 w-12 bg-gray-200 rounded-lg"></div>
                        </div>
                        <div className="animate-pulse space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-32"></div>
                          <div className="h-3 bg-gray-200 rounded w-24"></div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><div className="animate-pulse h-4 bg-gray-200 rounded w-20"></div></TableCell>
                    <TableCell><div className="animate-pulse h-4 bg-gray-200 rounded w-16"></div></TableCell>
                    <TableCell><div className="animate-pulse h-4 bg-gray-200 rounded w-12"></div></TableCell>
                    <TableCell><div className="animate-pulse h-6 bg-gray-200 rounded w-20"></div></TableCell>
                    <TableCell><div className="animate-pulse h-8 bg-gray-200 rounded w-8 mx-auto"></div></TableCell>
                  </TableRow>
                ))
              ) : products.length > 0 ? (
                products.map((product) => (
                  <TableRow key={product.id} className="hover:bg-gray-50 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Image
                          src={product.imageUrl || "/placeholder.svg?height=48&width=48&text=P"}
                          alt={product.name}
                          width={48}
                          height={48}
                          className="rounded-lg object-cover"
                          unoptimized={true}
                        />
                        <div>
                          <div className="font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500 line-clamp-1">
                            {product.description}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {product.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-gray-900">
                      {formatEuro(product.price)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${
                          product.stockQuantity === 0 ? 'text-red-600' :
                          product.stockQuantity <= 5 ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {product.stockQuantity}
                        </span>
                        <span className="text-sm text-gray-500">un.</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(product.isActive, product.stockQuantity)}
                    </TableCell>
                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            className="h-8 w-8 p-0"
                            disabled={actionLoading === product.id}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuLabel>Ações do Produto</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuItem asChild>
                            <Link 
                              href={`/dashboard/products/${product.id}`}
                              className="flex items-center w-full px-2 py-1.5 text-sm cursor-pointer"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Detalhes
                            </Link>
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem asChild>
                            <ProductForm 
                              mode="edit" 
                              product={product}
                              onProductSaved={handleProductSaved}
                              trigger={
                                <div className="flex items-center w-full px-2 py-1.5 text-sm cursor-pointer">
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar Produto
                                </div>
                              }
                            />
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuItem 
                            onClick={() => handleToggleStatus(product.id)}
                            className={product.isActive ? "text-orange-600" : "text-green-600"}
                          >
                            {product.isActive ? (
                              <>
                                <XCircle className="h-4 w-4 mr-2" />
                                Desativar Produto
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Ativar Produto
                              </>
                            )}
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuItem 
                            onClick={() => handleDeleteProduct(product.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir Produto
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <Package className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500 font-medium text-lg">
                      {searchQuery || categoryFilter !== 'all' ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}
                    </p>
                    <p className="text-gray-400 text-sm">
                      {searchQuery || categoryFilter !== 'all'
                        ? 'Tente ajustar os termos de pesquisa' 
                        : 'Os produtos aparecerão aqui conforme forem adicionados'
                      }
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalProducts > 0 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Mostrando {((currentPage - 1) * productsPerPage) + 1} a {Math.min(currentPage * productsPerPage, totalProducts)} de {totalProducts} produtos
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousPage}
                disabled={currentPage === 1 || loading}
                className="h-8"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              <span className="text-sm text-gray-600 px-2">
                Página {currentPage} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={!hasMore || loading}
                className="h-8"
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