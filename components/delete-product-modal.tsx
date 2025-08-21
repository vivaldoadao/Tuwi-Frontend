"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  AlertTriangle, 
  Package, 
  Trash2, 
  X,
  Euro
} from "lucide-react"
import Image from "next/image"
import { formatEuro } from "@/lib/currency"
import type { ProductAdmin } from "@/lib/django"

interface DeleteProductModalProps {
  product: ProductAdmin | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirmDelete: (productId: string) => Promise<void>
  loading?: boolean
}

export function DeleteProductModal({ 
  product, 
  open, 
  onOpenChange, 
  onConfirmDelete, 
  loading = false 
}: DeleteProductModalProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!product) return
    
    setIsDeleting(true)
    try {
      await onConfirmDelete(product.id)
      onOpenChange(false)
    } catch (error) {
      console.error('Error in delete modal:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  if (!product) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-red-600">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            Excluir Produto
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Esta ação não pode ser desfeita. O produto será permanentemente removido do sistema.
          </DialogDescription>
        </DialogHeader>

        {/* Product Info Card */}
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="flex items-start gap-3">
            <div className="relative">
              <Image
                src={product.imageUrl || "/placeholder.svg?height=60&width=60&text=P"}
                alt={product.name}
                width={60}
                height={60}
                className="rounded-lg object-cover border border-gray-200"
                unoptimized={true}
              />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">
                {product.name}
              </h3>
              
              <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                {product.description}
              </p>
              
              <div className="flex items-center gap-3 mt-3">
                <Badge variant="outline" className="text-xs">
                  {product.category}
                </Badge>
                
                <div className="flex items-center gap-1 text-sm font-medium text-gray-900">
                  <Euro className="h-3 w-3" />
                  {formatEuro(product.price)}
                </div>
                
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Package className="h-3 w-3" />
                  {product.stockQuantity} un.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Warning Message */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-red-800 mb-1">
                Atenção: Esta ação é irreversível
              </p>
              <ul className="text-red-700 space-y-1">
                <li>• O produto será removido permanentemente</li>
                <li>• Todas as imagens associadas serão deletadas</li>
                <li>• Histórico de vendas será mantido para relatórios</li>
              </ul>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting || loading}
            className="rounded-xl"
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting || loading}
            className="rounded-xl bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? (
              <>
                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Excluindo...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Confirmar Exclusão
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}