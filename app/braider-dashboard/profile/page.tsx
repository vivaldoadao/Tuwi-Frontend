"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getBraiderById, updateBraiderProfile, type Braider } from "@/lib/data"
import { User, Mail, Phone, MapPin, Edit3, Save, CheckCircle, AlertCircle, Camera, Briefcase, Star, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"
import Link from "next/link"

export default function BraiderProfileSettingsPage() {
  // Simular que o braider-1 está logado
  const braiderId = "braider-1"
  const initialBraider = getBraiderById(braiderId)

  const [braider, setBraider] = useState<Braider | undefined>(initialBraider)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    // Em um cenário real, você buscaria o perfil da trancista logada aqui
    if (!initialBraider) {
      setMessage({ type: "error", text: "Perfil da trancista não encontrado." })
    }
  }, [initialBraider])

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
    const result = await updateBraiderProfile(braider.id, {
      name: braider.name,
      bio: braider.bio,
      location: braider.location,
      contactEmail: braider.contactEmail,
      contactPhone: braider.contactPhone,
      profileImageUrl: braider.profileImageUrl,
      // Não atualizamos serviços ou portfolioImages por aqui neste formulário simplificado
    })

    if (result.success) {
      setMessage({ type: "success", text: result.message })
    } else {
      setMessage({ type: "error", text: result.message })
    }
    setLoading(false)
  }

  if (!braider && !message) {
    return <p className="text-gray-700">Carregando perfil...</p>
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
            <div className="text-2xl font-bold">{braider?.services.length || 0}</div>
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
                <div className="text-2xl font-bold text-gray-900">{braider?.services.length || 0}</div>
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
                />
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-accent-500 rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:bg-accent-600 transition-colors">
                  <Camera className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900">{braider?.name}</h3>
                <p className="text-gray-600 flex items-center gap-1 justify-center">
                  <MapPin className="h-4 w-4" />
                  {braider?.location}
                </p>
              </div>
              <Button variant="outline" className="w-full rounded-xl">
                <Camera className="h-4 w-4 mr-2" />
                Alterar Foto
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
          {braider ? (
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
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
              <p className="text-red-500 font-medium">Não foi possível carregar o perfil da trancista.</p>
            </div>
          )}
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
            {braider?.services.slice(0, 3).map((service) => (
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
