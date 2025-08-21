"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { 
  Plus, 
  MoreHorizontal,
  Edit,
  Trash2,
  Tag,
  CheckCircle,
  XCircle,
  Loader2
} from "lucide-react"
import {
  getProductCategoriesDetailedDjango,
  createCategoryDjango,
  updateCategoryDjango,
  toggleCategoryStatusDjango,
  deleteCategoryDjango,
  type DjangoCategory
} from "@/lib/django"
import { toast } from "react-hot-toast"

interface CategoryFormData {
  name: string
  slug: string
  description: string
  sort_order: number
}

export function CategoryManager() {
  const [categories, setCategories] = React.useState<DjangoCategory[]>([])
  const [loading, setLoading] = React.useState(true)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editingCategory, setEditingCategory] = React.useState<DjangoCategory | null>(null)
  const [submitting, setSubmitting] = React.useState(false)
  const [actionLoading, setActionLoading] = React.useState<string | null>(null)
  
  const [formData, setFormData] = React.useState<CategoryFormData>({
    name: '',
    slug: '',
    description: '',
    sort_order: 0
  })

  const fetchCategories = React.useCallback(async () => {
    setLoading(true)
    try {
      const result = await getProductCategoriesDetailedDjango()
      setCategories(result)
    } catch (error) {
      console.error('Error fetching categories:', error)
      toast.error('Erro ao carregar categorias')
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      sort_order: 0
    })
    setEditingCategory(null)
  }

  const handleOpenDialog = (category?: DjangoCategory) => {
    if (category) {
      setEditingCategory(category)
      setFormData({
        name: category.name,
        slug: category.slug,
        description: category.description,
        sort_order: category.sort_order
      })
    } else {
      resetForm()
    }
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    resetForm()
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim()
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    setFormData(prev => ({
      ...prev,
      name,
      slug: generateSlug(name)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      if (editingCategory) {
        // Update existing category
        const result = await updateCategoryDjango(editingCategory.id, formData)
        if (result.success) {
          toast.success(result.message)
          await fetchCategories()
          handleCloseDialog()
        }
      } else {
        // Create new category
        const result = await createCategoryDjango(formData)
        if (result.success) {
          toast.success(result.message)
          await fetchCategories()
          handleCloseDialog()
        }
      }
    } catch (error: any) {
      console.error('Error saving category:', error)
      toast.error(error.message || 'Erro ao salvar categoria')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleStatus = async (categoryId: string) => {
    setActionLoading(categoryId)
    try {
      const result = await toggleCategoryStatusDjango(categoryId)
      if (result.success) {
        toast.success(result.message)
        await fetchCategories()
      }
    } catch (error: any) {
      console.error('Error toggling category status:', error)
      toast.error(error.message || 'Erro ao alterar status da categoria')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (categoryId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta categoria? Esta ação não pode ser desfeita.')) {
      return
    }

    setActionLoading(categoryId)
    try {
      const result = await deleteCategoryDjango(categoryId)
      if (result.success) {
        toast.success(result.message)
        await fetchCategories()
      }
    } catch (error: any) {
      console.error('Error deleting category:', error)
      toast.error(error.message || 'Erro ao excluir categoria')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Gestão de Categorias
            </CardTitle>
            <CardDescription>
              Gerencie categorias de produtos do sistema
            </CardDescription>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Categoria
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>
                  {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
                </DialogTitle>
                <DialogDescription>
                  {editingCategory 
                    ? 'Atualize os dados da categoria.' 
                    : 'Preencha os dados para criar uma nova categoria.'
                  }
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Categoria</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={handleNameChange}
                    placeholder="Ex: Produtos de Cabelo"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug (URL)</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="produtos-de-cabelo"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descrição da categoria..."
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="sort_order">Ordem de Exibição</Label>
                  <Input
                    id="sort_order"
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      sort_order: parseInt(e.target.value) || 0 
                    }))}
                    placeholder="0"
                  />
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={handleCloseDialog}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {editingCategory ? 'Atualizar' : 'Criar'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Produtos</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ordem</TableHead>
                <TableHead className="text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><div className="animate-pulse h-4 bg-gray-200 rounded w-32"></div></TableCell>
                    <TableCell><div className="animate-pulse h-4 bg-gray-200 rounded w-24"></div></TableCell>
                    <TableCell><div className="animate-pulse h-4 bg-gray-200 rounded w-16"></div></TableCell>
                    <TableCell><div className="animate-pulse h-6 bg-gray-200 rounded w-20"></div></TableCell>
                    <TableCell><div className="animate-pulse h-4 bg-gray-200 rounded w-12"></div></TableCell>
                    <TableCell><div className="animate-pulse h-8 bg-gray-200 rounded w-8 mx-auto"></div></TableCell>
                  </TableRow>
                ))
              ) : categories.length > 0 ? (
                categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">
                      {category.name}
                      {category.description && (
                        <p className="text-sm text-gray-500 line-clamp-1">
                          {category.description}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {category.slug}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {category.products_count} produtos
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={category.is_active ? "default" : "secondary"}>
                        {category.is_active ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Ativo
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 mr-1" />
                            Inativo
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>{category.sort_order}</TableCell>
                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            className="h-8 w-8 p-0"
                            disabled={actionLoading === category.id}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações da Categoria</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuItem onClick={() => handleOpenDialog(category)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem 
                            onClick={() => handleToggleStatus(category.id)}
                            className={category.is_active ? "text-orange-600" : "text-green-600"}
                          >
                            {category.is_active ? (
                              <>
                                <XCircle className="h-4 w-4 mr-2" />
                                Desativar
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Ativar
                              </>
                            )}
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuItem 
                            onClick={() => handleDelete(category.id)}
                            className="text-red-600"
                            disabled={category.products_count > 0}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <Tag className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500 font-medium text-lg">
                      Nenhuma categoria cadastrada
                    </p>
                    <p className="text-gray-400 text-sm">
                      Clique em "Nova Categoria" para começar
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}