// ===================================
// PRODUCTS TABLE - NOVA VERSÃO COM DATATABLE
// ===================================

"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { 
  Package,
  Eye,
  Edit,
  Trash2,
  Plus,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Euro
} from "lucide-react"
import { DataTable } from "@/components/data-table"
import { 
  getAllProductsAdminSecureClient, 
  toggleProductStatusSecure, 
  deleteProductSecure,
  type ProductAdmin 
} from "@/lib/api-client"
import { formatEuro } from "@/lib/currency"
import { toast } from "react-hot-toast"
import Image from "next/image"
import Link from "next/link"
import type { TableColumn, TableAction } from "@/types/table"

export function ProductsTableNew() {
  const [actionLoading, setActionLoading] = React.useState<string | null>(null)

  // Fetch function compatible with DataTable
  const fetchProducts = React.useCallback(async (
    page: number, 
    limit: number, 
    filters: any, 
    sorting: any
  ) => {
    const { products, total, hasMore } = await getAllProductsAdminSecureClient(
      page, 
      limit, 
      filters?.search,
      filters?.category === 'all' ? undefined : filters?.category
    )
    return {
      items: products,
      total,
      hasMore
    }
  }, [])

  // Column definitions
  const columns: TableColumn<ProductAdmin>[] = [
    {
      key: 'name',
      label: 'Produto',
      sortable: true,
      render: (value, product) => (
        <div className="flex items-center gap-3">
          <div className="relative h-12 w-12 overflow-hidden rounded-lg border border-gray-200">
            {product.images && product.images.length > 0 ? (
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                className="object-cover"
                sizes="48px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gray-100">
                <Package className="h-6 w-6 text-gray-400" />
              </div>
            )}
          </div>
          <div>
            <div className="font-medium text-gray-900">{product.name}</div>
            <div className="text-sm text-gray-500">{product.category}</div>
            <div className="text-xs text-gray-400">SKU: {product.id.slice(0, 8)}</div>
          </div>
        </div>
      )
    },
    {
      key: 'price',
      label: 'Preço',
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-1 font-medium">
          <Euro className="h-3 w-3" />
          {formatEuro(value as number)}
        </div>
      )
    },
    {
      key: 'stock',
      label: 'Estoque',
      sortable: true,
      render: (value) => getStockBadge(value as number)
    },
    {
      key: 'isActive',
      label: 'Status',
      sortable: true,
      render: (value) => getStatusBadge(value as boolean)
    },
    {
      key: 'category',
      label: 'Categoria',
      sortable: true,
      render: (value) => (
        <Badge variant="outline" className="text-xs">
          {value}
        </Badge>
      )
    },
    {
      key: 'orders',
      label: 'Vendas',
      sortable: true,
      render: (value, product) => (
        <div className="text-center">
          <div className="font-medium">{value || 0}</div>
          <div className="text-xs text-gray-500">pedidos</div>
        </div>
      )
    },
    {
      key: 'createdAt',
      label: 'Criado',
      sortable: true,
      render: (value) => formatDate(value as string)
    }
  ]

  // Action definitions
  const actions: TableAction[] = [
    {
      key: 'view',
      label: 'Ver Produto',
      icon: Eye
    },
    {
      key: 'edit',
      label: 'Editar',
      icon: Edit
    },
    {
      separator: true
    },
    {
      label: 'Status do Produto'
    },
    {
      key: 'toggle-status',
      label: 'Ativar/Desativar',
      icon: CheckCircle
    },
    {
      separator: true
    },
    {
      label: 'Ações Perigosas',
      className: 'text-red-600'
    },
    {
      key: 'delete',
      label: 'Excluir Produto',
      icon: Trash2,
      className: 'text-red-600 hover:bg-red-50'
    }
  ]

  // Bulk actions
  const bulkActions = [
    {
      key: 'activate-all',
      label: 'Ativar Selecionados',
      icon: CheckCircle
    },
    {
      key: 'deactivate-all',
      label: 'Desativar Selecionados',
      icon: XCircle
    },
    {
      key: 'delete-all',
      label: 'Excluir Selecionados',
      icon: Trash2
    }
  ]

  // Action handler
  const handleAction = React.useCallback(async (action: string, product: ProductAdmin) => {
    switch (action) {
      case 'view':
        window.open(`/products/${product.id}`, '_blank')
        break
      case 'edit':
        // Navigate to edit page or open modal
        window.location.href = `/dashboard/products/${product.id}/edit`
        break
      case 'toggle-status':
        handleToggleStatus(product.id)
        break
      case 'delete':
        handleDelete(product.id, product.name)
        break
    }
  }, [])

  // Bulk action handler
  const handleBulkAction = React.useCallback(async (action: string, products: ProductAdmin[]) => {
    switch (action) {
      case 'activate-all':
        handleBulkStatusChange(products, true)
        break
      case 'deactivate-all':
        handleBulkStatusChange(products, false)
        break
      case 'delete-all':
        handleBulkDelete(products)
        break
    }
  }, [])

  // Status toggle function
  const handleToggleStatus = async (productId: string) => {
    setActionLoading(productId)
    try {
      const { success, error } = await toggleProductStatusSecure(productId)
      if (success) {
        toast.success('Status do produto atualizado com sucesso')
      } else {
        toast.error(error || 'Erro ao atualizar status do produto')
      }
    } catch (error) {
      console.error('Error toggling product status:', error)
      toast.error('Erro inesperado ao atualizar status')
    } finally {
      setActionLoading(null)
    }
  }

  // Delete function
  const handleDelete = async (productId: string, productName: string) => {
    const confirmDelete = confirm(
      `⚠️ ATENÇÃO\n\n` +
      `Isso vai DELETAR permanentemente o produto:\n` +
      `"${productName}"\n\n` +
      `Esta ação NÃO pode ser desfeita!\n\n` +
      `Continuar?`
    )

    if (!confirmDelete) return

    setActionLoading(productId)
    try {
      const { success, error } = await deleteProductSecure(productId)
      if (success) {
        toast.success('Produto excluído com sucesso')
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

  // Bulk status change
  const handleBulkStatusChange = async (products: ProductAdmin[], isActive: boolean) => {
    const action = isActive ? 'ativar' : 'desativar'
    const confirmMessage = `Deseja ${action} ${products.length} produto(s)?`
    if (!confirm(confirmMessage)) return

    setActionLoading('bulk')
    try {
      const promises = products.map(product => 
        toggleProductStatusSecure(product.id)
      )
      
      const results = await Promise.allSettled(promises)
      const successful = results.filter(r => r.status === 'fulfilled').length
      const failed = results.filter(r => r.status === 'rejected').length

      if (successful > 0) {
        toast.success(`${successful} produto(s) ${action}do(s) com sucesso`)
      }
      if (failed > 0) {
        toast.error(`${failed} produto(s) falharam ao atualizar`)
      }
    } catch (error) {
      console.error('Error in bulk status change:', error)
      toast.error('Erro na ação em lote')
    } finally {
      setActionLoading(null)
    }
  }

  // Bulk delete
  const handleBulkDelete = async (products: ProductAdmin[]) => {
    const confirmMessage = `⚠️ ATENÇÃO\n\nDeseja EXCLUIR ${products.length} produto(s)?\n\nEsta ação NÃO pode ser desfeita!`
    if (!confirm(confirmMessage)) return

    setActionLoading('bulk')
    try {
      const promises = products.map(product => 
        deleteProductSecure(product.id)
      )
      
      const results = await Promise.allSettled(promises)
      const successful = results.filter(r => r.status === 'fulfilled').length
      const failed = results.filter(r => r.status === 'rejected').length

      if (successful > 0) {
        toast.success(`${successful} produto(s) excluído(s) com sucesso`)
      }
      if (failed > 0) {
        toast.error(`${failed} produto(s) falharam ao excluir`)
      }
    } catch (error) {
      console.error('Error in bulk delete:', error)
      toast.error('Erro na exclusão em lote')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Add Product Button */}
      <div className="flex justify-end">
        <Link href="/dashboard/products/new">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Novo Produto
          </Button>
        </Link>
      </div>

      <DataTable<ProductAdmin>
        fetchFunction={fetchProducts}
        columns={columns}
        actions={actions}
        bulkActions={bulkActions}
        title="Produtos da Loja"
        description="Gerencie inventário, preços e status dos produtos"
        icon={Package}
        totalLabel="produtos"
        searchPlaceholder="Pesquisar por nome, categoria ou SKU..."
        enableSelection={true}
        emptyIcon={Package}
        emptyTitle="Nenhum produto encontrado"
        emptyDescription="Adicione produtos à sua loja para começar a vender"
        onAction={handleAction}
        onBulkAction={handleBulkAction}
        dependencies={[actionLoading]} // Refresh when actions complete
      />
    </div>
  )
}

// Helper functions
function getStockBadge(stock: number) {
  if (stock === 0) {
    return (
      <Badge variant="destructive" className="bg-red-100 text-red-800">
        <XCircle className="h-3 w-3 mr-1" />
        Esgotado
      </Badge>
    )
  } else if (stock <= 5) {
    return (
      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
        <AlertTriangle className="h-3 w-3 mr-1" />
        Baixo ({stock})
      </Badge>
    )
  } else {
    return (
      <Badge variant="secondary" className="bg-green-100 text-green-800">
        <CheckCircle className="h-3 w-3 mr-1" />
        {stock} unidades
      </Badge>
    )
  }
}

function getStatusBadge(isActive: boolean) {
  return isActive ? (
    <Badge variant="secondary" className="bg-green-100 text-green-800">
      <CheckCircle className="h-3 w-3 mr-1" />
      Ativo
    </Badge>
  ) : (
    <Badge variant="secondary" className="bg-red-100 text-red-800">
      <XCircle className="h-3 w-3 mr-1" />
      Inativo
    </Badge>
  )
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}