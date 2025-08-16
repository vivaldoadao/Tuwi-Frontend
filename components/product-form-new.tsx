// ===================================
// PRODUCT FORM - NOVA VERSÃO COM FORMBUILDER
// ===================================

"use client"

import * as React from "react"
import { FormBuilder } from "@/components/form-builder"
import { 
  getProductCategories, 
  uploadMultipleProductImages, 
  type ProductAdmin 
} from "@/lib/data-supabase"
import { createProductSecure, updateProductSecure } from "@/lib/api-client"
import { ImageUpload } from "@/components/image-upload"
import { toast } from "react-hot-toast"
import { Plus, Edit, Package } from "lucide-react"
import type { FormField } from "@/types/form"
import { z } from "zod"

interface ProductFormNewProps {
  product?: ProductAdmin
  onProductSaved?: () => void
  trigger?: React.ReactNode
  mode?: 'create' | 'edit'
}

// Validation schema
const productSchema = z.object({
  name: z.string().min(1, "Nome do produto é obrigatório").min(3, "Nome deve ter pelo menos 3 caracteres"),
  description: z.string().min(1, "Descrição é obrigatória").min(10, "Descrição deve ter pelo menos 10 caracteres"),
  longDescription: z.string().optional(),
  price: z.number().min(0.01, "Preço deve ser maior que zero"),
  category: z.string().min(1, "Categoria é obrigatória"),
  stockQuantity: z.number().min(0, "Estoque não pode ser negativo").int("Estoque deve ser um número inteiro"),
  images: z.array(z.any()).optional()
})

export function ProductFormNew({ 
  product, 
  onProductSaved, 
  trigger, 
  mode = 'create' 
}: ProductFormNewProps) {
  
  const [categories, setCategories] = React.useState<string[]>([])
  const [imageFiles, setImageFiles] = React.useState<File[]>([])

  // Load categories on mount
  React.useEffect(() => {
    const loadCategories = async () => {
      const categoriesResult = await getProductCategories()
      setCategories(categoriesResult)
    }
    loadCategories()
  }, [])

  // Form fields configuration
  const fields: FormField[] = [
    {
      name: 'name',
      label: 'Nome do Produto',
      type: 'text',
      placeholder: 'Ex: Trança Box Braids Premium',
      required: true,
      fullWidth: true,
      validation: {
        minLength: 3,
        maxLength: 100
      },
      help: 'Nome que será exibido na loja'
    },
    {
      name: 'category',
      label: 'Categoria',
      type: 'select',
      placeholder: 'Selecione uma categoria',
      required: true,
      options: categories.map(cat => ({ value: cat, label: cat })),
      help: 'Categoria para organização dos produtos'
    },
    {
      name: 'price',
      label: 'Preço (€)',
      type: 'number',
      placeholder: '0.00',
      required: true,
      step: 0.01,
      validation: {
        min: 0.01
      },
      help: 'Preço de venda em euros'
    },
    {
      name: 'stockQuantity',
      label: 'Quantidade em Estoque',
      type: 'number',
      placeholder: '0',
      required: true,
      validation: {
        min: 0
      },
      help: 'Quantidade disponível para venda'
    },
    {
      name: 'description',
      label: 'Descrição Curta',
      type: 'textarea',
      placeholder: 'Descrição que aparece nos cards de produto...',
      required: true,
      fullWidth: true,
      validation: {
        minLength: 10,
        maxLength: 200
      },
      help: 'Descrição resumida para listagens (máx. 200 chars)'
    },
    {
      name: 'longDescription',
      label: 'Descrição Detalhada',
      type: 'textarea',
      placeholder: 'Descrição completa do produto, instruções de uso, materiais...',
      required: false,
      fullWidth: true,
      validation: {
        maxLength: 1000
      },
      help: 'Descrição completa exibida na página do produto (opcional)'
    },
    {
      name: 'images',
      label: 'Imagens do Produto',
      type: 'file',
      accept: 'image/*',
      multiple: true,
      fullWidth: true,
      help: 'Selecione até 5 imagens do produto',
      component: ImageUpload,
      componentProps: {
        maxFiles: 5,
        onChange: (files: File[]) => setImageFiles(files)
      }
    }
  ]

  // Submit handler
  const handleSubmit = React.useCallback(async (formData: any) => {
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

      const productData = {
        name: formData.name,
        description: formData.description,
        longDescription: formData.longDescription || '',
        price: formData.price,
        category: formData.category,
        stockQuantity: formData.stockQuantity,
        images: imageUrls,
        imageUrl: imageUrls[0] || '', // Use first image as main imageUrl
        isActive: true // Default to active
      }

      if (mode === 'create') {
        const result = await createProductSecure(productData)
        
        if (result.success) {
          toast.success('Produto criado com sucesso!')
          if (onProductSaved) onProductSaved()
        } else {
          toast.error(result.message || 'Erro ao criar produto')
          throw new Error(result.message || 'Falha na criação')
        }
      } else if (product) {
        const result = await updateProductSecure(product.id, productData)
        
        if (result.success) {
          toast.success('Produto atualizado com sucesso!')
          if (onProductSaved) onProductSaved()
        } else {
          toast.error(result.message || 'Erro ao atualizar produto')
          throw new Error(result.message || 'Falha na atualização')
        }
      }
    } catch (error) {
      console.error('Product form submission error:', error)
      throw error
    }
  }, [imageFiles, mode, product, onProductSaved])

  // Error handler
  const handleError = React.useCallback((errors: Record<string, string>) => {
    console.error('Product form validation errors:', errors)
  }, [])

  // Reset handler
  const handleReset = React.useCallback(() => {
    setImageFiles([])
  }, [])

  return (
    <FormBuilder<typeof productSchema._type>
      fields={fields}
      onSubmit={handleSubmit}
      onError={handleError}
      onReset={handleReset}
      initialData={product ? {
        name: product.name,
        description: product.description,
        longDescription: product.longDescription || '',
        price: product.price,
        category: product.category,
        stockQuantity: product.stockQuantity
      } : {
        name: '',
        description: '',
        longDescription: '',
        price: 0,
        category: '',
        stockQuantity: 0
      }}
      validationSchema={productSchema}
      modal={true}
      trigger={trigger}
      modalProps={{
        title: mode === 'create' ? "Novo Produto" : "Editar Produto",
        description: mode === 'create' 
          ? "Adicione um novo produto à sua loja." 
          : "Atualize as informações do produto.",
        size: "lg"
      }}
      submitText={mode === 'create' ? "Criar Produto" : "Atualizar"}
      submitIcon={mode === 'create' ? Plus : Edit}
      validateOnBlur={true}
      validateOnChange={false}
      showProgress={true}
      showReset={true}
      columns={2}
    />
  )
}