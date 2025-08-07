"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { type Braider } from "@/lib/data-supabase"
import { User, Mail, Phone, MapPin, Edit3, Save, CheckCircle, AlertCircle, Camera, Briefcase, Star, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"
import Link from "next/link"

export default function BraiderProfileSettingsPage() {
  const { data: session, status } = useSession()
  const [braider, setBraider] = useState<Braider | undefined>(undefined)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  useEffect(() => {
    async function fetchBraiderProfile() {
      if (status === 'loading') return
      
      if (!session?.user?.id) {
        setMessage({ type: "error", text: "Sessão não encontrada. Faça login novamente." })
        setInitialLoading(false)
        return
      }

      try {
        console.log('🚀 Fetching braider profile from API...')
        
        // Pass the user email as a query parameter
        const email = encodeURIComponent(session.user.email || '')
        const response = await fetch(`/api/braiders/profile?email=${email}`)
        const result = await response.json()
        
        console.log('📦 API Response:', result.success ? 'Success' : 'Failed', result.message)
        
        if (result.success && result.data) {
          setBraider(result.data)
          console.log('✅ Braider profile loaded:', result.data.name)
        } else {
          // Only show critical errors, not "profile not found" messages
          if (result.message && !result.message.includes('não encontrado') && !result.message.includes('Usuário não encontrado')) {
            setMessage({ type: "error", text: "Erro técnico ao carregar perfil. Contacte o suporte se persistir." })
          } else {
            console.log('ℹ️ Profile loading issue, but handled gracefully')
          }
        }
      } catch (error) {
        console.error('❌ Error fetching braider profile:', error)
        setMessage({ type: "error", text: "Erro ao carregar perfil. Tente novamente." })
      } finally {
        setInitialLoading(false)
      }
    }

    fetchBraiderProfile()
  }, [session, status])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !session?.user?.email) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setMessage({ type: "error", text: "Tipo de arquivo não suportado. Use JPG, PNG ou WebP." })
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: "error", text: "Arquivo muito grande. Máximo 5MB." })
      return
    }

    setUploadingImage(true)
    setMessage(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('email', session.user.email)

      console.log('🖼️ Uploading profile image...')
      
      const response = await fetch('/api/upload-profile-image', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.success) {
        // Update braider state with new image URL
        if (braider) {
          setBraider({
            ...braider,
            profileImageUrl: result.imageUrl
          })
        }
        setMessage({ type: "success", text: result.message })
        console.log('✅ Profile image uploaded successfully')
      } else {
        setMessage({ type: "error", text: result.message })
        console.error('❌ Upload failed:', result.message)
      }
    } catch (error) {
      console.error('❌ Error uploading image:', error)
      setMessage({ type: "error", text: "Erro ao fazer upload da imagem." })
    } finally {
      setUploadingImage(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    if (braider) {
      setBraider({ ...braider, [id]: value })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    if (!braider) {
      setMessage({ type: "error", text: "Erro: Dados do perfil ausentes." })
      return
    }

    setLoading(true)
    try {
      console.log('🚀 Updating braider profile via API...')
      
      const response = await fetch('/api/braiders/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: braider.name,
          bio: braider.bio,
          location: braider.location,
          contactEmail: braider.contactEmail,
          contactPhone: braider.contactPhone,
          profileImageUrl: braider.profileImageUrl,
        }),
      })

      const result = await response.json()

      console.log('📦 Update API Response:', result.success ? 'Success' : 'Failed', result.message)

      if (result.success) {
        setMessage({ type: "success", text: result.message })
        console.log('✅ Profile updated successfully')
      } else {
        setMessage({ type: "error", text: result.message })
      }
    } catch (error) {
      console.error('❌ Error updating profile:', error)
      setMessage({ type: "error", text: "Erro inesperado ao atualizar perfil." })
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-accent-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-700">Carregando perfil...</p>
        </div>
      </div>
    )
  }

  if (!braider) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-accent-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-700">Carregando perfil...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-accent-500 to-accent-600 rounded-3xl p-8 text-white">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <User className="h-8 w-8" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold font-heading mb-2">
              Perfil da Trancista 👤
            </h1>
            <p className="text-white/90 text-lg">
              Gerencie suas informações pessoais e profissionais
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{braider?.services?.length || 0}</div>
            <div className="text-white/80">Serviços ativos</div>
          </div>
        </div>
      </div>

      {/* Profile Overview Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Star className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">4.8</div>
                <div className="text-gray-600 font-medium">Avaliação</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">24</div>
                <div className="text-gray-600 font-medium">Agendamentos</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Briefcase className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{braider?.services?.length || 0}</div>
                <div className="text-gray-600 font-medium">Serviços</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Profile Picture Card */}
        <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0">
          <CardHeader>
            <CardTitle className="text-xl font-bold font-heading text-gray-900 flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Foto de Perfil
            </CardTitle>
            <CardDescription>
              Sua foto aparece em todos os agendamentos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Image
                  src={braider?.profileImageUrl || "/placeholder.svg?height=120&width=120&text=T"}
                  alt={braider?.name || "Trancista"}
                  width={120}
                  height={120}
                  className="rounded-full object-cover border-4 border-white shadow-lg"
                  unoptimized={true}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = "/placeholder.svg?height=120&width=120&text=T"
                  }}
                />
                <div className="absolute -bottom-2 -right-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="profile-image-upload"
                    disabled={uploadingImage}
                  />
                  <label
                    htmlFor="profile-image-upload"
                    className={cn(
                      "w-8 h-8 bg-accent-500 rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:bg-accent-600 transition-colors",
                      uploadingImage && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {uploadingImage ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4 text-white" />
                    )}
                  </label>
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900">{braider?.name}</h3>
                <p className="text-gray-600 flex items-center gap-1 justify-center">
                  <MapPin className="h-4 w-4" />
                  {braider?.location}
                </p>
              </div>
              <Button 
                variant="outline" 
                className="w-full rounded-xl"
                onClick={() => document.getElementById('profile-image-upload')?.click()}
                disabled={uploadingImage}
              >
                <Camera className="h-4 w-4 mr-2" />
                {uploadingImage ? 'Enviando...' : 'Alterar Foto'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Profile Form */}
      <Card className="lg:col-span-2 bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0">
        <CardHeader>
          <CardTitle className="text-xl font-bold font-heading text-gray-900 flex items-center gap-2">
            <Edit3 className="h-5 w-5" />
            Informações Pessoais
          </CardTitle>
          <CardDescription>
            Atualize suas informações de contato e biografia
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {message && (
            <div
              className={cn(
                "p-4 rounded-xl text-center font-medium",
                message.type === "success" 
                  ? "bg-green-100 text-green-700 border border-green-200" 
                  : "bg-red-100 text-red-700 border border-red-200"
              )}
            >
              <div className="flex items-center justify-center gap-2">
                {message.type === "success" ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                {message.text}
              </div>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="name" className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Nome Completo
                </Label>
                <Input
                  id="name"
                  value={braider.name}
                  onChange={handleChange}
                  className="h-12 bg-gray-50 border-gray-200 rounded-xl focus:ring-accent-500 focus:border-accent-500"
                  placeholder="Digite seu nome completo"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="bio" className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <Edit3 className="h-4 w-4" />
                  Biografia
                </Label>
                <Textarea
                  id="bio"
                  value={braider.bio}
                  onChange={handleChange}
                  rows={4}
                  className="min-h-[120px] bg-gray-50 border-gray-200 rounded-xl focus:ring-accent-500 focus:border-accent-500 resize-none"
                  placeholder="Conte um pouco sobre você e sua experiência..."
                />
                <p className="text-sm text-gray-500">
                  {braider.bio.length}/500 caracteres
                </p>
              </div>
              <div className="space-y-3">
                <Label htmlFor="location" className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Localização
                </Label>
                <Input
                  id="location"
                  value={braider.location}
                  onChange={handleChange}
                  className="h-12 bg-gray-50 border-gray-200 rounded-xl focus:ring-accent-500 focus:border-accent-500"
                  placeholder="Ex: Lisboa, Portugal"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="contactEmail" className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email de Contato
                </Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={braider.contactEmail}
                  onChange={handleChange}
                  className="h-12 bg-gray-50 border-gray-200 rounded-xl focus:ring-accent-500 focus:border-accent-500"
                  placeholder="seu.email@exemplo.com"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="contactPhone" className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Telefone de Contato
                </Label>
                <Input
                  id="contactPhone"
                  type="tel"
                  value={braider.contactPhone}
                  onChange={handleChange}
                  className="h-12 bg-gray-50 border-gray-200 rounded-xl focus:ring-accent-500 focus:border-accent-500"
                  placeholder="+351 900 000 000"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white h-12 rounded-xl shadow-lg font-semibold"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Salvando...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Salvar Alterações
                  </div>
                )}
              </Button>
            </form>
        </CardContent>
      </Card>
      </div>

      {/* Services Quick Overview */}
      <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0">
        <CardHeader>
          <CardTitle className="text-xl font-bold font-heading text-gray-900 flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Meus Serviços
          </CardTitle>
          <CardDescription>
            Gerencie os serviços que você oferece
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {braider?.services?.slice(0, 3).map((service) => (
              <div key={service.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent-100 rounded-full flex items-center justify-center">
                    <Briefcase className="h-5 w-5 text-accent-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{service.name}</h4>
                    <p className="text-sm text-gray-600">{service.durationMinutes} min</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-accent-600">€{service.price}</div>
                  <Badge variant="secondary" className="text-xs">
                    Ativo
                  </Badge>
                </div>
              </div>
            ))}
            <Button asChild variant="outline" className="w-full rounded-xl">
              <Link href="/braider-dashboard/services">
                <Briefcase className="h-4 w-4 mr-2" />
                Gerenciar Todos os Serviços
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
