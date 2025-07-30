"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ProductForm } from "@/components/product-form"
import { formatEuro } from "@/lib/currency"
import { getProductByIdSecure, toggleProductStatusSecure, deleteProductSecure } from "@/lib/api-client"
import { type ProductAdmin } from "@/lib/data-supabase"
import { toast } from "react-hot-toast"
import {
  ArrowLeft,
  Edit,
  Trash2,
  Package,
  Calendar,
  User,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Boxes,
  ImageIcon,
  Clock,
  Globe,
  MoreHorizontal,
  ExternalLink
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ProductDetailPageProps {
  params: Promise<{ id: string }>
}

export default function AdminProductDetailPage({ params }: ProductDetailPageProps) {
  const router = useRouter()
  const { id } = React.use(params)
  const [product, setProduct] = useState<ProductAdmin | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true)
      try {
        const { product: fetchedProduct, error } = await getProductByIdSecure(id)
        
        if (fetchedProduct) {
          setProduct(fetchedProduct)
        } else {
          toast.error(error || 'Produto não encontrado')
        }
      } catch (error) {
        console.error('Error fetching product:', error)
        toast.error('Erro ao carregar produto')
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [id])

  const handleToggleStatus = async () => {
    if (!product) return
    
    setActionLoading(true)
    try {
      const { success, error, isActive } = await toggleProductStatusSecure(product.id)
      if (success) {
        setProduct(prev => prev ? { ...prev, isActive: isActive || false } : null)
        toast.success(isActive ? 'Produto ativado com sucesso' : 'Produto desativado com sucesso')
      } else {
        toast.error(error || 'Erro ao alterar status do produto')
      }
    } catch (error) {
      console.error('Error toggling product status:', error)
      toast.error('Erro inesperado ao alterar status do produto')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteProduct = async () => {
    if (!product) return
    
    if (!confirm('Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.')) {
      return
    }

    setActionLoading(true)
    try {
      const { success, error } = await deleteProductSecure(product.id)
      if (success) {
        toast.success('Produto excluído com sucesso')
        router.push('/dashboard/products')
      } else {
        toast.error(error || 'Erro ao excluir produto')
      }
    } catch (error) {
      console.error('Error deleting product:', error)
      toast.error('Erro inesperado ao excluir produto')
    } finally {
      setActionLoading(false)
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    )
  }

  if (!product) {
    notFound()
  }

  const productImages = product.images && product.images.length > 0 
    ? product.images 
    : [product.imageUrl || '/placeholder.svg']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="rounded-xl"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold font-heading text-gray-900">
              Detalhes do Produto
            </h1>
            <p className="text-gray-600">
              Informações completas sobre o produto
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            asChild
            className="rounded-xl"
          >
            <Link href={`/products/${product.id}`} target="_blank">
              <ExternalLink className="h-4 w-4 mr-2" />
              Ver na Loja
            </Link>
          </Button>
          
          <ProductForm 
            mode="edit"
            product={product}
            onProductSaved={() => window.location.reload()}
            trigger={
              <Button className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl">
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            }
          />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="rounded-xl"
                disabled={actionLoading}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Ações</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <DropdownMenuItem 
                onClick={handleToggleStatus}
                className={product.isActive ? "text-orange-600" : "text-green-600"}
              >
                {product.isActive ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" />
                    Desativar
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Ativar
                  </>
                )}
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem 
                onClick={handleDeleteProduct}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Product Info */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Basic Info Card */}
          <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <CardTitle className="text-2xl font-bold text-gray-900">
                    {product.name}
                  </CardTitle>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(product.isActive, product.stockQuantity)}
                    <Badge variant="outline" className="text-sm">
                      {product.category}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-green-600">
                    {formatEuro(product.price)}
                  </div>
                  <div className="text-sm text-gray-500">
                    ID: {product.id.slice(0, 8)}...
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Description */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Descrição</h3>
                <p className="text-gray-600 leading-relaxed">
                  {product.description}
                </p>
              </div>

              {product.longDescription && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Descrição Detalhada</h3>
                  <p className="text-gray-600 leading-relaxed">
                    {product.longDescription}
                  </p>
                </div>
              )}

              <Separator />

              {/* Product Details Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <Boxes className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">
                    {product.stockQuantity}
                  </div>
                  <div className="text-sm text-gray-600">Em Estoque</div>
                </div>

                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <DollarSign className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">
                    {formatEuro(product.price)}
                  </div>
                  <div className="text-sm text-gray-600">Preço</div>
                </div>

                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <ImageIcon className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">
                    {productImages.length}
                  </div>
                  <div className="text-sm text-gray-600">Imagens</div>
                </div>

                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <Package className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">
                    {product.category}
                  </div>
                  <div className="text-sm text-gray-600">Categoria</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Images Gallery */}
          <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Galeria de Imagens ({productImages.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {productImages.length > 0 ? (
                <div className="space-y-4">
                  {/* Main Image - Fixed size container with max width */}
                  <div className="relative w-full max-w-md mx-auto h-80 rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                    <Image
                      src={productImages[selectedImageIndex]}
                      alt={`${product.name} - Imagem ${selectedImageIndex + 1}`}
                      fill
                      className="object-cover"
                      unoptimized={true}
                      priority
                    />
                  </div>
                  
                  {/* Thumbnails - Fixed size containers */}
                  {productImages.length > 1 && (
                    <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                      {productImages.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImageIndex(index)}
                          className={`relative w-full h-16 rounded-lg overflow-hidden bg-gray-100 border-2 transition-all duration-300 ${
                            selectedImageIndex === index 
                              ? 'border-green-500 ring-2 ring-green-200' 
                              : 'border-gray-200 hover:border-green-300'
                          }`}
                        >
                          <Image
                            src={image}
                            alt={`${product.name} - Thumbnail ${index + 1}`}
                            fill
                            className="object-cover"
                            unoptimized={true}
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative w-full max-w-md mx-auto h-80 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <ImageIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma imagem disponível</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          
          {/* Status Card */}
          <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Status do Produto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Estado:</span>
                {getStatusBadge(product.isActive, product.stockQuantity)}
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Visibilidade:</span>
                <Badge variant={product.isActive ? "default" : "secondary"}>
                  {product.isActive ? 'Público' : 'Oculto'}
                </Badge>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Estoque Atual:</span>
                  <span className={`font-semibold ${
                    product.stockQuantity === 0 ? 'text-red-600' :
                    product.stockQuantity <= 5 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {product.stockQuantity} un.
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Valor Total:</span>
                  <span className="font-semibold text-green-600">
                    {formatEuro(product.price * product.stockQuantity)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Metadata Card */}
          <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Informações do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Criado em:</span>
                  <span className="font-medium">
                    {new Date(product.createdAt).toLocaleDateString('pt-PT', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                
                {product.updatedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Atualizado em:</span>
                    <span className="font-medium">
                      {new Date(product.updatedAt).toLocaleDateString('pt-PT', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                )}

                <Separator />

                <div className="flex justify-between">
                  <span className="text-gray-600">ID do Produto:</span>
                  <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                    {product.id}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Ações Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={handleToggleStatus}
                disabled={actionLoading}
                variant={product.isActive ? "outline" : "default"}
                className="w-full rounded-xl"
              >
                {product.isActive ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" />
                    Desativar Produto
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Ativar Produto
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                asChild
                className="w-full rounded-xl"
              >
                <Link href={`/products/${product.id}`} target="_blank">
                  <Globe className="h-4 w-4 mr-2" />
                  Ver na Loja
                </Link>
              </Button>

              <Separator />

              <Button
                onClick={handleDeleteProduct}
                disabled={actionLoading}
                variant="destructive"
                className="w-full rounded-xl"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir Produto
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}