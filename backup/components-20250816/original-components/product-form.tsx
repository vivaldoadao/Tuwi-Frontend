"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { getProductCategories, uploadMultipleProductImages, type ProductAdmin } from "@/lib/data-supabase"
import { createProductSecure, updateProductSecure } from "@/lib/api-client"
import { ImageUpload } from "@/components/image-upload"
import { toast } from "react-hot-toast"
import { Plus, Edit, Loader2, Package } from "lucide-react"

interface ProductFormProps {
  product?: ProductAdmin
  onProductSaved?: () => void
  trigger?: React.ReactNode
  mode?: 'create' | 'edit'
}

export function ProductForm({ product, onProductSaved, trigger, mode = 'create' }: ProductFormProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<string[]>([])
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    longDescription: product?.longDescription || '',
    price: product?.price || 0,
    category: product?.category || '',
    stockQuantity: product?.stockQuantity || 0
  })
  const [imageFiles, setImageFiles] = useState<File[]>([])

  const handleOpenChange = async (newOpen: boolean) => {
    setOpen(newOpen)
    if (newOpen) {
      // Load categories when dialog opens
      const categoriesResult = await getProductCategories()
      setCategories(categoriesResult)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      let imageUrls: string[] = []
      
      // Upload images if there are any
      if (imageFiles.length > 0) {
        const uploadResult = await uploadMultipleProductImages(imageFiles)
        
        if (uploadResult.success && uploadResult.urls) {
          imageUrls = uploadResult.urls
        }
        
        if (uploadResult.errors && uploadResult.errors.length > 0) {
          uploadResult.errors.forEach(error => toast.error(error))
        }
      }

      if (mode === 'create') {
        const createResult = await createProductSecure({
          name: formData.name,
          description: formData.description,
          longDescription: formData.longDescription,
          price: formData.price,
          category: formData.category,
          stockQuantity: formData.stockQuantity,
          images: imageUrls,
          imageUrl: imageUrls[0] || '', // Use first image as main imageUrl
          isActive: true // Default to active
        })

        if (createResult.success) {
          toast.success('Produto criado com sucesso!')
          setOpen(false)
          // Reset form
          setFormData({
            name: '',
            description: '',
            longDescription: '',
            price: 0,
            category: '',
            stockQuantity: 0
          })
          setImageFiles([])
          
          if (onProductSaved) {
            onProductSaved()
          }
        } else {
          toast.error(createResult.message || 'Erro ao criar produto')
        }
      } else if (product) {
        const updateData = {
          ...formData,
          ...(imageUrls.length > 0 && { images: imageUrls })
        }
        
        const updateResult = await updateProductSecure(product.id, updateData)

        if (updateResult.success) {
          toast.success('Produto atualizado com sucesso!')
          setOpen(false)
          if (onProductSaved) {
            onProductSaved()
          }
        } else {
          toast.error(updateResult.message || 'Erro ao atualizar produto')
        }
      }
    } catch (error) {
      console.error('Error saving product:', error)
      toast.error('Erro inesperado ao salvar produto')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | number | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl">
            {mode === 'create' ? (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Novo Produto
              </>
            ) : (
              <>
                <Edit className="h-4 w-4 mr-2" />
                Editar Produto
              </>
            )}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-green-600" />
            {mode === 'create' ? 'Criar Novo Produto' : 'Editar Produto'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Adicione um novo produto ao catálogo. Preencha todos os campos obrigatórios.'
              : 'Edite as informações do produto. As alterações serão salvas imediatamente.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6">
            {/* Product Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Produto *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Digite o nome do produto"
                required
                className="h-11"
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Categoria *</Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                  <SelectItem value="Outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Price and Stock */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="price">Preço (€) *</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  required
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stock">Quantidade em Estoque *</Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  value={formData.stockQuantity}
                  onChange={(e) => handleInputChange('stockQuantity', parseInt(e.target.value) || 0)}
                  placeholder="0"
                  required
                  className="h-11"
                />
              </div>
            </div>

            {/* Short Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Descrição Curta *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Breve descrição do produto (aparece na listagem)"
                rows={3}
                required
                className="resize-none"
              />
              <p className="text-xs text-gray-500">
                Esta descrição aparecerá na listagem de produtos e nos cards.
              </p>
            </div>

            {/* Long Description */}
            <div className="space-y-2">
              <Label htmlFor="longDescription">Descrição Detalhada</Label>
              <Textarea
                id="longDescription"
                value={formData.longDescription}
                onChange={(e) => handleInputChange('longDescription', e.target.value)}
                placeholder="Descrição completa do produto (aparece na página do produto)"
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-gray-500">
                Descrição detalhada que aparecerá na página individual do produto.
              </p>
            </div>

            {/* Image Upload */}
            <ImageUpload
              files={imageFiles}
              onFilesChange={setImageFiles}
              maxImages={5}
            />
          </div>

          <DialogFooter className="gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="rounded-xl"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {mode === 'create' ? 'Criando...' : 'Salvando...'}
                </>
              ) : (
                <>
                  {mode === 'create' ? (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Produto
                    </>
                  ) : (
                    <>
                      <Edit className="h-4 w-4 mr-2" />
                      Salvar Alterações
                    </>
                  )}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}