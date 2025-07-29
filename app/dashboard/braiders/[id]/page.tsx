"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { getBraiderById, updateBraiderStatus, toggleBraiderAccount, type Braider } from "@/lib/data-supabase"
import { EditBraiderForm } from "@/components/edit-braider-form"
import { toast } from "react-hot-toast"
import { 
  ArrowLeft, 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  Star,
  Award,
  Calendar,
  Package,
  Heart,
  MessageSquare,
  Euro,
  UserCheck,
  UserX,
  FileText,
  Camera,
  Briefcase,
  Shield,
  TrendingUp,
  Edit3,
  Send,
  RefreshCw
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function BraiderDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const braiderId = params.id as string
  const [braider, setBraider] = useState<Braider | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [isAccountActive, setIsAccountActive] = useState(true)

  useEffect(() => {
    const fetchBraider = async () => {
      if (!braiderId) {
        console.log('No braiderId provided')
        return
      }
      
      console.log('Fetching braider with ID:', braiderId)
      setLoading(true)
      try {
        const fetchedBraider = await getBraiderById(braiderId)
        console.log('Fetched braider:', fetchedBraider)
        setBraider(fetchedBraider)
        if (!fetchedBraider) {
          toast.error('Trancista não encontrada')
        }
      } catch (error) {
        console.error('Error fetching braider:', error)
        toast.error('Erro ao carregar dados da trancista')
      } finally {
        setLoading(false)
      }
    }

    fetchBraider()
  }, [braiderId])

  const handleUpdateStatus = async (newStatus: Braider["status"]) => {
    if (!braider) return

    setProcessing(true)
    try {
      const { success, error } = await updateBraiderStatus(braider.id, newStatus)
      if (success) {
        setBraider(prev => prev ? { ...prev, status: newStatus } : null)
        toast.success('Status da trancista atualizado com sucesso')
      } else {
        toast.error(error || 'Erro ao atualizar status da trancista')
      }
    } catch (error) {
      console.error('Error updating braider status:', error)
      toast.error('Erro inesperado ao atualizar status da trancista')
    } finally {
      setProcessing(false)
    }
  }

  const handleToggleAccount = async () => {
    if (!braider) return

    setProcessing(true)
    try {
      const { success, error, isActive } = await toggleBraiderAccount(braider.id)
      if (success) {
        setIsAccountActive(isActive!)
        toast.success(isActive ? 'Conta da trancista ativada com sucesso' : 'Conta da trancista desativada com sucesso')
      } else {
        toast.error(error || 'Erro ao alterar status da conta')
      }
    } catch (error) {
      console.error('Error toggling account:', error)
      toast.error('Erro inesperado ao alterar status da conta')
    } finally {
      setProcessing(false)
    }
  }

  const handleBraiderUpdated = (updatedBraider: Braider) => {
    setBraider(updatedBraider)
  }

  const getStatusIcon = (status: Braider["status"]) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-600" />
      case "rejected":
        return <XCircle className="h-5 w-5 text-red-600" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-600" />
    }
  }

  const getStatusBadgeClass = (status: Braider["status"]) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-700 border-green-200"
      case "pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-200"
      case "rejected":
        return "bg-red-100 text-red-700 border-red-200"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }

  const getStatusLabel = (status: Braider["status"]) => {
    switch (status) {
      case "approved": return "Aprovada"
      case "pending": return "Pendente"
      case "rejected": return "Rejeitada"
      default: return status
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-3xl mb-8"></div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="h-96 bg-gray-200 rounded-2xl"></div>
            <div className="h-96 bg-gray-200 rounded-2xl"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!braider) {
    return (
      <div className="space-y-8">
        <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0">
          <CardContent className="p-12 text-center">
            <AlertCircle className="h-16 w-16 mx-auto mb-4 text-red-500" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Trancista não encontrada</h2>
            <p className="text-gray-600 mb-6">A trancista com ID "{braiderId}" não existe ou foi removida.</p>
            <Button asChild variant="outline" className="rounded-xl">
              <Link href="/dashboard/braiders">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar às Trancistas
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-600 rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10 backdrop-blur-3xl"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-6">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
                className="w-12 h-12 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
              >
                <ArrowLeft className="h-6 w-6" />
              </Button>
              <div className="relative">
                <Image
                  src={braider.profileImageUrl || "/placeholder.svg?height=80&width=80&text=T"}
                  alt={braider.name}
                  width={80}
                  height={80}
                  className="rounded-full object-cover border-4 border-white/30 shadow-xl"
                  unoptimized={true}
                />
                <div className={cn(
                  "absolute -bottom-2 -right-2 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center",
                  braider.status === 'approved' && "bg-green-500",
                  braider.status === 'pending' && "bg-yellow-500",
                  braider.status === 'rejected' && "bg-red-500"
                )}>
                  {getStatusIcon(braider.status)}
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold font-heading mb-2">
                  {braider.name} 👩‍🦱
                </h1>
                <p className="text-white/90 text-lg">
                  Perfil completo da trancista
                </p>
                <p className="text-white/80 text-sm mt-1">
                  ID: {braider.id.split("-")[1]} • Cadastrada em {new Date(braider.createdAt).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
            <div className="text-right">
              <Badge variant="secondary" className={cn("text-lg px-4 py-2 mb-2", getStatusBadgeClass(braider.status))}>
                <span className="flex items-center gap-2">
                  {getStatusIcon(braider.status)}
                  {getStatusLabel(braider.status)}
                </span>
              </Badge>
              <div className="text-white/80 font-medium text-sm">Status Atual</div>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold">{braider.services?.length || 0}</div>
              <div className="text-white/80 text-sm">Serviços</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold">{braider.averageRating?.toFixed(1) || '0.0'}</div>
              <div className="text-white/80 text-sm">Avaliação</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold">127</div>
              <div className="text-white/80 text-sm">Clientes</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold">3.2k</div>
              <div className="text-white/80 text-sm">Seguidores</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Personal Information */}
          <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0">
            <CardHeader>
              <CardTitle className="text-xl font-bold font-heading text-gray-900 flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações Pessoais
              </CardTitle>
              <CardDescription>
                Dados de cadastro e contato da trancista
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl">
                  <Mail className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="font-semibold text-gray-900">{braider.contactEmail}</p>
                    <p className="text-sm text-gray-600">Email de contato</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl">
                  <Phone className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="font-semibold text-gray-900">{braider.contactPhone}</p>
                    <p className="text-sm text-gray-600">Telefone</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl">
                  <MapPin className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="font-semibold text-gray-900">{braider.location}</p>
                    <p className="text-sm text-gray-600">Localização</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl">
                  <Calendar className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="font-semibold text-gray-900">Há 2 anos</p>
                    <p className="text-sm text-gray-600">Experiência</p>
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Biografia
                </h4>
                <p className="text-gray-700 leading-relaxed">
                  {braider.bio || "Nenhuma biografia fornecida pela trancista."}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Services Offered */}
          <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0">
            <CardHeader>
              <CardTitle className="text-xl font-bold font-heading text-gray-900 flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Serviços Oferecidos
              </CardTitle>
              <CardDescription>
                Lista completa de serviços e preços praticados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {braider.services && braider.services.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {braider.services.map((service, index) => (
                    <div key={index} className="p-4 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl border border-gray-200">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-bold text-gray-900">{service.name}</h4>
                        <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200">
                          R$ {service.price.toFixed(2)}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{service.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {service.durationMinutes}min
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500 fill-current" />
                          4.9
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Briefcase className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-500">Nenhum serviço cadastrado</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Portfolio */}
          <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0">
            <CardHeader>
              <CardTitle className="text-xl font-bold font-heading text-gray-900 flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Portfólio
              </CardTitle>
              <CardDescription>
                Trabalhos realizados e galeria de fotos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {braider.portfolioImages && braider.portfolioImages.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-3">
                  {braider.portfolioImages.map((imageUrl, index) => (
                    <div key={index} className="relative aspect-square rounded-xl overflow-hidden group">
                      <Image
                        src={imageUrl}
                        alt={`Trabalho ${index + 1}`}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        unoptimized={true}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="absolute bottom-2 left-2 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <p className="text-sm font-semibold">Trabalho {index + 1}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Camera className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-500">Nenhuma imagem no portfólio</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0">
            <CardHeader>
              <CardTitle className="text-lg font-bold font-heading text-gray-900 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Estatísticas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-200">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  <span className="font-semibold text-gray-900">Avaliação</span>
                </div>
                <span className="text-xl font-bold text-green-600">{braider.averageRating?.toFixed(1) || '0.0'}/5</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-blue-600" />
                  <span className="font-semibold text-gray-900">Agendamentos</span>
                </div>
                <span className="text-xl font-bold text-blue-600">127</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl border border-purple-200">
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-purple-600" />
                  <span className="font-semibold text-gray-900">Favoritos</span>
                </div>
                <span className="text-xl font-bold text-purple-600">89</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-xl border border-orange-200">
                <div className="flex items-center gap-2">
                  <Euro className="h-4 w-4 text-orange-600" />
                  <span className="font-semibold text-gray-900">Receita</span>
                </div>
                <span className="text-xl font-bold text-orange-600">€2.8k</span>
              </div>
            </CardContent>
          </Card>

          {/* Approval Actions */}
          <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0">
            <CardHeader>
              <CardTitle className="text-lg font-bold font-heading text-gray-900 flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Ações de Aprovação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {braider.status === "pending" && (
                <>
                  <Button
                    onClick={() => handleUpdateStatus("approved")}
                    disabled={processing}
                    className="w-full bg-green-500 hover:bg-green-600 text-white rounded-xl h-12 font-semibold"
                  >
                    {processing ? (
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Aprovar Trancista
                  </Button>
                  <Button
                    onClick={() => handleUpdateStatus("rejected")}
                    disabled={processing}
                    variant="destructive"
                    className="w-full rounded-xl h-12 font-semibold"
                  >
                    {processing ? (
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <XCircle className="h-4 w-4 mr-2" />
                    )}
                    Rejeitar Solicitação
                  </Button>
                </>
              )}

              {braider.status === "rejected" && (
                <Button
                  onClick={() => handleUpdateStatus("approved")}
                  disabled={processing}
                  className="w-full bg-green-500 hover:bg-green-600 text-white rounded-xl h-12 font-semibold"
                >
                  {processing ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Reativar Trancista
                </Button>
              )}

              {braider.status === "approved" && (
                <Button
                  onClick={() => handleUpdateStatus("rejected")}
                  disabled={processing}
                  variant="outline"
                  className="w-full rounded-xl h-12 font-semibold hover:bg-red-50 hover:border-red-300 hover:text-red-600"
                >
                  {processing ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <UserX className="h-4 w-4 mr-2" />
                  )}
                  Desativar Trancista
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Account Management */}
          <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0">
            <CardHeader>
              <CardTitle className="text-lg font-bold font-heading text-gray-900 flex items-center gap-2">
                <User className="h-5 w-5" />
                Gestão da Conta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <EditBraiderForm 
                braider={braider}
                onBraiderUpdated={handleBraiderUpdated}
                trigger={
                  <Button variant="outline" className="w-full rounded-xl">
                    <Edit3 className="h-4 w-4 mr-2" />
                    Editar Perfil
                  </Button>
                }
              />
              
              <Button
                onClick={handleToggleAccount}
                disabled={processing}
                variant={isAccountActive ? "destructive" : "default"}
                className="w-full rounded-xl"
              >
                {processing ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : isAccountActive ? (
                  <UserX className="h-4 w-4 mr-2" />
                ) : (
                  <UserCheck className="h-4 w-4 mr-2" />
                )}
                {isAccountActive ? 'Desativar Conta' : 'Ativar Conta'}
              </Button>
            </CardContent>
          </Card>

          {/* Contact Actions */}
          <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0">
            <CardHeader>
              <CardTitle className="text-lg font-bold font-heading text-gray-900 flex items-center gap-2">
                <Send className="h-5 w-5" />
                Comunicação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full rounded-xl">
                <Mail className="h-4 w-4 mr-2" />
                Enviar Email
              </Button>
              
              <Button variant="outline" className="w-full rounded-xl">
                <MessageSquare className="h-4 w-4 mr-2" />
                Enviar Mensagem
              </Button>
              
              <Button variant="outline" className="w-full rounded-xl">
                <FileText className="h-4 w-4 mr-2" />
                Gerar Relatório
              </Button>
            </CardContent>
          </Card>

          {/* Navigation */}
          <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border-0">
            <CardHeader>
              <CardTitle className="text-lg font-bold font-heading text-gray-900">
                Navegação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild variant="outline" className="w-full rounded-xl">
                <Link href="/dashboard/braiders">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar à Lista
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="w-full rounded-xl">
                <Link href={`/braiders/${braider.id}`}>
                  <User className="h-4 w-4 mr-2" />
                  Ver Perfil Público
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
