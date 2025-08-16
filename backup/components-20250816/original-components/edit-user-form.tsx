"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Edit, Save, X } from "lucide-react"
import { updateUser, type User } from "@/lib/data-supabase"
import { toast } from "react-hot-toast"

interface EditUserFormProps {
  user: User
  onUserUpdated: (updatedUser: User) => void
  trigger?: React.ReactNode
}

export function EditUserForm({ user, onUserUpdated, trigger }: EditUserFormProps) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [formData, setFormData] = React.useState({
    name: user.name,
    email: user.email,
    phone: user.phone || ''
  })
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  // Reset form when user changes or dialog opens
  React.useEffect(() => {
    if (open) {
      setFormData({
        name: user.name,
        email: user.email,
        phone: user.phone || ''
      })
      setErrors({})
    }
  }, [user, open])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido'
    }

    if (formData.phone && !/^[\+]?[\d\s\(\)\-]{10,}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Telefone inválido'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      const { success, error } = await updateUser(user.id, {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined
      })

      if (success) {
        const updatedUser: User = {
          ...user,
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim() || undefined
        }
        
        onUserUpdated(updatedUser)
        setOpen(false)
        toast.success('Usuário atualizado com sucesso')
      } else {
        toast.error(error || 'Erro ao atualizar usuário')
      }
    } catch (error) {
      console.error('Error updating user:', error)
      toast.error('Erro inesperado ao atualizar usuário')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const hasChanges = 
    formData.name !== user.name ||
    formData.email !== user.email ||
    formData.phone !== (user.phone || '')

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Usuário</DialogTitle>
          <DialogDescription>
            Altere as informações do usuário. Clique em salvar para confirmar as alterações.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Nome */}
            <div className="grid gap-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Digite o nome completo"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            {/* Email */}
            <div className="grid gap-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Digite o email"
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            {/* Telefone */}
            <div className="grid gap-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="(351) 912 345 678"
                className={errors.phone ? 'border-red-500' : ''}
              />
              {errors.phone && (
                <p className="text-sm text-red-500">{errors.phone}</p>
              )}
              <p className="text-xs text-gray-500">
                Opcional. Formato: (351) 912 345 678
              </p>
            </div>

            {/* User Info */}
            <div className="grid gap-2 p-3 bg-gray-50 rounded-lg">
              <div className="text-sm">
                <span className="font-medium">ID:</span> {user.id}
              </div>
              <div className="text-sm">
                <span className="font-medium">Papel:</span> {user.role}
              </div>
              <div className="text-sm">
                <span className="font-medium">Status:</span> {user.isActive ? 'Ativo' : 'Inativo'}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || !hasChanges}
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}