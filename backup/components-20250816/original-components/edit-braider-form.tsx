"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { updateBraiderProfile, updateBraiderUserInfo, type Braider } from "@/lib/data-supabase"
import { toast } from "react-hot-toast"
import { Edit, Loader2 } from "lucide-react"

interface EditBraiderFormProps {
  braider: Braider
  onBraiderUpdated: (updatedBraider: Braider) => void
  trigger?: React.ReactNode
}

export function EditBraiderForm({ braider, onBraiderUpdated, trigger }: EditBraiderFormProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: braider.name,
    email: braider.contactEmail,
    bio: braider.bio,
    location: braider.location,
    contactPhone: braider.contactPhone
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Update user info (name and email)
      const userInfoResult = await updateBraiderUserInfo(braider.id, {
        name: formData.name,
        email: formData.email
      })

      if (!userInfoResult.success) {
        toast.error(userInfoResult.error || 'Erro ao atualizar informações do usuário')
        setLoading(false)
        return
      }

      // Update braider profile (bio, location, phone)
      const profileResult = await updateBraiderProfile(braider.id, {
        bio: formData.bio,
        location: formData.location,
        contactPhone: formData.contactPhone
      })

      if (!profileResult.success) {
        toast.error(profileResult.message || 'Erro ao atualizar perfil da trancista')
        setLoading(false)
        return
      }

      // Update the braider object with new data
      const updatedBraider: Braider = {
        ...braider,
        name: formData.name,
        contactEmail: formData.email,
        bio: formData.bio,
        location: formData.location,
        contactPhone: formData.contactPhone
      }

      onBraiderUpdated(updatedBraider)
      toast.success('Perfil da trancista atualizado com sucesso!')
      setOpen(false)
    } catch (error) {
      console.error('Error updating braider:', error)
      toast.error('Erro inesperado ao atualizar perfil')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Editar Perfil
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Editar Perfil da Trancista</DialogTitle>
          <DialogDescription>
            Atualize as informações da trancista. As alterações serão salvas imediatamente.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Digite o nome completo"
                required
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email de Contato</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Digite o email de contato"
                required
              />
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">Localização</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="Cidade, Estado/País"
                required
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone de Contato</Label>
              <Input
                id="phone"
                value={formData.contactPhone}
                onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                placeholder="(XX) XXXXX-XXXX"
              />
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio">Biografia</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Conte um pouco sobre sua experiência e especialidades..."
                rows={4}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Alterações'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}